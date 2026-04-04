'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Users, Handshake, Globe, TrendingUp, Plus } from 'lucide-react'

import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { MetricCard } from '@/components/ui/MetricCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PartnerTable, type SortConfig } from '@/components/channels/PartnerTable'
import { PartnerDetail } from '@/components/channels/PartnerDetail'
import { PartnerPipeline } from '@/components/channels/PartnerPipeline'
import { NewPartnerModal, type CreatePartnerFormData } from '@/components/channels/NewPartnerModal'
import type { ChannelPartner, Engagement } from '@/types'

interface ChannelMetrics {
  totalPartners: number
  activePartners: number
  totalEstimatedRevenue: number
  totalCertifiedEngineers: number
  totalEngagementsSources: number
  clientPortfolioReach: number
  byStatus: { status: string; count: number }[]
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`
  return `$${value}`
}

function getSortValue(p: ChannelPartner, key: string): string | number {
  switch (key) {
    case 'name': return p.name.toLowerCase()
    case 'type': return p.type
    case 'relationship_status': return p.relationship_status
    case 'client_portfolio_overlap': return p.client_portfolio_overlap
    case 'estimated_annual_revenue': return p.estimated_annual_revenue
    case 'certified_engineers': return p.certified_engineers
    case 'engagements_sourced': return p.engagements_sourced
    default: return p.estimated_annual_revenue
  }
}

export default function ChannelsPage(): React.ReactElement {
  // Data state
  const [partners, setPartners] = useState<ChannelPartner[]>([])
  const [metrics, setMetrics] = useState<ChannelMetrics | null>(null)
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'estimated_annual_revenue', direction: 'desc' })

  // ─── Data Fetching ──────────────────────────────────────────────────

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const [partnersRes, metricsRes, engagementsRes] = await Promise.all([
        fetch('/api/channels'),
        fetch('/api/channels?metrics=true'),
        fetch('/api/engagements'),
      ])

      if (!partnersRes.ok) throw new Error(`Partners: HTTP ${partnersRes.status}`)
      if (!metricsRes.ok) throw new Error(`Metrics: HTTP ${metricsRes.status}`)
      if (!engagementsRes.ok) throw new Error(`Engagements: HTTP ${engagementsRes.status}`)

      const partnersJson = await partnersRes.json() as { data: ChannelPartner[] }
      const metricsJson = await metricsRes.json() as { data: ChannelMetrics }
      const engagementsJson = await engagementsRes.json() as { data: Engagement[] }

      setPartners(partnersJson.data)
      setMetrics(metricsJson.data)
      setEngagements(engagementsJson.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  // ─── Computed Values ────────────────────────────────────────────────

  const sortedPartners = useMemo((): ChannelPartner[] => {
    return [...partners].sort((a, b) => {
      const aVal = getSortValue(a, sortConfig.key)
      const bVal = getSortValue(b, sortConfig.key)
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [partners, sortConfig])

  const selectedPartner = useMemo((): ChannelPartner | null => {
    return partners.find((p) => p.id === selectedPartnerId) ?? null
  }, [partners, selectedPartnerId])

  const partnerEngagements = useMemo((): Engagement[] => {
    if (!selectedPartnerId) return []
    return engagements.filter((e) => e.channel_partner_id === selectedPartnerId)
  }, [engagements, selectedPartnerId])

  // ─── Sort Handler ───────────────────────────────────────────────────

  const handleSort = useCallback((key: string): void => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }))
  }, [])

  // ─── Mutation Handlers ──────────────────────────────────────────────

  const handleCreatePartner = useCallback(async (formData: CreatePartnerFormData): Promise<void> => {
    const primaryContact = formData.primary_contact_name.trim()
      ? {
          name: formData.primary_contact_name.trim(),
          title: formData.primary_contact_title.trim(),
          email: formData.primary_contact_email.trim() || null,
          linkedin_url: null,
          persona: 'executive' as const,
          is_champion: false,
        }
      : null

    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name.trim(),
        type: formData.type,
        relationship_status: formData.relationship_status,
        primary_contact: primaryContact,
        client_portfolio_overlap: formData.client_portfolio_overlap,
        estimated_annual_revenue: formData.estimated_annual_revenue,
        notes: formData.notes.trim() || null,
      }),
    })

    if (!res.ok) {
      const err = await res.json() as { error: string }
      throw new Error(err.error)
    }

    await fetchData()
  }, [fetchData])

  const handleUpdatePartner = useCallback(async (id: string, data: Partial<ChannelPartner>): Promise<void> => {
    const res = await fetch('/api/channels', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    })

    if (!res.ok) {
      const err = await res.json() as { error: string }
      throw new Error(err.error)
    }

    await fetchData()
  }, [fetchData])

  // ─── Loading / Error States ─────────────────────────────────────────

  if (loading) {
    return (
      <>
        <Header title="Channel Partnerships" subtitle="Engine 2 — consulting firm partnerships for scalable growth" />
        <PageContainer>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <div className="animate-pulse space-y-2">
                  <div className="h-7 w-20 bg-[#E8E4D9] rounded" />
                  <div className="h-3 w-28 bg-[#E8E4D9] rounded" />
                </div>
              </Card>
            ))}
          </div>
          <Card>
            <div className="animate-pulse space-y-3 py-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 bg-[#E8E4D9] rounded w-full" />
              ))}
            </div>
          </Card>
        </PageContainer>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header title="Channel Partnerships" subtitle="Engine 2 — consulting firm partnerships for scalable growth" />
        <PageContainer>
          <Card>
            <div className="text-center py-12">
              <p className="text-sm text-[#8A2020] mb-3">{error}</p>
              <Button variant="secondary" onClick={() => { setLoading(true); void fetchData() }}>
                Retry
              </Button>
            </div>
          </Card>
        </PageContainer>
      </>
    )
  }

  return (
    <>
      <Header title="Channel Partnerships" subtitle="Engine 2 — consulting firm partnerships for scalable growth" />
      <PageContainer>
        <div className="space-y-6">
          {/* Top bar with action */}
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-text-tertiary font-medium">
              {partners.length} partner{partners.length !== 1 ? 's' : ''} tracked
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowNewModal(true)}>
              <Plus size={14} className="mr-1.5" />
              New Partner
            </Button>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-4 gap-4">
            <MetricCard
              value={metrics?.totalPartners ?? partners.length}
              label="Total Partners"
              icon={<Users size={18} />}
            />
            <MetricCard
              value={metrics?.activePartners ?? 0}
              label="Active Partnerships"
              icon={<Handshake size={18} />}
            />
            <MetricCard
              value={metrics?.clientPortfolioReach ?? 0}
              label="Portfolio Reach"
              icon={<Globe size={18} />}
            />
            <MetricCard
              value={formatCurrency(metrics?.totalEstimatedRevenue ?? 0)}
              label="Projected Annual Revenue"
              icon={<TrendingUp size={18} />}
              mono
            />
          </div>

          {/* Table + Detail panel */}
          <div className={`grid gap-4 ${selectedPartner ? 'grid-cols-1 pr-[500px]' : 'grid-cols-1'}`}>
            <PartnerTable
              partners={sortedPartners}
              selectedId={selectedPartnerId}
              onSelect={(id) => setSelectedPartnerId(id === selectedPartnerId ? null : id)}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          </div>

          {/* Pipeline funnel */}
          <PartnerPipeline partners={partners} />
        </div>
      </PageContainer>

      {/* Detail slide-over */}
      {selectedPartner && (
        <PartnerDetail
          partner={selectedPartner}
          engagements={partnerEngagements}
          onUpdate={handleUpdatePartner}
          onClose={() => setSelectedPartnerId(null)}
        />
      )}

      {/* New partner modal */}
      <NewPartnerModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={handleCreatePartner}
      />
    </>
  )
}
