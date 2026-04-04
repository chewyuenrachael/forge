import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded, getDb, parseJsonArray, toJsonString } from '@/lib/db'
import { calculateICPScore } from '@/lib/icp-scoring'
import { logEvent } from '@/lib/event-log'
import { MAX_INPUT_LENGTH, PIPELINE_STAGES, CUSTOMER_CATEGORIES, REVENUE_ENGINES } from '@/lib/constants'
import type { Prospect, ProspectContact, OutreachRecord } from '@/types'

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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    ensureSeeded()
    const db = getDb()
    const row = db.prepare('SELECT * FROM prospects WHERE id = ?').get(params.id) as Record<string, unknown> | undefined

    if (!row) {
      return NextResponse.json(
        { error: 'Prospect not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const prospect = parseProspectRow(row)
    const icpScore = calculateICPScore(prospect)
    return NextResponse.json({ data: { ...prospect, icpScore } })
  } catch (error) {
    console.error('Prospect GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    ensureSeeded()
    const db = getDb()

    const existing = db.prepare('SELECT * FROM prospects WHERE id = ?').get(params.id) as Record<string, unknown> | undefined
    if (!existing) {
      return NextResponse.json(
        { error: 'Prospect not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const oldProspect = parseProspectRow(existing)
    const body = await request.json() as Record<string, unknown>

    const sets: string[] = []
    const values: unknown[] = []

    if (body['name'] !== undefined) {
      const name = typeof body['name'] === 'string' ? body['name'].trim() : ''
      if (!name || name.length > MAX_INPUT_LENGTH) {
        return NextResponse.json(
          { error: 'name must be 1-500 characters', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      sets.push('name = ?')
      values.push(name)
    }

    if (body['industry'] !== undefined) {
      sets.push('industry = ?')
      values.push(typeof body['industry'] === 'string' ? body['industry'].trim() : '')
    }

    if (body['customer_category'] !== undefined) {
      if (!(CUSTOMER_CATEGORIES as readonly string[]).includes(body['customer_category'] as string)) {
        return NextResponse.json(
          { error: 'Invalid customer_category', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      sets.push('customer_category = ?')
      values.push(body['customer_category'])
    }

    if (body['estimated_ai_spend'] !== undefined) {
      sets.push('estimated_ai_spend = ?')
      values.push(typeof body['estimated_ai_spend'] === 'number' ? body['estimated_ai_spend'] : 0)
    }

    if (body['model_families'] !== undefined) {
      if (!Array.isArray(body['model_families'])) {
        return NextResponse.json(
          { error: 'model_families must be an array', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      sets.push('model_families = ?')
      values.push(toJsonString(body['model_families'] as string[]))
    }

    if (body['pain_points'] !== undefined) {
      if (!Array.isArray(body['pain_points'])) {
        return NextResponse.json(
          { error: 'pain_points must be an array', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      sets.push('pain_points = ?')
      values.push(toJsonString(body['pain_points'] as string[]))
    }

    if (body['regulatory_exposure'] !== undefined) {
      if (!Array.isArray(body['regulatory_exposure'])) {
        return NextResponse.json(
          { error: 'regulatory_exposure must be an array', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      sets.push('regulatory_exposure = ?')
      values.push(toJsonString(body['regulatory_exposure'] as string[]))
    }

    if (body['revenue_engine'] !== undefined) {
      if (!(REVENUE_ENGINES as readonly string[]).includes(body['revenue_engine'] as string)) {
        return NextResponse.json(
          { error: 'Invalid revenue_engine', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      sets.push('revenue_engine = ?')
      values.push(body['revenue_engine'])
    }

    if (body['pipeline_stage'] !== undefined) {
      if (!(PIPELINE_STAGES as readonly string[]).includes(body['pipeline_stage'] as string)) {
        return NextResponse.json(
          { error: 'Invalid pipeline_stage', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      sets.push('pipeline_stage = ?')
      values.push(body['pipeline_stage'])
    }

    if (body['pipeline_value'] !== undefined) {
      sets.push('pipeline_value = ?')
      values.push(typeof body['pipeline_value'] === 'number' ? body['pipeline_value'] : 0)
    }

    if (body['peer_cluster_id'] !== undefined) {
      sets.push('peer_cluster_id = ?')
      values.push(body['peer_cluster_id'] === null ? null : body['peer_cluster_id'] as string)
    }

    if (body['contacts'] !== undefined) {
      if (!Array.isArray(body['contacts'])) {
        return NextResponse.json(
          { error: 'contacts must be an array', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      sets.push('contacts = ?')
      values.push(JSON.stringify(body['contacts']))
    }

    if (body['outreach_history'] !== undefined) {
      if (!Array.isArray(body['outreach_history'])) {
        return NextResponse.json(
          { error: 'outreach_history must be an array', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      sets.push('outreach_history = ?')
      values.push(JSON.stringify(body['outreach_history']))
    }

    if (body['notes'] !== undefined) {
      sets.push('notes = ?')
      values.push(body['notes'] === null ? null : typeof body['notes'] === 'string' ? body['notes'].trim() : null)
    }

    if (sets.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    sets.push("updated_at = datetime('now')")
    values.push(params.id)

    db.prepare(`UPDATE prospects SET ${sets.join(', ')} WHERE id = ?`).run(...values)

    // Recalculate ICP score if scoring-relevant fields changed
    const scoringFields = ['model_families', 'regulatory_exposure', 'peer_cluster_id', 'pain_points']
    const needsRescore = scoringFields.some((f) => body[f] !== undefined)
    if (needsRescore) {
      const updatedRow = db.prepare('SELECT * FROM prospects WHERE id = ?').get(params.id) as Record<string, unknown>
      const updatedProspect = parseProspectRow(updatedRow)
      const newScore = calculateICPScore(updatedProspect)
      db.prepare("UPDATE prospects SET priority_score = ?, updated_at = datetime('now') WHERE id = ?")
        .run(newScore.composite, params.id)
    }

    // Log pipeline stage change
    if (body['pipeline_stage'] !== undefined && body['pipeline_stage'] !== oldProspect.pipeline_stage) {
      logEvent({
        eventType: 'pipeline.stage_changed',
        entityType: 'prospect',
        entityId: params.id,
        payload: {
          from: oldProspect.pipeline_stage,
          to: body['pipeline_stage'] as string,
          prospectName: oldProspect.name,
          pipeline_value: oldProspect.pipeline_value,
        },
      })
    }

    // Log outreach if history was appended
    if (body['outreach_history'] !== undefined) {
      const newHistory = body['outreach_history'] as OutreachRecord[]
      if (newHistory.length > oldProspect.outreach_history.length) {
        logEvent({
          eventType: 'outreach.sent',
          entityType: 'prospect',
          entityId: params.id,
          payload: {
            prospectName: oldProspect.name,
            outreachCount: newHistory.length - oldProspect.outreach_history.length,
          },
        })
      }
    }

    const finalRow = db.prepare('SELECT * FROM prospects WHERE id = ?').get(params.id) as Record<string, unknown>
    const finalProspect = parseProspectRow(finalRow)
    const icpScore = calculateICPScore(finalProspect)

    return NextResponse.json({ data: { ...finalProspect, icpScore } })
  } catch (error) {
    console.error('Prospect PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    ensureSeeded()
    const db = getDb()

    const existing = db.prepare('SELECT name FROM prospects WHERE id = ?').get(params.id) as { name: string } | undefined
    if (!existing) {
      return NextResponse.json(
        { error: 'Prospect not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    db.prepare('DELETE FROM prospects WHERE id = ?').run(params.id)

    logEvent({
      eventType: 'pipeline.stage_changed',
      entityType: 'prospect',
      entityId: params.id,
      payload: { action: 'deleted', prospectName: existing.name },
    })

    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('Prospect DELETE error:', error)
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

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
