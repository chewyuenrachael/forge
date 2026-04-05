'use client'

import { type FC, useMemo } from 'react'
import { ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { SignalFeedbackStats } from '@/lib/feedback'

interface SignalQualityReportProps {
  stats: SignalFeedbackStats
}

const TYPE_LABELS: Record<string, string> = {
  regulatory: 'Regulatory',
  competitor: 'Competitor',
  prospect: 'Prospect',
  conference: 'Conference',
  research: 'Research',
  incident: 'Incident',
}

function getCoverageBarColor(coverage: number): string {
  if (coverage >= 50) return 'bg-[#3D6B35]'
  if (coverage >= 30) return 'bg-[#8A6B20]'
  return 'bg-[#8A2020]'
}

function getCoverageStatusColor(coverage: number): string {
  if (coverage >= 50) return 'text-[#3D6B35]'
  if (coverage >= 30) return 'text-[#8A6B20]'
  return 'text-[#8A2020]'
}

function getCoverageStatusMessage(coverage: number): string {
  if (coverage >= 50) return 'Good coverage'
  if (coverage >= 30) return 'Low coverage — rate more signals'
  return 'Critical — insufficient data for quality analysis'
}

export const SignalQualityReport: FC<SignalQualityReportProps> = ({ stats }) => {
  const { feedbackCoverage, feedbackCount, totalSignals, qualityByType, recentFeedback } = stats

  const insight = useMemo((): string => {
    const typesWithFeedback = qualityByType.filter((t) => t.positive + t.negative > 0)
    const typesWithoutFeedback = qualityByType.filter((t) => t.positive + t.negative === 0)

    if (typesWithFeedback.length === 0) {
      return 'No signal types have feedback yet. Rate some signals to build the quality profile.'
    }

    // Find highest and lowest
    const sorted = [...typesWithFeedback].sort((a, b) => b.ratio - a.ratio)
    const highest = sorted[0]
    const lowest = sorted[sorted.length - 1]

    const parts: string[] = []

    if (highest && highest.ratio > 0) {
      parts.push(
        `${TYPE_LABELS[highest.type] ?? highest.type} signals have the highest quality (${highest.ratio}%). Consider increasing their actionability weight.`
      )
    }

    if (lowest && lowest !== highest && lowest.ratio < 60) {
      parts.push(
        `${TYPE_LABELS[lowest.type] ?? lowest.type} signals have low quality (${lowest.ratio}%). Consider reducing their weight or refining the signal sources.`
      )
    }

    if (typesWithoutFeedback.length > 0) {
      const names = typesWithoutFeedback.map((t) => TYPE_LABELS[t.type] ?? t.type).join(', ')
      parts.push(`${names} signals have no feedback yet. Rate some to build the quality profile.`)
    }

    return parts.join(' ')
  }, [qualityByType])

  return (
    <div className="space-y-4">
      {/* Section 1: Overall Coverage */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            Signal Feedback Coverage
          </h3>
          <div className="space-y-2">
            <div className="w-full h-2 rounded-full bg-[#E8E4D9] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getCoverageBarColor(feedbackCoverage)}`}
                style={{ width: `${Math.min(feedbackCoverage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-text-primary">
                {feedbackCoverage}% rated
              </span>
              <span className="text-xs text-text-secondary">
                {feedbackCount} of {totalSignals} signals have feedback
              </span>
            </div>
            <p className={`text-xs font-medium ${getCoverageStatusColor(feedbackCoverage)}`}>
              {getCoverageStatusMessage(feedbackCoverage)}
            </p>
          </div>
        </div>
      </Card>

      {/* Section 2: Quality by Signal Type */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            Quality by Signal Type
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D0CCC4]">
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-text-secondary px-2 py-2">
                    Type
                  </th>
                  <th className="text-right text-xs font-medium uppercase tracking-wider text-text-secondary px-2 py-2">
                    Positive
                  </th>
                  <th className="text-right text-xs font-medium uppercase tracking-wider text-text-secondary px-2 py-2">
                    Negative
                  </th>
                  <th className="text-right text-xs font-medium uppercase tracking-wider text-text-secondary px-2 py-2">
                    Quality
                  </th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-text-secondary px-2 py-2 w-32">
                    Distribution
                  </th>
                </tr>
              </thead>
              <tbody>
                {qualityByType.map((row) => {
                  const total = row.positive + row.negative
                  const greenPct = total > 0 ? (row.positive / total) * 100 : 0
                  const redPct = total > 0 ? (row.negative / total) * 100 : 0

                  return (
                    <tr key={row.type} className="border-b border-[#E8E4D9]">
                      <td className="px-2 py-2 text-sm text-text-primary">
                        {TYPE_LABELS[row.type] ?? row.type}
                      </td>
                      <td className="px-2 py-2 text-sm font-mono text-right text-[#3D6B35]">
                        {row.positive}
                      </td>
                      <td className="px-2 py-2 text-sm font-mono text-right text-[#8A2020]">
                        {row.negative}
                      </td>
                      <td className="px-2 py-2 text-sm font-mono text-right text-text-primary">
                        {total > 0 ? `${row.ratio}%` : '—'}
                      </td>
                      <td className="px-2 py-2">
                        {total > 0 ? (
                          <div className="flex h-2 rounded-full overflow-hidden bg-[#E8E4D9]">
                            <div
                              className="bg-[#3D6B35] transition-all duration-300"
                              style={{ width: `${greenPct}%` }}
                            />
                            <div
                              className="bg-[#8A2020] transition-all duration-300"
                              style={{ width: `${redPct}%` }}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-text-tertiary">No feedback</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {/* Insight line */}
          <div className="flex items-start gap-2 px-2 py-2 rounded-md bg-[#F5F3EE]">
            <AlertCircle size={14} className="text-[#8A6B20] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-text-secondary leading-relaxed">{insight}</p>
          </div>
        </div>
      </Card>

      {/* Section 3: Recent Feedback Activity */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            Recent Feedback Activity
          </h3>
          {recentFeedback.length === 0 ? (
            <p className="text-sm text-text-tertiary py-2">
              No feedback recorded yet. Rate signals to see activity here.
            </p>
          ) : (
            <div className="space-y-1">
              {recentFeedback.map((entry) => (
                <div
                  key={`${entry.signalId}-${entry.date}`}
                  className="flex items-center gap-2 py-1.5 border-b border-[#E8E4D9] last:border-0"
                >
                  {entry.feedback === 'positive' ? (
                    <ThumbsUp size={12} className="text-[#3D6B35] flex-shrink-0" />
                  ) : (
                    <ThumbsDown size={12} className="text-[#8A2020] flex-shrink-0" />
                  )}
                  <span className="text-xs text-text-secondary font-mono flex-shrink-0">
                    {formatDate(entry.date)}
                  </span>
                  <span className="text-xs text-text-primary truncate">
                    {entry.signalTitle}
                  </span>
                  <Badge
                    variant={entry.feedback === 'positive' ? 'green' : 'red'}
                    size="sm"
                  >
                    {entry.feedback === 'positive' ? 'useful' : 'noise'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}
