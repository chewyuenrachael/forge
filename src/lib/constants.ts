import {
  LayoutDashboard,
  Target,
  UserSearch,
  Wrench,
  BookOpen,
  FlaskConical,
  Layers,
  Handshake,
  Settings,
} from 'lucide-react'
import type { ElementType } from 'react'

export const MAX_INPUT_LENGTH = 500
export const MAX_TEXTAREA_LENGTH = 5000
export const MAX_SEARCH_LENGTH = 200
export const RATE_LIMIT_MAX = 10
export const RATE_LIMIT_WINDOW_MS = 60_000
export const EU_AI_ACT_DEADLINE = '2026-08-02'

export interface NavItem {
  label: string
  href: string
  icon: ElementType
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Prospect Intelligence', href: '/prospects', icon: UserSearch },
  { label: 'GTM Command Center', href: '/gtm', icon: Target },
  { label: 'Solution Architect', href: '/solutions', icon: Wrench },
  { label: 'Narrative Engine', href: '/narratives', icon: BookOpen },
  { label: 'Research Delivery', href: '/delivery', icon: FlaskConical },
  { label: 'Model Coverage', href: '/models', icon: Layers },
  { label: 'Channel Partners', href: '/channels', icon: Handshake },
  { label: 'Operations', href: '/ops', icon: Settings },
]

// ─── Customer Categories (from Goodfire GTM research) ───────────────

export const CUSTOMER_CATEGORIES = [
  'data_sovereign_enterprise',
  'ai_native_startup',
  'cost_optimizer',
  'research_institution',
  'model_customization_platform',
  'sovereign_ai_initiative',
] as const
export type CustomerCategory = typeof CUSTOMER_CATEGORIES[number]

// ─── Model Family Tiers ─────────────────────────────────────────────

export const MODEL_FAMILY_TIERS = ['tier_a', 'tier_b', 'tier_c'] as const
export type ModelFamilyTier = typeof MODEL_FAMILY_TIERS[number]

// ─── Engagement Tiers (from blockchain audit pricing model) ─────────

export const ENGAGEMENT_TIERS = ['simple', 'standard', 'complex', 'critical'] as const
export type EngagementTier = typeof ENGAGEMENT_TIERS[number]

// ─── Revenue Engines ────────────────────────────────────────────────

export const REVENUE_ENGINES = ['direct', 'channel', 'monitoring'] as const
export type RevenueEngine = typeof REVENUE_ENGINES[number]

// ─── Pipeline Stages ────────────────────────────────────────────────

export const PIPELINE_STAGES = [
  'signal_detected',
  'outreach_sent',
  'response_received',
  'meeting_booked',
  'discovery_complete',
  'proposal_sent',
  'verbal_agreement',
  'contract_signed',
  'lost',
] as const
export type PipelineStage = typeof PIPELINE_STAGES[number]

// ─── Signal Types ───────────────────────────────────────────────────

export const SIGNAL_TYPES = ['regulatory', 'competitor', 'prospect', 'conference', 'research', 'incident'] as const
export type SignalType = typeof SIGNAL_TYPES[number]

// ─── Readiness Levels ───────────────────────────────────────────────

export const READINESS_LEVELS = ['production', 'demo', 'research'] as const
export type ReadinessLevel = typeof READINESS_LEVELS[number]

// ─── Capability Types ───────────────────────────────────────────────

export const CAPABILITY_TYPES = ['fundamental', 'applied'] as const
export type CapabilityType = typeof CAPABILITY_TYPES[number]

// ─── User Roles (for future access control) ─────────────────────────

export const USER_ROLES = ['gtm_lead', 'applied_ai_lead', 'researcher', 'leadership'] as const
export type UserRole = typeof USER_ROLES[number]

// ─── Engagement Statuses ────────────────────────────────────────────

export const ENGAGEMENT_STATUSES = ['active', 'completed', 'proposed', 'paused'] as const
export type EngagementStatus = typeof ENGAGEMENT_STATUSES[number]

// ─── Milestone Statuses ─────────────────────────────────────────────

export const MILESTONE_STATUSES = ['completed', 'in_progress', 'upcoming', 'blocked'] as const
export type MilestoneStatus = typeof MILESTONE_STATUSES[number]

// ─── Prediction Outcomes ────────────────────────────────────────────

export const PREDICTION_OUTCOMES = ['confirmed', 'refuted', 'untested'] as const
export type PredictionOutcome = typeof PREDICTION_OUTCOMES[number]

// ─── Feedback Values ────────────────────────────────────────────────

export const FEEDBACK_VALUES = ['positive', 'negative'] as const
export type FeedbackValue = typeof FEEDBACK_VALUES[number]

// ─── Signal Actionability Weights (defaults — GTM Lead can adjust) ──

export const DEFAULT_ACTIONABILITY_WEIGHTS = {
  relevance: 0.35,
  urgency: 0.30,
  coverage: 0.20,
  novelty: 0.15,
} as const

// ─── Pricing Grid (from blockchain audit model) ────────────────────

export const PRICING_GRID = {
  simple: { low: 75000, high: 100000, days: 10, description: '1 supported model, 1 use case' },
  standard: { low: 125000, high: 175000, days: 15, description: '1 supported model, 2-3 use cases, production' },
  complex: { low: 200000, high: 350000, days: 25, description: 'Novel model family or multiple models, regulated' },
  critical: { low: 500000, high: 2000000, days: 45, description: 'Frontier model safety, national security, scientific discovery' },
} as const

// ─── SAE Investment Costs per Model Family ──────────────────────────

export const SAE_TRAINING_COST = {
  tier_a: 0,        // Already have SAEs
  tier_b: 1000000,  // $1M estimate
  tier_c: 2000000,  // $2M estimate
} as const
