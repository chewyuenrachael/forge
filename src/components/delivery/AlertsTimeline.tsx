'use client'

import { type FC } from 'react'
import { AlertTriangle, AlertOctagon, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { HealthAlert, ExpansionOpportunity } from '@/lib/health-alerts'
import { formatCurrency } from '@/lib/health-alerts'

interface AlertsTimelineProps {
  alerts: HealthAlert[]
  expansions: ExpansionOpportunity[]
}

interface TimelineEntry {
  id: string
  date: string
  type: 'critical' | 'warning' | 'expansion'
  title: string
  summary: string
  engagement_id: string
  revenue?: number
}

function alertToEntry(alert: HealthAlert): TimelineEntry {
  return {
    id: alert.id,
    date: alert.created_at,
    type: alert.severity === 'critical' ? 'critical' : 'warning',
    title: alert.title,
    summary: alert.description,
    engagement_id: alert.engagement_id,
  }
}

function expansionToEntry(expansion: ExpansionOpportunity): TimelineEntry {
  return {
    id: expansion.id,
    date: new Date().toISOString(),
    type: 'expansion',
    title: `${expansion.partner_name} — Expansion`,
    summary: expansion.description,
    engagement_id: expansion.engagement_id,
    revenue: expansion.estimated_revenue,
  }
}

function formatTimelineDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso.slice(0, 10)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const DOT_COLORS: Record<TimelineEntry['type'], string> = {
  critical: 'bg-[#8A2020]',
  warning: 'bg-[#8A6B20]',
  expansion: 'bg-[#3D6B35]',
}

const BADGE_VARIANTS: Record<TimelineEntry['type'], 'red' | 'amber' | 'green'> = {
  critical: 'red',
  warning: 'amber',
  expansion: 'green',
}

function typeIcon(type: TimelineEntry['type']): React.ReactElement {
  switch (type) {
    case 'critical':
      return <AlertOctagon className="w-3.5 h-3.5 text-[#8A2020]" />
    case 'warning':
      return <AlertTriangle className="w-3.5 h-3.5 text-[#8A6B20]" />
    case 'expansion':
      return <TrendingUp className="w-3.5 h-3.5 text-[#3D6B35]" />
  }
}

export const AlertsTimeline: FC<AlertsTimelineProps> = ({ alerts, expansions }) => {
  const entries: TimelineEntry[] = [
    ...alerts.filter((a) => !a.acknowledged).map(alertToEntry),
    ...expansions.map(expansionToEntry),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const header = (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-text-primary">Activity Timeline</h3>
      <span className="text-xs text-text-tertiary">{entries.length} event{entries.length !== 1 ? 's' : ''}</span>
    </div>
  )

  if (entries.length === 0) {
    return (
      <Card header={header}>
        <div className="flex items-center justify-center py-8 text-sm text-text-secondary">
          No recent alerts or expansion events.
        </div>
      </Card>
    )
  }

  return (
    <Card header={header} noPadding>
      <div className="p-4">
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#D0CCC4]" />

          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="relative flex gap-3">
                {/* Dot */}
                <div className={`relative z-10 mt-1.5 w-[15px] h-[15px] rounded-full ${DOT_COLORS[entry.type]} ring-2 ring-[#FAFAF7] flex items-center justify-center flex-shrink-0`}>
                  <div className="w-[7px] h-[7px] rounded-full bg-white/30" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-text-tertiary">
                      {formatTimelineDate(entry.date)}
                    </span>
                    {typeIcon(entry.type)}
                    <Badge variant={BADGE_VARIANTS[entry.type]} size="sm">
                      {entry.type === 'expansion' ? 'expansion' : entry.type}
                    </Badge>
                    {entry.revenue !== undefined && (
                      <span className="font-mono text-[10px] font-medium text-[#3D6B35]">
                        {formatCurrency(entry.revenue)}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-text-primary mt-1">{entry.title}</h4>
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{entry.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
