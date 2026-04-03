import crypto from 'crypto'
import { getDb } from '@/lib/db'
import { MAX_INPUT_LENGTH } from '@/lib/constants'
import type { Engagement, Milestone, CreateEngagementInput, UpdateEngagementInput, CreateMilestoneInput, UpdateMilestoneInput } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────

const VALID_ENG_STATUSES = ['active', 'completed', 'proposed', 'paused'] as const
const VALID_MS_STATUSES = ['completed', 'in_progress', 'upcoming', 'blocked'] as const
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidISODate(s: string): boolean {
  return ISO_DATE_RE.test(s) && !isNaN(new Date(s).getTime())
}

function parseEngagementRow(row: Record<string, unknown>, milestones: Milestone[]): Engagement {
  return {
    id: row['id'] as string,
    partner_name: row['partner_name'] as string,
    status: row['status'] as Engagement['status'],
    capabilities_applied: JSON.parse(row['capabilities_applied'] as string) as string[],
    start_date: row['start_date'] as string,
    end_date: (row['end_date'] as string) ?? null,
    health_score: row['health_score'] as number,
    notes: (row['notes'] as string) ?? null,
    created_at: (row['created_at'] as string) ?? new Date().toISOString(),
    updated_at: (row['updated_at'] as string) ?? new Date().toISOString(),
    milestones,
  }
}

function parseMilestoneRow(row: Record<string, unknown>): Milestone {
  return {
    id: row['id'] as string,
    engagement_id: row['engagement_id'] as string,
    title: row['title'] as string,
    status: row['status'] as Milestone['status'],
    due_date: row['due_date'] as string,
    completed_date: (row['completed_date'] as string) ?? null,
    notes: (row['notes'] as string) ?? null,
    sort_order: (row['sort_order'] as number) ?? 0,
    created_at: (row['created_at'] as string) ?? new Date().toISOString(),
    updated_at: (row['updated_at'] as string) ?? new Date().toISOString(),
  }
}

function loadMilestonesForEngagement(engagementId: string): Milestone[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT * FROM milestones WHERE engagement_id = ? ORDER BY sort_order ASC'
  ).all(engagementId) as Record<string, unknown>[]
  return rows.map(parseMilestoneRow)
}

// ─── READ ─────────────────────────────────────────────────────────────

export function getAllEngagements(): Engagement[] {
  const db = getDb()
  const rows = db.prepare(
    `SELECT * FROM engagements ORDER BY
      CASE status WHEN 'active' THEN 0 WHEN 'proposed' THEN 1 WHEN 'paused' THEN 2 WHEN 'completed' THEN 3 END,
      start_date DESC`
  ).all() as Record<string, unknown>[]
  return rows.map((row) => {
    const milestones = loadMilestonesForEngagement(row['id'] as string)
    return parseEngagementRow(row, milestones)
  })
}

export function getEngagementById(id: string): Engagement | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM engagements WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return null
  const milestones = loadMilestonesForEngagement(id)
  return parseEngagementRow(row, milestones)
}

export function getMilestonesByEngagement(engagementId: string): Milestone[] {
  return loadMilestonesForEngagement(engagementId)
}

// ─── CREATE ───────────────────────────────────────────────────────────

export function createEngagement(data: CreateEngagementInput): Engagement {
  const name = data.partner_name.trim()
  if (!name || name.length > MAX_INPUT_LENGTH) {
    throw new Error('partner_name must be 1-500 characters')
  }
  if (!VALID_ENG_STATUSES.includes(data.status as typeof VALID_ENG_STATUSES[number])) {
    throw new Error('Invalid engagement status')
  }
  if (!isValidISODate(data.start_date)) {
    throw new Error('start_date must be a valid ISO date (YYYY-MM-DD)')
  }
  if (data.end_date !== undefined && !isValidISODate(data.end_date)) {
    throw new Error('end_date must be a valid ISO date (YYYY-MM-DD)')
  }
  if (data.end_date && data.end_date < data.start_date) {
    throw new Error('end_date must be on or after start_date')
  }

  const db = getDb()
  const id = `eng_${crypto.randomUUID().slice(0, 8)}`
  const capsJson = JSON.stringify(data.capabilities_applied)

  db.prepare(
    `INSERT INTO engagements (id, partner_name, status, capabilities_applied, start_date, end_date, health_score, notes)
     VALUES (?, ?, ?, ?, ?, ?, 75, ?)`
  ).run(id, name, data.status, capsJson, data.start_date, data.end_date ?? null, data.notes ?? null)

  return getEngagementById(id) as Engagement
}

export function createMilestone(data: CreateMilestoneInput): Milestone {
  const db = getDb()

  // Verify engagement exists
  const eng = db.prepare('SELECT id FROM engagements WHERE id = ?').get(data.engagement_id) as { id: string } | undefined
  if (!eng) {
    throw new Error('Engagement not found')
  }

  const title = data.title.trim()
  if (!title || title.length > MAX_INPUT_LENGTH) {
    throw new Error('title must be 1-500 characters')
  }
  if (!VALID_MS_STATUSES.includes(data.status as typeof VALID_MS_STATUSES[number])) {
    throw new Error('Invalid milestone status')
  }
  if (!isValidISODate(data.due_date)) {
    throw new Error('due_date must be a valid ISO date (YYYY-MM-DD)')
  }

  const id = `ms_${crypto.randomUUID().slice(0, 8)}`
  const maxOrder = (db.prepare(
    'SELECT MAX(sort_order) as max_order FROM milestones WHERE engagement_id = ?'
  ).get(data.engagement_id) as { max_order: number | null }).max_order ?? -1
  const completedDate = data.status === 'completed' ? data.due_date : null

  db.prepare(
    `INSERT INTO milestones (id, engagement_id, title, status, due_date, completed_date, notes, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, data.engagement_id, title, data.status, data.due_date, completedDate, data.notes ?? null, maxOrder + 1)

  updateEngagementHealthScore(data.engagement_id)

  const row = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id) as Record<string, unknown>
  return parseMilestoneRow(row)
}

// ─── UPDATE ───────────────────────────────────────────────────────────

export function updateEngagement(id: string, data: UpdateEngagementInput): Engagement | null {
  const db = getDb()

  const existing = db.prepare('SELECT * FROM engagements WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) return null

  const sets: string[] = []
  const values: unknown[] = []

  if (data.partner_name !== undefined) {
    const name = data.partner_name.trim()
    if (!name || name.length > MAX_INPUT_LENGTH) throw new Error('partner_name must be 1-500 characters')
    sets.push('partner_name = ?')
    values.push(name)
  }
  if (data.status !== undefined) {
    if (!VALID_ENG_STATUSES.includes(data.status as typeof VALID_ENG_STATUSES[number])) throw new Error('Invalid engagement status')
    sets.push('status = ?')
    values.push(data.status)
  }
  if (data.capabilities_applied !== undefined) {
    sets.push('capabilities_applied = ?')
    values.push(JSON.stringify(data.capabilities_applied))
  }
  if (data.start_date !== undefined) {
    if (!isValidISODate(data.start_date)) throw new Error('start_date must be a valid ISO date')
    sets.push('start_date = ?')
    values.push(data.start_date)
  }
  if (data.end_date !== undefined) {
    if (data.end_date !== null && !isValidISODate(data.end_date)) throw new Error('end_date must be a valid ISO date')
    sets.push('end_date = ?')
    values.push(data.end_date)
  }
  if (data.health_score !== undefined) {
    if (data.health_score < 0 || data.health_score > 100) throw new Error('health_score must be 0-100')
    sets.push('health_score = ?')
    values.push(data.health_score)
  }
  if (data.notes !== undefined) {
    sets.push('notes = ?')
    values.push(data.notes)
  }

  if (sets.length === 0) {
    return getEngagementById(id)
  }

  sets.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE engagements SET ${sets.join(', ')} WHERE id = ?`).run(...values)

  // If status changed, recalculate health score
  if (data.status !== undefined) {
    updateEngagementHealthScore(id)
  }

  return getEngagementById(id)
}

export function updateMilestone(id: string, data: UpdateMilestoneInput): Milestone | null {
  const db = getDb()

  const existing = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) return null

  const oldStatus = existing['status'] as string
  const sets: string[] = []
  const values: unknown[] = []

  if (data.title !== undefined) {
    const title = data.title.trim()
    if (!title || title.length > MAX_INPUT_LENGTH) throw new Error('title must be 1-500 characters')
    sets.push('title = ?')
    values.push(title)
  }
  if (data.due_date !== undefined) {
    if (!isValidISODate(data.due_date)) throw new Error('due_date must be a valid ISO date')
    sets.push('due_date = ?')
    values.push(data.due_date)
  }
  if (data.sort_order !== undefined) {
    sets.push('sort_order = ?')
    values.push(data.sort_order)
  }
  if (data.notes !== undefined) {
    sets.push('notes = ?')
    values.push(data.notes)
  }

  // Handle status and completed_date together
  if (data.status !== undefined) {
    if (!VALID_MS_STATUSES.includes(data.status as typeof VALID_MS_STATUSES[number])) throw new Error('Invalid milestone status')
    sets.push('status = ?')
    values.push(data.status)

    if (data.status === 'completed' && oldStatus !== 'completed') {
      // Auto-set completed_date if not explicitly provided
      const completedDate = data.completed_date !== undefined ? data.completed_date : new Date().toISOString().slice(0, 10)
      sets.push('completed_date = ?')
      values.push(completedDate)
    } else if (data.status !== 'completed' && oldStatus === 'completed') {
      // Clear completed_date when moving away from completed
      sets.push('completed_date = ?')
      values.push(null)
    }
  } else if (data.completed_date !== undefined) {
    sets.push('completed_date = ?')
    values.push(data.completed_date)
  }

  if (sets.length === 0) {
    return parseMilestoneRow(existing)
  }

  sets.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE milestones SET ${sets.join(', ')} WHERE id = ?`).run(...values)

  const engagementId = existing['engagement_id'] as string
  updateEngagementHealthScore(engagementId)

  const updated = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id) as Record<string, unknown>
  return parseMilestoneRow(updated)
}

export function updateEngagementHealthScore(id: string): number {
  const db = getDb()
  const milestones = db.prepare('SELECT * FROM milestones WHERE engagement_id = ?').all(id) as Record<string, unknown>[]

  let score = 70
  const today = new Date().toISOString().slice(0, 10)

  let completedCount = 0
  let overdueCount = 0
  let blockedCount = 0

  for (const ms of milestones) {
    const status = ms['status'] as string
    const dueDate = ms['due_date'] as string

    if (status === 'completed') {
      completedCount++
    } else if (status === 'blocked') {
      blockedCount++
    } else if (dueDate < today) {
      overdueCount++
    }
  }

  score += Math.min(completedCount * 5, 20)
  score -= Math.min(overdueCount * 10, 30)
  score -= blockedCount * 15

  if (milestones.length > 0 && completedCount === milestones.length) {
    score += 10
  }

  score = Math.max(0, Math.min(100, score))

  db.prepare('UPDATE engagements SET health_score = ?, updated_at = datetime(?) WHERE id = ?')
    .run(score, 'now', id)

  return score
}

// ─── DELETE ───────────────────────────────────────────────────────────

export function deleteEngagement(id: string): boolean {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM engagements WHERE id = ?').get(id) as { id: string } | undefined
  if (!existing) return false

  db.prepare('DELETE FROM milestones WHERE engagement_id = ?').run(id)
  db.prepare('DELETE FROM engagements WHERE id = ?').run(id)
  return true
}

export function deleteMilestone(id: string): boolean {
  const db = getDb()
  const existing = db.prepare('SELECT engagement_id FROM milestones WHERE id = ?').get(id) as { engagement_id: string } | undefined
  if (!existing) return false

  db.prepare('DELETE FROM milestones WHERE id = ?').run(id)
  updateEngagementHealthScore(existing.engagement_id)
  return true
}
