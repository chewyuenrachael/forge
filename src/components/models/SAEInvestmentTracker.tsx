'use client'

import { type FC } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { ModelFamilyTier } from '@/lib/constants'

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

export interface SAEInvestmentEntry {
  modelFamilyId: string
  modelName: string
  tier: ModelFamilyTier
  saeCost: number
  engagementCount: number
  totalRevenue: number
  roi: number
  saeStatus: string
}

interface SAEInvestmentTrackerProps {
  entries: SAEInvestmentEntry[]
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

function roiColor(roi: number): string {
  if (roi > 0) return 'text-accent-green'
  if (roi < 0) return 'text-accent-red'
  return 'text-text-tertiary'
}

function roiLabel(entry: SAEInvestmentEntry): string {
  if (entry.saeCost === 0 && entry.totalRevenue > 0) return '∞'
  if (entry.totalRevenue === 0 && entry.saeCost === 0) return '—'
  return `${entry.roi >= 0 ? '+' : ''}${entry.roi.toFixed(1)}%`
}

function statusLabel(entry: SAEInvestmentEntry): { text: string; variant: BadgeVariant } {
  if (entry.saeCost === 0 && entry.totalRevenue > 0) return { text: 'Profitable', variant: 'green' }
  if (entry.saeCost === 0) return { text: 'Pre-existing', variant: 'gray' }
  if (entry.totalRevenue >= entry.saeCost) return { text: 'Recovered', variant: 'green' }
  return { text: 'Investing', variant: 'amber' }
}

export const SAEInvestmentTracker: FC<SAEInvestmentTrackerProps> = ({ entries }) => {
  const totalInvestment = entries.reduce((sum, e) => sum + e.saeCost, 0)
  const totalRevenue = entries.reduce((sum, e) => sum + e.totalRevenue, 0)
  const netPosition = totalRevenue - totalInvestment

  return (
    <Card header="SAE Investment Tracker">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Model</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Tier</th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">SAE Cost</th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">Eng.</th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">Revenue</th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">ROI</th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const status = statusLabel(entry)
              return (
                <tr key={entry.modelFamilyId} className="border-b border-border-subtle">
                  <td className="px-3 py-2 text-sm text-text-primary">{entry.modelName}</td>
                  <td className="px-3 py-2">
                    <Badge variant={TIER_BADGE[entry.tier] ?? 'gray'} size="sm">
                      {entry.tier.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-sm text-text-primary">
                    {entry.saeCost === 0 ? '$0' : formatCurrency(entry.saeCost)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-sm text-text-primary">
                    {entry.engagementCount}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-sm text-text-primary">
                    {formatCurrency(entry.totalRevenue)}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono text-sm ${roiColor(entry.roi)}`}>
                    {roiLabel(entry)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Badge variant={status.variant} size="sm">{status.text}</Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-6 border-t border-border-default pt-3">
        <div>
          <span className="text-xs uppercase tracking-wider text-text-secondary">Total Investment</span>
          <p className="font-mono text-sm font-medium text-text-primary">{formatCurrency(totalInvestment)}</p>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider text-text-secondary">Total Revenue</span>
          <p className="font-mono text-sm font-medium text-text-primary">{formatCurrency(totalRevenue)}</p>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider text-text-secondary">Net Position</span>
          <p className={`font-mono text-sm font-medium ${netPosition >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {netPosition >= 0 ? '+' : ''}{formatCurrency(netPosition)}
          </p>
        </div>
      </div>
    </Card>
  )
}
