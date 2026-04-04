import { NextRequest, NextResponse } from 'next/server'
import { getTopProspects, getProspectsByPeerCluster } from '@/lib/icp-scoring'
import { updateProspectPipelineStage } from '@/lib/pipeline'
import { ensureSeeded, getDb, parseJsonArray } from '@/lib/db'
import { PIPELINE_STAGES } from '@/lib/constants'
import type { Prospect, ProspectContact, OutreachRecord } from '@/types'
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
      const data = getProspectsByPeerCluster(cluster)
      return NextResponse.json({ data })
    }

    const db = getDb()
    const rows = db.prepare(
      'SELECT * FROM prospects ORDER BY priority_score DESC'
    ).all() as Record<string, unknown>[]
    const data = rows.map(parseProspectRow)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Prospects API error:', error)
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

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
