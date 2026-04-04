'use client'

import { type FC } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card } from '@/components/ui/Card'
import { MetricCard } from '@/components/ui/MetricCard'
import { Target } from 'lucide-react'
import type { PredictionAccuracyReport } from '@/lib/predictions'

interface PredictionAccuracyProps {
  accuracy: PredictionAccuracyReport
  modelFamilyNames?: Map<string, string>
  compact?: boolean
}

function accuracyColor(pct: number): string {
  if (pct >= 80) return '#3D6B35'
  if (pct >= 60) return '#8A6B20'
  return '#8A2020'
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low']

interface BarDataItem {
  name: string
  accuracy: number
  label: string
}

function AccuracyBar({ data }: { data: BarDataItem[] }): React.ReactElement {
  if (data.length === 0) {
    return <p className="text-xs text-text-tertiary italic">No data</p>
  }

  return (
    <div className="h-[140px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 80 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#5C5A50' }} tickFormatter={(v: number) => `${v}%`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#5C5A50' }} width={75} />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Accuracy']}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #D0CCC4' }}
          />
          <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((entry, index) => (
              <Cell key={index} fill={accuracyColor(entry.accuracy)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export const PredictionAccuracy: FC<PredictionAccuracyProps> = ({
  accuracy,
  modelFamilyNames,
  compact = false,
}) => {
  if (compact) {
    const label = accuracy.sampleSize > 0
      ? `${accuracy.confirmed}/${accuracy.sampleSize} confirmed`
      : 'No tested predictions'

    return (
      <MetricCard
        value={accuracy.sampleSize > 0 ? `${accuracy.overallAccuracy}%` : '—'}
        label="Prediction Accuracy"
        icon={<Target size={18} />}
        mono
        trend={accuracy.sampleSize >= 5 ? {
          value: label,
          direction: 'neutral',
        } : undefined}
      />
    )
  }

  // Full view
  const severityData: BarDataItem[] = SEVERITY_ORDER
    .map((sev) => {
      const entry = accuracy.bySeverity.find((s) => s.severity === sev)
      if (!entry || entry.count === 0) return null
      return {
        name: SEVERITY_LABEL[sev] ?? sev,
        accuracy: entry.accuracy,
        label: `${Math.round(entry.accuracy * entry.count / 100)}/${entry.count}`,
      }
    })
    .filter((d): d is BarDataItem => d !== null)

  const modelData: BarDataItem[] = accuracy.byModelFamily.map((mf) => ({
    name: modelFamilyNames?.get(mf.modelFamilyId) ?? mf.modelFamilyId,
    accuracy: mf.accuracy,
    label: `${Math.round(mf.accuracy * mf.count / 100)}/${mf.count}`,
  }))

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-text-tertiary font-medium mb-4">
            Prediction Accuracy
          </h3>

          {/* Overall metric */}
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <p
                className="text-4xl font-display font-semibold"
                style={{ color: accuracy.sampleSize > 0 ? accuracyColor(accuracy.overallAccuracy) : '#5C5A50' }}
              >
                {accuracy.sampleSize > 0 ? `${accuracy.overallAccuracy}%` : '—'}
              </p>
              <p className="text-xs text-text-secondary mt-1">overall accuracy</p>
              {accuracy.sampleSize > 0 && (
                <p className="text-xs font-mono text-text-tertiary">
                  {accuracy.confirmed}/{accuracy.sampleSize} confirmed / tested
                </p>
              )}
            </div>
            {accuracy.untested > 0 && (
              <div className="text-xs text-text-secondary">
                <span className="font-mono font-medium text-text-primary">{accuracy.untested}</span> predictions awaiting verification
              </div>
            )}
          </div>
        </div>

        {/* By Severity */}
        {severityData.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-text-tertiary font-medium mb-2">
              By Severity
            </h4>
            <AccuracyBar data={severityData} />
          </div>
        )}

        {/* By Model Family */}
        {modelData.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-text-tertiary font-medium mb-2">
              By Model Family
            </h4>
            <AccuracyBar data={modelData} />
          </div>
        )}

        {/* By Engagement */}
        {accuracy.byEngagement.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-text-tertiary font-medium mb-2">
              By Engagement
            </h4>
            <div className="space-y-1.5">
              {accuracy.byEngagement.map((eng) => (
                <div key={eng.engagementId} className="flex items-center justify-between text-sm">
                  <span className="text-text-primary">{eng.partnerName}</span>
                  <span className="font-mono text-xs" style={{ color: accuracyColor(eng.accuracy) }}>
                    {eng.accuracy}% ({eng.confirmed}/{eng.total})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence note */}
        <div className="rounded-md border border-[#D0CCC4] bg-[#F0EDE6]/50 px-3 py-2">
          <p className="text-xs text-text-secondary">
            <span className="font-medium">Sample size:</span>{' '}
            <span className="font-mono">{accuracy.sampleSize}</span> tested predictions
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            <span className="font-medium">Status:</span> {accuracy.confidenceNote}
          </p>
        </div>
      </div>
    </Card>
  )
}
