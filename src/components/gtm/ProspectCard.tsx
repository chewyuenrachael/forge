'use client'

import { type FC } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Prospect } from '@/types'

interface ProspectCardProps {
  prospect: Prospect
}

function formatSpend(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M/mo`
  }
  return `$${(amount / 1_000).toFixed(0)}K/mo`
}

const industryVariant: Record<string, 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'> = {
  'European Banking': 'blue',
  'Pharmaceutical': 'green',
  'Frontier AI': 'purple',
  'Defense & Intelligence': 'red',
  'Healthcare': 'green',
  'Financial Services': 'blue',
}

export const ProspectCard: FC<ProspectCardProps> = ({ prospect }) => {
  const displayPainPoints = prospect.pain_points.slice(0, 3)

  return (
    <Card className="hover:bg-elevated">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{prospect.name}</h3>
          <Badge variant={industryVariant[prospect.industry] ?? 'gray'}>{prospect.industry}</Badge>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-semibold text-accent-amber">{prospect.priority_score}</div>
          <div className="text-xs uppercase tracking-wider text-text-secondary font-medium">Priority</div>
        </div>
      </div>
      <div className="flex items-center gap-4 mb-3 text-sm">
        <div>
          <span className="text-text-secondary">AI Spend: </span>
          <span className="font-mono text-text-primary">{formatSpend(prospect.estimated_ai_spend)}</span>
        </div>
        <div>
          <span className="text-text-secondary">Models: </span>
          <span className="font-mono text-text-primary">{prospect.model_families.length}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {displayPainPoints.map((point) => (
          <Badge key={point} variant="gray">{point}</Badge>
        ))}
      </div>
    </Card>
  )
}
