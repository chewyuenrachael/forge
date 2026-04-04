'use client'

import { type FC, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Prediction } from '@/types'
import type { PredictionOutcome } from '@/lib/constants'

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

interface PredictionCardProps {
  prediction: Prediction
  onRecordOutcome: (id: string, outcome: PredictionOutcome, notes?: string) => Promise<void>
}

const SEVERITY_VARIANT: Record<Prediction['severity'], BadgeVariant> = {
  critical: 'red',
  high: 'amber',
  medium: 'blue',
  low: 'gray',
}

const SEVERITY_LABEL: Record<Prediction['severity'], string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const CONFIDENCE_STYLE: Record<Prediction['confidence'], { border: string; text: string; label: string }> = {
  high: { border: 'border-[#3D6B35]', text: 'text-[#3D6B35]', label: 'High confidence' },
  medium: { border: 'border-[#8A6B20]', text: 'text-[#8A6B20]', label: 'Medium confidence' },
  low: { border: 'border-[#D0CCC4]', text: 'text-text-secondary', label: 'Low confidence' },
}

function OutcomeIndicator({
  prediction,
  onRecordOutcome,
}: {
  prediction: Prediction
  onRecordOutcome: (id: string, outcome: PredictionOutcome, notes?: string) => Promise<void>
}): React.ReactElement {
  const [showPopover, setShowPopover] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleRecord = useCallback(async (outcome: 'confirmed' | 'refuted') => {
    setSaving(true)
    try {
      await onRecordOutcome(prediction.id, outcome, notes.trim() || undefined)
      setShowPopover(false)
      setNotes('')
    } finally {
      setSaving(false)
    }
  }, [prediction.id, notes, onRecordOutcome])

  if (prediction.outcome === 'confirmed') {
    return (
      <div className="flex items-center gap-1.5">
        <CheckCircle2 size={18} className="text-[#3D6B35]" />
        <span className="text-xs font-mono text-[#3D6B35]">{prediction.outcome_date}</span>
      </div>
    )
  }

  if (prediction.outcome === 'refuted') {
    return (
      <div className="flex items-center gap-1.5">
        <XCircle size={18} className="text-[#8A2020]" />
        <span className="text-xs font-mono text-[#8A2020]">{prediction.outcome_date}</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShowPopover(!showPopover) }}
        className="flex items-center gap-1 p-1 rounded text-text-tertiary hover:text-text-secondary hover:bg-[#F0EDE6] transition-colors"
        aria-label="Record outcome"
      >
        <HelpCircle size={18} />
        <span className="text-xs">Untested</span>
      </button>

      {showPopover && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setShowPopover(false); setNotes('') }} />
          <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-md border border-[#D0CCC4] bg-white shadow-sm p-3 space-y-3">
            <p className="text-xs font-medium text-text-primary">Record outcome</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context about the test result..."
              maxLength={2000}
              rows={2}
              disabled={saving}
              className="w-full rounded border border-[#D0CCC4] bg-[#FAFAF7] px-2 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-[#C45A3C] focus:ring-1 focus:ring-[#C45A3C]/20 resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => void handleRecord('confirmed')}
                disabled={saving}
                className="!bg-[#3D6B35] hover:!bg-[#2D5025] flex-1"
              >
                Confirmed
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => void handleRecord('refuted')}
                disabled={saving}
                className="!bg-[#8A2020] hover:!bg-[#6A1010] flex-1"
              >
                Refuted
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setShowPopover(false); setNotes('') }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export const PredictionCard: FC<PredictionCardProps> = ({ prediction, onRecordOutcome }) => {
  const [showMethodology, setShowMethodology] = useState(false)

  const borderColor =
    prediction.outcome === 'confirmed' ? 'border-l-2 border-l-[#3D6B35]' :
    prediction.outcome === 'refuted' ? 'border-l-2 border-l-[#8A2020]' :
    ''

  const confStyle = CONFIDENCE_STYLE[prediction.confidence]

  return (
    <Card className={borderColor}>
      {/* Top row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Badge variant={SEVERITY_VARIANT[prediction.severity]} size="sm">
            {SEVERITY_LABEL[prediction.severity]}
          </Badge>
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${confStyle.border} ${confStyle.text}`}>
            {confStyle.label}
          </span>
        </div>
        <OutcomeIndicator prediction={prediction} onRecordOutcome={onRecordOutcome} />
      </div>

      {/* Description */}
      <p className="text-sm text-text-primary leading-relaxed mb-2">
        {prediction.description}
      </p>

      {/* Methodology toggle */}
      <button
        type="button"
        onClick={() => setShowMethodology(!showMethodology)}
        className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        {showMethodology ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        Methodology
      </button>
      {showMethodology && (
        <p className="text-xs text-text-secondary mt-1.5 pl-4 leading-relaxed">
          {prediction.methodology}
        </p>
      )}

      {/* Outcome notes */}
      {prediction.outcome !== 'untested' && prediction.outcome_notes && (
        <div className="mt-2 pt-2 border-t border-dashed border-[#D0CCC4]">
          <p className="text-xs text-text-secondary">
            <span className="font-medium">Notes:</span> {prediction.outcome_notes}
          </p>
        </div>
      )}
    </Card>
  )
}
