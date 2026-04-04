'use client'

import { type FC } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Prospect, Engagement } from '@/types'

interface PipelineDemandProps {
  modelFamilyId: string
  modelFamilyName: string
  prospects: Prospect[]
  engagements: Engagement[]
}

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

const STAGE_BADGE: Record<string, BadgeVariant> = {
  signal_detected: 'gray',
  outreach_sent: 'blue',
  response_received: 'blue',
  meeting_booked: 'amber',
  discovery_complete: 'amber',
  proposal_sent: 'purple',
  verbal_agreement: 'green',
  contract_signed: 'green',
  lost: 'red',
}

const STATUS_BADGE: Record<string, BadgeVariant> = {
  active: 'green',
  completed: 'blue',
  proposed: 'amber',
  paused: 'gray',
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

function formatStageLabel(stage: string): string {
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export const PipelineDemand: FC<PipelineDemandProps> = ({
  modelFamilyId,
  modelFamilyName,
  prospects,
  engagements,
}) => {
  const filteredProspects = prospects
    .filter((p) => p.model_families.includes(modelFamilyId))
    .sort((a, b) => b.pipeline_value - a.pipeline_value)

  const filteredEngagements = engagements.filter(
    (e) => e.model_family_id === modelFamilyId
  )

  const totalValue = filteredProspects.reduce((sum, p) => sum + p.pipeline_value, 0)

  return (
    <Card header={`Pipeline Demand: ${modelFamilyName}`}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Prospects */}
        <div>
          <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary">
            Prospects Deploying {modelFamilyName}
          </h4>
          {filteredProspects.length === 0 ? (
            <p className="text-sm text-text-tertiary">No prospects deploying this model.</p>
          ) : (
            <div className="space-y-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Company</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Stage</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">Value</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">ICP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProspects.map((p) => (
                    <tr key={p.id} className="border-b border-border-subtle">
                      <td className="px-3 py-2 text-sm">
                        <Link href={`/prospects?selected=${p.id}`} className="text-[#C45A3C] hover:underline">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={STAGE_BADGE[p.pipeline_stage] ?? 'gray'} size="sm">
                          {formatStageLabel(p.pipeline_stage)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm text-text-primary">
                        {formatCompactCurrency(p.pipeline_value)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm text-text-primary">
                        {p.priority_score}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border-default">
                    <td className="px-3 py-2 text-sm font-medium text-text-primary" colSpan={2}>
                      Total: {filteredProspects.length} prospect{filteredProspects.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm font-medium text-accent-amber" colSpan={2}>
                      {formatCompactCurrency(totalValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Engagements */}
        <div>
          <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary">
            Active Engagements on {modelFamilyName}
          </h4>
          {filteredEngagements.length === 0 ? (
            <p className="text-sm text-text-tertiary">No engagements yet on this model family.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Partner</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Tier</th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">Health</th>
                </tr>
              </thead>
              <tbody>
                {filteredEngagements.map((e) => (
                  <tr key={e.id} className="border-b border-border-subtle">
                    <td className="px-3 py-2 text-sm text-text-primary">{e.partner_name}</td>
                    <td className="px-3 py-2">
                      <Badge variant={STATUS_BADGE[e.status] ?? 'gray'} size="sm">
                        {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-sm text-text-secondary capitalize">{e.engagement_tier}</td>
                    <td className="px-3 py-2 text-right font-mono text-sm text-text-primary">{e.health_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Card>
  )
}
