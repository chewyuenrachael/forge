'use client'

import { type FC, useState } from 'react'
import dynamic from 'next/dynamic'
import { Settings, RotateCcw } from 'lucide-react'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Prospect, ICPScore, ICPWeights } from '@/types'

const ICPHistogramChart = dynamic(() => import('./ICPHistogramChart'), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-elevated animate-pulse rounded-md" />,
})

interface ICPDashboardProps {
  prospects: (Prospect & { icpScore: ICPScore })[]
  weights: ICPWeights
  onWeightsUpdate: (weights: ICPWeights) => Promise<void>
}

const WEIGHT_LABELS: { key: keyof ICPWeights; label: string }[] = [
  { key: 'modelFamilyMatch', label: 'Model Family Match' },
  { key: 'regulatoryPressure', label: 'Regulatory Pressure' },
  { key: 'peerClusterDensity', label: 'Peer Cluster Density' },
  { key: 'recentSignals', label: 'Recent Signals' },
]

const DEFAULT_WEIGHTS: ICPWeights = {
  modelFamilyMatch: 0.40,
  regulatoryPressure: 0.25,
  peerClusterDensity: 0.20,
  recentSignals: 0.15,
}

export const ICPDashboard: FC<ICPDashboardProps> = ({ prospects, weights, onWeightsUpdate }) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<ICPWeights>(weights)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const scores = prospects.map((p) => p.icpScore)
  const composites = scores.map((s) => s.composite)
  const mean = composites.length > 0 ? Math.round(composites.reduce((a, b) => a + b, 0) / composites.length) : 0
  const sorted = [...composites].sort((a, b) => a - b)
  const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)]! : 0

  const highCount = composites.filter((c) => c >= 80).length
  const midCount = composites.filter((c) => c >= 60 && c < 80).length
  const lowCount = composites.filter((c) => c < 60).length

  const draftSum = draft.modelFamilyMatch + draft.regulatoryPressure + draft.peerClusterDensity + draft.recentSignals
  const isValid = Math.abs(draftSum - 1.0) <= 0.05 &&
    Object.values(draft).every((v) => v >= 0 && v <= 1)

  function handleWeightChange(key: keyof ICPWeights, value: string): void {
    const num = parseFloat(value)
    if (!isNaN(num)) {
      setDraft((prev) => ({ ...prev, [key]: num }))
    }
  }

  async function handleSave(): Promise<void> {
    setSaving(true)
    setMessage(null)
    try {
      await onWeightsUpdate(draft)
      setMessage(`Recalculated ${prospects.length} prospect scores.`)
      setEditing(false)
    } catch {
      setMessage('Failed to update weights.')
    } finally {
      setSaving(false)
    }
  }

  function handleReset(): void {
    setDraft({ ...DEFAULT_WEIGHTS })
  }

  return (
    <Card header={
      <div className="flex items-center justify-between w-full">
        <span>ICP Score Distribution</span>
        <button
          onClick={() => { setEditing(!editing); setDraft(weights); setMessage(null) }}
          className="text-text-tertiary hover:text-text-primary transition-colors duration-150"
          title="Adjust weights"
        >
          <Settings size={14} />
        </button>
      </div>
    }>
      <div className="space-y-4">
        <ICPHistogramChart scores={scores} />

        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-text-tertiary">Mean</span>
            <span className="ml-1 font-mono font-semibold text-text-primary">{mean}</span>
          </div>
          <div>
            <span className="text-text-tertiary">Median</span>
            <span className="ml-1 font-mono font-semibold text-text-primary">{median}</span>
          </div>
          <div>
            <span className="text-[#3D6B35]">Critical {highCount}</span>
          </div>
          <div>
            <span className="text-[#8A6B20]">High {midCount}</span>
          </div>
          <div>
            <span className="text-text-tertiary">Low {lowCount}</span>
          </div>
        </div>

        {/* Weight bars */}
        <div className="border-t border-border-subtle pt-3">
          <p className="text-xs uppercase tracking-wider text-text-tertiary font-medium mb-2">
            ICP Scoring Weights
          </p>
          <div className="space-y-2">
            {WEIGHT_LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-36 flex-shrink-0">{label}</span>
                <div className="flex-1 h-2 rounded-full bg-elevated overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#C45A3C] transition-all duration-300"
                    style={{ width: `${(editing ? draft[key] : weights[key]) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-text-primary w-8 text-right">
                  {(editing ? draft[key] : weights[key]).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {editing && (
          <div className="border-t border-border-subtle pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {WEIGHT_LABELS.map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs text-text-secondary">{label}</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={draft[key]}
                    onChange={(e) => handleWeightChange(key, e.target.value)}
                    className="mt-0.5 w-full h-8 px-2 text-sm font-mono bg-base border border-border-default rounded-md text-text-primary focus:border-[#C45A3C] focus:ring-1 focus:ring-[#C45A3C]/30 focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono ${isValid ? 'text-text-tertiary' : 'text-[#8A2020]'}`}>
                Total: {draftSum.toFixed(2)} {!isValid && '(must be ~1.00)'}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw size={12} className="mr-1" />
                  Reset
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!isValid || saving}
                  onClick={() => { void handleSave() }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
            {message && (
              <p className={`text-xs ${message.includes('Failed') ? 'text-[#8A2020]' : 'text-[#3D6B35]'}`}>
                {message}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
