'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  TrendingUp, Users, Shield, Activity, BarChart3,
  ChevronDown, ChevronRight, CheckCircle, XCircle, HelpCircle,
  FileText, X,
} from 'lucide-react'

import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

import { TAMAnalysis } from '@/components/ops/TAMAnalysis'
import { ICPDashboard } from '@/components/ops/ICPDashboard'
import { CategoryBreakdown } from '@/components/ops/CategoryBreakdown'
import { PipelineFunnel } from '@/components/ops/PipelineFunnel'
import { RevenueEngineView } from '@/components/ops/RevenueEngineView'
import { WeeklyPriorityList } from '@/components/ops/WeeklyPriorityList'
import { ConversionFunnel } from '@/components/analytics/ConversionFunnel'
import { SourcePerformance } from '@/components/analytics/SourcePerformance'
import { FramingEffectiveness } from '@/components/analytics/FramingEffectiveness'
import { WeightTuner } from '@/components/analytics/WeightTuner'
import { ExperimentLog } from '@/components/analytics/ExperimentLog'
import { SignalQualityReport } from '@/components/signals/SignalQualityReport'
import { SignalDecayStatus } from '@/components/signals/SignalDecayStatus'
import { WeeklyBrief } from '@/components/brief/WeeklyBrief'

import { EU_AI_ACT_DEADLINE } from '@/lib/constants'
import type {
  Prospect, ICPScore, ICPWeights, ActionabilityWeights, PipelineOverview,
  CustomerCategoryDef, ChannelMetrics, Engagement, Signal,
  EventLog, AsyncState,
} from '@/types'
import type { PredictionAccuracyReport } from '@/lib/predictions'
import type { SystemHealth, SignalFeedbackStats } from '@/lib/feedback'
import type {
  ConversionBySignalType, ConversionByCategory, ConversionByAudienceFraming,
  WeightSuggestion, ICPWeightSuggestion, WeightChangeRecord,
} from '@/lib/analytics'

// ─── Page Data ──────────────────────────────────────────────────────

interface OpsPageData {
  pipeline: PipelineOverview
  categories: CustomerCategoryDef[]
  topProspects: (Prospect & { icpScore: ICPScore })[]
  channelMetrics: ChannelMetrics
  engagements: Engagement[]
  systemHealth: SystemHealth
  activityFeed: EventLog[]
  icpWeights: ICPWeights
  accuracy: PredictionAccuracyReport | null
  signals: Signal[]
  conversionBySignalType: ConversionBySignalType[]
  conversionByCategory: ConversionByCategory[]
  conversionByFraming: ConversionByAudienceFraming[]
  weightSuggestions: WeightSuggestion & { currentWeights: ActionabilityWeights }
  icpSuggestions: ICPWeightSuggestion
  weightHistory: WeightChangeRecord[]
  feedbackStats: SignalFeedbackStats
}

// ─── Helpers ────────────────────────────────────────────────────────

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

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

function eventTypeBadge(eventType: string): { label: string; variant: BadgeVariant } {
  if (eventType.startsWith('signal')) return { label: 'signal', variant: 'red' }
  if (eventType.startsWith('engagement')) return { label: 'engagement', variant: 'green' }
  if (eventType.startsWith('milestone')) return { label: 'milestone', variant: 'blue' }
  if (eventType.startsWith('prediction')) return { label: 'prediction', variant: 'purple' }
  if (eventType.startsWith('pipeline')) return { label: 'pipeline', variant: 'amber' }
  if (eventType.startsWith('channel')) return { label: 'channel', variant: 'blue' }
  if (eventType.startsWith('outreach')) return { label: 'outreach', variant: 'amber' }
  if (eventType.startsWith('proposal')) return { label: 'proposal', variant: 'green' }
  return { label: eventType.split('.')[0] ?? 'event', variant: 'gray' }
}

function eventDescription(event: EventLog): string {
  const p = event.payload
  const action = event.event_type.split('.')[1] ?? ''
  const name = (p['prospectName'] ?? p['partnerName'] ?? p['name'] ?? event.entity_id) as string

  switch (event.event_type) {
    case 'pipeline.stage_changed':
      return `${name}: ${(p['from'] as string) ?? '—'} → ${(p['to'] as string) ?? '—'}`
    case 'engagement.created':
      return `New engagement: ${name}`
    case 'engagement.status_changed':
      return `${name} status changed to ${(p['to'] ?? p['status'] ?? action) as string}`
    case 'milestone.completed':
      return `Milestone completed: ${(p['title'] ?? name) as string}`
    case 'signal.detected':
      return `Signal detected: ${(p['title'] ?? name) as string}`
    case 'signal.feedback':
      return `Feedback on signal: ${name}`
    case 'prediction.outcome_recorded':
      return `Prediction outcome: ${(p['outcome'] ?? action) as string}`
    default:
      return `${event.entity_type} ${action}: ${name}`
  }
}

// ─── Collapsible Section ────────────────────────────────────────────

interface CollapsibleProps {
  title: string
  sectionKey: string
  expanded: Record<string, boolean>
  onToggle: (key: string) => void
  children: ReactNode
}

function CollapsibleSection({ title, sectionKey, expanded, onToggle, children }: CollapsibleProps): React.ReactElement {
  const isOpen = expanded[sectionKey] ?? true
  return (
    <div>
      <button
        onClick={() => onToggle(sectionKey)}
        className="flex items-center gap-2 w-full text-left mb-3 group focus:outline-none focus:ring-2 focus:ring-[#C45A3C]/40 rounded-sm"
      >
        {isOpen ? <ChevronDown size={14} className="text-text-tertiary" /> : <ChevronRight size={14} className="text-text-tertiary" />}
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider group-hover:text-text-primary transition-colors">
          {title}
        </h2>
      </button>
      {isOpen && children}
    </div>
  )
}

// ─── System Health Badge ────────────────────────────────────────────

function SystemHealthBadge({ health }: { health: SystemHealth }): React.ReactElement {
  const variant: BadgeVariant = health.overallStatus === 'healthy' ? 'green'
    : health.overallStatus === 'degraded' ? 'amber' : 'red'

  const icon = health.overallStatus === 'healthy' ? <CheckCircle size={10} />
    : health.overallStatus === 'degraded' ? <HelpCircle size={10} /> : <XCircle size={10} />

  const details: string[] = []
  if (health.dataFreshness.status !== 'fresh') details.push(`Data: ${health.dataFreshness.status}`)
  if (health.predictionSampleSize.status !== 'sufficient') details.push(`Predictions: ${health.predictionSampleSize.status}`)
  if (health.feedbackCoverage.status !== 'good') details.push(`Feedback: ${health.feedbackCoverage.status}`)

  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant} size="sm">
        <span className="flex items-center gap-1">
          {icon}
          System {health.overallStatus}
        </span>
      </Badge>
      {details.length > 0 && (
        <span className="text-[10px] text-text-tertiary">{details.join(' · ')}</span>
      )}
    </div>
  )
}

// ─── Page Component ─────────────────────────────────────────────────

const OpsPage = (): React.ReactElement => {
  const [data, setData] = useState<AsyncState<OpsPageData>>({ status: 'idle' })
  const [showBrief, setShowBrief] = useState(false)

  // Auto-open brief when navigating from overview with ?brief=true
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('brief') === 'true') {
      setShowBrief(true)
    }
  }, [])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    metrics: true,
    funnel: true,
    tam: true,
    icp: true,
    priority: true,
    health: true,
    activity: false,
    analytics: true,
    analyticsQuality: false,
    analyticsDecay: false,
  })

  const toggleSection = useCallback((key: string): void => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const fetchData = useCallback((): void => {
    setData({ status: 'loading' })

    Promise.all([
      fetch('/api/pipeline').then((r) => r.json() as Promise<{ data: PipelineOverview }>),
      fetch('/api/pipeline?categories=true').then((r) => r.json() as Promise<{ data: CustomerCategoryDef[] }>),
      fetch('/api/prospects?top=20').then((r) => r.json() as Promise<{ data: (Prospect & { icpScore: ICPScore })[] }>),
      fetch('/api/channels?metrics=true').then((r) => r.json() as Promise<{ data: ChannelMetrics }>),
      fetch('/api/engagements').then((r) => r.json() as Promise<{ data: Engagement[] }>),
      fetch('/api/feedback?health=true').then((r) => r.json() as Promise<{ data: SystemHealth }>),
      fetch('/api/events?feed=true&limit=15').then((r) => r.json() as Promise<{ data: EventLog[] }>),
      fetch('/api/icp-weights').then((r) => r.json() as Promise<{ data: ICPWeights }>),
      fetch('/api/predictions?accuracy=true').then((r) => r.ok ? r.json() as Promise<{ data: PredictionAccuracyReport }> : Promise.resolve(null)),
      fetch('/api/signals').then((r) => r.json() as Promise<{ data: Signal[] }>),
      fetch('/api/analytics?type=signal_type').then((r) => r.json() as Promise<{ data: ConversionBySignalType[] }>),
      fetch('/api/analytics?type=category').then((r) => r.json() as Promise<{ data: ConversionByCategory[] }>),
      fetch('/api/analytics?type=audience_framing').then((r) => r.json() as Promise<{ data: ConversionByAudienceFraming[] }>),
      fetch('/api/analytics?type=weight_suggestions').then((r) => r.json() as Promise<{ data: WeightSuggestion & { currentWeights: ActionabilityWeights } }>),
      fetch('/api/analytics?type=icp_suggestions').then((r) => r.json() as Promise<{ data: ICPWeightSuggestion }>),
      fetch('/api/analytics?type=weight_history').then((r) => r.json() as Promise<{ data: WeightChangeRecord[] }>),
      fetch('/api/feedback').then((r) => r.json() as Promise<{ data: SignalFeedbackStats }>),
    ])
      .then(([pipeline, categories, prospects, channels, engagements, health, events, weights, accuracy, signals,
              convSignal, convCategory, convFraming, weightSugg, icpSugg, weightHist, fbStats]) => {
        setData({
          status: 'success',
          data: {
            pipeline: pipeline.data,
            categories: categories.data,
            topProspects: prospects.data,
            channelMetrics: channels.data,
            engagements: engagements.data,
            systemHealth: health.data,
            activityFeed: events.data,
            icpWeights: weights.data,
            accuracy: accuracy?.data ?? null,
            signals: signals.data,
            conversionBySignalType: convSignal.data,
            conversionByCategory: convCategory.data,
            conversionByFraming: convFraming.data,
            weightSuggestions: weightSugg.data,
            icpSuggestions: icpSugg.data,
            weightHistory: weightHist.data,
            feedbackStats: fbStats.data,
          },
        })
      })
      .catch((err: Error) => setData({ status: 'error', error: err.message }))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Loading ────────────────────────────────────────────────────

  if (data.status === 'loading' || data.status === 'idle') {
    return (
      <>
        <Header title="Operations" subtitle="Market intelligence → Pipeline analytics → Revenue tracking" />
        <PageContainer>
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-elevated animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-3 h-72 rounded-lg bg-elevated animate-pulse" />
              <div className="col-span-2 h-72 rounded-lg bg-elevated animate-pulse" />
            </div>
            <div className="h-64 rounded-lg bg-elevated animate-pulse" />
            <div className="grid grid-cols-2 gap-6">
              <div className="h-64 rounded-lg bg-elevated animate-pulse" />
              <div className="h-64 rounded-lg bg-elevated animate-pulse" />
            </div>
          </div>
        </PageContainer>
      </>
    )
  }

  // ─── Error ──────────────────────────────────────────────────────

  if (data.status === 'error') {
    return (
      <>
        <Header title="Operations" subtitle="Market intelligence → Pipeline analytics → Revenue tracking" />
        <PageContainer>
          <Card>
            <div className="text-center py-8">
              <p className="text-[#8A2020] text-sm font-medium">Failed to load operations data</p>
              <p className="text-text-secondary text-xs mt-1">{data.error}</p>
              <button
                onClick={fetchData}
                className="mt-3 text-xs text-[#C45A3C] hover:underline"
              >
                Retry
              </button>
            </div>
          </Card>
        </PageContainer>
      </>
    )
  }

  // ─── Success ────────────────────────────────────────────────────

  const {
    pipeline, categories, topProspects, channelMetrics,
    engagements, systemHealth, activityFeed, icpWeights,
    accuracy, signals,
    conversionBySignalType, conversionByCategory, conversionByFraming,
    weightSuggestions, icpSuggestions, weightHistory, feedbackStats,
  } = data.data

  const daysUntil = computeDaysUntil(EU_AI_ACT_DEADLINE)
  const activeEngagements = engagements.filter((e) => e.status === 'active')
  const avgHealth = activeEngagements.length > 0
    ? Math.round(activeEngagements.reduce((s, e) => s + e.health_score, 0) / activeEngagements.length)
    : 0

  async function handleWeightsUpdate(weights: ICPWeights): Promise<void> {
    const res = await fetch('/api/icp-weights', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights),
    })
    if (!res.ok) {
      const err = await res.json() as { error: string }
      throw new Error(err.error)
    }
    fetchData()
  }

  async function handleActionabilityWeightsUpdate(weights: ActionabilityWeights): Promise<void> {
    const res = await fetch('/api/analytics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_actionability_weights', weights }),
    })
    if (!res.ok) {
      const err = await res.json() as { error: string }
      throw new Error(err.error)
    }
    fetchData()
  }

  async function handleTriggerDecay(): Promise<void> {
    await fetch('/api/analytics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'trigger_decay' }),
    })
    fetchData()
  }

  return (
    <>
      <Header title="Operations" subtitle="Market intelligence → Pipeline analytics → Revenue tracking" />
      <PageContainer>
        <div className="space-y-6">
          {/* System Health + Weekly Brief Button */}
          <div className="flex items-center justify-between">
            <SystemHealthBadge health={systemHealth} />
            <button
              onClick={() => setShowBrief(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-md border border-border-default text-text-primary hover:bg-elevated transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#C45A3C]/30 focus:ring-offset-2 focus:ring-offset-[#FAFAF7]"
            >
              <FileText size={14} />
              Generate Weekly Brief
            </button>
          </div>

          {/* ROW 1: Metric Cards */}
          <CollapsibleSection title="Key Metrics" sectionKey="metrics" expanded={expanded} onToggle={toggleSection}>
            <div className="grid grid-cols-5 gap-4">
              <MetricCard
                value={formatCurrency(pipeline.totalPipelineValue)}
                label="Total Pipeline Value"
                icon={<TrendingUp size={18} />}
                mono
              />
              <MetricCard
                value={activeEngagements.length}
                label="Active Engagements"
                icon={<Users size={18} />}
                trend={{ direction: 'neutral', value: `avg health: ${avgHealth}` }}
              />
              {accuracy && accuracy.total > 0 ? (
                <MetricCard
                  value={`${accuracy.overallAccuracy}%`}
                  label="Prediction Accuracy"
                  icon={<BarChart3 size={18} />}
                  mono
                  trend={{ value: `${accuracy.confirmed}/${accuracy.total} confirmed` }}
                />
              ) : (
                <MetricCard
                  value="—"
                  label="Prediction Accuracy"
                  icon={<BarChart3 size={18} />}
                />
              )}
              <MetricCard
                value={`${channelMetrics.activePartners}/${channelMetrics.totalPartners}`}
                label="Channel Partners"
                icon={<Activity size={18} />}
                mono
              />
              <div className="rounded-lg border border-border-subtle bg-surface p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={18} className="text-text-tertiary" />
                </div>
                <div className="font-mono text-2xl font-semibold text-[#C45A3C] tracking-tight">
                  {daysUntil}d
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-text-tertiary font-medium">
                  EU AI Act Deadline
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* ROW 2: Pipeline Funnel + Revenue Engines */}
          <CollapsibleSection title="Pipeline & Revenue" sectionKey="funnel" expanded={expanded} onToggle={toggleSection}>
            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-3">
                <PipelineFunnel
                  byStage={pipeline.byStage}
                  conversionRates={pipeline.conversionRates}
                />
              </div>
              <div className="col-span-2">
                <RevenueEngineView
                  byRevenueEngine={pipeline.byRevenueEngine}
                  channelMetrics={channelMetrics}
                  engagementCount={activeEngagements.length}
                  avgHealth={avgHealth}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* ROW 3: TAM Analysis */}
          <CollapsibleSection title="TAM Analysis" sectionKey="tam" expanded={expanded} onToggle={toggleSection}>
            <TAMAnalysis
              categories={categories}
              pipelineByCategory={pipeline.byCategory}
            />
          </CollapsibleSection>

          {/* ROW 4: ICP Dashboard + Category Breakdown */}
          <CollapsibleSection title="ICP & Category Performance" sectionKey="icp" expanded={expanded} onToggle={toggleSection}>
            <div className="grid grid-cols-2 gap-6">
              <ICPDashboard
                prospects={topProspects}
                weights={icpWeights}
                onWeightsUpdate={handleWeightsUpdate}
              />
              <CategoryBreakdown
                categories={categories}
                pipelineByCategory={pipeline.byCategory}
              />
            </div>
          </CollapsibleSection>

          {/* ROW 5: Weekly Priority List */}
          <CollapsibleSection title="Weekly Priorities" sectionKey="priority" expanded={expanded} onToggle={toggleSection}>
            <WeeklyPriorityList
              prospects={topProspects}
              signals={signals}
              euAiActDays={daysUntil}
            />
          </CollapsibleSection>

          {/* ROW 6: Engagement Health + Activity Feed */}
          <CollapsibleSection title="Engagement Health" sectionKey="health" expanded={expanded} onToggle={toggleSection}>
            <div className="grid grid-cols-2 gap-6">
              {/* Engagement Health */}
              <Card header="Engagement Health">
                <div className="space-y-4">
                  {engagements.length === 0 && (
                    <p className="text-sm text-text-tertiary text-center py-4">No engagements yet.</p>
                  )}
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

              {/* Activity Feed */}
              <Card header="Recent Activity">
                <div className="space-y-0">
                  {activityFeed.length === 0 && (
                    <p className="text-sm text-text-tertiary text-center py-4">No recent activity.</p>
                  )}
                  {activityFeed.map((event) => {
                    const badge = eventTypeBadge(event.event_type)
                    return (
                      <div key={event.id} className="flex items-start gap-3 py-3 border-b border-border-subtle last:border-b-0">
                        <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary">
                            {eventDescription(event)}
                          </p>
                        </div>
                        <span className="font-mono text-xs text-text-tertiary flex-shrink-0">
                          {event.timestamp.split('T')[0] ?? event.timestamp}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          </CollapsibleSection>

          {/* Prediction Accuracy (kept from original page) */}
          {accuracy && accuracy.total > 0 && (
            <CollapsibleSection title="Prediction Accuracy" sectionKey="predictions" expanded={expanded} onToggle={toggleSection}>
              <Card>
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
            </CollapsibleSection>
          )}

          {/* ROW 8: Conversion Analytics & Feedback Loops */}
          <CollapsibleSection title="Conversion Analytics & Feedback Loops" sectionKey="analytics" expanded={expanded} onToggle={toggleSection}>
            <div className="space-y-6">
              {/* Conversion Funnel + Source Performance */}
              <div className="grid grid-cols-2 gap-6">
                <ConversionFunnel data={conversionBySignalType} />
                <SourcePerformance bySignalType={conversionBySignalType} byCategory={conversionByCategory} />
              </div>

              {/* Framing Effectiveness */}
              <FramingEffectiveness data={conversionByFraming} />

              {/* Weight Tuner */}
              <WeightTuner
                currentActionabilityWeights={weightSuggestions.currentWeights}
                suggestedActionabilityWeights={weightSuggestions.suggestedWeights}
                actionabilityRationale={weightSuggestions.rationale}
                currentICPWeights={icpWeights}
                suggestedICPWeights={icpSuggestions.suggestedWeights}
                icpRationale={icpSuggestions.rationale}
                confidenceLevel={weightSuggestions.confidenceLevel}
                onApplyActionabilityWeights={handleActionabilityWeightsUpdate}
                onApplyICPWeights={handleWeightsUpdate}
              />

              {/* Signal Quality + Experiment Log (collapsible) */}
              <CollapsibleSection title="Signal Quality & Experiment History" sectionKey="analyticsQuality" expanded={expanded} onToggle={toggleSection}>
                <div className="grid grid-cols-2 gap-6">
                  <SignalQualityReport stats={feedbackStats} />
                  <ExperimentLog changes={weightHistory} />
                </div>
              </CollapsibleSection>

              {/* Signal Decay Status (collapsible) */}
              <CollapsibleSection title="Signal Decay Management" sectionKey="analyticsDecay" expanded={expanded} onToggle={toggleSection}>
                <SignalDecayStatus signals={signals} onTriggerDecay={handleTriggerDecay} />
              </CollapsibleSection>
            </div>
          </CollapsibleSection>
        </div>
      </PageContainer>

      {/* Weekly Brief Overlay */}
      {showBrief && (
        <div className="fixed inset-0 z-50 bg-base/95 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-10 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold text-text-primary">Weekly GTM Brief</h2>
              <button
                onClick={() => setShowBrief(false)}
                className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#C45A3C]/30"
              >
                <X size={18} />
              </button>
            </div>
            <WeeklyBrief />
          </div>
        </div>
      )}
    </>
  )
}

export default OpsPage
