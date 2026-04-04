'use client'

import { type FC } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, Users, AlertTriangle } from 'lucide-react'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Prospect, ICPScore, Signal } from '@/types'

interface WeeklyPriorityListProps {
  prospects: (Prospect & { icpScore: ICPScore })[]
  signals: Signal[]
  euAiActDays: number
}

const STAGE_ACTIONS: Record<string, string> = {
  signal_detected: 'Send initial outreach',
  outreach_sent: 'Follow up on outreach',
  response_received: 'Book discovery meeting',
  meeting_booked: 'Prepare discovery materials',
  discovery_complete: 'Draft proposal',
  proposal_sent: 'Follow up on proposal',
  verbal_agreement: 'Finalize contract terms',
  contract_signed: 'Begin onboarding',
  lost: 'Assess re-engagement',
}

const CATEGORY_LABELS: Record<string, string> = {
  data_sovereign_enterprise: 'Data Sovereign Enterprise',
  ai_native_startup: 'AI Native Startup',
  cost_optimizer: 'Cost Optimizer',
  research_institution: 'Research Institution',
  model_customization_platform: 'Model Customization Platform',
  sovereign_ai_initiative: 'Sovereign AI Initiative',
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-[#3D6B35]'
  if (score >= 60) return 'text-[#8A6B20]'
  return 'text-text-tertiary'
}

export const WeeklyPriorityList: FC<WeeklyPriorityListProps> = ({ prospects, signals, euAiActDays }) => {
  const top5 = prospects.slice(0, 5)
  const signalMap = new Map<string, Signal[]>()

  for (const signal of signals) {
    for (const pid of signal.matched_prospect_ids) {
      const existing = signalMap.get(pid)
      if (existing) {
        existing.push(signal)
      } else {
        signalMap.set(pid, [signal])
      }
    }
  }

  if (top5.length === 0) {
    return (
      <Card header="Weekly Priority List">
        <div className="text-center py-8 text-text-tertiary">
          <Users size={24} className="mx-auto mb-2" />
          <p className="text-sm">No prospects in pipeline yet.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card header={
      <div className="flex items-center justify-between w-full">
        <span>Weekly Priority List</span>
        <Link href="/prospects" className="text-xs text-[#C45A3C] hover:underline font-medium">
          View All <ArrowRight size={10} className="inline" />
        </Link>
      </div>
    }>
      <div className="space-y-0 divide-y divide-border-subtle">
        {top5.map((prospect, idx) => {
          const matchingSignals = signalMap.get(prospect.id) ?? []
          const topSignal = matchingSignals.sort((a, b) => b.relevance_score - a.relevance_score)[0]
          const hasRegulatoryExposure = prospect.regulatory_exposure.length > 0
          const action = STAGE_ACTIONS[prospect.pipeline_stage] ?? 'Review status'

          return (
            <div key={prospect.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-text-tertiary w-5">{idx + 1}.</span>
                  <span className="text-sm font-semibold text-text-primary">{prospect.name}</span>
                  <Badge variant="gray" size="sm">
                    {CATEGORY_LABELS[prospect.customer_category] ?? prospect.customer_category}
                  </Badge>
                </div>
                <span className={`font-mono text-lg font-semibold ${scoreColor(prospect.icpScore.composite)}`}>
                  {prospect.icpScore.composite}
                </span>
              </div>

              {/* WHY NOW */}
              <div className="ml-7 space-y-1 mb-2">
                {hasRegulatoryExposure && prospect.regulatory_exposure.some((r) => r.toLowerCase().includes('eu ai act')) && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock size={10} className="text-[#C45A3C] flex-shrink-0" />
                    <span className="text-text-secondary">
                      EU AI Act deadline in <span className="font-mono font-semibold text-[#C45A3C]">{euAiActDays}</span> days
                    </span>
                  </div>
                )}
                {topSignal && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <AlertTriangle size={10} className="text-[#8A6B20] flex-shrink-0" />
                    <span className="text-text-secondary">
                      {topSignal.title}
                      <span className="font-mono text-text-tertiary ml-1">(relevance: {topSignal.relevance_score})</span>
                    </span>
                  </div>
                )}
                {prospect.peer_cluster_id && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Users size={10} className="text-text-tertiary flex-shrink-0" />
                    <span className="text-text-secondary">
                      Peer cluster active — momentum from related prospects
                    </span>
                  </div>
                )}
              </div>

              {/* RECOMMENDED ACTION */}
              <div className="ml-7 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-text-tertiary uppercase tracking-wider font-medium">Action: </span>
                  <span className="text-text-primary">{action}</span>
                </div>
                <Link
                  href="/prospects"
                  className="text-xs text-[#C45A3C] hover:underline"
                >
                  View Prospect <ArrowRight size={10} className="inline" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
