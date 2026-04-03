'use client'

import { type FC } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Signal } from '@/types'

interface DiscourseMonitorProps {
  signals: Signal[]
  onSelectSignal: (signal: Signal) => void
  selectedSignalId?: string
}

const TYPE_BADGE: Record<string, { label: string; variant: 'amber' | 'blue' | 'purple' | 'green' }> = {
  regulatory: { label: 'Regulatory', variant: 'amber' },
  research: { label: 'Research', variant: 'blue' },
  competitor: { label: 'Competitor', variant: 'purple' },
  conference: { label: 'Conference', variant: 'green' },
  prospect: { label: 'Industry', variant: 'green' },
}

const CAPABILITY_NAMES: Record<string, string> = {
  'cap-rlfr': 'RLFR',
  'cap-reasoning-theater': 'Reasoning Theater',
  'cap-alzheimers': "Alzheimer's Biomarkers",
  'cap-rakuten-pii': 'Rakuten PII',
  'cap-model-diff': 'Model Diff',
  'cap-memorization': 'Memorization',
  'cap-spd': 'SPD',
  'cap-evo2-tree': 'Evo 2 / Tree of Life',
  'cap-interpreting-evo2': 'Interpreting Evo 2',
  'cap-reasoning-hood': 'Reasoning Hood',
}

export const DiscourseMonitor: FC<DiscourseMonitorProps> = ({ signals, onSelectSignal, selectedSignalId }) => {
  return (
    <div className="space-y-1">
      <h2 className="text-xs uppercase tracking-wider text-text-secondary font-medium mb-3">Discourse Feed</h2>
      <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-16rem)] pr-1">
        {signals.map((signal) => {
          const isSelected = signal.id === selectedSignalId
          const badge = TYPE_BADGE[signal.type] ?? { label: signal.type, variant: 'blue' as const }
          return (
            <Card
              key={signal.id}
              className={`cursor-pointer ${isSelected ? 'border-l-[3px] border-l-accent-amber !bg-elevated' : 'hover:bg-elevated'}`}
            >
              <div onClick={() => onSelectSignal(signal)} className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <span className="text-sm font-medium text-text-primary leading-tight">{signal.title}</span>
                </div>
                <div className="font-mono text-xs text-text-tertiary">
                  {signal.source} &middot; {signal.date}
                </div>
                <div className="flex flex-wrap gap-1">
                  {signal.matched_capability_ids.map((capId) => (
                    <Badge key={capId} variant="gray">{CAPABILITY_NAMES[capId] ?? capId}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-accent-amber">Relevance: {signal.relevance_score}</span>
                </div>
                <p className="text-xs text-text-secondary italic leading-relaxed">{signal.narrative_angle}</p>
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" className="text-xs h-7 px-2" onClick={(e) => { e.stopPropagation(); onSelectSignal(signal) }}>
                    Frame for Audiences
                  </Button>
                  <Button variant="ghost" className="text-xs h-7 px-2" onClick={(e) => { e.stopPropagation(); onSelectSignal(signal) }}>
                    Draft Content
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
