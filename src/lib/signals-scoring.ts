import crypto from 'crypto'
import { getDb, parseJsonArray } from '@/lib/db'
import { DEFAULT_ACTIONABILITY_WEIGHTS } from '@/lib/constants'
import { logEvent } from '@/lib/event-log'
import type { Signal, ActionabilityWeights } from '@/types'
import type { SignalType, FeedbackValue } from '@/lib/constants'

// ─── Types ───────────────────────────────────────────────────────────

export interface SignalFilterOptions {
  type?: SignalType
  status?: string
  minActionability?: number
}

export interface CreateSignalInput {
  type: SignalType
  title: string
  description: string
  source: string
  source_url?: string
  date: string
  relevance_score: number
  urgency_score: number
  coverage_score: number
  novelty_score?: number
  matched_capability_ids?: string[]
  matched_prospect_ids?: string[]
  suggested_action?: string
  narrative_angle?: string
  peer_cluster_ids?: string[]
}

export interface SignalQualityReportItem {
  signalType: SignalType
  totalCount: number
  positiveCount: number
  negativeCount: number
  qualityScore: number
}

// ─── Helpers ─────────────────────────────────────────────────────────

const VALID_STATUSES = ['active', 'acted_on', 'archived', 'dismissed'] as const
const VALID_SIGNAL_TYPES = ['regulatory', 'competitor', 'prospect', 'conference', 'research', 'incident'] as const

function parseSignalRow(row: Record<string, unknown>): Signal {
  return {
    id: row['id'] as string,
    type: row['type'] as SignalType,
    title: row['title'] as string,
    description: row['description'] as string,
    source: row['source'] as string,
    source_url: (row['source_url'] as string) ?? null,
    date: row['date'] as string,
    relevance_score: row['relevance_score'] as number,
    urgency_score: row['urgency_score'] as number,
    coverage_score: row['coverage_score'] as number,
    novelty_score: row['novelty_score'] as number,
    actionability_score: row['actionability_score'] as number,
    matched_capability_ids: parseJsonArray(row['matched_capability_ids'] as string),
    matched_prospect_ids: parseJsonArray(row['matched_prospect_ids'] as string),
    suggested_action: (row['suggested_action'] as string) ?? '',
    narrative_angle: (row['narrative_angle'] as string) ?? '',
    peer_cluster_ids: parseJsonArray(row['peer_cluster_ids'] as string),
    status: row['status'] as Signal['status'],
    feedback: (row['feedback'] as FeedbackValue) ?? null,
    created_at: row['created_at'] as string,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ─── READ ────────────────────────────────────────────────────────────

export function getAllSignals(options?: SignalFilterOptions): Signal[] {
  const db = getDb()
  const conditions: string[] = []
  const params: unknown[] = []

  if (options?.type) {
    conditions.push('type = ?')
    params.push(options.type)
  }
  if (options?.status) {
    conditions.push('status = ?')
    params.push(options.status)
  }
  if (options?.minActionability !== undefined) {
    conditions.push('actionability_score >= ?')
    params.push(options.minActionability)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db.prepare(
    `SELECT * FROM signals ${where} ORDER BY actionability_score DESC, date DESC`
  ).all(...params) as Record<string, unknown>[]

  return rows.map(parseSignalRow)
}

export function getSignalById(id: string): Signal | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM signals WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return null
  return parseSignalRow(row)
}

// ─── CREATE ──────────────────────────────────────────────────────────

export function createSignal(data: CreateSignalInput): Signal {
  const title = data.title.trim()
  if (!title || title.length > 500) {
    throw new Error('title must be 1-500 characters')
  }
  if (!VALID_SIGNAL_TYPES.includes(data.type as typeof VALID_SIGNAL_TYPES[number])) {
    throw new Error('Invalid signal type')
  }

  const db = getDb()
  const id = `sig_${crypto.randomUUID().slice(0, 8)}`
  const noveltyScore = data.novelty_score ?? 100

  const actionabilityScore = calculateActionability({
    relevance_score: data.relevance_score,
    urgency_score: data.urgency_score,
    coverage_score: data.coverage_score,
    novelty_score: noveltyScore,
  })

  db.prepare(
    `INSERT INTO signals (
      id, type, title, description, source, source_url, date,
      relevance_score, urgency_score, coverage_score, novelty_score, actionability_score,
      matched_capability_ids, matched_prospect_ids, suggested_action, narrative_angle,
      peer_cluster_ids, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`
  ).run(
    id, data.type, title, data.description, data.source, data.source_url ?? null, data.date,
    data.relevance_score, data.urgency_score, data.coverage_score, noveltyScore, actionabilityScore,
    JSON.stringify(data.matched_capability_ids ?? []),
    JSON.stringify(data.matched_prospect_ids ?? []),
    data.suggested_action ?? '',
    data.narrative_angle ?? '',
    JSON.stringify(data.peer_cluster_ids ?? []),
  )

  logEvent({
    eventType: 'signal.detected',
    entityType: 'signal',
    entityId: id,
    payload: { type: data.type, title },
  })

  return getSignalById(id) as Signal
}

// ─── ACTIONABILITY SCORING ───────────────────────────────────────────

export function calculateActionability(
  signal: { relevance_score: number; urgency_score: number; coverage_score: number; novelty_score: number },
  weights?: ActionabilityWeights
): number {
  const w = weights ?? getActionabilityWeights()
  const score = signal.relevance_score * w.relevance
    + signal.urgency_score * w.urgency
    + signal.coverage_score * w.coverage
    + signal.novelty_score * w.novelty
  return clamp(Math.round(score), 0, 100)
}

export function recalculateAllActionability(): void {
  const db = getDb()
  const weights = getActionabilityWeights()
  const rows = db.prepare(
    'SELECT id, relevance_score, urgency_score, coverage_score, novelty_score FROM signals'
  ).all() as Record<string, unknown>[]

  const update = db.prepare('UPDATE signals SET actionability_score = ? WHERE id = ?')
  const runAll = db.transaction(() => {
    for (const row of rows) {
      const score = calculateActionability({
        relevance_score: row['relevance_score'] as number,
        urgency_score: row['urgency_score'] as number,
        coverage_score: row['coverage_score'] as number,
        novelty_score: row['novelty_score'] as number,
      }, weights)
      update.run(score, row['id'] as string)
    }
  })
  runAll()
}

// ─── STATUS & FEEDBACK ───────────────────────────────────────────────

export function updateSignalStatus(
  id: string,
  status: 'active' | 'acted_on' | 'archived' | 'dismissed'
): Signal | null {
  if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    throw new Error('Invalid signal status')
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM signals WHERE id = ?').get(id) as { id: string } | undefined
  if (!existing) return null

  db.prepare('UPDATE signals SET status = ? WHERE id = ?').run(status, id)

  if (status === 'archived' || status === 'dismissed') {
    logEvent({
      eventType: 'signal.archived',
      entityType: 'signal',
      entityId: id,
      payload: { status },
    })
  }

  return getSignalById(id)
}

export function submitSignalFeedback(id: string, feedback: FeedbackValue): Signal | null {
  if (feedback !== 'positive' && feedback !== 'negative') {
    throw new Error('feedback must be "positive" or "negative"')
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM signals WHERE id = ?').get(id) as { id: string } | undefined
  if (!existing) return null

  db.prepare('UPDATE signals SET feedback = ? WHERE id = ?').run(feedback, id)

  logEvent({
    eventType: 'signal.feedback',
    entityType: 'signal',
    entityId: id,
    payload: { feedback },
  })

  return getSignalById(id)
}

// ─── WEIGHTS ─────────────────────────────────────────────────────────

export function getActionabilityWeights(): ActionabilityWeights {
  const db = getDb()
  const row = db.prepare(
    "SELECT relevance, urgency, coverage, novelty FROM actionability_weights WHERE id = 'default'"
  ).get() as Record<string, unknown> | undefined

  if (!row) {
    return { ...DEFAULT_ACTIONABILITY_WEIGHTS }
  }

  return {
    relevance: row['relevance'] as number,
    urgency: row['urgency'] as number,
    coverage: row['coverage'] as number,
    novelty: row['novelty'] as number,
  }
}

export function updateActionabilityWeights(weights: ActionabilityWeights): ActionabilityWeights {
  if (weights.relevance < 0 || weights.urgency < 0 || weights.coverage < 0 || weights.novelty < 0) {
    throw new Error('All weights must be >= 0')
  }
  if (weights.relevance > 1 || weights.urgency > 1 || weights.coverage > 1 || weights.novelty > 1) {
    throw new Error('All weights must be <= 1')
  }

  const sum = weights.relevance + weights.urgency + weights.coverage + weights.novelty
  if (Math.abs(sum - 1.0) > 0.05) {
    throw new Error(`Weights must sum to approximately 1.0 (got ${sum.toFixed(3)})`)
  }

  const db = getDb()
  db.prepare(
    `INSERT OR REPLACE INTO actionability_weights (id, relevance, urgency, coverage, novelty, updated_at)
     VALUES ('default', ?, ?, ?, ?, datetime('now'))`
  ).run(weights.relevance, weights.urgency, weights.coverage, weights.novelty)

  recalculateAllActionability()

  return { ...weights }
}

// ─── DECAY ───────────────────────────────────────────────────────────

export function decayUrgencyScores(): number {
  const db = getDb()
  const now = Date.now()
  const MS_PER_DAY = 86_400_000

  const rows = db.prepare(
    "SELECT id, date, urgency_score FROM signals WHERE status = 'active'"
  ).all() as Record<string, unknown>[]

  const weights = getActionabilityWeights()
  let decayedCount = 0

  const updateUrgency = db.prepare('UPDATE signals SET urgency_score = ?, actionability_score = ? WHERE id = ?')

  const runAll = db.transaction(() => {
    for (const row of rows) {
      const signalDate = new Date(row['date'] as string).getTime()
      const ageDays = (now - signalDate) / MS_PER_DAY
      const currentUrgency = row['urgency_score'] as number

      let decay = 0
      if (ageDays > 14) {
        decay = 45 // 10 + 15 + 20
      } else if (ageDays > 7) {
        decay = 25 // 10 + 15
      } else if (ageDays > 3) {
        decay = 10
      }

      if (decay === 0) continue

      const newUrgency = Math.max(0, currentUrgency - decay)
      if (newUrgency === currentUrgency) continue

      // Recalculate actionability with decayed urgency
      const fullRow = db.prepare(
        'SELECT relevance_score, coverage_score, novelty_score FROM signals WHERE id = ?'
      ).get(row['id'] as string) as Record<string, unknown>

      const newActionability = calculateActionability({
        relevance_score: fullRow['relevance_score'] as number,
        urgency_score: newUrgency,
        coverage_score: fullRow['coverage_score'] as number,
        novelty_score: fullRow['novelty_score'] as number,
      }, weights)

      updateUrgency.run(newUrgency, newActionability, row['id'] as string)
      decayedCount++
    }
  })

  runAll()
  return decayedCount
}

// ─── QUALITY REPORT ──────────────────────────────────────────────────

export function getSignalQualityReport(): SignalQualityReportItem[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT type, feedback, COUNT(*) as count FROM signals GROUP BY type, feedback'
  ).all() as Record<string, unknown>[]

  const byType = new Map<string, { total: number; positive: number; negative: number }>()

  for (const row of rows) {
    const type = row['type'] as string
    const feedback = row['feedback'] as string | null
    const count = row['count'] as number

    if (!byType.has(type)) {
      byType.set(type, { total: 0, positive: 0, negative: 0 })
    }
    const entry = byType.get(type)!
    entry.total += count
    if (feedback === 'positive') entry.positive += count
    if (feedback === 'negative') entry.negative += count
  }

  const report: SignalQualityReportItem[] = []
  for (const [type, data] of Array.from(byType)) {
    const feedbackTotal = data.positive + data.negative
    report.push({
      signalType: type as SignalType,
      totalCount: data.total,
      positiveCount: data.positive,
      negativeCount: data.negative,
      qualityScore: feedbackTotal > 0 ? Math.round(data.positive / feedbackTotal * 100) : 0,
    })
  }

  return report
}
