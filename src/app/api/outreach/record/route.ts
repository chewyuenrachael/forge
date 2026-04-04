import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/db'
import { recordOutreach } from '@/lib/outreach'
import { MAX_INPUT_LENGTH } from '@/lib/constants'
import type { GeneratedOutreach } from '@/lib/outreach'

// ─── Validation ────────────────────────────────────────────────────────

interface RecordInput {
  prospectId: string
  signalId: string
  outreach: GeneratedOutreach
}

function validateBody(body: unknown): { valid: true; data: RecordInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' }
  }

  const obj = body as Record<string, unknown>

  if (typeof obj['prospectId'] !== 'string' || obj['prospectId'].length === 0 || obj['prospectId'].length > MAX_INPUT_LENGTH) {
    return { valid: false, error: 'Invalid or missing prospectId' }
  }
  if (typeof obj['signalId'] !== 'string' || obj['signalId'].length === 0 || obj['signalId'].length > MAX_INPUT_LENGTH) {
    return { valid: false, error: 'Invalid or missing signalId' }
  }

  const outreach = obj['outreach']
  if (!outreach || typeof outreach !== 'object') {
    return { valid: false, error: 'Missing or invalid outreach object' }
  }

  const o = outreach as Record<string, unknown>
  if (typeof o['subject'] !== 'string' || typeof o['body'] !== 'string' || typeof o['audience'] !== 'string') {
    return { valid: false, error: 'Outreach must include subject, body, and audience' }
  }

  return {
    valid: true,
    data: {
      prospectId: obj['prospectId'] as string,
      signalId: obj['signalId'] as string,
      outreach: outreach as unknown as GeneratedOutreach,
    },
  }
}

// ─── POST /api/outreach/record ─────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()

    const body: unknown = await request.json()
    const validation = validateBody(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const { prospectId, signalId, outreach } = validation.data

    try {
      recordOutreach(prospectId, outreach, signalId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      if (message.includes('not found')) {
        return NextResponse.json(
          { error: message, code: 'NOT_FOUND' },
          { status: 404 }
        )
      }
      throw err
    }

    return NextResponse.json({ data: { recorded: true } })
  } catch (error) {
    console.error('Outreach record API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ─── Reject unsupported methods ────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
