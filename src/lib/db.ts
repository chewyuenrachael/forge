import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'forge.db')

let _db: Database.Database | null = null

// ─── JSON Helpers ───────────────────────────────────────────────────

export function parseJsonArray(text: string): string[] {
  try {
    const parsed = JSON.parse(text) as unknown
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

export function toJsonString(arr: string[]): string {
  return JSON.stringify(arr)
}

// ─── Database Singleton ─────────────────────────────────────────────

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
    initializeSchema(_db)
  }
  return _db
}

// ─── Schema Initialization ──────────────────────────────────────────

function initializeSchema(db: Database.Database): void {
  // ────────────────────────────────────────────────────────────────
  // LAYER 1: REFERENCE DATA
  // ────────────────────────────────────────────────────────────────

  // Access: GTM Lead (read), Applied AI Lead (read/write), Researcher (read), Leadership (read)
  db.exec(`
    CREATE TABLE IF NOT EXISTS model_families (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      tier TEXT NOT NULL CHECK(tier IN ('tier_a','tier_b','tier_c')),
      sae_status TEXT NOT NULL CHECK(sae_status IN ('available','in_progress','planned','not_started')),
      sae_estimated_completion TEXT,
      parameter_count TEXT NOT NULL,
      license TEXT NOT NULL,
      enterprise_adoption_pct REAL NOT NULL DEFAULT 0,
      notes TEXT
    )
  `)

  // Access: All roles (read), Leadership (read/write)
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      avg_deal_size_low INTEGER NOT NULL,
      avg_deal_size_high INTEGER NOT NULL,
      sales_cycle_days_low INTEGER NOT NULL,
      sales_cycle_days_high INTEGER NOT NULL,
      regulatory_tailwinds TEXT NOT NULL DEFAULT '[]',
      goodfire_value_prop TEXT NOT NULL,
      priority_rank INTEGER NOT NULL
    )
  `)

  // Access: All roles (read), Leadership (read/write)
  db.exec(`
    CREATE TABLE IF NOT EXISTS engagement_tiers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price_low INTEGER NOT NULL,
      price_high INTEGER NOT NULL,
      duration_days INTEGER NOT NULL,
      description TEXT NOT NULL,
      researcher_hours INTEGER NOT NULL,
      engineer_hours INTEGER NOT NULL,
      cost_to_deliver INTEGER NOT NULL
    )
  `)

  // Access: GTM Lead (read/write), Applied AI Lead (read), Researcher (none), Leadership (read)
  db.exec(`
    CREATE TABLE IF NOT EXISTS audiences (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      pain_points TEXT NOT NULL DEFAULT '[]',
      framing_emphasis TEXT NOT NULL,
      language_register TEXT NOT NULL,
      value_prop_template TEXT NOT NULL DEFAULT ''
    )
  `)

  // Access: All roles (read), Applied AI Lead (read/write), Researcher (read/write)
  db.exec(`
    CREATE TABLE IF NOT EXISTS capabilities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      paper_title TEXT NOT NULL,
      authors TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('fundamental','applied')),
      description TEXT NOT NULL,
      key_results TEXT NOT NULL DEFAULT '[]',
      partner_solution TEXT NOT NULL,
      readiness TEXT NOT NULL CHECK(readiness IN ('production','demo','research')),
      model_families_tested TEXT NOT NULL DEFAULT '[]',
      partners TEXT NOT NULL DEFAULT '[]'
    )
  `)

  // Access: GTM Lead (read/write), Applied AI Lead (read), Researcher (none), Leadership (read)
  db.exec(`
    CREATE TABLE IF NOT EXISTS peer_clusters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT NOT NULL,
      region TEXT NOT NULL,
      prospect_ids TEXT NOT NULL DEFAULT '[]',
      density_score INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'identified'
    )
  `)

  // Access: GTM Lead (read/write), Applied AI Lead (read), Researcher (none), Leadership (read)
  db.exec(`
    CREATE TABLE IF NOT EXISTS channel_partners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('big_four','consulting','systems_integrator','platform')),
      relationship_status TEXT NOT NULL DEFAULT 'cold',
      primary_contact TEXT DEFAULT '{}',
      client_portfolio_overlap INTEGER NOT NULL DEFAULT 0,
      estimated_annual_revenue INTEGER NOT NULL DEFAULT 0,
      certified_engineers INTEGER NOT NULL DEFAULT 0,
      engagements_sourced INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // ────────────────────────────────────────────────────────────────
  // LAYER 1 (continued): REFERENCE DATA with FK dependencies
  // ────────────────────────────────────────────────────────────────

  // Access: Applied AI Lead (read/write), Researcher (read), Leadership (read)
  db.exec(`
    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      capability_id TEXT NOT NULL REFERENCES capabilities(id),
      metric TEXT NOT NULL,
      value TEXT NOT NULL,
      context TEXT NOT NULL,
      source TEXT NOT NULL,
      is_headline INTEGER NOT NULL DEFAULT 0
    )
  `)

  // ────────────────────────────────────────────────────────────────
  // LAYER 2: OPERATIONAL STATE
  // ────────────────────────────────────────────────────────────────

  // Access: GTM Lead (read/write), Applied AI Lead (read), Researcher (none), Leadership (read)
  db.exec(`
    CREATE TABLE IF NOT EXISTS prospects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT NOT NULL,
      customer_category TEXT NOT NULL DEFAULT 'data_sovereign_enterprise',
      estimated_ai_spend INTEGER NOT NULL DEFAULT 0,
      model_families TEXT NOT NULL DEFAULT '[]',
      pain_points TEXT NOT NULL DEFAULT '[]',
      regulatory_exposure TEXT NOT NULL DEFAULT '[]',
      priority_score INTEGER NOT NULL DEFAULT 50,
      revenue_engine TEXT NOT NULL DEFAULT 'direct' CHECK(revenue_engine IN ('direct','channel','monitoring')),
      pipeline_stage TEXT NOT NULL DEFAULT 'signal_detected',
      pipeline_value INTEGER NOT NULL DEFAULT 0,
      peer_cluster_id TEXT REFERENCES peer_clusters(id),
      contacts TEXT NOT NULL DEFAULT '[]',
      outreach_history TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Access: GTM Lead (read/write), Applied AI Lead (read), Researcher (none), Leadership (read)
  db.exec(`
    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('regulatory','competitor','prospect','conference','research','incident')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      source TEXT NOT NULL,
      source_url TEXT,
      date TEXT NOT NULL,
      relevance_score INTEGER NOT NULL DEFAULT 50,
      urgency_score INTEGER NOT NULL DEFAULT 50,
      coverage_score INTEGER NOT NULL DEFAULT 50,
      novelty_score INTEGER NOT NULL DEFAULT 100,
      actionability_score INTEGER NOT NULL DEFAULT 50,
      matched_capability_ids TEXT NOT NULL DEFAULT '[]',
      matched_prospect_ids TEXT NOT NULL DEFAULT '[]',
      suggested_action TEXT NOT NULL DEFAULT '',
      narrative_angle TEXT NOT NULL DEFAULT '',
      peer_cluster_ids TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active',
      feedback TEXT CHECK(feedback IN ('positive','negative') OR feedback IS NULL),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Access: GTM Lead (read/write), Applied AI Lead (read/write), Researcher (read), Leadership (read)
  db.exec(`
    CREATE TABLE IF NOT EXISTS engagements (
      id TEXT PRIMARY KEY,
      partner_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active','completed','proposed','paused')),
      engagement_tier TEXT NOT NULL DEFAULT 'standard',
      capabilities_applied TEXT NOT NULL DEFAULT '[]',
      model_family_id TEXT REFERENCES model_families(id),
      start_date TEXT NOT NULL,
      end_date TEXT,
      health_score INTEGER NOT NULL DEFAULT 75 CHECK(health_score >= 0 AND health_score <= 100),
      pipeline_value INTEGER NOT NULL DEFAULT 0,
      cost_to_deliver INTEGER NOT NULL DEFAULT 0,
      margin_pct REAL NOT NULL DEFAULT 0,
      revenue_engine TEXT NOT NULL DEFAULT 'direct',
      channel_partner_id TEXT REFERENCES channel_partners(id),
      prospect_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Access: GTM Lead (read), Applied AI Lead (read/write), Researcher (read), Leadership (read)
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_calendar (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      signal_id TEXT REFERENCES signals(id),
      capability_ids TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'suggested'
    )
  `)

  // ────────────────────────────────────────────────────────────────
  // LAYER 2 (continued): Tables with FK to engagements
  // ────────────────────────────────────────────────────────────────

  // Access: Applied AI Lead (read/write), GTM Lead (read), Researcher (read), Leadership (read)
  db.exec(`
    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('completed','in_progress','upcoming','blocked')),
      due_date TEXT NOT NULL,
      completed_date TEXT,
      notes TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Access: Applied AI Lead (read/write), Researcher (read/write), Leadership (read)
  db.exec(`
    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      methodology TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('critical','high','medium','low')),
      confidence TEXT NOT NULL CHECK(confidence IN ('high','medium','low')),
      outcome TEXT NOT NULL DEFAULT 'untested' CHECK(outcome IN ('confirmed','refuted','untested')),
      outcome_notes TEXT,
      outcome_date TEXT,
      model_family_id TEXT REFERENCES model_families(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Access: GTM Lead (read/write), Applied AI Lead (read), Leadership (read)
  db.exec(`
    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      partner_name TEXT NOT NULL,
      title TEXT NOT NULL,
      intake_data TEXT NOT NULL,
      matches TEXT NOT NULL,
      simulation TEXT NOT NULL,
      engagement_tier TEXT NOT NULL DEFAULT 'standard',
      total_value INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // ────────────────────────────────────────────────────────────────
  // CROSS-CUTTING: Configuration, Event Log, Webhooks
  // ────────────────────────────────────────────────────────────────

  // Access: GTM Lead (read/write)
  db.exec(`
    CREATE TABLE IF NOT EXISTS actionability_weights (
      id TEXT PRIMARY KEY DEFAULT 'default',
      relevance REAL NOT NULL DEFAULT 0.35,
      urgency REAL NOT NULL DEFAULT 0.30,
      coverage REAL NOT NULL DEFAULT 0.20,
      novelty REAL NOT NULL DEFAULT 0.15,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Access: All roles (read), System (append-only write)
  // NO UPDATE OR DELETE operations on this table. Append only.
  db.exec(`
    CREATE TABLE IF NOT EXISTS event_log (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      event_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      actor_role TEXT NOT NULL DEFAULT 'system',
      payload TEXT NOT NULL DEFAULT '{}'
    )
  `)

  // In production: dispatches HTTP POST on matching events.
  // For demo: table exists but no dispatch logic implemented.
  db.exec(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      target_url TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // ────────────────────────────────────────────────────────────────
  // INDEXES
  // ────────────────────────────────────────────────────────────────

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_capabilities_readiness ON capabilities(readiness);
    CREATE INDEX IF NOT EXISTS idx_capabilities_type ON capabilities(type);
    CREATE INDEX IF NOT EXISTS idx_evidence_capability ON evidence(capability_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_headline ON evidence(is_headline);
    CREATE INDEX IF NOT EXISTS idx_prospects_category ON prospects(customer_category);
    CREATE INDEX IF NOT EXISTS idx_prospects_pipeline ON prospects(pipeline_stage);
    CREATE INDEX IF NOT EXISTS idx_prospects_priority ON prospects(priority_score DESC);
    CREATE INDEX IF NOT EXISTS idx_prospects_cluster ON prospects(peer_cluster_id);
    CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(type);
    CREATE INDEX IF NOT EXISTS idx_signals_actionability ON signals(actionability_score DESC);
    CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
    CREATE INDEX IF NOT EXISTS idx_engagements_status ON engagements(status);
    CREATE INDEX IF NOT EXISTS idx_engagements_model ON engagements(model_family_id);
    CREATE INDEX IF NOT EXISTS idx_engagements_channel ON engagements(channel_partner_id);
    CREATE INDEX IF NOT EXISTS idx_milestones_engagement ON milestones(engagement_id);
    CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
    CREATE INDEX IF NOT EXISTS idx_predictions_engagement ON predictions(engagement_id);
    CREATE INDEX IF NOT EXISTS idx_predictions_outcome ON predictions(outcome);
    CREATE INDEX IF NOT EXISTS idx_predictions_model ON predictions(model_family_id);
    CREATE INDEX IF NOT EXISTS idx_event_log_type ON event_log(event_type);
    CREATE INDEX IF NOT EXISTS idx_event_log_entity ON event_log(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_event_log_timestamp ON event_log(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(date);
    CREATE INDEX IF NOT EXISTS idx_channel_partners_status ON channel_partners(relationship_status);
    CREATE INDEX IF NOT EXISTS idx_model_families_tier ON model_families(tier);
  `)
}

// ─── Seed Check ─────────────────────────────────────────────────────

export function ensureSeeded(seedFn?: (db: Database.Database) => void): void {
  const db = getDb()
  const row = db.prepare('SELECT COUNT(*) as count FROM capabilities').get() as { count: number }
  if (row.count === 0) {
    if (seedFn) {
      seedFn(db)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { seedDatabase } = require('@/data/seed')
      seedDatabase(db)
    }
  }
}
