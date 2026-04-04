import { getDb, parseJsonArray } from './db'
import type { Prospect, ICPScore, PeerCluster, ProspectContact, OutreachRecord } from '@/types'
import type { ModelFamilyTier } from '@/lib/constants'

// ─── Row Parsers ─────────────────────────────────────────────────────

function parseProspectRow(row: Record<string, unknown>): Prospect {
  let contacts: ProspectContact[] = []
  try {
    contacts = JSON.parse(row['contacts'] as string) as ProspectContact[]
  } catch {
    contacts = []
  }

  let outreachHistory: OutreachRecord[] = []
  try {
    outreachHistory = JSON.parse(row['outreach_history'] as string) as OutreachRecord[]
  } catch {
    outreachHistory = []
  }

  return {
    id: row['id'] as string,
    name: row['name'] as string,
    industry: row['industry'] as string,
    customer_category: row['customer_category'] as Prospect['customer_category'],
    estimated_ai_spend: (row['estimated_ai_spend'] as number) ?? 0,
    model_families: parseJsonArray(row['model_families'] as string),
    pain_points: parseJsonArray(row['pain_points'] as string),
    regulatory_exposure: parseJsonArray(row['regulatory_exposure'] as string),
    priority_score: (row['priority_score'] as number) ?? 50,
    revenue_engine: (row['revenue_engine'] as Prospect['revenue_engine']) ?? 'direct',
    pipeline_stage: (row['pipeline_stage'] as Prospect['pipeline_stage']) ?? 'signal_detected',
    pipeline_value: (row['pipeline_value'] as number) ?? 0,
    peer_cluster_id: (row['peer_cluster_id'] as string) ?? null,
    contacts,
    outreach_history: outreachHistory,
    notes: (row['notes'] as string) ?? null,
    created_at: (row['created_at'] as string) ?? new Date().toISOString(),
    updated_at: (row['updated_at'] as string) ?? new Date().toISOString(),
  }
}

function parsePeerClusterRow(row: Record<string, unknown>): PeerCluster {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    industry: row['industry'] as string,
    region: row['region'] as string,
    prospect_ids: parseJsonArray(row['prospect_ids'] as string),
    density_score: (row['density_score'] as number) ?? 0,
    status: row['status'] as PeerCluster['status'],
  }
}

// ─── Score Helpers ───────────────────────────────────────────────────

function scoreModelFamilyMatch(prospect: Prospect): number {
  if (prospect.model_families.length === 0) return 10

  const db = getDb()
  let bestScore = 10

  for (const mfId of prospect.model_families) {
    const row = db.prepare('SELECT tier FROM model_families WHERE id = ?').get(mfId) as { tier: string } | undefined
    if (!row) continue
    const tier = row.tier as ModelFamilyTier
    if (tier === 'tier_a' && bestScore < 100) bestScore = 100
    else if (tier === 'tier_b' && bestScore < 60) bestScore = 60
    else if (tier === 'tier_c' && bestScore < 30) bestScore = 30
  }

  return bestScore
}

function scoreRegulatoryPressure(prospect: Prospect): number {
  if (prospect.regulatory_exposure.length === 0) return 0

  let score = 0
  const counted = new Set<string>()

  for (const reg of prospect.regulatory_exposure) {
    const lower = reg.toLowerCase()
    if (lower.includes('eu ai act') && !counted.has('eu_ai_act')) {
      score += 40
      counted.add('eu_ai_act')
    } else if ((lower.includes('sr 11-7') || lower.includes('sr11-7')) && !counted.has('sr_11_7')) {
      score += 30
      counted.add('sr_11_7')
    } else if (lower.includes('fda') && !counted.has('fda')) {
      score += 20
      counted.add('fda')
    } else if (!counted.has(lower)) {
      score += 10
      counted.add(lower)
    }
  }

  return Math.min(score, 100)
}

function scorePeerClusterDensity(prospect: Prospect): number {
  if (!prospect.peer_cluster_id) return 20

  const db = getDb()
  const row = db.prepare(
    'SELECT density_score FROM peer_clusters WHERE id = ?'
  ).get(prospect.peer_cluster_id) as { density_score: number } | undefined

  if (!row) return 20
  return Math.min(row.density_score * 20, 100)
}

function scoreRecentSignals(prospect: Prospect): number {
  const db = getDb()
  const pattern = `%"${prospect.id}"%`
  const signalRows = db.prepare(
    "SELECT type FROM signals WHERE matched_prospect_ids LIKE ? AND status IN ('active', 'acted_on') ORDER BY date DESC LIMIT 10"
  ).all(pattern) as { type: string }[]

  if (signalRows.length === 0) return 20

  let bestScore = 20
  for (const signal of signalRows) {
    if (signal.type === 'incident' && bestScore < 90) bestScore = 90
    else if (signal.type === 'prospect' && bestScore < 70) bestScore = 70
    else if (signal.type === 'regulatory' && bestScore < 50) bestScore = 50
  }

  return bestScore
}

// ─── ICP Scoring ─────────────────────────────────────────────────────

/**
 * Calculate the 4-filter ICP composite score for a prospect.
 * Weights: modelFamilyMatch 0.40, regulatoryPressure 0.25,
 * peerClusterDensity 0.20, recentIncidentOrCommitment 0.15.
 */
export function calculateICPScore(prospect: Prospect): ICPScore {
  const modelFamilyMatch = scoreModelFamilyMatch(prospect)
  const regulatoryPressure = scoreRegulatoryPressure(prospect)
  const peerClusterDensity = scorePeerClusterDensity(prospect)
  const recentIncidentOrCommitment = scoreRecentSignals(prospect)

  const composite = Math.round(
    modelFamilyMatch * 0.40 +
    regulatoryPressure * 0.25 +
    peerClusterDensity * 0.20 +
    recentIncidentOrCommitment * 0.15
  )

  // Build breakdown
  const parts: string[] = []

  // Model family label
  const mfLabel = modelFamilyMatch === 100 ? 'Tier A' : modelFamilyMatch === 60 ? 'Tier B' : modelFamilyMatch === 30 ? 'Tier C' : 'Unknown'
  parts.push(`Model family: ${mfLabel} (${modelFamilyMatch})`)

  // Regulatory
  const regNames = prospect.regulatory_exposure.length > 0 ? prospect.regulatory_exposure.join(', ') : 'None'
  parts.push(`Regulatory: ${regNames} (${regulatoryPressure})`)

  // Peer cluster
  if (prospect.peer_cluster_id) {
    const db = getDb()
    const cluster = db.prepare('SELECT name FROM peer_clusters WHERE id = ?').get(prospect.peer_cluster_id) as { name: string } | undefined
    const clusterName = cluster?.name ?? 'Unknown cluster'
    parts.push(`Peer cluster: ${clusterName} (${peerClusterDensity})`)
  } else {
    parts.push(`Peer cluster: None (${peerClusterDensity})`)
  }

  // Recent signals
  parts.push(`Recent signals: (${recentIncidentOrCommitment})`)
  parts.push(`Composite: ${composite}`)

  return {
    prospectId: prospect.id,
    modelFamilyMatch,
    regulatoryPressure,
    peerClusterDensity,
    recentIncidentOrCommitment,
    composite,
    breakdown: parts.join('. ') + '.',
  }
}

/**
 * Recalculate and persist priority_score for ALL prospects.
 * Used after signals change, peer clusters update, or model family tiers change.
 */
export function recalculateAllICPScores(): void {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM prospects').all() as Record<string, unknown>[]

  for (const row of rows) {
    const prospect = parseProspectRow(row)
    const score = calculateICPScore(prospect)
    db.prepare(
      "UPDATE prospects SET priority_score = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(score.composite, prospect.id)
  }
}

/**
 * Get top-scoring prospects with full ICP breakdown.
 * @param limit - Maximum number of prospects to return (default 10)
 */
export function getTopProspects(limit?: number): (Prospect & { icpScore: ICPScore })[] {
  const db = getDb()
  const effectiveLimit = limit ?? 10
  const rows = db.prepare(
    'SELECT * FROM prospects ORDER BY priority_score DESC LIMIT ?'
  ).all(effectiveLimit) as Record<string, unknown>[]

  return rows.map((row) => {
    const prospect = parseProspectRow(row)
    const icpScore = calculateICPScore(prospect)
    return { ...prospect, icpScore }
  })
}

/**
 * Get all prospects belonging to a specific peer cluster.
 */
export function getProspectsByPeerCluster(clusterId: string): Prospect[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT * FROM prospects WHERE peer_cluster_id = ? ORDER BY priority_score DESC'
  ).all(clusterId) as Record<string, unknown>[]
  return rows.map(parseProspectRow)
}

// ─── Peer Clusters ───────────────────────────────────────────────────

/**
 * Get all peer clusters with computed prospect count from the prospect_ids array.
 */
export function getPeerClusters(): PeerCluster[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT * FROM peer_clusters ORDER BY density_score DESC'
  ).all() as Record<string, unknown>[]
  return rows.map(parsePeerClusterRow)
}
