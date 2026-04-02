import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'forge.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
    initializeSchema(_db)
  }
  return _db
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS capabilities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      paper_title TEXT NOT NULL,
      authors TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('fundamental', 'applied')),
      description TEXT NOT NULL,
      key_results TEXT NOT NULL,
      partner_solution TEXT NOT NULL,
      readiness TEXT NOT NULL CHECK(readiness IN ('production', 'demo', 'research')),
      model_families TEXT NOT NULL DEFAULT '[]',
      partners TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      capability_id TEXT NOT NULL,
      metric TEXT NOT NULL,
      value TEXT NOT NULL,
      context TEXT NOT NULL,
      source TEXT NOT NULL,
      FOREIGN KEY (capability_id) REFERENCES capabilities(id)
    );

    CREATE TABLE IF NOT EXISTS audiences (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('ml_engineer', 'cto', 'compliance', 'researcher', 'general')),
      title TEXT NOT NULL,
      pain_points TEXT NOT NULL,
      framing_emphasis TEXT NOT NULL,
      language_register TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prospects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT NOT NULL,
      estimated_ai_spend REAL NOT NULL,
      model_families TEXT NOT NULL DEFAULT '[]',
      pain_points TEXT NOT NULL DEFAULT '[]',
      regulatory_exposure TEXT NOT NULL DEFAULT '[]',
      priority_score REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('regulatory', 'competitor', 'prospect', 'conference', 'research')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      source TEXT NOT NULL,
      date TEXT NOT NULL,
      relevance_score REAL NOT NULL,
      matched_capability_ids TEXT NOT NULL DEFAULT '[]',
      suggested_action TEXT NOT NULL,
      narrative_angle TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS engagements (
      id TEXT PRIMARY KEY,
      partner_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'proposed')),
      capabilities_applied TEXT NOT NULL DEFAULT '[]',
      start_date TEXT NOT NULL,
      health_score REAL NOT NULL,
      milestones TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS content_calendar (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('research', 'regulatory', 'conference', 'competitive', 'suggested')),
      title TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_capabilities_readiness ON capabilities(readiness);
    CREATE INDEX IF NOT EXISTS idx_capabilities_type ON capabilities(type);
    CREATE INDEX IF NOT EXISTS idx_evidence_capability_id ON evidence(capability_id);
    CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(type);
    CREATE INDEX IF NOT EXISTS idx_signals_relevance_score ON signals(relevance_score);
    CREATE INDEX IF NOT EXISTS idx_engagements_status ON engagements(status);
    CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(date);
  `)
}

export function ensureSeeded(): void {
  const db = getDb()
  const row = db.prepare('SELECT COUNT(*) as count FROM capabilities').get() as { count: number }
  if (row.count === 0) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { seedDatabase } = require('@/data/seed')
    seedDatabase(db)
  }
}
