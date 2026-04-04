'use client'

import { type FC } from 'react'
import { Badge } from '@/components/ui/Badge'
import type { ModelFamily } from '@/types'

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

interface ModelFamilyCardProps {
  model: ModelFamily
  prospectCount: number
  pipelineValue: number
  engagementCount: number
  onClick?: () => void
}

const SAE_STATUS_MAP: Record<ModelFamily['sae_status'], { label: string; variant: BadgeVariant }> = {
  available: { label: 'SAE Ready', variant: 'green' },
  in_progress: { label: 'Training', variant: 'amber' },
  planned: { label: 'Planned', variant: 'amber' },
  not_started: { label: 'No SAE', variant: 'red' },
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

export const ModelFamilyCard: FC<ModelFamilyCardProps> = ({
  model,
  prospectCount,
  pipelineValue,
  engagementCount,
  onClick,
}) => {
  const saeInfo = SAE_STATUS_MAP[model.sae_status]
  const adoptionPct = model.enterprise_adoption_pct

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-lg border border-border-subtle bg-surface p-4 transition-colors duration-150 hover:bg-elevated focus:outline-none focus:ring-2 focus:ring-accent-amber/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-text-primary">{model.name}</p>
          <p className="text-xs text-text-secondary">{model.provider}</p>
        </div>
        <Badge variant="gray" size="sm">
          <span className="font-mono">{model.parameter_count}</span>
        </Badge>
      </div>

      <div className="mt-2">
        <Badge variant={saeInfo.variant} size="sm">{saeInfo.label}</Badge>
        {model.sae_estimated_completion && (
          <span className="ml-2 text-xs text-text-secondary">
            ETA: {new Date(model.sae_estimated_completion).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Enterprise adoption</span>
          <span className="font-mono">{adoptionPct}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-base">
          <div
            className="h-1.5 rounded-full bg-accent-amber"
            style={{ width: `${Math.min(adoptionPct * 5, 100)}%` }}
          />
        </div>
      </div>

      {(prospectCount > 0 || engagementCount > 0) && (
        <div className="mt-3 space-y-1">
          {prospectCount > 0 && (
            <p className="text-xs text-accent-blue">
              <span className="font-mono">{prospectCount}</span> prospect{prospectCount !== 1 ? 's' : ''} &middot; <span className="font-mono">{formatCompactCurrency(pipelineValue)}</span>
            </p>
          )}
          {engagementCount > 0 && (
            <p className="text-xs text-accent-green">
              <span className="font-mono">{engagementCount}</span> active engagement{engagementCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </button>
  )
}
