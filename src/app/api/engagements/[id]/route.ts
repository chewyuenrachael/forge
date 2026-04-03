import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/db'
import { getEngagementById, updateEngagement, deleteEngagement } from '@/lib/engagements'
import { MAX_INPUT_LENGTH } from '@/lib/constants'
import type { UpdateEngagementInput } from '@/types'

const VALID_STATUSES = ['active', 'completed', 'proposed', 'paused'] as const

function validateUpdateInput(body: unknown): { valid: true; data: UpdateEngagementInput } | { valid: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Request body must be a JSON object' }
  }

  const b = body as Record<string, unknown>
  const data: UpdateEngagementInput = {}

  if (b.partner_name !== undefined) {
    if (typeof b.partner_name !== 'string' || b.partner_name.trim().length === 0 || b.partner_name.trim().length > MAX_INPUT_LENGTH) {
      return { valid: false, error: 'partner_name must be 1-500 characters' }
    }
    data.partner_name = b.partner_name.trim()
  }

  if (b.status !== undefined) {
    if (!VALID_STATUSES.includes(b.status as typeof VALID_STATUSES[number])) {
      return { valid: false, error: 'Invalid status value' }
    }
    data.status = b.status as UpdateEngagementInput['status']
  }

  if (b.capabilities_applied !== undefined) {
    if (!Array.isArray(b.capabilities_applied)) {
      return { valid: false, error: 'capabilities_applied must be an array' }
    }
    data.capabilities_applied = b.capabilities_applied as string[]
  }

  if (b.start_date !== undefined) {
    if (typeof b.start_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.start_date)) {
      return { valid: false, error: 'start_date must be a valid date (YYYY-MM-DD)' }
    }
    data.start_date = b.start_date
  }

  if (b.end_date !== undefined) {
    if (b.end_date !== null && (typeof b.end_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.end_date))) {
      return { valid: false, error: 'end_date must be a valid date or null' }
    }
    data.end_date = b.end_date as string | null
  }

  if (b.health_score !== undefined) {
    if (typeof b.health_score !== 'number' || b.health_score < 0 || b.health_score > 100) {
      return { valid: false, error: 'health_score must be 0-100' }
    }
    data.health_score = b.health_score
  }

  if (b.notes !== undefined) {
    data.notes = b.notes === null ? null : typeof b.notes === 'string' ? b.notes.trim() : null
  }

  return { valid: true, data }
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

    return NextResponse.json({ data: engagement })
  } catch (error) {
    console.error('Engagement GET error:', error)
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
    const body: unknown = await request.json()
    const validation = validateUpdateInput(body)

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const updated = updateEngagement(params.id, validation.data)

    if (!updated) {
      return NextResponse.json(
        { error: 'Engagement not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Engagement PATCH error:', error)
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
    const deleted = deleteEngagement(params.id)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Engagement not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('Engagement DELETE error:', error)
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

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
