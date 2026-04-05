'use client'

import { type FC } from 'react'
import { Card } from '@/components/ui/Card'
import { MessageSquare, Lightbulb } from 'lucide-react'
import type { ConversionByAudienceFraming } from '@/lib/analytics'

interface FramingEffectivenessProps {
  data: ConversionByAudienceFraming[]
}

function formatFramingLabel(framing: string): string {
  return framing
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function generateFramingInsight(data: ConversionByAudienceFraming[]): string {
  if (data.length === 0) {
    return 'No outreach framing data available yet. Insights will appear as outreach is tracked with audience framing tags.'
  }

  const best = data[0] // Already sorted by response rate DESC
  if (!best || best.responseRate === 0) {
    return 'No responses recorded yet. Continue outreach to build framing effectiveness data.'
  }

  const parts: string[] = []
  parts.push(
    `${formatFramingLabel(best.audienceType)} framing has the highest response rate (${best.responseRate}%)`
  )

  if (best.avgResponseDays > 0) {
    parts.push(`and fastest average response time (${best.avgResponseDays} days)`)
  }

  if (data.length > 1) {
    const worst = data[data.length - 1]
    if (worst && worst.responseRate < best.responseRate) {
      parts.push(
        `compared to ${formatFramingLabel(worst.audienceType)} at ${worst.responseRate}%`
      )
    }
  }

  return parts.join(' ') + '.'
}

export const FramingEffectiveness: FC<FramingEffectivenessProps> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => b.responseRate - a.responseRate)
  const maxResponseRate = Math.max(...data.map((d) => d.responseRate), 1)
  const firstSorted = sortedData.length > 0 ? sortedData[0] : undefined
  const bestType = firstSorted ? firstSorted.audienceType : null
  const insight = generateFramingInsight(sortedData)

  if (data.length === 0) {
    return (
      <Card header="Outreach Framing Effectiveness">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare className="w-8 h-8 text-text-tertiary mb-3" />
          <p className="text-sm text-text-secondary">
            No outreach framing data available yet.
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            Framing effectiveness will appear as outreach is tracked with audience framing tags.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card header="Outreach Framing Effectiveness">
      <div className="space-y-4">
        {sortedData.map((row) => {
          const isBest = row.audienceType === bestType
          return (
            <div
              key={row.audienceType}
              className={`rounded-md border px-4 py-3 transition-colors ${
                isBest
                  ? 'border-l-2 border-l-accent-amber border-t-border-subtle border-r-border-subtle border-b-border-subtle bg-accent-amber/5'
                  : 'border-border-subtle'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-text-primary">
                  {formatFramingLabel(row.audienceType)} Framing
                </h4>
                {isBest && (
                  <span className="text-xs text-accent-amber font-medium">Top Performer</span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-text-secondary mb-2">
                <span>
                  Outreach: <span className="font-mono text-text-primary">{row.outreachCount}</span>
                </span>
                <span>
                  Response: <span className="font-mono text-text-primary">{row.responseRate}%</span>
                </span>
                <span>
                  Meeting: <span className="font-mono text-text-primary">{row.meetingRate}%</span>
                </span>
              </div>

              {/* Response rate bar */}
              <div className="h-2 bg-base rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isBest ? 'bg-accent-amber' : 'bg-accent-blue'}`}
                  style={{ width: `${Math.min(100, (row.responseRate / maxResponseRate) * 100)}%` }}
                />
              </div>

              {row.avgResponseDays > 0 && (
                <p className="text-xs text-text-tertiary mt-1.5">
                  Avg response time: <span className="font-mono">{row.avgResponseDays}</span> days
                </p>
              )}
            </div>
          )
        })}

        {/* Insight */}
        <div className="border-t border-border-subtle pt-3 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-accent-amber mt-0.5 shrink-0" />
          <p className="text-sm text-text-secondary">{insight}</p>
        </div>
      </div>
    </Card>
  )
}
