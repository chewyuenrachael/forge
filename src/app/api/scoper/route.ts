import { NextRequest, NextResponse } from 'next/server'
import { MAX_INPUT_LENGTH, MAX_TEXTAREA_LENGTH } from '@/lib/constants'
import { getAllCapabilities } from '@/lib/knowledge-graph'
import { ensureSeeded } from '@/lib/db'
import type { IntakeFormData, SolutionMatch, SolutionSimulation, ProjectedOutcome, Capability } from '@/types'

const VALID_MODEL_FAMILIES = ['Llama', 'DeepSeek', 'Gemma', 'GPT', 'Claude', 'Proprietary', 'Biological FM', 'Other'] as const
const VALID_MODEL_SIZES = ['<10B', '10-70B', '70B+', 'Unknown'] as const
const VALID_DEPLOYMENT_CONTEXTS = ['Production', 'Pre-deployment', 'Research'] as const
const VALID_SCALES = ['<1M tokens/day', '1-100M', '100M-1B', '1B+'] as const
const VALID_PAIN_POINTS = [
  'Hallucination', 'Bias/Fairness', 'Safety/Jailbreak', 'Compliance/Regulatory',
  'Inference Cost', 'Scientific Discovery', 'Model Quality/Reliability',
] as const
const VALID_REGULATORY = ['EU AI Act', 'SR 11-7 Banking', 'FDA Medical Devices', 'None'] as const
const VALID_TEAM = ['ML Engineers', 'Research Scientists', 'Compliance/Legal', 'Executive Leadership'] as const

const MATCH_LEVEL_ORDER: Record<SolutionMatch['matchLevel'], number> = { high: 0, medium: 1, low: 2 }
const READINESS_ORDER: Record<Capability['readiness'], number> = { production: 0, demo: 1, research: 2 }

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function isValidOption(value: string, options: readonly string[]): boolean {
  return (options as readonly string[]).includes(value)
}

function validateIntake(body: unknown): { valid: true; data: IntakeFormData } | { valid: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Request body must be an object' }
  }

  const obj = body as Record<string, unknown>

  if (typeof obj['partnerName'] !== 'string' || obj['partnerName'].trim().length === 0) {
    return { valid: false, error: 'Partner name is required' }
  }
  if (obj['partnerName'].length > MAX_INPUT_LENGTH) {
    return { valid: false, error: 'Partner name exceeds maximum length' }
  }

  if (typeof obj['modelFamily'] !== 'string' || !isValidOption(obj['modelFamily'], VALID_MODEL_FAMILIES)) {
    return { valid: false, error: 'Invalid model family' }
  }
  if (typeof obj['modelSize'] !== 'string' || !isValidOption(obj['modelSize'], VALID_MODEL_SIZES)) {
    return { valid: false, error: 'Invalid model size' }
  }
  if (typeof obj['deploymentContext'] !== 'string' || !isValidOption(obj['deploymentContext'], VALID_DEPLOYMENT_CONTEXTS)) {
    return { valid: false, error: 'Invalid deployment context' }
  }
  if (typeof obj['scale'] !== 'string' || !isValidOption(obj['scale'], VALID_SCALES)) {
    return { valid: false, error: 'Invalid scale' }
  }

  if (!isStringArray(obj['painPoints']) || obj['painPoints'].length === 0) {
    return { valid: false, error: 'At least one pain point is required' }
  }
  for (const pp of obj['painPoints']) {
    if (!isValidOption(pp, VALID_PAIN_POINTS)) {
      return { valid: false, error: `Invalid pain point: ${pp}` }
    }
  }

  if (!isStringArray(obj['regulatoryExposure'])) {
    return { valid: false, error: 'Regulatory exposure must be an array' }
  }
  for (const re of obj['regulatoryExposure']) {
    if (!isValidOption(re, VALID_REGULATORY)) {
      return { valid: false, error: `Invalid regulatory exposure: ${re}` }
    }
  }

  if (!isStringArray(obj['teamComposition'])) {
    return { valid: false, error: 'Team composition must be an array' }
  }
  for (const tc of obj['teamComposition']) {
    if (!isValidOption(tc, VALID_TEAM)) {
      return { valid: false, error: `Invalid team composition: ${tc}` }
    }
  }

  const additionalContext = typeof obj['additionalContext'] === 'string' ? obj['additionalContext'] : ''
  if (additionalContext.length > MAX_TEXTAREA_LENGTH) {
    return { valid: false, error: 'Additional context exceeds maximum length' }
  }

  return {
    valid: true,
    data: {
      partnerName: (obj['partnerName'] as string).trim(),
      modelFamily: obj['modelFamily'] as string,
      modelSize: obj['modelSize'] as string,
      deploymentContext: obj['deploymentContext'] as string,
      painPoints: obj['painPoints'] as string[],
      regulatoryExposure: obj['regulatoryExposure'] as string[],
      teamComposition: obj['teamComposition'] as string[],
      scale: obj['scale'] as string,
      additionalContext,
    },
  }
}

interface RawMatch {
  capabilityId: string
  matchLevel: SolutionMatch['matchLevel']
  rationale: string
  estimatedTimeline: string
}

function matchCapabilities(intake: IntakeFormData, capabilities: Capability[]): SolutionMatch[] {
  const capMap = new Map<string, Capability>()
  for (const cap of capabilities) {
    capMap.set(cap.id, cap)
  }

  const rawMatches: RawMatch[] = []
  const isResearch = intake.deploymentContext === 'Research'
  const isBiological = intake.modelFamily === 'Biological FM'
  const hasEuOrSr = intake.regulatoryExposure.some((r) => r === 'EU AI Act' || r === 'SR 11-7 Banking')

  for (const painPoint of intake.painPoints) {
    switch (painPoint) {
      case 'Hallucination': {
        const rlfrLevel = (intake.modelFamily === 'Gemma' || intake.modelFamily === 'Llama') ? 'high' : 'medium'
        rawMatches.push({
          capabilityId: 'cap-rlfr',
          matchLevel: rlfrLevel,
          rationale: rlfrLevel === 'high'
            ? 'RLFR achieves 58% hallucination reduction on similar architecture (Gemma 12B). Direct applicability to your model family.'
            : 'RLFR achieves 58% hallucination reduction. Technique generalizes across architectures with adaptation.',
          estimatedTimeline: '4-8 weeks',
        })
        rawMatches.push({
          capabilityId: 'cap-model-diff',
          matchLevel: 'medium',
          rationale: 'Model Diff Amplification surfaces rare hallucination artifacts from post-training at 1-in-a-million sensitivity.',
          estimatedTimeline: '3-5 weeks',
        })
        break
      }
      case 'Inference Cost': {
        const rtLevel = (intake.modelFamily === 'DeepSeek' || intake.modelFamily === 'GPT') ? 'high' : 'low'
        rawMatches.push({
          capabilityId: 'cap-reasoning-theater',
          matchLevel: rtLevel,
          rationale: rtLevel === 'high'
            ? 'Reasoning Theater achieves 68% token savings via early exit probes. Tested directly on this model family.'
            : 'Reasoning Theater achieves 68% token savings. Requires probe training on target architecture.',
          estimatedTimeline: rtLevel === 'high' ? '3-6 weeks' : '8-12 weeks',
        })
        break
      }
      case 'Compliance/Regulatory': {
        rawMatches.push({
          capabilityId: 'cap-rlfr',
          matchLevel: hasEuOrSr ? 'high' : 'medium',
          rationale: hasEuOrSr
            ? 'RLFR provides auditable model behavior modification with traceable interpretability features, directly addressing regulatory transparency requirements.'
            : 'RLFR provides auditable model behavior modification with traceable interpretability features for compliance documentation.',
          estimatedTimeline: '6-10 weeks',
        })
        rawMatches.push({
          capabilityId: 'cap-rakuten-pii',
          matchLevel: 'medium',
          rationale: 'Production-proven runtime monitoring deployed across 44M+ users, providing real-time compliance guardrails for PII and safety.',
          estimatedTimeline: '4-8 weeks',
        })
        break
      }
      case 'Safety/Jailbreak': {
        rawMatches.push({
          capabilityId: 'cap-rakuten-pii',
          matchLevel: 'high',
          rationale: 'SAE-feature probes detect PII, jailbreak attempts, and toxicity with sub-millisecond overhead, proven at Rakuten scale (44M+ users).',
          estimatedTimeline: '4-6 weeks',
        })
        rawMatches.push({
          capabilityId: 'cap-model-diff',
          matchLevel: 'medium',
          rationale: 'Surfaces adversarial vulnerabilities and reward hacking artifacts at 1-in-a-million sensitivity.',
          estimatedTimeline: '3-5 weeks',
        })
        if (isResearch) {
          rawMatches.push({
            capabilityId: 'cap-spd',
            matchLevel: 'medium',
            rationale: 'Scalable Parameter Decomposition enables surgical understanding of safety-relevant weight components.',
            estimatedTimeline: '8-12 weeks',
          })
        }
        break
      }
      case 'Bias/Fairness': {
        rawMatches.push({
          capabilityId: 'cap-model-diff',
          matchLevel: 'high',
          rationale: 'Model Diff Amplification directly detects biases introduced or amplified during post-training at extreme sensitivity.',
          estimatedTimeline: '3-5 weeks',
        })
        if (isResearch) {
          rawMatches.push({
            capabilityId: 'cap-memorization',
            matchLevel: 'medium',
            rationale: 'Loss curvature analysis disentangles memorized biases from generalized reasoning patterns.',
            estimatedTimeline: '6-10 weeks',
          })
        }
        break
      }
      case 'Scientific Discovery': {
        rawMatches.push({
          capabilityId: 'cap-alzheimers',
          matchLevel: isBiological ? 'high' : 'low',
          rationale: isBiological
            ? 'Proven scientific discovery via model reverse-engineering: discovered novel Alzheimer\'s biomarker class. Directly applicable to biological FM.'
            : 'Methodology demonstrated on biological FM (Pleiades). Adaptation required for non-biological models.',
          estimatedTimeline: isBiological ? '8-12 weeks' : '12-16 weeks',
        })
        rawMatches.push({
          capabilityId: 'cap-evo2-tree',
          matchLevel: isBiological ? 'high' : 'medium',
          rationale: isBiological
            ? 'Found phylogenetic structure in Evo 2 genomic FM. Directly applicable to biological foundation model interpretation.'
            : 'Phylogenetic structure discovery methodology applicable to understanding learned representations in any FM.',
          estimatedTimeline: isBiological ? '6-10 weeks' : '10-14 weeks',
        })
        if (isBiological) {
          rawMatches.push({
            capabilityId: 'cap-interpreting-evo2',
            matchLevel: 'medium',
            rationale: 'Applied interpretability to Arc Institute\'s next-gen genomic FM, revealing biological knowledge representation.',
            estimatedTimeline: '8-12 weeks',
          })
        }
        break
      }
      case 'Model Quality/Reliability': {
        rawMatches.push({
          capabilityId: 'cap-rlfr',
          matchLevel: 'high',
          rationale: 'RLFR improves model output quality by 58% hallucination reduction across 8 domains, at 90x lower cost than LLM-as-judge.',
          estimatedTimeline: '4-8 weeks',
        })
        if (isResearch) {
          rawMatches.push({
            capabilityId: 'cap-memorization',
            matchLevel: 'medium',
            rationale: 'Removing memorization weights improves reasoning performance — surgical model quality improvement.',
            estimatedTimeline: '8-12 weeks',
          })
          rawMatches.push({
            capabilityId: 'cap-reasoning-hood',
            matchLevel: 'medium',
            rationale: 'Internal analysis of reasoning model mechanisms enables targeted quality improvements.',
            estimatedTimeline: '6-10 weeks',
          })
        }
        break
      }
    }
  }

  // Deduplicate: keep highest match level per capability
  const bestMatch = new Map<string, RawMatch>()
  for (const match of rawMatches) {
    const existing = bestMatch.get(match.capabilityId)
    if (!existing || MATCH_LEVEL_ORDER[match.matchLevel] < MATCH_LEVEL_ORDER[existing.matchLevel]) {
      bestMatch.set(match.capabilityId, match)
    }
  }

  // Build SolutionMatch[] and sort
  const results: SolutionMatch[] = []
  for (const [capId, match] of Array.from(bestMatch)) {
    const capability = capMap.get(capId)
    if (capability) {
      results.push({
        capability,
        matchLevel: match.matchLevel,
        rationale: match.rationale,
        estimatedTimeline: match.estimatedTimeline,
      })
    }
  }

  results.sort((a, b) => {
    const levelDiff = MATCH_LEVEL_ORDER[a.matchLevel] - MATCH_LEVEL_ORDER[b.matchLevel]
    if (levelDiff !== 0) return levelDiff
    return READINESS_ORDER[a.capability.readiness] - READINESS_ORDER[b.capability.readiness]
  })

  return results
}

function generateSimulation(intake: IntakeFormData, matches: SolutionMatch[]): SolutionSimulation {
  const outcomes: ProjectedOutcome[] = []

  for (const match of matches) {
    switch (match.capability.id) {
      case 'cap-rlfr':
        outcomes.push({
          metric: 'Hallucination Reduction',
          estimate: match.matchLevel === 'high' ? '40-58%' : '31-45%',
          confidence: match.matchLevel === 'low' ? 'low' : match.matchLevel,
          basis: 'Prasad et al., Feb 2026 — 58% on Gemma 12B (best-of-32), 31% without test-time interventions',
        })
        break
      case 'cap-reasoning-theater':
        outcomes.push({
          metric: 'Inference Cost Reduction',
          estimate: match.matchLevel === 'high' ? '50-68%' : '30-50%',
          confidence: match.matchLevel === 'low' ? 'low' : match.matchLevel,
          basis: 'Boppana et al., Mar 2026 — 68% on MMLU, 30% on GPQA-Diamond at 95% probe confidence',
        })
        break
      case 'cap-rakuten-pii':
        outcomes.push({
          metric: 'Runtime Safety Coverage',
          estimate: 'Sub-millisecond overhead at 44M+ user scale',
          confidence: 'high',
          basis: 'Nguyen et al., Oct 2025 — production deployment at Rakuten',
        })
        break
      case 'cap-model-diff':
        outcomes.push({
          metric: 'Rare Behavior Detection',
          estimate: '1-in-1,000,000 sensitivity',
          confidence: 'medium',
          basis: 'Aranguri & McGrath, Aug 2025 — logit diff amplification for rare behaviors',
        })
        break
      case 'cap-alzheimers':
        outcomes.push({
          metric: 'Biomarker Discovery Potential',
          estimate: match.matchLevel === 'high' ? 'Novel biomarker class discovery' : 'Exploratory interpretability analysis',
          confidence: match.matchLevel === 'low' ? 'low' : match.matchLevel,
          basis: 'Wang et al., Jan 2026 — validated on independent cohort with Prima Mente & Oxford',
        })
        break
      case 'cap-evo2-tree':
        outcomes.push({
          metric: 'Biological Model Understanding',
          estimate: 'Phylogenetic structure extraction',
          confidence: match.matchLevel === 'low' ? 'low' : match.matchLevel,
          basis: 'Pearce et al., Aug 2025 — Arc Institute partnership',
        })
        break
      case 'cap-interpreting-evo2':
        outcomes.push({
          metric: 'Genomic Model Interpretation',
          estimate: 'Biological knowledge representation mapping',
          confidence: match.matchLevel === 'low' ? 'low' : match.matchLevel,
          basis: 'Gorton et al., Feb 2025 — Arc Institute Evo 2 analysis',
        })
        break
      case 'cap-memorization':
        outcomes.push({
          metric: 'Model Efficiency',
          estimate: 'Surgical weight removal for reasoning improvement',
          confidence: 'low',
          basis: 'Merullo et al., Nov 2025 — loss curvature analysis',
        })
        break
      case 'cap-spd':
        outcomes.push({
          metric: 'Weight Interpretability',
          estimate: 'Component-level model understanding',
          confidence: 'low',
          basis: 'Bushnaq et al., Jun 2025 — weight decomposition',
        })
        break
      case 'cap-reasoning-hood':
        outcomes.push({
          metric: 'Reasoning Mechanism Analysis',
          estimate: 'Chain-of-thought mechanism mapping',
          confidence: 'low',
          basis: 'Hazra et al., Apr 2025 — DeepSeek R1 internal analysis',
        })
        break
    }
  }

  // Engagement cost calculation
  let costLow = 75_000
  let costHigh = 200_000
  for (const match of matches) {
    if (match.matchLevel === 'high') {
      costLow += 25_000
      costHigh += 50_000
    } else if (match.matchLevel === 'medium') {
      costLow += 10_000
      costHigh += 25_000
    }
  }
  costLow = Math.min(costLow, 500_000)
  costHigh = Math.min(costHigh, 2_000_000)

  // Timeline: parse the longest timeline from matches
  let maxWeeks = 0
  for (const match of matches) {
    const weekMatch = match.estimatedTimeline.match(/(\d+)\s*weeks?$/i)
    if (weekMatch?.[1]) {
      const weeks = parseInt(weekMatch[1], 10)
      if (weeks > maxWeeks) maxWeeks = weeks
    }
  }
  const minWeeks = Math.max(Math.floor(maxWeeks * 0.6), 4)
  const timeline = `${minWeeks}-${maxWeeks} weeks`

  // Team requirements
  const teamRequirements: string[] = ['Goodfire interpretability engineer']
  const hasProduction = matches.some((m) => m.capability.readiness === 'production')
  if (hasProduction) {
    teamRequirements.push('Partner ML/platform engineer for integration')
  }
  if (intake.painPoints.includes('Compliance/Regulatory')) {
    teamRequirements.push('Compliance/legal stakeholder for audit framework')
  }
  if (intake.deploymentContext === 'Research') {
    teamRequirements.push('Research scientist for methodology validation')
  }
  if (intake.teamComposition.includes('ML Engineers')) {
    teamRequirements.push('Partner ML engineering team for model access and evaluation')
  }
  if (intake.teamComposition.includes('Executive Leadership')) {
    teamRequirements.push('Executive sponsor for milestone sign-off')
  }

  return {
    outcomes,
    engagementCost: { low: costLow, high: costHigh },
    timeline,
    teamRequirements,
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json()

    const validation = validateIntake(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    ensureSeeded()
    const capabilities = getAllCapabilities()
    const matches = matchCapabilities(validation.data, capabilities)
    const simulation = generateSimulation(validation.data, matches)

    return NextResponse.json({ data: { matches, simulation } })
  } catch (error) {
    console.error('Scoper API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
