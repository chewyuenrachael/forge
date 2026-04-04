'use client'

import { type FC } from 'react'
import { ArrowRight } from 'lucide-react'

import { Card } from '@/components/ui/Card'
import type { PipelineStage } from '@/lib/constants'

interface PipelineFunnelProps {
  byStage: { stage: PipelineStage; count: number; totalValue: number }[]
  conversionRates: { fromStage: PipelineStage; toStage: PipelineStage; rate: number }[]
}

const STAGE_LABELS: Record<string, string> = {
  signal_detected: 'Signal Detected',
  outreach_sent: 'Outreach Sent',
  response_received: 'Response Received',
  meeting_booked: 'Meeting Booked',
  discovery_complete: 'Discovery Complete',
  proposal_sent: 'Proposal Sent',
  verbal_agreement: 'Verbal Agreement',
  contract_signed: 'Contract Signed',
  lost: 'Lost',
}

const STAGE_COLORS: string[] = [
  '#7C9EB8', '#6B93B0', '#5A88A8',
  '#4A7DA0', '#3A7298', '#2A6790',
  '#1A5C88', '#0F5280',
]

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

export const PipelineFunnel: FC<PipelineFunnelProps> = ({ byStage, conversionRates }) => {
  const funnelStages = byStage.filter((s) => s.stage !== 'lost')
  const lostStage = byStage.find((s) => s.stage === 'lost')
  const maxCount = Math.max(...funnelStages.map((s) => s.count), 1)

  const rateMap = new Map(
    conversionRates.map((r) => [`${r.fromStage}|${r.toStage}`, r.rate])
  )

  return (
    <Card header="Pipeline Funnel">
      <div className="space-y-1">
        {funnelStages.map((stage, i) => {
          const widthPct = Math.max((stage.count / maxCount) * 100, 8)
          const nextStage = funnelStages[i + 1]
          const rateKey = nextStage ? `${stage.stage}|${nextStage.stage}` : null
          const rate = rateKey ? rateMap.get(rateKey) : undefined

          return (
            <div key={stage.stage}>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-32 flex-shrink-0 text-right">
                  {STAGE_LABELS[stage.stage] ?? stage.stage}
                </span>
                <div className="flex-1 relative">
                  <div
                    className="h-7 rounded-md flex items-center justify-end px-2 transition-all duration-500"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: STAGE_COLORS[i] ?? '#5A88A8',
                      minWidth: '60px',
                    }}
                  >
                    <span className="text-xs font-mono font-medium text-white">
                      {stage.count}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs text-text-primary w-16 text-right flex-shrink-0">
                  {formatCurrency(stage.totalValue)}
                </span>
              </div>
              {rate !== undefined && rate > 0 && (
                <div className="flex items-center gap-3 py-0.5">
                  <div className="w-32" />
                  <div className="flex items-center gap-1 text-text-tertiary">
                    <ArrowRight size={10} />
                    <span className="text-[10px] font-mono">{rate}%</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {lostStage && lostStage.count > 0 && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <span className="text-xs text-text-tertiary">
            Lost: {lostStage.count} prospects ({formatCurrency(lostStage.totalValue)})
          </span>
        </div>
      )}
    </Card>
  )
}
