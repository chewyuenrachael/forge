// ─── Core Entity Types ───────────────────────────────────────────────

export interface Capability {
  id: string
  name: string
  paper_title: string
  authors: string
  date: string
  type: 'fundamental' | 'applied'
  description: string
  key_results: string[]
  partner_solution: string
  readiness: 'production' | 'demo' | 'research'
  model_families: string[]
  partners: string[]
}

export interface Evidence {
  id: string
  capability_id: string
  metric: string
  value: string
  context: string
  source: string
}

export interface Audience {
  id: string
  type: 'ml_engineer' | 'cto' | 'compliance' | 'researcher' | 'general'
  title: string
  pain_points: string[]
  framing_emphasis: string
  language_register: string
}

export interface Prospect {
  id: string
  name: string
  industry: string
  estimated_ai_spend: number
  model_families: string[]
  pain_points: string[]
  regulatory_exposure: string[]
  priority_score: number
}

export interface Signal {
  id: string
  type: 'regulatory' | 'competitor' | 'prospect' | 'conference' | 'research'
  title: string
  description: string
  source: string
  date: string
  relevance_score: number
  matched_capability_ids: string[]
  suggested_action: string
  narrative_angle: string
}

export interface Engagement {
  id: string
  partner_name: string
  status: 'active' | 'completed' | 'proposed' | 'paused'
  capabilities_applied: string[]
  start_date: string
  end_date: string | null
  health_score: number
  notes: string | null
  created_at: string
  updated_at: string
  milestones: Milestone[]
}

export interface Milestone {
  id: string
  engagement_id: string
  title: string
  status: 'completed' | 'in_progress' | 'upcoming' | 'blocked'
  due_date: string
  completed_date: string | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreateEngagementInput {
  partner_name: string
  status: 'active' | 'completed' | 'proposed' | 'paused'
  capabilities_applied: string[]
  start_date: string
  end_date?: string
  notes?: string
}

export interface UpdateEngagementInput {
  partner_name?: string
  status?: 'active' | 'completed' | 'proposed' | 'paused'
  capabilities_applied?: string[]
  start_date?: string
  end_date?: string | null
  health_score?: number
  notes?: string | null
}

export interface CreateMilestoneInput {
  engagement_id: string
  title: string
  status: 'completed' | 'in_progress' | 'upcoming' | 'blocked'
  due_date: string
  notes?: string
}

export interface UpdateMilestoneInput {
  title?: string
  status?: 'completed' | 'in_progress' | 'upcoming' | 'blocked'
  due_date?: string
  completed_date?: string | null
  notes?: string | null
  sort_order?: number
}

// ─── ROI Calculator Types ────────────────────────────────────────────

export interface ROIInput {
  currentHallucinationRate: number
  monthlyInferenceSpend: number
  monthlyAnnotationSpend: number
  monthlyGuardrailSpend: number
  usesReasoningModels: boolean
  monthlyReasoningTokens: number
  regulatoryExposure: ('eu_ai_act' | 'sr_11_7' | 'fda' | 'none')[]
  complianceDeadlineMonths: number
}

export interface ROIResult {
  hallucinationSavings: SavingsLine
  inferenceSavings: SavingsLine
  annotationSavings: SavingsLine
  guardrailSavings: SavingsLine
  complianceValue: {
    riskReduction: string
    urgency: string
  }
  totalAnnualSaving: number
  estimatedEngagementCost: {
    low: number
    high: number
  }
  roi: number
}

export interface SavingsLine {
  before: number
  after: number
  annualSaving: number
  method: string
  benchmark: string
  source: string
}

// ─── Solution Architect Types ────────────────────────────────────────

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
}

export interface SolutionSimulation {
  outcomes: ProjectedOutcome[]
  engagementCost: {
    low: number
    high: number
  }
  timeline: string
  teamRequirements: string[]
}

export interface ProjectedOutcome {
  metric: string
  estimate: string
  confidence: 'high' | 'medium' | 'low'
  basis: string
}

// ─── Narrative Engine Types ──────────────────────────────────────────

export interface NarrativeOpportunity {
  id: string
  signal: Signal
  capability: Capability
  audiences: AudienceFrame[]
}

export interface AudienceFrame {
  audience: Audience
  headline: string
  hook: string
  key_points: string[]
}

export interface ContentCalendarItem {
  id: string
  date: string
  type: 'research' | 'regulatory' | 'conference' | 'competitive' | 'suggested'
  title: string
  description: string
}

// ─── Generic Utility Types ───────────────────────────────────────────

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

export type APIResponse<T> =
  | { data: T }
  | { error: string; code: string }
