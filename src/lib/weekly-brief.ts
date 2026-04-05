import { getAllSignals } from '@/lib/signals-scoring'
import { getWeeklyPipelineMovement, getPipelineOverview } from '@/lib/pipeline'
import { getAllEngagements } from '@/lib/engagements'
import { getContentCalendar } from '@/lib/knowledge-graph'
import { getTopProspects } from '@/lib/icp-scoring'
import { getPredictionAccuracy } from '@/lib/predictions'
import { getChannelMetrics } from '@/lib/channels'
import { getEventsByType } from '@/lib/event-log'
import { daysUntil, formatCurrency } from '@/lib/exports'
import { EU_AI_ACT_DEADLINE } from '@/lib/constants'
import type { WeeklyBrief, EventLog, Prospect } from '@/types'

// ─── Enriched Brief Type ────────────────────────────────────────────

export interface EnrichedWeeklyBrief extends WeeklyBrief {
  pipelineNewEntries: number
  pipelineValueChange: string
  predictionSummary: {
    total: number
    confirmed: number
    refuted: number
    accuracy: number
  }
  channelHighlights: {
    totalPartners: number
    activePartners: number
    statusChanges: EventLog[]
  }
  keyMetricContext: string
  euAiActMessage: string
}

// ─── Date Helpers ───────────────────────────────────────────────────

function getCurrentWeekRange(): { weekStart: string; weekEnd: string } {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun, 1=Mon
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: sunday.toISOString().slice(0, 10),
  }
}

// ─── EU AI Act Message ──────────────────────────────────────────────

function getEuAiActMessage(days: number): string {
  if (days > 90) {
    return 'Continue compliance-focused outreach to regulated prospects'
  }
  if (days > 60) {
    return `Urgency messaging: compliance deadline is ${days} days away`
  }
  if (days > 30) {
    return `CRITICAL: ${days} days until enforcement. Prioritize all EU-exposed prospects`
  }
  return `FINAL WINDOW: ${days} days. Convert all pending compliance conversations`
}

// ─── Key Metric Selection ───────────────────────────────────────────

function selectKeyMetric(
  criticalCount: number,
  advanced: number,
  lost: number,
  signalCount: number,
  totalPipelineValue: number,
): { name: string; value: string; trend: 'up' | 'down' | 'stable'; context: string } {
  if (criticalCount > 0) {
    return {
      name: 'Engagement Alert',
      value: `${criticalCount} critical`,
      trend: 'down',
      context: `${criticalCount} engagement${criticalCount > 1 ? 's' : ''} dropped below health threshold — immediate attention needed`,
    }
  }

  if (advanced > 0 && lost === 0) {
    return {
      name: 'Pipeline Momentum',
      value: `${advanced} advanced`,
      trend: 'up',
      context: `${advanced} deal${advanced > 1 ? 's' : ''} moved forward this week with zero losses`,
    }
  }

  if (signalCount > 3) {
    return {
      name: 'Signal Activity',
      value: `${signalCount} new signals`,
      trend: 'up',
      context: `${signalCount} actionable signals detected this week — review and triage recommended`,
    }
  }

  return {
    name: 'Total Pipeline',
    value: formatCurrency(totalPipelineValue),
    trend: 'stable',
    context: 'Pipeline value remains steady — focus on advancing existing opportunities',
  }
}

// ─── Main Aggregation ───────────────────────────────────────────────

export function generateWeeklyBrief(weekStartParam?: string, weekEndParam?: string): EnrichedWeeklyBrief {
  const { weekStart, weekEnd } = weekStartParam && weekEndParam
    ? { weekStart: weekStartParam, weekEnd: weekEndParam }
    : getCurrentWeekRange()

  // Signals: filter to this week, sorted by actionability (already default)
  const allSignals = getAllSignals()
  const weekSignals = allSignals.filter(
    (s) => s.created_at >= weekStart && s.created_at <= weekEnd + 'T23:59:59',
  )
  const newSignals = weekSignals.slice(0, 10)
  const competitorActivity = weekSignals.filter((s) => s.type === 'competitor')

  // Pipeline movement
  const movement = getWeeklyPipelineMovement(weekStart, weekEnd)
  const pipelineMovement = {
    advanced: movement.advanced,
    stalled: movement.stalled,
    lost: movement.lost,
  }

  // Pipeline value
  const overview = getPipelineOverview()
  const pipelineValueChange = formatCurrency(overview.totalPipelineValue)

  // Engagement health bucketing
  const allEngagements = getAllEngagements()
  const activeEngagements = allEngagements.filter((e) => e.status === 'active')
  let healthy = 0
  let atRisk = 0
  let critical = 0
  for (const e of activeEngagements) {
    if (e.health_score >= 75) healthy++
    else if (e.health_score >= 50) atRisk++
    else critical++
  }
  const engagementHealth = { healthy, atRisk, critical }

  // Content published this week
  const allContent = getContentCalendar()
  const contentPublished = allContent.filter(
    (c) => c.date >= weekStart && c.date <= weekEnd && c.status === 'published',
  )

  // Priority targets (strip icpScore for type compatibility)
  const topProspects = getTopProspects(5)
  const priorityTargets: Prospect[] = topProspects.map((p) => {
    const { icpScore, ...rest } = p
    void icpScore
    return rest
  })

  // EU AI Act
  const euAiActDays = daysUntil(EU_AI_ACT_DEADLINE)
  const euAiActMessage = getEuAiActMessage(euAiActDays)

  // Predictions
  const accuracy = getPredictionAccuracy()
  const predictionSummary = {
    total: accuracy.total,
    confirmed: accuracy.confirmed,
    refuted: accuracy.refuted,
    accuracy: accuracy.overallAccuracy,
  }

  // Channel highlights
  const channelMetrics = getChannelMetrics()
  const channelStatusEvents = getEventsByType('channel_partner.status_changed', weekStart)
  const channelHighlights = {
    totalPartners: channelMetrics.totalPartners,
    activePartners: channelMetrics.activePartners,
    statusChanges: channelStatusEvents,
  }

  // Key metric
  const { name, value, trend, context } = selectKeyMetric(
    critical,
    movement.advanced,
    movement.lost,
    weekSignals.length,
    overview.totalPipelineValue,
  )

  return {
    weekStart,
    weekEnd,
    newSignals,
    pipelineMovement,
    engagementHealth,
    contentPublished,
    competitorActivity,
    priorityTargets,
    euAiActDays,
    keyMetric: { name, value, trend },
    pipelineNewEntries: movement.newEntries,
    pipelineValueChange,
    predictionSummary,
    channelHighlights,
    keyMetricContext: context,
    euAiActMessage,
  }
}
