import { NextRequest, NextResponse } from 'next/server'
import { getAllPredictions, createPrediction, recordPredictionOutcome, getPredictionAccuracy } from '@/lib/predictions'
import { getAllModelFamilies } from '@/lib/knowledge-graph'
import { ensureSeeded } from '@/lib/db'
import type { PredictionOutcome } from '@/lib/constants'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const { searchParams } = new URL(request.url)

    if (searchParams.get('meta') === 'model_families') {
      const data = getAllModelFamilies()
      return NextResponse.json({ data })
    }

    if (searchParams.get('accuracy') === 'true') {
      const data = getPredictionAccuracy()
      return NextResponse.json({ data })
    }

    const engagementId = searchParams.get('engagementId') ?? undefined
    const outcome = searchParams.get('outcome') as PredictionOutcome | null
    const modelFamilyId = searchParams.get('modelFamily') ?? undefined

    const data = getAllPredictions({
      engagementId,
      outcome: outcome ?? undefined,
      modelFamilyId,
    })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Predictions API error:', error)
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

    const engagementId = body['engagementId'] as string | undefined
    const description = body['description'] as string | undefined
    const methodology = body['methodology'] as string | undefined
    const severity = body['severity'] as string | undefined
    const confidence = body['confidence'] as string | undefined

    if (!engagementId || !description || !methodology || !severity || !confidence) {
      return NextResponse.json(
        { error: 'Missing required fields: engagementId, description, methodology, severity, confidence', code: 'MISSING_FIELDS' },
        { status: 400 }
      )
    }

    const data = createPrediction({
      engagementId,
      description,
      methodology,
      severity: severity as 'critical' | 'high' | 'medium' | 'low',
      confidence: confidence as 'high' | 'medium' | 'low',
      modelFamilyId: (body['modelFamilyId'] as string) ?? undefined,
    })
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Predictions POST error:', error)
    return NextResponse.json(
      { error: message, code: 'CREATE_ERROR' },
      { status: 400 }
    )
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const body = await request.json() as Record<string, unknown>
    const id = body['id'] as string | undefined
    const outcome = body['outcome'] as string | undefined

    if (!id || !outcome) {
      return NextResponse.json(
        { error: 'Missing required fields: id, outcome', code: 'MISSING_FIELDS' },
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
      outcomeDate: (body['outcomeDate'] as string) ?? undefined,
    })

    if (!data) {
      return NextResponse.json(
        { error: 'Prediction not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Predictions PATCH error:', error)
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
