'use client'

import { type FC, useState, useCallback, useMemo } from 'react'
import { Copy, FileDown, Share2, CheckCircle2, XCircle, Minus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Engagement, Prediction } from '@/types'
import type { PredictionAccuracyReport } from '@/lib/predictions'

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

interface PredictionReportProps {
  engagement: Engagement
  predictions: Prediction[]
  accuracy: PredictionAccuracyReport
}

const SEVERITY_VARIANT: Record<string, BadgeVariant> = {
  critical: 'red',
  high: 'amber',
  medium: 'blue',
  low: 'gray',
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

function buildMarkdownReport(engagement: Engagement, predictions: Prediction[], accuracy: PredictionAccuracyReport): string {
  const tested = accuracy.confirmed + accuracy.refuted
  const lines: string[] = [
    `# Prediction Report: ${engagement.partner_name}`,
    '',
    `**Engagement:** ${engagement.engagement_tier} assessment`,
    `**Period:** ${engagement.start_date}${engagement.end_date ? ` — ${engagement.end_date}` : ''}`,
    '',
    '## Executive Summary',
    '',
    `Goodfire's mechanistic interpretability analysis produced **${predictions.length}** testable predictions about model behavior in scenarios not covered by standard evaluation suites. Of **${tested}** predictions tested, **${accuracy.confirmed}** were confirmed — an accuracy rate of **${tested > 0 ? accuracy.overallAccuracy : 0}%**.`,
    '',
    '## Predictions',
    '',
    '| # | Description | Severity | Confidence | Outcome | Date Tested |',
    '|---|-------------|----------|------------|---------|-------------|',
  ]

  predictions.forEach((pred, i) => {
    const desc = pred.description.length > 100 ? pred.description.slice(0, 100) + '...' : pred.description
    const outcome = pred.outcome === 'untested' ? '—' : pred.outcome.charAt(0).toUpperCase() + pred.outcome.slice(1)
    const date = pred.outcome_date ?? '—'
    lines.push(`| ${i + 1} | ${desc} | ${SEVERITY_LABEL[pred.severity] ?? pred.severity} | ${CONFIDENCE_LABEL[pred.confidence] ?? pred.confidence} | ${outcome} | ${date} |`)
  })

  lines.push(
    '',
    '## Accuracy Summary',
    '',
    `- Overall accuracy: ${accuracy.overallAccuracy}% (${accuracy.confirmed}/${tested} confirmed)`,
    `- Untested: ${accuracy.untested} predictions`,
    `- ${accuracy.confidenceNote}`,
    '',
    '## Methodology',
    '',
    'Predictions are derived from mechanistic interpretability analysis, including SAE feature extraction, probe-based internal state monitoring, and model diff amplification. Each prediction represents a specific, testable claim about model behavior that standard evaluation suites cannot detect.',
    '',
    '---',
    '',
    '*This report demonstrates that mechanistic interpretability provides predictive power beyond output-level evaluation.*',
  )

  return lines.join('\n')
}

export const PredictionReport: FC<PredictionReportProps> = ({
  engagement,
  predictions,
  accuracy,
}) => {
  const [copied, setCopied] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const tested = accuracy.confirmed + accuracy.refuted
  const accuracyPct = tested > 0 ? accuracy.overallAccuracy : 0

  const markdown = useMemo(
    () => buildMarkdownReport(engagement, predictions, accuracy),
    [engagement, predictions, accuracy],
  )

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
    }
  }, [markdown])

  function outcomeIcon(outcome: string): React.ReactElement {
    switch (outcome) {
      case 'confirmed': return <CheckCircle2 size={14} className="text-[#3D6B35]" />
      case 'refuted': return <XCircle size={14} className="text-[#8A2020]" />
      default: return <Minus size={14} className="text-text-tertiary" />
    }
  }

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Prediction Report
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {engagement.partner_name} &middot; {engagement.engagement_tier} assessment
          </p>
          <p className="text-xs font-mono text-text-tertiary mt-0.5">
            {engagement.start_date}{engagement.end_date ? ` — ${engagement.end_date}` : ''}
          </p>
        </div>

        {/* Executive Summary */}
        <div className="rounded-md border border-[#D0CCC4] bg-[#F0EDE6]/50 px-4 py-3">
          <h3 className="text-xs uppercase tracking-wider text-text-tertiary font-medium mb-2">
            Executive Summary
          </h3>
          <p className="text-sm text-text-primary leading-relaxed">
            Goodfire&apos;s mechanistic interpretability analysis of{' '}
            <span className="font-medium">{engagement.partner_name}&apos;s</span> model produced{' '}
            <span className="font-mono font-medium">{predictions.length}</span> testable predictions
            about model behavior in scenarios not covered by standard evaluation suites.
            {tested > 0 && (
              <>
                {' '}Of <span className="font-mono font-medium">{tested}</span> predictions tested,{' '}
                <span className="font-mono font-medium">{accuracy.confirmed}</span> were confirmed
                — an accuracy rate of{' '}
                <span className="font-mono font-semibold" style={{ color: accuracyPct >= 80 ? '#3D6B35' : accuracyPct >= 60 ? '#8A6B20' : '#8A2020' }}>
                  {accuracyPct}%
                </span>.
              </>
            )}
          </p>
        </div>

        {/* Predictions Table */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-text-tertiary font-medium mb-2">
            Predictions
          </h3>
          <div className="overflow-x-auto border border-[#D0CCC4] rounded-md">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D0CCC4] bg-[#F0EDE6]/30">
                  <th className="px-3 py-2 text-xs font-medium text-text-secondary text-left w-8">#</th>
                  <th className="px-3 py-2 text-xs font-medium text-text-secondary text-left">Description</th>
                  <th className="px-3 py-2 text-xs font-medium text-text-secondary text-left w-20">Severity</th>
                  <th className="px-3 py-2 text-xs font-medium text-text-secondary text-left w-24">Confidence</th>
                  <th className="px-3 py-2 text-xs font-medium text-text-secondary text-center w-20">Outcome</th>
                  <th className="px-3 py-2 text-xs font-medium text-text-secondary text-right w-24">Date</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((pred, idx) => {
                  const isExpanded = expandedRow === pred.id
                  const borderClass =
                    pred.outcome === 'confirmed' ? 'border-l-2 border-l-[#3D6B35]' :
                    pred.outcome === 'refuted' ? 'border-l-2 border-l-[#8A2020]' :
                    'border-l-2 border-l-transparent'

                  return (
                    <tr
                      key={pred.id}
                      className={`border-b border-[#D0CCC4] last:border-b-0 hover:bg-[#F0EDE6]/30 cursor-pointer ${borderClass}`}
                      onClick={() => setExpandedRow(isExpanded ? null : pred.id)}
                    >
                      <td className="px-3 py-2 text-xs font-mono text-text-tertiary">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <p className="text-sm text-text-primary line-clamp-2">{pred.description}</p>
                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-dashed border-[#D0CCC4]">
                            <p className="text-xs text-text-tertiary font-medium mb-1">Methodology:</p>
                            <p className="text-xs text-text-secondary leading-relaxed">{pred.methodology}</p>
                            {pred.outcome_notes && (
                              <>
                                <p className="text-xs text-text-tertiary font-medium mt-2 mb-1">Notes:</p>
                                <p className="text-xs text-text-secondary">{pred.outcome_notes}</p>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={SEVERITY_VARIANT[pred.severity] ?? 'gray'} size="sm">
                          {SEVERITY_LABEL[pred.severity] ?? pred.severity}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-text-secondary">
                        {CONFIDENCE_LABEL[pred.confidence] ?? pred.confidence}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {outcomeIcon(pred.outcome)}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-mono text-text-secondary">
                        {pred.outcome_date ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Accuracy Summary */}
        {tested > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-wider text-text-tertiary font-medium mb-2">
              Accuracy Summary
            </h3>
            <div className="flex items-center gap-6 text-sm">
              <span>
                Overall: <span className="font-mono font-semibold" style={{ color: accuracyPct >= 80 ? '#3D6B35' : '#8A6B20' }}>{accuracyPct}%</span>
              </span>
              <span className="text-text-secondary">
                Confirmed: <span className="font-mono">{accuracy.confirmed}</span>
              </span>
              <span className="text-text-secondary">
                Refuted: <span className="font-mono">{accuracy.refuted}</span>
              </span>
              <span className="text-text-secondary">
                Untested: <span className="font-mono">{accuracy.untested}</span>
              </span>
            </div>
          </div>
        )}

        {/* Methodology Note */}
        <div className="rounded-md border border-[#D0CCC4] bg-[#F0EDE6]/50 px-4 py-3">
          <h3 className="text-xs uppercase tracking-wider text-text-tertiary font-medium mb-2">
            Methodology
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Predictions are derived from mechanistic interpretability analysis, including SAE feature extraction,
            probe-based internal state monitoring, and model diff amplification. Each prediction represents
            a specific, testable claim about model behavior that standard evaluation suites cannot detect.
            Reference: Goodfire&apos;s published research on Residual Feature Rewriting (RLFR) and
            Sparse Probing Diagnostics (SPD).
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-[#D0CCC4] pt-3">
          <p className="text-xs text-text-tertiary italic mb-4">
            This report demonstrates that mechanistic interpretability provides predictive power
            beyond output-level evaluation. Each prediction represents a specific, testable claim
            about model behavior that standard evaluation suites cannot detect.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => void handleCopy()}>
              {copied ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-[#3D6B35]" /> Copied!
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Copy size={13} /> Copy Report
                </span>
              )}
            </Button>
            <span title="Coming soon">
              <Button size="sm" variant="ghost" disabled>
                <FileDown size={13} className="mr-1.5" /> Export PDF
              </Button>
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const shareText = `Prediction Report: ${engagement.partner_name} — ${accuracyPct}% accuracy across ${tested} tested predictions`
                void navigator.clipboard.writeText(shareText)
              }}
            >
              <Share2 size={13} className="mr-1.5" /> Share
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
