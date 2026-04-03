'use client'

import { type FC, useState, useEffect, useCallback } from 'react'
import { FileText, Check, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { IntakeFormData, SolutionMatch, SolutionSimulation } from '@/types'

interface ProposalPreviewProps {
  intake: IntakeFormData
  matches: SolutionMatch[]
  simulation: SolutionSimulation
  onSaved?: () => void
}

const confidenceVariant = (confidence: string): 'green' | 'amber' | 'gray' => {
  switch (confidence) {
    case 'high': return 'green'
    case 'medium': return 'amber'
    default: return 'gray'
  }
}

function getSuccessCriteria(match: SolutionMatch): string {
  switch (match.capability.id) {
    case 'cap-rlfr':
      return 'Achieve measurable hallucination reduction (target: 30%+ on partner evaluation set)'
    case 'cap-reasoning-theater':
      return 'Demonstrate inference cost reduction (target: 30%+ token savings on partner workload)'
    case 'cap-rakuten-pii':
      return 'Deploy runtime safety probes with sub-millisecond overhead on partner infrastructure'
    case 'cap-model-diff':
      return 'Complete model audit identifying post-training behavioral regressions'
    case 'cap-alzheimers':
      return 'Deliver interpretability analysis revealing actionable biological insights'
    case 'cap-evo2-tree':
    case 'cap-interpreting-evo2':
      return 'Extract and validate biological knowledge representations from partner FM'
    case 'cap-memorization':
      return 'Demonstrate reasoning improvement via surgical memorization weight removal'
    case 'cap-spd':
      return 'Deliver component-level weight decomposition analysis'
    case 'cap-reasoning-hood':
      return 'Map chain-of-thought reasoning mechanisms in partner model'
    default:
      return `Demonstrate feasibility of ${match.capability.name} integration`
  }
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export const ProposalPreview: FC<ProposalPreviewProps> = ({ intake, matches, simulation, onSaved }) => {
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const handleSave = useCallback(async (): Promise<void> => {
    setSaveState('saving')
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_name: intake.partnerName,
          intake_data: intake,
          matches,
          simulation,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaveState('saved')
      onSaved?.()
    } catch {
      setSaveState('error')
    }
  }, [intake, matches, simulation, onSaved])

  useEffect(() => {
    if (saveState !== 'saved' && saveState !== 'error') return
    const timer = setTimeout(() => setSaveState('idle'), 2500)
    return () => clearTimeout(timer)
  }, [saveState])

  const highMatches = matches.filter((m) => m.matchLevel === 'high')
  const mediumMatches = matches.filter((m) => m.matchLevel === 'medium')
  const lowMatches = matches.filter((m) => m.matchLevel === 'low')
  const topMatch = highMatches[0] ?? mediumMatches[0]

  return (
    <>
      <Card className="p-8 border-border-default">
        {/* Header */}
        <div className="border-b border-border-subtle pb-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={20} className="text-accent-amber" />
            <h2 className="font-display text-2xl font-semibold text-text-primary">Engagement Proposal</h2>
          </div>
          <p className="text-sm text-text-secondary">Prepared for {intake.partnerName}</p>
          <p className="text-xs font-mono text-text-tertiary mt-1">{formatDate()}</p>
        </div>

        {/* Executive Summary */}
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-wider text-text-secondary font-medium mb-3">Executive Summary</h3>
          <div className="border-l-[3px] border-accent-amber pl-4">
            <p className="text-sm text-text-primary leading-relaxed">
              This proposal outlines a {matches.length}-capability engagement to address {intake.partnerName}&apos;s{' '}
              {intake.painPoints.join(', ').toLowerCase()} challenges in their {intake.deploymentContext.toLowerCase()}{' '}
              {intake.modelFamily} deployment at {intake.scale} scale.
            </p>
            {topMatch && (
              <p className="text-sm text-text-primary leading-relaxed mt-2">
                The primary solution leverages <span className="font-semibold">{topMatch.capability.name}</span>{' '}
                ({topMatch.capability.paper_title}), which has demonstrated{' '}
                <span className="font-mono text-accent-amber">{topMatch.capability.key_results[0] ?? 'significant results'}</span>.
              </p>
            )}
          </div>
        </div>

        {/* Solution Architecture */}
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-wider text-text-secondary font-medium mb-3">Recommended Solution Architecture</h3>
          <div className="space-y-4">
            {highMatches.length > 0 && (
              <div>
                <span className="text-xs font-medium text-accent-green mb-2 block">Primary Solutions</span>
                <div className="space-y-2">
                  {highMatches.map((match, i) => (
                    <div key={match.capability.id} className="flex items-start gap-3 rounded-md bg-base px-3 py-2">
                      <span className="font-mono text-xs text-accent-green mt-0.5">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary">{match.capability.name}</span>
                          <Badge variant="green">{match.capability.readiness}</Badge>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">{match.rationale}</p>
                      </div>
                      <span className="text-xs font-mono text-text-tertiary flex-shrink-0">{match.estimatedTimeline}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {mediumMatches.length > 0 && (
              <div>
                <span className="text-xs font-medium text-accent-amber mb-2 block">Supporting Capabilities</span>
                <div className="space-y-2">
                  {mediumMatches.map((match, i) => (
                    <div key={match.capability.id} className="flex items-start gap-3 rounded-md bg-base px-3 py-2">
                      <span className="font-mono text-xs text-accent-amber mt-0.5">{highMatches.length + i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary">{match.capability.name}</span>
                          <Badge variant="amber">{match.capability.readiness}</Badge>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">{match.rationale}</p>
                      </div>
                      <span className="text-xs font-mono text-text-tertiary flex-shrink-0">{match.estimatedTimeline}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {lowMatches.length > 0 && (
              <div>
                <span className="text-xs font-medium text-text-tertiary mb-2 block">Exploratory Options</span>
                <div className="space-y-2">
                  {lowMatches.map((match, i) => (
                    <div key={match.capability.id} className="flex items-start gap-3 rounded-md bg-base px-3 py-2">
                      <span className="font-mono text-xs text-text-tertiary mt-0.5">{highMatches.length + mediumMatches.length + i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary">{match.capability.name}</span>
                          <Badge variant="gray">{match.capability.readiness}</Badge>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">{match.rationale}</p>
                      </div>
                      <span className="text-xs font-mono text-text-tertiary flex-shrink-0">{match.estimatedTimeline}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expected Outcomes */}
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-wider text-text-secondary font-medium mb-3">Expected Outcomes</h3>
          <div className="space-y-2">
            {simulation.outcomes.map((outcome, i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-base px-3 py-2">
                <span className="text-sm text-text-primary">{outcome.metric}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-accent-amber">{outcome.estimate}</span>
                  <Badge variant={confidenceVariant(outcome.confidence)}>{outcome.confidence}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investment & Timeline */}
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-wider text-text-secondary font-medium mb-3">Investment & Timeline</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md bg-base px-4 py-3">
              <span className="block text-xs text-text-tertiary mb-1">Investment Range</span>
              <span className="font-mono text-lg text-text-primary">
                ${simulation.engagementCost.low.toLocaleString()} &ndash; ${simulation.engagementCost.high.toLocaleString()}
              </span>
            </div>
            <div className="rounded-md bg-base px-4 py-3">
              <span className="block text-xs text-text-tertiary mb-1">Estimated Timeline</span>
              <span className="font-mono text-lg text-text-primary">{simulation.timeline}</span>
            </div>
          </div>
        </div>

        {/* Team Requirements */}
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-wider text-text-secondary font-medium mb-3">Team Requirements</h3>
          <ul className="space-y-1.5">
            {simulation.teamRequirements.map((req, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-amber flex-shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* Success Criteria */}
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-wider text-text-secondary font-medium mb-3">Success Criteria</h3>
          <div className="space-y-2">
            {matches.map((match, i) => (
              <div key={match.capability.id} className="flex items-start gap-3 text-sm">
                <span className="font-mono text-xs text-accent-amber mt-0.5">{i + 1}.</span>
                <div>
                  <span className="text-text-primary font-medium">{match.capability.name}: </span>
                  <span className="text-text-secondary">{getSuccessCriteria(match)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
          {saveState === 'saved' && (
            <span className="flex items-center gap-1.5 text-sm text-[#3D6B35]">
              <Check size={14} /> Saved
            </span>
          )}
          {saveState === 'error' && (
            <span className="text-sm text-[#8A2020]">Failed to save</span>
          )}
          <Button
            variant="primary"
            onClick={() => void handleSave()}
            disabled={saveState === 'saving' || saveState === 'saved'}
          >
            {saveState === 'saving' ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={14} className="animate-spin" /> Saving...
              </span>
            ) : (
              'Save Proposal'
            )}
          </Button>
        </div>
      </Card>
    </>
  )
}
