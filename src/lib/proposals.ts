import crypto from 'crypto'
import { getDb } from './db'
import { logEvent } from './event-log'
import type { SavedProposal, SavedProposalSummary, IntakeFormData, SolutionMatch, SolutionSimulation } from '@/types'
import type { EngagementTier } from '@/lib/constants'

// ─── Types ───────────────────────────────────────────────────────────

interface SaveProposalInput {
  partner_name: string
  intake_data: IntakeFormData
  matches: SolutionMatch[]
  simulation: SolutionSimulation
  engagement_tier?: EngagementTier
  total_value?: number
}

// ─── CREATE ──────────────────────────────────────────────────────────

/**
 * Save a new proposal with intake data, capability matches, and simulation.
 * Generates a unique ID and formatted title. Logs the creation event.
 * @param data - The proposal input data
 * @returns The saved proposal
 */
export function saveProposal(data: SaveProposalInput): SavedProposal {
  const db = getDb()
  const id = `prop_${crypto.randomUUID().slice(0, 8)}`
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  const title = `${data.partner_name} — ${dateStr}`
  const engagementTier = data.engagement_tier ?? 'standard'
  const totalValue = data.total_value ?? 0

  db.prepare(
    `INSERT INTO proposals (id, partner_name, title, intake_data, matches, simulation, engagement_tier, total_value)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.partner_name,
    title,
    JSON.stringify(data.intake_data),
    JSON.stringify(data.matches),
    JSON.stringify(data.simulation),
    engagementTier,
    totalValue
  )

  logEvent({
    eventType: 'proposal.saved',
    entityType: 'proposal',
    entityId: id,
    payload: { partnerName: data.partner_name, engagementTier, totalValue },
  })

  return getProposalById(id) as SavedProposal
}

// ─── READ ────────────────────────────────────────────────────────────

/**
 * Retrieve all proposals as summaries (without full JSON payload).
 * Ordered by most recently created first.
 * @returns Array of proposal summaries
 */
export function getAllProposals(): SavedProposalSummary[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT id, partner_name, title, created_at, matches FROM proposals ORDER BY created_at DESC'
  ).all() as Array<{ id: string; partner_name: string; title: string; created_at: string; matches: string }>

  return rows.map((row) => ({
    id: row.id,
    partner_name: row.partner_name,
    title: row.title,
    created_at: row.created_at,
    match_count: (JSON.parse(row.matches) as unknown[]).length,
  }))
}

/**
 * Retrieve a single proposal by ID with all parsed JSON fields.
 * @param id - The proposal ID
 * @returns The full proposal, or null if not found
 */
export function getProposalById(id: string): SavedProposal | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM proposals WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return null

  return {
    id: row['id'] as string,
    partner_name: row['partner_name'] as string,
    title: (row['title'] as string) ?? '',
    intake_data: JSON.parse(row['intake_data'] as string) as IntakeFormData,
    matches: JSON.parse(row['matches'] as string) as SolutionMatch[],
    simulation: JSON.parse(row['simulation'] as string) as SolutionSimulation,
    engagement_tier: (row['engagement_tier'] as SavedProposal['engagement_tier']) ?? 'standard',
    total_value: (row['total_value'] as number) ?? 0,
    created_at: row['created_at'] as string,
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────

/**
 * Delete a proposal by ID. Logs the deletion event before removing.
 * @param id - The proposal ID
 * @returns true if deleted, false if not found
 */
export function deleteProposal(id: string): boolean {
  const db = getDb()
  const existing = db.prepare('SELECT id, partner_name FROM proposals WHERE id = ?').get(id) as { id: string; partner_name: string } | undefined

  if (!existing) return false

  logEvent({
    eventType: 'proposal.saved',
    entityType: 'proposal',
    entityId: id,
    payload: { action: 'deleted', partnerName: existing.partner_name },
  })

  const result = db.prepare('DELETE FROM proposals WHERE id = ?').run(id)
  return result.changes > 0
}
