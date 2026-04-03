'use client'

import { useState, useEffect, useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { MetricCard } from '@/components/ui/MetricCard'
import { SignalFeed } from '@/components/gtm/SignalFeed'
import { ProspectCard } from '@/components/gtm/ProspectCard'
import { OutreachDraft } from '@/components/gtm/OutreachDraft'
import { ROICalculator } from '@/components/gtm/ROICalculator'
import type { Signal, Prospect, Capability } from '@/types'

// Minimal capability data for OutreachDraft — avoids extra API call
const CAPABILITY_MAP: Record<string, Capability> = {
  'cap-rlfr': { id: 'cap-rlfr', name: 'RLFR', paper_title: 'Features as Rewards', authors: 'Prasad et al.', date: 'Feb 2026', type: 'fundamental', description: '', key_results: ['58% hallucination reduction on Gemma 12B (best-of-32)', '90x cheaper per intervention than LLM-as-judge', 'Tested across 8 domains'], partner_solution: '', readiness: 'production', model_families: [], partners: [] },
  'cap-reasoning-theater': { id: 'cap-reasoning-theater', name: 'Reasoning Theater', paper_title: 'Reasoning Theater', authors: 'Boppana et al.', date: 'Mar 2026', type: 'applied', description: '', key_results: ['68% token savings on MMLU via early exit at 95% probe confidence', '30% token savings on GPQA-Diamond', '80% token savings on easy recall tasks'], partner_solution: '', readiness: 'demo', model_families: [], partners: [] },
  'cap-alzheimers': { id: 'cap-alzheimers', name: "Alzheimer's Biomarkers", paper_title: 'Alzheimer\'s Biomarkers', authors: 'Wang et al.', date: 'Jan 2026', type: 'applied', description: '', key_results: ['Discovered DNA fragment length patterns as novel biomarker class', 'Classifier generalizes better than prior biomarker classes'], partner_solution: '', readiness: 'production', model_families: [], partners: ['Prima Mente', 'University of Oxford'] },
  'cap-rakuten-pii': { id: 'cap-rakuten-pii', name: 'Rakuten PII Detection', paper_title: 'SAE Probes for PII Detection', authors: 'Nguyen et al.', date: 'Oct 2025', type: 'applied', description: '', key_results: ['Deployed across 44M+ users', 'Sub-millisecond inference overhead'], partner_solution: '', readiness: 'production', model_families: [], partners: ['Rakuten'] },
  'cap-model-diff': { id: 'cap-model-diff', name: 'Model Diff Amplification', paper_title: 'Model Diff Amplification', authors: 'Aranguri & McGrath', date: 'Aug 2025', type: 'applied', description: '', key_results: ['Detects rare behaviors occurring once in a million samples'], partner_solution: '', readiness: 'demo', model_families: [], partners: [] },
  'cap-memorization': { id: 'cap-memorization', name: 'Memorization vs Reasoning', paper_title: 'Loss Curvature Analysis', authors: 'Merullo et al.', date: 'Nov 2025', type: 'fundamental', description: '', key_results: ['Removing memorization weights improves reasoning performance'], partner_solution: '', readiness: 'research', model_families: [], partners: [] },
  'cap-spd': { id: 'cap-spd', name: 'SPD', paper_title: 'Scalable Parameter Decomposition', authors: 'Bushnaq et al.', date: 'Jun 2025', type: 'fundamental', description: '', key_results: ['Decomposes model weights into interpretable components'], partner_solution: '', readiness: 'research', model_families: [], partners: [] },
  'cap-evo2-tree': { id: 'cap-evo2-tree', name: 'Evo 2 / Tree of Life', paper_title: 'Finding the Tree of Life in Evo 2', authors: 'Pearce et al.', date: 'Aug 2025', type: 'applied', description: '', key_results: ['Found phylogenetic structure encoded in Evo 2', 'Partnership with Arc Institute'], partner_solution: '', readiness: 'production', model_families: ['Evo 2'], partners: ['Arc Institute'] },
  'cap-interpreting-evo2': { id: 'cap-interpreting-evo2', name: 'Interpreting Evo 2', paper_title: 'Interpreting Evo 2', authors: 'Gorton et al.', date: 'Feb 2025', type: 'applied', description: '', key_results: ['Applied interpretability to next-gen genomic foundation model', 'Partnership with Arc Institute'], partner_solution: '', readiness: 'production', model_families: ['Evo 2'], partners: ['Arc Institute'] },
  'cap-reasoning-hood': { id: 'cap-reasoning-hood', name: 'Under the Hood of Reasoning', paper_title: 'Under the Hood of a Reasoning Model', authors: 'Hazra et al.', date: 'Apr 2025', type: 'fundamental', description: '', key_results: ['Internal analysis of reasoning model processing', 'Reveals mechanisms behind chain-of-thought reasoning'], partner_solution: '', readiness: 'research', model_families: ['DeepSeek R1'], partners: [] },
}

function formatPipelineValue(amount: number): string {
  return `$${(amount / 1_000_000).toFixed(1)}M`
}

const GTMPage = (): React.JSX.Element => {
  const [signals, setSignals] = useState<Signal[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [showOutreach, setShowOutreach] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const [sigRes, prosRes] = await Promise.all([
          fetch('/api/signals'),
          fetch('/api/signals?resource=prospects'),
        ])
        const sigData = await sigRes.json() as { data: Signal[] }
        const prosData = await prosRes.json() as { data: Prospect[] }
        setSignals(sigData.data ?? [])
        setProspects(prosData.data ?? [])
      } catch {
        // Graceful degradation — components handle empty arrays
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSelectSignal = (signal: Signal): void => {
    setSelectedSignal(signal)
  }

  const handleDraftOutreach = (signal: Signal): void => {
    setSelectedSignal(signal)
    setShowOutreach(true)
  }

  const matchedCapabilities = useMemo((): Capability[] => {
    if (!selectedSignal) return []
    return selectedSignal.matched_capability_ids
      .map((id) => CAPABILITY_MAP[id])
      .filter((c): c is Capability => c !== undefined)
  }, [selectedSignal])

  const pipelineValue = useMemo(
    () => prospects.reduce((sum, p) => sum + p.estimated_ai_spend, 0),
    [prospects]
  )

  const euDaysRemaining = useMemo(() => {
    const deadline = new Date('2026-08-02').getTime()
    const now = Date.now()
    return Math.max(0, Math.ceil((deadline - now) / 86_400_000))
  }, [])

  if (loading) {
    return (
      <>
        <Header title="GTM Command Center" subtitle="Signal detection → Capability matching → Outreach generation" />
        <PageContainer>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-elevated animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7 h-96 rounded-lg bg-elevated animate-pulse" />
            <div className="col-span-5 h-96 rounded-lg bg-elevated animate-pulse" />
          </div>
        </PageContainer>
      </>
    )
  }

  return (
    <>
      <Header title="GTM Command Center" subtitle="Signal detection → Capability matching → Outreach generation" />
      <PageContainer>
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <MetricCard value={String(signals.length)} label="Active Signals" />
            <MetricCard value={String(prospects.length)} label="Priority Prospects" />
            <MetricCard value={formatPipelineValue(pipelineValue)} label="Pipeline Value" />
            <MetricCard value={`${euDaysRemaining}d`} label="EU AI Act Deadline" trend={{ value: `${euDaysRemaining} days`, positive: euDaysRemaining > 90 }} />
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7">
              <SignalFeed
                signals={signals}
                onSelectSignal={handleSelectSignal}
                onDraftOutreach={handleDraftOutreach}
                selectedSignalId={selectedSignal?.id}
              />
            </div>
            <div className="col-span-5">
              <ROICalculator />
            </div>
          </div>

          {showOutreach && selectedSignal && (
            <OutreachDraft signal={selectedSignal} capabilities={matchedCapabilities} />
          )}

          <div>
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">Priority Prospects</h2>
            <div className="grid grid-cols-3 gap-4">
              {prospects.map((prospect) => (
                <ProspectCard key={prospect.id} prospect={prospect} />
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

export default GTMPage
