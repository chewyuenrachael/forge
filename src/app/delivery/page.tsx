'use client'

import { useState, useEffect } from 'react'
import { Activity, Heart, BookOpen, CheckCircle, Clock, AlertCircle } from 'lucide-react'

import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

import type { Engagement, Milestone, AsyncState } from '@/types'

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

interface DeliveryData {
  engagements: Engagement[]
  stats: {
    total: number
    production: number
    demo: number
    research: number
    partnerCount: number
  }
}

function statusVariant(status: Engagement['status']): BadgeVariant {
  switch (status) {
    case 'active': return 'green'
    case 'completed': return 'blue'
    case 'proposed': return 'amber'
  }
}

function healthColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function healthBarColor(score: number): string {
  if (score >= 80) return 'bg-green-400'
  if (score >= 50) return 'bg-amber-400'
  return 'bg-red-400'
}

function milestoneIcon(status: Milestone['status']): React.ReactNode {
  switch (status) {
    case 'completed': return <CheckCircle size={14} className="text-green-400" />
    case 'in_progress': return <Clock size={14} className="text-amber-400" />
    case 'upcoming': return <AlertCircle size={14} className="text-text-tertiary" />
  }
}

function milestoneVariant(status: Milestone['status']): BadgeVariant {
  switch (status) {
    case 'completed': return 'green'
    case 'in_progress': return 'amber'
    case 'upcoming': return 'gray'
  }
}

const DeliveryPage = (): React.ReactElement => {
  const [data, setData] = useState<AsyncState<DeliveryData>>({ status: 'idle' })
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setData({ status: 'loading' })
    fetch('/api/knowledge')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<DeliveryData>
      })
      .then((result) => setData({ status: 'success', data: result }))
      .catch((err: Error) => setData({ status: 'error', error: err.message }))
  }, [])

  if (data.status === 'loading' || data.status === 'idle') {
    return (
      <>
        <Header title="Research Delivery Hub" subtitle="Engagement tracking and partner communication" />
        <PageContainer>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-elevated animate-pulse" />
              ))}
            </div>
            <div className="h-96 rounded-lg bg-elevated animate-pulse" />
          </div>
        </PageContainer>
      </>
    )
  }

  if (data.status === 'error') {
    return (
      <>
        <Header title="Research Delivery Hub" subtitle="Engagement tracking and partner communication" />
        <PageContainer>
          <Card>
            <div className="text-center py-8">
              <p className="text-accent-red text-sm font-medium">Failed to load delivery data</p>
              <p className="text-text-secondary text-xs mt-1">{data.error}</p>
            </div>
          </Card>
        </PageContainer>
      </>
    )
  }

  const { engagements, stats } = data.data
  const activeEngagements = engagements.filter((e) => e.status === 'active')
  const avgHealth = engagements.length > 0
    ? Math.round(engagements.reduce((sum, e) => sum + e.health_score, 0) / engagements.length)
    : 0

  return (
    <>
      <Header title="Research Delivery Hub" subtitle="Engagement tracking and partner communication" />
      <PageContainer>
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              value={activeEngagements.length}
              label="Active Engagements"
              icon={<Activity size={18} />}
            />
            <MetricCard
              value={avgHealth}
              label="Average Health Score"
              icon={<Heart size={18} />}
              mono
            />
            <MetricCard
              value={stats.total}
              label="Knowledge Entries"
              icon={<BookOpen size={18} />}
              trend={{ direction: 'up', value: `${stats.production} production` }}
            />
          </div>

          {/* Engagements Table */}
          <Card header="Partner Engagements" noPadding>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Partner</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Status</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Capabilities</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-right">Health</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {engagements.map((engagement) => {
                    const isExpanded = expandedId === engagement.id
                    const completedMilestones = engagement.milestones.filter((m) => m.status === 'completed').length
                    const totalMilestones = engagement.milestones.length
                    const progressPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

                    return (
                      <tr key={engagement.id} className="group">
                        <td colSpan={5} className="p-0">
                          <button
                            type="button"
                            className="w-full text-left border-b border-border-subtle hover:bg-elevated transition-colors duration-150 cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : engagement.id)}
                          >
                            <div className="flex items-center">
                              <div className="px-4 py-3 flex-1">
                                <span className="text-sm font-medium text-text-primary">{engagement.partner_name}</span>
                              </div>
                              <div className="px-4 py-3">
                                <Badge variant={statusVariant(engagement.status)}>{engagement.status}</Badge>
                              </div>
                              <div className="px-4 py-3 flex gap-1 flex-wrap">
                                {engagement.capabilities_applied.map((capId) => (
                                  <Badge key={capId} variant="purple" size="sm">{capId.replace('cap-', '')}</Badge>
                                ))}
                              </div>
                              <div className={`px-4 py-3 text-right font-mono text-sm ${healthColor(engagement.health_score)}`}>
                                {engagement.health_score}
                              </div>
                              <div className="px-4 py-3 w-48">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full bg-elevated overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-300 ${healthBarColor(engagement.health_score)}`}
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-mono text-text-secondary">
                                    {completedMilestones}/{totalMilestones}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* Expanded milestone detail */}
                          {isExpanded && (
                            <div className="bg-base/50 border-b border-border-subtle px-8 py-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-xs uppercase tracking-wider text-text-tertiary font-medium">
                                    Milestones
                                  </span>
                                  <span className="text-xs font-mono text-text-secondary">
                                    Started {engagement.start_date}
                                  </span>
                                </div>
                                {engagement.milestones.map((milestone) => (
                                  <div key={milestone.id} className="flex items-center gap-3 py-1">
                                    {milestoneIcon(milestone.status)}
                                    <span className="text-sm text-text-primary flex-1">{milestone.title}</span>
                                    <Badge variant={milestoneVariant(milestone.status)} size="sm">
                                      {milestone.status.replace('_', ' ')}
                                    </Badge>
                                    <span className="font-mono text-xs text-text-secondary">{milestone.due_date}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  )
}

export default DeliveryPage
