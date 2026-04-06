import { NextRequest, NextResponse } from 'next/server'
import {
  getConversionBySignalType,
  getConversionByCategory,
  getConversionByAudienceFraming,
  suggestWeightAdjustments,
  suggestICPWeightAdjustments,
  getWeightChangeHistory,
} from '@/lib/analytics'
import {
  getActionabilityWeights,
  updateActionabilityWeights,
  decayUrgencyScores,
} from '@/lib/signals-scoring'
import { getICPWeights } from '@/lib/icp-scoring'
import { ensureSeeded } from '@/lib/db'
import type { ActionabilityWeights } from '@/types'

const VALID_TYPES = [
  'signal_type',
  'category',
  'audience_framing',
  'weight_suggestions',
  'icp_suggestions',
  'weight_history',
] as const

type AnalyticsType = typeof VALID_TYPES[number]

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as AnalyticsType | null

    if (!type || !(VALID_TYPES as readonly string[]).includes(type)) {
      return NextResponse.json(
        { error: 'Missing or invalid type parameter. Valid types: ' + VALID_TYPES.join(', '), code: 'INVALID_TYPE' },
        { status: 400 }
      )
    }

    switch (type) {
      case 'signal_type': {
        const data = getConversionBySignalType()
        return NextResponse.json({ data })
      }
      case 'category': {
        const data = getConversionByCategory()
        return NextResponse.json({ data })
      }
      case 'audience_framing': {
        const data = getConversionByAudienceFraming()
        return NextResponse.json({ data })
      }
      case 'weight_suggestions': {
        const currentWeights = getActionabilityWeights()
        const suggestion = suggestWeightAdjustments(currentWeights)
        return NextResponse.json({ data: { currentWeights, ...suggestion } })
      }
      case 'icp_suggestions': {
        const currentWeights = getICPWeights()
        const suggestion = suggestICPWeightAdjustments(currentWeights)
        return NextResponse.json({ data: suggestion })
      }
      case 'weight_history': {
        const data = getWeightChangeHistory()
        return NextResponse.json({ data })
      }
    }
  } catch (error) {
    console.error('Analytics API error:', error)
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

    if (action === 'update_actionability_weights') {
      const weights = body['weights'] as ActionabilityWeights | undefined
      if (!weights || typeof weights.relevance !== 'number' || typeof weights.urgency !== 'number'
          || typeof weights.coverage !== 'number' || typeof weights.novelty !== 'number') {
        return NextResponse.json(
          { error: 'Invalid weights object', code: 'INVALID_WEIGHTS' },
          { status: 400 }
        )
      }
      const updated = updateActionabilityWeights(weights)
      return NextResponse.json({ data: updated })
    }

    if (action === 'trigger_decay') {
      const decayedCount = decayUrgencyScores()
      return NextResponse.json({ data: { decayedCount } })
    }

    return NextResponse.json(
      { error: 'action must be "update_actionability_weights" or "trigger_decay"', code: 'INVALID_ACTION' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Analytics PATCH error:', error)
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
