'use client'

import { useState, useEffect, useMemo } from 'react'
import { Layers, DollarSign, Clock, AlertTriangle } from 'lucide-react'

import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { MetricCard } from '@/components/ui/MetricCard'
import { CoverageOverview } from '@/components/models/CoverageOverview'
import { PipelineDemand } from '@/components/models/PipelineDemand'
import { SAEInvestmentTracker, type SAEInvestmentEntry } from '@/components/models/SAEInvestmentTracker'
import { DecisionTriggerAlerts, type DecisionTrigger } from '@/components/models/DecisionTriggerAlerts'
import { BreakevenMatrix, type BreakevenRow } from '@/components/models/BreakevenMatrix'

import { SAE_TRAINING_COST, PRICING_GRID, ENGAGEMENT_TIERS } from '@/lib/constants'
import type { ModelFamilyTier, EngagementTier } from '@/lib/constants'
import type { ModelFamily, Engagement, Prospect, ICPScore, AsyncState } from '@/types'

type DecisionStatus = 'GO' | 'APPROACHING' | 'WAIT'

interface PipelineByModelEntry {
  modelFamilyId: string
  count: number
  totalValue: number
}

interface PricingByModelEntry {
  modelFamilyId: string
  engagementCount: number
  totalValue: number
  saeInvestment: number
  roi: number
}

interface PipelineOverview {
  totalProspects: number
  totalPipelineValue: number
  byModelFamily: PipelineByModelEntry[]
}

interface PricingSummary {
  totalPipelineValue: number
  totalCostToDeliver: number
  overallMarginPct: number
  byModelFamily: PricingByModelEntry[]
}

interface ModelsPageData {
  modelFamilies: ModelFamily[]
  coverage: { tierId: string; count: number; models: string[] }[]
  pipeline: PipelineOverview
  pricing: PricingSummary
  engagements: Engagement[]
  prospects: (Prospect & { icpScore: ICPScore })[]
}

const QUALIFIED_STAGES = new Set<string>([
  'discovery_complete', 'proposal_sent', 'verbal_agreement', 'contract_signed',
])

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

const ModelsPage = (): React.ReactElement => {
  const [data, setData] = useState<AsyncState<ModelsPageData>>({ status: 'idle' })
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)

  useEffect(() => {
    setData({ status: 'loading' })
    Promise.all([
      fetch('/api/model-families').then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<{ data: ModelFamily[] }> }),
      fetch('/api/model-families?coverage=true').then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<{ data: { tierId: string; count: number; models: string[] }[] }> }),
      fetch('/api/pipeline').then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<{ data: PipelineOverview }> }),
      fetch('/api/pricing?summary=true').then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<{ data: PricingSummary }> }),
      fetch('/api/engagements').then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<{ data: Engagement[] }> }),
      fetch('/api/prospects').then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<{ data: (Prospect & { icpScore: ICPScore })[] }> }),
    ])
      .then(([mfRes, covRes, pipeRes, priceRes, engRes, prosRes]) => {
        setData({
          status: 'success',
          data: {
            modelFamilies: mfRes.data,
            coverage: covRes.data,
            pipeline: pipeRes.data,
            pricing: priceRes.data,
            engagements: engRes.data,
            prospects: prosRes.data,
          },
        })
      })
      .catch((err: Error) => setData({ status: 'error', error: err.message }))
  }, [])

  // Computed values
  const pipelineByModel = useMemo(() => {
    if (data.status !== 'success') return new Map<string, { count: number; totalValue: number }>()
    return new Map(data.data.pipeline.byModelFamily.map((p) => [p.modelFamilyId, p]))
  }, [data])

  const engagementsByModel = useMemo(() => {
    if (data.status !== 'success') return new Map<string, Engagement[]>()
    const map = new Map<string, Engagement[]>()
    for (const eng of data.data.engagements) {
      if (eng.model_family_id) {
        const existing = map.get(eng.model_family_id) ?? []
        existing.push(eng)
        map.set(eng.model_family_id, existing)
      }
    }
    return map
  }, [data])

  const metrics = useMemo(() => {
    if (data.status !== 'success') return null
    const { modelFamilies, pipeline } = data.data
    const tierA = modelFamilies.filter((mf) => mf.tier === 'tier_a')
    const tierB = modelFamilies.filter((mf) => mf.tier === 'tier_b')
    const tierAIds = new Set(tierA.map((mf) => mf.id))

    const supportedPipelineValue = pipeline.byModelFamily
      .filter((p) => tierAIds.has(p.modelFamilyId))
      .reduce((sum, p) => sum + p.totalValue, 0)

    const pendingCost = tierB.length * SAE_TRAINING_COST.tier_b

    return {
      tierACount: tierA.length,
      totalModels: modelFamilies.length,
      supportedPipelineValue,
      pendingCount: tierB.length,
      pendingCost,
    }
  }, [data])

  const decisionTriggers = useMemo((): DecisionTrigger[] => {
    if (data.status !== 'success') return []
    const { modelFamilies, prospects } = data.data
    return modelFamilies
      .filter((mf) => mf.tier !== 'tier_a' && mf.sae_status !== 'available')
      .map((mf) => {
        const qualifiedProspectCount = prospects.filter(
          (p) => p.model_families.includes(mf.id) && QUALIFIED_STAGES.has(p.pipeline_stage)
        ).length
        const pipelineRevenue = pipelineByModel.get(mf.id)?.totalValue ?? 0
        const prospectTriggerMet = qualifiedProspectCount >= 3
        const revenueTriggerMet = pipelineRevenue > 500_000
        const status: DecisionStatus =
          prospectTriggerMet && revenueTriggerMet ? 'GO' :
          prospectTriggerMet || revenueTriggerMet ? 'APPROACHING' : 'WAIT'
        return {
          modelFamilyId: mf.id,
          modelName: mf.name,
          tier: mf.tier as ModelFamilyTier,
          qualifiedProspectCount,
          pipelineRevenue,
          prospectTriggerMet,
          revenueTriggerMet,
          status,
        }
      })
  }, [data, pipelineByModel])

  const triggersMetCount = useMemo(
    () => decisionTriggers.filter((t) => t.status === 'GO').length,
    [decisionTriggers]
  )

  const saeEntries = useMemo((): SAEInvestmentEntry[] => {
    if (data.status !== 'success') return []
    const { modelFamilies, pricing } = data.data
    return modelFamilies.map((mf) => {
      const saeCost = SAE_TRAINING_COST[mf.tier as ModelFamilyTier] ?? 0
      const pricingEntry = pricing.byModelFamily.find((p) => p.modelFamilyId === mf.id)
      const totalRevenue = pricingEntry?.totalValue ?? 0
      const roi = saeCost > 0 && totalRevenue > 0
        ? ((totalRevenue - saeCost) / saeCost) * 100
        : saeCost === 0 && totalRevenue > 0 ? Infinity : 0
      return {
        modelFamilyId: mf.id,
        modelName: mf.name,
        tier: mf.tier as ModelFamilyTier,
        saeCost,
        engagementCount: pricingEntry?.engagementCount ?? 0,
        totalRevenue,
        roi: isFinite(roi) ? roi : 0,
        saeStatus: mf.sae_status,
      }
    })
  }, [data])

  const breakevenRows = useMemo((): BreakevenRow[] => {
    if (data.status !== 'success') return []
    return data.data.modelFamilies
      .filter((mf) => mf.tier !== 'tier_a')
      .map((mf) => {
        const saeCost = SAE_TRAINING_COST[mf.tier as ModelFamilyTier] ?? 0
        const byEngagementTier = (ENGAGEMENT_TIERS as readonly EngagementTier[]).map((et) => {
          const grid = PRICING_GRID[et]
          const midpoint = (grid.low + grid.high) / 2
          const averageMargin = midpoint * 0.55
          const engagementsNeeded = averageMargin > 0 ? Math.ceil(saeCost / averageMargin) : 0
          return { tier: et, averageMargin: Math.round(averageMargin), engagementsNeeded }
        })
        return {
          modelFamilyId: mf.id,
          modelName: mf.name,
          tier: mf.tier as ModelFamilyTier,
          saeCost,
          byEngagementTier,
        }
      })
  }, [data])

  const selectedModel = useMemo(() => {
    if (data.status !== 'success' || !selectedModelId) return null
    return data.data.modelFamilies.find((mf) => mf.id === selectedModelId) ?? null
  }, [data, selectedModelId])

  // Loading state
  if (data.status === 'idle' || data.status === 'loading') {
    return (
      <>
        <Header title="Model Family Coverage" subtitle="SAE readiness, pipeline demand, investment decisions" />
        <PageContainer>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-elevated" />
            ))}
          </div>
          <div className="mt-6 h-64 animate-pulse rounded-lg bg-elevated" />
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="h-48 animate-pulse rounded-lg bg-elevated" />
            <div className="h-48 animate-pulse rounded-lg bg-elevated" />
          </div>
        </PageContainer>
      </>
    )
  }

  // Error state
  if (data.status === 'error') {
    return (
      <>
        <Header title="Model Family Coverage" subtitle="SAE readiness, pipeline demand, investment decisions" />
        <PageContainer>
          <div className="rounded-lg border border-accent-red/30 bg-accent-red/5 p-6">
            <p className="text-sm text-accent-red">Failed to load model data: {data.error}</p>
          </div>
        </PageContainer>
      </>
    )
  }

  const { modelFamilies, prospects, engagements } = data.data

  return (
    <>
      <Header title="Model Family Coverage" subtitle="SAE readiness, pipeline demand, investment decisions" />
      <PageContainer>
        <div className="space-y-6">
          {/* Row 1: Metric Cards */}
          <div className="grid grid-cols-4 gap-4">
            <MetricCard
              value={metrics?.tierACount ?? 0}
              label="Tier A Models (SAE Ready)"
              icon={<Layers size={18} />}
              trend={{ value: `${metrics?.totalModels ?? 0} total models`, direction: 'neutral' }}
            />
            <MetricCard
              value={formatCompactCurrency(metrics?.supportedPipelineValue ?? 0)}
              label="Pipeline on Supported Models"
              icon={<DollarSign size={18} />}
              mono
            />
            <MetricCard
              value={metrics?.pendingCount ?? 0}
              label="Pending SAE Investments"
              icon={<Clock size={18} />}
              trend={{ value: formatCompactCurrency(metrics?.pendingCost ?? 0) + ' estimated', direction: 'neutral' }}
            />
            <MetricCard
              value={triggersMetCount}
              label="Decision Triggers Met"
              icon={<AlertTriangle size={18} />}
              trend={{
                value: triggersMetCount > 0 ? `${triggersMetCount} model${triggersMetCount !== 1 ? 's' : ''} ready for investment` : 'No models ready for investment',
                direction: triggersMetCount > 0 ? 'up' : 'neutral',
                positive: triggersMetCount > 0,
              }}
            />
          </div>

          {/* Row 2: Coverage Overview */}
          <CoverageOverview
            modelFamilies={modelFamilies}
            pipelineByModel={pipelineByModel}
            engagementsByModel={engagementsByModel}
            onSelectModel={(id) => setSelectedModelId(id === selectedModelId ? null : id)}
          />

          {/* Row 3: Pipeline Demand (conditional) */}
          {selectedModel && (
            <PipelineDemand
              modelFamilyId={selectedModel.id}
              modelFamilyName={selectedModel.name}
              prospects={prospects}
              engagements={engagements}
            />
          )}

          {/* Row 4: Decision Trigger Alerts */}
          <DecisionTriggerAlerts triggers={decisionTriggers} />

          {/* Row 5: Investment Tracker + Breakeven Matrix */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SAEInvestmentTracker entries={saeEntries} />
            <BreakevenMatrix rows={breakevenRows} />
          </div>
        </div>
      </PageContainer>
    </>
  )
}

export default ModelsPage
