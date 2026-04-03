import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/db'
import { getAllProposals, saveProposal } from '@/lib/proposals'
import { MAX_INPUT_LENGTH } from '@/lib/constants'

export async function GET(): Promise<NextResponse> {
  try {
    ensureSeeded()
    const data = getAllProposals()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Proposals GET error:', error)
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

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { error: 'Request body must be a JSON object', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const b = body as Record<string, unknown>

    if (typeof b.partner_name !== 'string' || b.partner_name.trim().length === 0 || b.partner_name.trim().length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { error: 'partner_name is required (1-500 chars)', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (typeof b.intake_data !== 'object' || !b.intake_data) {
      return NextResponse.json(
        { error: 'intake_data is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (!Array.isArray(b.matches)) {
      return NextResponse.json(
        { error: 'matches must be an array', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (typeof b.simulation !== 'object' || !b.simulation) {
      return NextResponse.json(
        { error: 'simulation is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const proposal = saveProposal({
      partner_name: (b.partner_name as string).trim(),
      intake_data: b.intake_data as Parameters<typeof saveProposal>[0]['intake_data'],
      matches: b.matches as Parameters<typeof saveProposal>[0]['matches'],
      simulation: b.simulation as Parameters<typeof saveProposal>[0]['simulation'],
    })

    return NextResponse.json({ data: proposal }, { status: 201 })
  } catch (error) {
    console.error('Proposals POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, { status: 405 })
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, { status: 405 })
}
