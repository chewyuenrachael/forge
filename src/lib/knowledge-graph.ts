import { getDb } from '@/lib/db'
import { MAX_SEARCH_LENGTH } from '@/lib/constants'
import type { Capability, Engagement, Milestone, ContentCalendarItem, Evidence } from '@/types'

function parseCapability(row: Record<string, unknown>): Capability {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    paper_title: row['paper_title'] as string,
    authors: row['authors'] as string,
    date: row['date'] as string,
    type: row['type'] as Capability['type'],
    description: row['description'] as string,
    key_results: JSON.parse(row['key_results'] as string) as string[],
    partner_solution: row['partner_solution'] as string,
    readiness: row['readiness'] as Capability['readiness'],
    model_families: JSON.parse(row['model_families'] as string) as string[],
    partners: JSON.parse(row['partners'] as string) as string[],
  }
}

function parseEngagement(row: Record<string, unknown>): Engagement {
  return {
    id: row['id'] as string,
    partner_name: row['partner_name'] as string,
    status: row['status'] as Engagement['status'],
    capabilities_applied: JSON.parse(row['capabilities_applied'] as string) as string[],
    start_date: row['start_date'] as string,
    health_score: row['health_score'] as number,
    milestones: JSON.parse(row['milestones'] as string) as Milestone[],
  }
}

export function getAllCapabilities(): Capability[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM capabilities ORDER BY date DESC').all() as Record<string, unknown>[]
  return rows.map(parseCapability)
}

export function getCapabilityById(id: string): Capability | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM capabilities WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? parseCapability(row) : null
}

export function searchCapabilities(query: string): Capability[] {
  const trimmed = query.slice(0, MAX_SEARCH_LENGTH)
  const db = getDb()
  const pattern = `%${trimmed}%`
  const rows = db.prepare(
    'SELECT * FROM capabilities WHERE name LIKE ? OR description LIKE ? OR paper_title LIKE ? OR key_results LIKE ? ORDER BY date DESC'
  ).all(pattern, pattern, pattern, pattern) as Record<string, unknown>[]
  return rows.map(parseCapability)
}

export function getCapabilitiesByReadiness(readiness: Capability['readiness']): Capability[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM capabilities WHERE readiness = ? ORDER BY date DESC').all(readiness) as Record<string, unknown>[]
  return rows.map(parseCapability)
}

export function getCapabilitiesByAudience(painPoints: string[]): Capability[] {
  if (painPoints.length === 0) return []
  const db = getDb()
  const conditions = painPoints.map(() => 'partner_solution LIKE ?').join(' OR ')
  const params = painPoints.map((p) => `%${p}%`)
  const rows = db.prepare(
    `SELECT * FROM capabilities WHERE ${conditions} ORDER BY date DESC`
  ).all(...params) as Record<string, unknown>[]
  return rows.map(parseCapability)
}

export function getCapabilityStats(): { total: number; production: number; demo: number; research: number; partnerCount: number } {
  const db = getDb()
  const total = (db.prepare('SELECT COUNT(*) as count FROM capabilities').get() as { count: number }).count
  const production = (db.prepare("SELECT COUNT(*) as count FROM capabilities WHERE readiness = 'production'").get() as { count: number }).count
  const demo = (db.prepare("SELECT COUNT(*) as count FROM capabilities WHERE readiness = 'demo'").get() as { count: number }).count
  const research = (db.prepare("SELECT COUNT(*) as count FROM capabilities WHERE readiness = 'research'").get() as { count: number }).count

  const partnerSet = new Set<string>()
  const capRows = db.prepare("SELECT partners FROM capabilities WHERE partners != '[]'").all() as { partners: string }[]
  for (const row of capRows) {
    const partners = JSON.parse(row.partners) as string[]
    for (const p of partners) {
      partnerSet.add(p)
    }
  }
  const engRows = db.prepare('SELECT DISTINCT partner_name FROM engagements').all() as { partner_name: string }[]
  for (const row of engRows) {
    partnerSet.add(row.partner_name)
  }

  return { total, production, demo, research, partnerCount: partnerSet.size }
}

export function getResearchTimeline(): Capability[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM capabilities ORDER BY date DESC').all() as Record<string, unknown>[]
  return rows.map(parseCapability)
}

export function getPartnerEngagements(): Engagement[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM engagements ORDER BY start_date DESC').all() as Record<string, unknown>[]
  return rows.map(parseEngagement)
}

export function getContentCalendar(): ContentCalendarItem[] {
  const db = getDb()
  return db.prepare('SELECT * FROM content_calendar ORDER BY date ASC').all() as ContentCalendarItem[]
}

export function getEvidenceForCapability(capabilityId: string): Evidence[] {
  const db = getDb()
  return db.prepare('SELECT * FROM evidence WHERE capability_id = ?').all(capabilityId) as Evidence[]
}
