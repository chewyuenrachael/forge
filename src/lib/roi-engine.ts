import type { ROIInput, ROIResult, SavingsLine } from '@/types'

export function calculateROI(input: ROIInput): ROIResult {
  // RLFR hallucination reduction: 58% reduction (Prasad et al., Feb 2026)
  const hallucinationReductionRate = 0.58
  const hallucinationCostFactor = input.currentHallucinationRate / 100
  const hallucinationSavings: SavingsLine = {
    before: input.monthlyInferenceSpend * hallucinationCostFactor * 12,
    after: input.monthlyInferenceSpend * hallucinationCostFactor * (1 - hallucinationReductionRate) * 12,
    annualSaving: input.monthlyInferenceSpend * hallucinationCostFactor * hallucinationReductionRate * 12,
    method: 'RLFR: Feature-based reward signals for RL reduce hallucination rate',
    benchmark: '58% hallucination reduction on Gemma 12B (best-of-32)',
    source: 'Prasad et al., "Features as Rewards", Feb 2026',
  }

  // Reasoning Theater: 68% token savings on reasoning models (Boppana et al., Mar 2026)
  const reasoningTokenSavingsRate = input.usesReasoningModels ? 0.68 : 0
  const monthlyReasoningCost = input.usesReasoningModels ? input.monthlyReasoningTokens : 0
  const inferenceSavings: SavingsLine = {
    before: monthlyReasoningCost * 12,
    after: monthlyReasoningCost * (1 - reasoningTokenSavingsRate) * 12,
    annualSaving: monthlyReasoningCost * reasoningTokenSavingsRate * 12,
    method: 'Reasoning Theater: Early exit via attention probes at 95% confidence',
    benchmark: '68% token savings on MMLU, 30% on GPQA-Diamond',
    source: 'Boppana et al., "Reasoning Theater", Mar 2026',
  }

  // Annotation savings from RLFR (90x cheaper than LLM-as-judge)
  const annotationReductionRate = 0.80
  const annotationSavings: SavingsLine = {
    before: input.monthlyAnnotationSpend * 12,
    after: input.monthlyAnnotationSpend * (1 - annotationReductionRate) * 12,
    annualSaving: input.monthlyAnnotationSpend * annotationReductionRate * 12,
    method: 'RLFR probes replace LLM-as-judge annotation at 90x lower cost',
    benchmark: '90x cheaper per intervention than LLM-as-judge',
    source: 'Prasad et al., "Features as Rewards", Feb 2026',
  }

  // Guardrail savings from SAE probes (Rakuten-proven)
  const guardrailReductionRate = 0.60
  const guardrailSavings: SavingsLine = {
    before: input.monthlyGuardrailSpend * 12,
    after: input.monthlyGuardrailSpend * (1 - guardrailReductionRate) * 12,
    annualSaving: input.monthlyGuardrailSpend * guardrailReductionRate * 12,
    method: 'SAE-feature probes replace separate guardrail models with sub-ms overhead',
    benchmark: 'Sub-millisecond inference overhead, deployed across 44M+ users',
    source: 'Nguyen et al., "SAE Probes for PII Detection", Oct 2025',
  }

  // Compliance value assessment
  const hasRegulatory = input.regulatoryExposure.some(r => r !== 'none')
  const complianceValue = {
    riskReduction: hasRegulatory
      ? 'Interpretability provides audit-ready model transparency for regulatory compliance'
      : 'No immediate regulatory exposure identified',
    urgency: input.complianceDeadlineMonths <= 6
      ? 'Critical: compliance deadline within 6 months'
      : input.complianceDeadlineMonths <= 12
        ? 'High: compliance deadline within 12 months'
        : 'Standard: plan for compliance ahead of deadlines',
  }

  const totalAnnualSaving =
    hallucinationSavings.annualSaving +
    inferenceSavings.annualSaving +
    annotationSavings.annualSaving +
    guardrailSavings.annualSaving

  const estimatedEngagementCost = {
    low: 250_000,
    high: 750_000,
  }

  const roi = estimatedEngagementCost.low > 0
    ? (totalAnnualSaving / estimatedEngagementCost.low) * 100
    : 0

  return {
    hallucinationSavings,
    inferenceSavings,
    annotationSavings,
    guardrailSavings,
    complianceValue,
    totalAnnualSaving,
    estimatedEngagementCost,
    roi,
  }
}
