// Phase 0 verification script — run with: npx tsx src/lib/verify-db.ts
import { getDb, ensureSeeded } from './db'
import { seedDatabase } from '../data/seed'

console.log('=== DATABASE VERIFICATION ===\n')

// Initialize and seed
ensureSeeded(seedDatabase)
const db = getDb()

// Expected row counts per table
const expectations: Record<string, number> = {
  model_families: 10,
  capabilities: 10,
  evidence: 27,
  audiences: 5,
  customer_categories: 6,
  engagement_tiers: 4,
  peer_clusters: 4,
  prospects: 14,
  signals: 15,
  engagements: 4,
  milestones: 12,
  predictions: 9,
  channel_partners: 5,
  proposals: 0,
  content_calendar: 18,
  actionability_weights: 1,
  event_log: 13,
  webhooks: 0,
}

let allPass = true
let totalRecords = 0

for (const [table, expected] of Object.entries(expectations)) {
  const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number }
  const actual = row.count
  totalRecords += actual
  const status = actual >= expected ? 'PASS' : 'FAIL'
  const symbol = status === 'PASS' ? '✓' : '✗'
  console.log(`  ${symbol} ${table}: ${actual} rows (expected ${expected})`)
  if (actual < expected) {
    allPass = false
  }
}

console.log(`\n  Total records: ${totalRecords}`)
console.log(`\nDATABASE VERIFICATION: ${allPass ? 'PASS' : 'FAIL'}`)

if (!allPass) {
  process.exit(1)
}
