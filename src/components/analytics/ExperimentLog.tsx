'use client'

import { type FC } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FlaskConical } from 'lucide-react'
import type { WeightChangeRecord } from '@/lib/analytics'

interface ExperimentLogProps {
  changes: WeightChangeRecord[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatWeightChanges(oldWeights: Record<string, number>, newWeights: Record<string, number>): string {
  const changes: string[] = []
  for (const key of Object.keys(newWeights)) {
    const oldVal = oldWeights[key] ?? 0
    const newVal = newWeights[key] ?? 0
    if (Math.abs(newVal - oldVal) >= 0.005) {
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (c) => c.toUpperCase())
        .trim()
      changes.push(`${label}: ${oldVal.toFixed(2)}\u2192${newVal.toFixed(2)}`)
    }
  }
  return changes.length > 0 ? changes.join(', ') : 'No changes'
}

export const ExperimentLog: FC<ExperimentLogProps> = ({ changes }) => {
  if (changes.length === 0) {
    return (
      <Card header="Experiment Log">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FlaskConical className="w-8 h-8 text-text-tertiary mb-3" />
          <p className="text-sm text-text-secondary">
            No weight adjustments recorded yet.
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            Weight changes will appear here as the GTM Lead tunes actionability and ICP scoring.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card header="Experiment Log">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">
                Date
              </th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">
                Type
              </th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">
                Change
              </th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">
                Rationale
              </th>
            </tr>
          </thead>
          <tbody>
            {changes.map((change, i) => (
              <tr key={i} className="border-b border-border-subtle">
                <td className="px-3 py-2.5">
                  <span className="font-mono text-sm text-text-primary">
                    {formatDate(change.date)}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant={change.type === 'actionability' ? 'amber' : 'blue'} size="sm">
                    {change.type === 'actionability' ? 'Actionability' : 'ICP'}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">
                  <span className="font-mono text-xs text-text-primary">
                    {formatWeightChanges(change.oldWeights, change.newWeights)}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-sm text-text-secondary">{change.rationale}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
