import { NextRequest, NextResponse } from 'next/server'
import { getPipelineOverview, getWeeklyPipelineMovement } from '@/lib/pipeline'
import { ensureSeeded } from '@/lib/db'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const { searchParams } = new URL(request.url)

    if (searchParams.get('weekly') === 'true') {
      const start = searchParams.get('start')
      const end = searchParams.get('end')

      if (!start || !end) {
        return NextResponse.json(
          { error: 'Missing required params: start, end (ISO dates)', code: 'MISSING_PARAMS' },
          { status: 400 }
        )
      }

      const data = getWeeklyPipelineMovement(start, end)
      return NextResponse.json({ data })
    }

    const data = getPipelineOverview()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Pipeline API error:', error)
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

export async function PATCH(): Promise<NextResponse> {
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
