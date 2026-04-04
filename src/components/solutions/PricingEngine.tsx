'use client'

import { type FC, useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TierClassification } from '@/components/solutions/TierClassification'
import { MarginAnalysis } from '@/components/solutions/MarginAnalysis'
import { UpsellProjection } from '@/components/solutions/UpsellProjection'
import { BreakevenCalculator } from '@/components/solutions/BreakevenCalculator'
import { PRICING_GRID } from '@/lib/constants'
import type { EngagementTier } from '@/lib/constants'
import type { IntakeFormData, SolutionMatch, ClassifyResult } from '@/types'

interface PricingEngineProps {
  intakeData: IntakeFormData
  matches: SolutionMatch[]
  onTierClassified: (result: ClassifyResult) => void
}

// Map IntakeForm model family names to database model_family_ids
const MODEL_FAMILY_TO_ID: Record<string, string> = {
  'Llama': 'llama-3.3-70b',
  'DeepSeek': 'deepseek-r1',
  'Gemma': 'gemma-12b',
  'Biological FM': 'evo-2',
}

// Map intake model family names to display names for breakeven
const MODEL_FAMILY_DISPLAY: Record<string, string> = {
  'Llama': 'Llama 3.3 70B',
  'DeepSeek': 'DeepSeek R1',
  'Gemma': 'Gemma 12B',
  'Biological FM': 'Evo 2',
}

type FetchState = 'idle' | 'loading' | 'success' | 'error'

function buildOverrideResult(
  baseTier: EngagementTier,
  originalResult: ClassifyResult,
): ClassifyResult {
  const grid = PRICING_GRID[baseTier]
  const midpoint = (grid.low + grid.high) / 2
  const costToDeliver = Math.round(midpoint * 0.45)
  const marginLow = grid.low > 0 ? Math.round((grid.low - costToDeliver) / grid.low * 100) : 0
  const marginHigh = grid.high > 0 ? Math.round((grid.high - costToDeliver) / grid.high * 100) : 0

  const saeCost = originalResult.saeCostIfNeeded

  let breakeven: ClassifyResult['breakeven'] = null
  if (saeCost > 0) {
    const avgMargin = midpoint - costToDeliver
    const engagementsNeeded = avgMargin > 0 ? Math.ceil(saeCost / avgMargin) : 0
    breakeven = {
      engagementsNeeded,
      note: `Requires ${engagementsNeeded} engagement${engagementsNeeded !== 1 ? 's' : ''} at average margin to recoup $${(saeCost / 1000000).toFixed(1)}M SAE training investment`,
    }
  }

  return {
    tier: baseTier,
    priceRange: { low: grid.low, high: grid.high },
    durationDays: grid.days,
    rationale: originalResult.rationale,
    costToDeliver,
    marginRange: { low: marginLow, high: marginHigh },
    saeCostIfNeeded: saeCost,
    breakeven,
  }
}

export const PricingEngine: FC<PricingEngineProps> = ({
  intakeData,
  matches,
  onTierClassified,
}) => {
  const [fetchState, setFetchState] = useState<FetchState>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [apiResult, setApiResult] = useState<ClassifyResult | null>(null)
  const [overrideTier, setOverrideTier] = useState<EngagementTier | null>(null)
  const requestIdRef = useRef(0)

  const effectiveResult = overrideTier && apiResult
    ? buildOverrideResult(overrideTier, apiResult)
    : apiResult

  const fetchPricing = useCallback(async (): Promise<void> => {
    const currentRequestId = ++requestIdRef.current
    setFetchState('loading')
    setErrorMsg('')

    const modelFamilyId = MODEL_FAMILY_TO_ID[intakeData.modelFamily] ?? intakeData.modelFamily.toLowerCase()
    const useCaseCount = matches.filter((m) => m.matchLevel !== 'low').length || 1
    const regulatoryRequirements = intakeData.regulatoryExposure.filter((r) => r !== 'None')
    const deploymentContext = intakeData.deploymentContext.toLowerCase()

    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelFamilyId,
          useCaseCount,
          regulatoryRequirements,
          deploymentContext,
        }),
      })

      // Guard against stale responses
      if (currentRequestId !== requestIdRef.current) return

      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Failed to classify engagement tier')
      }

      const json = await res.json() as { data: ClassifyResult }
      setApiResult(json.data)
      setOverrideTier(null)
      setFetchState('success')
      onTierClassified(json.data)
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return
      setErrorMsg(err instanceof Error ? err.message : 'Failed to classify engagement tier')
      setFetchState('error')
    }
  }, [intakeData, matches, onTierClassified])

  useEffect(() => {
    void fetchPricing()
  }, [fetchPricing])

  // Propagate override results up
  useEffect(() => {
    if (effectiveResult && overrideTier) {
      onTierClassified(effectiveResult)
    }
  }, [effectiveResult, overrideTier, onTierClassified])

  const handleOverride = useCallback((tier: EngagementTier): void => {
    if (apiResult && tier === apiResult.tier) {
      setOverrideTier(null)
    } else {
      setOverrideTier(tier)
    }
  }, [apiResult])

  const handleReset = useCallback((): void => {
    setOverrideTier(null)
    if (apiResult) {
      onTierClassified(apiResult)
    }
  }, [apiResult, onTierClassified])

  const modelDisplayName = MODEL_FAMILY_DISPLAY[intakeData.modelFamily] ?? intakeData.modelFamily

  return (
    <Card
      header={
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-accent-amber" />
          <h2 className="text-sm font-semibold text-text-primary">Engagement Pricing</h2>
        </div>
      }
    >
      {fetchState === 'loading' && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="text-accent-amber animate-spin" />
            <span className="text-sm text-text-secondary">Classifying engagement tier...</span>
          </div>
        </div>
      )}

      {fetchState === 'error' && (
        <div className="rounded-md border border-[#8A2020]/30 bg-[#EDCFCF]/50 px-4 py-3">
          <p className="text-sm text-[#8A2020]">{errorMsg}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-[#8A2020]"
            onClick={() => void fetchPricing()}
          >
            Retry
          </Button>
        </div>
      )}

      {fetchState === 'success' && effectiveResult && apiResult && (
        <div className="space-y-6">
          <TierClassification
            recommendedTier={apiResult.tier}
            activeTier={effectiveResult.tier}
            rationale={effectiveResult.rationale}
            onOverride={handleOverride}
            onReset={handleReset}
            isOverridden={overrideTier !== null}
          />

          <div className="border-t border-border-subtle" />

          <MarginAnalysis
            priceRange={effectiveResult.priceRange}
            costToDeliver={effectiveResult.costToDeliver}
            saeCostIfNeeded={effectiveResult.saeCostIfNeeded}
          />

          <div className="border-t border-border-subtle" />

          <UpsellProjection
            currentTier={effectiveResult.tier}
            priceRange={effectiveResult.priceRange}
          />

          {effectiveResult.saeCostIfNeeded > 0 && effectiveResult.breakeven && (
            <>
              <div className="border-t border-border-subtle" />
              <BreakevenCalculator
                modelFamilyName={modelDisplayName}
                saeCost={effectiveResult.saeCostIfNeeded}
                breakeven={effectiveResult.breakeven}
              />
            </>
          )}
        </div>
      )}
    </Card>
  )
}
