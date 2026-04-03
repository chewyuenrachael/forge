'use client'

import { useState, useCallback, useEffect } from 'react'
import { Check, Loader2, ChevronDown, Trash2, Eye } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { IntakeForm } from '@/components/solutions/IntakeForm'
import { CapabilityMatch } from '@/components/solutions/CapabilityMatch'
import { SolutionSimulationView } from '@/components/solutions/SolutionSimulation'
import { ProposalPreview } from '@/components/solutions/ProposalPreview'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { IntakeFormData, SolutionMatch, SolutionSimulation, SavedProposal, SavedProposalSummary } from '@/types'

type Step = 1 | 2 | 3

const STEP_LABELS = ['Intake', 'Capability Match', 'Simulation & Proposal'] as const

interface ApiState {
  status: 'idle' | 'loading' | 'error'
  error?: string
}

const SolutionsPage = (): React.ReactElement => {
  const [step, setStep] = useState<Step>(1)
  const [intake, setIntake] = useState<IntakeFormData | null>(null)
  const [matches, setMatches] = useState<SolutionMatch[]>([])
  const [simulation, setSimulation] = useState<SolutionSimulation | null>(null)
  const [apiState, setApiState] = useState<ApiState>({ status: 'idle' })
  const [slideDirection, setSlideDirection] = useState<'forward' | 'back'>('forward')

  // Saved proposals
  const [savedProposals, setSavedProposals] = useState<SavedProposalSummary[]>([])
  const [showSaved, setShowSaved] = useState(false)
  const [viewingProposal, setViewingProposal] = useState(false)

  const fetchProposals = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/proposals')
      if (!res.ok) return
      const json = await res.json() as { data: SavedProposalSummary[] }
      setSavedProposals(json.data)
    } catch {
      // Silently fail — proposals panel is supplementary
    }
  }, [])

  useEffect(() => {
    void fetchProposals()
  }, [fetchProposals])

  const handleIntakeSubmit = useCallback(async (data: IntakeFormData): Promise<void> => {
    setIntake(data)
    setApiState({ status: 'loading' })
    try {
      const response = await fetch('/api/scoper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json() as { data?: { matches: SolutionMatch[]; simulation: SolutionSimulation }; error?: string }
      if (result.error) {
        setApiState({ status: 'error', error: result.error })
        return
      }
      if (result.data) {
        setMatches(result.data.matches)
        setSimulation(result.data.simulation)
        setApiState({ status: 'idle' })
        setSlideDirection('forward')
        setStep(2)
      }
    } catch {
      setApiState({ status: 'error', error: 'Failed to analyze capabilities. Please try again.' })
    }
  }, [])

  const handleProceed = useCallback((): void => {
    setSlideDirection('forward')
    setStep(3)
  }, [])

  const handleBackToIntake = useCallback((): void => {
    setSlideDirection('back')
    setStep(1)
  }, [])

  const handleBackToMatch = useCallback((): void => {
    setSlideDirection('back')
    setStep(2)
  }, [])

  const handleViewProposal = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/proposals/${id}`)
      if (!res.ok) return
      const json = await res.json() as { data: SavedProposal }
      setIntake(json.data.intake_data)
      setMatches(json.data.matches)
      setSimulation(json.data.simulation)
      setViewingProposal(true)
      setSlideDirection('forward')
      setStep(3)
    } catch {
      // Silently fail
    }
  }, [])

  const handleDeleteProposal = useCallback(async (id: string): Promise<void> => {
    if (!window.confirm('Delete this saved proposal?')) return
    try {
      await fetch(`/api/proposals/${id}`, { method: 'DELETE' })
      await fetchProposals()
    } catch {
      // Silently fail
    }
  }, [fetchProposals])

  const handleBackToNew = useCallback((): void => {
    setViewingProposal(false)
    setIntake(null)
    setMatches([])
    setSimulation(null)
    setSlideDirection('back')
    setStep(1)
  }, [])

  return (
    <>
      <Header title="Solution Architect" subtitle="Capability matching and engagement scoping" />
      <PageContainer>
        <div className="space-y-8">
          {/* Saved Proposals Panel */}
          {savedProposals.length > 0 && (
            <Card noPadding>
              <button
                type="button"
                onClick={() => setShowSaved(!showSaved)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F0EDE6]/50 transition-colors"
              >
                <span className="text-sm font-medium text-text-secondary">
                  Saved Proposals ({savedProposals.length})
                </span>
                <ChevronDown
                  size={14}
                  className={`text-text-tertiary transition-transform duration-150 ${showSaved ? 'rotate-180' : ''}`}
                />
              </button>
              {showSaved && (
                <div className="border-t border-border-subtle px-4 py-2">
                  <div className="space-y-1">
                    {savedProposals.map((p) => (
                      <div key={p.id} className="group flex items-center gap-3 py-2 px-2 -mx-2 rounded hover:bg-[#F0EDE6]/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-text-primary truncate block">{p.title}</span>
                        </div>
                        <Badge variant="purple" size="sm">{p.match_count} capabilities</Badge>
                        <Button size="sm" variant="ghost" onClick={() => void handleViewProposal(p.id)}>
                          <Eye size={13} className="mr-1" /> View
                        </Button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteProposal(p.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-[#8A2020] transition-all"
                          aria-label="Delete proposal"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Viewing saved proposal banner */}
          {viewingProposal && (
            <div className="flex items-center justify-between rounded-md border border-[#D4E0ED] bg-[#D4E0ED]/30 px-4 py-2">
              <span className="text-sm text-[#3A5A80]">Viewing saved proposal for {intake?.partnerName}</span>
              <Button size="sm" variant="ghost" onClick={handleBackToNew}>
                ← Back to New
              </Button>
            </div>
          )}

          {/* Step Indicator */}
          <div className="flex items-center justify-center">
            {STEP_LABELS.map((label, i) => {
              const stepNum = (i + 1) as Step
              const isCompleted = step > stepNum
              const isCurrent = step === stepNum
              const isFuture = step < stepNum

              return (
                <div key={label} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
                          isCompleted
                            ? 'bg-accent-green/20 text-accent-green'
                            : isCurrent
                              ? 'bg-accent-amber/20 text-accent-amber'
                              : 'bg-elevated text-text-tertiary'
                        }`}
                      >
                        {isCompleted ? <Check size={16} /> : stepNum}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium transition-colors duration-300 ${
                        isCompleted
                          ? 'text-accent-green'
                          : isCurrent
                            ? 'text-accent-amber'
                            : 'text-text-tertiary'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div
                      className={`w-24 h-px mx-4 mb-4 transition-colors duration-300 ${
                        isCompleted ? 'bg-accent-green' : isFuture ? 'bg-border-subtle' : 'bg-accent-amber'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Step label */}
          <div className="text-center">
            <span className="text-xs font-mono text-text-tertiary">Step {step} of 3</span>
          </div>

          {/* Loading Overlay */}
          {apiState.status === 'loading' && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 rounded-lg border border-border-default bg-surface px-6 py-4">
                <Loader2 size={20} className="text-accent-amber animate-spin" />
                <span className="text-sm text-text-primary">Analyzing capabilities...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {apiState.status === 'error' && (
            <div className="rounded-md border border-[#8A2020]/30 bg-[#EDCFCF]/50 px-4 py-3">
              <p className="text-sm text-[#8A2020]">{apiState.error}</p>
              <Button
                variant="ghost"
                className="mt-2 text-accent-red"
                onClick={() => setApiState({ status: 'idle' })}
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Step Content */}
          {apiState.status !== 'loading' && (
            <div
              className={`transition-all duration-300 ease-in-out ${
                slideDirection === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'
              }`}
              key={step}
            >
              {step === 1 && (
                <IntakeForm onSubmit={handleIntakeSubmit} />
              )}
              {step === 2 && intake && (
                <CapabilityMatch
                  intake={intake}
                  matches={matches}
                  onProceed={handleProceed}
                  onBack={handleBackToIntake}
                />
              )}
              {step === 3 && intake && simulation && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-semibold text-text-primary">
                      Simulation & Proposal
                    </h2>
                    {!viewingProposal && (
                      <Button variant="ghost" onClick={handleBackToMatch}>
                        &larr; Back to Matches
                      </Button>
                    )}
                  </div>
                  <SolutionSimulationView simulation={simulation} />
                  <ProposalPreview
                    intake={intake}
                    matches={matches}
                    simulation={simulation}
                    onSaved={() => void fetchProposals()}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </PageContainer>
    </>
  )
}

export default SolutionsPage
