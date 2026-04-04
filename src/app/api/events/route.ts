import { NextRequest, NextResponse } from 'next/server'
import { getRecentEvents, getActivityFeed, getEventsByType } from '@/lib/event-log'
import { ensureSeeded } from '@/lib/db'
import type { EventType } from '@/types'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined
    const eventType = searchParams.get('type')
    const since = searchParams.get('since')

    if (searchParams.get('feed') === 'true') {
      const data = getActivityFeed(limit)
      return NextResponse.json({ data })
    }

    if (eventType) {
      const data = getEventsByType(eventType as EventType, since ?? undefined)
      return NextResponse.json({ data })
    }

    const data = getRecentEvents(limit)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Events API error:', error)
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

export async function PATCH(): Promise<NextResponse> {
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
