import { NextRequest, NextResponse } from 'next/server'
import { getAllCapabilities, searchCapabilities } from '@/lib/knowledge-graph'
import { MAX_SEARCH_LENGTH } from '@/lib/constants'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('search')

    if (query && query.length > MAX_SEARCH_LENGTH) {
      return NextResponse.json(
        { error: 'Search query exceeds maximum length', code: 'INPUT_TOO_LONG' },
        { status: 400 }
      )
    }

    const data = query ? searchCapabilities(query) : getAllCapabilities()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Knowledge API error:', error)
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
