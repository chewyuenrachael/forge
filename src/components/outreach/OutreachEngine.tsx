'use client'

import { type FC, useState, useCallback } from 'react'
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmailPreview } from './EmailPreview'
import type { Prospect, Signal, Capability, CustomerCategoryDef } from '@/types'
import type { GeneratedOutreach } from '@/lib/outreach'

interface OutreachEngineProps {
  prospect: Prospect
  signal?: Signal
  signals?: Signal[]
  capabilities?: Capability[]
  categories?: CustomerCategoryDef[]
  audience?: string
  onGenerated: (outreach: GeneratedOutreach) => void
  onClose: () => void
}

const AUDIENCE_OPTIONS = [
  { value: 'ml_engineer', label: 'ML Engineer', desc: 'Technical, peer-level, methodology-focused' },
  { value: 'cto', label: 'CTO / VP Eng', desc: 'Strategic, outcome-focused, ROI-driven' },
  { value: 'compliance', label: 'Compliance', desc: 'Formal, standards-referenced, deadline-aware' },
  { value: 'researcher', label: 'Researcher', desc: 'Academic, evidence-based, publication-referenced' },
  { value: 'ai_community', label: 'AI Community', desc: 'Accessible, implications-focused' },
] as const

const DIFF_LEVELS = [
  { value: 'surface', label: 'Surface', desc: 'What Goodfire does — high-level positioning' },
  { value: 'mechanism', label: 'Mechanism', desc: 'How it works differently — technical depth' },
  { value: 'proof', label: 'Proof', desc: 'Published evidence and benchmarks — strongest' },
] as const

export const OutreachEngine: FC<OutreachEngineProps> = ({
  prospect,
  signal,
  signals,
  capabilities,
  audience: defaultAudience,
  onGenerated,
  onClose,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedSignalId, setSelectedSignalId] = useState<string>(signal?.id ?? signals?.[0]?.id ?? '')
  const [selectedAudience, setSelectedAudience] = useState<string>(defaultAudience ?? 'cto')
  const [selectedDiffLevel, setSelectedDiffLevel] = useState<string>('proof')
  const [generatedOutreach, setGeneratedOutreach] = useState<GeneratedOutreach | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generationMethod, setGenerationMethod] = useState<'ai' | 'template' | null>(null)

  const availableSignals = signals ?? (signal ? [signal] : [])
  const selectedSignal = availableSignals.find((s) => s.id === selectedSignalId)

  const handleGenerate = useCallback(async (): Promise<void> => {
    if (!selectedSignalId) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: prospect.id,
          signalId: selectedSignalId,
          audience: selectedAudience,
        }),
      })

      const json = await res.json() as Record<string, unknown>

      if (!res.ok) {
        setError((json['error'] as string) ?? 'Failed to generate outreach')
        return
      }

      const outreach = json['data'] as GeneratedOutreach
      setGeneratedOutreach(outreach)
      // Detect generation method based on response characteristics
      setGenerationMethod(outreach.body.includes('[Demo Mode]') ? 'template' : 'ai')
      setStep(3)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [prospect.id, selectedSignalId, selectedAudience])

  const handleEdit = useCallback((edited: GeneratedOutreach): void => {
    setGeneratedOutreach(edited)
  }, [])

  const handleDone = useCallback((): void => {
    if (generatedOutreach) {
      onGenerated(generatedOutreach)
    }
    onClose()
  }, [generatedOutreach, onGenerated, onClose])

  return (
    <Modal isOpen={true} onClose={onClose} title={`Outreach — ${prospect.name}`} size="lg">
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                s <= step ? 'bg-[#C45A3C]' : 'bg-[#E8E4D9]'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Context Selection */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Signal selection */}
            <div>
              <label className="text-xs uppercase tracking-wider font-medium text-text-secondary block mb-2">
                Triggering Signal
              </label>
              {availableSignals.length > 0 ? (
                <select
                  value={selectedSignalId}
                  onChange={(e) => setSelectedSignalId(e.target.value)}
                  className="w-full h-9 rounded-md border border-[#D0CCC4] bg-white px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[#C45A3C]/30 focus:border-[#C45A3C]"
                >
                  {availableSignals.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} (relevance: {s.relevance_score})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-text-tertiary italic">No signals available for this prospect</p>
              )}
            </div>

            {/* Audience selection */}
            <div>
              <label className="text-xs uppercase tracking-wider font-medium text-text-secondary block mb-2">
                Audience
              </label>
              <div className="space-y-1.5">
                {AUDIENCE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors duration-200 ${
                      selectedAudience === opt.value ? 'bg-[#F0EDE6]' : 'hover:bg-[#F0EDE6]/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      value={opt.value}
                      checked={selectedAudience === opt.value}
                      onChange={() => setSelectedAudience(opt.value)}
                      className="mt-0.5 accent-[#C45A3C]"
                    />
                    <div>
                      <span className="text-sm font-medium text-text-primary">{opt.label}</span>
                      <span className="text-xs text-text-tertiary ml-2">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Differentiation level */}
            <div>
              <label className="text-xs uppercase tracking-wider font-medium text-text-secondary block mb-2">
                Differentiation Level
              </label>
              <div className="space-y-1.5">
                {DIFF_LEVELS.map((lvl) => (
                  <label
                    key={lvl.value}
                    className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors duration-200 ${
                      selectedDiffLevel === lvl.value ? 'bg-[#F0EDE6]' : 'hover:bg-[#F0EDE6]/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="diffLevel"
                      value={lvl.value}
                      checked={selectedDiffLevel === lvl.value}
                      onChange={() => setSelectedDiffLevel(lvl.value)}
                      className="mt-0.5 accent-[#C45A3C]"
                    />
                    <div>
                      <span className="text-sm font-medium text-text-primary">{lvl.label}</span>
                      <span className="text-xs text-text-tertiary ml-2">{lvl.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Matched capabilities */}
            {capabilities && capabilities.length > 0 && (
              <div>
                <span className="text-xs uppercase tracking-wider font-medium text-text-secondary">
                  Matched Capabilities
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {capabilities.slice(0, 5).map((c) => (
                    <Badge key={c.id} variant="green" size="sm">{c.name}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Next button */}
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                disabled={!selectedSignalId}
              >
                <span className="flex items-center gap-1">
                  Continue <ChevronRight className="h-4 w-4" />
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Generation */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-md border border-border-subtle bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">Prospect</span>
                <span className="text-sm font-medium text-text-primary">{prospect.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">Signal</span>
                <span className="text-sm text-text-primary">{selectedSignal?.title ?? 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">Audience</span>
                <Badge variant="blue" size="sm">
                  {AUDIENCE_OPTIONS.find((o) => o.value === selectedAudience)?.label ?? selectedAudience}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">Differentiation</span>
                <Badge variant="gray" size="sm">
                  {DIFF_LEVELS.find((l) => l.value === selectedDiffLevel)?.label ?? selectedDiffLevel}
                </Badge>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-md border border-[#8A2020]/30 bg-[#EDCFCF]/50 p-3">
                <p className="text-xs text-[#8A2020]">{error}</p>
              </div>
            )}

            {/* Generate button */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <span className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" /> Back
                </span>
              </Button>
              <Button variant="primary" onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                  </span>
                ) : (
                  <span>Generate Draft</span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && generatedOutreach && (
          <div className="space-y-4">
            {/* Generation method badge */}
            <div className="flex items-center gap-2">
              {generationMethod === 'ai' ? (
                <Badge variant="purple" size="sm">AI Generated</Badge>
              ) : (
                <Badge variant="gray" size="sm">Template Generated</Badge>
              )}
            </div>

            <EmailPreview
              outreach={generatedOutreach}
              onEdit={handleEdit}
              prospectName={prospect.name}
              prospectId={prospect.id}
              signalId={selectedSignalId}
            />

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <span className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" /> Regenerate
                </span>
              </Button>
              <Button variant="primary" onClick={handleDone}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
