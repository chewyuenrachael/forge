'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

import { EU_AI_ACT_DEADLINE } from '@/lib/constants'
import { KeyMetricHighlight } from '@/components/brief/KeyMetricHighlight'
import type { Capability, Prospect, ICPScore, AsyncState, ModelFamily, ChannelMetrics } from '@/types'
import type { PredictionAccuracyReport } from '@/lib/predictions'
import type { EcosystemEvent } from '@/lib/events'
import type { EnrichedWeeklyBrief } from '@/lib/weekly-brief'

interface DashboardData {
  data: Capability[]
  stats: {
    total: number
    production: number
    demo: number
    research: number
    partnerCount: number
  }
  timeline: Capability[]
}

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

function getReadinessBadge(readiness: Capability['readiness']): { label: string; variant: BadgeVariant } {
  const map: Record<Capability['readiness'], { label: string; variant: BadgeVariant }> = {
    production: { label: 'Production', variant: 'green' },
    demo: { label: 'Demo', variant: 'amber' },
    research: { label: 'Research', variant: 'gray' },
  }
  return map[readiness]
}

function getTypeBadge(type: Capability['type']): { label: string; variant: BadgeVariant } {
  return type === 'applied'
    ? { label: 'Applied', variant: 'blue' }
    : { label: 'Fundamental', variant: 'purple' }
}

function computeDaysUntil(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

const PIPELINE_STAGE_LABELS: Record<string, { label: string; variant: BadgeVariant }> = {
  signal_detected: { label: 'Signal', variant: 'gray' },
  outreach_sent: { label: 'Outreach', variant: 'blue' },
  response_received: { label: 'Response', variant: 'blue' },
  meeting_booked: { label: 'Meeting', variant: 'amber' },
  discovery_complete: { label: 'Discovery', variant: 'amber' },
  proposal_sent: { label: 'Proposal', variant: 'purple' },
  verbal_agreement: { label: 'Verbal', variant: 'green' },
  contract_signed: { label: 'Signed', variant: 'green' },
  lost: { label: 'Lost', variant: 'red' },
}

function accuracyColor(pct: number): string {
  if (pct >= 80) return 'text-[#3D6B35]'
  if (pct >= 60) return 'text-[#8A6B20]'
  return 'text-[#8A2020]'
}

type ProspectWithScore = Prospect & { icpScore: ICPScore }

const CHART_COLORS: Record<string, string> = {
  Production: '#3D6B35',
  Demo: '#8A6B20',
  Research: '#5A3D80',
}

const OverviewPage = (): React.ReactElement => {
  const [dashboard, setDashboard] = useState<AsyncState<DashboardData>>({ status: 'idle' })
  const [topProspects, setTopProspects] = useState<ProspectWithScore[]>([])
  const [accuracy, setAccuracy] = useState<PredictionAccuracyReport | null>(null)
  const [modelFamilies, setModelFamilies] = useState<ModelFamily[]>([])
  const [channelMetrics, setChannelMetrics] = useState<ChannelMetrics | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<EcosystemEvent[]>([])
  const [briefSummary, setBriefSummary] = useState<EnrichedWeeklyBrief | null>(null)

  useEffect(() => {
    setDashboard({ status: 'loading' })
    fetch('/api/knowledge')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<DashboardData>
      })
      .then((data) => setDashboard({ status: 'success', data }))
      .catch((err: Error) => setDashboard({ status: 'error', error: err.message }))

    fetch('/api/prospects?top=3')
      .then((res) => res.ok ? res.json() as Promise<{ data: ProspectWithScore[] }> : null)
      .then((result) => { if (result) setTopProspects(result.data) })
      .catch(() => { /* non-critical — overview still works */ })

    fetch('/api/predictions?accuracy=true')
      .then((res) => res.ok ? res.json() as Promise<{ data: PredictionAccuracyReport }> : null)
      .then((result) => { if (result) setAccuracy(result.data) })
      .catch(() => { /* non-critical */ })

    fetch('/api/model-families')
      .then((res) => res.ok ? res.json() as Promise<{ data: ModelFamily[] }> : null)
      .then((result) => { if (result) setModelFamilies(result.data) })
      .catch(() => { /* non-critical */ })

    fetch('/api/channels?metrics=true')
      .then((res) => res.ok ? res.json() as Promise<{ data: ChannelMetrics }> : null)
      .then((result) => { if (result) setChannelMetrics(result.data) })
      .catch(() => { /* non-critical */ })

    fetch('/api/ecosystem-events')
      .then((res) => res.ok ? res.json() as Promise<{ data: EcosystemEvent[] }> : null)
      .then((result) => {
        if (result) {
          const today = new Date().toISOString().slice(0, 10)
          const upcoming = result.data
            .filter((e) => e.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 3)
          setUpcomingEvents(upcoming)
        }
      })
      .catch(() => { /* non-critical */ })

    // Fetch weekly brief summary (non-critical)
    fetch('/api/brief')
      .then((res) => res.ok ? res.json() as Promise<{ data: EnrichedWeeklyBrief }> : null)
      .then((result) => { if (result) setBriefSummary(result.data) })
      .catch(() => { /* non-critical */ })
  }, [])

  if (dashboard.status === 'loading' || dashboard.status === 'idle') {
    return (
      <>
        <Header title="Overview" subtitle="Goodfire Commercial Intelligence" />
        <PageContainer>
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-elevated animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-3 h-96 rounded-lg bg-elevated animate-pulse" />
              <div className="col-span-2 h-96 rounded-lg bg-elevated animate-pulse" />
            </div>
            <div className="h-64 rounded-lg bg-elevated animate-pulse" />
          </div>
        </PageContainer>
      </>
    )
  }

  if (dashboard.status === 'error') {
    return (
      <>
        <Header title="Overview" subtitle="Goodfire Commercial Intelligence" />
        <PageContainer>
          <Card>
            <div className="text-center py-8">
              <p className="text-accent-red text-sm font-medium">Failed to load dashboard data</p>
              <p className="text-text-secondary text-xs mt-1">{dashboard.error}</p>
            </div>
          </Card>
        </PageContainer>
      </>
    )
  }

  const { data, stats, timeline } = dashboard.data
  const daysUntil = computeDaysUntil(EU_AI_ACT_DEADLINE)

  const uniquePartners = Array.from(
    new Set(data.flatMap((c) => c.partners).filter(Boolean))
  )

  const chartData = [
    { name: 'Production', count: stats.production },
    { name: 'Demo', count: stats.demo },
    { name: 'Research', count: stats.research },
  ]

  const latestResearch = timeline.slice(0, 3)

  return (
    <>
      <Header title="Overview" subtitle="Goodfire Commercial Intelligence" />
      <PageContainer>
        <div className="space-y-6">
          {/* Section 1: Metric Cards */}
          <div className="grid grid-cols-4 gap-4">
            <MetricCard
              value={stats.total}
              label="Research Capabilities"
              trend={{ direction: 'neutral', value: `${stats.production} production \u00b7 ${stats.demo} demo \u00b7 ${stats.research} research` }}
            />
            <div>
              <MetricCard
                value={stats.partnerCount}
                label="Partner Ecosystem"
              />
              {uniquePartners.length > 0 && (
                <p className="mt-2 text-xs text-text-secondary truncate px-1">
                  {uniquePartners.join(' \u00b7 ')}
                </p>
              )}
            </div>
            <MetricCard
              value={stats.production}
              label="Production Proven"
              trend={{ direction: 'up', value: '+2 in Q1 2026' }}
            />
            <div className="rounded-lg border border-border-subtle bg-surface p-4">
              <div className="font-mono text-2xl font-semibold text-accent-amber tracking-tight">
                {daysUntil}d
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-text-secondary font-medium">
                Days Until High-Risk Provisions
              </div>
            </div>
          </div>

          {/* Section 1.5: This Week's Brief */}
          {briefSummary && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-text-primary">This Week&apos;s Brief</h2>
                <Link
                  href="/ops?brief=true"
                  className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
                >
                  View Full Brief <ArrowRight size={14} />
                </Link>
              </div>
              <KeyMetricHighlight
                name={briefSummary.keyMetric.name}
                value={briefSummary.keyMetric.value}
                trend={briefSummary.keyMetric.trend}
                context={briefSummary.keyMetricContext}
              />
              <ul className="mt-4 space-y-1.5">
                <li className="text-sm text-text-secondary">
                  <span className="font-mono text-text-primary">{briefSummary.newSignals.length}</span> new signals detected
                </li>
                <li className="text-sm text-text-secondary">
                  Pipeline: <span className="font-mono text-text-primary">{briefSummary.pipelineMovement.advanced}</span> advanced, <span className="font-mono text-text-primary">{briefSummary.pipelineMovement.stalled}</span> stalled
                </li>
                <li className="text-sm text-text-secondary">
                  Engagements: <span className="font-mono text-text-primary">{briefSummary.engagementHealth.healthy}</span> healthy, <span className="font-mono text-text-primary">{briefSummary.engagementHealth.atRisk}</span> at risk
                </li>
                <li className="text-sm text-text-secondary">
                  Predictions: <span className="font-mono text-text-primary">{briefSummary.predictionSummary.confirmed}</span> confirmed — <span className="font-mono text-text-primary">{briefSummary.predictionSummary.accuracy}%</span> accuracy
                </li>
                <li className="text-sm text-text-secondary">
                  EU AI Act: <span className="font-mono text-accent-amber">{briefSummary.euAiActDays}</span> days remaining
                </li>
              </ul>
            </Card>
          )}

          {/* Section 2: Timeline + Readiness Distribution */}
          <div className="grid grid-cols-5 gap-6">
            {/* Left: Research Timeline */}
            <div className="col-span-3">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Research Timeline</h2>
                <div className="relative ml-2">
                  {timeline.map((cap, idx) => {
                    const tb = getTypeBadge(cap.type)
                    const rb = getReadinessBadge(cap.readiness)
                    const firstResult = cap.key_results[0]
                    return (
                      <div key={cap.id} className="relative pl-6 pb-6">
                        {idx < timeline.length - 1 && (
                          <div className="absolute left-[5px] top-3 bottom-0 w-px border-l-2 border-border-subtle" />
                        )}
                        <div className="absolute left-0 top-[6px] h-3 w-3 rounded-full border-2 border-border-default bg-base" />
                        <div className="space-y-1">
                          <span className="font-mono text-xs text-text-secondary">{cap.date}</span>
                          <p className="text-sm font-medium text-text-primary">{cap.paper_title}</p>
                          <div className="flex gap-2">
                            <Badge variant={tb.variant}>{tb.label}</Badge>
                            <Badge variant={rb.variant}>{rb.label}</Badge>
                          </div>
                          {firstResult && (
                            <p className="text-xs text-text-secondary">{firstResult}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>

            {/* Right: Readiness Distribution */}
            <div className="col-span-2">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Readiness Distribution</h2>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                        width={80}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={CHART_COLORS[entry.name] ?? 'var(--color-text-tertiary)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Latest Research</h3>
                  <div className="space-y-3">
                    {latestResearch.map((cap) => {
                      const rb = getReadinessBadge(cap.readiness)
                      return (
                        <Card key={cap.id}>
                          <p className="text-sm font-medium text-text-primary">{cap.paper_title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs text-text-secondary">{cap.date}</span>
                            <Badge variant={rb.variant}>{rb.label}</Badge>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Section 3: Research → Solution Map */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Research &rarr; Solution Map</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Paper</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Date</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Key Result</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Partner Solution</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Readiness</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((cap) => {
                    const rb = getReadinessBadge(cap.readiness)
                    const firstResult = cap.key_results[0]
                    return (
                      <tr key={cap.id} className="border-b border-border-subtle">
                        <td className="px-4 py-3 text-sm text-text-primary">{cap.paper_title}</td>
                        <td className="px-4 py-3 text-sm font-mono text-text-primary">{cap.date}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{firstResult ?? '\u2014'}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{cap.partner_solution || '\u2014'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={rb.variant}>{rb.label}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Section 4: Commercial Intelligence Snapshot */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Top Prospects */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Top Prospects This Week</h2>
                <Link
                  href="/prospects"
                  className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
                >
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              {topProspects.length > 0 ? (
                <div className="space-y-3">
                  {topProspects.map((prospect) => {
                    const stage = PIPELINE_STAGE_LABELS[prospect.pipeline_stage] ?? { label: prospect.pipeline_stage, variant: 'gray' as BadgeVariant }
                    return (
                      <div key={prospect.id} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-b-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`font-mono text-sm font-semibold tabular-nums ${prospect.icpScore.composite >= 90 ? 'text-[#3D6B35]' : prospect.icpScore.composite >= 80 ? 'text-[#8A6B20]' : 'text-text-secondary'}`}>
                            {prospect.icpScore.composite}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{prospect.name}</p>
                            <p className="text-xs text-text-secondary truncate">{prospect.pain_points[0] ?? prospect.industry}</p>
                          </div>
                        </div>
                        <Badge variant={stage.variant} size="sm">{stage.label}</Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary italic py-4 text-center">No prospects tracked yet</p>
              )}
            </Card>

            {/* Right: Prediction Track Record */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Prediction Track Record</h2>
              {accuracy && accuracy.total > 0 ? (
                <div className="space-y-4">
                  <div>
                    <div className={`font-mono text-3xl font-semibold tracking-tight ${accuracyColor(accuracy.overallAccuracy)}`}>
                      {accuracy.overallAccuracy}%
                    </div>
                    <p className="text-xs uppercase tracking-wider text-text-secondary font-medium mt-1">
                      Overall Accuracy
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-mono text-text-primary">{accuracy.confirmed} confirmed</span>
                    <span className="text-text-tertiary">/</span>
                    <span className="font-mono text-text-primary">{accuracy.confirmed + accuracy.refuted} tested</span>
                    <span className="text-text-tertiary">of</span>
                    <span className="font-mono text-text-primary">{accuracy.total} total</span>
                  </div>
                  <p className="text-xs text-text-secondary">{accuracy.confidenceNote}</p>
                  {accuracy.byEngagement.length > 0 && (
                    <div className="pt-3 border-t border-border-subtle space-y-2">
                      {accuracy.byEngagement.map((eng) => (
                        <div key={eng.engagementId} className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">{eng.partnerName}</span>
                          <span className="font-mono text-text-primary">{eng.confirmed}/{eng.total} confirmed</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary italic py-4 text-center">
                  Prediction tracking begins with first assessment
                </p>
              )}
            </Card>
          </div>

          {/* Section 5: Model Coverage Summary */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Model Coverage</h2>
              <Link
                href="/models"
                className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {modelFamilies.length > 0 ? (
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="font-mono text-2xl font-semibold text-[#3D6B35]">
                    {modelFamilies.filter((mf) => mf.tier === 'tier_a').length}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">Tier A &mdash; SAE Ready</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-semibold text-[#8A6B20]">
                    {modelFamilies.filter((mf) => mf.tier === 'tier_b').length}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">Tier B &mdash; Planned</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-semibold text-text-tertiary">
                    {modelFamilies.filter((mf) => mf.tier === 'tier_c').length}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">Tier C &mdash; Custom</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-tertiary italic py-4 text-center">No model family data</p>
            )}
          </Card>

          {/* Section 6: Channel Partnerships + Upcoming Events */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Channel Partnerships</h2>
                <Link
                  href="/channels"
                  className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
                >
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              {channelMetrics ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-mono text-2xl font-semibold text-text-primary">{channelMetrics.activePartners}</p>
                    <p className="text-xs text-text-secondary mt-0.5">Active Partners</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-semibold text-[#3D6B35]">
                      {channelMetrics.totalEstimatedRevenue >= 1_000_000
                        ? `$${(channelMetrics.totalEstimatedRevenue / 1_000_000).toFixed(1)}M`
                        : `$${Math.round(channelMetrics.totalEstimatedRevenue / 1_000)}k`}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">Est. Annual Revenue</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-semibold text-text-primary">{channelMetrics.totalCertifiedEngineers}</p>
                    <p className="text-xs text-text-secondary mt-0.5">Certified Engineers</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-semibold text-text-primary">{channelMetrics.totalEngagementsSources}</p>
                    <p className="text-xs text-text-secondary mt-0.5">Engagements Sourced</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-tertiary italic py-4 text-center">No channel data</p>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Upcoming Events</h2>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-b-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{event.name}</p>
                        <p className="text-xs text-text-secondary">
                          {event.city} &mdash; {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <Badge variant="blue" size="sm">{event.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary italic py-4 text-center">No upcoming events</p>
              )}
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

export default OverviewPage
