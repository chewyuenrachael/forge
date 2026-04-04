import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/db'
import { createDinner, getAllDinners } from '@/lib/events'
import { MAX_INPUT_LENGTH } from '@/lib/constants'
import type { DinnerFormat } from '@/lib/events'

const VALID_FORMATS: readonly string[] = ['chatham_house', 'panel', 'roundtable', 'fireside']

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const { searchParams } = new URL(request.url)
    const clusterId = searchParams.get('cluster_id')

    const dinners = getAllDinners()
    const filtered = clusterId
      ? dinners.filter((d) => d.cluster_id === clusterId)
      : dinners

    return NextResponse.json({ data: filtered })
  } catch (error) {
    console.error('Dinners GET error:', error)
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

    const name = typeof body['name'] === 'string' ? body['name'].trim() : ''
    if (!name || name.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { error: 'name is required and must be 1-500 characters', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const city = typeof body['city'] === 'string' ? body['city'].trim() : ''
    if (!city) {
      return NextResponse.json(
        { error: 'city is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const date = typeof body['date'] === 'string' ? body['date'].trim() : ''
    if (!date) {
      return NextResponse.json(
        { error: 'date is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const topic = typeof body['topic'] === 'string' ? body['topic'].trim() : ''
    if (!topic) {
      return NextResponse.json(
        { error: 'topic is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const clusterId = typeof body['cluster_id'] === 'string' ? body['cluster_id'] : ''
    const venue = typeof body['venue'] === 'string' ? body['venue'].trim() : null
    const signalId = typeof body['signal_id'] === 'string' ? body['signal_id'] : null
    const format = typeof body['format'] === 'string' && VALID_FORMATS.includes(body['format'])
      ? body['format'] as DinnerFormat
      : 'chatham_house'
    const budgetEstimate = typeof body['budget_estimate'] === 'number' ? body['budget_estimate'] : 10000
    const maxAttendees = typeof body['max_attendees'] === 'number' ? body['max_attendees'] : 12
    const goodfireAttendees = Array.isArray(body['goodfire_attendees'])
      ? (body['goodfire_attendees'] as string[])
      : []
    const invitees = Array.isArray(body['invitees']) ? body['invitees'] : []
    const notes = typeof body['notes'] === 'string' ? body['notes'].trim() : null

    const dinner = createDinner({
      name,
      cluster_id: clusterId,
      city,
      venue,
      date,
      format,
      topic,
      signal_id: signalId,
      budget_estimate: budgetEstimate,
      max_attendees: maxAttendees,
      goodfire_attendees: goodfireAttendees,
      invitees: invitees as CreateDinnerInput['invitees'],
      notes,
    })

    return NextResponse.json({ data: dinner }, { status: 201 })
  } catch (error) {
    console.error('Dinners POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PUT(): Promise<NextResponse> {
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

type CreateDinnerInput = Parameters<typeof createDinner>[0]
