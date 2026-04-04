import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/db'
import { getDinnerById, updateInviteeRSVP } from '@/lib/events'
import type { RSVPStatus } from '@/lib/events'

const VALID_RSVP_STATUSES: readonly string[] = ['invited', 'accepted', 'declined', 'tentative', 'not_invited']

export async function PATCH(
  request: NextRequest,
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

    const body = await request.json() as Record<string, unknown>

    const prospectId = typeof body['prospectId'] === 'string' ? body['prospectId'] : ''
    if (!prospectId) {
      return NextResponse.json(
        { error: 'prospectId is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const status = typeof body['status'] === 'string' ? body['status'] : ''
    if (!VALID_RSVP_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid RSVP status', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const inviteeExists = dinner.invitees.some((inv) => inv.prospect_id === prospectId)
    if (!inviteeExists) {
      return NextResponse.json(
        { error: 'Invitee not found in this dinner', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const updated = updateInviteeRSVP(params.id, prospectId, status as RSVPStatus)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('RSVP PATCH error:', error)
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

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
