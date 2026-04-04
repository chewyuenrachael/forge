import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/db'
import { getDinnerById, updateDinner } from '@/lib/events'
import { MAX_INPUT_LENGTH } from '@/lib/constants'
import type { DinnerFormat, DinnerStatus, DinnerInvitee } from '@/lib/events'

const VALID_STATUSES: readonly string[] = ['planning', 'invitations_sent', 'confirmed', 'completed', 'cancelled']
const VALID_FORMATS: readonly string[] = ['chatham_house', 'panel', 'roundtable', 'fireside']

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    ensureSeeded()
    const dinner = getDinnerById(params.id)

    if (!dinner) {
      return NextResponse.json(
        { error: 'Dinner not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: dinner })
  } catch (error) {
    console.error('Dinner GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    ensureSeeded()
    const existing = getDinnerById(params.id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Dinner not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const body = await request.json() as Record<string, unknown>
    const updates: Record<string, unknown> = {}

    if (body['name'] !== undefined) {
      const name = typeof body['name'] === 'string' ? body['name'].trim() : ''
      if (!name || name.length > MAX_INPUT_LENGTH) {
        return NextResponse.json(
          { error: 'name must be 1-500 characters', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      updates['name'] = name
    }

    if (body['city'] !== undefined) {
      updates['city'] = typeof body['city'] === 'string' ? body['city'].trim() : ''
    }

    if (body['venue'] !== undefined) {
      updates['venue'] = typeof body['venue'] === 'string' ? body['venue'].trim() : null
    }

    if (body['date'] !== undefined) {
      updates['date'] = typeof body['date'] === 'string' ? body['date'].trim() : ''
    }

    if (body['status'] !== undefined) {
      if (!VALID_STATUSES.includes(body['status'] as string)) {
        return NextResponse.json(
          { error: 'Invalid status', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      updates['status'] = body['status'] as DinnerStatus
    }

    if (body['format'] !== undefined) {
      if (!VALID_FORMATS.includes(body['format'] as string)) {
        return NextResponse.json(
          { error: 'Invalid format', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      updates['format'] = body['format'] as DinnerFormat
    }

    if (body['topic'] !== undefined) {
      updates['topic'] = typeof body['topic'] === 'string' ? body['topic'].trim() : ''
    }

    if (body['signal_id'] !== undefined) {
      updates['signal_id'] = typeof body['signal_id'] === 'string' ? body['signal_id'] : null
    }

    if (body['budget_estimate'] !== undefined) {
      updates['budget_estimate'] = typeof body['budget_estimate'] === 'number' ? body['budget_estimate'] : 10000
    }

    if (body['max_attendees'] !== undefined) {
      updates['max_attendees'] = typeof body['max_attendees'] === 'number' ? body['max_attendees'] : 12
    }

    if (body['goodfire_attendees'] !== undefined) {
      if (!Array.isArray(body['goodfire_attendees'])) {
        return NextResponse.json(
          { error: 'goodfire_attendees must be an array', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      updates['goodfire_attendees'] = body['goodfire_attendees'] as string[]
    }

    if (body['invitees'] !== undefined) {
      if (!Array.isArray(body['invitees'])) {
        return NextResponse.json(
          { error: 'invitees must be an array', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      updates['invitees'] = body['invitees'] as DinnerInvitee[]
    }

    if (body['notes'] !== undefined) {
      updates['notes'] = typeof body['notes'] === 'string' ? body['notes'].trim() : null
    }

    const updated = updateDinner(params.id, updates)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Dinner PATCH error:', error)
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
