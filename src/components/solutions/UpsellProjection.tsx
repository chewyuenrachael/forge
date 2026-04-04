'use client'

import { type FC } from 'react'
import { ArrowDown } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { PRICING_GRID } from '@/lib/constants'
import type { EngagementTier } from '@/lib/constants'
import { formatCurrency } from '@/lib/exports'

interface UpsellProjectionProps {
  currentTier: EngagementTier
  priceRange: { low: number; high: number }
}

const TIER_UPGRADE_PATH: Record<EngagementTier, EngagementTier | null> = {
  simple: 'standard',
  standard: 'complex',
  complex: 'critical',
  critical: null,
}

const TIER_LABELS: Record<EngagementTier, string> = {
  simple: 'Simple Assessment',
  standard: 'Standard Assessment',
  complex: 'Complex Engagement',
  critical: 'Critical Engagement',
}

// From research: 60% Tier 1 → Tier 2 conversion rate
const UPSELL_PROBABILITY = 0.6
// Monitoring adoption: 40% probability, $200K-$300K/year
const MONITORING_PROBABILITY = 0.4
const MONITORING_ANNUAL = { low: 200000, high: 300000 }
const MONITORING_YEARS = 2

export const UpsellProjection: FC<UpsellProjectionProps> = ({
  currentTier,
  priceRange,
}) => {
  const nextTier = TIER_UPGRADE_PATH[currentTier]
  const currentMid = (priceRange.low + priceRange.high) / 2

  if (!nextTier) {
    return (
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-text-secondary font-medium">
          Customer Lifetime Value Projection
        </h3>
        <div className="rounded-md bg-base px-4 py-6 text-center">
          <span className="text-sm text-text-secondary">
            Maximum engagement tier. Focus on renewal, monitoring deployment, and expansion within the account.
          </span>
        </div>
      </div>
    )
  }

  const nextGrid = PRICING_GRID[nextTier]
  const nextMid = (nextGrid.low + nextGrid.high) / 2
  const monitoringMid = (MONITORING_ANNUAL.low + MONITORING_ANNUAL.high) / 2

  // Expected values
  const tier2Expected = UPSELL_PROBABILITY * nextMid
  const monitoringExpected = MONITORING_PROBABILITY * monitoringMid * MONITORING_YEARS

  const ltvLow = priceRange.low + (UPSELL_PROBABILITY * nextGrid.low) + (MONITORING_PROBABILITY * MONITORING_ANNUAL.low * MONITORING_YEARS)
  const ltvHigh = priceRange.high + (UPSELL_PROBABILITY * nextGrid.high) + (MONITORING_PROBABILITY * MONITORING_ANNUAL.high * MONITORING_YEARS)
  // ltvMid available for future tooltip detail: currentMid + tier2Expected + monitoringExpected

  const multiplierLow = priceRange.low > 0 ? (ltvLow / priceRange.low).toFixed(1) : '0'
  const multiplierHigh = priceRange.high > 0 ? (ltvHigh / priceRange.high).toFixed(1) : '0'

  return (
    <div className="space-y-4">
      <h3 className="text-xs uppercase tracking-wider text-text-secondary font-medium">
        Customer Lifetime Value Projection
      </h3>

      <div className="rounded-md bg-base px-4 py-4 space-y-3">
        {/* Current tier */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="amber" size="sm">Current</Badge>
            <span className="text-sm text-text-primary">{TIER_LABELS[currentTier]}</span>
          </div>
          <span className="font-mono text-sm text-text-primary">
            {formatCurrency(priceRange.low)} &ndash; {formatCurrency(priceRange.high)}
          </span>
        </div>

        {/* Arrow */}
        <div className="flex items-center gap-2 pl-6">
          <ArrowDown size={14} className="text-text-tertiary" />
          <span className="text-xs text-text-tertiary font-mono">
            {Math.round(UPSELL_PROBABILITY * 100)}% probability
          </span>
        </div>

        {/* Next tier */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="blue" size="sm">Upsell</Badge>
            <span className="text-sm text-text-primary">{TIER_LABELS[nextTier]}</span>
          </div>
          <span className="font-mono text-sm text-text-secondary">
            {formatCurrency(nextGrid.low)} &ndash; {formatCurrency(nextGrid.high)}
          </span>
        </div>

        {/* Arrow */}
        <div className="flex items-center gap-2 pl-6">
          <ArrowDown size={14} className="text-text-tertiary" />
          <span className="text-xs text-text-tertiary font-mono">
            {Math.round(MONITORING_PROBABILITY * 100)}% probability
          </span>
        </div>

        {/* Monitoring */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="purple" size="sm">Monitoring</Badge>
            <span className="text-sm text-text-primary">Annual Recurring</span>
          </div>
          <span className="font-mono text-sm text-text-secondary">
            {formatCurrency(MONITORING_ANNUAL.low)} &ndash; {formatCurrency(MONITORING_ANNUAL.high)}/yr
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border-subtle pt-3 mt-3 space-y-2">
          {/* Calculation breakdown */}
          <div className="text-xs text-text-tertiary space-y-1">
            <div className="flex justify-between">
              <span>Current deal (midpoint)</span>
              <span className="font-mono">{formatCurrency(currentMid)}</span>
            </div>
            <div className="flex justify-between">
              <span>+ Expected upsell ({Math.round(UPSELL_PROBABILITY * 100)}% &times; {formatCurrency(nextMid)})</span>
              <span className="font-mono">{formatCurrency(tier2Expected)}</span>
            </div>
            <div className="flex justify-between">
              <span>+ Expected monitoring ({Math.round(MONITORING_PROBABILITY * 100)}% &times; {formatCurrency(monitoringMid)}/yr &times; {MONITORING_YEARS}yr)</span>
              <span className="font-mono">{formatCurrency(monitoringExpected)}</span>
            </div>
          </div>

          {/* LTV total */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium text-text-primary">Expected LTV (24 months)</span>
            <span className="font-mono text-lg font-semibold text-accent-amber">
              {formatCurrency(ltvLow)} &ndash; {formatCurrency(ltvHigh)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">LTV / Initial Deal</span>
            <span className="font-mono text-sm text-text-secondary">
              {multiplierLow}x &ndash; {multiplierHigh}x
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
