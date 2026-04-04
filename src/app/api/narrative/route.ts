import { NextRequest, NextResponse } from 'next/server'
import { MAX_TEXTAREA_LENGTH } from '@/lib/constants'
import type { Signal, ContentCalendarItem } from '@/types'

interface NarrativeAPIResponse {
  signals: Signal[]
  calendarItems: ContentCalendarItem[]
}

const DISCOURSE_SIGNALS: Signal[] = [
  {
    id: 'sig-anthropic-claude4', type: 'research',
    title: 'Anthropic publishes Claude 4 circuit tracing results',
    description: 'Anthropic releases detailed circuit tracing analysis of Claude 4, validating probe-based interpretability approaches at frontier model scale.',
    source: 'Anthropic Blog', date: '2026-03-28', relevance_score: 92,
    matched_capability_ids: ['cap-reasoning-theater'],
    suggested_action: 'Publish response highlighting Goodfire production extension',
    narrative_angle: 'Anthropic validates probe-based approach; Goodfire extends it to production with 68% inference savings',
    source_url: null, urgency_score: 70, coverage_score: 50, novelty_score: 100, actionability_score: 80,
    matched_prospect_ids: [], peer_cluster_ids: [], status: 'active' as const, feedback: null, created_at: '2026-03-28',
  },
  {
    id: 'sig-eu-cenelec', type: 'regulatory',
    title: 'EU AI Act implementing regulations draft released by CEN/CENELEC',
    description: 'CEN/CENELEC publishes draft implementing regulations for the EU AI Act, with specific technical standards for Article 13 transparency requirements.',
    source: 'EU Official Journal', date: '2026-03-25', relevance_score: 96,
    matched_capability_ids: ['cap-rlfr', 'cap-rakuten-pii', 'cap-model-diff'],
    suggested_action: 'Position mechanistic interpretability as the compliance standard',
    narrative_angle: 'Ambiguity in Article 13 transparency definition = window to position mechanistic interpretability as the standard',
    source_url: null, urgency_score: 70, coverage_score: 50, novelty_score: 100, actionability_score: 80,
    matched_prospect_ids: [], peer_cluster_ids: [], status: 'active' as const, feedback: null, created_at: '2026-03-25',
  },
  {
    id: 'sig-openai-o3', type: 'competitor',
    title: 'OpenAI announces 40% o3 inference cost reduction',
    description: 'OpenAI reveals architectural optimizations that reduce o3 reasoning model inference costs by 40%, intensifying competition on reasoning model economics.',
    source: 'OpenAI Blog', date: '2026-03-22', relevance_score: 90,
    matched_capability_ids: ['cap-reasoning-theater'],
    suggested_action: 'Publish comparison: architecture optimization vs interpretability-guided early exit',
    narrative_angle: 'Architecture optimization vs interpretability-guided early exit: fundamentally different approaches, Goodfire achieves 68% without architecture changes',
    source_url: null, urgency_score: 70, coverage_score: 50, novelty_score: 100, actionability_score: 80,
    matched_prospect_ids: [], peer_cluster_ids: [], status: 'active' as const, feedback: null, created_at: '2026-03-22',
  },
  {
    id: 'sig-nature-medicine', type: 'research',
    title: 'Nature Medicine: Editorial on AI transparency in clinical AI',
    description: 'Nature Medicine publishes editorial calling for mechanistic transparency in clinical AI systems, citing growing regulatory pressure and patient safety concerns.',
    source: 'Nature Medicine', date: '2026-03-18', relevance_score: 85,
    matched_capability_ids: ['cap-alzheimers'],
    suggested_action: 'Amplify Alzheimer\'s biomarker discovery as proof of clinical-grade interpretability',
    narrative_angle: 'Goodfire has the only published result of scientific discovery via model reverse-engineering',
    source_url: null, urgency_score: 70, coverage_score: 50, novelty_score: 100, actionability_score: 80,
    matched_prospect_ids: [], peer_cluster_ids: [], status: 'active' as const, feedback: null, created_at: '2026-03-18',
  },
  {
    id: 'sig-deepseek-r2', type: 'competitor',
    title: 'DeepSeek releases R2 with extended reasoning chains',
    description: 'DeepSeek launches R2 with significantly longer reasoning chains, increasing token consumption for reasoning workloads across the industry.',
    source: 'DeepSeek Blog', date: '2026-03-15', relevance_score: 88,
    matched_capability_ids: ['cap-reasoning-theater'],
    suggested_action: 'Position Reasoning Theater as essential cost control for extended reasoning',
    narrative_angle: 'Longer CoT = more performative tokens = more savings opportunity for Reasoning Theater probes',
    source_url: null, urgency_score: 70, coverage_score: 50, novelty_score: 100, actionability_score: 80,
    matched_prospect_ids: [], peer_cluster_ids: [], status: 'active' as const, feedback: null, created_at: '2026-03-15',
  },
  {
    id: 'sig-gartner-interp', type: 'research',
    title: 'Gartner announces first AI Interpretability Market Guide',
    description: 'Gartner publishes its inaugural Market Guide for AI Interpretability, formally recognizing mechanistic interpretability as a distinct enterprise software category.',
    source: 'Gartner', date: '2026-03-10', relevance_score: 94,
    matched_capability_ids: ['cap-rlfr'],
    suggested_action: 'Ensure Goodfire is positioned as the defining vendor in the category',
    narrative_angle: 'Category crystallization moment. Goodfire must be positioned as the defining vendor.',
    source_url: null, urgency_score: 70, coverage_score: 50, novelty_score: 100, actionability_score: 80,
    matched_prospect_ids: [], peer_cluster_ids: [], status: 'active' as const, feedback: null, created_at: '2026-03-10',
  },
  {
    id: 'sig-meta-llama4', type: 'competitor',
    title: 'Meta open-sources Llama 4 400B',
    description: 'Meta releases Llama 4 400B as open-source, creating new demand for interpretability tooling across the open-source model ecosystem.',
    source: 'Meta AI Blog', date: '2026-03-05', relevance_score: 82,
    matched_capability_ids: ['cap-rlfr'],
    suggested_action: 'Demonstrate SAE and RLFR capabilities on Llama 4 architecture',
    narrative_angle: 'New model = new SAEs needed = new steering/surgery opportunities for partners',
    source_url: null, urgency_score: 70, coverage_score: 50, novelty_score: 100, actionability_score: 80,
    matched_prospect_ids: [], peer_cluster_ids: [], status: 'active' as const, feedback: null, created_at: '2026-03-05',
  },
  {
    id: 'sig-nist-rmf2', type: 'regulatory',
    title: 'NIST releases AI RMF 2.0 with explicit interpretability section',
    description: 'NIST publishes AI Risk Management Framework 2.0, including a dedicated section on mechanistic interpretability as a risk mitigation strategy.',
    source: 'NIST', date: '2026-03-01', relevance_score: 91,
    matched_capability_ids: ['cap-rlfr', 'cap-model-diff'],
    suggested_action: 'Reference NIST alignment in US-focused compliance messaging',
    narrative_angle: 'US regulatory body endorses interpretability. Demand signal for Shield/compliance products.',
    source_url: null, urgency_score: 70, coverage_score: 50, novelty_score: 100, actionability_score: 80,
    matched_prospect_ids: [], peer_cluster_ids: [], status: 'active' as const, feedback: null, created_at: '2026-03-01',
  },
]

const CALENDAR_ITEMS: ContentCalendarItem[] = [
  { id: 'cc-alz', date: '2026-01-28', type: 'research', title: "Alzheimer's Biomarkers paper published", description: 'Wang et al. — first scientific discovery via model reverse-engineering.', signal_id: null, capability_ids: [], status: 'published' as const },
  { id: 'cc-series-b', date: '2026-02-05', type: 'research', title: 'Series B announcement', description: 'Goodfire Series B funding round announced.', signal_id: null, capability_ids: [], status: 'published' as const },
  { id: 'cc-rlfr', date: '2026-02-11', type: 'research', title: 'RLFR paper published', description: 'Prasad et al. — 58% hallucination reduction via interpretability features as rewards.', signal_id: null, capability_ids: [], status: 'published' as const },
  { id: 'cc-fellowship', date: '2026-02-25', type: 'research', title: 'Fellowship program announced', description: 'Goodfire interpretability research fellowship program launched.', signal_id: null, capability_ids: [], status: 'published' as const },
  { id: 'cc-rt', date: '2026-03-12', type: 'research', title: 'Reasoning Theater paper published', description: 'Boppana et al. — 68% token savings via performative reasoning detection.', signal_id: null, capability_ids: [], status: 'published' as const },
  { id: 'cc-eu-deadline', date: '2026-08-02', type: 'regulatory', title: 'EU AI Act high-risk provisions effective', description: 'Article 13 transparency requirements become enforceable for high-risk AI systems.', signal_id: null, capability_ids: [], status: 'scheduled' as const },
  { id: 'cc-rlfr-blog', date: '2026-04-08', type: 'suggested', title: 'RLFR case study blog', description: 'Suggested: publish case study on RLFR hallucination reduction results.', signal_id: null, capability_ids: [], status: 'suggested' as const },
  { id: 'cc-rt-roi', date: '2026-04-15', type: 'suggested', title: 'Reasoning Theater ROI analysis', description: 'Suggested: publish ROI analysis of reasoning model cost optimization.', signal_id: null, capability_ids: [], status: 'suggested' as const },
  { id: 'cc-eu-guide', date: '2026-04-22', type: 'suggested', title: 'EU AI Act compliance guide', description: 'Suggested: publish technical guide mapping interpretability to Article 13.', signal_id: null, capability_ids: [], status: 'suggested' as const },
  { id: 'cc-sr117', date: '2026-04-01', type: 'regulatory', title: 'SR 11-7 Compliance for LLMs guide', description: 'Technical guide for banking compliance teams on model risk management.', signal_id: null, capability_ids: [], status: 'published' as const },
  { id: 'cc-whitepaper', date: '2026-04-15', type: 'regulatory', title: 'EU AI Act compliance whitepaper', description: 'Whitepaper mapping Goodfire capabilities to Article 13 requirements.', signal_id: null, capability_ids: [], status: 'scheduled' as const },
  { id: 'cc-neurips', date: '2026-05-15', type: 'conference', title: 'NeurIPS 2026 paper submissions', description: 'Deadline for NeurIPS 2026 interpretability track submissions.', signal_id: null, capability_ids: [], status: 'scheduled' as const },
]

export async function GET(): Promise<NextResponse<{ data: NarrativeAPIResponse } | { error: string; code: string }>> {
  try {
    return NextResponse.json({ data: { signals: DISCOURSE_SIGNALS, calendarItems: CALENDAR_ITEMS } })
  } catch (error) {
    console.error('Narrative API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { topic: string; audience: string }

    if (typeof body.topic !== 'string' || typeof body.audience !== 'string') {
      return NextResponse.json(
        { error: 'Missing topic or audience field', code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    if (body.topic.length > MAX_TEXTAREA_LENGTH) {
      return NextResponse.json(
        { error: 'Topic exceeds maximum length', code: 'INPUT_TOO_LONG' },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: { status: 'ok', message: 'Narrative endpoint ready' } })
  } catch (error) {
    console.error('Narrative API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
