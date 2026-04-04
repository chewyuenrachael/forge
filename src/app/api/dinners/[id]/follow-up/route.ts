import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/db'
import { getDinnerById } from '@/lib/events'
import { logEvent } from '@/lib/event-log'

export async function POST(
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

    const invitee = dinner.invitees.find((inv) => inv.prospect_id === prospectId)
    if (!invitee) {
      return NextResponse.json(
        { error: 'Invitee not found in this dinner', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const contactName = invitee.contact.name
    const notesContext = invitee.post_event_notes ?? ''
    const goodfireHost = dinner.goodfire_attendees.length > 0
      ? (dinner.goodfire_attendees[0] ?? 'The Goodfire Team')
      : 'The Goodfire Team'

    const subject = `Following up from ${dinner.name}`
    const followUpBody = generateFollowUpTemplate(contactName, dinner.name, dinner.topic, dinner.city, notesContext, goodfireHost)

    logEvent({
      eventType: 'outreach.sent',
      entityType: 'dinner',
      entityId: params.id,
      payload: { prospectId, contactName, type: 'follow_up' },
    })

    return NextResponse.json({
      data: { subject, body: followUpBody },
    })
  } catch (error) {
    console.error('Follow-up POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

function generateFollowUpTemplate(
  contactName: string,
  dinnerName: string,
  topic: string,
  city: string,
  notesContext: string,
  goodfireHost: string
): string {
  const notesLine = notesContext
    ? `\n\nI wanted to follow up on our discussion, particularly regarding ${notesContext.slice(0, 200)}${notesContext.length > 200 ? '...' : ''}.`
    : '\n\nI wanted to follow up on the themes we explored during the evening.'

  return `Dear ${contactName},

Thank you for joining us at the ${dinnerName} in ${city}. It was a privilege to host such a thoughtful conversation on ${topic}.${notesLine}

At Goodfire, we have been working on AI interpretability tools that directly address several of the challenges discussed — particularly around model transparency and auditability. I would welcome the opportunity to show you how our sparse autoencoder technology works in practice and explore whether it could support your team's objectives.

Would you be available for a 30-minute call in the next two weeks?

Best regards,
${goodfireHost}
Goodfire`
}

export async function GET(): Promise<NextResponse> {
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
