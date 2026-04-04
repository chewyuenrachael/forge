import type { Engagement, Milestone, Capability, ModelFamily } from '@/types'
import type { EngagementTier } from '@/lib/constants'
import { PRICING_GRID } from '@/lib/constants'

// ─── Types ──────────────────────────────────────────────────────────

export type AlertType = 'health_drop' | 'milestone_overdue' | 'milestone_blocked' | 'health_critical'
export type AlertSeverity = 'warning' | 'critical'

export interface HealthAlert {
  id: string
  engagement_id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  suggested_action: string
  draft_message: string | null
  created_at: string
  acknowledged: boolean
}

export type OpportunityType = 'additional_model' | 'new_capability' | 'monitoring_upsell' | 'tier_upgrade'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface ExpansionOpportunity {
  id: string
  engagement_id: string
  partner_name: string
  current_scope: string
  opportunity_type: OpportunityType
  description: string
  estimated_revenue: number
  confidence: ConfidenceLevel
  trigger: string
  suggested_outreach: string
}

// ─── Helpers ────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}${crypto.randomUUID().slice(0, 8)}`
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isMilestoneOverdue(milestone: Milestone): boolean {
  if (milestone.status === 'completed') return false
  const dueDate = new Date(milestone.due_date)
  if (isNaN(dueDate.getTime())) return false
  return milestone.due_date < today()
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

function nowISO(): string {
  return new Date().toISOString()
}

// ─── Tier Upgrade Logic ─────────────────────────────────────────────

const TIER_UPGRADE_MAP: Record<string, EngagementTier | null> = {
  simple: 'standard',
  standard: 'complex',
  complex: 'critical',
  critical: null,
}

function getNextTier(currentTier: EngagementTier): EngagementTier | null {
  return TIER_UPGRADE_MAP[currentTier] ?? null
}

function getPriceForTier(tier: EngagementTier): { low: number; high: number } {
  const grid = PRICING_GRID[tier]
  return { low: grid.low, high: grid.high }
}

function midpointPrice(tier: EngagementTier): number {
  const range = getPriceForTier(tier)
  return Math.round((range.low + range.high) / 2)
}

// ─── Draft Message Generation ───────────────────────────────────────

function generateWarningDraft(partnerName: string, overdueMilestones: Milestone[]): string {
  const firstOverdue = overdueMilestones[0]
  const milestoneRef = firstOverdue
    ? `I noticed the "${firstOverdue.title}" milestone is approaching its deadline.`
    : 'I noticed some milestones may need attention.'

  return `Hi ${partnerName} team,

I wanted to check in on our engagement. ${milestoneRef} Is there anything we should adjust on our side to keep things on track?

We want to make sure we are delivering the value you expect, and are happy to adjust scope or timeline if that would help.

Best regards,
The Goodfire Applied AI Team`
}

function generateCriticalDraft(partnerName: string, overdueCount: number, blockedCount: number): string {
  const issues: string[] = []
  if (overdueCount > 0) issues.push(`${overdueCount} milestone${overdueCount > 1 ? 's' : ''} overdue`)
  if (blockedCount > 0) issues.push(`${blockedCount} milestone${blockedCount > 1 ? 's' : ''} blocked`)
  const issueText = issues.length > 0 ? issues.join(' and ') : 'timeline concerns'

  return `Hi ${partnerName} team,

I want to be direct — I think our engagement timeline needs adjustment. We currently have ${issueText}, and I want to ensure we address this before it impacts your goals.

I would like to schedule a call this week to review our approach, discuss any blockers on your side, and agree on a revised plan that works for both teams.

Would you have 30 minutes available in the next few days?

Best regards,
The Goodfire Applied AI Team`
}

function generateExpansionOutreach(
  partnerName: string,
  opportunityType: OpportunityType,
  description: string,
): string {
  switch (opportunityType) {
    case 'additional_model':
      return `Hi ${partnerName} team,

Given the success of our current engagement, I wanted to explore whether interpretability analysis would be valuable for additional models in your portfolio. ${description}

Would you be open to a brief scoping conversation?

Best regards,
The Goodfire Applied AI Team`

    case 'new_capability':
      return `Hi ${partnerName} team,

Based on our work together, I identified an adjacent capability that could add significant value to your AI safety posture. ${description}

This would build directly on the infrastructure we have already established. Happy to walk through the details.

Best regards,
The Goodfire Applied AI Team`

    case 'monitoring_upsell':
      return `Hi ${partnerName} team,

As we approach the completion of our current engagement, I wanted to discuss continuous monitoring — a way to ensure the improvements we have made remain stable in production.

${description}

This provides ongoing assurance without requiring additional assessment cycles. Would you like to discuss?

Best regards,
The Goodfire Applied AI Team`

    case 'tier_upgrade':
      return `Hi ${partnerName} team,

Our assessment has revealed several actionable findings. ${description}

The natural next step would be a model surgery engagement to implement these improvements. I would love to discuss the scope and expected impact.

Best regards,
The Goodfire Applied AI Team`
  }
}

// ─── Alert Generation ───────────────────────────────────────────────

function generateEngagementAlerts(engagement: Engagement): HealthAlert[] {
  if (engagement.status !== 'active') return []

  const alerts: HealthAlert[] = []
  const overdue = engagement.milestones.filter(isMilestoneOverdue)
  const blocked = engagement.milestones.filter((m) => m.status === 'blocked')
  const overdueCount = overdue.length
  const blockedCount = blocked.length
  const timestamp = nowISO()

  // Health critical (< 50)
  if (engagement.health_score < 50) {
    alerts.push({
      id: generateId('alert_'),
      engagement_id: engagement.id,
      type: 'health_critical',
      severity: 'critical',
      title: `${engagement.partner_name} engagement at risk`,
      description: `Health score critically low at ${engagement.health_score}. ${overdueCount} milestone${overdueCount !== 1 ? 's' : ''} overdue, ${blockedCount} blocked.`,
      suggested_action: 'Escalate to Applied AI Lead. Schedule emergency review.',
      draft_message: generateCriticalDraft(engagement.partner_name, overdueCount, blockedCount),
      created_at: timestamp,
      acknowledged: false,
    })
  } else if (engagement.health_score < 75) {
    // Health drop (< 75 but >= 50)
    alerts.push({
      id: generateId('alert_'),
      engagement_id: engagement.id,
      type: 'health_drop',
      severity: 'warning',
      title: `${engagement.partner_name} health declining`,
      description: `Health score dropped to ${engagement.health_score}. ${overdueCount} milestone${overdueCount !== 1 ? 's' : ''} overdue.`,
      suggested_action: 'Schedule a check-in call. Review overdue milestones and discuss blockers.',
      draft_message: generateWarningDraft(engagement.partner_name, overdue),
      created_at: timestamp,
      acknowledged: false,
    })
  }

  // Individual milestone overdue alerts
  for (const milestone of overdue) {
    const daysOverdue = Math.floor(
      (new Date(today()).getTime() - new Date(milestone.due_date).getTime()) / (1000 * 60 * 60 * 24),
    )
    alerts.push({
      id: generateId('alert_'),
      engagement_id: engagement.id,
      type: 'milestone_overdue',
      severity: daysOverdue >= 7 ? 'critical' : 'warning',
      title: `Milestone overdue: ${milestone.title}`,
      description: `"${milestone.title}" for ${engagement.partner_name} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} past due date (${milestone.due_date}).`,
      suggested_action: `Review milestone "${milestone.title}" and update timeline or escalate blockers.`,
      draft_message: null,
      created_at: timestamp,
      acknowledged: false,
    })
  }

  // Individual milestone blocked alerts
  for (const milestone of blocked) {
    alerts.push({
      id: generateId('alert_'),
      engagement_id: engagement.id,
      type: 'milestone_blocked',
      severity: 'critical',
      title: `Milestone blocked: ${milestone.title}`,
      description: `"${milestone.title}" for ${engagement.partner_name} is blocked.${milestone.notes ? ` Notes: ${milestone.notes}` : ''}`,
      suggested_action: `Investigate blocker for "${milestone.title}" and coordinate with partner to resolve.`,
      draft_message: null,
      created_at: timestamp,
      acknowledged: false,
    })
  }

  return alerts
}

export function generateHealthAlerts(engagements: Engagement[]): HealthAlert[] {
  const allAlerts: HealthAlert[] = []

  for (const engagement of engagements) {
    const alerts = generateEngagementAlerts(engagement)
    allAlerts.push(...alerts)
  }

  return sortAlertsBySeverity(allAlerts)
}

export function sortAlertsBySeverity(alerts: HealthAlert[]): HealthAlert[] {
  return [...alerts].sort((a, b) => {
    const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1 }
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (severityDiff !== 0) return severityDiff
    return b.created_at.localeCompare(a.created_at)
  })
}

// ─── Expansion Opportunity Detection ────────────────────────────────

const MONITORING_ANNUAL_REVENUE_LOW = 200_000
const MONITORING_ANNUAL_REVENUE_HIGH = 300_000
const TIER_UPGRADE_CONVERSION_RATE = 0.6

function getConfidence(healthScore: number): ConfidenceLevel {
  if (healthScore >= 95) return 'high'
  if (healthScore >= 90) return 'medium'
  return 'low'
}

function buildCurrentScope(engagement: Engagement, capabilities: Capability[]): string {
  if (engagement.capabilities_applied.length === 0) return 'General engagement'

  const appliedNames = engagement.capabilities_applied
    .map((capId) => {
      const cap = capabilities.find((c) => c.id === capId)
      return cap ? cap.name : capId
    })
    .slice(0, 3)

  const suffix = engagement.capabilities_applied.length > 3
    ? ` +${engagement.capabilities_applied.length - 3} more`
    : ''

  return appliedNames.join(', ') + suffix
}

function detectAdditionalModel(
  engagement: Engagement,
  modelFamilies: ModelFamily[],
  currentScope: string,
): ExpansionOpportunity | null {
  if (!engagement.model_family_id) return null

  const currentModel = modelFamilies.find((m) => m.id === engagement.model_family_id)
  if (!currentModel) return null

  // Suggest other models from the same provider or tier
  const relatedModels = modelFamilies.filter(
    (m) => m.id !== engagement.model_family_id && (m.provider === currentModel.provider || m.tier === currentModel.tier),
  )

  if (relatedModels.length === 0) return null

  const suggestedModel = relatedModels[0]
  if (!suggestedModel) return null

  const revenue = midpointPrice(engagement.engagement_tier)

  return {
    id: generateId('exp_'),
    engagement_id: engagement.id,
    partner_name: engagement.partner_name,
    current_scope: currentScope,
    opportunity_type: 'additional_model',
    description: `${engagement.partner_name} currently works with ${currentModel.name}. Suggest scoping a ${engagement.engagement_tier} assessment for ${suggestedModel.name} (${suggestedModel.provider}).`,
    estimated_revenue: revenue,
    confidence: getConfidence(engagement.health_score),
    trigger: `High engagement health (${engagement.health_score}) + related model family available (${suggestedModel.name})`,
    suggested_outreach: generateExpansionOutreach(
      engagement.partner_name,
      'additional_model',
      `We believe ${suggestedModel.name} would benefit from the same interpretability analysis we applied to ${currentModel.name}.`,
    ),
  }
}

function detectNewCapability(
  engagement: Engagement,
  capabilities: Capability[],
  currentScope: string,
): ExpansionOpportunity | null {
  const appliedSet = new Set(engagement.capabilities_applied)
  const unapplied = capabilities.filter((c) => !appliedSet.has(c.id) && c.readiness !== 'research')

  if (unapplied.length === 0) return null

  // Pick the most production-ready unapplied capability
  const sorted = [...unapplied].sort((a, b) => {
    const readinessOrder: Record<string, number> = { production: 0, demo: 1, research: 2 }
    return (readinessOrder[a.readiness] ?? 2) - (readinessOrder[b.readiness] ?? 2)
  })

  const suggested = sorted[0]
  if (!suggested) return null

  const revenue = Math.round(midpointPrice(engagement.engagement_tier) * 0.6)

  return {
    id: generateId('exp_'),
    engagement_id: engagement.id,
    partner_name: engagement.partner_name,
    current_scope: currentScope,
    opportunity_type: 'new_capability',
    description: `${suggested.name} (${suggested.readiness}) could extend ${engagement.partner_name}'s interpretability coverage. ${suggested.partner_solution}`,
    estimated_revenue: revenue,
    confidence: getConfidence(engagement.health_score),
    trigger: `High engagement health (${engagement.health_score}) + unapplied ${suggested.readiness}-ready capability`,
    suggested_outreach: generateExpansionOutreach(
      engagement.partner_name,
      'new_capability',
      `Specifically, "${suggested.name}" uses ${suggested.readiness === 'production' ? 'production-proven' : 'demonstrated'} techniques that complement your current setup.`,
    ),
  }
}

function detectMonitoringUpsell(
  engagement: Engagement,
  currentScope: string,
): ExpansionOpportunity | null {
  // Only suggest monitoring for Tier 1/2 (simple/standard) assessments
  if (engagement.engagement_tier !== 'simple' && engagement.engagement_tier !== 'standard') return null

  const revenue = Math.round((MONITORING_ANNUAL_REVENUE_LOW + MONITORING_ANNUAL_REVENUE_HIGH) / 2)

  return {
    id: generateId('exp_'),
    engagement_id: engagement.id,
    partner_name: engagement.partner_name,
    current_scope: currentScope,
    opportunity_type: 'monitoring_upsell',
    description: `After assessment is complete, deploy continuous runtime monitoring to catch regression. Estimated monitoring revenue: ${formatCurrency(MONITORING_ANNUAL_REVENUE_LOW)}-${formatCurrency(MONITORING_ANNUAL_REVENUE_HIGH)}/year.`,
    estimated_revenue: revenue,
    confidence: getConfidence(engagement.health_score),
    trigger: `${engagement.engagement_tier} tier engagement with high health (${engagement.health_score}) — natural progression to continuous monitoring`,
    suggested_outreach: generateExpansionOutreach(
      engagement.partner_name,
      'monitoring_upsell',
      `Runtime monitoring would provide continuous assurance that model behavior remains within the bounds we established during the assessment.`,
    ),
  }
}

function detectTierUpgrade(
  engagement: Engagement,
  currentScope: string,
): ExpansionOpportunity | null {
  const nextTier = getNextTier(engagement.engagement_tier)
  if (!nextTier) return null

  // Only suggest tier upgrades for simple -> standard or standard -> complex
  if (engagement.engagement_tier !== 'simple' && engagement.engagement_tier !== 'standard') return null

  const completedMilestones = engagement.milestones.filter((m) => m.status === 'completed').length
  const totalMilestones = engagement.milestones.length
  const findingsText = totalMilestones > 0
    ? `Assessment has completed ${completedMilestones} of ${totalMilestones} milestones.`
    : 'Assessment is progressing well.'

  const nextTierPrice = getPriceForTier(nextTier)
  const revenue = Math.round(((nextTierPrice.low + nextTierPrice.high) / 2) * TIER_UPGRADE_CONVERSION_RATE)

  return {
    id: generateId('exp_'),
    engagement_id: engagement.id,
    partner_name: engagement.partner_name,
    current_scope: currentScope,
    opportunity_type: 'tier_upgrade',
    description: `${findingsText} Suggest scoping a ${nextTier} engagement for model surgery. Estimated value: ${formatCurrency(nextTierPrice.low)}-${formatCurrency(nextTierPrice.high)} (60% conversion rate applied).`,
    estimated_revenue: revenue,
    confidence: engagement.health_score >= 95 ? 'high' : 'medium',
    trigger: `High engagement health (${engagement.health_score}) + current ${engagement.engagement_tier} tier with natural upsell to ${nextTier}`,
    suggested_outreach: generateExpansionOutreach(
      engagement.partner_name,
      'tier_upgrade',
      `${findingsText} Several findings are addressable via RLFR-based model surgery.`,
    ),
  }
}

export function generateExpansionOpportunities(
  engagements: Engagement[],
  capabilities: Capability[],
  modelFamilies: ModelFamily[],
): ExpansionOpportunity[] {
  const opportunities: ExpansionOpportunity[] = []

  for (const engagement of engagements) {
    if (engagement.status !== 'active' || engagement.health_score < 90) continue

    const currentScope = buildCurrentScope(engagement, capabilities)

    const additionalModel = detectAdditionalModel(engagement, modelFamilies, currentScope)
    if (additionalModel) opportunities.push(additionalModel)

    const newCapability = detectNewCapability(engagement, capabilities, currentScope)
    if (newCapability) opportunities.push(newCapability)

    const monitoringUpsell = detectMonitoringUpsell(engagement, currentScope)
    if (monitoringUpsell) opportunities.push(monitoringUpsell)

    const tierUpgrade = detectTierUpgrade(engagement, currentScope)
    if (tierUpgrade) opportunities.push(tierUpgrade)
  }

  return opportunities
}

// ─── Summary ────────────────────────────────────────────────────────

export interface AlertsSummary {
  totalAlerts: number
  criticalCount: number
  warningCount: number
  expansionCount: number
  estimatedExpansionRevenue: number
}

export function summarizeAlerts(
  alerts: HealthAlert[],
  expansions: ExpansionOpportunity[],
): AlertsSummary {
  const activeAlerts = alerts.filter((a) => !a.acknowledged)
  return {
    totalAlerts: activeAlerts.length,
    criticalCount: activeAlerts.filter((a) => a.severity === 'critical').length,
    warningCount: activeAlerts.filter((a) => a.severity === 'warning').length,
    expansionCount: expansions.length,
    estimatedExpansionRevenue: expansions.reduce((sum, e) => sum + e.estimated_revenue, 0),
  }
}
