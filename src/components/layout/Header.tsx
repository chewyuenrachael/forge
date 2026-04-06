'use client'

import { type FC, useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/Badge'
import { EU_AI_ACT_DEADLINE } from '@/lib/constants'
import type { SystemHealth } from '@/lib/feedback'

interface HeaderProps {
  title: string
  subtitle?: string
}

function daysUntilEUAIAct(): number {
  const deadline = new Date(EU_AI_ACT_DEADLINE)
  const now = new Date()
  const diffMs = deadline.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

const HEALTH_POLL_MS = 300_000 // 5 minutes

function healthDotColor(status: SystemHealth['overallStatus']): string {
  if (status === 'healthy') return 'bg-[#3D6B35]'
  if (status === 'degraded') return 'bg-[#8A6B20]'
  return 'bg-[#8A2020]'
}

function healthDetails(health: SystemHealth): string {
  const details: string[] = []
  if (health.dataFreshness.status === 'stale') {
    details.push(`Signal data stale (${health.dataFreshness.daysSinceLastSignal} days old)`)
  } else if (health.dataFreshness.status === 'critical') {
    details.push(`Signal data critical (${health.dataFreshness.daysSinceLastSignal} days old)`)
  }
  if (health.predictionSampleSize.status === 'low') {
    details.push(`Low prediction sample (${health.predictionSampleSize.count} tested)`)
  } else if (health.predictionSampleSize.status === 'insufficient') {
    details.push(`Insufficient predictions (${health.predictionSampleSize.count} tested)`)
  }
  if (health.feedbackCoverage.status === 'low') {
    details.push(`Feedback coverage low (${health.feedbackCoverage.pct}%)`)
  } else if (health.feedbackCoverage.status === 'critical') {
    details.push(`Feedback coverage critical (${health.feedbackCoverage.pct}%)`)
  }
  return details.join(' · ')
}

export const Header: FC<HeaderProps> = ({ title, subtitle }) => {
  const daysLeft = daysUntilEUAIAct()
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const fetchHealth = (): void => {
      fetch('/api/feedback?health=true')
        .then((r) => r.ok ? r.json() as Promise<{ data: SystemHealth }> : null)
        .then((result) => { if (result) setHealth(result.data) })
        .catch(() => { /* non-critical */ })
    }

    fetchHealth()
    intervalRef.current = setInterval(fetchHealth, HEALTH_POLL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const tooltip = health ? healthDetails(health) : ''

  return (
    <header className="sticky top-0 z-10 h-14 flex items-center justify-between border-b border-border-subtle bg-base/90 backdrop-blur-sm px-10">
      <div className="flex items-baseline gap-3">
        <h1 className="font-display text-lg font-semibold text-text-primary">{title}</h1>
        {subtitle && <span className="text-sm text-text-secondary">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-3">
        {health && (
          <span
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary"
            title={tooltip}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${healthDotColor(health.overallStatus)} flex-shrink-0`} />
            {health.overallStatus === 'healthy' && 'Systems OK'}
            {health.overallStatus === 'degraded' && (
              <span className="text-[#8A6B20]">Degraded</span>
            )}
            {health.overallStatus === 'critical' && (
              <span className="text-[#8A2020]">Action needed</span>
            )}
          </span>
        )}
        <Badge variant="amber" size="sm">
          <span className="font-mono">{daysLeft}</span>d to EU AI Act
        </Badge>
      </div>
    </header>
  )
}
