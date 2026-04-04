import { getDb, parseJsonArray } from '@/lib/db'
import { SIGNAL_TYPES } from '@/lib/constants'
import type { ConversionMetrics } from '@/types'
import type { SignalType, FeedbackValue } from '@/lib/constants'

// ─── Types ───────────────────────────────────────────────────────────

export interface SignalFeedbackStats {
  totalSignals: number
  feedbackCount: number
  feedbackCoverage: number
  qualityByType: { type: SignalType; positive: number; negative: number; ratio: number }[]
  recentFeedback: { signalId: string; signalTitle: string; feedback: FeedbackValue; date: string }[]
}

export interface SystemHealth {
  dataFreshness: {
    lastSignalDate: string
    daysSinceLastSignal: number
    status: 'fresh' | 'stale' | 'critical'
  }
  predictionSampleSize: {
    count: number
    status: 'sufficient' | 'low' | 'insufficient'
  }
  feedbackCoverage: {
    pct: number
    status: 'good' | 'low' | 'critical'
  }
  overallStatus: 'healthy' | 'degraded' | 'critical'
}

// ─── SIGNAL FEEDBACK ANALYTICS ───────────────────────────────────────

export function getSignalFeedbackStats(): SignalFeedbackStats {
  const db = getDb()

  // Totals
  const totals = db.prepare(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN feedback IS NOT NULL THEN 1 ELSE 0 END) as with_feedback
     FROM signals`
  ).get() as Record<string, unknown>

  const totalSignals = (totals['total'] as number) ?? 0
  const feedbackCount = (totals['with_feedback'] as number) ?? 0
  const feedbackCoverage = totalSignals > 0 ? Math.round(feedbackCount / totalSignals * 100) : 0

  // By type
  const typeRows = db.prepare(
    'SELECT type, feedback, COUNT(*) as count FROM signals GROUP BY type, feedback'
  ).all() as Record<string, unknown>[]

  const typeMap = new Map<string, { positive: number; negative: number }>()
  for (const typeName of SIGNAL_TYPES) {
    typeMap.set(typeName, { positive: 0, negative: 0 })
  }

  for (const row of typeRows) {
    const type = row['type'] as string
    const feedback = row['feedback'] as string | null
    const count = row['count'] as number

    if (!typeMap.has(type)) {
      typeMap.set(type, { positive: 0, negative: 0 })
    }
    const entry = typeMap.get(type)!
    if (feedback === 'positive') entry.positive += count
    if (feedback === 'negative') entry.negative += count
  }

  const qualityByType = Array.from(typeMap).map(([type, data]) => {
    const total = data.positive + data.negative
    return {
      type: type as SignalType,
      positive: data.positive,
      negative: data.negative,
      ratio: total > 0 ? Math.round(data.positive / total * 100) : 0,
    }
  })

  // Recent feedback
  const recentRows = db.prepare(
    `SELECT id, title, feedback, created_at FROM signals
     WHERE feedback IS NOT NULL
     ORDER BY created_at DESC LIMIT 10`
  ).all() as Record<string, unknown>[]

  const recentFeedback = recentRows.map((row) => ({
    signalId: row['id'] as string,
    signalTitle: row['title'] as string,
    feedback: row['feedback'] as FeedbackValue,
    date: row['created_at'] as string,
  }))

  return {
    totalSignals,
    feedbackCount,
    feedbackCoverage,
    qualityByType,
    recentFeedback,
  }
}

// ─── CONVERSION METRICS ─────────────────────────────────────────────

interface OutreachRecord {
  status: string
}

export function getConversionMetrics(): ConversionMetrics[] {
  const db = getDb()

  // Step 1: Fetch signals with their type and matched prospect IDs
  const signalRows = db.prepare(
    'SELECT type, matched_prospect_ids FROM signals'
  ).all() as Record<string, unknown>[]

  // Step 2: Group prospect IDs by signal type
  const prospectIdsByType = new Map<string, Set<string>>()
  for (const row of signalRows) {
    const type = row['type'] as string
    const prospectIds = parseJsonArray(row['matched_prospect_ids'] as string)

    if (!prospectIdsByType.has(type)) {
      prospectIdsByType.set(type, new Set())
    }
    const set = prospectIdsByType.get(type)!
    for (const pid of prospectIds) {
      set.add(pid)
    }
  }

  // Step 3: Collect all unique prospect IDs and batch fetch
  const allProspectIds = new Set<string>()
  for (const ids of Array.from(prospectIdsByType.values())) {
    for (const id of Array.from(ids)) {
      allProspectIds.add(id)
    }
  }

  if (allProspectIds.size === 0) {
    return SIGNAL_TYPES.map((type) => ({
      signalType: type,
      outreachCount: 0,
      responseRate: 0,
      meetingRate: 0,
      proposalRate: 0,
      closeRate: 0,
      avgDealSize: 0,
    }))
  }

  const placeholders = Array.from(allProspectIds).map(() => '?').join(',')
  const prospectRows = db.prepare(
    `SELECT id, pipeline_stage, pipeline_value, outreach_history
     FROM prospects WHERE id IN (${placeholders})`
  ).all(...Array.from(allProspectIds)) as Record<string, unknown>[]

  // Index prospects by ID
  const prospectMap = new Map<string, { pipelineStage: string; pipelineValue: number; outreachHistory: OutreachRecord[] }>()
  for (const row of prospectRows) {
    let outreachHistory: OutreachRecord[] = []
    try {
      outreachHistory = JSON.parse(row['outreach_history'] as string) as OutreachRecord[]
    } catch {
      outreachHistory = []
    }

    prospectMap.set(row['id'] as string, {
      pipelineStage: row['pipeline_stage'] as string,
      pipelineValue: (row['pipeline_value'] as number) ?? 0,
      outreachHistory,
    })
  }

  // Step 4: Compute conversion funnel per signal type
  const proposalStages = new Set(['proposal_sent', 'verbal_agreement', 'contract_signed'])
  const responseStatuses = new Set(['replied', 'meeting_booked'])

  const results: ConversionMetrics[] = []

  for (const signalType of SIGNAL_TYPES) {
    const prospectIds = prospectIdsByType.get(signalType)
    if (!prospectIds || prospectIds.size === 0) {
      results.push({
        signalType,
        outreachCount: 0,
        responseRate: 0,
        meetingRate: 0,
        proposalRate: 0,
        closeRate: 0,
        avgDealSize: 0,
      })
      continue
    }

    let outreachCount = 0
    let responseCount = 0
    let meetingCount = 0
    let proposalCount = 0
    let closeCount = 0
    let dealValueSum = 0
    let dealCount = 0
    const totalMatched = prospectIds.size
    const prospectIdArr = Array.from(prospectIds)

    for (const pid of prospectIdArr) {
      const prospect = prospectMap.get(pid)
      if (!prospect) continue

      const hasOutreach = prospect.outreachHistory.length > 0
      if (hasOutreach) outreachCount++

      const hasResponse = prospect.outreachHistory.some((o) => responseStatuses.has(o.status))
      if (hasResponse) responseCount++

      const hasMeeting = prospect.outreachHistory.some((o) => o.status === 'meeting_booked')
      if (hasMeeting) meetingCount++

      if (proposalStages.has(prospect.pipelineStage)) proposalCount++
      if (prospect.pipelineStage === 'contract_signed') closeCount++

      if (prospect.pipelineValue > 0) {
        dealValueSum += prospect.pipelineValue
        dealCount++
      }
    }

    results.push({
      signalType,
      outreachCount,
      responseRate: outreachCount > 0 ? Math.round(responseCount / outreachCount * 100) : 0,
      meetingRate: outreachCount > 0 ? Math.round(meetingCount / outreachCount * 100) : 0,
      proposalRate: totalMatched > 0 ? Math.round(proposalCount / totalMatched * 100) : 0,
      closeRate: totalMatched > 0 ? Math.round(closeCount / totalMatched * 100) : 0,
      avgDealSize: dealCount > 0 ? Math.round(dealValueSum / dealCount) : 0,
    })
  }

  return results
}

// ─── SYSTEM HEALTH ───────────────────────────────────────────────────

export function getSystemHealth(): SystemHealth {
  const db = getDb()
  const now = Date.now()
  const MS_PER_DAY = 86_400_000

  // Data freshness
  const lastSignal = db.prepare(
    'SELECT MAX(date) as last_date FROM signals'
  ).get() as Record<string, unknown>

  const lastSignalDate = (lastSignal['last_date'] as string) ?? ''
  let daysSinceLastSignal = -1
  if (lastSignalDate) {
    daysSinceLastSignal = Math.floor((now - new Date(lastSignalDate).getTime()) / MS_PER_DAY)
  }

  let freshnessStatus: 'fresh' | 'stale' | 'critical'
  if (daysSinceLastSignal < 0 || daysSinceLastSignal > 14) {
    freshnessStatus = 'critical'
  } else if (daysSinceLastSignal > 3) {
    freshnessStatus = 'stale'
  } else {
    freshnessStatus = 'fresh'
  }

  // Prediction sample size
  const predStats = db.prepare(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN outcome != 'untested' THEN 1 ELSE 0 END) as tested
     FROM predictions`
  ).get() as Record<string, unknown>

  const testedCount = (predStats['tested'] as number) ?? 0
  let predStatus: 'sufficient' | 'low' | 'insufficient'
  if (testedCount >= 20) {
    predStatus = 'sufficient'
  } else if (testedCount >= 5) {
    predStatus = 'low'
  } else {
    predStatus = 'insufficient'
  }

  // Feedback coverage
  const fbStats = db.prepare(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN feedback IS NOT NULL THEN 1 ELSE 0 END) as with_feedback
     FROM signals`
  ).get() as Record<string, unknown>

  const fbTotal = (fbStats['total'] as number) ?? 0
  const fbWithFeedback = (fbStats['with_feedback'] as number) ?? 0
  const fbPct = fbTotal > 0 ? Math.round(fbWithFeedback / fbTotal * 100) : 0

  let fbStatus: 'good' | 'low' | 'critical'
  if (fbPct >= 50) {
    fbStatus = 'good'
  } else if (fbPct >= 20) {
    fbStatus = 'low'
  } else {
    fbStatus = 'critical'
  }

  // Overall status: worst of the three
  const statusOrder = { critical: 0, degraded: 1, healthy: 2 }
  const mapped = {
    freshness: freshnessStatus === 'critical' ? 'critical' as const : freshnessStatus === 'stale' ? 'degraded' as const : 'healthy' as const,
    prediction: predStatus === 'insufficient' ? 'critical' as const : predStatus === 'low' ? 'degraded' as const : 'healthy' as const,
    feedback: fbStatus === 'critical' ? 'critical' as const : fbStatus === 'low' ? 'degraded' as const : 'healthy' as const,
  }

  const statuses = [mapped.freshness, mapped.prediction, mapped.feedback]
  let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy'
  for (const s of statuses) {
    if (statusOrder[s] < statusOrder[overallStatus]) {
      overallStatus = s
    }
  }

  return {
    dataFreshness: {
      lastSignalDate,
      daysSinceLastSignal: daysSinceLastSignal >= 0 ? daysSinceLastSignal : 0,
      status: freshnessStatus,
    },
    predictionSampleSize: {
      count: testedCount,
      status: predStatus,
    },
    feedbackCoverage: {
      pct: fbPct,
      status: fbStatus,
    },
    overallStatus,
  }
}
