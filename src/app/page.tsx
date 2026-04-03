'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts'

import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

import { EU_AI_ACT_DEADLINE } from '@/lib/constants'
import type { Capability, AsyncState } from '@/types'

interface DashboardData {
  data: Capability[]
  stats: {
    total: number
    production: number
    demo: number
    research: number
    partnerCount: number
  }
  timeline: Capability[]
}

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

function getReadinessBadge(readiness: Capability['readiness']): { label: string; variant: BadgeVariant } {
  const map: Record<Capability['readiness'], { label: string; variant: BadgeVariant }> = {
    production: { label: 'Production', variant: 'green' },
    demo: { label: 'Demo', variant: 'amber' },
    research: { label: 'Research', variant: 'gray' },
  }
  return map[readiness]
}

function getTypeBadge(type: Capability['type']): { label: string; variant: BadgeVariant } {
  return type === 'applied'
    ? { label: 'Applied', variant: 'blue' }
    : { label: 'Fundamental', variant: 'purple' }
}

function computeDaysUntil(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

const CHART_COLORS: Record<string, string> = {
  Production: '#3D6B35',
  Demo: '#8A6B20',
  Research: '#5A3D80',
}

const OverviewPage = (): React.ReactElement => {
  const [dashboard, setDashboard] = useState<AsyncState<DashboardData>>({ status: 'idle' })

  useEffect(() => {
    setDashboard({ status: 'loading' })
    fetch('/api/knowledge')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<DashboardData>
      })
      .then((data) => setDashboard({ status: 'success', data }))
      .catch((err: Error) => setDashboard({ status: 'error', error: err.message }))
  }, [])

  if (dashboard.status === 'loading' || dashboard.status === 'idle') {
    return (
      <>
        <Header title="Overview" subtitle="Goodfire Commercial Intelligence" />
        <PageContainer>
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-elevated animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-3 h-96 rounded-lg bg-elevated animate-pulse" />
              <div className="col-span-2 h-96 rounded-lg bg-elevated animate-pulse" />
            </div>
            <div className="h-64 rounded-lg bg-elevated animate-pulse" />
          </div>
        </PageContainer>
      </>
    )
  }

  if (dashboard.status === 'error') {
    return (
      <>
        <Header title="Overview" subtitle="Goodfire Commercial Intelligence" />
        <PageContainer>
          <Card>
            <div className="text-center py-8">
              <p className="text-accent-red text-sm font-medium">Failed to load dashboard data</p>
              <p className="text-text-secondary text-xs mt-1">{dashboard.error}</p>
            </div>
          </Card>
        </PageContainer>
      </>
    )
  }

  const { data, stats, timeline } = dashboard.data
  const daysUntil = computeDaysUntil(EU_AI_ACT_DEADLINE)

  const uniquePartners = Array.from(
    new Set(data.flatMap((c) => c.partners).filter(Boolean))
  )

  const chartData = [
    { name: 'Production', count: stats.production },
    { name: 'Demo', count: stats.demo },
    { name: 'Research', count: stats.research },
  ]

  const latestResearch = timeline.slice(0, 3)

  return (
    <>
      <Header title="Overview" subtitle="Goodfire Commercial Intelligence" />
      <PageContainer>
        <div className="space-y-6">
          {/* Section 1: Metric Cards */}
          <div className="grid grid-cols-4 gap-4">
            <MetricCard
              value={stats.total}
              label="Research Capabilities"
              trend={{ direction: 'neutral', value: `${stats.production} production \u00b7 ${stats.demo} demo \u00b7 ${stats.research} research` }}
            />
            <div>
              <MetricCard
                value={stats.partnerCount}
                label="Partner Ecosystem"
              />
              {uniquePartners.length > 0 && (
                <p className="mt-2 text-xs text-text-secondary truncate px-1">
                  {uniquePartners.join(' \u00b7 ')}
                </p>
              )}
            </div>
            <MetricCard
              value={stats.production}
              label="Production Proven"
              trend={{ direction: 'up', value: '+2 in Q1 2026' }}
            />
            <div className="rounded-lg border border-border-subtle bg-surface p-4">
              <div className="font-mono text-2xl font-semibold text-accent-amber tracking-tight">
                {daysUntil}d
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-text-secondary font-medium">
                Days Until High-Risk Provisions
              </div>
            </div>
          </div>

          {/* Section 2: Timeline + Readiness Distribution */}
          <div className="grid grid-cols-5 gap-6">
            {/* Left: Research Timeline */}
            <div className="col-span-3">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Research Timeline</h2>
                <div className="relative ml-2">
                  {timeline.map((cap, idx) => {
                    const tb = getTypeBadge(cap.type)
                    const rb = getReadinessBadge(cap.readiness)
                    const firstResult = cap.key_results[0]
                    return (
                      <div key={cap.id} className="relative pl-6 pb-6">
                        {idx < timeline.length - 1 && (
                          <div className="absolute left-[5px] top-3 bottom-0 w-px border-l-2 border-border-subtle" />
                        )}
                        <div className="absolute left-0 top-[6px] h-3 w-3 rounded-full border-2 border-border-default bg-base" />
                        <div className="space-y-1">
                          <span className="font-mono text-xs text-text-secondary">{cap.date}</span>
                          <p className="text-sm font-medium text-text-primary">{cap.paper_title}</p>
                          <div className="flex gap-2">
                            <Badge variant={tb.variant}>{tb.label}</Badge>
                            <Badge variant={rb.variant}>{rb.label}</Badge>
                          </div>
                          {firstResult && (
                            <p className="text-xs text-text-secondary">{firstResult}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>

            {/* Right: Readiness Distribution */}
            <div className="col-span-2">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Readiness Distribution</h2>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                        width={80}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={CHART_COLORS[entry.name] ?? 'var(--color-text-tertiary)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Latest Research</h3>
                  <div className="space-y-3">
                    {latestResearch.map((cap) => {
                      const rb = getReadinessBadge(cap.readiness)
                      return (
                        <Card key={cap.id}>
                          <p className="text-sm font-medium text-text-primary">{cap.paper_title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs text-text-secondary">{cap.date}</span>
                            <Badge variant={rb.variant}>{rb.label}</Badge>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Section 3: Research → Solution Map */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Research &rarr; Solution Map</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Paper</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Date</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Key Result</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Partner Solution</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Readiness</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((cap) => {
                    const rb = getReadinessBadge(cap.readiness)
                    const firstResult = cap.key_results[0]
                    return (
                      <tr key={cap.id} className="border-b border-border-subtle">
                        <td className="px-4 py-3 text-sm text-text-primary">{cap.paper_title}</td>
                        <td className="px-4 py-3 text-sm font-mono text-text-primary">{cap.date}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{firstResult ?? '\u2014'}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{cap.partner_solution || '\u2014'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={rb.variant}>{rb.label}</Badge>
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

export default OverviewPage
