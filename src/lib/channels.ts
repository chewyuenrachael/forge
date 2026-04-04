import crypto from 'crypto'
import { getDb } from './db'
import { logEvent } from './event-log'
import { MAX_INPUT_LENGTH } from '@/lib/constants'
import type { ChannelPartner, ProspectContact } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────

const VALID_TYPES = ['big_four', 'consulting', 'systems_integrator', 'platform'] as const
const VALID_STATUSES = ['cold', 'warm_intro', 'active_conversation', 'partnership_signed', 'certified'] as const
const ACTIVE_STATUSES = ['active_conversation', 'partnership_signed', 'certified'] as const

function parsePrimaryContact(raw: string | null | undefined): ProspectContact | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed['name']) return null
    return {
      name: parsed['name'] as string,
      title: (parsed['title'] as string) ?? '',
      email: (parsed['email'] as string) ?? null,
      linkedin_url: (parsed['linkedin_url'] as string) ?? null,
      persona: (parsed['persona'] as ProspectContact['persona']) ?? 'executive',
      is_champion: (parsed['is_champion'] as boolean) ?? false,
    }
  } catch {
    return null
  }
}

function parseChannelPartnerRow(row: Record<string, unknown>): ChannelPartner {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    type: row['type'] as ChannelPartner['type'],
    relationship_status: row['relationship_status'] as ChannelPartner['relationship_status'],
    primary_contact: parsePrimaryContact(row['primary_contact'] as string),
    client_portfolio_overlap: (row['client_portfolio_overlap'] as number) ?? 0,
    estimated_annual_revenue: (row['estimated_annual_revenue'] as number) ?? 0,
    certified_engineers: (row['certified_engineers'] as number) ?? 0,
    engagements_sourced: (row['engagements_sourced'] as number) ?? 0,
    notes: (row['notes'] as string) ?? null,
    created_at: (row['created_at'] as string) ?? new Date().toISOString(),
    updated_at: (row['updated_at'] as string) ?? new Date().toISOString(),
  }
}

// ─── READ ────────────────────────────────────────────────────────────

/**
 * Retrieve all channel partners, ordered by estimated annual revenue descending.
 */
export function getAllChannelPartners(): ChannelPartner[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT * FROM channel_partners ORDER BY estimated_annual_revenue DESC'
  ).all() as Record<string, unknown>[]
  return rows.map(parseChannelPartnerRow)
}

/**
 * Retrieve a single channel partner by ID.
 * @returns The channel partner, or null if not found
 */
export function getChannelPartnerById(id: string): ChannelPartner | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM channel_partners WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? parseChannelPartnerRow(row) : null
}

// ─── CREATE ──────────────────────────────────────────────────────────

/**
 * Create a new channel partner with validation.
 * Logs a channel_partner.status_changed event on creation.
 */
export function createChannelPartner(data: Omit<ChannelPartner, 'id' | 'created_at' | 'updated_at' | 'engagements_sourced'>): ChannelPartner {
  const name = data.name.trim()
  if (!name || name.length > MAX_INPUT_LENGTH) {
    throw new Error('name must be 1-500 characters')
  }
  if (!(VALID_TYPES as readonly string[]).includes(data.type)) {
    throw new Error('Invalid channel partner type')
  }
  if (!(VALID_STATUSES as readonly string[]).includes(data.relationship_status)) {
    throw new Error('Invalid relationship status')
  }

  const db = getDb()
  const id = `cp_${crypto.randomUUID().slice(0, 8)}`
  const contactJson = data.primary_contact ? JSON.stringify(data.primary_contact) : '{}'

  db.prepare(
    `INSERT INTO channel_partners (id, name, type, relationship_status, primary_contact, client_portfolio_overlap, estimated_annual_revenue, certified_engineers, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    name,
    data.type,
    data.relationship_status,
    contactJson,
    data.client_portfolio_overlap,
    data.estimated_annual_revenue,
    data.certified_engineers,
    data.notes ?? null,
  )

  logEvent({
    eventType: 'channel_partner.status_changed',
    entityType: 'channel_partner',
    entityId: id,
    payload: { name, status: data.relationship_status, action: 'created' },
  })

  return getChannelPartnerById(id) as ChannelPartner
}

// ─── UPDATE ──────────────────────────────────────────────────────────

/**
 * Update an existing channel partner with partial data.
 * Logs a status_changed event if relationship_status changes.
 * @returns The updated partner, or null if not found
 */
export function updateChannelPartner(id: string, data: Partial<ChannelPartner>): ChannelPartner | null {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM channel_partners WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) return null

  const sets: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) {
    const name = data.name.trim()
    if (!name || name.length > MAX_INPUT_LENGTH) throw new Error('name must be 1-500 characters')
    sets.push('name = ?')
    values.push(name)
  }
  if (data.type !== undefined) {
    if (!(VALID_TYPES as readonly string[]).includes(data.type)) throw new Error('Invalid channel partner type')
    sets.push('type = ?')
    values.push(data.type)
  }
  if (data.relationship_status !== undefined) {
    if (!(VALID_STATUSES as readonly string[]).includes(data.relationship_status)) throw new Error('Invalid relationship status')
    sets.push('relationship_status = ?')
    values.push(data.relationship_status)
  }
  if (data.primary_contact !== undefined) {
    sets.push('primary_contact = ?')
    values.push(data.primary_contact ? JSON.stringify(data.primary_contact) : '{}')
  }
  if (data.client_portfolio_overlap !== undefined) {
    sets.push('client_portfolio_overlap = ?')
    values.push(data.client_portfolio_overlap)
  }
  if (data.estimated_annual_revenue !== undefined) {
    sets.push('estimated_annual_revenue = ?')
    values.push(data.estimated_annual_revenue)
  }
  if (data.certified_engineers !== undefined) {
    sets.push('certified_engineers = ?')
    values.push(data.certified_engineers)
  }
  if (data.engagements_sourced !== undefined) {
    sets.push('engagements_sourced = ?')
    values.push(data.engagements_sourced)
  }
  if (data.notes !== undefined) {
    sets.push('notes = ?')
    values.push(data.notes)
  }

  if (sets.length === 0) {
    return getChannelPartnerById(id)
  }

  sets.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE channel_partners SET ${sets.join(', ')} WHERE id = ?`).run(...values)

  // Log status change
  if (data.relationship_status !== undefined && data.relationship_status !== existing['relationship_status']) {
    logEvent({
      eventType: 'channel_partner.status_changed',
      entityType: 'channel_partner',
      entityId: id,
      payload: {
        from: existing['relationship_status'] as string,
        to: data.relationship_status,
        name: (data.name ?? existing['name']) as string,
      },
    })
  }

  return getChannelPartnerById(id)
}

// ─── DELETE ──────────────────────────────────────────────────────────

/**
 * Delete a channel partner.
 * @returns true if deleted, false if not found
 */
export function deleteChannelPartner(id: string): boolean {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM channel_partners WHERE id = ?').get(id) as { id: string } | undefined
  if (!existing) return false
  db.prepare('DELETE FROM channel_partners WHERE id = ?').run(id)
  return true
}

// ─── Metrics ─────────────────────────────────────────────────────────

/**
 * Aggregate channel partner metrics for the Operations dashboard.
 */
export function getChannelMetrics(): {
  totalPartners: number
  activePartners: number
  totalEstimatedRevenue: number
  totalCertifiedEngineers: number
  totalEngagementsSources: number
  clientPortfolioReach: number
  byStatus: { status: string; count: number }[]
} {
  const db = getDb()

  const totalRow = db.prepare(
    'SELECT COUNT(*) as count FROM channel_partners'
  ).get() as { count: number }

  const activeStatuses = ACTIVE_STATUSES.map(() => '?').join(', ')
  const activeRow = db.prepare(
    `SELECT COUNT(*) as count FROM channel_partners WHERE relationship_status IN (${activeStatuses})`
  ).get(...ACTIVE_STATUSES) as { count: number }

  const sumsRow = db.prepare(
    `SELECT
       COALESCE(SUM(estimated_annual_revenue), 0) as total_revenue,
       COALESCE(SUM(certified_engineers), 0) as total_engineers,
       COALESCE(SUM(engagements_sourced), 0) as total_engagements,
       COALESCE(SUM(client_portfolio_overlap), 0) as total_overlap
     FROM channel_partners`
  ).get() as { total_revenue: number; total_engineers: number; total_engagements: number; total_overlap: number }

  const statusRows = db.prepare(
    'SELECT relationship_status as status, COUNT(*) as count FROM channel_partners GROUP BY relationship_status'
  ).all() as { status: string; count: number }[]

  return {
    totalPartners: totalRow.count,
    activePartners: activeRow.count,
    totalEstimatedRevenue: sumsRow.total_revenue,
    totalCertifiedEngineers: sumsRow.total_engineers,
    totalEngagementsSources: sumsRow.total_engagements,
    clientPortfolioReach: sumsRow.total_overlap,
    byStatus: statusRows,
  }
}
