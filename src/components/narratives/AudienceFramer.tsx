'use client'

import { type FC, useState } from 'react'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import type { Signal, Capability } from '@/types'

interface AudienceFramerProps {
  signal: Signal
  capability: Capability
}

const AUDIENCE_TABS = [
  { id: 'ml_engineer', label: 'ML Engineers' },
  { id: 'cto', label: 'CTOs' },
  { id: 'compliance', label: 'Policy/Compliance' },
  { id: 'ai_community', label: 'AI Community & Public' },
]

interface FrameContent {
  headline: string
  hook: string
  keyPoints: string[]
}

type FrameSet = Record<string, FrameContent>

const RLFR_FRAMES: FrameSet = {
  ml_engineer: {
    headline: 'RLFR: Probe-Based Rewards That Actually Fix Hallucination',
    hook: 'Our probes achieve 58% hallucination reduction on Gemma 12B across 8 domains \u2014 and the probe signal remains useful at test time for monitoring. Lightweight attention probes on frozen base model, standard RL objective, no gradient flow through probes.',
    keyPoints: [
      '58% hallucination reduction on Gemma 12B with best-of-32; 31% without test-time interventions (Prasad et al., Feb 2026)',
      '90x cheaper per intervention than LLM-as-judge \u2014 probes run on existing activations with negligible overhead',
      'Tested across 8 domains on LongFact++ (~20,000 prompts): biography, science, medical, history, geography, citations, legal, general',
    ],
  },
  cto: {
    headline: 'Cut Hallucinations in Half at 90x Lower Cost',
    hook: 'Your current approach to hallucination (human review or LLM-as-judge) is expensive and unreliable. RLFR probes cost 90x less per intervention and reduce hallucinations by 58%. The same probes double as production monitors.',
    keyPoints: [
      '58% hallucination reduction demonstrated on Gemma 12B \u2014 directly applicable to production model stacks (Prasad et al., Feb 2026)',
      '90x cost reduction vs LLM-as-judge: probes reuse existing model activations, no additional inference calls needed',
      'Dual-use probes: the same signals that train the model serve as real-time hallucination monitors in production',
    ],
  },
  compliance: {
    headline: 'Mechanistic Evidence for Model Quality',
    hook: 'Article 13 requires transparency into AI decision-making. RLFR provides causal documentation: we identify the specific internal features responsible for hallucination and show how training modified them. This is the mechanistic evidence regulators want.',
    keyPoints: [
      'Probe-based rewards create auditable training signals \u2014 each reward traces to specific internal model features',
      '58% hallucination reduction across 8 domains provides quantified evidence of model improvement (Prasad et al., Feb 2026)',
      'Interpretability probes double as production monitors, enabling continuous compliance documentation',
    ],
  },
  ai_community: {
    headline: 'We Cut AI Hallucinations in Half by Looking Inside the Model',
    hook: 'Instead of punishing a model for wrong answers, we found the internal features that cause hallucination and used them to guide training. Result: 58% fewer hallucinations, no capability degradation.',
    keyPoints: [
      'Traditional approach: ask another AI to judge answers (expensive, unreliable). Our approach: find the features inside the model that correlate with hallucination',
      '58% fewer hallucinations across 8 knowledge domains at 90x lower cost than alternatives (Prasad et al., Feb 2026)',
      'The same technique that fixes hallucination also monitors for it in real-time \u2014 one tool for training and production',
    ],
  },
}

const RT_FRAMES: FrameSet = {
  ml_engineer: {
    headline: 'Detect Performative Reasoning and Cut 68% of Wasted Tokens',
    hook: 'Attention probes decode model beliefs during chain-of-thought. When the model is performing rather than reasoning, probes trigger early exit. 68% token savings on MMLU at 95% confidence.',
    keyPoints: [
      '68% token savings on MMLU via early exit at 95% probe confidence (Boppana et al., Mar 2026)',
      '30% savings on GPQA-Diamond, 80% on easy recall tasks \u2014 probes generalize across benchmarks',
      'Tested on DeepSeek-R1 671B and GPT-OSS 120B. Inflection points ("Wait", "Aha!") correlate with genuine uncertainty',
    ],
  },
  cto: {
    headline: 'Cut Reasoning Model Costs by 68% Without Changing Models',
    hook: 'Reasoning models waste tokens on performative chain-of-thought. Reasoning Theater probes detect when the model already knows the answer and exit early. No architecture changes, no retraining.',
    keyPoints: [
      '68% token reduction on standard benchmarks = direct cost savings on reasoning model API bills (Boppana et al., Mar 2026)',
      'Deploy as inference middleware on existing models (DeepSeek-R1, GPT-OSS) \u2014 not a model replacement',
      'Probes distinguish genuine reasoning from performance \u2014 cut costs without sacrificing answer quality',
    ],
  },
  compliance: {
    headline: 'Verify That Your Reasoning Model Is Actually Reasoning',
    hook: 'Reasoning models produce elaborate chains of thought that may be purely performative. Reasoning Theater provides mechanistic verification that reasoning is genuine, not theatrical.',
    keyPoints: [
      'Probes measure internal model state, not just output \u2014 detecting when CoT diverges from actual beliefs',
      'Auditable evidence of reasoning faithfulness for high-stakes AI deployments',
      'Published benchmarks on DeepSeek-R1 671B and GPT-OSS 120B (Boppana et al., Mar 2026)',
    ],
  },
  ai_community: {
    headline: 'AI Reasoning Models Often Fake Their Reasoning \u2014 We Can Tell When',
    hook: 'When you ask AI to think step by step, it sometimes produces reasoning that looks impressive but does not reflect what the model believes. We built probes that detect this and save 68% of wasted computation.',
    keyPoints: [
      'Reasoning models spend tokens performing the appearance of reasoning \u2014 like writing out work already memorized',
      'Our probes look inside the model to detect when it already knows the answer, enabling 68% cost savings (Boppana et al., Mar 2026)',
      'Inflection points ("Wait", "Aha!") correlate with genuine uncertainty \u2014 the rest is often theater',
    ],
  },
}

const ALZ_FRAMES: FrameSet = {
  ml_engineer: {
    headline: "Scientific Discovery via Model Reverse-Engineering: Alzheimer's Biomarkers",
    hook: 'We reverse-engineered the Pleiades epigenetic foundation model and discovered DNA fragment length patterns as a novel biomarker class for Alzheimer\'s detection. The distilled classifier generalizes better than prior biomarker classes.',
    keyPoints: [
      'First major scientific discovery from reverse-engineering a foundation model (Wang et al., Jan 2026)',
      'Supervised probing (methylation, length, locus) and unsupervised approaches on Pleiades model',
      'Distilled interpretability insights into human-interpretable classifier that generalizes to independent cohorts',
    ],
  },
  cto: {
    headline: 'Interpretability as Scientific Discovery \u2014 With Published Proof',
    hook: 'Goodfire reverse-engineered a foundation model and discovered something new: a novel class of Alzheimer\'s biomarkers. This is interpretability creating real-world value, not just explaining it.',
    keyPoints: [
      'Novel biomarker class (DNA fragment length patterns) discovered via model interpretability \u2014 published Jan 2026',
      'Partnership with Prima Mente and University of Oxford provides institutional validation',
      'Distilled classifier outperforms previously reported biomarker classes on independent cohort',
    ],
  },
  compliance: {
    headline: 'Regulatory-Grade Scientific Discovery from AI Interpretability',
    hook: 'FDA draft guidance emphasizes model interpretability for submissions. Goodfire has demonstrated regulatory-grade interpretability: our work with Prima Mente produced a peer-reviewed scientific discovery.',
    keyPoints: [
      'Peer-reviewed discovery of novel Alzheimer\'s biomarker class via model interpretability (Wang et al., Jan 2026)',
      'Fully auditable pipeline: supervised probing and unsupervised approaches on foundation model',
      'Demonstrates the evidence standard regulatory bodies are beginning to require',
    ],
  },
  ai_community: {
    headline: "We Found a New Alzheimer's Biomarker by Looking Inside an AI",
    hook: 'By reverse-engineering a foundation model trained on genetic data, we discovered that DNA fragment length patterns indicate Alzheimer\'s disease. The first major scientific discovery made by understanding how an AI works.',
    keyPoints: [
      'The AI learned something about Alzheimer\'s that scientists hadn\'t programmed \u2014 we found it by looking inside',
      'Published as peer-reviewed research in January 2026 (Wang et al.) in partnership with Oxford',
      'The classifier built from this insight works better than existing biomarker approaches on new patient data',
    ],
  },
}

function getFrames(capability: Capability): FrameSet {
  if (capability.id === 'cap-rlfr') return RLFR_FRAMES
  if (capability.id === 'cap-reasoning-theater') return RT_FRAMES
  if (capability.id === 'cap-alzheimers') return ALZ_FRAMES
  const r = capability.key_results[0] ?? capability.description
  return {
    ml_engineer: { headline: `${capability.name}: Technical Overview`, hook: `${capability.description}`, keyPoints: [r, `Model families: ${capability.model_families_tested.join(', ') || 'Multiple'}`, `${capability.authors}, ${capability.date}`] },
    cto: { headline: `${capability.name}: Business Impact`, hook: `${capability.partner_solution}. Published by ${capability.authors}.`, keyPoints: [r, `Readiness: ${capability.readiness}`, `Partners: ${capability.partners.join(', ') || 'Available'}`] },
    compliance: { headline: `${capability.name}: Compliance Value`, hook: `${capability.description}`, keyPoints: [r, 'Interpretability-based approach provides auditable evidence', `${capability.authors}, ${capability.date}`] },
    ai_community: { headline: `${capability.name}: Making AI Understandable`, hook: `${capability.description}`, keyPoints: [r, capability.partner_solution, `Published by ${capability.authors}`] },
  }
}

export const AudienceFramer: FC<AudienceFramerProps> = ({ signal, capability }) => {
  const [activeTab, setActiveTab] = useState('ml_engineer')
  const frames = getFrames(capability)
  const frame = frames[activeTab] ?? frames['ml_engineer']

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xs uppercase tracking-wider text-text-secondary font-medium mb-1">Audience Framing</h2>
        <p className="text-xs text-text-tertiary mb-3 truncate">Signal: {signal.title}</p>
      </div>
      <Tabs tabs={AUDIENCE_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="p-4 space-y-3">
        {frame && (
          <>
            <h3 className="font-semibold text-sm text-text-primary">{frame.headline}</h3>
            <p className="text-sm text-text-secondary italic leading-relaxed">{frame.hook}</p>
            <ul className="space-y-2">
              {frame.keyPoints.map((point, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <span className="text-accent-amber font-mono text-xs mt-0.5 shrink-0">{idx + 1}.</span>
                  <span className="text-text-secondary leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Card>
  )
}
