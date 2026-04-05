'use client'

import { type FC, useState, useMemo, useCallback } from 'react'
import { Clock, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Signal } from '@/types'

interface SignalDecayStatusProps {
  signals: Signal[]
  onTriggerDecay: () => Promise<void>
}

const DECAY_RULES = [
  { threshold: '3+ days old', reduction: 'urgency reduced by 10' },
  { threshold: '7+ days old', reduction: 'urgency reduced by additional 15' },
  { threshold: '14+ days old', reduction: 'urgency reduced by additional 20' },
] as const

export const SignalDecayStatus: FC<SignalDecayStatusProps> = ({ signals, onTriggerDecay }) => {
  const [isRunning, setIsRunning] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [lastRunTime, setLastRunTime] = useState<string | null>(null)

  const activeSignals = useMemo(
    () => signals.filter((s) => s.status === 'active'),
    [signals]
  )

  const oldestActiveDays = useMemo((): number => {
    if (activeSignals.length === 0) return 0
    const now = Date.now()
    let oldest = 0
    for (const signal of activeSignals) {
      const ageDays = Math.floor((now - new Date(signal.date).getTime()) / 86_400_000)
      if (ageDays > oldest) oldest = ageDays
    }
    return oldest
  }, [activeSignals])

  const decayedThisWeek = useMemo((): number => {
    const now = Date.now()
    return activeSignals.filter((s) => {
      const ageDays = (now - new Date(s.date).getTime()) / 86_400_000
      return ageDays > 3
    }).length
  }, [activeSignals])

  const handleRunDecay = useCallback(async (): Promise<void> => {
    setIsRunning(true)
    setLastResult(null)
    try {
      await onTriggerDecay()
      setLastRunTime(new Date().toLocaleTimeString())
      setLastResult(`Decay applied. Actionability scores recalculated.`)
    } catch {
      setLastResult('Decay failed. Please try again.')
    } finally {
      setIsRunning(false)
    }
  }, [onTriggerDecay])

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-text-secondary" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            Signal Freshness
          </h3>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-lg font-mono font-semibold text-text-primary">
              {activeSignals.length}
            </div>
            <div className="text-xs text-text-secondary">Active signals</div>
          </div>
          <div>
            <div className="text-lg font-mono font-semibold text-text-primary">
              {oldestActiveDays}d
            </div>
            <div className="text-xs text-text-secondary">Oldest active</div>
          </div>
          <div>
            <div className="text-lg font-mono font-semibold text-text-primary">
              {decayedThisWeek}
            </div>
            <div className="text-xs text-text-secondary">Eligible for decay</div>
          </div>
        </div>

        {/* Decay schedule */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-text-secondary">Urgency decay schedule:</span>
          <ul className="space-y-1">
            {DECAY_RULES.map((rule) => (
              <li key={rule.threshold} className="flex items-center gap-2 text-xs text-text-secondary">
                <span className="w-1 h-1 rounded-full bg-text-tertiary flex-shrink-0" />
                <span className="font-mono">{rule.threshold}:</span>
                <span>{rule.reduction}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action */}
        <div className="flex items-center gap-3 pt-1 border-t border-[#E8E4D9]">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleRunDecay()}
            disabled={isRunning}
          >
            <RefreshCw size={13} className={`mr-1.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Run Decay Now'}
          </Button>
          <span className="text-xs text-text-tertiary">
            Last run: {lastRunTime ?? 'Never'}
          </span>
        </div>

        {/* Result message */}
        {lastResult && (
          <p className={`text-xs font-medium ${lastResult.includes('failed') ? 'text-[#8A2020]' : 'text-[#3D6B35]'}`}>
            {lastResult}
          </p>
        )}
      </div>
    </Card>
  )
}
