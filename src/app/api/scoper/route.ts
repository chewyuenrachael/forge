import { NextRequest, NextResponse } from 'next/server'
import { MAX_TEXTAREA_LENGTH } from '@/lib/constants'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { context: string }

    if (typeof body.context !== 'string') {
      return NextResponse.json(
        { error: 'Missing context field', code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    if (body.context.length > MAX_TEXTAREA_LENGTH) {
      return NextResponse.json(
        { error: 'Context exceeds maximum length', code: 'INPUT_TOO_LONG' },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: { status: 'ok', message: 'Scoper endpoint ready' } })
  } catch (error) {
    console.error('Scoper API error:', error)
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
