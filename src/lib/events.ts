import crypto from 'crypto'
import { getDb } from './db'
import { logEvent } from './event-log'
import type { ProspectContact } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────

export type DinnerStatus = 'planning' | 'invitations_sent' | 'confirmed' | 'completed' | 'cancelled'
export type DinnerFormat = 'chatham_house' | 'panel' | 'roundtable' | 'fireside'
export type RSVPStatus = 'invited' | 'accepted' | 'declined' | 'tentative' | 'not_invited'
export type FollowUpStatus = 'pending' | 'sent' | 'responded' | 'meeting_booked'
export type EcosystemEventType = 'conference' | 'workshop' | 'summit' | 'roundtable'
export type GoodfireAction = 'attend' | 'speak' | 'host_side_event' | 'skip'

export interface DinnerInvitee {
  prospect_id: string
  contact: ProspectContact
  rsvp_status: RSVPStatus
  post_event_notes: string | null
  follow_up_status: FollowUpStatus
}

export interface DinnerEvent {
  id: string
  name: string
  cluster_id: string
  city: string
  venue: string | null
  date: string
  status: DinnerStatus
  budget_estimate: number
  format: DinnerFormat
  topic: string
  signal_id: string | null
  max_attendees: number
  goodfire_attendees: string[]
  invitees: DinnerInvitee[]
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateDinnerInput {
  name: string
  cluster_id: string
  city: string
  venue?: string | null
  date: string
  status?: DinnerStatus
  budget_estimate?: number
  format?: DinnerFormat
  topic: string
  signal_id?: string | null
  max_attendees?: number
  goodfire_attendees?: string[]
  invitees?: DinnerInvitee[]
  notes?: string | null
}

export interface EcosystemEvent {
  id: string
  name: string
  type: EcosystemEventType
  organizer: string
  date: string
  city: string
  estimated_attendees: number
  relevance_score: number
  target_buyers_present: string[]
  goodfire_action: GoodfireAction
  notes: string | null
}

// ─── Table Initialization ────────────────────────────────────────────

let _tableInitialized = false

function ensureDinnersTable(): void {
  if (_tableInitialized) return
  const db = getDb()
  db.prepare(
    `CREATE TABLE IF NOT EXISTS dinners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cluster_id TEXT,
      city TEXT NOT NULL,
      venue TEXT,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planning',
      budget_estimate INTEGER DEFAULT 10000,
      format TEXT DEFAULT 'chatham_house',
      topic TEXT NOT NULL,
      signal_id TEXT,
      max_attendees INTEGER DEFAULT 12,
      goodfire_attendees TEXT DEFAULT '[]',
      invitees TEXT DEFAULT '[]',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`
  ).run()
  _tableInitialized = true
}

// ─── Row Parser ──────────────────────────────────────────────────────

function parseDinnerRow(row: Record<string, unknown>): DinnerEvent {
  let invitees: DinnerInvitee[] = []
  try {
    invitees = JSON.parse(row['invitees'] as string) as DinnerInvitee[]
  } catch {
    invitees = []
  }

  let goodfireAttendees: string[] = []
  try {
    goodfireAttendees = JSON.parse(row['goodfire_attendees'] as string) as string[]
  } catch {
    goodfireAttendees = []
  }

  return {
    id: row['id'] as string,
    name: row['name'] as string,
    cluster_id: row['cluster_id'] as string,
    city: row['city'] as string,
    venue: (row['venue'] as string) ?? null,
    date: row['date'] as string,
    status: (row['status'] as DinnerStatus) ?? 'planning',
    budget_estimate: (row['budget_estimate'] as number) ?? 10000,
    format: (row['format'] as DinnerFormat) ?? 'chatham_house',
    topic: row['topic'] as string,
    signal_id: (row['signal_id'] as string) ?? null,
    max_attendees: (row['max_attendees'] as number) ?? 12,
    goodfire_attendees: goodfireAttendees,
    invitees,
    notes: (row['notes'] as string) ?? null,
    created_at: (row['created_at'] as string) ?? new Date().toISOString(),
    updated_at: (row['updated_at'] as string) ?? new Date().toISOString(),
  }
}

// ─── CRUD Operations ─────────────────────────────────────────────────

export function createDinner(data: CreateDinnerInput): DinnerEvent {
  ensureDinnersTable()
  const db = getDb()
  const id = `dnr_${crypto.randomUUID().slice(0, 8)}`
  const status = data.status ?? 'planning'
  const budgetEstimate = data.budget_estimate ?? 10000
  const format = data.format ?? 'chatham_house'
  const maxAttendees = data.max_attendees ?? 12
  const goodfireAttendees = JSON.stringify(data.goodfire_attendees ?? [])
  const invitees = JSON.stringify(data.invitees ?? [])

  db.prepare(
    `INSERT INTO dinners (id, name, cluster_id, city, venue, date, status, budget_estimate, format, topic, signal_id, max_attendees, goodfire_attendees, invitees, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, data.name, data.cluster_id, data.city, data.venue ?? null,
    data.date, status, budgetEstimate, format, data.topic,
    data.signal_id ?? null, maxAttendees, goodfireAttendees, invitees,
    data.notes ?? null
  )

  logEvent({
    eventType: 'meeting.booked',
    entityType: 'dinner',
    entityId: id,
    payload: { name: data.name, cluster_id: data.cluster_id, city: data.city, date: data.date },
  })

  return getDinnerById(id) as DinnerEvent
}

export function getAllDinners(): DinnerEvent[] {
  ensureDinnersTable()
  const db = getDb()
  const rows = db.prepare('SELECT * FROM dinners ORDER BY date DESC').all() as Record<string, unknown>[]
  return rows.map(parseDinnerRow)
}

export function getDinnerById(id: string): DinnerEvent | null {
  ensureDinnersTable()
  const db = getDb()
  const row = db.prepare('SELECT * FROM dinners WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return null
  return parseDinnerRow(row)
}

export function updateDinner(id: string, data: Partial<DinnerEvent>): DinnerEvent | null {
  ensureDinnersTable()
  const db = getDb()

  const existing = db.prepare('SELECT id FROM dinners WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) return null

  const sets: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) {
    sets.push('name = ?')
    values.push(data.name)
  }
  if (data.cluster_id !== undefined) {
    sets.push('cluster_id = ?')
    values.push(data.cluster_id)
  }
  if (data.city !== undefined) {
    sets.push('city = ?')
    values.push(data.city)
  }
  if (data.venue !== undefined) {
    sets.push('venue = ?')
    values.push(data.venue)
  }
  if (data.date !== undefined) {
    sets.push('date = ?')
    values.push(data.date)
  }
  if (data.status !== undefined) {
    sets.push('status = ?')
    values.push(data.status)
  }
  if (data.budget_estimate !== undefined) {
    sets.push('budget_estimate = ?')
    values.push(data.budget_estimate)
  }
  if (data.format !== undefined) {
    sets.push('format = ?')
    values.push(data.format)
  }
  if (data.topic !== undefined) {
    sets.push('topic = ?')
    values.push(data.topic)
  }
  if (data.signal_id !== undefined) {
    sets.push('signal_id = ?')
    values.push(data.signal_id)
  }
  if (data.max_attendees !== undefined) {
    sets.push('max_attendees = ?')
    values.push(data.max_attendees)
  }
  if (data.goodfire_attendees !== undefined) {
    sets.push('goodfire_attendees = ?')
    values.push(JSON.stringify(data.goodfire_attendees))
  }
  if (data.invitees !== undefined) {
    sets.push('invitees = ?')
    values.push(JSON.stringify(data.invitees))
  }
  if (data.notes !== undefined) {
    sets.push('notes = ?')
    values.push(data.notes)
  }

  if (sets.length === 0) return getDinnerById(id)

  sets.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE dinners SET ${sets.join(', ')} WHERE id = ?`).run(...values)

  return getDinnerById(id)
}

export function updateInviteeRSVP(dinnerId: string, prospectId: string, status: RSVPStatus): DinnerEvent | null {
  ensureDinnersTable()
  const db = getDb()

  const dinner = getDinnerById(dinnerId)
  if (!dinner) return null

  const updatedInvitees = dinner.invitees.map((inv) => {
    if (inv.prospect_id === prospectId) {
      return { ...inv, rsvp_status: status }
    }
    return inv
  })

  db.prepare(
    "UPDATE dinners SET invitees = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(JSON.stringify(updatedInvitees), dinnerId)

  logEvent({
    eventType: 'outreach.response',
    entityType: 'dinner',
    entityId: dinnerId,
    payload: { prospectId, rsvp_status: status, dinnerName: dinner.name },
  })

  return getDinnerById(dinnerId)
}

export function addPostEventNotes(dinnerId: string, prospectId: string, notes: string): DinnerEvent | null {
  ensureDinnersTable()
  const db = getDb()

  const dinner = getDinnerById(dinnerId)
  if (!dinner) return null

  const updatedInvitees = dinner.invitees.map((inv) => {
    if (inv.prospect_id === prospectId) {
      return { ...inv, post_event_notes: notes }
    }
    return inv
  })

  db.prepare(
    "UPDATE dinners SET invitees = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(JSON.stringify(updatedInvitees), dinnerId)

  return getDinnerById(dinnerId)
}

// ─── Ecosystem Events (hardcoded) ────────────────────────────────────

export function getEcosystemEvents(): EcosystemEvent[] {
  return [
    {
      id: 'eco_001',
      name: 'AISI AI Safety Evaluator Convening',
      type: 'workshop',
      organizer: 'UK AI Safety Institute',
      date: '2026-05-18',
      city: 'London',
      estimated_attendees: 80,
      relevance_score: 92,
      target_buyers_present: [
        'Head of AI Safety, major UK banks',
        'Chief Risk Officer, Lloyd\'s syndicates',
        'VP Model Governance, European insurers',
      ],
      goodfire_action: 'speak',
      notes: 'High relevance — direct alignment with Goodfire SAE evaluation capabilities. Apply for speaking slot on model transparency.',
    },
    {
      id: 'eco_002',
      name: 'ECB Supervisory Technology Conference',
      type: 'conference',
      organizer: 'European Central Bank',
      date: '2026-06-09',
      city: 'Frankfurt',
      estimated_attendees: 100,
      relevance_score: 88,
      target_buyers_present: [
        'Head of AI/ML, Tier 1 European banks',
        'Chief Compliance Officer, systemically important financial institutions',
        'Director of Model Risk, BaFin-regulated institutions',
      ],
      goodfire_action: 'attend',
      notes: 'Key audience for model risk management positioning. Attend and schedule side meetings with target buyers.',
    },
    {
      id: 'eco_003',
      name: 'Financial Stability Board AI Workshop',
      type: 'workshop',
      organizer: 'Financial Stability Board',
      date: '2026-07-14',
      city: 'Basel',
      estimated_attendees: 50,
      relevance_score: 85,
      target_buyers_present: [
        'Senior regulators from G20 central banks',
        'Head of Supervisory Policy, major international banks',
      ],
      goodfire_action: 'attend',
      notes: 'Small, high-signal workshop. Invitation-only — leverage existing regulator relationships.',
    },
    {
      id: 'eco_004',
      name: 'NeurIPS 2026 Interpretability Workshop',
      type: 'workshop',
      organizer: 'NeurIPS Foundation',
      date: '2026-12-07',
      city: 'Vancouver',
      estimated_attendees: 200,
      relevance_score: 95,
      target_buyers_present: [
        'ML Research leads, FAANG companies',
        'AI Safety researchers, major labs',
        'Academic interpretability researchers',
      ],
      goodfire_action: 'speak',
      notes: 'Core research venue. Submit paper on SAE-based model auditing results. Critical for research credibility.',
    },
    {
      id: 'eco_005',
      name: 'NIH AI in Healthcare Summit',
      type: 'summit',
      organizer: 'National Institutes of Health',
      date: '2026-09-22',
      city: 'Bethesda',
      estimated_attendees: 120,
      relevance_score: 78,
      target_buyers_present: [
        'Chief Medical Information Officer, major health systems',
        'VP AI/ML, pharmaceutical companies',
        'Director of Clinical AI, academic medical centers',
      ],
      goodfire_action: 'attend',
      notes: 'Healthcare vertical expansion opportunity. Focus on clinical decision support model transparency.',
    },
    {
      id: 'eco_006',
      name: 'Money20/20 Europe',
      type: 'conference',
      organizer: 'Money20/20',
      date: '2026-06-02',
      city: 'Amsterdam',
      estimated_attendees: 5000,
      relevance_score: 45,
      target_buyers_present: [
        'Fintech CTOs broadly',
        'Head of Innovation, retail banks',
      ],
      goodfire_action: 'skip',
      notes: 'High volume, low signal. Consider side dinner instead of booth.',
    },
    {
      id: 'eco_007',
      name: 'AI Safety Summit 2026',
      type: 'summit',
      organizer: 'French Government / GPAI',
      date: '2026-10-15',
      city: 'Paris',
      estimated_attendees: 150,
      relevance_score: 90,
      target_buyers_present: [
        'AI policy leads, EU member state governments',
        'Chief AI Officer, Fortune 500 companies',
        'Head of Responsible AI, major tech companies',
      ],
      goodfire_action: 'host_side_event',
      notes: 'Premier policy event. Host executive dinner on eve of summit for key enterprise buyers.',
    },
  ]
}
