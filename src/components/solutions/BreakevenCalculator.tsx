'use client'

import { type FC } from 'react'
import { Badge } from '@/components/ui/Badge'
import { PRICING_GRID, ENGAGEMENT_TIERS } from '@/lib/constants'
import type { EngagementTier } from '@/lib/constants'
import { formatCurrency } from '@/lib/exports'

interface BreakevenCalculatorProps {
  modelFamilyName: string
  saeCost: number
  breakeven: { engagementsNeeded: number; note: string }
}

const TIER_LABELS: Record<EngagementTier, string> = {
  simple: 'Simple',
  standard: 'Standard',
  complex: 'Complex',
  critical: 'Critical',
}

function getRecommendation(engagementsNeeded: number): {
  label: string
  variant: 'green' | 'amber' | 'gray'
  description: string
} {
  if (engagementsNeeded <= 5) {
    return {
      label: 'GO',
      variant: 'green',
      description: 'Recoverable within a small number of engagements. SAE investment is justified.',
    }
  }
  if (engagementsNeeded <= 10) {
    return {
      label: 'WAIT',
      variant: 'amber',
      description: 'Moderate number of engagements required. Build pipeline before committing.',
    }
  }
  return {
    label: 'INSUFFICIENT DATA',
    variant: 'gray',
    description: 'High number of engagements required to break even. Defer until demand materializes.',
  }
}

export const BreakevenCalculator: FC<BreakevenCalculatorProps> = ({
  modelFamilyName,
  saeCost,
  breakeven,
}) => {
  const recommendation = getRecommendation(breakeven.engagementsNeeded)

  // Per-tier breakeven calculations
  const tierBreakdowns = ENGAGEMENT_TIERS.map((tier) => {
    const grid = PRICING_GRID[tier]
    const midpoint = (grid.low + grid.high) / 2
    // Estimate margin at ~55% of midpoint (cost is ~45%)
    const estimatedMargin = midpoint * 0.55
    const engagements = estimatedMargin > 0 ? Math.ceil(saeCost / estimatedMargin) : 0

    return { tier, engagements }
  })

  return (
    <div className="space-y-4">
      <h3 className="text-xs uppercase tracking-wider text-text-secondary font-medium">
        SAE Investment Breakeven &mdash; {modelFamilyName}
      </h3>

      <div className="rounded-md bg-base px-4 py-4 space-y-4">
        {/* SAE cost */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">SAE Training Cost</span>
          <span className="font-mono text-sm font-semibold text-text-primary">
            {formatCurrency(saeCost)}
          </span>
        </div>

        {/* Per-tier breakeven table */}
        <div>
          <span className="text-xs text-text-tertiary block mb-2">Engagements to break even:</span>
          <div className="grid grid-cols-4 gap-2">
            {tierBreakdowns.map(({ tier, engagements }) => (
              <div key={tier} className="rounded bg-surface border border-border-subtle px-3 py-2 text-center">
                <span className="block text-xs text-text-tertiary mb-1">{TIER_LABELS[tier]}</span>
                <span className="block font-mono text-sm font-medium text-text-primary">
                  {engagements}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-text-tertiary">{breakeven.note}</p>

        {/* Recommendation */}
        <div className="border-t border-border-subtle pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">Recommendation</span>
            <Badge variant={recommendation.variant}>{recommendation.label}</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">{recommendation.description}</p>
        </div>
      </div>
    </div>
  )
}
