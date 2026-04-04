'use client'

import { type FC } from 'react'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { ChannelMetrics } from '@/types'
import type { RevenueEngine } from '@/lib/constants'

interface RevenueEngineViewProps {
  byRevenueEngine: { engine: RevenueEngine; count: number; totalValue: number }[]
  channelMetrics: ChannelMetrics
  engagementCount: number
  avgHealth: number
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

const ENGINE_CONFIG: { engine: RevenueEngine; label: string; subtitle: string; color: string; badgeVariant: 'amber' | 'blue' | 'green' }[] = [
  { engine: 'direct', label: 'Direct', subtitle: 'Foundation', color: '#C45A3C', badgeVariant: 'amber' },
  { engine: 'channel', label: 'Channel', subtitle: 'Multiplier', color: '#4A7DA0', badgeVariant: 'blue' },
  { engine: 'monitoring', label: 'Monitoring', subtitle: 'Long-term', color: '#3D6B35', badgeVariant: 'green' },
]

export const RevenueEngineView: FC<RevenueEngineViewProps> = ({
  byRevenueEngine,
  channelMetrics,
  engagementCount,
  avgHealth,
}) => {
  const engineMap = new Map(byRevenueEngine.map((e) => [e.engine, e]))

  return (
    <Card header="Revenue Engines">
      <div className="grid grid-cols-3 gap-4">
        {ENGINE_CONFIG.map(({ engine, label, subtitle, color, badgeVariant }) => {
          const data = engineMap.get(engine)

          return (
            <div key={engine} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{label}</p>
                  <p className="text-xs text-text-tertiary">{subtitle}</p>
                </div>
                <Badge variant={badgeVariant} size="sm">
                  {engine}
                </Badge>
              </div>

              <div className="space-y-2">
                {engine === 'direct' && (
                  <>
                    <MetricRow label="Pipeline" value={formatCurrency(data?.totalValue ?? 0)} color={color} />
                    <MetricRow label="Prospects" value={String(data?.count ?? 0)} color={color} />
                  </>
                )}

                {engine === 'channel' && (
                  <>
                    <MetricRow label="Partners" value={`${channelMetrics.activePartners}/${channelMetrics.totalPartners}`} color={color} />
                    <MetricRow label="Est. Revenue" value={formatCurrency(channelMetrics.totalEstimatedRevenue)} color={color} />
                    <MetricRow label="Certified Eng." value={String(channelMetrics.totalCertifiedEngineers)} color={color} />
                  </>
                )}

                {engine === 'monitoring' && (
                  <>
                    <MetricRow label="Engagements" value={String(engagementCount)} color={color} />
                    <MetricRow label="Avg Health" value={`${avgHealth}`} color={color} />
                    <MetricRow label="Pipeline" value={formatCurrency(data?.totalValue ?? 0)} color={color} />
                  </>
                )}
              </div>

              <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: color,
                    width: `${Math.min(((data?.count ?? 0) / Math.max(byRevenueEngine.reduce((s, e) => s + e.count, 0), 1)) * 100 * 3, 100)}%`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

interface MetricRowProps {
  label: string
  value: string
  color: string
}

const MetricRow: FC<MetricRowProps> = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-text-tertiary">{label}</span>
    <span className="font-mono text-sm text-text-primary">{value}</span>
  </div>
)
