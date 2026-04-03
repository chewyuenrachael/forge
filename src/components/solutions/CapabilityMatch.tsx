'use client'

import { type FC, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { IntakeFormData, SolutionMatch } from '@/types'

interface CapabilityMatchProps {
  intake: IntakeFormData
  matches: SolutionMatch[]
  onProceed: () => void
  onBack: () => void
}

const matchLevelVariant = (level: SolutionMatch['matchLevel']): 'green' | 'amber' | 'gray' => {
  switch (level) {
    case 'high': return 'green'
    case 'medium': return 'amber'
    case 'low': return 'gray'
  }
}

const readinessVariant = (readiness: string): 'green' | 'amber' | 'purple' => {
  switch (readiness) {
    case 'production': return 'green'
    case 'demo': return 'amber'
    default: return 'purple'
  }
}

const matchDotColor = (level: SolutionMatch['matchLevel']): string => {
  switch (level) {
    case 'high': return 'bg-accent-green'
    case 'medium': return 'bg-accent-amber'
    case 'low': return 'bg-text-tertiary'
  }
}

const matchBorderColor = (level: SolutionMatch['matchLevel']): string => {
  switch (level) {
    case 'high': return 'border-l-accent-green'
    case 'medium': return 'border-l-accent-amber'
    case 'low': return 'border-l-border-default'
  }
}

export const CapabilityMatch: FC<CapabilityMatchProps> = ({ intake, matches, onProceed, onBack }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const highCount = matches.filter((m) => m.matchLevel === 'high').length
  const mediumCount = matches.filter((m) => m.matchLevel === 'medium').length
  const lowCount = matches.filter((m) => m.matchLevel === 'low').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-semibold text-text-primary">Capability Analysis</h2>
        <p className="text-sm text-text-secondary mt-1">
          {matches.length} capabilities matched for {intake.partnerName}
        </p>
        <div className="flex items-center gap-2 mt-3">
          {highCount > 0 && <Badge variant="green">{highCount} High</Badge>}
          {mediumCount > 0 && <Badge variant="amber">{mediumCount} Medium</Badge>}
          {lowCount > 0 && <Badge variant="gray">{lowCount} Low</Badge>}
        </div>
      </div>

      {/* Match List */}
      {matches.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-text-secondary">No capabilities matched the selected pain points.</p>
          <p className="text-sm text-text-tertiary mt-1">Go back to adjust your requirements.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const isExpanded = expandedId === match.capability.id
            const keyResult = match.capability.key_results[0] ?? ''

            return (
              <Card
                key={match.capability.id}
                className={`p-0 border-l-[3px] ${matchBorderColor(match.matchLevel)}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${matchDotColor(match.matchLevel)}`} />
                        <span className="font-semibold text-text-primary">{match.capability.name}</span>
                        <Badge variant={readinessVariant(match.capability.readiness)}>
                          {match.capability.readiness}
                        </Badge>
                        <Badge variant={matchLevelVariant(match.matchLevel)}>
                          {match.matchLevel} match
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        {match.capability.paper_title} &mdash; {match.capability.authors}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className="text-xs font-mono text-text-secondary">{match.estimatedTimeline}</span>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : match.capability.id)}
                        className="text-text-tertiary hover:text-text-primary transition-colors duration-150"
                        aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Key benchmark */}
                  {keyResult && (
                    <div className="mt-3 rounded-md bg-base px-3 py-2">
                      <span className="font-mono text-xs text-accent-amber">{keyResult}</span>
                    </div>
                  )}

                  {/* Rationale */}
                  <p className="mt-2 text-sm text-text-secondary">{match.rationale}</p>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border-subtle px-4 py-3 bg-base/50">
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-text-tertiary font-medium">Description</span>
                        <p className="text-sm text-text-secondary mt-1">{match.capability.description}</p>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-text-tertiary font-medium">Key Results</span>
                        <ul className="mt-1 space-y-1">
                          {match.capability.key_results.map((result, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                              <span className="h-1 w-1 rounded-full bg-accent-amber mt-1.5 flex-shrink-0" />
                              <span className="font-mono">{result}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {match.capability.partners.length > 0 && (
                        <div>
                          <span className="text-xs uppercase tracking-wider text-text-tertiary font-medium">Partners</span>
                          <p className="text-sm text-text-secondary mt-1">{match.capability.partners.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          &larr; Back to Intake
        </Button>
        <Button variant="primary" onClick={onProceed} disabled={matches.length === 0}>
          Proceed to Simulation &rarr;
        </Button>
      </div>
    </div>
  )
}
