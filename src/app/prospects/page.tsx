'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Users, TrendingUp, Target, Layers, Plus, Download } from 'lucide-react'

import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { MetricCard } from '@/components/ui/MetricCard'
import { Button } from '@/components/ui/Button'
import { ProspectTable, type SortConfig } from '@/components/prospects/ProspectTable'
import { ProspectDetail } from '@/components/prospects/ProspectDetail'
import { ProspectFilters, type ProspectFilterState, DEFAULT_FILTERS } from '@/components/prospects/ProspectFilters'
import { PeerClusterView } from '@/components/prospects/PeerClusterView'
import { NewProspectModal, type CreateProspectFormData } from '@/components/prospects/NewProspectModal'
import { OutreachBurst } from '@/components/prospects/OutreachBurst'

import type { Prospect, ICPScore, PeerCluster, ModelFamily } from '@/types'

type ProspectWithScore = Prospect & { icpScore: ICPScore }
type ViewMode = 'table' | 'clusters'

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`
  return `$${value}`
}

function getSortValue(p: ProspectWithScore, key: string): string | number {
  switch (key) {
    case 'icpScore': return p.icpScore.composite
    case 'name': return p.name.toLowerCase()
    case 'customer_category': return p.customer_category
    case 'pipeline_stage': return p.pipeline_stage
    case 'pipeline_value': return p.pipeline_value
    case 'estimated_ai_spend': return p.estimated_ai_spend
    case 'revenue_engine': return p.revenue_engine
    default: return p.icpScore.composite
  }
}

const ProspectsPage = (): React.ReactElement => {
  // Data state
  const [allProspects, setAllProspects] = useState<ProspectWithScore[]>([])
  const [clusters, setClusters] = useState<PeerCluster[]>([])
  const [modelFamilies, setModelFamilies] = useState<ModelFamily[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [outreachBurstClusterId, setOutreachBurstClusterId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [filters, setFilters] = useState<ProspectFilterState>(DEFAULT_FILTERS)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'icpScore', direction: 'desc' })

  // ─── Data Fetching ──────────────────────────────────────────────────

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const [prospectsRes, clustersRes, mfRes] = await Promise.all([
        fetch('/api/prospects'),
        fetch('/api/prospects?clusters=true'),
        fetch('/api/model-families'),
      ])

      if (!prospectsRes.ok) throw new Error(`Prospects: HTTP ${prospectsRes.status}`)
      if (!clustersRes.ok) throw new Error(`Clusters: HTTP ${clustersRes.status}`)
      if (!mfRes.ok) throw new Error(`Model Families: HTTP ${mfRes.status}`)

      const prospectsJson = await prospectsRes.json() as { data: ProspectWithScore[] }
      const clustersJson = await clustersRes.json() as { data: PeerCluster[] }
      const mfJson = await mfRes.json() as { data: ModelFamily[] }

      setAllProspects(prospectsJson.data)
      setClusters(clustersJson.data)
      setModelFamilies(mfJson.data)
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

  const filteredProspects = useMemo((): ProspectWithScore[] => {
    return allProspects.filter((p) => {
      if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.customerCategory && p.customer_category !== filters.customerCategory) return false
      if (filters.pipelineStage && p.pipeline_stage !== filters.pipelineStage) return false
      if (filters.revenueEngine && p.revenue_engine !== filters.revenueEngine) return false
      if (filters.minIcpScore > 0 && p.icpScore.composite < filters.minIcpScore) return false
      return true
    })
  }, [allProspects, filters])

  const sortedProspects = useMemo((): ProspectWithScore[] => {
    const sorted = [...filteredProspects].sort((a, b) => {
      const aVal = getSortValue(a, sortConfig.key)
      const bVal = getSortValue(b, sortConfig.key)
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredProspects, sortConfig])

  const selectedProspect = useMemo((): ProspectWithScore | null => {
    return allProspects.find((p) => p.id === selectedProspectId) ?? null
  }, [allProspects, selectedProspectId])

  const outreachBurstCluster = useMemo((): PeerCluster | null => {
    return clusters.find((c) => c.id === outreachBurstClusterId) ?? null
  }, [clusters, outreachBurstClusterId])

  const outreachBurstProspects = useMemo((): ProspectWithScore[] => {
    if (!outreachBurstClusterId) return []
    return allProspects.filter((p) => p.peer_cluster_id === outreachBurstClusterId)
  }, [allProspects, outreachBurstClusterId])

  // Metrics
  const totalPipelineValue = useMemo(
    () => allProspects.reduce((sum, p) => sum + p.pipeline_value, 0),
    [allProspects]
  )
  const weightedPipeline = useMemo(
    () => allProspects.reduce((sum, p) => sum + p.pipeline_value * (p.icpScore.composite / 100), 0),
    [allProspects]
  )
  const topProspect = useMemo(
    () => allProspects.length > 0 ? allProspects.reduce((top, p) => p.icpScore.composite > top.icpScore.composite ? p : top) : null,
    [allProspects]
  )
  const activeClusters = useMemo(
    () => clusters.filter((c) => {
      const clusterProspects = allProspects.filter((p) => p.peer_cluster_id === c.id)
      return clusterProspects.length >= 2
    }).length,
    [clusters, allProspects]
  )

  // ─── Mutation Handlers ──────────────────────────────────────────────

  const handleUpdateProspect = useCallback(async (id: string, data: Record<string, unknown>): Promise<void> => {
    const res = await fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json() as { error: string }
      throw new Error(err.error)
    }
    const json = await res.json() as { data: ProspectWithScore }
    setAllProspects((prev) => prev.map((p) => p.id === id ? json.data : p))
  }, [])

  const handleDeleteProspect = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/prospects/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json() as { error: string }
      throw new Error(err.error)
    }
    setAllProspects((prev) => prev.filter((p) => p.id !== id))
    if (selectedProspectId === id) setSelectedProspectId(null)
  }, [selectedProspectId])

  const handleCreateProspect = useCallback(async (formData: CreateProspectFormData): Promise<void> => {
    const res = await fetch('/api/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (!res.ok) {
      const err = await res.json() as { error: string }
      throw new Error(err.error)
    }
    await fetchData()
  }, [fetchData])

  const handleSort = useCallback((key: string): void => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }))
  }, [])

  const handleExportCsv = useCallback((): void => {
    window.open('/api/export?entity=prospects&format=csv', '_blank')
  }, [])

  // ─── Loading / Error ────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <Header title="Prospect Intelligence" subtitle="ICP scoring, peer clusters, targeted outreach" />
        <PageContainer>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-md bg-surface border border-border-subtle animate-pulse" />
            ))}
          </div>
          <div className="h-96 rounded-md bg-surface border border-border-subtle animate-pulse" />
        </PageContainer>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header title="Prospect Intelligence" subtitle="ICP scoring, peer clusters, targeted outreach" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-[#8A2020] mb-2">Failed to load prospects</p>
            <p className="text-xs text-text-tertiary mb-4">{error}</p>
            <Button variant="secondary" onClick={() => { setLoading(true); void fetchData() }}>Retry</Button>
          </div>
        </PageContainer>
      </>
    )
  }

  return (
    <>
      <Header title="Prospect Intelligence" subtitle="ICP scoring, peer clusters, targeted outreach" />
      <PageContainer>
        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <MetricCard
            value={allProspects.length}
            label="Total Prospects"
            icon={<Users size={18} />}
          />
          <MetricCard
            value={formatCurrency(weightedPipeline)}
            label="Weighted Pipeline"
            mono
            icon={<TrendingUp size={18} />}
            trend={totalPipelineValue > 0 ? { value: formatCurrency(totalPipelineValue) + ' total', direction: 'neutral' } : undefined}
          />
          <MetricCard
            value={topProspect ? topProspect.icpScore.composite : '—'}
            label="Top ICP Score"
            mono
            icon={<Target size={18} />}
            trend={topProspect ? { value: topProspect.name, direction: 'up', positive: true } : undefined}
          />
          <MetricCard
            value={activeClusters}
            label="Active Clusters"
            icon={<Layers size={18} />}
            trend={{ value: `${clusters.length} total`, direction: 'neutral' }}
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-[#F0EDE6] rounded-md p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                viewMode === 'table' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('clusters')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                viewMode === 'clusters' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Clusters
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportCsv}>
              <Download size={14} className="mr-1.5" />
              Export CSV
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowNewModal(true)}>
              <Plus size={14} className="mr-1.5" />
              New Prospect
            </Button>
          </div>
        </div>

        {/* View Content */}
        {viewMode === 'table' && (
          <>
            <div className="mb-3">
              <ProspectFilters
                filters={filters}
                onFilterChange={setFilters}
                resultCount={sortedProspects.length}
              />
            </div>
            <ProspectTable
              prospects={sortedProspects}
              selectedId={selectedProspectId}
              onSelect={setSelectedProspectId}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          </>
        )}

        {viewMode === 'clusters' && (
          <PeerClusterView
            clusters={clusters}
            prospects={allProspects}
            onSelectProspect={(id) => {
              setSelectedProspectId(id)
              setViewMode('table')
            }}
            onStartOutreachBurst={setOutreachBurstClusterId}
          />
        )}
      </PageContainer>

      {/* Detail Panel */}
      {selectedProspect && (
        <ProspectDetail
          prospect={selectedProspect}
          onUpdate={handleUpdateProspect}
          onDelete={handleDeleteProspect}
          onClose={() => setSelectedProspectId(null)}
          modelFamilies={modelFamilies}
        />
      )}

      {/* New Prospect Modal */}
      <NewProspectModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={handleCreateProspect}
        modelFamilies={modelFamilies}
        clusters={clusters}
      />

      {/* Outreach Burst */}
      {outreachBurstCluster && (
        <OutreachBurst
          isOpen={!!outreachBurstClusterId}
          onClose={() => setOutreachBurstClusterId(null)}
          cluster={outreachBurstCluster}
          prospects={outreachBurstProspects}
          onOutreachSaved={() => void fetchData()}
        />
      )}
    </>
  )
}

export default ProspectsPage
