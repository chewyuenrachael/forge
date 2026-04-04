import { NextRequest, NextResponse } from 'next/server'
import { getPredictionById, recordPredictionOutcome } from '@/lib/predictions'
import { getDb, ensureSeeded } from '@/lib/db'
import { logEvent } from '@/lib/event-log'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    ensureSeeded()
    const { id } = await context.params
    const prediction = getPredictionById(id)

    if (!prediction) {
      return NextResponse.json(
        { error: 'Prediction not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: prediction })
  } catch (error) {
    console.error('Prediction GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    ensureSeeded()
    const { id } = await context.params
    const body = await request.json() as Record<string, unknown>
    const outcome = body['outcome'] as string | undefined

    if (!outcome) {
      return NextResponse.json(
        { error: 'Missing required field: outcome', code: 'MISSING_FIELDS' },
        { status: 400 }
      )
    }

    if (!['confirmed', 'refuted'].includes(outcome)) {
      return NextResponse.json(
        { error: 'outcome must be "confirmed" or "refuted"', code: 'INVALID_OUTCOME' },
        { status: 400 }
      )
    }

    const data = recordPredictionOutcome(id, {
      outcome: outcome as 'confirmed' | 'refuted',
      outcomeNotes: (body['outcomeNotes'] as string) ?? undefined,
    })

    if (!data) {
      return NextResponse.json(
        { error: 'Prediction not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Prediction PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    ensureSeeded()
    const { id } = await context.params
    const { searchParams } = new URL(request.url)

    if (searchParams.get('confirm') !== 'true') {
      return NextResponse.json(
        { error: 'Delete requires ?confirm=true', code: 'CONFIRMATION_REQUIRED' },
        { status: 400 }
      )
    }

    const existing = getPredictionById(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Prediction not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const db = getDb()
    db.prepare('DELETE FROM predictions WHERE id = ?').run(id)

    logEvent({
      eventType: 'prediction.outcome_recorded',
      entityType: 'prediction',
      entityId: id,
      payload: { action: 'deleted', engagementId: existing.engagement_id },
    })

    return NextResponse.json({ data: { deleted: true, id } })
  } catch (error) {
    console.error('Prediction DELETE error:', error)
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
