import type {
  ModelFamilyTier,
  CapabilityType,
  ReadinessLevel,
  CustomerCategory,
  EngagementTier,
  RevenueEngine,
  PipelineStage,
  SignalType,
  EngagementStatus,
  MilestoneStatus,
  PredictionOutcome,
  FeedbackValue,
  UserRole,
} from '@/lib/constants'

// ============================================================
// LAYER 1: REFERENCE DATA (changes slowly, configured quarterly)
// ============================================================

export interface ModelFamily {
  id: string
  name: string
  provider: string
  tier: ModelFamilyTier
  sae_status: 'available' | 'in_progress' | 'planned' | 'not_started'
  sae_estimated_completion: string | null
  parameter_count: string
  license: string
  enterprise_adoption_pct: number
  notes: string | null
}

export interface Capability {
  id: string
  name: string
  paper_title: string
  authors: string
  date: string
  type: CapabilityType
  description: string
  key_results: string[]
  partner_solution: string
  readiness: ReadinessLevel
  model_families_tested: string[]
  partners: string[]
}

export interface Evidence {
  id: string
  capability_id: string
  metric: string
  value: string
  context: string
  source: string
  is_headline: boolean
}

export interface Audience {
  id: string
  type: 'ml_engineer' | 'cto' | 'compliance' | 'researcher' | 'ai_community'
  title: string
  pain_points: string[]
  framing_emphasis: string
  language_register: string
  value_prop_template: string
}

export interface CustomerCategoryDef {
  id: CustomerCategory
  name: string
  description: string
  avg_deal_size: { low: number; high: number }
  sales_cycle_days: { low: number; high: number }
  regulatory_tailwinds: string[]
  goodfire_value_prop: string
  priority_rank: number
}

export interface EngagementTierDef {
  id: EngagementTier
  name: string
  price_range: { low: number; high: number }
  duration_days: number
  description: string
  researcher_hours: number
  engineer_hours: number
  cost_to_deliver: number
}

// ============================================================
// LAYER 2: OPERATIONAL STATE (changes daily)
// ============================================================

export interface Prospect {
  id: string
  name: string
  industry: string
  customer_category: CustomerCategory
  estimated_ai_spend: number
  model_families: string[]
  pain_points: string[]
  regulatory_exposure: string[]
  priority_score: number
  revenue_engine: RevenueEngine
  pipeline_stage: PipelineStage
  pipeline_value: number
  peer_cluster_id: string | null
  contacts: ProspectContact[]
  outreach_history: OutreachRecord[]
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ProspectContact {
  name: string
  title: string
  email: string | null
  linkedin_url: string | null
  persona: 'ml_engineer' | 'cto' | 'compliance' | 'researcher' | 'executive'
  is_champion: boolean
}

export interface OutreachRecord {
  date: string
  type: 'email' | 'linkedin' | 'event' | 'referral'
  audience_framing: string
  signal_id: string | null
  status: 'sent' | 'opened' | 'replied' | 'meeting_booked' | 'no_response'
  notes: string | null
}

export interface PeerCluster {
  id: string
  name: string
  industry: string
  region: string
  prospect_ids: string[]
  density_score: number
  status: 'identified' | 'outreach_active' | 'dinner_planned' | 'converting'
}

export interface Signal {
  id: string
  type: SignalType
  title: string
  description: string
  source: string
  source_url: string | null
  date: string
  relevance_score: number
  urgency_score: number
  coverage_score: number
  novelty_score: number
  actionability_score: number
  matched_capability_ids: string[]
  matched_prospect_ids: string[]
  suggested_action: string
  narrative_angle: string
  peer_cluster_ids: string[]
  status: 'active' | 'acted_on' | 'archived' | 'dismissed'
  feedback: FeedbackValue | null
  created_at: string
}

export interface Engagement {
  id: string
  partner_name: string
  status: EngagementStatus
  engagement_tier: EngagementTier
  capabilities_applied: string[]
  model_family_id: string | null
  start_date: string
  end_date: string | null
  health_score: number
  pipeline_value: number
  cost_to_deliver: number
  margin_pct: number
  revenue_engine: RevenueEngine
  channel_partner_id: string | null
  prospect_id: string | null
  notes: string | null
  milestones: Milestone[]
  predictions: Prediction[]
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  engagement_id: string
  title: string
  status: MilestoneStatus
  due_date: string
  completed_date: string | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Prediction {
  id: string
  engagement_id: string
  description: string
  methodology: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  confidence: 'high' | 'medium' | 'low'
  outcome: PredictionOutcome
  outcome_notes: string | null
  outcome_date: string | null
  model_family_id: string | null
  created_at: string
  updated_at: string
}

export interface ChannelPartner {
  id: string
  name: string
  type: 'big_four' | 'consulting' | 'systems_integrator' | 'platform'
  relationship_status: 'cold' | 'warm_intro' | 'active_conversation' | 'partnership_signed' | 'certified'
  primary_contact: ProspectContact | null
  client_portfolio_overlap: number
  estimated_annual_revenue: number
  certified_engineers: number
  engagements_sourced: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SavedProposal {
  id: string
  partner_name: string
  title: string
  intake_data: IntakeFormData
  matches: SolutionMatch[]
  simulation: SolutionSimulation
  engagement_tier: EngagementTier
  total_value: number
  created_at: string
}

export interface SavedProposalSummary {
  id: string
  partner_name: string
  title: string
  created_at: string
  match_count: number
}

export interface ContentCalendarItem {
  id: string
  date: string
  type: 'research' | 'regulatory' | 'conference' | 'competitive' | 'suggested'
  title: string
  description: string
  signal_id: string | null
  capability_ids: string[]
  status: 'scheduled' | 'published' | 'draft' | 'suggested'
}

export interface ActionabilityWeights {
  relevance: number
  urgency: number
  coverage: number
  novelty: number
}

// ============================================================
// LAYER 3: EVENT LOG (append-only, never mutated)
// ============================================================

export interface EventLog {
  id: string
  timestamp: string
  event_type: EventType
  entity_type: string
  entity_id: string
  actor_role: UserRole | 'system'
  payload: Record<string, unknown>
}

export type EventType =
  | 'signal.detected'
  | 'signal.feedback'
  | 'signal.archived'
  | 'outreach.sent'
  | 'outreach.response'
  | 'meeting.booked'
  | 'engagement.created'
  | 'engagement.status_changed'
  | 'engagement.health_changed'
  | 'milestone.completed'
  | 'milestone.overdue'
  | 'prediction.created'
  | 'prediction.outcome_recorded'
  | 'proposal.saved'
  | 'pipeline.stage_changed'
  | 'channel_partner.status_changed'
  | 'feedback.submitted'

// ============================================================
// DESIGN-ONLY: WEBHOOK TABLE
// ============================================================

export interface Webhook {
  id: string
  event_type: EventType
  target_url: string
  active: boolean
  created_at: string
}

// ============================================================
// FEATURE-SPECIFIC TYPES (used by UI components)
// ============================================================

// ─── ROI Calculator ─────────────────────────────────────────────────

export interface ROIInput {
  currentHallucinationRate: number
  monthlyInferenceSpend: number
  monthlyAnnotationSpend: number
  monthlyGuardrailSpend: number
  usesReasoningModels: boolean
  monthlyReasoningTokens: number
  regulatoryExposure: string[]
  complianceDeadlineMonths: number
}

export interface SavingsLine {
  category: string
  before: number
  after: number
  annualSaving: number
  method: string
  benchmark: string
  source: string
}

export interface ROIResult {
  savings: SavingsLine[]
  complianceValue: { riskReduction: string; urgency: string }
  totalAnnualSaving: number
  estimatedEngagementCost: { low: number; high: number }
  roi: number
}

// ─── Solution Architect ─────────────────────────────────────────────

export interface IntakeFormData {
  partnerName: string
  modelFamily: string
  modelSize: string
  deploymentContext: string
  painPoints: string[]
  regulatoryExposure: string[]
  teamComposition: string[]
  scale: string
  additionalContext: string
}

export interface SolutionMatch {
  capability: Capability
  matchLevel: 'high' | 'medium' | 'low'
  rationale: string
  estimatedTimeline: string
  keyBenchmark: string
}

export interface ProjectedOutcome {
  metric: string
  estimate: string
  confidence: 'high' | 'medium' | 'low'
  basis: string
}

export interface SolutionSimulation {
  outcomes: ProjectedOutcome[]
  engagementCost: { low: number; high: number }
  timeline: string
  teamRequirements: string[]
  engagementTier: EngagementTier
}

// ─── Pricing Engine ────────────────────────────────────────────────

export interface ClassifyResult {
  tier: EngagementTier
  priceRange: { low: number; high: number }
  durationDays: number
  rationale: string
  costToDeliver: number
  marginRange: { low: number; high: number }
  saeCostIfNeeded: number
  breakeven: { engagementsNeeded: number; note: string } | null
}

// ─── Narrative Engine ───────────────────────────────────────────────

export interface AudienceFrame {
  audienceType: string
  headline: string
  hook: string
  keyPoints: string[]
}

export interface NarrativeOpportunity {
  id: string
  signal: Signal
  capability: Capability
  audiences: AudienceFrame[]
}

// ─── ICP Scoring ────────────────────────────────────────────────────

export interface ICPWeights {
  modelFamilyMatch: number
  regulatoryPressure: number
  peerClusterDensity: number
  recentSignals: number
}

export interface ICPScore {
  prospectId: string
  modelFamilyMatch: number
  regulatoryPressure: number
  peerClusterDensity: number
  recentIncidentOrCommitment: number
  composite: number
  breakdown: string
}

// ─── Pipeline Overview ─────────────────────────────────────────────

export interface PipelineOverview {
  totalProspects: number
  totalPipelineValue: number
  byStage: { stage: PipelineStage; count: number; totalValue: number }[]
  byCategory: { category: CustomerCategory; count: number; totalValue: number }[]
  byModelFamily: { modelFamilyId: string; count: number; totalValue: number }[]
  byRevenueEngine: { engine: RevenueEngine; count: number; totalValue: number }[]
  avgDealSize: number
  conversionRates: { fromStage: PipelineStage; toStage: PipelineStage; rate: number }[]
}

// ─── Channel Metrics ───────────────────────────────────────────────

export interface ChannelMetrics {
  totalPartners: number
  activePartners: number
  totalEstimatedRevenue: number
  totalCertifiedEngineers: number
  totalEngagementsSources: number
  clientPortfolioReach: number
  byStatus: { status: string; count: number }[]
}

// ─── Pipeline Conversion ────────────────────────────────────────────

export interface ConversionMetrics {
  signalType: SignalType
  outreachCount: number
  responseRate: number
  meetingRate: number
  proposalRate: number
  closeRate: number
  avgDealSize: number
}

// ─── Weekly GTM Brief ───────────────────────────────────────────────

export interface WeeklyBrief {
  weekStart: string
  weekEnd: string
  newSignals: Signal[]
  pipelineMovement: { advanced: number; stalled: number; lost: number }
  engagementHealth: { healthy: number; atRisk: number; critical: number }
  contentPublished: ContentCalendarItem[]
  competitorActivity: Signal[]
  priorityTargets: Prospect[]
  euAiActDays: number
  keyMetric: { name: string; value: string; trend: 'up' | 'down' | 'stable' }
}

// ─── CRUD Input Types (used by API routes and forms) ────────────────

export interface CreateEngagementInput {
  partner_name: string
  status: EngagementStatus
  engagement_tier?: EngagementTier
  capabilities_applied: string[]
  start_date: string
  end_date?: string
  notes?: string
}

export interface UpdateEngagementInput {
  partner_name?: string
  status?: EngagementStatus
  engagement_tier?: EngagementTier
  capabilities_applied?: string[]
  start_date?: string
  end_date?: string | null
  health_score?: number
  notes?: string | null
}

export interface CreateMilestoneInput {
  engagement_id: string
  title: string
  status: MilestoneStatus
  due_date: string
  notes?: string
}

export interface UpdateMilestoneInput {
  title?: string
  status?: MilestoneStatus
  due_date?: string
  completed_date?: string | null
  notes?: string | null
  sort_order?: number
}

// ─── Generic Utility Types ──────────────────────────────────────────

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

export type APIResponse<T> =
  | { data: T }
  | { error: string; code: string; details?: { field: string; message: string }[] }
