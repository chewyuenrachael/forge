import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/db'
import { getProposalById, deleteProposal } from '@/lib/proposals'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    ensureSeeded()
    const proposal = getProposalById(params.id)

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: proposal })
  } catch (error) {
    console.error('Proposal GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
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
    const deleted = deleteProposal(params.id)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Proposal not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('Proposal DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, { status: 405 })
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, { status: 405 })
}

export async function PATCH(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, { status: 405 })
}
