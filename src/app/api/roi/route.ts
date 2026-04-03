import { NextRequest, NextResponse } from 'next/server'
import { calculateROI } from '@/lib/roi-engine'
import type { ROIInput } from '@/types'

const VALID_EXPOSURES = ['eu_ai_act', 'sr_11_7', 'fda', 'none'] as const
const MAX_SPEND = 10_000_000

function validateROIInput(body: unknown): { valid: true; input: ROIInput } | { valid: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Request body must be a JSON object' }
  }

  const b = body as Record<string, unknown>

  const numericFields: Array<{ key: string; max?: number }> = [
    { key: 'currentHallucinationRate', max: 100 },
    { key: 'monthlyInferenceSpend', max: MAX_SPEND },
    { key: 'monthlyAnnotationSpend', max: MAX_SPEND },
    { key: 'monthlyGuardrailSpend', max: MAX_SPEND },
    { key: 'monthlyReasoningTokens', max: MAX_SPEND },
    { key: 'complianceDeadlineMonths', max: 120 },
  ]

  for (const field of numericFields) {
    const val = b[field.key]
    if (typeof val !== 'number' || !isFinite(val) || val < 0) {
      return { valid: false, error: `${field.key} must be a non-negative number` }
    }
    if (field.max !== undefined && val > field.max) {
      return { valid: false, error: `${field.key} exceeds maximum value of ${field.max}` }
    }
  }

  if (typeof b.usesReasoningModels !== 'boolean') {
    return { valid: false, error: 'usesReasoningModels must be a boolean' }
  }

  if (!Array.isArray(b.regulatoryExposure)) {
    return { valid: false, error: 'regulatoryExposure must be an array' }
  }

  for (const exp of b.regulatoryExposure) {
    if (!VALID_EXPOSURES.includes(exp as typeof VALID_EXPOSURES[number])) {
      return { valid: false, error: `Invalid regulatory exposure value: ${String(exp)}` }
    }
  }

  return {
    valid: true,
    input: {
      currentHallucinationRate: b.currentHallucinationRate as number,
      monthlyInferenceSpend: b.monthlyInferenceSpend as number,
      monthlyAnnotationSpend: b.monthlyAnnotationSpend as number,
      monthlyGuardrailSpend: b.monthlyGuardrailSpend as number,
      usesReasoningModels: b.usesReasoningModels as boolean,
      monthlyReasoningTokens: b.monthlyReasoningTokens as number,
      regulatoryExposure: b.regulatoryExposure as ROIInput['regulatoryExposure'],
      complianceDeadlineMonths: b.complianceDeadlineMonths as number,
    },
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json()
    const validation = validateROIInput(body)

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    const result = calculateROI(validation.input)
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('ROI API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with ROI input data.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
