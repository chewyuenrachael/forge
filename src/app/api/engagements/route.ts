import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/db'
import { getAllEngagements, createEngagement } from '@/lib/engagements'
import { MAX_INPUT_LENGTH } from '@/lib/constants'
import type { CreateEngagementInput } from '@/types'

const VALID_STATUSES = ['active', 'completed', 'proposed', 'paused'] as const

interface ValidationError {
  field: string
  message: string
}

function validateCreateInput(body: unknown): { valid: true; data: CreateEngagementInput } | { valid: false; details: ValidationError[] } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, details: [{ field: 'body', message: 'Request body must be a JSON object' }] }
  }

  const b = body as Record<string, unknown>
  const errors: ValidationError[] = []

  // partner_name
  if (typeof b.partner_name !== 'string' || b.partner_name.trim().length === 0) {
    errors.push({ field: 'partner_name', message: 'Partner name is required' })
  } else if (b.partner_name.trim().length > MAX_INPUT_LENGTH) {
    errors.push({ field: 'partner_name', message: `Partner name must be ${MAX_INPUT_LENGTH} characters or fewer` })
  }

  // status
  if (!VALID_STATUSES.includes(b.status as typeof VALID_STATUSES[number])) {
    errors.push({ field: 'status', message: 'Status must be one of: active, completed, proposed, paused' })
  }

  // capabilities_applied
  if (!Array.isArray(b.capabilities_applied)) {
    errors.push({ field: 'capabilities_applied', message: 'capabilities_applied must be an array' })
  } else {
    for (const cap of b.capabilities_applied) {
      if (typeof cap !== 'string' || cap.length > 100) {
        errors.push({ field: 'capabilities_applied', message: 'Each capability must be a string of 100 characters or fewer' })
        break
      }
    }
  }

  // start_date
  if (typeof b.start_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.start_date) || isNaN(new Date(b.start_date).getTime())) {
    errors.push({ field: 'start_date', message: 'start_date must be a valid date (YYYY-MM-DD)' })
  }

  // end_date (optional)
  if (b.end_date !== undefined && b.end_date !== null) {
    if (typeof b.end_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.end_date) || isNaN(new Date(b.end_date).getTime())) {
      errors.push({ field: 'end_date', message: 'end_date must be a valid date (YYYY-MM-DD)' })
    } else if (typeof b.start_date === 'string' && b.end_date < b.start_date) {
      errors.push({ field: 'end_date', message: 'end_date must be on or after start_date' })
    }
  }

  if (errors.length > 0) {
    return { valid: false, details: errors }
  }

  return {
    valid: true,
    data: {
      partner_name: (b.partner_name as string).trim(),
      status: b.status as CreateEngagementInput['status'],
      capabilities_applied: b.capabilities_applied as string[],
      start_date: b.start_date as string,
      end_date: b.end_date as string | undefined,
      notes: typeof b.notes === 'string' ? b.notes.trim() : undefined,
    },
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')

    if (statusFilter && !VALID_STATUSES.includes(statusFilter as typeof VALID_STATUSES[number])) {
      return NextResponse.json(
        { error: 'Invalid status filter', code: 'INVALID_STATUS' },
        { status: 400 }
      )
    }

    const engagements = getAllEngagements()
    const data = statusFilter
      ? engagements.filter((e) => e.status === statusFilter)
      : engagements

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Engagements GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()

    const body: unknown = await request.json()
    const validation = validateCreateInput(body)

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: validation.details },
        { status: 400 }
      )
    }

    const engagement = createEngagement(validation.data)
    return NextResponse.json({ data: engagement }, { status: 201 })
  } catch (error) {
    console.error('Engagements POST error:', error)
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
