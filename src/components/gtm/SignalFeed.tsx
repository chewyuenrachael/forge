'use client'

import { type FC, useState, useMemo } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Send } from 'lucide-react'
import type { Signal } from '@/types'

interface SignalFeedProps {
  signals: Signal[]
  onSelectSignal: (signal: Signal) => void
  onDraftOutreach: (signal: Signal) => void
  selectedSignalId?: string
}

const TYPE_BADGE_VARIANT: Record<Signal['type'], 'amber' | 'blue' | 'green' | 'red' | 'purple'> = {
  regulatory: 'red',
  competitor: 'amber',
  prospect: 'blue',
  conference: 'purple',
  research: 'green',
}

const CAPABILITY_NAMES: Record<string, string> = {
  'cap-rlfr': 'RLFR',
  'cap-reasoning-theater': 'Reasoning Theater',
  'cap-alzheimers': 'Alzheimer\'s',
  'cap-rakuten-pii': 'Rakuten PII',
  'cap-model-diff': 'Model Diff',
  'cap-memorization': 'Memorization',
  'cap-spd': 'SPD',
  'cap-evo2-tree': 'Evo 2',
  'cap-interpreting-evo2': 'Interpreting Evo 2',
  'cap-reasoning-hood': 'Reasoning Hood',
}

const SORT_TABS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'date', label: 'Date' },
  { id: 'type', label: 'Type' },
]

export const SignalFeed: FC<SignalFeedProps> = ({ signals, onSelectSignal, onDraftOutreach, selectedSignalId }) => {
  const [sortBy, setSortBy] = useState('relevance')

  const sortedSignals = useMemo(() => {
    const copy = [...signals]
    if (sortBy === 'relevance') {
      copy.sort((a, b) => b.relevance_score - a.relevance_score)
    } else if (sortBy === 'date') {
      copy.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } else if (sortBy === 'type') {
      copy.sort((a, b) => a.type.localeCompare(b.type))
    }
    return copy
  }, [signals, sortBy])

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-text-primary mb-3">Signal Feed</h2>
        <Tabs tabs={SORT_TABS} activeTab={sortBy} onTabChange={setSortBy} />
      </div>
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {sortedSignals.map((signal) => {
          const isSelected = signal.id === selectedSignalId
          return (
            <button
              key={signal.id}
              type="button"
              onClick={() => onSelectSignal(signal)}
              className={`w-full text-left rounded-lg border p-4 transition-colors duration-150 ${
                isSelected
                  ? 'border-l-[3px] border-accent-amber bg-elevated'
                  : 'border-border-subtle bg-surface hover:bg-elevated'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={TYPE_BADGE_VARIANT[signal.type]}>{signal.type}</Badge>
                  <span className="text-sm font-medium text-text-primary">{signal.title}</span>
                </div>
                <span className="font-mono text-sm font-semibold text-accent-amber ml-2 shrink-0">
                  {signal.relevance_score}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs text-text-tertiary">{signal.date}</span>
                <span className="text-xs text-text-tertiary">{signal.source}</span>
              </div>
              <p className="text-sm text-text-secondary mb-3 line-clamp-2">{signal.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {signal.matched_capability_ids.map((capId) => (
                    <Badge key={capId} variant="gray">{CAPABILITY_NAMES[capId] ?? capId}</Badge>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  className="shrink-0 ml-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDraftOutreach(signal)
                  }}
                >
                  <span className="flex items-center gap-1">
                    <Send className="h-3 w-3" />
                    Draft Outreach
                  </span>
                </Button>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
