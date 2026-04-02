import { NextRequest, NextResponse } from 'next/server'
import { getAllSignals, getSignalsByType } from '@/lib/signals'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type && !['regulatory', 'competitor', 'prospect', 'conference', 'research'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid signal type', code: 'INVALID_TYPE' },
        { status: 400 }
      )
    }

    const data = type
      ? getSignalsByType(type as 'regulatory' | 'competitor' | 'prospect' | 'conference' | 'research')
      : getAllSignals()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Signals API error:', error)
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
