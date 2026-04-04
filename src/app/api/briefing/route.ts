import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded, getDb, parseJsonArray } from '@/lib/db'
import { calculateICPScore } from '@/lib/icp-scoring'
import { getAllSignals } from '@/lib/signals-scoring'
import { getAllCapabilities, getAllCustomerCategories } from '@/lib/knowledge-graph'
import { classifyEngagementTier } from '@/lib/pricing'
import { MAX_INPUT_LENGTH } from '@/lib/constants'
import type { Prospect, ProspectContact, OutreachRecord } from '@/types'

// ─── Row Parser (matches /api/prospects pattern) ────────────────────

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

// ─── POST /api/briefing ─────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()

    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || !('prospectId' in body)) {
      return NextResponse.json(
        { error: 'Missing prospectId in request body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const { prospectId } = body as { prospectId: unknown }
    if (typeof prospectId !== 'string' || prospectId.length === 0 || prospectId.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { error: 'Invalid prospectId', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Fetch prospect
    const db = getDb()
    const row = db.prepare('SELECT * FROM prospects WHERE id = ?').get(prospectId) as Record<string, unknown> | undefined
    if (!row) {
      return NextResponse.json(
        { error: 'Prospect not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    const prospect = parseProspectRow(row)

    // Calculate ICP score
    const icpScore = calculateICPScore(prospect)

    // Fetch signals matched to this prospect
    const allSignals = getAllSignals()
    const matchedSignals = allSignals.filter((s) =>
      s.matched_prospect_ids.includes(prospectId)
    )

    // Collect capability IDs from matched signals
    const signalCapabilityIds = new Set<string>()
    for (const signal of matchedSignals) {
      for (const capId of signal.matched_capability_ids) {
        signalCapabilityIds.add(capId)
      }
    }

    // Fetch all capabilities and filter to those relevant
    const allCapabilities = getAllCapabilities()
    const matchedCapabilities = allCapabilities.filter((cap) => {
      // Match by signal association
      if (signalCapabilityIds.has(cap.id)) return true
      // Match by model family overlap
      const hasModelOverlap = cap.model_families_tested.some((mf) =>
        prospect.model_families.includes(mf)
      )
      return hasModelOverlap
    })

    // Fetch customer category definition
    const allCategories = getAllCustomerCategories()
    const categoryDef = allCategories.find((c) => c.id === prospect.customer_category)
    if (!categoryDef) {
      return NextResponse.json(
        { error: 'Customer category definition not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Classify engagement tier
    const tierRecommendation = classifyEngagementTier({
      modelFamilyId: prospect.model_families[0] ?? '',
      useCaseCount: prospect.pain_points.length || 1,
      regulatoryRequirements: prospect.regulatory_exposure,
      deploymentContext: 'production',
    })

    return NextResponse.json({
      data: {
        prospect: { ...prospect, icpScore },
        icpScore,
        matchedCapabilities,
        matchedSignals,
        categoryDef,
        tierRecommendation,
      },
    })
  } catch (error) {
    console.error('Briefing API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// Reject unsupported methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
