import { type FC } from 'react'
import { DollarSign } from 'lucide-react'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { ChannelPartner, Engagement } from '@/types'

interface RevenueAttributionProps {
  partner: ChannelPartner
  engagements: Engagement[]
}

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  proposed: 'amber',
  active: 'green',
  paused: 'gray',
  completed: 'blue',
}

const TIER_VARIANT: Record<string, BadgeVariant> = {
  simple: 'gray',
  standard: 'blue',
  complex: 'amber',
  critical: 'red',
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`
  return `$${value}`
}

export const RevenueAttribution: FC<RevenueAttributionProps> = ({ partner, engagements }) => {
  const attributedPipeline = engagements.reduce((sum, e) => sum + e.pipeline_value, 0)
  const avgMargin = engagements.length > 0
    ? engagements.reduce((sum, e) => sum + e.margin_pct, 0) / engagements.length
    : 0

  return (
    <Card header={
      <div className="flex items-center gap-2">
        <DollarSign size={16} className="text-text-tertiary" />
        <h3 className="text-sm font-semibold text-text-primary">Revenue Attribution</h3>
      </div>
    }>
      <div className="space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-[#F5F3EE] p-3">
            <div className="text-xs uppercase tracking-wider text-text-tertiary font-medium mb-1">Est. Annual Revenue</div>
            <div className="font-mono text-lg font-semibold text-text-primary">{formatCurrency(partner.estimated_annual_revenue)}</div>
          </div>
          <div className="rounded-md bg-[#F5F3EE] p-3">
            <div className="text-xs uppercase tracking-wider text-text-tertiary font-medium mb-1">Attributed Pipeline</div>
            <div className="font-mono text-lg font-semibold text-text-primary">{formatCurrency(attributedPipeline)}</div>
          </div>
        </div>

        {/* Engagement breakdown */}
        {engagements.length > 0 ? (
          <>
            <div className="space-y-2">
              {engagements.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-[#E8E4D9] last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-text-primary truncate">{e.partner_name}</span>
                    <Badge variant={TIER_VARIANT[e.engagement_tier] ?? 'gray'} size="sm">{e.engagement_tier}</Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={STATUS_VARIANT[e.status] ?? 'gray'} size="sm">{e.status}</Badge>
                    <span className="font-mono text-sm text-text-primary">{formatCurrency(e.pipeline_value)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-text-secondary pt-1 border-t border-[#E8E4D9]">
              Total: <span className="font-mono font-medium">{engagements.length}</span> deal{engagements.length !== 1 ? 's' : ''} |{' '}
              Avg margin: <span className="font-mono font-medium">{avgMargin.toFixed(1)}%</span>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-text-tertiary">No engagements attributed yet.</p>
            <p className="text-xs text-text-tertiary mt-1">First deal validates the partnership.</p>
          </div>
        )}
      </div>
    </Card>
  )
}
