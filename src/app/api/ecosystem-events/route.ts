import { NextResponse } from 'next/server'
import { getEcosystemEvents } from '@/lib/events'

export async function GET(): Promise<NextResponse> {
  try {
    const data = getEcosystemEvents()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Ecosystem events API error:', error)
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
