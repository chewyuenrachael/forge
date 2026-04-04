'use client'

import { type FC } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/exports'

interface MarginAnalysisProps {
  priceRange: { low: number; high: number }
  costToDeliver: number
  saeCostIfNeeded: number
}

function marginVariant(avgMarginPct: number): 'green' | 'amber' | 'red' {
  if (avgMarginPct >= 40) return 'green'
  if (avgMarginPct >= 25) return 'amber'
  return 'red'
}

export const MarginAnalysis: FC<MarginAnalysisProps> = ({
  priceRange,
  costToDeliver,
  saeCostIfNeeded,
}) => {
  const marginLow = priceRange.low - costToDeliver
  const marginHigh = priceRange.high - costToDeliver
  const marginPctLow = priceRange.low > 0 ? Math.round((marginLow / priceRange.low) * 100) : 0
  const marginPctHigh = priceRange.high > 0 ? Math.round((marginHigh / priceRange.high) * 100) : 0
  const avgMarginPct = Math.round((marginPctLow + marginPctHigh) / 2)

  return (
    <div className="space-y-4">
      <h3 className="text-xs uppercase tracking-wider text-text-secondary font-medium">
        Deal Economics
      </h3>

      <div className="rounded-md bg-base px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Revenue Range</span>
          <span className="font-mono text-sm text-[#3D6B35]">
            {formatCurrency(priceRange.low)} &ndash; {formatCurrency(priceRange.high)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Cost to Deliver</span>
          <span className="font-mono text-sm text-text-secondary">
            {formatCurrency(costToDeliver)}
          </span>
        </div>
        <div className="border-t border-border-subtle my-1" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">Gross Margin</span>
          <span className="font-mono text-sm font-semibold text-text-primary">
            {formatCurrency(marginLow)} &ndash; {formatCurrency(marginHigh)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Margin %</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-text-primary">
              {marginPctLow}% &ndash; {marginPctHigh}%
            </span>
            <Badge variant={marginVariant(avgMarginPct)} size="sm">
              {avgMarginPct >= 40 ? 'Healthy' : avgMarginPct >= 25 ? 'Moderate' : 'Thin'}
            </Badge>
          </div>
        </div>
      </div>

      {saeCostIfNeeded > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-[#EDE0C8] bg-[#EDE0C8]/30 px-4 py-3">
          <AlertTriangle size={16} className="text-[#8A6B20] mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-sm font-medium text-[#8A6B20]">SAE Training Required</span>
            <p className="text-xs text-[#8A6B20]/80 mt-0.5">
              Additional investment: {formatCurrency(saeCostIfNeeded)}. See breakeven analysis below.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
