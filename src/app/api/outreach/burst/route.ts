import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded, getDb, parseJsonArray } from '@/lib/db'
import { getAllCapabilities, getAllCustomerCategories } from '@/lib/knowledge-graph'
import { generateBurstOutreach } from '@/lib/outreach'
import { MAX_INPUT_LENGTH } from '@/lib/constants'
import type { Prospect, Signal, ProspectContact, OutreachRecord } from '@/types'

// ─── Row Parsers ───────────────────────────────────────────────────────

function parseProspectRow(row: Record<string, unknown>): Prospect {
  let contacts: ProspectContact[] = []
  try { contacts = JSON.parse(row['contacts'] as string) as ProspectContact[] } catch { contacts = [] }
  let outreachHistory: OutreachRecord[] = []
  try { outreachHistory = JSON.parse(row['outreach_history'] as string) as OutreachRecord[] } catch { outreachHistory = [] }

  return {
    id: row['id'] as string,
    name: row['name'] as string,
    industry: row['industry'] as string,
    customer_category: row['customer_category'] as Prospect['customer_category'],
    estimated_ai_spend: (row['estimated_ai_spend'] as number) ?? 0,
    model_families: parseJsonArray(row['model_families'] as string),
    pain_points: parseJsonArray(row['pain_points'] as string),
    regulatory_exposure: parseJsonArray(row['regulatory_exposure'] as string),
    priority_score: (row['priority_score'] as number) ?? 50,
    revenue_engine: (row['revenue_engine'] as Prospect['revenue_engine']) ?? 'direct',
    pipeline_stage: (row['pipeline_stage'] as Prospect['pipeline_stage']) ?? 'signal_detected',
    pipeline_value: (row['pipeline_value'] as number) ?? 0,
    peer_cluster_id: (row['peer_cluster_id'] as string) ?? null,
    contacts,
    outreach_history: outreachHistory,
    notes: (row['notes'] as string) ?? null,
    created_at: (row['created_at'] as string) ?? new Date().toISOString(),
    updated_at: (row['updated_at'] as string) ?? new Date().toISOString(),
  }
}

function parseSignalRow(row: Record<string, unknown>): Signal {
  return {
    id: row['id'] as string,
    type: row['type'] as Signal['type'],
    title: row['title'] as string,
    description: row['description'] as string,
    source: row['source'] as string,
    source_url: (row['source_url'] as string) ?? null,
    date: row['date'] as string,
    relevance_score: (row['relevance_score'] as number) ?? 0,
    urgency_score: (row['urgency_score'] as number) ?? 0,
    coverage_score: (row['coverage_score'] as number) ?? 0,
    novelty_score: (row['novelty_score'] as number) ?? 0,
    actionability_score: (row['actionability_score'] as number) ?? 0,
    matched_capability_ids: parseJsonArray(row['matched_capability_ids'] as string),
    matched_prospect_ids: parseJsonArray(row['matched_prospect_ids'] as string),
    suggested_action: (row['suggested_action'] as string) ?? '',
    narrative_angle: (row['narrative_angle'] as string) ?? '',
    peer_cluster_ids: parseJsonArray(row['peer_cluster_ids'] as string),
    status: (row['status'] as Signal['status']) ?? 'active',
    feedback: (row['feedback'] as Signal['feedback']) ?? null,
    created_at: (row['created_at'] as string) ?? new Date().toISOString(),
  }
}

// ─── Validation ────────────────────────────────────────────────────────

const VALID_AUDIENCES = ['ml_engineer', 'cto', 'compliance', 'researcher', 'ai_community'] as const

interface BurstInput {
  prospectIds: string[]
  signalId: string
  audience: typeof VALID_AUDIENCES[number]
}

function validateBody(body: unknown): { valid: true; data: BurstInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' }
  }

  const obj = body as Record<string, unknown>

  if (!Array.isArray(obj['prospectIds']) || obj['prospectIds'].length === 0) {
    return { valid: false, error: 'prospectIds must be a non-empty array of strings' }
  }
  for (const id of obj['prospectIds']) {
    if (typeof id !== 'string' || id.length === 0 || id.length > MAX_INPUT_LENGTH) {
      return { valid: false, error: 'Each prospectId must be a non-empty string' }
    }
  }

  if (typeof obj['signalId'] !== 'string' || obj['signalId'].length === 0 || obj['signalId'].length > MAX_INPUT_LENGTH) {
    return { valid: false, error: 'Invalid or missing signalId' }
  }
  if (typeof obj['audience'] !== 'string' || !VALID_AUDIENCES.includes(obj['audience'] as typeof VALID_AUDIENCES[number])) {
    return { valid: false, error: `Invalid audience. Must be one of: ${VALID_AUDIENCES.join(', ')}` }
  }

  return {
    valid: true,
    data: {
      prospectIds: obj['prospectIds'] as string[],
      signalId: obj['signalId'] as string,
      audience: obj['audience'] as typeof VALID_AUDIENCES[number],
    },
  }
}

// ─── POST /api/outreach/burst ──────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()

    const body: unknown = await request.json()
    const validation = validateBody(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const { prospectIds, signalId, audience } = validation.data
    const db = getDb()

    // Fetch signal
    const signalRow = db.prepare('SELECT * FROM signals WHERE id = ?').get(signalId) as Record<string, unknown> | undefined
    if (!signalRow) {
      return NextResponse.json(
        { error: 'Signal not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    const signal = parseSignalRow(signalRow)

    // Fetch all prospects
    const prospects: Prospect[] = []
    for (const pid of prospectIds) {
      const pRow = db.prepare('SELECT * FROM prospects WHERE id = ?').get(pid) as Record<string, unknown> | undefined
      if (pRow) {
        prospects.push(parseProspectRow(pRow))
      }
    }

    if (prospects.length === 0) {
      return NextResponse.json(
        { error: 'No valid prospects found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Collect capabilities from signal + model family overlap
    const signalCapabilityIds = new Set<string>(signal.matched_capability_ids)
    const allCapabilities = getAllCapabilities()
    const allModelFamilies = new Set<string>()
    for (const p of prospects) {
      for (const mf of p.model_families) {
        allModelFamilies.add(mf)
      }
    }
    const matchedCapabilities = allCapabilities.filter((cap) => {
      if (signalCapabilityIds.has(cap.id)) return true
      return cap.model_families_tested.some((mf) => allModelFamilies.has(mf))
    })

    const categories = getAllCustomerCategories()
    const results = generateBurstOutreach(prospects, signal, audience, matchedCapabilities, categories)

    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Outreach burst API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ─── Reject unsupported methods ────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
