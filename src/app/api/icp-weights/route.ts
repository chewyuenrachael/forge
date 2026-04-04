import { NextRequest, NextResponse } from 'next/server'
import { getICPWeights, updateICPWeights } from '@/lib/icp-scoring'
import { ensureSeeded } from '@/lib/db'
import type { ICPWeights } from '@/types'

export async function GET(): Promise<NextResponse> {
  try {
    ensureSeeded()
    const data = getICPWeights()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('ICP Weights GET error:', error)
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

    const modelFamilyMatch = typeof body['modelFamilyMatch'] === 'number' ? body['modelFamilyMatch'] : undefined
    const regulatoryPressure = typeof body['regulatoryPressure'] === 'number' ? body['regulatoryPressure'] : undefined
    const peerClusterDensity = typeof body['peerClusterDensity'] === 'number' ? body['peerClusterDensity'] : undefined
    const recentSignals = typeof body['recentSignals'] === 'number' ? body['recentSignals'] : undefined

    if (modelFamilyMatch === undefined || regulatoryPressure === undefined ||
        peerClusterDensity === undefined || recentSignals === undefined) {
      return NextResponse.json(
        { error: 'All four weights are required: modelFamilyMatch, regulatoryPressure, peerClusterDensity, recentSignals', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const weights: ICPWeights = { modelFamilyMatch, regulatoryPressure, peerClusterDensity, recentSignals }
    const updated = updateICPWeights(weights)
    return NextResponse.json({ data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    const isValidation = message.includes('must sum') || message.includes('must be between')
    console.error('ICP Weights PATCH error:', error)
    return NextResponse.json(
      { error: message, code: isValidation ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR' },
      { status: isValidation ? 400 : 500 }
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
