'use client'

import { type FC } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ModelFamilyCard } from './ModelFamilyCard'
import type { ModelFamily, Engagement } from '@/types'

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

interface CoverageOverviewProps {
  modelFamilies: ModelFamily[]
  pipelineByModel: Map<string, { count: number; totalValue: number }>
  engagementsByModel: Map<string, Engagement[]>
  onSelectModel: (id: string) => void
}

const TIER_META: Record<string, { label: string; variant: BadgeVariant; description: string; bgClass: string }> = {
  tier_a: {
    label: 'Tier A',
    variant: 'green',
    description: 'SAEs Available — Ready to Serve',
    bgClass: 'bg-accent-green/5 border-accent-green/20',
  },
  tier_b: {
    label: 'Tier B',
    variant: 'amber',
    description: 'Planned — 3-Month Horizon',
    bgClass: 'bg-accent-amber/5 border-accent-amber/20',
  },
  tier_c: {
    label: 'Tier C',
    variant: 'purple',
    description: 'On Demand — Custom SAE Training Required',
    bgClass: 'bg-accent-purple/5 border-accent-purple/20',
  },
}

const TIER_ORDER = ['tier_a', 'tier_b', 'tier_c'] as const

export const CoverageOverview: FC<CoverageOverviewProps> = ({
  modelFamilies,
  pipelineByModel,
  engagementsByModel,
  onSelectModel,
}) => {
  const byTier = TIER_ORDER.map((tier) => ({
    tier,
    meta: TIER_META[tier] as { label: string; variant: BadgeVariant; description: string; bgClass: string },
    models: modelFamilies.filter((mf) => mf.tier === tier),
  }))

  return (
    <Card header="SAE Coverage by Tier">
      <div className="space-y-6">
        {byTier.map(({ tier, meta, models }) => (
          <div key={tier} className={`rounded-lg border p-4 ${meta.bgClass}`}>
            <div className="mb-3 flex items-center gap-3">
              <Badge variant={meta.variant}>{meta.label}</Badge>
              <span className="text-sm text-text-secondary">{meta.description}</span>
              <span className="ml-auto text-xs text-text-tertiary font-mono">
                {models.length} model{models.length !== 1 ? 's' : ''}
              </span>
            </div>

            {models.length === 0 ? (
              <p className="text-sm text-text-tertiary">No models in this tier.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {models.map((model) => {
                  const pipeline = pipelineByModel.get(model.id)
                  const engagements = engagementsByModel.get(model.id) ?? []
                  const activeEngagements = engagements.filter((e) => e.status === 'active')
                  return (
                    <ModelFamilyCard
                      key={model.id}
                      model={model}
                      prospectCount={pipeline?.count ?? 0}
                      pipelineValue={pipeline?.totalValue ?? 0}
                      engagementCount={activeEngagements.length}
                      onClick={() => onSelectModel(model.id)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
