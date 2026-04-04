import { NextRequest, NextResponse } from 'next/server'
import { getAllChannelPartners, getChannelPartnerById, createChannelPartner, updateChannelPartner, getChannelMetrics } from '@/lib/channels'
import { ensureSeeded } from '@/lib/db'
import type { ChannelPartner } from '@/types'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const { searchParams } = new URL(request.url)

    if (searchParams.get('metrics') === 'true') {
      const data = getChannelMetrics()
      return NextResponse.json({ data })
    }

    const id = searchParams.get('id')
    if (id) {
      const data = getChannelPartnerById(id)
      if (!data) {
        return NextResponse.json(
          { error: 'Channel partner not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }
      return NextResponse.json({ data })
    }

    const data = getAllChannelPartners()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Channels API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const body = await request.json() as Record<string, unknown>

    const name = body['name'] as string | undefined
    const type = body['type'] as string | undefined
    const relationshipStatus = body['relationship_status'] as string | undefined

    if (!name || !type || !relationshipStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, relationship_status', code: 'MISSING_FIELDS' },
        { status: 400 }
      )
    }

    const data = createChannelPartner({
      name,
      type: type as ChannelPartner['type'],
      relationship_status: relationshipStatus as ChannelPartner['relationship_status'],
      primary_contact: (body['primary_contact'] as ChannelPartner['primary_contact']) ?? null,
      client_portfolio_overlap: (body['client_portfolio_overlap'] as number) ?? 0,
      estimated_annual_revenue: (body['estimated_annual_revenue'] as number) ?? 0,
      certified_engineers: (body['certified_engineers'] as number) ?? 0,
      notes: (body['notes'] as string) ?? null,
    })
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Channels POST error:', error)
    return NextResponse.json(
      { error: message, code: 'CREATE_ERROR' },
      { status: 400 }
    )
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const body = await request.json() as Record<string, unknown>
    const id = body['id'] as string | undefined

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id', code: 'MISSING_ID' },
        { status: 400 }
      )
    }

    const data = updateChannelPartner(id, body as Partial<ChannelPartner>)
    if (!data) {
      return NextResponse.json(
        { error: 'Channel partner not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Channels PATCH error:', error)
    return NextResponse.json(
      { error: message, code: 'UPDATE_ERROR' },
      { status: 400 }
    )
  }
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
