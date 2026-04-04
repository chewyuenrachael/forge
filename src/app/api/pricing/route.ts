import { NextRequest, NextResponse } from 'next/server'
import { classifyEngagementTier, getPricingSummary } from '@/lib/pricing'
import { ensureSeeded } from '@/lib/db'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const { searchParams } = new URL(request.url)

    if (searchParams.get('summary') === 'true') {
      const data = getPricingSummary()
      return NextResponse.json({ data })
    }

    return NextResponse.json(
      { error: 'Use ?summary=true or POST to classify a tier', code: 'MISSING_PARAMS' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Pricing API error:', error)
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

    const modelFamilyId = body['modelFamilyId'] as string | undefined
    const useCaseCount = body['useCaseCount'] as number | undefined
    const regulatoryRequirements = body['regulatoryRequirements'] as string[] | undefined
    const deploymentContext = body['deploymentContext'] as string | undefined

    if (!modelFamilyId || useCaseCount === undefined || !deploymentContext) {
      return NextResponse.json(
        { error: 'Missing required fields: modelFamilyId, useCaseCount, deploymentContext', code: 'MISSING_FIELDS' },
        { status: 400 }
      )
    }

    if (!['production', 'pre-deployment', 'research'].includes(deploymentContext)) {
      return NextResponse.json(
        { error: 'deploymentContext must be production, pre-deployment, or research', code: 'INVALID_CONTEXT' },
        { status: 400 }
      )
    }

    const data = classifyEngagementTier({
      modelFamilyId,
      useCaseCount,
      regulatoryRequirements: regulatoryRequirements ?? [],
      deploymentContext: deploymentContext as 'production' | 'pre-deployment' | 'research',
    })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Pricing POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
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
