'use client'

import { type FC } from 'react'
import Link from 'next/link'
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { ModelFamilyTier } from '@/lib/constants'

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'
type DecisionStatus = 'GO' | 'APPROACHING' | 'WAIT'

export interface DecisionTrigger {
  modelFamilyId: string
  modelName: string
  tier: ModelFamilyTier
  qualifiedProspectCount: number
  pipelineRevenue: number
  prospectTriggerMet: boolean
  revenueTriggerMet: boolean
  status: DecisionStatus
}

interface DecisionTriggerAlertsProps {
  triggers: DecisionTrigger[]
}

const STATUS_META: Record<DecisionStatus, { variant: BadgeVariant; label: string }> = {
  GO: { variant: 'green', label: 'GO' },
  APPROACHING: { variant: 'amber', label: 'APPROACHING' },
  WAIT: { variant: 'gray', label: 'WAIT' },
}

const TIER_BADGE: Record<string, BadgeVariant> = {
  tier_a: 'green',
  tier_b: 'amber',
  tier_c: 'purple',
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

function getRecommendation(trigger: DecisionTrigger): string {
  if (trigger.status === 'GO') {
    return 'Both triggers met. Initiate SAE training.'
  }
  if (trigger.prospectTriggerMet && !trigger.revenueTriggerMet) {
    const needed = 500_000 - trigger.pipelineRevenue
    return `Prospect threshold met. Additional ${formatCompactCurrency(needed)} in pipeline needed. One Standard-tier engagement would meet this trigger.`
  }
  if (!trigger.prospectTriggerMet && trigger.revenueTriggerMet) {
    const needed = 3 - trigger.qualifiedProspectCount
    return `Revenue threshold met. ${needed} more qualified prospect${needed !== 1 ? 's' : ''} needed to justify investment.`
  }
  return 'Insufficient demand. Revisit in 30 days.'
}

export const DecisionTriggerAlerts: FC<DecisionTriggerAlertsProps> = ({ triggers }) => {
  if (triggers.length === 0) {
    return (
      <Card header="SAE Investment Decision Triggers">
        <p className="text-sm text-text-tertiary">No Tier B/C models pending SAE investment decisions.</p>
      </Card>
    )
  }

  return (
    <Card header="SAE Investment Decision Triggers">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {triggers.map((trigger) => {
          const statusMeta = STATUS_META[trigger.status]
          const prospectPct = Math.min((trigger.qualifiedProspectCount / 3) * 100, 100)
          const revenuePct = Math.min((trigger.pipelineRevenue / 500_000) * 100, 100)

          return (
            <div
              key={trigger.modelFamilyId}
              className="rounded-lg border border-border-subtle bg-surface p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{trigger.modelName}</span>
                  <Badge variant={TIER_BADGE[trigger.tier] ?? 'gray'} size="sm">
                    {trigger.tier.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
              </div>

              {/* Trigger 1: Qualified Prospects */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  {trigger.prospectTriggerMet ? (
                    <CheckCircle size={14} className="text-accent-green" />
                  ) : (
                    <XCircle size={14} className="text-text-tertiary" />
                  )}
                  <span className="text-xs text-text-secondary">3+ qualified prospects</span>
                  <span className="ml-auto font-mono text-xs text-text-primary">
                    {trigger.qualifiedProspectCount}/3
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-base">
                  <div
                    className={`h-1.5 rounded-full transition-all ${trigger.prospectTriggerMet ? 'bg-accent-green' : 'bg-text-tertiary'}`}
                    style={{ width: `${prospectPct}%` }}
                  />
                </div>
              </div>

              {/* Trigger 2: Pipeline Revenue */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  {trigger.revenueTriggerMet ? (
                    <CheckCircle size={14} className="text-accent-green" />
                  ) : (
                    <XCircle size={14} className="text-text-tertiary" />
                  )}
                  <span className="text-xs text-text-secondary">Pipeline revenue &gt; $500K</span>
                  <span className="ml-auto font-mono text-xs text-text-primary">
                    {formatCompactCurrency(trigger.pipelineRevenue)}/$500K
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-base">
                  <div
                    className={`h-1.5 rounded-full transition-all ${trigger.revenueTriggerMet ? 'bg-accent-green' : 'bg-text-tertiary'}`}
                    style={{ width: `${revenuePct}%` }}
                  />
                </div>
              </div>

              {/* Recommendation */}
              <div className={`rounded-md px-3 py-2 text-xs ${
                trigger.status === 'GO' ? 'bg-accent-green/10 text-accent-green' :
                trigger.status === 'APPROACHING' ? 'bg-accent-amber/10 text-accent-amber' :
                'bg-elevated text-text-secondary'
              }`}>
                {getRecommendation(trigger)}
              </div>
              <div className="mt-2 text-right">
                <Link href="/ops" className="inline-flex items-center gap-1 text-xs text-[#C45A3C] hover:underline">
                  View Pipeline <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
