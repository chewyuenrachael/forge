'use client'

import { type FC, useState, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft, Loader2, Copy, Check, AlertTriangle, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmailPreview } from './EmailPreview'
import type { PeerCluster, Prospect, Signal, Capability, CustomerCategoryDef } from '@/types'
import type { GeneratedOutreach } from '@/lib/outreach'

interface BurstResult {
  prospectId: string
  outreach: GeneratedOutreach
  status: 'generated' | 'sent' | 'skipped'
}

interface BurstWorkflowProps {
  cluster: PeerCluster
  prospects: Prospect[]
  signals: Signal[]
  capabilities: Capability[]
  categories: CustomerCategoryDef[]
  onComplete: (results: BurstResult[]) => void
  onClose: () => void
}

const AUDIENCE_OPTIONS = [
  { value: 'ml_engineer', label: 'ML Engineer' },
  { value: 'cto', label: 'CTO / VP Eng' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'researcher', label: 'Researcher' },
  { value: 'ai_community', label: 'AI Community' },
] as const

const DIFF_LEVELS = [
  { value: 'surface', label: 'Surface' },
  { value: 'mechanism', label: 'Mechanism' },
  { value: 'proof', label: 'Proof' },
] as const

export const BurstWorkflow: FC<BurstWorkflowProps> = ({
  cluster,
  prospects,
  signals,
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(prospects.map((p) => p.id)))
  const [selectedSignalId, setSelectedSignalId] = useState<string>(signals[0]?.id ?? '')
  const [selectedAudience, setSelectedAudience] = useState<string>('cto')
  const [selectedDiffLevel, setSelectedDiffLevel] = useState<string>('proof')
  const [results, setResults] = useState<Map<string, BurstResult>>(new Map())
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [copiedAll, setCopiedAll] = useState(false)

  const selectedCount = selectedIds.size
  const selectedSignal = signals.find((s) => s.id === selectedSignalId)

  const toggleProspect = useCallback((id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback((): void => {
    if (selectedIds.size === prospects.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(prospects.map((p) => p.id)))
    }
  }, [selectedIds.size, prospects])

  const handleGenerate = useCallback(async (): Promise<void> => {
    setGenerating(true)
    const ids = Array.from(selectedIds)
    setProgress({ current: 0, total: ids.length })
    const newResults = new Map<string, BurstResult>()

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      if (!id) continue
      setProgress({ current: i + 1, total: ids.length })

      try {
        const res = await fetch('/api/outreach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prospectId: id,
            signalId: selectedSignalId,
            audience: selectedAudience,
          }),
        })

        if (res.ok) {
          const json = await res.json() as { data: GeneratedOutreach }
          newResults.set(id, { prospectId: id, outreach: json.data, status: 'generated' })
        } else {
          // Skip prospect on error
          const prospect = prospects.find((p) => p.id === id)
          newResults.set(id, {
            prospectId: id,
            outreach: {
              subject: '',
              body: `Failed to generate outreach for ${prospect?.name ?? id}`,
              audience: selectedAudience,
              differentiationLevel: 'proof',
              categoryValueProp: '',
              signalReference: selectedSignal?.title ?? '',
              benchmarks: [],
              mailtoLink: '',
              gmailLink: '',
            },
            status: 'skipped',
          })
        }
      } catch {
        newResults.set(id ?? '', {
          prospectId: id ?? '',
          outreach: {
            subject: '',
            body: 'Network error during generation',
            audience: selectedAudience,
            differentiationLevel: 'proof',
            categoryValueProp: '',
            signalReference: '',
            benchmarks: [],
            mailtoLink: '',
            gmailLink: '',
          },
          status: 'skipped',
        })
      }

      setResults(new Map(newResults))
    }

    setGenerating(false)
  }, [selectedIds, selectedSignalId, selectedAudience, selectedSignal, prospects])

  const generatedCount = Array.from(results.values()).filter((r) => r.status === 'generated').length
  const skippedCount = Array.from(results.values()).filter((r) => r.status === 'skipped').length

  const handleCopyAll = useCallback((): void => {
    const texts = Array.from(results.values())
      .filter((r) => r.status === 'generated')
      .map((r) => {
        const p = prospects.find((pr) => pr.id === r.prospectId)
        return `--- ${p?.name ?? r.prospectId} ---\nSubject: ${r.outreach.subject}\n\n${r.outreach.body}`
      })
      .join('\n\n' + '='.repeat(50) + '\n\n')

    navigator.clipboard.writeText(texts).then(() => {
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    }).catch(() => {
      // Clipboard unavailable
    })
  }, [results, prospects])

  const handleMarkAllSent = useCallback(async (): Promise<void> => {
    const generated = Array.from(results.values()).filter((r) => r.status === 'generated')
    for (const result of generated) {
      try {
        await fetch('/api/outreach/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prospectId: result.prospectId,
            signalId: selectedSignalId,
            outreach: result.outreach,
          }),
        })
        setResults((prev) => {
          const next = new Map(prev)
          const existing = next.get(result.prospectId)
          if (existing) {
            next.set(result.prospectId, { ...existing, status: 'sent' })
          }
          return next
        })
      } catch {
        // Continue with next
      }
    }
  }, [results, selectedSignalId])

  const handleComplete = useCallback((): void => {
    onComplete(Array.from(results.values()))
    onClose()
  }, [results, onComplete, onClose])

  const handleEditOutreach = useCallback((prospectId: string, edited: GeneratedOutreach): void => {
    setResults((prev) => {
      const next = new Map(prev)
      const existing = next.get(prospectId)
      if (existing) {
        next.set(prospectId, { ...existing, outreach: edited })
      }
      return next
    })
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-4xl max-h-[85vh] rounded-md border border-border-subtle bg-surface flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <div>
            <h2 className="font-display text-lg font-semibold text-text-primary flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#C45A3C]" />
              Burst Outreach — {cluster.name}
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              {cluster.industry} · {cluster.region} · {prospects.length} prospects
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-tertiary hover:text-text-primary hover:bg-[#F0EDE6] transition-colors duration-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border-subtle shrink-0">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                s <= step ? 'bg-[#C45A3C]' : 'bg-[#E8E4D9]'
              }`}
            />
          ))}
          <span className="text-xs text-text-tertiary ml-2">
            Step {step} of 4
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 1: Select Prospects */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Select Prospects</h3>
                <Button variant="ghost" size="sm" onClick={toggleAll}>
                  {selectedIds.size === prospects.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="space-y-1">
                {prospects.map((p) => {
                  const contact = p.contacts[0]
                  const hasEmail = p.contacts.some((c) => c.email)
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors duration-200 ${
                        selectedIds.has(p.id) ? 'bg-[#F0EDE6]' : 'hover:bg-[#F0EDE6]/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleProspect(p.id)}
                        className="accent-[#C45A3C]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{p.name}</span>
                          <Badge variant="gray" size="sm">{p.customer_category.replace(/_/g, ' ')}</Badge>
                        </div>
                        <div className="text-xs text-text-tertiary mt-0.5">
                          {contact ? `${contact.name} · ${contact.title}` : 'No contact identified'}
                          {!hasEmail && (
                            <span className="ml-2 text-[#8A6B20]">
                              <AlertTriangle className="h-3 w-3 inline" /> No email
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-text-tertiary">
                        ICP: {p.priority_score}
                      </span>
                    </label>
                  )
                })}
              </div>

              <p className="text-xs text-text-secondary">
                {selectedCount} of {prospects.length} selected
              </p>
            </div>
          )}

          {/* Step 2: Choose Signal & Framing */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-medium text-text-secondary block mb-2">
                  Signal
                </label>
                <select
                  value={selectedSignalId}
                  onChange={(e) => setSelectedSignalId(e.target.value)}
                  className="w-full h-9 rounded-md border border-[#D0CCC4] bg-white px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[#C45A3C]/30 focus:border-[#C45A3C]"
                >
                  {signals.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} (actionability: {s.actionability_score})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-medium text-text-secondary block mb-2">
                  Audience Framing
                </label>
                <div className="flex flex-wrap gap-2">
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer border transition-colors duration-200 ${
                        selectedAudience === opt.value
                          ? 'border-[#C45A3C] bg-[#F0EDE6]'
                          : 'border-border-subtle hover:bg-[#F0EDE6]/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="burstAudience"
                        value={opt.value}
                        checked={selectedAudience === opt.value}
                        onChange={() => setSelectedAudience(opt.value)}
                        className="accent-[#C45A3C]"
                      />
                      <span className="text-sm text-text-primary">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-medium text-text-secondary block mb-2">
                  Differentiation Level
                </label>
                <div className="flex gap-2">
                  {DIFF_LEVELS.map((lvl) => (
                    <label
                      key={lvl.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer border transition-colors duration-200 ${
                        selectedDiffLevel === lvl.value
                          ? 'border-[#C45A3C] bg-[#F0EDE6]'
                          : 'border-border-subtle hover:bg-[#F0EDE6]/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="burstDiffLevel"
                        value={lvl.value}
                        checked={selectedDiffLevel === lvl.value}
                        onChange={() => setSelectedDiffLevel(lvl.value)}
                        className="accent-[#C45A3C]"
                      />
                      <span className="text-sm text-text-primary">{lvl.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Generate & Review */}
          {step === 3 && (
            <div className="space-y-4">
              {generating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Generating...
                    </span>
                    <span className="font-mono">{progress.current}/{progress.total}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#E8E4D9]">
                    <div
                      className="h-1.5 rounded-full bg-[#C45A3C] transition-all duration-300"
                      style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {!generating && results.size > 0 && (
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span>{generatedCount} generated</span>
                  {skippedCount > 0 && (
                    <span className="text-[#8A6B20]">{skippedCount} skipped</span>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {Array.from(results.entries()).map(([prospectId, result]) => {
                  const p = prospects.find((pr) => pr.id === prospectId)
                  if (!p || result.status === 'skipped') {
                    return (
                      <div key={prospectId} className="rounded-md border border-[#8A6B20]/30 bg-[#EDE0C8]/30 p-3">
                        <span className="text-xs text-[#8A6B20]">
                          Skipped: {p?.name ?? prospectId}
                        </span>
                      </div>
                    )
                  }
                  return (
                    <EmailPreview
                      key={prospectId}
                      outreach={result.outreach}
                      onEdit={(edited) => handleEditOutreach(prospectId, edited)}
                      prospectName={p.name}
                      prospectId={prospectId}
                      signalId={selectedSignalId}
                      compact
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 4: Send */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-md border border-border-subtle bg-white p-4 text-center">
                <h3 className="text-lg font-display font-semibold text-text-primary">
                  Burst Complete
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  {generatedCount} outreach emails for {cluster.name}
                </p>
                <div className="flex justify-center gap-4 mt-3">
                  <div className="text-center">
                    <span className="text-2xl font-mono font-semibold text-text-primary">{generatedCount}</span>
                    <span className="block text-xs text-text-tertiary">Generated</span>
                  </div>
                  {skippedCount > 0 && (
                    <div className="text-center">
                      <span className="text-2xl font-mono font-semibold text-[#8A6B20]">{skippedCount}</span>
                      <span className="block text-xs text-text-tertiary">Skipped</span>
                    </div>
                  )}
                  <div className="text-center">
                    <span className="text-2xl font-mono font-semibold text-[#3D6B35]">
                      {Array.from(results.values()).filter((r) => r.status === 'sent').length}
                    </span>
                    <span className="block text-xs text-text-tertiary">Sent</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={handleCopyAll}>
                  {copiedAll ? (
                    <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Copied All</span>
                  ) : (
                    <span className="flex items-center gap-1"><Copy className="h-3 w-3" /> Copy All</span>
                  )}
                </Button>
                <Button variant="primary" onClick={handleMarkAllSent}>
                  Mark All as Sent
                </Button>
              </div>

              <div className="space-y-3">
                {Array.from(results.entries()).map(([prospectId, result]) => {
                  const p = prospects.find((pr) => pr.id === prospectId)
                  if (!p || result.status === 'skipped') return null
                  return (
                    <EmailPreview
                      key={prospectId}
                      outreach={result.outreach}
                      onEdit={(edited) => handleEditOutreach(prospectId, edited)}
                      prospectName={p.name}
                      prospectId={prospectId}
                      signalId={selectedSignalId}
                      compact
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle shrink-0">
          {step === 1 && (
            <>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                disabled={selectedCount === 0}
              >
                <span className="flex items-center gap-1">
                  Configure <ChevronRight className="h-4 w-4" />
                </span>
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button variant="ghost" onClick={() => setStep(1)}>
                <span className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" /> Back
                </span>
              </Button>
              <Button
                variant="primary"
                onClick={() => { setStep(3); void handleGenerate() }}
                disabled={!selectedSignalId}
              >
                <span className="flex items-center gap-1">
                  <Zap className="h-4 w-4" /> Generate All ({selectedCount})
                </span>
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <Button variant="ghost" onClick={() => setStep(2)} disabled={generating}>
                <span className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" /> Back
                </span>
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(4)}
                disabled={generating || results.size === 0}
              >
                <span className="flex items-center gap-1">
                  Review & Send <ChevronRight className="h-4 w-4" />
                </span>
              </Button>
            </>
          )}

          {step === 4 && (
            <>
              <Button variant="ghost" onClick={() => setStep(3)}>
                <span className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" /> Back
                </span>
              </Button>
              <Button variant="primary" onClick={handleComplete}>
                Complete
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
