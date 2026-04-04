import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/db'
import { getDinnerById, addPostEventNotes } from '@/lib/events'
import { MAX_TEXTAREA_LENGTH } from '@/lib/constants'

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

    const notes = typeof body['notes'] === 'string' ? body['notes'].trim() : ''
    if (!notes) {
      return NextResponse.json(
        { error: 'notes is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (notes.length > MAX_TEXTAREA_LENGTH) {
      return NextResponse.json(
        { error: 'notes exceeds maximum length', code: 'VALIDATION_ERROR' },
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

    const updated = addPostEventNotes(params.id, prospectId, notes)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Notes PATCH error:', error)
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
