import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/db'
import { updateMilestone, deleteMilestone } from '@/lib/engagements'
import { MAX_INPUT_LENGTH } from '@/lib/constants'
import type { UpdateMilestoneInput } from '@/types'

const VALID_STATUSES = ['completed', 'in_progress', 'upcoming', 'blocked'] as const

function validateUpdateInput(body: unknown): { valid: true; data: UpdateMilestoneInput } | { valid: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Request body must be a JSON object' }
  }

  const b = body as Record<string, unknown>
  const data: UpdateMilestoneInput = {}

  if (b.title !== undefined) {
    if (typeof b.title !== 'string' || b.title.trim().length === 0 || b.title.trim().length > MAX_INPUT_LENGTH) {
      return { valid: false, error: 'title must be 1-500 characters' }
    }
    data.title = b.title.trim()
  }

  if (b.status !== undefined) {
    if (!VALID_STATUSES.includes(b.status as typeof VALID_STATUSES[number])) {
      return { valid: false, error: 'Invalid milestone status' }
    }
    data.status = b.status as UpdateMilestoneInput['status']
  }

  if (b.due_date !== undefined) {
    if (typeof b.due_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.due_date)) {
      return { valid: false, error: 'due_date must be a valid date (YYYY-MM-DD)' }
    }
    data.due_date = b.due_date
  }

  if (b.completed_date !== undefined) {
    if (b.completed_date !== null && (typeof b.completed_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.completed_date))) {
      return { valid: false, error: 'completed_date must be a valid date or null' }
    }
    data.completed_date = b.completed_date as string | null
  }

  if (b.notes !== undefined) {
    data.notes = b.notes === null ? null : typeof b.notes === 'string' ? b.notes.trim() : null
  }

  if (b.sort_order !== undefined) {
    if (typeof b.sort_order !== 'number' || !Number.isInteger(b.sort_order) || b.sort_order < 0) {
      return { valid: false, error: 'sort_order must be a non-negative integer' }
    }
    data.sort_order = b.sort_order
  }

  return { valid: true, data }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    ensureSeeded()
    const body: unknown = await request.json()
    const validation = validateUpdateInput(body)

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const updated = updateMilestone(params.id, validation.data)

    if (!updated) {
      return NextResponse.json(
        { error: 'Milestone not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Milestone PATCH error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    ensureSeeded()
    const deleted = deleteMilestone(params.id)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Milestone not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('Milestone DELETE error:', error)
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

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
