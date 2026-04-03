import { NextRequest, NextResponse } from 'next/server'
import {
  getAllCapabilities,
  searchCapabilities,
  getCapabilitiesByReadiness,
  getCapabilitiesByAudience,
  getCapabilityStats,
  getPartnerEngagements,
  getContentCalendar,
  getResearchTimeline,
} from '@/lib/knowledge-graph'
import { ensureSeeded } from '@/lib/db'
import { MAX_SEARCH_LENGTH } from '@/lib/constants'
import type { Capability } from '@/types'

const VALID_READINESS: Capability['readiness'][] = ['production', 'demo', 'research']

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('search')
    const readiness = searchParams.get('readiness')
    const audience = searchParams.get('audience')

    if (query) {
      if (query.length > MAX_SEARCH_LENGTH) {
        return NextResponse.json(
          { error: 'Search query exceeds maximum length', code: 'INPUT_TOO_LONG' },
          { status: 400 }
        )
      }
      const data = searchCapabilities(query)
      return NextResponse.json({ data })
    }

    if (readiness) {
      if (!VALID_READINESS.includes(readiness as Capability['readiness'])) {
        return NextResponse.json(
          { error: 'Invalid readiness value. Must be: production, demo, or research', code: 'INVALID_READINESS' },
          { status: 400 }
        )
      }
      const data = getCapabilitiesByReadiness(readiness as Capability['readiness'])
      return NextResponse.json({ data })
    }

    if (audience) {
      if (audience.length > MAX_SEARCH_LENGTH) {
        return NextResponse.json(
          { error: 'Audience query exceeds maximum length', code: 'INPUT_TOO_LONG' },
          { status: 400 }
        )
      }
      const painPoints = audience.split(',').map((s) => s.trim()).filter(Boolean)
      const data = getCapabilitiesByAudience(painPoints)
      return NextResponse.json({ data })
    }

    const data = getAllCapabilities()
    const stats = getCapabilityStats()
    const engagements = getPartnerEngagements()
    const timeline = getResearchTimeline()
    const contentCalendar = getContentCalendar()

    return NextResponse.json({ data, stats, engagements, timeline, contentCalendar })
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
