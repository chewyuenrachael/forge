'use client'

import { type FC, useState, useCallback } from 'react'
import { AlertTriangle, AlertOctagon, CheckCircle, ChevronDown, ChevronRight, Copy, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { HealthAlert } from '@/lib/health-alerts'

interface HealthAlertsProps {
  alerts: HealthAlert[]
  onAcknowledge: (alertId: string) => void
  onDraftAction: (alert: HealthAlert) => void
}

function severityIcon(severity: 'warning' | 'critical'): React.ReactElement {
  if (severity === 'critical') {
    return <AlertOctagon className="w-4 h-4 text-[#8A2020] flex-shrink-0" />
  }
  return <AlertTriangle className="w-4 h-4 text-[#8A6B20] flex-shrink-0" />
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const HealthAlerts: FC<HealthAlertsProps> = ({ alerts, onAcknowledge, onDraftAction }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const activeAlerts = alerts.filter((a) => !a.acknowledged)
  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length
  const warningCount = activeAlerts.filter((a) => a.severity === 'warning').length

  const toggleExpand = useCallback((alertId: string): void => {
    setExpandedId((prev) => (prev === alertId ? null : alertId))
  }, [])

  const handleCopy = useCallback(async (alert: HealthAlert): Promise<void> => {
    if (!alert.draft_message) return
    try {
      await navigator.clipboard.writeText(alert.draft_message)
      setCopiedId(alert.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Clipboard API may not be available in all contexts
    }
  }, [])

  const headerBadge = activeAlerts.length === 0
    ? <Badge variant="green" size="sm">0 Alerts</Badge>
    : criticalCount > 0
      ? <Badge variant="red" size="sm">{activeAlerts.length} Active Alert{activeAlerts.length !== 1 ? 's' : ''}</Badge>
      : <Badge variant="amber" size="sm">{warningCount} Warning{warningCount !== 1 ? 's' : ''}</Badge>

  const header = (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-text-primary">Partner Health Alerts</h3>
      <div className="flex items-center gap-2">
        {criticalCount > 0 && <Badge variant="red" size="sm">{criticalCount} critical</Badge>}
        {warningCount > 0 && <Badge variant="amber" size="sm">{warningCount} warning</Badge>}
        {headerBadge}
      </div>
    </div>
  )

  if (activeAlerts.length === 0) {
    return (
      <Card header={header}>
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-text-secondary">
          <CheckCircle className="w-5 h-5 text-[#3D6B35]" />
          <span>All engagements healthy. No alerts.</span>
        </div>
      </Card>
    )
  }

  return (
    <Card header={header} noPadding>
      <div className="divide-y divide-border-subtle">
        {activeAlerts.map((alert) => (
          <div key={alert.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{severityIcon(alert.severity)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-text-primary">{alert.title}</h4>
                  <span className="font-mono text-[10px] text-text-tertiary whitespace-nowrap">
                    {formatTimestamp(alert.created_at)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-1">{alert.description}</p>
                <p className="text-sm text-text-primary mt-2">
                  <span className="font-medium">Action: </span>
                  {alert.suggested_action}
                </p>

                {/* Draft message toggle */}
                <div className="mt-3 flex items-center gap-2">
                  {alert.draft_message && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(alert.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#C45A3C] hover:text-[#A8482F] transition-colors"
                    >
                      {expandedId === alert.id ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      View Draft
                    </button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onAcknowledge(alert.id)}>
                    <X className="w-3 h-3 mr-1" />
                    Acknowledge
                  </Button>
                </div>

                {/* Expanded draft message */}
                {expandedId === alert.id && alert.draft_message && (
                  <div className="mt-3 rounded-md border border-border-subtle bg-[#F5F3EE] p-3">
                    <div className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                      Draft Check-in Message
                    </div>
                    <pre className="text-sm text-text-primary whitespace-pre-wrap font-sans leading-relaxed">
                      {alert.draft_message}
                    </pre>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { void handleCopy(alert) }}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        {copiedId === alert.id ? 'Copied' : 'Copy'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDraftAction(alert)}
                      >
                        Open as Action
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
