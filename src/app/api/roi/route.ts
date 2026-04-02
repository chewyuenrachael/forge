import { NextRequest, NextResponse } from 'next/server'
import { calculateROI } from '@/lib/roi-engine'
import type { ROIInput } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as ROIInput

    if (typeof body.monthlyInferenceSpend !== 'number' || body.monthlyInferenceSpend < 0) {
      return NextResponse.json(
        { error: 'Invalid monthly inference spend', code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    const result = calculateROI(body)
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('ROI API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with ROI input data.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
