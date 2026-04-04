import { NextRequest, NextResponse } from 'next/server'
import { classifyEngagementTier, getPricingSummary } from '@/lib/pricing'
import { ensureSeeded, getDb } from '@/lib/db'
import { PRICING_GRID, SAE_TRAINING_COST } from '@/lib/constants'
import type { EngagementTier, ModelFamilyTier } from '@/lib/constants'

interface BreakevenByTier {
  tier: EngagementTier
  engagementsNeeded: number
  averageMargin: number
}

interface BreakevenResponse {
  modelFamilyId: string
  modelFamilyName: string
  saeCost: number
  byTier: BreakevenByTier[]
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const { searchParams } = new URL(request.url)

    if (searchParams.get('summary') === 'true') {
      const data = getPricingSummary()
      return NextResponse.json({ data })
    }

    if (searchParams.get('breakeven') === 'true') {
      const modelFamily = searchParams.get('modelFamily')
      if (!modelFamily) {
        return NextResponse.json(
          { error: 'modelFamily query parameter is required', code: 'MISSING_PARAMS' },
          { status: 400 }
        )
      }

      const db = getDb()
      const row = db.prepare('SELECT id, name, tier FROM model_families WHERE id = ?').get(modelFamily) as
        { id: string; name: string; tier: string } | undefined

      if (!row) {
        return NextResponse.json(
          { error: 'Model family not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      const saeCost = SAE_TRAINING_COST[row.tier as ModelFamilyTier] ?? 0

      const tiers: EngagementTier[] = ['simple', 'standard', 'complex', 'critical']
      const byTier: BreakevenByTier[] = tiers.map((tier) => {
        const grid = PRICING_GRID[tier]
        const midpoint = (grid.low + grid.high) / 2
        const estimatedMargin = midpoint * 0.55
        const engagementsNeeded = saeCost > 0 && estimatedMargin > 0
          ? Math.ceil(saeCost / estimatedMargin)
          : 0

        return { tier, engagementsNeeded, averageMargin: Math.round(estimatedMargin) }
      })

      const data: BreakevenResponse = {
        modelFamilyId: row.id,
        modelFamilyName: row.name,
        saeCost,
        byTier,
      }
      return NextResponse.json({ data })
    }

    return NextResponse.json(
      { error: 'Use ?summary=true, ?breakeven=true&modelFamily=ID, or POST to classify a tier', code: 'MISSING_PARAMS' },
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
