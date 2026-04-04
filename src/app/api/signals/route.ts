import { NextRequest, NextResponse } from 'next/server'
import { getAllSignals as getHardcodedSignals, getSignalsByType, getAllProspects } from '@/lib/signals'
import { getAllSignals as getScoredSignals, getSignalById, updateSignalStatus, submitSignalFeedback } from '@/lib/signals-scoring'
import { ensureSeeded } from '@/lib/db'
import { SIGNAL_TYPES } from '@/lib/constants'
import type { FeedbackValue } from '@/lib/constants'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')
    const source = searchParams.get('source')

    if (resource === 'prospects') {
      const data = getAllProspects()
      return NextResponse.json({ data })
    }

    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const minActionability = searchParams.get('minActionability')

    // Use scored signals from DB by default, fallback to hardcoded
    if (source === 'hardcoded') {
      if (type) {
        if (!(SIGNAL_TYPES as readonly string[]).includes(type)) {
          return NextResponse.json(
            { error: 'Invalid signal type', code: 'INVALID_TYPE' },
            { status: 400 }
          )
        }
        const data = getSignalsByType(type as typeof SIGNAL_TYPES[number])
        return NextResponse.json({ data })
      }
      const data = getHardcodedSignals()
      return NextResponse.json({ data })
    }

    const data = getScoredSignals({
      type: type && (SIGNAL_TYPES as readonly string[]).includes(type)
        ? type as typeof SIGNAL_TYPES[number]
        : undefined,
      status: status ?? undefined,
      minActionability: minActionability ? parseInt(minActionability, 10) : undefined,
    })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Signals API error:', error)
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
    const action = body['action'] as string | undefined
    const id = body['id'] as string | undefined

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Missing signal id', code: 'MISSING_ID' },
        { status: 400 }
      )
    }

    const existing = getSignalById(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Signal not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (action === 'feedback') {
      const feedback = body['feedback'] as string | undefined
      if (!feedback || !['positive', 'negative'].includes(feedback)) {
        return NextResponse.json(
          { error: 'feedback must be "positive" or "negative"', code: 'INVALID_FEEDBACK' },
          { status: 400 }
        )
      }
      const updated = submitSignalFeedback(id, feedback as FeedbackValue)
      return NextResponse.json({ data: updated })
    }

    if (action === 'status') {
      const newStatus = body['status'] as string | undefined
      if (!newStatus || !['active', 'acted_on', 'archived', 'dismissed'].includes(newStatus)) {
        return NextResponse.json(
          { error: 'Invalid status', code: 'INVALID_STATUS' },
          { status: 400 }
        )
      }
      const updated = updateSignalStatus(id, newStatus as 'active' | 'acted_on' | 'archived' | 'dismissed')
      return NextResponse.json({ data: updated })
    }

    return NextResponse.json(
      { error: 'action must be "feedback" or "status"', code: 'INVALID_ACTION' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Signals PATCH error:', error)
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
