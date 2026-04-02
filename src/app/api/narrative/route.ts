import { NextRequest, NextResponse } from 'next/server'
import { MAX_TEXTAREA_LENGTH } from '@/lib/constants'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { topic: string; audience: string }

    if (typeof body.topic !== 'string' || typeof body.audience !== 'string') {
      return NextResponse.json(
        { error: 'Missing topic or audience field', code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    if (body.topic.length > MAX_TEXTAREA_LENGTH) {
      return NextResponse.json(
        { error: 'Topic exceeds maximum length', code: 'INPUT_TOO_LONG' },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: { status: 'ok', message: 'Narrative endpoint ready' } })
  } catch (error) {
    console.error('Narrative API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
