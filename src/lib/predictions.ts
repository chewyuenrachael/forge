import crypto from 'crypto'
import { getDb } from '@/lib/db'
import { logEvent } from '@/lib/event-log'
import type { Prediction } from '@/types'
import type { PredictionOutcome } from '@/lib/constants'

// ─── Types ───────────────────────────────────────────────────────────

export interface PredictionFilterOptions {
  engagementId?: string
  outcome?: PredictionOutcome
  modelFamilyId?: string
}

export interface CreatePredictionInput {
  engagementId: string
  description: string
  methodology: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  confidence: 'high' | 'medium' | 'low'
  modelFamilyId?: string
}

export interface RecordOutcomeInput {
  outcome: 'confirmed' | 'refuted'
  outcomeNotes?: string
  outcomeDate?: string
}

export interface PredictionAccuracyReport {
  total: number
  confirmed: number
  refuted: number
  untested: number
  overallAccuracy: number
  bySeverity: { severity: string; accuracy: number; count: number }[]
  byModelFamily: { modelFamilyId: string; accuracy: number; count: number }[]
  byEngagement: { engagementId: string; partnerName: string; accuracy: number; total: number; confirmed: number }[]
  sampleSize: number
  confidenceNote: string
}

// ─── Helpers ─────────────────────────────────────────────────────────

const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const
const VALID_CONFIDENCES = ['high', 'medium', 'low'] as const

function parsePredictionRow(row: Record<string, unknown>): Prediction {
  return {
    id: row['id'] as string,
    engagement_id: row['engagement_id'] as string,
    description: row['description'] as string,
    methodology: row['methodology'] as string,
    severity: row['severity'] as Prediction['severity'],
    confidence: row['confidence'] as Prediction['confidence'],
    outcome: row['outcome'] as PredictionOutcome,
    outcome_notes: (row['outcome_notes'] as string) ?? null,
    outcome_date: (row['outcome_date'] as string) ?? null,
    model_family_id: (row['model_family_id'] as string) ?? null,
    created_at: (row['created_at'] as string) ?? new Date().toISOString(),
    updated_at: (row['updated_at'] as string) ?? new Date().toISOString(),
  }
}

// ─── READ ────────────────────────────────────────────────────────────

export function getAllPredictions(options?: PredictionFilterOptions): Prediction[] {
  const db = getDb()
  const conditions: string[] = []
  const params: unknown[] = []

  if (options?.engagementId) {
    conditions.push('engagement_id = ?')
    params.push(options.engagementId)
  }
  if (options?.outcome) {
    conditions.push('outcome = ?')
    params.push(options.outcome)
  }
  if (options?.modelFamilyId) {
    conditions.push('model_family_id = ?')
    params.push(options.modelFamilyId)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db.prepare(
    `SELECT * FROM predictions ${where} ORDER BY created_at DESC`
  ).all(...params) as Record<string, unknown>[]

  return rows.map(parsePredictionRow)
}

export function getPredictionById(id: string): Prediction | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM predictions WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return null
  return parsePredictionRow(row)
}

export function getPredictionsByEngagement(engagementId: string): Prediction[] {
  const db = getDb()
  const rows = db.prepare(
    `SELECT * FROM predictions WHERE engagement_id = ?
     ORDER BY
       CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
       CASE confidence WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END`
  ).all(engagementId) as Record<string, unknown>[]

  return rows.map(parsePredictionRow)
}

// ─── CREATE ──────────────────────────────────────────────────────────

export function createPrediction(data: CreatePredictionInput): Prediction {
  if (!data.description.trim()) {
    throw new Error('description must not be empty')
  }
  if (data.description.length > 5000) {
    throw new Error('description must be 5000 characters or fewer')
  }
  if (!VALID_SEVERITIES.includes(data.severity as typeof VALID_SEVERITIES[number])) {
    throw new Error('Invalid severity value')
  }
  if (!VALID_CONFIDENCES.includes(data.confidence as typeof VALID_CONFIDENCES[number])) {
    throw new Error('Invalid confidence value')
  }

  const db = getDb()

  // Validate engagement exists
  const eng = db.prepare('SELECT id FROM engagements WHERE id = ?').get(data.engagementId) as { id: string } | undefined
  if (!eng) {
    throw new Error('Engagement not found')
  }

  const id = `pred_${crypto.randomUUID().slice(0, 8)}`

  db.prepare(
    `INSERT INTO predictions (id, engagement_id, description, methodology, severity, confidence, model_family_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, data.engagementId, data.description.trim(), data.methodology.trim(), data.severity, data.confidence, data.modelFamilyId ?? null)

  logEvent({
    eventType: 'prediction.created',
    entityType: 'prediction',
    entityId: id,
    payload: { engagementId: data.engagementId, severity: data.severity, confidence: data.confidence },
  })

  return getPredictionById(id) as Prediction
}

// ─── UPDATE ──────────────────────────────────────────────────────────

export function recordPredictionOutcome(id: string, data: RecordOutcomeInput): Prediction | null {
  if (data.outcome !== 'confirmed' && data.outcome !== 'refuted') {
    throw new Error('outcome must be "confirmed" or "refuted"')
  }

  const db = getDb()
  const existing = db.prepare('SELECT id, outcome FROM predictions WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) return null

  const outcomeDate = data.outcomeDate ?? new Date().toISOString().slice(0, 10)

  db.prepare(
    `UPDATE predictions SET outcome = ?, outcome_notes = ?, outcome_date = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(data.outcome, data.outcomeNotes ?? null, outcomeDate, id)

  logEvent({
    eventType: 'prediction.outcome_recorded',
    entityType: 'prediction',
    entityId: id,
    payload: { outcome: data.outcome, outcomeNotes: data.outcomeNotes ?? null },
  })

  return getPredictionById(id)
}

// ─── ACCURACY ANALYTICS ─────────────────────────────────────────────

export function getPredictionAccuracy(): PredictionAccuracyReport {
  const db = getDb()

  // Overall counts
  const outcomeRows = db.prepare(
    'SELECT outcome, COUNT(*) as count FROM predictions GROUP BY outcome'
  ).all() as Record<string, unknown>[]

  let total = 0
  let confirmed = 0
  let refuted = 0
  let untested = 0

  for (const row of outcomeRows) {
    const count = row['count'] as number
    total += count
    switch (row['outcome'] as string) {
      case 'confirmed': confirmed = count; break
      case 'refuted': refuted = count; break
      case 'untested': untested = count; break
    }
  }

  const sampleSize = confirmed + refuted
  const overallAccuracy = sampleSize > 0 ? Math.round(confirmed / sampleSize * 100) : 0

  // By severity
  const severityRows = db.prepare(
    `SELECT severity, outcome, COUNT(*) as count FROM predictions
     WHERE outcome != 'untested' GROUP BY severity, outcome`
  ).all() as Record<string, unknown>[]

  const severityMap = new Map<string, { confirmed: number; total: number }>()
  for (const row of severityRows) {
    const sev = row['severity'] as string
    const count = row['count'] as number
    if (!severityMap.has(sev)) severityMap.set(sev, { confirmed: 0, total: 0 })
    const entry = severityMap.get(sev)!
    entry.total += count
    if (row['outcome'] === 'confirmed') entry.confirmed += count
  }

  const bySeverity = Array.from(severityMap).map(([severity, data]) => ({
    severity,
    accuracy: data.total > 0 ? Math.round(data.confirmed / data.total * 100) : 0,
    count: data.total,
  }))

  // By model family
  const modelRows = db.prepare(
    `SELECT model_family_id, outcome, COUNT(*) as count FROM predictions
     WHERE outcome != 'untested' AND model_family_id IS NOT NULL
     GROUP BY model_family_id, outcome`
  ).all() as Record<string, unknown>[]

  const modelMap = new Map<string, { confirmed: number; total: number }>()
  for (const row of modelRows) {
    const mfId = row['model_family_id'] as string
    const count = row['count'] as number
    if (!modelMap.has(mfId)) modelMap.set(mfId, { confirmed: 0, total: 0 })
    const entry = modelMap.get(mfId)!
    entry.total += count
    if (row['outcome'] === 'confirmed') entry.confirmed += count
  }

  const byModelFamily = Array.from(modelMap).map(([modelFamilyId, data]) => ({
    modelFamilyId,
    accuracy: data.total > 0 ? Math.round(data.confirmed / data.total * 100) : 0,
    count: data.total,
  }))

  // By engagement (join for partner_name)
  const engRows = db.prepare(
    `SELECT p.engagement_id, e.partner_name, p.outcome, COUNT(*) as count
     FROM predictions p
     JOIN engagements e ON e.id = p.engagement_id
     WHERE p.outcome != 'untested'
     GROUP BY p.engagement_id, e.partner_name, p.outcome`
  ).all() as Record<string, unknown>[]

  const engMap = new Map<string, { partnerName: string; confirmed: number; total: number }>()
  for (const row of engRows) {
    const engId = row['engagement_id'] as string
    const count = row['count'] as number
    if (!engMap.has(engId)) {
      engMap.set(engId, { partnerName: row['partner_name'] as string, confirmed: 0, total: 0 })
    }
    const entry = engMap.get(engId)!
    entry.total += count
    if (row['outcome'] === 'confirmed') entry.confirmed += count
  }

  const byEngagement = Array.from(engMap).map(([engagementId, data]) => ({
    engagementId,
    partnerName: data.partnerName,
    accuracy: data.total > 0 ? Math.round(data.confirmed / data.total * 100) : 0,
    total: data.total,
    confirmed: data.confirmed,
  }))

  // Confidence note
  let confidenceNote: string
  if (sampleSize < 5) {
    confidenceNote = 'Insufficient data for accuracy calculation'
  } else if (sampleSize < 20) {
    confidenceNote = 'Low confidence — more data needed'
  } else {
    confidenceNote = 'Sufficient sample size for accuracy calculation'
  }

  return {
    total,
    confirmed,
    refuted,
    untested,
    overallAccuracy,
    bySeverity,
    byModelFamily,
    byEngagement,
    sampleSize,
    confidenceNote,
  }
}
