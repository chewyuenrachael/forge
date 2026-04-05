'use client'

import { type FC, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Settings2, Check, AlertCircle } from 'lucide-react'
import type { ActionabilityWeights, ICPWeights } from '@/types'

interface WeightTunerProps {
  currentActionabilityWeights: ActionabilityWeights
  suggestedActionabilityWeights: ActionabilityWeights | null
  actionabilityRationale: string[]
  currentICPWeights: ICPWeights
  suggestedICPWeights: ICPWeights | null
  icpRationale: string[]
  confidenceLevel: 'high' | 'medium' | 'low'
  onApplyActionabilityWeights: (weights: ActionabilityWeights) => Promise<void>
  onApplyICPWeights: (weights: ICPWeights) => Promise<void>
}

type Mode = 'view' | 'customize-actionability' | 'customize-icp'

const CONFIDENCE_VARIANTS: Record<string, 'green' | 'amber' | 'gray'> = {
  high: 'green',
  medium: 'amber',
  low: 'gray',
}

const ACTION_WEIGHT_LABELS: Record<keyof ActionabilityWeights, string> = {
  relevance: 'Relevance',
  urgency: 'Urgency',
  coverage: 'Coverage',
  novelty: 'Novelty',
}

const ICP_WEIGHT_LABELS: Record<keyof ICPWeights, string> = {
  modelFamilyMatch: 'Model Family',
  regulatoryPressure: 'Regulatory',
  peerClusterDensity: 'Peer Cluster',
  recentSignals: 'Recent Signals',
}

function formatDelta(current: number, suggested: number): string {
  const diff = suggested - current
  if (Math.abs(diff) < 0.005) return 'no change'
  const sign = diff > 0 ? '+' : ''
  return `${sign}${diff.toFixed(2)}`
}

function getDeltaColor(current: number, suggested: number): string {
  const diff = suggested - current
  if (Math.abs(diff) < 0.005) return 'text-text-tertiary'
  return diff > 0 ? 'text-green-400' : 'text-red-400'
}

export const WeightTuner: FC<WeightTunerProps> = ({
  currentActionabilityWeights,
  suggestedActionabilityWeights,
  actionabilityRationale,
  currentICPWeights,
  suggestedICPWeights,
  icpRationale,
  confidenceLevel,
  onApplyActionabilityWeights,
  onApplyICPWeights,
}) => {
  const [mode, setMode] = useState<Mode>('view')
  const [applying, setApplying] = useState(false)
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null)

  // Custom weight state for actionability
  const [customActionWeights, setCustomActionWeights] = useState<ActionabilityWeights>({
    ...currentActionabilityWeights,
  })

  // Custom weight state for ICP
  const [customICPWeights, setCustomICPWeights] = useState<ICPWeights>({
    ...currentICPWeights,
  })

  const hasSuggestions = suggestedActionabilityWeights !== null || suggestedICPWeights !== null

  const handleApplyActionability = async (weights: ActionabilityWeights): Promise<void> => {
    setApplying(true)
    setAppliedMessage(null)
    try {
      await onApplyActionabilityWeights(weights)
      setAppliedMessage('Actionability weights updated. Signal scores recalculated.')
      setMode('view')
    } catch {
      setAppliedMessage('Failed to apply weights. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  const handleApplyICP = async (weights: ICPWeights): Promise<void> => {
    setApplying(true)
    setAppliedMessage(null)
    try {
      await onApplyICPWeights(weights)
      setAppliedMessage('ICP weights updated. Prospect scores recalculated.')
      setMode('view')
    } catch {
      setAppliedMessage('Failed to apply weights. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  const actionWeightSum = customActionWeights.relevance + customActionWeights.urgency + customActionWeights.coverage + customActionWeights.novelty
  const icpWeightSum = customICPWeights.modelFamilyMatch + customICPWeights.regulatoryPressure + customICPWeights.peerClusterDensity + customICPWeights.recentSignals
  const actionSumValid = Math.abs(actionWeightSum - 1.0) <= 0.05
  const icpSumValid = Math.abs(icpWeightSum - 1.0) <= 0.05

  return (
    <div className="space-y-4">
      {/* Applied message */}
      {appliedMessage && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500/10 border border-green-500/20">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">{appliedMessage}</span>
        </div>
      )}

      {/* Section 1: Actionability Weights */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-accent-amber" />
              <h3 className="text-sm font-semibold text-text-primary">Signal Actionability Weights</h3>
            </div>
            <Badge variant={CONFIDENCE_VARIANTS[confidenceLevel] ?? 'gray'} size="sm">
              {confidenceLevel} confidence
            </Badge>
          </div>
        }
      >
        {mode === 'customize-actionability' ? (
          <CustomizeActionabilityView
            weights={customActionWeights}
            onChange={setCustomActionWeights}
            weightSum={actionWeightSum}
            sumValid={actionSumValid}
            applying={applying}
            onApply={() => handleApplyActionability(customActionWeights)}
            onCancel={() => setMode('view')}
          />
        ) : (
          <div className="space-y-4">
            {/* Current vs Suggested */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">Weight</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">Current</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">
                  {suggestedActionabilityWeights ? 'Suggested' : ''}
                </span>
              </div>
            </div>

            {(Object.keys(ACTION_WEIGHT_LABELS) as Array<keyof ActionabilityWeights>).map((key) => (
              <div key={key} className="grid grid-cols-3 gap-4 items-center">
                <span className="text-sm text-text-primary">{ACTION_WEIGHT_LABELS[key]}</span>
                <span className="font-mono text-sm text-text-primary">
                  {currentActionabilityWeights[key].toFixed(2)}
                </span>
                {suggestedActionabilityWeights ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-text-primary">
                      {suggestedActionabilityWeights[key].toFixed(2)}
                    </span>
                    <span className={`font-mono text-xs ${getDeltaColor(currentActionabilityWeights[key], suggestedActionabilityWeights[key])}`}>
                      ({formatDelta(currentActionabilityWeights[key], suggestedActionabilityWeights[key])})
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-text-tertiary">\u2014</span>
                )}
              </div>
            ))}

            {/* Rationale */}
            {actionabilityRationale.length > 0 && (
              <div className="border-t border-border-subtle pt-3 space-y-1.5">
                <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">Rationale</span>
                {actionabilityRationale.map((r, i) => (
                  <p key={i} className="text-sm text-text-secondary">{r}</p>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              {suggestedActionabilityWeights && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={applying}
                  onClick={() => handleApplyActionability(suggestedActionabilityWeights)}
                >
                  Apply Suggested
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCustomActionWeights({ ...currentActionabilityWeights })
                  setMode('customize-actionability')
                }}
              >
                Customize Manually
              </Button>
              {suggestedActionabilityWeights && (
                <Button variant="ghost" size="sm" onClick={() => setAppliedMessage(null)}>
                  Keep Current
                </Button>
              )}
            </div>

            {!hasSuggestions && (
              <p className="text-sm text-text-tertiary">
                Not enough conversion data for weight suggestions. Track 10+ conversions for recommendations.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Section 2: ICP Weights */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-accent-blue" />
              <h3 className="text-sm font-semibold text-text-primary">ICP Scoring Weights</h3>
            </div>
            <Badge variant={CONFIDENCE_VARIANTS[confidenceLevel] ?? 'gray'} size="sm">
              {confidenceLevel} confidence
            </Badge>
          </div>
        }
      >
        {mode === 'customize-icp' ? (
          <CustomizeICPView
            weights={customICPWeights}
            onChange={setCustomICPWeights}
            weightSum={icpWeightSum}
            sumValid={icpSumValid}
            applying={applying}
            onApply={() => handleApplyICP(customICPWeights)}
            onCancel={() => setMode('view')}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">Weight</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">Current</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">
                  {suggestedICPWeights ? 'Suggested' : ''}
                </span>
              </div>
            </div>

            {(Object.keys(ICP_WEIGHT_LABELS) as Array<keyof ICPWeights>).map((key) => (
              <div key={key} className="grid grid-cols-3 gap-4 items-center">
                <span className="text-sm text-text-primary">{ICP_WEIGHT_LABELS[key]}</span>
                <span className="font-mono text-sm text-text-primary">
                  {currentICPWeights[key].toFixed(2)}
                </span>
                {suggestedICPWeights ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-text-primary">
                      {suggestedICPWeights[key].toFixed(2)}
                    </span>
                    <span className={`font-mono text-xs ${getDeltaColor(currentICPWeights[key], suggestedICPWeights[key])}`}>
                      ({formatDelta(currentICPWeights[key], suggestedICPWeights[key])})
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-text-tertiary">\u2014</span>
                )}
              </div>
            ))}

            {icpRationale.length > 0 && (
              <div className="border-t border-border-subtle pt-3 space-y-1.5">
                <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">Rationale</span>
                {icpRationale.map((r, i) => (
                  <p key={i} className="text-sm text-text-secondary">{r}</p>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              {suggestedICPWeights && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={applying}
                  onClick={() => handleApplyICP(suggestedICPWeights)}
                >
                  Apply Suggested
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCustomICPWeights({ ...currentICPWeights })
                  setMode('customize-icp')
                }}
              >
                Customize Manually
              </Button>
              {suggestedICPWeights && (
                <Button variant="ghost" size="sm" onClick={() => setAppliedMessage(null)}>
                  Keep Current
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Customize Actionability Sub-View ───────────────────────────────

interface CustomizeActionabilityViewProps {
  weights: ActionabilityWeights
  onChange: (weights: ActionabilityWeights) => void
  weightSum: number
  sumValid: boolean
  applying: boolean
  onApply: () => void
  onCancel: () => void
}

const CustomizeActionabilityView: FC<CustomizeActionabilityViewProps> = ({
  weights,
  onChange,
  weightSum,
  sumValid,
  applying,
  onApply,
  onCancel,
}) => {
  const handleChange = (key: keyof ActionabilityWeights, value: number): void => {
    onChange({ ...weights, [key]: value })
  }

  return (
    <div className="space-y-4">
      {(Object.keys(ACTION_WEIGHT_LABELS) as Array<keyof ActionabilityWeights>).map((key) => (
        <div key={key} className="flex items-center gap-4">
          <span className="text-sm text-text-primary w-24">{ACTION_WEIGHT_LABELS[key]}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={weights[key]}
            onChange={(e) => handleChange(key, parseFloat(e.target.value))}
            className="flex-1 h-2 accent-amber-500"
          />
          <span className="font-mono text-sm text-text-primary w-12 text-right">
            {weights[key].toFixed(2)}
          </span>
        </div>
      ))}

      <div className={`flex items-center gap-2 text-sm ${sumValid ? 'text-text-secondary' : 'text-red-400'}`}>
        {!sumValid && <AlertCircle className="w-4 h-4" />}
        <span>
          Total: <span className="font-mono">{weightSum.toFixed(2)}</span>
          {!sumValid && ' (must be ~1.00)'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" disabled={!sumValid || applying} onClick={onApply}>
          Apply Custom
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

// ─── Customize ICP Sub-View ─────────────────────────────────────────

interface CustomizeICPViewProps {
  weights: ICPWeights
  onChange: (weights: ICPWeights) => void
  weightSum: number
  sumValid: boolean
  applying: boolean
  onApply: () => void
  onCancel: () => void
}

const CustomizeICPView: FC<CustomizeICPViewProps> = ({
  weights,
  onChange,
  weightSum,
  sumValid,
  applying,
  onApply,
  onCancel,
}) => {
  const handleChange = (key: keyof ICPWeights, value: number): void => {
    onChange({ ...weights, [key]: value })
  }

  return (
    <div className="space-y-4">
      {(Object.keys(ICP_WEIGHT_LABELS) as Array<keyof ICPWeights>).map((key) => (
        <div key={key} className="flex items-center gap-4">
          <span className="text-sm text-text-primary w-24">{ICP_WEIGHT_LABELS[key]}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={weights[key]}
            onChange={(e) => handleChange(key, parseFloat(e.target.value))}
            className="flex-1 h-2 accent-amber-500"
          />
          <span className="font-mono text-sm text-text-primary w-12 text-right">
            {weights[key].toFixed(2)}
          </span>
        </div>
      ))}

      <div className={`flex items-center gap-2 text-sm ${sumValid ? 'text-text-secondary' : 'text-red-400'}`}>
        {!sumValid && <AlertCircle className="w-4 h-4" />}
        <span>
          Total: <span className="font-mono">{weightSum.toFixed(2)}</span>
          {!sumValid && ' (must be ~1.00)'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" disabled={!sumValid || applying} onClick={onApply}>
          Apply Custom
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
