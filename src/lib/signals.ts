import type { Signal, Prospect } from '@/types'

// ─── Hardcoded Signals ─────────────────────────────────────────────────

const SIGNALS: Signal[] = [
  {
    id: 'sig-eu-ai-act-draft',
    type: 'regulatory',
    title: 'EU AI Act Implementing Regulation Draft Published',
    description: 'The European Commission publishes draft implementing regulation for Article 13 transparency requirements. High-risk AI systems must demonstrate interpretability and provide meaningful explanations of decision-making processes by August 2, 2026.',
    source: 'European Commission',
    date: '2026-03-28',
    relevance_score: 10,
    matched_capability_ids: ['cap-rlfr', 'cap-rakuten-pii', 'cap-model-diff'],
    suggested_action: 'Accelerate outreach to all EU-regulated prospects with compliance-focused messaging. Position Goodfire as the interpretability infrastructure for Article 13 compliance.',
    narrative_angle: 'Goodfire interpretability is the technical foundation for Article 13 compliance — not optional, but required infrastructure for any high-risk AI system operating in the EU.',
  },
  {
    id: 'sig-anthropic-circuit',
    type: 'research',
    title: 'Anthropic Publishes Circuit Tracing on Claude',
    description: 'Anthropic releases comprehensive circuit tracing results on Claude, demonstrating mechanistic interpretability at production scale. Validates the interpretability approach Goodfire has commercialized.',
    source: 'Anthropic Research Blog',
    date: '2026-03-15',
    relevance_score: 9,
    matched_capability_ids: ['cap-reasoning-theater', 'cap-reasoning-hood'],
    suggested_action: 'Amplify as third-party validation of interpretability\'s importance. Position Goodfire\'s commercial offering as the bridge from research to production deployment.',
    narrative_angle: 'When the company behind Claude invests heavily in interpretability, it validates that understanding AI internals is essential — and Goodfire is the only company turning this into commercial solutions.',
  },
  {
    id: 'sig-openai-cost',
    type: 'competitor',
    title: 'OpenAI Announces Reasoning Model Price Increase',
    description: 'OpenAI raises o3-mini and o3 pricing by 40%, citing compute costs for chain-of-thought reasoning. Enterprise customers report significant budget overruns on reasoning workloads.',
    source: 'OpenAI Blog / Industry Reports',
    date: '2026-03-20',
    relevance_score: 8,
    matched_capability_ids: ['cap-reasoning-theater'],
    suggested_action: 'Position Reasoning Theater as immediate cost relief. Target enterprises with large reasoning model deployments — the ROI case writes itself.',
    narrative_angle: '68% token savings on reasoning workloads via probe-guided early exit. When reasoning costs spike, interpretability becomes a cost optimization tool, not just a safety measure.',
  },
  {
    id: 'sig-nature-medicine',
    type: 'research',
    title: 'Nature Medicine Editorial on AI Transparency in Healthcare',
    description: 'Nature Medicine publishes editorial calling for mandatory interpretability requirements in clinical AI systems, citing recent diagnostic AI failures and the need for human-verifiable explanations.',
    source: 'Nature Medicine',
    date: '2026-03-10',
    relevance_score: 8,
    matched_capability_ids: ['cap-alzheimers', 'cap-rlfr'],
    suggested_action: 'Engage pharmaceutical and healthcare prospects with the Alzheimer\'s biomarker case study as proof of regulatory-grade scientific discovery via interpretability.',
    narrative_angle: 'Goodfire has already enabled a peer-reviewed scientific discovery through model interpretability — the Alzheimer\'s biomarker work with Prima Mente and Oxford.',
  },
  {
    id: 'sig-deepseek-r2',
    type: 'competitor',
    title: 'DeepSeek Releases R2 Reasoning Model',
    description: 'DeepSeek releases R2, a next-generation open-source reasoning model. Enterprises evaluating R2 need tools to understand its reasoning process and optimize inference costs.',
    source: 'DeepSeek',
    date: '2026-03-22',
    relevance_score: 7,
    matched_capability_ids: ['cap-reasoning-theater', 'cap-reasoning-hood'],
    suggested_action: 'Publish technical analysis of R2 using Reasoning Theater probes. Demonstrate that Goodfire tools work across reasoning model families.',
    narrative_angle: 'New reasoning models mean new reasoning costs. Goodfire\'s probes generalize across model families — proven on DeepSeek R1, ready for R2.',
  },
  {
    id: 'sig-gartner-interp',
    type: 'research',
    title: 'Gartner Publishes AI Interpretability Market Guide',
    description: 'Gartner releases first-ever Market Guide for AI Interpretability, identifying mechanistic interpretability as a distinct category and naming Goodfire as the leading commercial provider.',
    source: 'Gartner',
    date: '2026-03-05',
    relevance_score: 9,
    matched_capability_ids: ['cap-rlfr', 'cap-rakuten-pii', 'cap-model-diff', 'cap-spd'],
    suggested_action: 'Leverage Gartner recognition in all enterprise sales conversations. Update all sales materials to reference the Market Guide positioning.',
    narrative_angle: 'Category-defining moment: Gartner recognizes AI interpretability as a distinct market — and Goodfire as the commercial leader with production deployments.',
  },
  {
    id: 'sig-meta-llama4',
    type: 'competitor',
    title: 'Meta Releases Llama 4 Open-Source Models',
    description: 'Meta releases Llama 4 family including reasoning-capable variants. Massive open-source adoption expected, creating demand for interpretability and safety tools across the Llama ecosystem.',
    source: 'Meta AI',
    date: '2026-03-18',
    relevance_score: 7,
    matched_capability_ids: ['cap-rlfr', 'cap-reasoning-theater', 'cap-memorization'],
    suggested_action: 'Fast-follow with Llama 4 compatibility announcement. Run RLFR and Reasoning Theater benchmarks on Llama 4 variants.',
    narrative_angle: 'Every new open-source model needs interpretability before enterprise deployment. Goodfire is the interpretability layer for the open-source AI ecosystem.',
  },
  {
    id: 'sig-jpmorgan-rfp',
    type: 'prospect',
    title: 'JPMorgan Issues AI Risk Assessment RFP',
    description: 'JPMorgan Chase issues RFP for AI model risk assessment and interpretability tooling across their AI platform. Requirements include SR 11-7 compliance, model auditing, and real-time monitoring.',
    source: 'JPMorgan Procurement',
    date: '2026-03-25',
    relevance_score: 8,
    matched_capability_ids: ['cap-rlfr', 'cap-model-diff', 'cap-rakuten-pii'],
    suggested_action: 'Respond to RFP with comprehensive proposal covering model audit (Model Diff), hallucination reduction (RLFR), and runtime monitoring (SAE probes). Reference Rakuten production deployment.',
    narrative_angle: 'Goodfire offers the only integrated interpretability platform with production-proven model audit, hallucination reduction, and real-time guardrails — exactly what SR 11-7 demands.',
  },
  {
    id: 'sig-nist-rmf-2',
    type: 'regulatory',
    title: 'NIST AI RMF 2.0 Adds Interpretability Requirements',
    description: 'NIST releases AI Risk Management Framework 2.0 with explicit interpretability requirements for high-risk AI systems. Federal agencies and contractors must demonstrate model transparency.',
    source: 'NIST',
    date: '2026-03-12',
    relevance_score: 9,
    matched_capability_ids: ['cap-rlfr', 'cap-model-diff', 'cap-reasoning-hood'],
    suggested_action: 'Reference NIST RMF 2.0 alignment in all US-focused enterprise communications. Target federal contractors and defense sector prospects.',
    narrative_angle: 'NIST now explicitly requires interpretability — Goodfire capabilities map directly to the GOVERN, MAP, and MEASURE functions of the AI RMF.',
  },
  {
    id: 'sig-mayo-genomics',
    type: 'research',
    title: 'Mayo Clinic Publishes Genomic AI Interpretability Study',
    description: 'Mayo Clinic publishes study using interpretability techniques on genomic foundation models for precision medicine, citing Goodfire\'s Evo 2 work as foundational methodology.',
    source: 'Mayo Clinic Proceedings',
    date: '2026-03-08',
    relevance_score: 7,
    matched_capability_ids: ['cap-evo2-tree', 'cap-interpreting-evo2'],
    suggested_action: 'Engage Mayo Clinic and other academic medical centers. Amplify the growing body of evidence that interpretability enables scientific discovery in genomics.',
    narrative_angle: 'From Arc Institute to Mayo Clinic — Goodfire\'s genomic interpretability work is becoming the standard methodology for understanding biological foundation models.',
  },
]

// ─── Hardcoded Prospects ───────────────────────────────────────────────

const PROSPECTS: Prospect[] = [
  {
    id: 'pros-eu-bank',
    name: 'Deutsche Kredit AG',
    industry: 'European Banking',
    estimated_ai_spend: 2_400_000,
    model_families: ['GPT-4', 'Claude 3.5'],
    pain_points: ['EU AI Act compliance deadline', 'SR 11-7 model validation', 'Hallucination risk in customer-facing AI'],
    regulatory_exposure: ['eu_ai_act', 'sr_11_7'],
    priority_score: 92,
  },
  {
    id: 'pros-pharma',
    name: 'Meridian Therapeutics',
    industry: 'Pharmaceutical',
    estimated_ai_spend: 1_800_000,
    model_families: ['Custom genomic models', 'GPT-4'],
    pain_points: ['Drug discovery model transparency', 'FDA AI/ML compliance', 'Biomarker validation'],
    regulatory_exposure: ['fda'],
    priority_score: 87,
  },
  {
    id: 'pros-ai-lab',
    name: 'Frontier Systems',
    industry: 'Frontier AI',
    estimated_ai_spend: 5_000_000,
    model_families: ['Proprietary LLMs'],
    pain_points: ['Reasoning model optimization', 'Safety evaluation at scale', 'Cost of inference'],
    regulatory_exposure: [],
    priority_score: 85,
  },
  {
    id: 'pros-defense',
    name: 'Athena Defense Solutions',
    industry: 'Defense & Intelligence',
    estimated_ai_spend: 3_200_000,
    model_families: ['Classified models'],
    pain_points: ['Model auditability requirements', 'Adversarial robustness', 'Explainability for decision support'],
    regulatory_exposure: ['eu_ai_act'],
    priority_score: 78,
  },
  {
    id: 'pros-healthcare',
    name: 'Pacific Health Network',
    industry: 'Healthcare',
    estimated_ai_spend: 1_200_000,
    model_families: ['Med-PaLM', 'GPT-4'],
    pain_points: ['Clinical AI hallucination risk', 'Patient safety requirements', 'FDA pre-market review'],
    regulatory_exposure: ['fda'],
    priority_score: 83,
  },
  {
    id: 'pros-finserv',
    name: 'Atlas Capital Partners',
    industry: 'Financial Services',
    estimated_ai_spend: 2_800_000,
    model_families: ['GPT-4', 'Claude 3.5', 'Llama 3'],
    pain_points: ['Model risk management under SR 11-7', 'Trading model transparency', 'Regulatory reporting automation'],
    regulatory_exposure: ['sr_11_7'],
    priority_score: 88,
  },
]

// ─── Exported Functions ────────────────────────────────────────────────

export function getAllSignals(): Signal[] {
  return [...SIGNALS].sort((a, b) => b.relevance_score - a.relevance_score)
}

export function getSignalsByType(type: Signal['type']): Signal[] {
  return SIGNALS
    .filter((s) => s.type === type)
    .sort((a, b) => b.relevance_score - a.relevance_score)
}

export function matchSignalToCapabilities(signalId: string): string[] {
  const signal = SIGNALS.find((s) => s.id === signalId)
  return signal ? signal.matched_capability_ids : []
}

export function getAllProspects(): Prospect[] {
  return [...PROSPECTS].sort((a, b) => b.priority_score - a.priority_score)
}
