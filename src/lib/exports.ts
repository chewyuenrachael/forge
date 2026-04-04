// ─── Data Export & Formatting Utilities ──────────────────────────────
// Pure functions — no database access, no side effects.

// ─── CSV Export ──────────────────────────────────────────────────────

function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) return ''

  let str: string
  if (Array.isArray(value)) {
    str = value.join(';')
  } else if (typeof value === 'object') {
    str = JSON.stringify(value)
  } else {
    str = String(value)
  }

  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Convert an array of objects to CSV format.
 * Handles nested objects (JSON stringified), arrays (semicolon-joined),
 * null/undefined (empty string), and commas in values (quoted).
 * @param data - Array of flat objects to export
 * @param _filename - For Content-Disposition header reference (not used in output)
 * @returns CSV string with header row and data rows
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function exportToCSV(data: Record<string, unknown>[], _filename: string): string {
  if (data.length === 0) return ''

  const first = data[0]
  if (!first) return ''
  const headers = Object.keys(first)

  const headerRow = headers.map(escapeCSVValue).join(',')
  const dataRows = data.map((row) =>
    headers.map((h) => escapeCSVValue(row[h])).join(',')
  )

  return [headerRow, ...dataRows].join('\n')
}

// ─── JSON Export ─────────────────────────────────────────────────────

/**
 * Serialize data to JSON string.
 * @param data - Any serializable data
 * @param pretty - If true, use 2-space indentation (default false)
 * @returns JSON string
 */
export function exportToJSON(data: unknown, pretty?: boolean): string {
  return JSON.stringify(data, null, pretty ? 2 : undefined)
}

// ─── Formatters ──────────────────────────────────────────────────────

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/**
 * Format a number as USD currency, e.g. "$1,273,733".
 * @param amount - The dollar amount
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  if (!isFinite(amount)) return '$0'
  return currencyFormatter.format(amount)
}

/**
 * Format a number as a percentage string, e.g. "58.0%" or "43%".
 * @param value - The percentage value (e.g. 58 for 58%)
 * @param decimals - Decimal places (default 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals?: number): string {
  if (!isFinite(value)) return '0%'
  return `${value.toFixed(decimals ?? 1)}%`
}

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

/**
 * Format an ISO date string for display.
 * @param isoDate - ISO date string (YYYY-MM-DD or full ISO)
 * @param format - 'short' (Mar 12, 2026), 'long' (March 12, 2026), or 'relative' (3 days ago)
 * @returns Formatted date string
 */
export function formatDate(isoDate: string, format?: 'short' | 'long' | 'relative'): string {
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return isoDate

  const mode = format ?? 'short'

  if (mode === 'short') return shortDateFormatter.format(date)
  if (mode === 'long') return longDateFormatter.format(date)

  // Relative
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays === -1) return 'in 1 day'
  if (diffDays > 1 && diffDays < 14) return `${diffDays} days ago`
  if (diffDays >= 14 && diffDays < 60) return `${Math.round(diffDays / 7)} weeks ago`
  if (diffDays >= 60) return `${Math.round(diffDays / 30)} months ago`
  if (diffDays < -1 && diffDays > -14) return `in ${Math.abs(diffDays)} days`
  if (diffDays <= -14 && diffDays > -60) return `in ${Math.round(Math.abs(diffDays) / 7)} weeks`
  return `in ${Math.round(Math.abs(diffDays) / 30)} months`
}

/**
 * Calculate the number of days from today until a target date.
 * Positive = future, negative = past.
 * @param targetDate - ISO date string (YYYY-MM-DD)
 * @returns Number of days until the target date
 */
export function daysUntil(targetDate: string): number {
  const target = new Date(targetDate)
  if (isNaN(target.getTime())) {
    throw new Error(`Invalid date: ${targetDate}`)
  }
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
