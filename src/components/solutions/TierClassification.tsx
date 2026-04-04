'use client'

import { type FC } from 'react'
import { RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PRICING_GRID, ENGAGEMENT_TIERS } from '@/lib/constants'
import type { EngagementTier } from '@/lib/constants'
import { formatCurrency } from '@/lib/exports'

interface TierClassificationProps {
  recommendedTier: EngagementTier
  activeTier: EngagementTier
  rationale: string
  onOverride: (tier: EngagementTier) => void
  onReset: () => void
  isOverridden: boolean
}

const TIER_LABELS: Record<EngagementTier, string> = {
  simple: 'Simple',
  standard: 'Standard',
  complex: 'Complex',
  critical: 'Critical',
}

export const TierClassification: FC<TierClassificationProps> = ({
  recommendedTier,
  activeTier,
  rationale,
  onOverride,
  onReset,
  isOverridden,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-text-secondary font-medium">
          Tier Classification
        </h3>
        {isOverridden && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw size={12} className="mr-1" /> Reset to Recommended
          </Button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {ENGAGEMENT_TIERS.map((tier) => {
          const grid = PRICING_GRID[tier]
          const isActive = tier === activeTier
          const isRecommended = tier === recommendedTier

          return (
            <button
              key={tier}
              type="button"
              onClick={() => onOverride(tier)}
              className={`relative rounded-md border p-3 text-left transition-all duration-150 ${
                isActive
                  ? 'border-accent-amber border-2 bg-surface'
                  : 'border-border-subtle bg-surface opacity-60 hover:opacity-80 hover:bg-elevated'
              }`}
            >
              <span className="block text-sm font-semibold text-text-primary mb-1">
                {TIER_LABELS[tier]}
              </span>
              <span className="block font-mono text-xs text-accent-amber mb-1">
                {formatCurrency(grid.low)} &ndash; {formatCurrency(grid.high)}
              </span>
              <span className="block text-xs text-text-tertiary mb-2">
                {grid.days} days
              </span>
              <span className="block text-[10px] text-text-tertiary leading-tight">
                {grid.description}
              </span>

              {isActive && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                  <Badge variant={isOverridden && isRecommended ? 'gray' : 'amber'} size="sm">
                    {isOverridden ? 'SELECTED' : 'RECOMMENDED'}
                  </Badge>
                </div>
              )}
              {isOverridden && isRecommended && !isActive && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                  <Badge variant="gray" size="sm">AUTO</Badge>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-6 border-l-[3px] border-accent-amber pl-4">
        <p className="text-sm text-text-secondary leading-relaxed">{rationale}</p>
      </div>
    </div>
  )
}
