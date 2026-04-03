'use client'

import { type FC } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { SolutionSimulation as SolutionSimulationType } from '@/types'

interface SolutionSimulationProps {
  simulation: SolutionSimulationType
}

const confidenceVariant = (confidence: string): 'green' | 'amber' | 'gray' => {
  switch (confidence) {
    case 'high': return 'green'
    case 'medium': return 'amber'
    default: return 'gray'
  }
}

export const SolutionSimulationView: FC<SolutionSimulationProps> = ({ simulation }) => {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-text-primary">Projected Outcomes</h2>

      {/* Outcomes Table */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-default">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">Metric</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">Estimate</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">Confidence</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">Basis</th>
            </tr>
          </thead>
          <tbody>
            {simulation.outcomes.map((outcome, i) => (
              <tr key={i} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-3 text-sm text-text-primary font-medium">{outcome.metric}</td>
                <td className="px-4 py-3 text-sm font-mono text-accent-amber">{outcome.estimate}</td>
                <td className="px-4 py-3">
                  <Badge variant={confidenceVariant(outcome.confidence)}>{outcome.confidence}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-text-secondary max-w-xs">{outcome.basis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="block text-xs uppercase tracking-wider text-text-secondary font-medium mb-1">Investment Range</span>
          <span className="font-mono text-lg text-text-primary">
            ${simulation.engagementCost.low.toLocaleString()} &ndash; ${simulation.engagementCost.high.toLocaleString()}
          </span>
        </Card>
        <Card className="p-4">
          <span className="block text-xs uppercase tracking-wider text-text-secondary font-medium mb-1">Timeline</span>
          <span className="font-mono text-lg text-text-primary">{simulation.timeline}</span>
        </Card>
        <Card className="p-4">
          <span className="block text-xs uppercase tracking-wider text-text-secondary font-medium mb-1">Team Requirements</span>
          <span className="font-mono text-lg text-text-primary">{simulation.teamRequirements.length} roles</span>
        </Card>
      </div>

      {/* Team Requirements List */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Required Team Composition</h3>
        <ul className="space-y-2">
          {simulation.teamRequirements.map((req, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-amber flex-shrink-0" />
              {req}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
