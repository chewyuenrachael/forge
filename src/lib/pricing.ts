import { getDb } from './db'
import { PRICING_GRID, SAE_TRAINING_COST } from '@/lib/constants'
import type { EngagementTier, ModelFamilyTier } from '@/lib/constants'

// ─── Types ───────────────────────────────────────────────────────────

interface ClassifyInput {
  modelFamilyId: string
  useCaseCount: number
  regulatoryRequirements: string[]
  deploymentContext: 'production' | 'pre-deployment' | 'research'
}

interface ClassifyResult {
  tier: EngagementTier
  priceRange: { low: number; high: number }
  durationDays: number
  rationale: string
  costToDeliver: number
  marginRange: { low: number; high: number }
  saeCostIfNeeded: number
  breakeven: { engagementsNeeded: number; note: string } | null
}

interface EngagementROIInput {
  pipelineValue: number
  costToDeliver: number
  model_family_id: string
}

interface EngagementROIResult {
  margin: number
  marginPct: number
  saeCostAllocation: number
  netMargin: number
  netMarginPct: number
}

interface PricingSummary {
  totalPipelineValue: number
  totalCostToDeliver: number
  overallMarginPct: number
  byTier: { tier: EngagementTier; count: number; totalValue: number; avgMargin: number }[]
  byModelFamily: { modelFamilyId: string; engagementCount: number; totalValue: number; saeInvestment: number; roi: number }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getModelFamilyTier(modelFamilyId: string): ModelFamilyTier | null {
  const db = getDb()
  const row = db.prepare('SELECT tier FROM model_families WHERE id = ?').get(modelFamilyId) as { tier: string } | undefined
  if (!row) return null
  return row.tier as ModelFamilyTier
}

function getCostToDeliver(tier: EngagementTier): number {
  const db = getDb()
  const row = db.prepare('SELECT cost_to_deliver FROM engagement_tiers WHERE id = ?').get(tier) as { cost_to_deliver: number } | undefined
  if (row) return row.cost_to_deliver

  // Fallback: estimate as ~40-50% of midpoint price
  const grid = PRICING_GRID[tier]
  return Math.round((grid.low + grid.high) / 2 * 0.45)
}

// ─── Tier Classification ─────────────────────────────────────────────

/**
 * Classify an engagement into a pricing tier based on model family,
 * use cases, regulatory context, and deployment environment.
 * Returns full pricing breakdown including margin and SAE cost analysis.
 */
export function classifyEngagementTier(input: ClassifyInput): ClassifyResult {
  const modelTier = getModelFamilyTier(input.modelFamilyId)
  const hasRegulatory = input.regulatoryRequirements.length > 0
  const isFrontierSafety = input.regulatoryRequirements.some((r) =>
    r.toLowerCase().includes('frontier') || r.toLowerCase().includes('national security') || r.toLowerCase().includes('defense')
  )
  const isScientificDiscovery = input.regulatoryRequirements.some((r) =>
    r.toLowerCase().includes('scientific discovery')
  )

  // Determine tier
  let tier: EngagementTier

  if (isFrontierSafety || isScientificDiscovery) {
    tier = 'critical'
  } else if (
    modelTier === 'tier_b' || modelTier === 'tier_c' ||
    (hasRegulatory && input.deploymentContext === 'production') ||
    input.useCaseCount >= 4
  ) {
    tier = 'complex'
  } else if (
    input.useCaseCount >= 2 ||
    (input.deploymentContext === 'production' && hasRegulatory)
  ) {
    tier = 'standard'
  } else if (
    (modelTier === 'tier_a' || modelTier === null) &&
    input.useCaseCount === 1 &&
    !hasRegulatory
  ) {
    tier = 'simple'
  } else {
    tier = 'standard'
  }

  const grid = PRICING_GRID[tier]
  const costToDeliver = getCostToDeliver(tier)

  // Margin range
  const marginLow = grid.low > 0 ? Math.round((grid.low - costToDeliver) / grid.low * 100) : 0
  const marginHigh = grid.high > 0 ? Math.round((grid.high - costToDeliver) / grid.high * 100) : 0

  // SAE cost
  const effectiveTier = modelTier ?? 'tier_a'
  const saeCost = SAE_TRAINING_COST[effectiveTier]

  // Breakeven (only for Tier C models that need SAE training)
  let breakeven: ClassifyResult['breakeven'] = null
  if (saeCost > 0) {
    const avgPrice = (grid.low + grid.high) / 2
    const avgMargin = avgPrice - costToDeliver
    const engagementsNeeded = avgMargin > 0 ? Math.ceil(saeCost / avgMargin) : 0
    breakeven = {
      engagementsNeeded,
      note: `Requires ${engagementsNeeded} engagement${engagementsNeeded !== 1 ? 's' : ''} at average margin to recoup $${(saeCost / 1000000).toFixed(1)}M SAE training investment`,
    }
  }

  // Rationale
  const reasons: string[] = []
  if (modelTier) reasons.push(`Model family is ${modelTier.replace('_', ' ')}`)
  else reasons.push('Model family not found in registry')
  reasons.push(`${input.useCaseCount} use case${input.useCaseCount !== 1 ? 's' : ''}`)
  if (hasRegulatory) reasons.push(`Regulatory: ${input.regulatoryRequirements.join(', ')}`)
  reasons.push(`Deployment: ${input.deploymentContext}`)
  const rationale = `Classified as ${tier}. ${reasons.join('. ')}.`

  return {
    tier,
    priceRange: { low: grid.low, high: grid.high },
    durationDays: grid.days,
    rationale,
    costToDeliver,
    marginRange: { low: marginLow, high: marginHigh },
    saeCostIfNeeded: saeCost,
    breakeven,
  }
}

// ─── Engagement ROI ──────────────────────────────────────────────────

/**
 * Calculate ROI for a single engagement, including SAE cost allocation.
 * SAE training cost is distributed evenly across all engagements on the same model family.
 */
export function calculateEngagementROI(engagement: EngagementROIInput): EngagementROIResult {
  const margin = engagement.pipelineValue - engagement.costToDeliver
  const marginPct = engagement.pipelineValue > 0
    ? Math.round((margin / engagement.pipelineValue) * 100 * 10) / 10
    : 0

  // Determine SAE cost allocation
  const modelTier = getModelFamilyTier(engagement.model_family_id)
  const effectiveTier = modelTier ?? 'tier_a'
  const saeCost = SAE_TRAINING_COST[effectiveTier]

  let saeCostAllocation = 0
  if (saeCost > 0) {
    const db = getDb()
    const countRow = db.prepare(
      'SELECT COUNT(*) as cnt FROM engagements WHERE model_family_id = ?'
    ).get(engagement.model_family_id) as { cnt: number }
    const engagementCount = Math.max(countRow.cnt, 1)
    saeCostAllocation = Math.round(saeCost / engagementCount)
  }

  const netMargin = margin - saeCostAllocation
  const netMarginPct = engagement.pipelineValue > 0
    ? Math.round((netMargin / engagement.pipelineValue) * 100 * 10) / 10
    : 0

  return {
    margin,
    marginPct,
    saeCostAllocation,
    netMargin,
    netMarginPct,
  }
}

// ─── Pricing Summary ─────────────────────────────────────────────────

/**
 * Aggregate pricing metrics across all engagements.
 * Includes breakdown by tier and by model family with SAE investment ROI.
 */
export function getPricingSummary(): PricingSummary {
  const db = getDb()

  // Totals
  const totalsRow = db.prepare(
    'SELECT COALESCE(SUM(pipeline_value), 0) as total_value, COALESCE(SUM(cost_to_deliver), 0) as total_cost FROM engagements'
  ).get() as { total_value: number; total_cost: number }

  const totalPipelineValue = totalsRow.total_value
  const totalCostToDeliver = totalsRow.total_cost
  const overallMarginPct = totalPipelineValue > 0
    ? Math.round((totalPipelineValue - totalCostToDeliver) / totalPipelineValue * 100 * 10) / 10
    : 0

  // By tier
  const tierRows = db.prepare(
    `SELECT engagement_tier, COUNT(*) as count,
       COALESCE(SUM(pipeline_value), 0) as total_value,
       COALESCE(AVG(margin_pct), 0) as avg_margin
     FROM engagements GROUP BY engagement_tier`
  ).all() as { engagement_tier: string; count: number; total_value: number; avg_margin: number }[]

  const byTier = tierRows.map((row) => ({
    tier: row.engagement_tier as EngagementTier,
    count: row.count,
    totalValue: row.total_value,
    avgMargin: Math.round(row.avg_margin * 10) / 10,
  }))

  // By model family
  const familyRows = db.prepare(
    `SELECT model_family_id, COUNT(*) as count,
       COALESCE(SUM(pipeline_value), 0) as total_value
     FROM engagements WHERE model_family_id IS NOT NULL
     GROUP BY model_family_id`
  ).all() as { model_family_id: string; count: number; total_value: number }[]

  const byModelFamily = familyRows.map((row) => {
    const tier = getModelFamilyTier(row.model_family_id)
    const effectiveTier = tier ?? 'tier_a'
    const saeInvestment = SAE_TRAINING_COST[effectiveTier]
    const roi = saeInvestment > 0
      ? Math.round((row.total_value - saeInvestment) / saeInvestment * 100 * 10) / 10
      : 0

    return {
      modelFamilyId: row.model_family_id,
      engagementCount: row.count,
      totalValue: row.total_value,
      saeInvestment,
      roi,
    }
  })

  return {
    totalPipelineValue,
    totalCostToDeliver,
    overallMarginPct,
    byTier,
    byModelFamily,
  }
}
