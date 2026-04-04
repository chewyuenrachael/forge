'use client'

import { type FC, useState, useMemo } from 'react'
import { Plus, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PredictionCard } from '@/components/delivery/PredictionCard'
import { PredictionReport } from '@/components/delivery/PredictionReport'
import type { Engagement, Prediction } from '@/types'
import type { PredictionOutcome } from '@/lib/constants'
import type { PredictionAccuracyReport } from '@/lib/predictions'

interface PredictionPanelProps {
  engagement: Engagement
  predictions: Prediction[]
  accuracy: PredictionAccuracyReport | null
  onCreatePrediction: () => void
  onRecordOutcome: (id: string, outcome: PredictionOutcome, notes?: string) => Promise<void>
}

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const CONFIDENCE_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

export const PredictionPanel: FC<PredictionPanelProps> = ({
  engagement,
  predictions,
  accuracy,
  onCreatePrediction,
  onRecordOutcome,
}) => {
  const [showReport, setShowReport] = useState(false)

  const sorted = useMemo(() => {
    return [...predictions].sort((a, b) => {
      const sevDiff = (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3)
      if (sevDiff !== 0) return sevDiff
      return (CONFIDENCE_ORDER[a.confidence] ?? 2) - (CONFIDENCE_ORDER[b.confidence] ?? 2)
    })
  }, [predictions])

  const confirmed = predictions.filter((p) => p.outcome === 'confirmed').length
  const refuted = predictions.filter((p) => p.outcome === 'refuted').length
  const untested = predictions.filter((p) => p.outcome === 'untested').length
  const tested = confirmed + refuted
  const accuracyPct = tested > 0 ? Math.round((confirmed / tested) * 100) : 0

  if (showReport && accuracy) {
    return (
      <div>
        <div className="mb-3">
          <Button size="sm" variant="ghost" onClick={() => setShowReport(false)}>
            &larr; Back to predictions
          </Button>
        </div>
        <PredictionReport engagement={engagement} predictions={predictions} accuracy={accuracy} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-text-tertiary font-medium">
            Predictions
          </span>
          <Badge variant="gray" size="sm">{predictions.length}</Badge>
          {tested > 0 && (
            <span className="text-xs font-mono text-text-secondary">
              {accuracyPct}% accuracy
            </span>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={onCreatePrediction}>
          <Plus size={13} className="mr-1" /> New Prediction
        </Button>
      </div>

      {/* Prediction list */}
      {predictions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-text-secondary mb-1">No predictions yet</p>
          <p className="text-xs text-text-tertiary">
            Create predictions from interpretability analysis to track the prediction motion.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((pred) => (
            <PredictionCard key={pred.id} prediction={pred} onRecordOutcome={onRecordOutcome} />
          ))}
        </div>
      )}

      {/* Summary bar */}
      {predictions.length > 0 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-[#D0CCC4]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-[#3D6B35]" />
              <span className="text-text-secondary">Confirmed:</span>
              <span className="font-mono font-medium text-text-primary">{confirmed}</span>
            </span>
            <span className="flex items-center gap-1 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-[#8A2020]" />
              <span className="text-text-secondary">Refuted:</span>
              <span className="font-mono font-medium text-text-primary">{refuted}</span>
            </span>
            <span className="flex items-center gap-1 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-[#D0CCC4]" />
              <span className="text-text-secondary">Untested:</span>
              <span className="font-mono font-medium text-text-primary">{untested}</span>
            </span>
            {tested > 0 && (
              <span className="text-xs font-medium text-text-primary ml-2">
                Accuracy: <span className="font-mono">{accuracyPct}%</span>
              </span>
            )}
          </div>
          {tested > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setShowReport(true)}>
              <FileText size={13} className="mr-1" /> Generate Report
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
