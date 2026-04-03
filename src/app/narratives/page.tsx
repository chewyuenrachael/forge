'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { DiscourseMonitor } from '@/components/narratives/DiscourseMonitor'
import { ContentCalendar } from '@/components/narratives/ContentCalendar'
import { AudienceFramer } from '@/components/narratives/AudienceFramer'
import { NarrativeDraft } from '@/components/narratives/NarrativeDraft'
import type { Signal, Capability, ContentCalendarItem } from '@/types'

// ─── Discourse Signals ─────────────────────────────────────────────────────────

const DISCOURSE_SIGNALS: Signal[] = [
  {
    id: 'sig-anthropic-claude4', type: 'research',
    title: 'Anthropic publishes Claude 4 circuit tracing results',
    description: 'Anthropic releases detailed circuit tracing analysis of Claude 4, validating probe-based interpretability at frontier scale.',
    source: 'Anthropic Blog', date: '2026-03-28', relevance_score: 92,
    matched_capability_ids: ['cap-reasoning-theater'],
    suggested_action: 'Publish response highlighting Goodfire production extension',
    narrative_angle: 'Anthropic validates probe-based approach; Goodfire extends it to production with 68% inference savings',
  },
  {
    id: 'sig-eu-cenelec', type: 'regulatory',
    title: 'EU AI Act implementing regulations draft released by CEN/CENELEC',
    description: 'CEN/CENELEC publishes draft implementing regulations with technical standards for Article 13 transparency requirements.',
    source: 'EU Official Journal', date: '2026-03-25', relevance_score: 96,
    matched_capability_ids: ['cap-rlfr', 'cap-rakuten-pii', 'cap-model-diff'],
    suggested_action: 'Position mechanistic interpretability as the compliance standard',
    narrative_angle: 'Ambiguity in Article 13 transparency definition = window to position mechanistic interpretability as the standard',
  },
  {
    id: 'sig-openai-o3', type: 'competitor',
    title: 'OpenAI announces 40% o3 inference cost reduction',
    description: 'OpenAI reveals architectural optimizations reducing o3 reasoning model inference costs by 40%.',
    source: 'OpenAI Blog', date: '2026-03-22', relevance_score: 90,
    matched_capability_ids: ['cap-reasoning-theater'],
    suggested_action: 'Publish comparison of architecture optimization vs interpretability-guided early exit',
    narrative_angle: 'Architecture optimization vs interpretability-guided early exit: fundamentally different approaches, Goodfire achieves 68% without architecture changes',
  },
  {
    id: 'sig-nature-medicine', type: 'research',
    title: 'Nature Medicine: Editorial on AI transparency in clinical AI',
    description: 'Nature Medicine editorial calls for mechanistic transparency in clinical AI, citing regulatory pressure and patient safety.',
    source: 'Nature Medicine', date: '2026-03-18', relevance_score: 85,
    matched_capability_ids: ['cap-alzheimers'],
    suggested_action: 'Amplify Alzheimer\'s biomarker discovery as proof of clinical-grade interpretability',
    narrative_angle: 'Goodfire has the only published result of scientific discovery via model reverse-engineering',
  },
  {
    id: 'sig-deepseek-r2', type: 'competitor',
    title: 'DeepSeek releases R2 with extended reasoning chains',
    description: 'DeepSeek launches R2 with significantly longer reasoning chains, increasing token consumption for reasoning workloads.',
    source: 'DeepSeek Blog', date: '2026-03-15', relevance_score: 88,
    matched_capability_ids: ['cap-reasoning-theater'],
    suggested_action: 'Position Reasoning Theater as essential cost control for extended reasoning',
    narrative_angle: 'Longer CoT = more performative tokens = more savings opportunity for Reasoning Theater probes',
  },
  {
    id: 'sig-gartner-interp', type: 'research',
    title: 'Gartner announces first AI Interpretability Market Guide',
    description: 'Gartner publishes inaugural Market Guide for AI Interpretability, recognizing mechanistic interpretability as a distinct category.',
    source: 'Gartner', date: '2026-03-10', relevance_score: 94,
    matched_capability_ids: ['cap-rlfr'],
    suggested_action: 'Ensure Goodfire is positioned as the defining vendor',
    narrative_angle: 'Category crystallization moment. Goodfire must be positioned as the defining vendor.',
  },
  {
    id: 'sig-meta-llama4', type: 'competitor',
    title: 'Meta open-sources Llama 4 400B',
    description: 'Meta releases Llama 4 400B open-source, creating new demand for interpretability tooling across the ecosystem.',
    source: 'Meta AI Blog', date: '2026-03-05', relevance_score: 82,
    matched_capability_ids: ['cap-rlfr'],
    suggested_action: 'Demonstrate SAE and RLFR capabilities on Llama 4 architecture',
    narrative_angle: 'New model = new SAEs needed = new steering/surgery opportunities for partners',
  },
  {
    id: 'sig-nist-rmf2', type: 'regulatory',
    title: 'NIST releases AI RMF 2.0 with explicit interpretability section',
    description: 'NIST AI Risk Management Framework 2.0 includes dedicated section on mechanistic interpretability as risk mitigation.',
    source: 'NIST', date: '2026-03-01', relevance_score: 91,
    matched_capability_ids: ['cap-rlfr', 'cap-model-diff'],
    suggested_action: 'Reference NIST alignment in US-focused compliance messaging',
    narrative_angle: 'US regulatory body endorses interpretability. Demand signal for Shield/compliance products.',
  },
]

// ─── Calendar Items ────────────────────────────────────────────────────────────

const CALENDAR_ITEMS: ContentCalendarItem[] = [
  { id: 'cc-alz', date: '2026-01-28', type: 'research', title: "Alzheimer's Biomarkers paper published", description: 'Wang et al. \u2014 first scientific discovery via model reverse-engineering.' },
  { id: 'cc-series-b', date: '2026-02-05', type: 'research', title: 'Series B announcement', description: 'Goodfire Series B funding round announced.' },
  { id: 'cc-rlfr', date: '2026-02-11', type: 'research', title: 'RLFR paper published', description: 'Prasad et al. \u2014 58% hallucination reduction via interpretability features as rewards.' },
  { id: 'cc-fellowship', date: '2026-02-25', type: 'research', title: 'Fellowship program announced', description: 'Goodfire interpretability research fellowship program launched.' },
  { id: 'cc-rt', date: '2026-03-12', type: 'research', title: 'Reasoning Theater paper published', description: 'Boppana et al. \u2014 68% token savings via performative reasoning detection.' },
  { id: 'cc-sr117', date: '2026-04-01', type: 'regulatory', title: 'SR 11-7 compliance guide', description: 'Technical guide for banking compliance teams on LLM model risk management.' },
  { id: 'cc-rlfr-blog', date: '2026-04-08', type: 'suggested', title: 'RLFR case study blog', description: 'Suggested: publish case study on RLFR hallucination reduction results.' },
  { id: 'cc-whitepaper', date: '2026-04-15', type: 'regulatory', title: 'EU AI Act compliance whitepaper', description: 'Whitepaper mapping Goodfire capabilities to Article 13 requirements.' },
  { id: 'cc-rt-roi', date: '2026-04-15', type: 'suggested', title: 'Reasoning Theater ROI analysis', description: 'Suggested: publish ROI analysis of reasoning model cost optimization.' },
  { id: 'cc-webinar', date: '2026-04-20', type: 'suggested', title: 'Reasoning model webinar', description: 'Suggested: technical webinar on reasoning model interpretability.' },
  { id: 'cc-eu-guide', date: '2026-04-22', type: 'suggested', title: 'EU AI Act compliance guide', description: 'Suggested: publish technical guide mapping interpretability to Article 13.' },
  { id: 'cc-neurips', date: '2026-05-15', type: 'conference', title: 'NeurIPS 2026 paper submissions', description: 'Deadline for NeurIPS 2026 interpretability track submissions.' },
  { id: 'cc-eu-deadline', date: '2026-08-02', type: 'regulatory', title: 'EU AI Act high-risk provisions effective', description: 'Article 13 transparency requirements become enforceable.' },
]

// ─── Capabilities Lookup ───────────────────────────────────────────────────────

const CAPABILITIES: Record<string, Capability> = {
  'cap-rlfr': {
    id: 'cap-rlfr', name: 'RLFR', paper_title: 'Features as Rewards: Using Interpretability to Reduce Hallucinations',
    authors: 'Prasad et al.', date: '2026-02-11', type: 'fundamental',
    description: 'Probes on model internal representations as reward signals for RL. Uses interpretability features to train models that hallucinate less, at 90x lower cost than LLM-as-judge.',
    key_results: ['58% hallucination reduction on Gemma 12B (topline with best-of-32)', '31% reduction without test-time interventions', '90x cheaper per intervention than LLM-as-judge', 'Tested across 8 domains on LongFact++ (~20,000 prompts)'],
    partner_solution: 'Model Surgery as a Service', readiness: 'production', model_families: ['Gemma 12B'], partners: [],
  },
  'cap-reasoning-theater': {
    id: 'cap-reasoning-theater', name: 'Reasoning Theater', paper_title: 'Reasoning Theater: Probing for Performative Chain-of-Thought',
    authors: 'Boppana et al.', date: '2026-03-12', type: 'applied',
    description: 'Attention probes decode model beliefs during chain-of-thought reasoning. Detects performative vs genuine reasoning, enabling early exit.',
    key_results: ['68% token savings on MMLU via early exit at 95% probe confidence', '30% token savings on GPQA-Diamond', '80% token savings on easy recall tasks', 'Tested on DeepSeek-R1 671B and GPT-OSS 120B'],
    partner_solution: 'Inference Cost Optimization + CoT Faithfulness Monitoring', readiness: 'demo', model_families: ['DeepSeek-R1 671B', 'GPT-OSS 120B'], partners: [],
  },
  'cap-alzheimers': {
    id: 'cap-alzheimers', name: "Alzheimer's Biomarkers", paper_title: "Using Interpretability to Identify a Novel Class of Alzheimer's Biomarkers",
    authors: 'Wang et al.', date: '2026-01-28', type: 'applied',
    description: 'First major scientific discovery from reverse-engineering a foundation model. Discovered DNA fragment length patterns as a novel biomarker class.',
    key_results: ['Discovered DNA fragment length patterns as novel Alzheimer\'s biomarker class', 'Distilled into human-interpretable classifier', 'Classifier generalizes better than prior biomarker classes on independent cohort'],
    partner_solution: 'Scientific Discovery as a Service', readiness: 'production', model_families: ['Pleiades'], partners: ['Prima Mente', 'University of Oxford'],
  },
  'cap-rakuten-pii': {
    id: 'cap-rakuten-pii', name: 'Rakuten PII Detection', paper_title: 'Deploying Interpretability to Production with Rakuten',
    authors: 'Nguyen et al.', date: '2025-10-28', type: 'applied',
    description: 'SAE-feature-based lightweight classifiers for real-time PII detection deployed at scale.',
    key_results: ['Deployed across 44M+ users', 'Sub-millisecond inference overhead', 'Production-grade reliability'],
    partner_solution: 'Runtime Guardrails', readiness: 'production', model_families: [], partners: ['Rakuten'],
  },
  'cap-model-diff': {
    id: 'cap-model-diff', name: 'Model Diff Amplification', paper_title: 'Discovering Undesired Rare Behaviors via Model Diff Amplification',
    authors: 'Aranguri & McGrath', date: '2025-08-21', type: 'applied',
    description: 'Surfaces rare undesired behaviors introduced during post-training using logit diff amplification.',
    key_results: ['Detects behaviors occurring once in a million samples', 'Identifies unintended post-training artifacts', 'Detects reward hacking and memorized data'],
    partner_solution: 'Model Audit & Quality Assurance', readiness: 'demo', model_families: [], partners: [],
  },
}

// ─── Page Component ────────────────────────────────────────────────────────────

const NarrativesPage = (): React.JSX.Element => {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined)

  const matchedCapability: Capability | undefined = selectedSignal
    ? CAPABILITIES[selectedSignal.matched_capability_ids[0] ?? '']
    : undefined

  const showPanel = selectedSignal !== null && matchedCapability !== undefined

  return (
    <>
      <Header title="Narrative Engine" subtitle="Discourse monitoring \u2192 Content planning \u2192 Audience-specific framing" />
      <PageContainer>
        <div className="space-y-6">
          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-3">
              <DiscourseMonitor
                signals={DISCOURSE_SIGNALS}
                onSelectSignal={setSelectedSignal}
                selectedSignalId={selectedSignal?.id}
              />
            </div>
            <div className="col-span-2">
              <ContentCalendar
                items={CALENDAR_ITEMS}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            </div>
          </div>

          <div className={`transition-all duration-500 ease-out overflow-hidden ${
            showPanel ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            {showPanel && (
              <div className="grid grid-cols-2 gap-6 pt-2">
                <AudienceFramer signal={selectedSignal} capability={matchedCapability} />
                <NarrativeDraft signal={selectedSignal} capability={matchedCapability} />
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </>
  )
}

export default NarrativesPage
