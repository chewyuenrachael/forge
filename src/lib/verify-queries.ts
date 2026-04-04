// Phase 0 verification script — run with: npx tsx src/lib/verify-queries.ts
import { ensureSeeded } from './db'
import { seedDatabase } from '../data/seed'

// Initialize DB first
ensureSeeded(seedDatabase)

import { getAllCapabilities, getCapabilityStats, searchCapabilities, getModelFamilyCoverage } from './knowledge-graph'
import { getAllSignals as getAllScoredSignals, calculateActionability, getActionabilityWeights } from './signals-scoring'
import { getAllPredictions, getPredictionAccuracy } from './predictions'
import { getTopProspects } from './icp-scoring'
import { classifyEngagementTier, getPricingSummary } from './pricing'
import { getPipelineOverview } from './pipeline'
import { getSystemHealth } from './feedback'
import { getRecentEvents } from './event-log'

console.log('=== QUERY LAYER VERIFICATION ===\n')

let failures = 0

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${name}`)
  } else {
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
    failures++
  }
}

// ─── 1. Knowledge Graph ──────────────────────────────────────────────
console.log('  Knowledge Graph:')

const caps = getAllCapabilities()
check('getAllCapabilities returns 10', caps.length === 10, `got ${caps.length}`)

const firstCap = caps[0]
check('key_results is array', firstCap !== undefined && Array.isArray(firstCap.key_results), firstCap ? typeof firstCap.key_results : 'undefined')

const stats = getCapabilityStats()
check('getCapabilityStats total=10', stats.total === 10, `total=${stats.total}`)
check('stats sum matches', stats.production + stats.demo + stats.research === 10,
  `${stats.production}+${stats.demo}+${stats.research}`)

const rlfr = searchCapabilities('hallucination')
check('search("hallucination") finds RLFR', rlfr.length >= 1 && rlfr.some(c => c.id.includes('rlfr')),
  `found ${rlfr.length} results`)

const coverage = getModelFamilyCoverage()
check('getModelFamilyCoverage returns 3 tiers', coverage.length === 3, `got ${coverage.length}`)

// ─── 2. Signals Scoring ─────────────────────────────────────────────
console.log('  Signals Scoring:')

const signals = getAllScoredSignals()
check('getAllSignals returns 15+', signals.length >= 15, `got ${signals.length}`)

// Verify sorted by actionability DESC
let sortedCorrectly = true
for (let i = 1; i < signals.length; i++) {
  const prev = signals[i - 1]
  const curr = signals[i]
  if (prev && curr && prev.actionability_score < curr.actionability_score) {
    sortedCorrectly = false
    break
  }
}
check('signals ordered by actionability DESC', sortedCorrectly)

const actionScore = calculateActionability({
  relevance_score: 90,
  urgency_score: 85,
  coverage_score: 70,
  novelty_score: 95,
})
check('calculateActionability produces valid score', actionScore >= 0 && actionScore <= 100, `got ${actionScore}`)

const weights = getActionabilityWeights()
const weightSum = weights.relevance + weights.urgency + weights.coverage + weights.novelty
check('weights sum to ~1.0', Math.abs(weightSum - 1.0) < 0.01, `sum=${weightSum}`)

// ─── 3. Predictions ─────────────────────────────────────────────────
console.log('  Predictions:')

const accuracy = getPredictionAccuracy()
check('getPredictionAccuracy has results', accuracy.total > 0, `total=${accuracy.total}`)

const confirmed = getAllPredictions({ outcome: 'confirmed' })
check('confirmed predictions >= 4', confirmed.length >= 4, `got ${confirmed.length}`)

// ─── 4. ICP Scoring ─────────────────────────────────────────────────
console.log('  ICP Scoring:')

const topProspects = getTopProspects(5)
check('getTopProspects(5) returns 5', topProspects.length === 5, `got ${topProspects.length}`)

if (topProspects[0]) {
  const score = topProspects[0].icpScore
  check('ICP score in 0-100', score.composite >= 0 && score.composite <= 100, `composite=${score.composite}`)
  check('ICP breakdown is string', typeof score.breakdown === 'string' && score.breakdown.length > 0)
}

// Verify ordering
let icpOrdered = true
for (let i = 1; i < topProspects.length; i++) {
  const prev = topProspects[i - 1]
  const curr = topProspects[i]
  if (prev && curr && prev.priority_score < curr.priority_score) {
    icpOrdered = false
    break
  }
}
check('top prospects ordered by priority DESC', icpOrdered)

// ─── 5. Pricing ─────────────────────────────────────────────────────
console.log('  Pricing:')

// Tier A model with 1 use case, no regulatory
const simpleTier = classifyEngagementTier({
  modelFamilyId: 'llama-3.3-70b',
  useCaseCount: 1,
  regulatoryRequirements: [],
  deploymentContext: 'research',
})
check('Tier A + 1 use case = simple', simpleTier.tier === 'simple', `got ${simpleTier.tier}`)

// Tier C model with regulatory
const complexTier = classifyEngagementTier({
  modelFamilyId: 'evo-2',
  useCaseCount: 2,
  regulatoryRequirements: ['FDA'],
  deploymentContext: 'production',
})
check('Tier C + regulatory = complex or critical', complexTier.tier === 'complex' || complexTier.tier === 'critical',
  `got ${complexTier.tier}`)
check('SAE cost > 0 for Tier C', complexTier.saeCostIfNeeded > 0, `saeCost=${complexTier.saeCostIfNeeded}`)

const pricingSummary = getPricingSummary()
check('getPricingSummary has data', pricingSummary.totalPipelineValue > 0, `value=${pricingSummary.totalPipelineValue}`)

// ─── 6. Pipeline ─────────────────────────────────────────────────────
console.log('  Pipeline:')

const overview = getPipelineOverview()
check('getPipelineOverview totalProspects=14', overview.totalProspects === 14, `got ${overview.totalProspects}`)
check('pipeline has stages', overview.byStage.length > 0, `stages=${overview.byStage.length}`)

// ─── 7. Feedback & System Health ─────────────────────────────────────
console.log('  Feedback:')

const health = getSystemHealth()
check('getSystemHealth returns valid status',
  ['healthy', 'degraded', 'critical'].includes(health.overallStatus),
  `status=${health.overallStatus}`)

// ─── 8. Event Log ────────────────────────────────────────────────────
console.log('  Event Log:')

const events = getRecentEvents()
check('getRecentEvents returns 10+', events.length >= 10, `got ${events.length}`)

// ─── Summary ─────────────────────────────────────────────────────────
console.log(`\nQUERY VERIFICATION: ${failures === 0 ? 'PASS' : `FAIL (${failures} failures)`}`)

if (failures > 0) {
  process.exit(1)
}
