'use client'

import { type FC } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { ModelFamilyTier, EngagementTier } from '@/lib/constants'

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

interface BreakevenByTier {
  tier: EngagementTier
  averageMargin: number
  engagementsNeeded: number
}

export interface BreakevenRow {
  modelFamilyId: string
  modelName: string
  tier: ModelFamilyTier
  saeCost: number
  byEngagementTier: BreakevenByTier[]
}

interface BreakevenMatrixProps {
  rows: BreakevenRow[]
}

const TIER_BADGE: Record<string, BadgeVariant> = {
  tier_a: 'green',
  tier_b: 'amber',
  tier_c: 'purple',
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

function countColor(count: number): string {
  if (count <= 4) return 'text-accent-green'
  if (count <= 8) return 'text-accent-amber'
  return 'text-accent-red'
}

const ENGAGEMENT_TIER_LABELS: Record<EngagementTier, string> = {
  simple: 'Simple',
  standard: 'Standard',
  complex: 'Complex',
  critical: 'Critical',
}

export const BreakevenMatrix: FC<BreakevenMatrixProps> = ({ rows }) => {
  if (rows.length === 0) {
    return (
      <Card header="Breakeven Matrix">
        <p className="text-sm text-text-tertiary">No Tier B/C models to analyze.</p>
      </Card>
    )
  }

  return (
    <Card header="Breakeven Matrix">
      <p className="mb-4 text-xs text-text-secondary">
        Engagements needed to recoup SAE training investment (assumes 55% margin on midpoint pricing)
      </p>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Model</th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">SAE Cost</th>
              {(['simple', 'standard', 'complex', 'critical'] as const).map((tier) => (
                <th key={tier} className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {ENGAGEMENT_TIER_LABELS[tier]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.modelFamilyId} className="border-b border-border-subtle">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary">{row.modelName}</span>
                    <Badge variant={TIER_BADGE[row.tier] ?? 'gray'} size="sm">
                      {row.tier.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-mono text-sm text-text-primary">
                  {formatCurrency(row.saeCost)}
                </td>
                {row.byEngagementTier.map((bt) => (
                  <td key={bt.tier} className={`px-3 py-2 text-right font-mono text-sm font-medium ${countColor(bt.engagementsNeeded)}`}>
                    {bt.engagementsNeeded > 0 ? bt.engagementsNeeded : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
