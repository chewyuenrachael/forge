import type { ROIInput, ROIResult, SavingsLine } from '@/types'

export function calculateROI(input: ROIInput): ROIResult {
  // ─── Hallucination Savings ─────────────────────────────────────────
  // RLFR: 58% hallucination reduction (Prasad et al., Feb 2026)
  // Downstream cost multiplier (2.5x) accounts for rework, trust damage, human review
  const hallucinationReductionRate = 0.58
  const estimatedHallucinationCost =
    input.monthlyAnnotationSpend * (input.currentHallucinationRate / 100) * 2.5
  const monthlyHallucinationSaving = estimatedHallucinationCost * hallucinationReductionRate

  const hallucinationSavings: SavingsLine = {
    category: 'Hallucination Reduction',
    before: estimatedHallucinationCost * 12,
    after: (estimatedHallucinationCost - monthlyHallucinationSaving) * 12,
    annualSaving: monthlyHallucinationSaving * 12,
    method: 'RLFR: Interpretability features as reward signals for RL training',
    benchmark: '58% hallucination reduction on Gemma 12B (best-of-32)',
    source: 'Prasad et al., Feb 2026 — RLFR: 58% hallucination reduction on Gemma 12B across 8 domains',
  }

  // ─── Inference Savings ─────────────────────────────────────────────
  // Reasoning Theater: 68% token savings on MMLU, 30% on GPQA-Diamond
  // Conservative blend: 0.45 (weighted average assuming mix of easy and hard tasks)
  let monthlyInferenceSaving = 0
  let inferenceBefore = 0
  let inferenceMethod = 'Not applicable — partner does not use reasoning models'
  let inferenceBenchmark = ''
  let inferenceSource = ''

  if (input.usesReasoningModels && input.monthlyReasoningTokens > 0 && input.monthlyInferenceSpend > 0) {
    const conservativeBlend = 0.45
    const proportionReasoning = Math.min(input.monthlyReasoningTokens / input.monthlyInferenceSpend, 1)
    inferenceBefore = input.monthlyInferenceSpend * proportionReasoning
    monthlyInferenceSaving = inferenceBefore * conservativeBlend
    inferenceMethod = 'Reasoning Theater: Probe-guided early exit at 95% confidence'
    inferenceBenchmark = '68% token savings on MMLU, 30% on GPQA-Diamond'
    inferenceSource = 'Boppana et al., Mar 2026 — Reasoning Theater: 68% savings on MMLU, 30% on GPQA-Diamond via probe-guided early exit'
  }

  const inferenceSavings: SavingsLine = {
    category: 'Inference Optimization',
    before: inferenceBefore * 12,
    after: (inferenceBefore - monthlyInferenceSaving) * 12,
    annualSaving: monthlyInferenceSaving * 12,
    method: inferenceMethod,
    benchmark: inferenceBenchmark,
    source: inferenceSource,
  }

  // ─── Annotation Savings ────────────────────────────────────────────
  // RLFR probes are 90x cheaper per intervention than LLM-as-judge
  // Reduction: (1 - 1/90) ≈ 98.9% cost reduction when replacing LLM-as-judge
  const annotationReductionRate = 1 - 1 / 90
  const monthlyAnnotationSaving = input.monthlyAnnotationSpend * annotationReductionRate

  const annotationSavings: SavingsLine = {
    category: 'Annotation Cost',
    before: input.monthlyAnnotationSpend * 12,
    after: (input.monthlyAnnotationSpend - monthlyAnnotationSaving) * 12,
    annualSaving: monthlyAnnotationSaving * 12,
    method: 'RLFR probes replace LLM-as-judge annotation at 90x lower cost per intervention',
    benchmark: '90x cheaper per intervention than LLM-as-judge',
    source: 'Prasad et al., Feb 2026 — RLFR probes are 90x cheaper per intervention than LLM-as-judge',
  }

  // ─── Guardrail Savings ─────────────────────────────────────────────
  // Feature-based probes replace external guardrail models
  // Conservative 40% saving (probes are faster but require initial setup investment)
  const guardrailReductionRate = 0.40
  const monthlyGuardrailSaving = input.monthlyGuardrailSpend * guardrailReductionRate

  const guardrailSavings: SavingsLine = {
    category: 'Guardrail Efficiency',
    before: input.monthlyGuardrailSpend * 12,
    after: (input.monthlyGuardrailSpend - monthlyGuardrailSaving) * 12,
    annualSaving: monthlyGuardrailSaving * 12,
    method: 'SAE-feature probes replace external guardrail models with sub-ms overhead',
    benchmark: 'Production-proven at 44M+ users with sub-millisecond inference overhead',
    source: 'Nguyen et al., Oct 2025 — Rakuten PII detection: SAE probes deployed at 44M+ users with sub-ms overhead',
  }

  // ─── Compliance Value ──────────────────────────────────────────────
  const riskReductions: string[] = []
  for (const exposure of input.regulatoryExposure) {
    if (exposure === 'eu_ai_act') {
      riskReductions.push('Article 13 transparency compliance — fines up to \u20AC20M or 4% of global turnover')
    } else if (exposure === 'sr_11_7') {
      riskReductions.push('SR 11-7 model risk documentation and validation')
    } else if (exposure === 'fda') {
      riskReductions.push('FDA AI/ML guidance compliance for medical devices and drug discovery')
    }
  }

  const riskReduction = riskReductions.length > 0
    ? riskReductions.join('; ')
    : 'No immediate regulatory exposure identified'

  let urgency: string
  if (input.complianceDeadlineMonths <= 6) {
    urgency = 'Critical: compliance deadline within 6 months — immediate action required'
  } else if (input.complianceDeadlineMonths <= 12) {
    urgency = 'High: compliance deadline within 12 months — begin planning now'
  } else {
    urgency = 'Standard: plan for compliance ahead of deadlines'
  }

  const complianceValue = { riskReduction, urgency }

  // ─── Totals ────────────────────────────────────────────────────────
  const savings: SavingsLine[] = [hallucinationSavings, inferenceSavings, annotationSavings, guardrailSavings]

  const totalAnnualSaving = savings.reduce((sum, s) => sum + s.annualSaving, 0)
  const estimatedEngagementCost = { low: 75_000, high: 350_000 }

  // Conservative ROI: divide by high-end engagement cost
  const roi = estimatedEngagementCost.high > 0
    ? totalAnnualSaving / estimatedEngagementCost.high
    : 0

  return {
    savings,
    complianceValue,
    totalAnnualSaving,
    estimatedEngagementCost,
    roi,
  }
}
