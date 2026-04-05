'use client'

import { type FC } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TrendingUp, AlertTriangle, Info } from 'lucide-react'
import type { ConversionBySignalType } from '@/lib/analytics'

interface ConversionFunnelProps {
  data: ConversionBySignalType[]
}

const FUNNEL_STAGES = ['Signals', 'Outreach', 'Response', 'Meeting', 'Proposal', 'Closed'] as const

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  regulatory: 'Regulatory',
  competitor: 'Competitor',
  prospect: 'Prospect',
  conference: 'Conference',
  research: 'Research',
  incident: 'Incident',
}

const SIGNAL_TYPE_VARIANTS: Record<string, 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'> = {
  regulatory: 'red',
  competitor: 'blue',
  prospect: 'green',
  conference: 'purple',
  research: 'purple',
  incident: 'amber',
}

function getStageValue(row: ConversionBySignalType, stage: string): number {
  switch (stage) {
    case 'Signals': return row.signalsDetected
    case 'Outreach': return row.outreachSent
    case 'Response': return row.responsesReceived
    case 'Meeting': return row.meetingsBooked
    case 'Proposal': return row.proposalsSent
    case 'Closed': return row.dealsClosed
    default: return 0
  }
}

function getConversionPct(from: number, to: number): number {
  if (from === 0) return 0
  return Math.round(to / from * 100)
}

function getConversionColor(pct: number): string {
  if (pct >= 40) return 'text-green-400'
  if (pct >= 15) return 'text-amber-400'
  return 'text-red-400'
}

function generateInsights(data: ConversionBySignalType[]): string[] {
  const insights: string[] = []
  const withMeetings = data.filter((d) => d.meetingsBooked > 0)

  if (withMeetings.length === 0) {
    const totalOutreach = data.reduce((sum, d) => sum + d.outreachSent, 0)
    insights.push(
      `Conversion analytics will become actionable as more outreach is tracked. Currently tracking ${totalOutreach} outreach events.`
    )
    return insights
  }

  // Best outreach→meeting rate
  const bestMeeting = [...withMeetings].sort((a, b) => b.conversionRate - a.conversionRate)[0]
  if (bestMeeting) {
    insights.push(
      `${SIGNAL_TYPE_LABELS[bestMeeting.signalType] ?? bestMeeting.signalType} signals have the highest outreach\u2192meeting rate (${bestMeeting.conversionRate}%). This validates the concentrated outreach strategy for this signal type.`
    )
  }

  // Worst performer with outreach
  const withOutreach = data.filter((d) => d.outreachSent > 0)
  const worst = [...withOutreach].sort((a, b) => a.conversionRate - b.conversionRate)[0]
  if (worst && worst.conversionRate < 10 && worst.signalType !== bestMeeting?.signalType) {
    insights.push(
      `${SIGNAL_TYPE_LABELS[worst.signalType] ?? worst.signalType} signals generate outreach but rarely convert to meetings (${worst.conversionRate}%). Consider deprioritizing or changing the framing.`
    )
  }

  // Highest pipeline value
  const bestPipeline = [...data].sort((a, b) => b.totalPipelineValue - a.totalPipelineValue)[0]
  if (bestPipeline && bestPipeline.totalPipelineValue > 0) {
    const valueStr = bestPipeline.totalPipelineValue >= 1_000_000
      ? `$${(bestPipeline.totalPipelineValue / 1_000_000).toFixed(1)}M`
      : `$${Math.round(bestPipeline.totalPipelineValue / 1_000)}K`
    insights.push(
      `${SIGNAL_TYPE_LABELS[bestPipeline.signalType] ?? bestPipeline.signalType} signals represent the largest pipeline value (${valueStr}).`
    )
  }

  return insights
}

export const ConversionFunnel: FC<ConversionFunnelProps> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => b.conversionRate - a.conversionRate)
  const insights = generateInsights(data)
  const hasData = data.some((d) => d.outreachSent > 0)

  return (
    <Card header="Conversion Funnel by Signal Type">
      <div className="space-y-4">
        {/* Stage Headers */}
        <div className="flex items-center gap-2 px-2">
          <div className="w-24 shrink-0" />
          {FUNNEL_STAGES.map((stage) => (
            <div key={stage} className="flex-1 text-center">
              <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">
                {stage}
              </span>
            </div>
          ))}
        </div>

        {/* Funnel Rows */}
        {sortedData.map((row) => {
          const stages = FUNNEL_STAGES.map((s) => getStageValue(row, s))
          const hasAnyData = stages.some((v) => v > 0)

          return (
            <div key={row.signalType} className="flex items-center gap-2 px-2">
              <div className="w-24 shrink-0">
                <Badge variant={SIGNAL_TYPE_VARIANTS[row.signalType] ?? 'gray'}>
                  {SIGNAL_TYPE_LABELS[row.signalType] ?? row.signalType}
                </Badge>
              </div>

              {stages.map((value, i) => {
                const prev = i > 0 ? (stages[i - 1] ?? 0) : 0
                const pct = i > 0 ? getConversionPct(prev, value) : 0
                const isZero = value === 0 && i > 0 && !hasAnyData

                return (
                  <div key={FUNNEL_STAGES[i]} className="flex-1 flex items-center gap-1">
                    {i > 0 && (
                      <span className={`font-mono text-xs ${prev > 0 ? getConversionColor(pct) : 'text-text-tertiary'}`}>
                        {prev > 0 ? `${pct}%` : '\u2014'}
                      </span>
                    )}
                    <div
                      className={`flex-1 rounded px-2 py-1.5 text-center transition-colors ${
                        value > 0
                          ? 'bg-accent-amber/10 border border-accent-amber/20'
                          : isZero
                            ? 'bg-base border border-border-subtle'
                            : 'bg-base border border-border-subtle'
                      }`}
                    >
                      <span className={`font-mono text-sm ${value > 0 ? 'text-text-primary' : 'text-text-tertiary'}`}>
                        {value}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Insight Panel */}
        <div className="mt-4 border-t border-border-subtle pt-4">
          <div className="flex items-center gap-2 mb-2">
            {hasData ? (
              <TrendingUp className="w-4 h-4 text-accent-amber" />
            ) : (
              <Info className="w-4 h-4 text-text-secondary" />
            )}
            <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">
              Insights
            </span>
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2">
                {hasData && <AlertTriangle className="w-3 h-3 text-accent-amber mt-0.5 shrink-0" />}
                <p className="text-sm text-text-secondary">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
