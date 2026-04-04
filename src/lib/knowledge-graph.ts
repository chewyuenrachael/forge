import { getDb, parseJsonArray } from './db'
import { MAX_SEARCH_LENGTH } from '@/lib/constants'
import type { Capability, Engagement, Milestone, Prediction, ContentCalendarItem, Evidence, ModelFamily, CustomerCategoryDef } from '@/types'
import type { ModelFamilyTier } from '@/lib/constants'

// ─── Row Parsers ─────────────────────────────────────────────────────

function parseCapability(row: Record<string, unknown>): Capability {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    paper_title: row['paper_title'] as string,
    authors: row['authors'] as string,
    date: row['date'] as string,
    type: row['type'] as Capability['type'],
    description: row['description'] as string,
    key_results: parseJsonArray(row['key_results'] as string),
    partner_solution: row['partner_solution'] as string,
    readiness: row['readiness'] as Capability['readiness'],
    model_families_tested: parseJsonArray(row['model_families_tested'] as string),
    partners: parseJsonArray(row['partners'] as string),
  }
}

function parseEngagement(row: Record<string, unknown>): Engagement {
  const id = row['id'] as string
  const now = new Date().toISOString()
  const db = getDb()

  const msRows = db.prepare(
    'SELECT * FROM milestones WHERE engagement_id = ? ORDER BY sort_order ASC'
  ).all(id) as Array<Record<string, unknown>>
  const milestones: Milestone[] = msRows.map((m) => ({
    id: m['id'] as string,
    engagement_id: m['engagement_id'] as string,
    title: m['title'] as string,
    status: m['status'] as Milestone['status'],
    due_date: m['due_date'] as string,
    completed_date: (m['completed_date'] as string) ?? null,
    notes: (m['notes'] as string) ?? null,
    sort_order: (m['sort_order'] as number) ?? 0,
    created_at: (m['created_at'] as string) ?? now,
    updated_at: (m['updated_at'] as string) ?? now,
  }))

  const predRows = db.prepare(
    'SELECT * FROM predictions WHERE engagement_id = ? ORDER BY created_at ASC'
  ).all(id) as Array<Record<string, unknown>>
  const predictions: Prediction[] = predRows.map((p) => ({
    id: p['id'] as string,
    engagement_id: p['engagement_id'] as string,
    description: p['description'] as string,
    methodology: p['methodology'] as string,
    severity: p['severity'] as Prediction['severity'],
    confidence: p['confidence'] as Prediction['confidence'],
    outcome: p['outcome'] as Prediction['outcome'],
    outcome_notes: (p['outcome_notes'] as string) ?? null,
    outcome_date: (p['outcome_date'] as string) ?? null,
    model_family_id: (p['model_family_id'] as string) ?? null,
    created_at: (p['created_at'] as string) ?? now,
    updated_at: (p['updated_at'] as string) ?? now,
  }))

  return {
    id,
    partner_name: row['partner_name'] as string,
    status: row['status'] as Engagement['status'],
    engagement_tier: (row['engagement_tier'] as Engagement['engagement_tier']) ?? 'standard',
    capabilities_applied: parseJsonArray(row['capabilities_applied'] as string),
    model_family_id: (row['model_family_id'] as string) ?? null,
    start_date: row['start_date'] as string,
    end_date: (row['end_date'] as string) ?? null,
    health_score: row['health_score'] as number,
    pipeline_value: (row['pipeline_value'] as number) ?? 0,
    cost_to_deliver: (row['cost_to_deliver'] as number) ?? 0,
    margin_pct: (row['margin_pct'] as number) ?? 0,
    revenue_engine: (row['revenue_engine'] as Engagement['revenue_engine']) ?? 'direct',
    channel_partner_id: (row['channel_partner_id'] as string) ?? null,
    prospect_id: (row['prospect_id'] as string) ?? null,
    notes: (row['notes'] as string) ?? null,
    milestones,
    predictions,
    created_at: (row['created_at'] as string) ?? now,
    updated_at: (row['updated_at'] as string) ?? now,
  }
}

function parseEvidence(row: Record<string, unknown>): Evidence {
  return {
    id: row['id'] as string,
    capability_id: row['capability_id'] as string,
    metric: row['metric'] as string,
    value: row['value'] as string,
    context: row['context'] as string,
    source: row['source'] as string,
    is_headline: Boolean(row['is_headline']),
  }
}

function parseModelFamily(row: Record<string, unknown>): ModelFamily {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    provider: row['provider'] as string,
    tier: row['tier'] as ModelFamily['tier'],
    sae_status: row['sae_status'] as ModelFamily['sae_status'],
    sae_estimated_completion: (row['sae_estimated_completion'] as string) ?? null,
    parameter_count: row['parameter_count'] as string,
    license: row['license'] as string,
    enterprise_adoption_pct: (row['enterprise_adoption_pct'] as number) ?? 0,
    notes: (row['notes'] as string) ?? null,
  }
}

function parseCustomerCategory(row: Record<string, unknown>): CustomerCategoryDef {
  return {
    id: row['id'] as CustomerCategoryDef['id'],
    name: row['name'] as string,
    description: row['description'] as string,
    avg_deal_size: {
      low: (row['avg_deal_size_low'] as number) ?? 0,
      high: (row['avg_deal_size_high'] as number) ?? 0,
    },
    sales_cycle_days: {
      low: (row['sales_cycle_days_low'] as number) ?? 0,
      high: (row['sales_cycle_days_high'] as number) ?? 0,
    },
    regulatory_tailwinds: parseJsonArray(row['regulatory_tailwinds'] as string),
    goodfire_value_prop: row['goodfire_value_prop'] as string,
    priority_rank: (row['priority_rank'] as number) ?? 0,
  }
}

// ─── Capability Queries ──────────────────────────────────────────────

/**
 * Retrieve all capabilities ordered by date descending.
 * Parses JSON array fields (key_results, model_families_tested, partners).
 * @returns All capabilities
 */
export function getAllCapabilities(): Capability[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM capabilities ORDER BY date DESC').all() as Record<string, unknown>[]
  return rows.map(parseCapability)
}

/**
 * Retrieve a single capability by ID with all associated evidence.
 * @param id - The capability ID
 * @returns The capability, or null if not found
 */
export function getCapabilityById(id: string): Capability | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM capabilities WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? parseCapability(row) : null
}

/**
 * Search capabilities by text across name, paper_title, description, and partner_solution.
 * Query is truncated to MAX_SEARCH_LENGTH. Case-insensitive LIKE matching.
 * @param query - The search query string
 * @returns Matching capabilities ordered by date DESC
 */
export function searchCapabilities(query: string): Capability[] {
  const trimmed = query.slice(0, MAX_SEARCH_LENGTH)
  const db = getDb()
  const pattern = `%${trimmed}%`
  const rows = db.prepare(
    `SELECT * FROM capabilities
     WHERE name LIKE ? OR description LIKE ? OR paper_title LIKE ? OR partner_solution LIKE ?
     ORDER BY date DESC`
  ).all(pattern, pattern, pattern, pattern) as Record<string, unknown>[]
  return rows.map(parseCapability)
}

/**
 * Filter capabilities by readiness level.
 * @param readiness - The readiness level ('production', 'demo', 'research')
 * @returns Matching capabilities ordered by date DESC
 */
export function getCapabilitiesByReadiness(readiness: Capability['readiness']): Capability[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT * FROM capabilities WHERE readiness = ? ORDER BY date DESC'
  ).all(readiness) as Record<string, unknown>[]
  return rows.map(parseCapability)
}

/**
 * Find capabilities whose partner_solution matches any of the given pain points.
 * @param painPoints - Array of pain point keywords to match against
 * @returns Matching capabilities ordered by date DESC
 */
export function getCapabilitiesByAudience(painPoints: string[]): Capability[] {
  if (painPoints.length === 0) return []
  const db = getDb()
  const conditions = painPoints.map(() => 'partner_solution LIKE ?').join(' OR ')
  const params = painPoints.map((p) => `%${p}%`)
  const rows = db.prepare(
    `SELECT * FROM capabilities WHERE ${conditions} ORDER BY date DESC`
  ).all(...params) as Record<string, unknown>[]
  return rows.map(parseCapability)
}

/**
 * Find capabilities tested on a specific model family.
 * Searches within the model_families_tested JSON array field.
 * @param modelFamilyId - The model family ID to search for
 * @returns Matching capabilities ordered by date DESC
 */
export function getCapabilitiesByModelFamily(modelFamilyId: string): Capability[] {
  const db = getDb()
  const pattern = `%${modelFamilyId}%`
  const rows = db.prepare(
    'SELECT * FROM capabilities WHERE model_families_tested LIKE ? ORDER BY date DESC'
  ).all(pattern) as Record<string, unknown>[]
  return rows.map(parseCapability)
}

/**
 * Aggregate capability statistics: counts by readiness, unique partner count, evidence count.
 * @returns Stats object with total, production, demo, research, partnerCount, evidenceCount
 */
export function getCapabilityStats(): {
  total: number
  production: number
  demo: number
  research: number
  partnerCount: number
  evidenceCount: number
} {
  const db = getDb()
  const total = (db.prepare('SELECT COUNT(*) as count FROM capabilities').get() as { count: number }).count
  const production = (db.prepare("SELECT COUNT(*) as count FROM capabilities WHERE readiness = 'production'").get() as { count: number }).count
  const demo = (db.prepare("SELECT COUNT(*) as count FROM capabilities WHERE readiness = 'demo'").get() as { count: number }).count
  const research = (db.prepare("SELECT COUNT(*) as count FROM capabilities WHERE readiness = 'research'").get() as { count: number }).count
  const evidenceCount = (db.prepare('SELECT COUNT(*) as count FROM evidence').get() as { count: number }).count

  const partnerSet = new Set<string>()
  const capRows = db.prepare("SELECT partners FROM capabilities WHERE partners != '[]'").all() as { partners: string }[]
  for (const row of capRows) {
    const partners = parseJsonArray(row.partners)
    for (const p of partners) {
      partnerSet.add(p)
    }
  }
  const engRows = db.prepare('SELECT DISTINCT partner_name FROM engagements').all() as { partner_name: string }[]
  for (const row of engRows) {
    partnerSet.add(row.partner_name)
  }

  return { total, production, demo, research, partnerCount: partnerSet.size, evidenceCount }
}

/**
 * Retrieve all capabilities ordered by date DESC for the research timeline view.
 * @returns Capabilities ordered by date DESC
 */
export function getResearchTimeline(): Capability[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM capabilities ORDER BY date DESC').all() as Record<string, unknown>[]
  return rows.map(parseCapability)
}

// ─── Evidence Queries ────────────────────────────────────────────────

/**
 * Retrieve all evidence entries for a given capability.
 * @param capabilityId - The capability ID
 * @returns Array of Evidence entries
 */
export function getEvidenceForCapability(capabilityId: string): Evidence[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT * FROM evidence WHERE capability_id = ?'
  ).all(capabilityId) as Array<Record<string, unknown>>
  return rows.map(parseEvidence)
}

// ─── Engagement Queries (read-only from knowledge-graph) ─────────────

/**
 * Retrieve all partner engagements with milestones and predictions.
 * @returns All engagements ordered by start_date DESC
 */
export function getPartnerEngagements(): Engagement[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM engagements ORDER BY start_date DESC').all() as Record<string, unknown>[]
  return rows.map(parseEngagement)
}

// ─── Content Calendar ────────────────────────────────────────────────

/**
 * Retrieve content calendar items, optionally filtered by month.
 * @param month - Optional month filter in YYYY-MM format
 * @returns Content calendar items ordered by date ASC
 */
export function getContentCalendar(month?: string): ContentCalendarItem[] {
  const db = getDb()

  let rows: Array<Record<string, unknown>>
  if (month) {
    const pattern = `${month}%`
    rows = db.prepare(
      'SELECT * FROM content_calendar WHERE date LIKE ? ORDER BY date ASC'
    ).all(pattern) as Array<Record<string, unknown>>
  } else {
    rows = db.prepare(
      'SELECT * FROM content_calendar ORDER BY date ASC'
    ).all() as Array<Record<string, unknown>>
  }

  return rows.map((row) => ({
    id: row['id'] as string,
    date: row['date'] as string,
    type: row['type'] as ContentCalendarItem['type'],
    title: row['title'] as string,
    description: (row['description'] as string) ?? '',
    signal_id: (row['signal_id'] as string) ?? null,
    capability_ids: parseJsonArray((row['capability_ids'] as string) ?? '[]'),
    status: (row['status'] as ContentCalendarItem['status']) ?? 'suggested',
  }))
}

// ─── Model Family Queries ────────────────────────────────────────────

/**
 * Retrieve all model families ordered by tier then adoption percentage.
 * @returns All model families
 */
export function getAllModelFamilies(): ModelFamily[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT * FROM model_families ORDER BY tier ASC, enterprise_adoption_pct DESC'
  ).all() as Record<string, unknown>[]
  return rows.map(parseModelFamily)
}

/**
 * Retrieve a single model family by ID.
 * @param id - The model family ID
 * @returns The model family, or null if not found
 */
export function getModelFamilyById(id: string): ModelFamily | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM model_families WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? parseModelFamily(row) : null
}

/**
 * Filter model families by tier.
 * @param tier - The tier to filter by ('tier_a', 'tier_b', 'tier_c')
 * @returns Matching model families ordered by adoption DESC
 */
export function getModelFamiliesByTier(tier: ModelFamilyTier): ModelFamily[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT * FROM model_families WHERE tier = ? ORDER BY enterprise_adoption_pct DESC'
  ).all(tier) as Record<string, unknown>[]
  return rows.map(parseModelFamily)
}

/**
 * Aggregate model family counts and names per tier for the coverage dashboard.
 * @returns Array of { tierId, count, models } per tier
 */
export function getModelFamilyCoverage(): { tierId: string; count: number; models: string[] }[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT tier, COUNT(*) as count FROM model_families GROUP BY tier ORDER BY tier ASC'
  ).all() as Array<{ tier: string; count: number }>

  return rows.map((row) => {
    const models = db.prepare(
      'SELECT name FROM model_families WHERE tier = ? ORDER BY enterprise_adoption_pct DESC'
    ).all(row.tier) as Array<{ name: string }>
    return {
      tierId: row.tier,
      count: row.count,
      models: models.map((m) => m.name),
    }
  })
}

// ─── Customer Category Queries ───────────────────────────────────────

/**
 * Retrieve all customer category definitions ordered by priority rank.
 * Maps database columns (avg_deal_size_low/high, sales_cycle_days_low/high)
 * to nested objects matching the CustomerCategoryDef type.
 * @returns All customer categories
 */
export function getAllCustomerCategories(): CustomerCategoryDef[] {
  const db = getDb()
  const rows = db.prepare(
    'SELECT * FROM customer_categories ORDER BY priority_rank ASC'
  ).all() as Record<string, unknown>[]
  return rows.map(parseCustomerCategory)
}
