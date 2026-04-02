import { getDb } from '@/lib/db'
import type { Capability, Evidence } from '@/types'

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

export function getAllCapabilities(): Capability[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM capabilities ORDER BY date DESC').all() as Record<string, unknown>[]
  return rows.map(parseCapability)
}

export function getCapabilityById(id: string): Capability | undefined {
  const db = getDb()
  const row = db.prepare('SELECT * FROM capabilities WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? parseCapability(row) : undefined
}

export function searchCapabilities(query: string): Capability[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT * FROM capabilities WHERE name LIKE ? OR description LIKE ? OR paper_title LIKE ? ORDER BY date DESC'
  ).all(`%${query}%`, `%${query}%`, `%${query}%`) as Record<string, unknown>[]
  return rows.map(parseCapability)
}

export function getCapabilitiesByReadiness(readiness: Capability['readiness']): Capability[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM capabilities WHERE readiness = ? ORDER BY date DESC').all(readiness) as Record<string, unknown>[]
  return rows.map(parseCapability)
}

export function getCapabilityStats(): { total: number; production: number; demo: number; research: number } {
  const db = getDb()
  const total = (db.prepare('SELECT COUNT(*) as count FROM capabilities').get() as { count: number }).count
  const production = (db.prepare("SELECT COUNT(*) as count FROM capabilities WHERE readiness = 'production'").get() as { count: number }).count
  const demo = (db.prepare("SELECT COUNT(*) as count FROM capabilities WHERE readiness = 'demo'").get() as { count: number }).count
  const research = (db.prepare("SELECT COUNT(*) as count FROM capabilities WHERE readiness = 'research'").get() as { count: number }).count
  return { total, production, demo, research }
}

export function getResearchTimeline(): Capability[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM capabilities ORDER BY date ASC').all() as Record<string, unknown>[]
  return rows.map(parseCapability)
}

export function getPartnerEngagements(): Capability[] {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM capabilities WHERE partners != '[]' ORDER BY date DESC").all() as Record<string, unknown>[]
  return rows.map(parseCapability)
}

export function getEvidenceForCapability(capabilityId: string): Evidence[] {
  const db = getDb()
  return db.prepare('SELECT * FROM evidence WHERE capability_id = ?').all(capabilityId) as Evidence[]
}
