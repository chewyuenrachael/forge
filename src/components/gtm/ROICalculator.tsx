'use client'

import { type FC, useState, useEffect, useRef, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { calculateROI } from '@/lib/roi-engine'
import type { ROIInput, ROIResult } from '@/types'

interface ROICalculatorProps {
  onCalculate?: (result: ROIResult) => void
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount.toFixed(0)}`
}

function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

const REGULATORY_OPTIONS: Array<{ value: ROIInput['regulatoryExposure'][number]; label: string }> = [
  { value: 'eu_ai_act', label: 'EU AI Act' },
  { value: 'sr_11_7', label: 'SR 11-7 (Banking)' },
  { value: 'fda', label: 'FDA AI/ML' },
  { value: 'none', label: 'None' },
]

// ─── Combined ROI Calculator (inputs + results) ─────────────────────────

export const ROICalculator: FC<ROICalculatorProps> = ({ onCalculate }) => {
  const { input, result, updateField, toggleRegulatory } = useROIState(onCalculate)
  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-text-primary mb-4">ROI Calculator</h2>
      <ROIInputsCard input={input} updateField={updateField} toggleRegulatory={toggleRegulatory} />
      {result && <ROIResultsPanel result={result} />}
    </div>
  )
}

// ─── Inputs-only component ──────────────────────────────────────────────

interface ROICalculatorInputsProps {
  onResultChange?: (result: ROIResult | null) => void
}

export const ROICalculatorInputs: FC<ROICalculatorInputsProps> = ({ onResultChange }) => {
  const { input, result, updateField, toggleRegulatory } = useROIState()

  useEffect(() => {
    onResultChange?.(result)
  }, [result, onResultChange])

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-text-primary mb-4">ROI Calculator</h2>
      <ROIInputsCard input={input} updateField={updateField} toggleRegulatory={toggleRegulatory} />
    </div>
  )
}

// ─── Results-only component ─────────────────────────────────────────────

interface ROICalculatorResultsProps {
  result: ROIResult
}

export const ROICalculatorResults: FC<ROICalculatorResultsProps> = ({ result }) => {
  return <ROIResultsPanel result={result} />
}

// ─── Shared state hook ──────────────────────────────────────────────────

function useROIState(onCalculate?: (result: ROIResult) => void): {
  input: ROIInput
  result: ROIResult | null
  updateField: <K extends keyof ROIInput>(key: K, value: ROIInput[K]) => void
  toggleRegulatory: (value: ROIInput['regulatoryExposure'][number]) => void
} {
  const [input, setInput] = useState<ROIInput>({
    currentHallucinationRate: 12,
    monthlyInferenceSpend: 200_000,
    monthlyAnnotationSpend: 50_000,
    monthlyGuardrailSpend: 30_000,
    usesReasoningModels: true,
    monthlyReasoningTokens: 80_000,
    regulatoryExposure: ['eu_ai_act'],
    complianceDeadlineMonths: 4,
  })
  const [result, setResult] = useState<ROIResult | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const compute = useCallback(() => {
    const r = calculateROI(input)
    setResult(r)
    onCalculate?.(r)
  }, [input, onCalculate])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(compute, 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [compute])

  const updateField = <K extends keyof ROIInput>(key: K, value: ROIInput[K]): void => {
    setInput((prev) => ({ ...prev, [key]: value }))
  }

  const toggleRegulatory = (value: ROIInput['regulatoryExposure'][number]): void => {
    setInput((prev) => {
      if (value === 'none') return { ...prev, regulatoryExposure: ['none'] }
      const current = prev.regulatoryExposure.filter((v) => v !== 'none')
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, regulatoryExposure: next.length === 0 ? ['none'] : next }
    })
  }

  return { input, result, updateField, toggleRegulatory }
}

// ─── Inputs Card (shared rendering) ─────────────────────────────────────

interface ROIInputsCardProps {
  input: ROIInput
  updateField: <K extends keyof ROIInput>(key: K, value: ROIInput[K]) => void
  toggleRegulatory: (value: ROIInput['regulatoryExposure'][number]) => void
}

const ROIInputsCard: FC<ROIInputsCardProps> = ({ input, updateField, toggleRegulatory }) => {
  return (
    <Card className="p-6 space-y-5">
      <SliderField label="Monthly Inference Spend" value={input.monthlyInferenceSpend} min={0} max={5_000_000} step={10_000}
        format={formatCurrency} onChange={(v) => updateField('monthlyInferenceSpend', v)} />
      <SliderField label="Monthly Annotation Spend" value={input.monthlyAnnotationSpend} min={0} max={1_000_000} step={5_000}
        format={formatCurrency} onChange={(v) => updateField('monthlyAnnotationSpend', v)} />
      <SliderField label="Monthly Guardrail Spend" value={input.monthlyGuardrailSpend} min={0} max={500_000} step={5_000}
        format={formatCurrency} onChange={(v) => updateField('monthlyGuardrailSpend', v)} />
      <SliderField label="Hallucination Rate (%)" value={input.currentHallucinationRate} min={0} max={50} step={1}
        format={(v) => `${v}%`} onChange={(v) => updateField('currentHallucinationRate', v)} />

      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">Uses Reasoning Models</span>
        <button
          type="button"
          role="switch"
          aria-checked={input.usesReasoningModels}
          onClick={() => updateField('usesReasoningModels', !input.usesReasoningModels)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-150 ${
            input.usesReasoningModels ? 'bg-accent-amber' : 'bg-elevated border border-border-default'
          }`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform duration-150 ${
            input.usesReasoningModels ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {input.usesReasoningModels && (
        <SliderField label="Monthly Reasoning Token Spend" value={input.monthlyReasoningTokens} min={0} max={3_000_000} step={10_000}
          format={formatCurrency} onChange={(v) => updateField('monthlyReasoningTokens', v)} />
      )}

      <SliderField label="Compliance Deadline (months)" value={input.complianceDeadlineMonths} min={1} max={36} step={1}
        format={(v) => `${v}mo`} onChange={(v) => updateField('complianceDeadlineMonths', v)} />

      <div>
        <span className="block text-xs uppercase tracking-wider text-text-secondary font-medium mb-2">Regulatory Exposure</span>
        <div className="flex flex-wrap gap-2">
          {REGULATORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleRegulatory(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors duration-150 ${
                input.regulatoryExposure.includes(opt.value)
                  ? 'border-accent-amber bg-accent-amber/15 text-accent-amber'
                  : 'border-border-default text-text-secondary hover:text-text-primary hover:bg-elevated'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ─── Results Panel (shared rendering) ────────────────────────────────────

interface ROIResultsPanelProps {
  result: ROIResult
}

const ROIResultsPanel: FC<ROIResultsPanelProps> = ({ result }) => {
  const chartData = result.savings.map((s) => ({
    name: s.category,
    before: s.before,
    after: s.after,
  }))

  return (
    <Card className="p-8 mt-6">
      <div className="text-center mb-8">
        <div className="font-mono font-semibold text-4xl text-text-primary">
          {formatCurrencyFull(result.totalAnnualSaving)}
        </div>
        <div className="text-xs uppercase tracking-wider text-text-tertiary font-medium mt-2">Estimated Annual Savings</div>
        <div className="mt-3 text-sm text-text-primary">
          <span className="font-mono font-semibold text-accent-amber">{result.roi.toFixed(1)}x</span> return on engagement investment
        </div>
        <div className="text-xs text-text-secondary mt-1">
          Engagement cost: {formatCurrency(result.estimatedEngagementCost.low)}–{formatCurrency(result.estimatedEngagementCost.high)}
        </div>
      </div>

      <div className="mb-8" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
            <XAxis type="number" tickFormatter={(v: number) => formatCurrency(v)}
              tick={{ fill: '#999990', fontSize: 11 }} axisLine={{ stroke: '#D0CCC4' }} />
            <YAxis type="category" dataKey="name" width={90}
              tick={{ fill: '#999990', fontSize: 11 }} axisLine={{ stroke: '#D0CCC4' }} />
            <Tooltip formatter={(v) => formatCurrencyFull(Number(v))}
              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D0CCC4', borderRadius: 6, color: '#1A1A1A' }} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#666660' }} />
            <Bar dataKey="before" name="Before" fill="#C45A3C" radius={[0, 4, 4, 0]} />
            <Bar dataKey="after" name="After" fill="#3D6B35" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">Category</th>
              <th className="px-3 py-2 text-right text-xs uppercase tracking-wider text-text-secondary font-medium">Annual Saving</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {result.savings.map((line) => (
              <tr key={line.category} className="border-b border-border-subtle">
                <td className="px-3 py-2 text-text-primary">{line.category}</td>
                <td className="px-3 py-2 text-right font-mono text-text-primary">{formatCurrencyFull(line.annualSaving)}</td>
                <td className="px-3 py-2 text-xs text-text-tertiary max-w-md">{line.source || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 pt-4 border-t border-border-subtle">
        <h3 className="text-xs uppercase tracking-wider text-text-secondary font-medium mb-2">Compliance Assessment</h3>
        <Badge variant={result.complianceValue.urgency.startsWith('Critical') ? 'red' : result.complianceValue.urgency.startsWith('High') ? 'amber' : 'gray'}>
          {result.complianceValue.urgency.split(':')[0]}
        </Badge>
        <p className="text-sm text-text-secondary mt-2">{result.complianceValue.riskReduction}</p>
        <p className="text-xs text-text-tertiary mt-1">{result.complianceValue.urgency}</p>
      </div>
    </Card>
  )
}

// ─── Slider Sub-component ──────────────────────────────────────────────

interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}

const SliderField: FC<SliderFieldProps> = ({ label, value, min, max, step, format, onChange }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">{label}</span>
        <span className="font-mono text-sm text-text-primary">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-[#E0DDD5] accent-[#C45A3C] cursor-pointer"
      />
    </div>
  )
}
