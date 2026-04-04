import { NextRequest, NextResponse } from 'next/server'
import { getTopProspects, getProspectsByPeerCluster, getPeerClusters, calculateICPScore } from '@/lib/icp-scoring'
import { updateProspectPipelineStage } from '@/lib/pipeline'
import { logEvent } from '@/lib/event-log'
import { ensureSeeded, getDb, parseJsonArray, toJsonString } from '@/lib/db'
import { PIPELINE_STAGES, CUSTOMER_CATEGORIES, REVENUE_ENGINES, MAX_INPUT_LENGTH } from '@/lib/constants'
import type { Prospect, ProspectContact, OutreachRecord, ICPScore } from '@/types'
import type { PipelineStage } from '@/lib/constants'

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const { searchParams } = new URL(request.url)
    const top = searchParams.get('top')
    const cluster = searchParams.get('cluster')
    const clusters = searchParams.get('clusters')

    if (clusters === 'true') {
      const data = getPeerClusters()
      return NextResponse.json({ data })
    }

    if (top) {
      const limit = parseInt(top, 10)
      if (isNaN(limit) || limit < 1) {
        return NextResponse.json(
          { error: 'top must be a positive integer', code: 'INVALID_TOP' },
          { status: 400 }
        )
      }
      const data = getTopProspects(limit)
      return NextResponse.json({ data })
    }

    if (cluster) {
      const prospects = getProspectsByPeerCluster(cluster)
      const data = prospects.map((p) => ({ ...p, icpScore: calculateICPScore(p) }))
      return NextResponse.json({ data })
    }

    const db = getDb()
    const rows = db.prepare(
      'SELECT * FROM prospects ORDER BY priority_score DESC'
    ).all() as Record<string, unknown>[]
    const data: (Prospect & { icpScore: ICPScore })[] = rows.map((row) => {
      const prospect = parseProspectRow(row)
      const icpScore = calculateICPScore(prospect)
      return { ...prospect, icpScore }
    })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Prospects API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const body = await request.json() as Record<string, unknown>

    const name = typeof body['name'] === 'string' ? body['name'].trim() : ''
    if (!name || name.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { error: 'name is required and must be 1-500 characters', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const industry = typeof body['industry'] === 'string' ? body['industry'].trim() : 'Technology'
    const customerCategory = body['customer_category'] as string
    if (!customerCategory || !(CUSTOMER_CATEGORIES as readonly string[]).includes(customerCategory)) {
      return NextResponse.json(
        { error: 'Invalid customer_category', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const revenueEngine = (body['revenue_engine'] as string) ?? 'direct'
    if (!(REVENUE_ENGINES as readonly string[]).includes(revenueEngine)) {
      return NextResponse.json(
        { error: 'Invalid revenue_engine', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const pipelineStage = (body['pipeline_stage'] as string) ?? 'signal_detected'
    if (!(PIPELINE_STAGES as readonly string[]).includes(pipelineStage)) {
      return NextResponse.json(
        { error: 'Invalid pipeline_stage', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const id = `pros_${crypto.randomUUID().slice(0, 8)}`
    const estimatedAiSpend = typeof body['estimated_ai_spend'] === 'number' ? body['estimated_ai_spend'] : 0
    const modelFamilies = Array.isArray(body['model_families']) ? body['model_families'] as string[] : []
    const painPoints = Array.isArray(body['pain_points']) ? body['pain_points'] as string[] : []
    const regulatoryExposure = Array.isArray(body['regulatory_exposure']) ? body['regulatory_exposure'] as string[] : []
    const pipelineValue = typeof body['pipeline_value'] === 'number' ? body['pipeline_value'] : 0
    const peerClusterId = typeof body['peer_cluster_id'] === 'string' ? body['peer_cluster_id'] : null
    const contacts = Array.isArray(body['contacts']) ? body['contacts'] as ProspectContact[] : []
    const notes = typeof body['notes'] === 'string' ? body['notes'].trim() || null : null

    const db = getDb()
    db.prepare(`
      INSERT INTO prospects (id, name, industry, customer_category, estimated_ai_spend, model_families, pain_points, regulatory_exposure, priority_score, revenue_engine, pipeline_stage, pipeline_value, peer_cluster_id, contacts, outreach_history, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, industry, customerCategory, estimatedAiSpend,
      toJsonString(modelFamilies), toJsonString(painPoints), toJsonString(regulatoryExposure),
      50, revenueEngine, pipelineStage, pipelineValue, peerClusterId,
      JSON.stringify(contacts), '[]', notes
    )

    const row = db.prepare('SELECT * FROM prospects WHERE id = ?').get(id) as Record<string, unknown>
    const prospect = parseProspectRow(row)
    const icpScore = calculateICPScore(prospect)

    db.prepare("UPDATE prospects SET priority_score = ?, updated_at = datetime('now') WHERE id = ?")
      .run(icpScore.composite, id)
    prospect.priority_score = icpScore.composite

    logEvent({
      eventType: 'pipeline.stage_changed',
      entityType: 'prospect',
      entityId: id,
      payload: { from: null, to: pipelineStage, prospectName: name, pipeline_value: pipelineValue },
    })

    return NextResponse.json({ data: { ...prospect, icpScore } }, { status: 201 })
  } catch (error) {
    console.error('Prospects POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const body = await request.json() as Record<string, unknown>
    const id = body['id'] as string | undefined
    const stage = body['pipeline_stage'] as string | undefined

    if (!id || !stage) {
      return NextResponse.json(
        { error: 'Missing required fields: id, pipeline_stage', code: 'MISSING_FIELDS' },
        { status: 400 }
      )
    }

    if (!(PIPELINE_STAGES as readonly string[]).includes(stage)) {
      return NextResponse.json(
        { error: 'Invalid pipeline stage', code: 'INVALID_STAGE' },
        { status: 400 }
      )
    }

    const data = updateProspectPipelineStage(id, stage as PipelineStage)
    if (!data) {
      return NextResponse.json(
        { error: 'Prospect not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Prospects PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
