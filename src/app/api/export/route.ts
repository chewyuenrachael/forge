import { NextRequest, NextResponse } from 'next/server'
import { exportToCSV, exportToJSON } from '@/lib/exports'
import { getAllCapabilities } from '@/lib/knowledge-graph'
import { getAllSignals } from '@/lib/signals-scoring'
import { ensureSeeded, getDb, parseJsonArray } from '@/lib/db'
import type { Prospect, ProspectContact, OutreachRecord } from '@/types'

const VALID_ENTITIES = ['capabilities', 'prospects', 'signals', 'engagements'] as const
const VALID_FORMATS = ['csv', 'json'] as const

function parseProspectRow(row: Record<string, unknown>): Prospect {
  let contacts: ProspectContact[] = []
  try { contacts = JSON.parse(row['contacts'] as string) as ProspectContact[] } catch { contacts = [] }
  let outreachHistory: OutreachRecord[] = []
  try { outreachHistory = JSON.parse(row['outreach_history'] as string) as OutreachRecord[] } catch { outreachHistory = [] }

  return {
    id: row['id'] as string,
    name: row['name'] as string,
    industry: row['industry'] as string,
    customer_category: row['customer_category'] as Prospect['customer_category'],
    estimated_ai_spend: (row['estimated_ai_spend'] as number) ?? 0,
    model_families: parseJsonArray(row['model_families'] as string),
    pain_points: parseJsonArray(row['pain_points'] as string),
    regulatory_exposure: parseJsonArray(row['regulatory_exposure'] as string),
    priority_score: (row['priority_score'] as number) ?? 50,
    revenue_engine: (row['revenue_engine'] as Prospect['revenue_engine']) ?? 'direct',
    pipeline_stage: (row['pipeline_stage'] as Prospect['pipeline_stage']) ?? 'signal_detected',
    pipeline_value: (row['pipeline_value'] as number) ?? 0,
    peer_cluster_id: (row['peer_cluster_id'] as string) ?? null,
    contacts,
    outreach_history: outreachHistory,
    notes: (row['notes'] as string) ?? null,
    created_at: (row['created_at'] as string) ?? new Date().toISOString(),
    updated_at: (row['updated_at'] as string) ?? new Date().toISOString(),
  }
}

function flattenForExport(data: Record<string, unknown>[]): Record<string, unknown>[] {
  return data.map((item) => {
    const flat: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(item)) {
      if (Array.isArray(value)) {
        flat[key] = value.join('; ')
      } else if (value !== null && typeof value === 'object') {
        flat[key] = JSON.stringify(value)
      } else {
        flat[key] = value
      }
    }
    return flat
  })
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    ensureSeeded()
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity')
    const format = searchParams.get('format') ?? 'csv'

    if (!entity || !(VALID_ENTITIES as readonly string[]).includes(entity)) {
      return NextResponse.json(
        { error: `entity must be one of: ${VALID_ENTITIES.join(', ')}`, code: 'INVALID_ENTITY' },
        { status: 400 }
      )
    }

    if (!(VALID_FORMATS as readonly string[]).includes(format)) {
      return NextResponse.json(
        { error: `format must be csv or json`, code: 'INVALID_FORMAT' },
        { status: 400 }
      )
    }

    let rawData: Record<string, unknown>[]

    switch (entity) {
      case 'capabilities': {
        const caps = getAllCapabilities()
        rawData = caps as unknown as Record<string, unknown>[]
        break
      }
      case 'prospects': {
        const db = getDb()
        const rows = db.prepare('SELECT * FROM prospects ORDER BY priority_score DESC').all() as Record<string, unknown>[]
        rawData = rows.map(parseProspectRow) as unknown as Record<string, unknown>[]
        break
      }
      case 'signals': {
        const signals = getAllSignals()
        rawData = signals as unknown as Record<string, unknown>[]
        break
      }
      case 'engagements': {
        const db = getDb()
        rawData = db.prepare('SELECT * FROM engagements ORDER BY start_date DESC').all() as Record<string, unknown>[]
        break
      }
      default:
        return NextResponse.json(
          { error: 'Invalid entity', code: 'INVALID_ENTITY' },
          { status: 400 }
        )
    }

    if (format === 'json') {
      const output = exportToJSON(rawData, true)
      return new NextResponse(output, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${entity}.json"`,
        },
      })
    }

    const flatData = flattenForExport(rawData)
    const output = exportToCSV(flatData, `${entity}.csv`)
    return new NextResponse(output, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${entity}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
