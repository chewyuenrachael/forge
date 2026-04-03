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

function safeAddColumn(db: Database.Database, table: string, column: string, definition: string): void {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  } catch {
    // Column already exists — safe to ignore
  }
}

function initializeSchema(db: Database.Database): void {
  // Check if engagements table needs migration (old schema lacks 'paused' status)
  const tableInfo = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='engagements'"
  ).get() as { sql: string } | undefined

  if (tableInfo && !tableInfo.sql.includes('paused')) {
    // Old schema — save data, recreate with updated CHECK constraint
    const oldRows = db.prepare('SELECT * FROM engagements').all() as Record<string, unknown>[]
    db.exec('DROP TABLE IF EXISTS engagements')

    db.exec(`
      CREATE TABLE engagements (
        id TEXT PRIMARY KEY,
        partner_name TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('active','completed','proposed','paused')),
        capabilities_applied TEXT NOT NULL DEFAULT '[]',
        start_date TEXT NOT NULL,
        end_date TEXT,
        health_score INTEGER NOT NULL DEFAULT 75 CHECK(health_score >= 0 AND health_score <= 100),
        notes TEXT,
        milestones TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)

    // Re-insert old data
    const insert = db.prepare(
      `INSERT INTO engagements (id, partner_name, status, capabilities_applied, start_date, health_score, milestones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    for (const row of oldRows) {
      insert.run(
        row['id'], row['partner_name'], row['status'],
        row['capabilities_applied'], row['start_date'],
        row['health_score'], row['milestones']
      )
    }
  }

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
      status TEXT NOT NULL CHECK(status IN ('active','completed','proposed','paused')),
      capabilities_applied TEXT NOT NULL DEFAULT '[]',
      start_date TEXT NOT NULL,
      end_date TEXT,
      health_score INTEGER NOT NULL DEFAULT 75 CHECK(health_score >= 0 AND health_score <= 100),
      notes TEXT,
      milestones TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

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
    CREATE INDEX IF NOT EXISTS idx_milestones_engagement ON milestones(engagement_id);
    CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
    CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(date);
  `)

  // Add columns that may be missing on existing databases
  safeAddColumn(db, 'engagements', 'end_date', 'TEXT')
  safeAddColumn(db, 'engagements', 'notes', 'TEXT')
  safeAddColumn(db, 'engagements', 'created_at', "TEXT NOT NULL DEFAULT (datetime('now'))")
  safeAddColumn(db, 'engagements', 'updated_at', "TEXT NOT NULL DEFAULT (datetime('now'))")

  // Migrate JSON milestones to milestones table if needed
  migrateJsonMilestones(db)
}

function migrateJsonMilestones(db: Database.Database): void {
  const msCount = (db.prepare('SELECT COUNT(*) as count FROM milestones').get() as { count: number }).count
  if (msCount > 0) return // Already migrated

  const rows = db.prepare("SELECT id, milestones FROM engagements WHERE milestones != '[]'").all() as { id: string; milestones: string }[]
  if (rows.length === 0) return

  const insert = db.prepare(
    `INSERT OR IGNORE INTO milestones (id, engagement_id, title, status, due_date, completed_date, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )

  for (const row of rows) {
    const milestones = JSON.parse(row.milestones) as Array<{ id: string; title: string; status: string; due_date: string }>
    milestones.forEach((ms, idx) => {
      insert.run(
        ms.id,
        row.id,
        ms.title,
        ms.status,
        ms.due_date,
        ms.status === 'completed' ? ms.due_date : null,
        idx
      )
    })
  }
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
