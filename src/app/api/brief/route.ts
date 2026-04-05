import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/db'
import { generateWeeklyBrief } from '@/lib/weekly-brief'
import { MAX_SEARCH_LENGTH } from '@/lib/constants'

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()

    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get('weekStart')
    const weekEnd = searchParams.get('weekEnd')

    if (weekStart && weekStart.length > MAX_SEARCH_LENGTH) {
      return NextResponse.json(
        { error: 'weekStart exceeds maximum length', code: 'INPUT_TOO_LONG' },
        { status: 400 },
      )
    }
    if (weekEnd && weekEnd.length > MAX_SEARCH_LENGTH) {
      return NextResponse.json(
        { error: 'weekEnd exceeds maximum length', code: 'INPUT_TOO_LONG' },
        { status: 400 },
      )
    }

    if (weekStart && !ISO_DATE_REGEX.test(weekStart)) {
      return NextResponse.json(
        { error: 'weekStart must be YYYY-MM-DD format', code: 'VALIDATION_ERROR' },
        { status: 400 },
      )
    }
    if (weekEnd && !ISO_DATE_REGEX.test(weekEnd)) {
      return NextResponse.json(
        { error: 'weekEnd must be YYYY-MM-DD format', code: 'VALIDATION_ERROR' },
        { status: 400 },
      )
    }

    const brief = generateWeeklyBrief(
      weekStart ?? undefined,
      weekEnd ?? undefined,
    )

    return NextResponse.json({ data: brief })
  } catch (error) {
    console.error('Brief API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 },
  )
}

export async function PATCH(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 },
  )
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 },
  )
}
