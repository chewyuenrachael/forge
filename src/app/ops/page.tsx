'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, Calendar, Shield } from 'lucide-react'

import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

import { EU_AI_ACT_DEADLINE } from '@/lib/constants'
import type { Engagement, ContentCalendarItem, AsyncState } from '@/types'
import type { PredictionAccuracyReport } from '@/lib/predictions'

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

interface OpsData {
  engagements: Engagement[]
  stats: {
    total: number
    production: number
    demo: number
    research: number
    partnerCount: number
  }
  contentCalendar: ContentCalendarItem[]
}

interface ActivityItem {
  id: string
  type: 'signal' | 'engagement' | 'content' | 'capability'
  title: string
  description: string
  date: string
  variant: BadgeVariant
}

const ACTIVITY_FEED: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'signal',
    title: 'EU AI Act Implementing Regulation Published',
    description: 'Article 13 transparency requirements draft published by European Commission',
    date: '2026-03-28',
    variant: 'red',
  },
  {
    id: 'act-2',
    type: 'capability',
    title: 'Reasoning Theater Paper Published',
    description: '68% token savings demonstrated on MMLU via probe-guided early exit',
    date: '2026-03-12',
    variant: 'purple',
  },
  {
    id: 'act-3',
    type: 'engagement',
    title: 'Deutsche Kredit AG Discovery Call Completed',
    description: 'Technical discovery call for EU AI Act compliance assessment',
    date: '2026-03-20',
    variant: 'green',
  },
  {
    id: 'act-4',
    type: 'signal',
    title: 'Fed Clarifies SR 11-7 Applies to LLMs',
    description: 'Federal Reserve issues interpretive guidance on model risk management for LLMs',
    date: '2026-03-25',
    variant: 'red',
  },
  {
    id: 'act-5',
    type: 'content',
    title: 'SR 11-7 Compliance Guide Published',
    description: 'Technical guide for banking compliance teams on model risk management',
    date: '2026-04-01',
    variant: 'blue',
  },
  {
    id: 'act-6',
    type: 'signal',
    title: 'Reasoning Model Cost Crisis Deepens',
    description: 'Major provider raises pricing 10x; enterprises report 3-5x budget overruns',
    date: '2026-03-20',
    variant: 'amber',
  },
  {
    id: 'act-7',
    type: 'engagement',
    title: 'Rakuten Jailbreak Detection Phase Started',
    description: 'Expanding SAE probes from PII to jailbreak and toxicity detection',
    date: '2026-03-15',
    variant: 'green',
  },
  {
    id: 'act-8',
    type: 'capability',
    title: 'RLFR Paper Published',
    description: '58% hallucination reduction on Gemma 12B at 90x lower cost than LLM-as-judge',
    date: '2026-02-11',
    variant: 'purple',
  },
  {
    id: 'act-9',
    type: 'signal',
    title: 'Fortune 500 AI Deployment Halted',
    description: 'High-profile hallucination incident causes regulatory scrutiny, est. $50M+ damages',
    date: '2026-02-15',
    variant: 'red',
  },
  {
    id: 'act-10',
    type: 'content',
    title: 'Alzheimer\'s Biomarker Blog Post',
    description: 'First scientific discovery from model reverse-engineering published',
    date: '2026-01-28',
    variant: 'blue',
  },
]

// Priority tiers for prospects
const PIPELINE_TIERS = [
  { label: 'Tier 1 (90+)', count: 2, value: 4_800_000, color: 'bg-[#3D6B35]' },
  { label: 'Tier 2 (80-89)', count: 3, value: 9_000_000, color: 'bg-[#8A6B20]' },
  { label: 'Tier 3 (<80)', count: 1, value: 3_200_000, color: 'bg-text-tertiary' },
]

function computeDaysUntil(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

function healthBarColor(score: number): string {
  if (score >= 80) return 'bg-[#3D6B35]'
  if (score >= 50) return 'bg-[#8A6B20]'
  return 'bg-[#8A2020]'
}

function healthTextColor(score: number): string {
  if (score >= 80) return 'text-[#3D6B35]'
  if (score >= 50) return 'text-[#8A6B20]'
  return 'text-[#8A2020]'
}

function accuracyColor(pct: number): string {
  if (pct >= 80) return 'text-[#3D6B35]'
  if (pct >= 60) return 'text-[#8A6B20]'
  return 'text-[#8A2020]'
}

const OpsPage = (): React.ReactElement => {
  const [data, setData] = useState<AsyncState<OpsData>>({ status: 'idle' })
  const [accuracy, setAccuracy] = useState<PredictionAccuracyReport | null>(null)

  useEffect(() => {
    setData({ status: 'loading' })
    fetch('/api/knowledge')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<OpsData>
      })
      .then((result) => setData({ status: 'success', data: result }))
      .catch((err: Error) => setData({ status: 'error', error: err.message }))

    fetch('/api/predictions?accuracy=true')
      .then((res) => res.ok ? res.json() as Promise<{ data: PredictionAccuracyReport }> : null)
      .then((result) => { if (result) setAccuracy(result.data) })
      .catch(() => { /* non-critical */ })
  }, [])

  if (data.status === 'loading' || data.status === 'idle') {
    return (
      <>
        <Header title="Operations" subtitle="Cross-functional visibility and metrics" />
        <PageContainer>
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-elevated animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-72 rounded-lg bg-elevated animate-pulse" />
              <div className="h-72 rounded-lg bg-elevated animate-pulse" />
            </div>
            <div className="h-96 rounded-lg bg-elevated animate-pulse" />
          </div>
        </PageContainer>
      </>
    )
  }

  if (data.status === 'error') {
    return (
      <>
        <Header title="Operations" subtitle="Cross-functional visibility and metrics" />
        <PageContainer>
          <Card>
            <div className="text-center py-8">
              <p className="text-accent-red text-sm font-medium">Failed to load operations data</p>
              <p className="text-text-secondary text-xs mt-1">{data.error}</p>
            </div>
          </Card>
        </PageContainer>
      </>
    )
  }

  const { engagements, contentCalendar } = data.data
  const daysUntil = computeDaysUntil(EU_AI_ACT_DEADLINE)
  const activeEngagements = engagements.filter((e) => e.status === 'active')

  // Content items in next 30 days
  const now = new Date()
  const thirtyDaysOut = new Date(now.getTime() + 30 * 86_400_000)
  const upcomingContent = contentCalendar.filter((item) => {
    const itemDate = new Date(item.date)
    return itemDate >= now && itemDate <= thirtyDaysOut
  })

  // Pipeline value: weighted sum from pipeline tiers
  const totalPipelineValue = PIPELINE_TIERS.reduce((sum, tier) => sum + tier.value, 0)
  const maxTierValue = Math.max(...PIPELINE_TIERS.map((t) => t.value))

  return (
    <>
      <Header title="Operations" subtitle="Cross-functional visibility and metrics" />
      <PageContainer>
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-4 gap-4">
            <MetricCard
              value={`$${(totalPipelineValue / 1_000_000).toFixed(1)}M`}
              label="Pipeline Value (Weighted)"
              icon={<TrendingUp size={18} />}
              mono
            />
            <MetricCard
              value={activeEngagements.length}
              label="Active Engagements"
              icon={<Users size={18} />}
              trend={{ direction: 'up', value: `${engagements.length} total` }}
            />
            <MetricCard
              value={upcomingContent.length}
              label="Content Pipeline (30d)"
              icon={<Calendar size={18} />}
            />
            <div className="rounded-lg border border-border-subtle bg-surface p-4">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={18} className="text-text-tertiary" />
              </div>
              <div className="font-mono text-2xl font-semibold text-accent-amber tracking-tight">
                {daysUntil}d
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-text-secondary font-medium">
                EU AI Act Deadline
              </div>
            </div>
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* LEFT: Pipeline by Stage */}
            <Card header="Pipeline by Priority Tier">
              <div className="space-y-4">
                {PIPELINE_TIERS.map((tier) => (
                  <div key={tier.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-text-primary">{tier.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-secondary">{tier.count} prospects</span>
                        <span className="font-mono text-sm text-text-primary">
                          ${(tier.value / 1_000_000).toFixed(1)}M
                        </span>
                      </div>
                    </div>
                    <div className="h-3 rounded-full bg-elevated overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${tier.color}`}
                        style={{ width: `${maxTierValue > 0 ? (tier.value / maxTierValue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">Total Pipeline</span>
                  <span className="font-mono text-sm font-semibold text-accent-amber">
                    ${(totalPipelineValue / 1_000_000).toFixed(1)}M
                  </span>
                </div>
              </div>
            </Card>

            {/* RIGHT: Engagement Health */}
            <Card header="Engagement Health">
              <div className="space-y-4">
                {engagements.map((engagement) => {
                  const completedMilestones = engagement.milestones.filter((m) => m.status === 'completed').length
                  const totalMilestones = engagement.milestones.length

                  return (
                    <div key={engagement.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-text-primary">{engagement.partner_name}</span>
                          <Badge variant={engagement.status === 'active' ? 'green' : engagement.status === 'completed' ? 'blue' : 'amber'} size="sm">
                            {engagement.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-text-secondary font-mono">
                            {completedMilestones}/{totalMilestones}
                          </span>
                          <span className={`font-mono text-sm font-semibold ${healthTextColor(engagement.health_score)}`}>
                            {engagement.health_score}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-elevated overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${healthBarColor(engagement.health_score)}`}
                          style={{ width: `${engagement.health_score}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Prediction Accuracy */}
          {accuracy && accuracy.total > 0 && (
            <Card header="Prediction Accuracy">
              <div className="flex items-center gap-8">
                <div>
                  <span className={`font-mono text-2xl font-semibold ${accuracyColor(accuracy.overallAccuracy)}`}>
                    {accuracy.overallAccuracy}%
                  </span>
                  <p className="text-xs text-text-secondary mt-0.5">Overall accuracy</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="font-mono text-text-primary">{accuracy.confirmed}</span>
                    <span className="text-text-secondary ml-1">confirmed</span>
                  </div>
                  <div>
                    <span className="font-mono text-text-primary">{accuracy.refuted}</span>
                    <span className="text-text-secondary ml-1">refuted</span>
                  </div>
                  <div>
                    <span className="font-mono text-text-primary">{accuracy.untested}</span>
                    <span className="text-text-secondary ml-1">untested</span>
                  </div>
                </div>
                <p className="text-xs text-text-tertiary ml-auto">{accuracy.confidenceNote}</p>
              </div>
            </Card>
          )}

          {/* Recent Activity Feed */}
          <Card header="Recent Activity">
            <div className="space-y-0">
              {ACTIVITY_FEED.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-border-subtle last:border-b-0">
                  <Badge variant={activity.variant} size="sm">{activity.type}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{activity.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{activity.description}</p>
                  </div>
                  <span className="font-mono text-xs text-text-tertiary flex-shrink-0">{activity.date}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  )
}

export default OpsPage
