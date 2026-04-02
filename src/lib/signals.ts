import { getDb } from '@/lib/db'
import type { Signal } from '@/types'

function parseSignal(row: Record<string, unknown>): Signal {
  return {
    id: row['id'] as string,
    type: row['type'] as Signal['type'],
    title: row['title'] as string,
    description: row['description'] as string,
    source: row['source'] as string,
    date: row['date'] as string,
    relevance_score: row['relevance_score'] as number,
    matched_capability_ids: JSON.parse(row['matched_capability_ids'] as string) as string[],
    suggested_action: row['suggested_action'] as string,
    narrative_angle: row['narrative_angle'] as string,
  }
}

export function getAllSignals(): Signal[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM signals ORDER BY relevance_score DESC').all() as Record<string, unknown>[]
  return rows.map(parseSignal)
}

export function getSignalsByType(type: Signal['type']): Signal[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM signals WHERE type = ? ORDER BY relevance_score DESC').all(type) as Record<string, unknown>[]
  return rows.map(parseSignal)
}

export function matchSignalToCapabilities(signalId: string): string[] {
  const db = getDb()
  const row = db.prepare('SELECT matched_capability_ids FROM signals WHERE id = ?').get(signalId) as { matched_capability_ids: string } | undefined
  if (!row) return []
  return JSON.parse(row.matched_capability_ids) as string[]
}
