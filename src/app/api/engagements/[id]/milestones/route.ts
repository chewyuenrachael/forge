import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/db'
import { getEngagementById, getMilestonesByEngagement, createMilestone } from '@/lib/engagements'
import { MAX_INPUT_LENGTH } from '@/lib/constants'
import type { CreateMilestoneInput } from '@/types'

const VALID_STATUSES = ['completed', 'in_progress', 'upcoming', 'blocked'] as const

interface ValidationError {
  field: string
  message: string
}

function validateCreateInput(
  body: unknown,
  engagementId: string
): { valid: true; data: CreateMilestoneInput } | { valid: false; details: ValidationError[] } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, details: [{ field: 'body', message: 'Request body must be a JSON object' }] }
  }

  const b = body as Record<string, unknown>
  const errors: ValidationError[] = []

  if (typeof b.title !== 'string' || b.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required' })
  } else if (b.title.trim().length > MAX_INPUT_LENGTH) {
    errors.push({ field: 'title', message: `Title must be ${MAX_INPUT_LENGTH} characters or fewer` })
  }

  if (!VALID_STATUSES.includes(b.status as typeof VALID_STATUSES[number])) {
    errors.push({ field: 'status', message: 'Status must be one of: completed, in_progress, upcoming, blocked' })
  }

  if (typeof b.due_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.due_date) || isNaN(new Date(b.due_date).getTime())) {
    errors.push({ field: 'due_date', message: 'due_date must be a valid date (YYYY-MM-DD)' })
  }

  if (errors.length > 0) {
    return { valid: false, details: errors }
  }

  return {
    valid: true,
    data: {
      engagement_id: engagementId,
      title: (b.title as string).trim(),
      status: b.status as CreateMilestoneInput['status'],
      due_date: b.due_date as string,
      notes: typeof b.notes === 'string' ? b.notes.trim() : undefined,
    },
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    ensureSeeded()
    const engagement = getEngagementById(params.id)

    if (!engagement) {
      return NextResponse.json(
        { error: 'Engagement not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const milestones = getMilestonesByEngagement(params.id)
    return NextResponse.json({ data: milestones })
  } catch (error) {
    console.error('Milestones GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    ensureSeeded()

    const engagement = getEngagementById(params.id)
    if (!engagement) {
      return NextResponse.json(
        { error: 'Engagement not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const body: unknown = await request.json()
    const validation = validateCreateInput(body, params.id)

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: validation.details },
        { status: 400 }
      )
    }

    const milestone = createMilestone(validation.data)
    return NextResponse.json({ data: milestone }, { status: 201 })
  } catch (error) {
    console.error('Milestones POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
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
