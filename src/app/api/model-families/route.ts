import { NextRequest, NextResponse } from 'next/server'
import { getAllModelFamilies, getModelFamilyCoverage } from '@/lib/knowledge-graph'
import { ensureSeeded } from '@/lib/db'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const { searchParams } = new URL(request.url)

    if (searchParams.get('coverage') === 'true') {
      const data = getModelFamilyCoverage()
      return NextResponse.json({ data })
    }

    const data = getAllModelFamilies()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Model Families API error:', error)
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
