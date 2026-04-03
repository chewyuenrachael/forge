import crypto from 'crypto'
import { getDb } from '@/lib/db'
import type { SavedProposal, SavedProposalSummary, IntakeFormData, SolutionMatch, SolutionSimulation } from '@/types'

interface SaveProposalInput {
  partner_name: string
  intake_data: IntakeFormData
  matches: SolutionMatch[]
  simulation: SolutionSimulation
}

export function saveProposal(data: SaveProposalInput): SavedProposal {
  const db = getDb()
  const id = `prop_${crypto.randomUUID().slice(0, 8)}`
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  const title = `${data.partner_name} — ${dateStr}`

  db.prepare(
    `INSERT INTO proposals (id, partner_name, intake_data, matches, simulation, title)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.partner_name,
    JSON.stringify(data.intake_data),
    JSON.stringify(data.matches),
    JSON.stringify(data.simulation),
    title
  )

  return getProposalById(id) as SavedProposal
}

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

export function getProposalById(id: string): SavedProposal | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM proposals WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return null

  return {
    id: row['id'] as string,
    partner_name: row['partner_name'] as string,
    intake_data: JSON.parse(row['intake_data'] as string) as IntakeFormData,
    matches: JSON.parse(row['matches'] as string) as SolutionMatch[],
    simulation: JSON.parse(row['simulation'] as string) as SolutionSimulation,
    created_at: row['created_at'] as string,
    title: row['title'] as string,
  }
}

export function deleteProposal(id: string): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM proposals WHERE id = ?').run(id)
  return result.changes > 0
}
