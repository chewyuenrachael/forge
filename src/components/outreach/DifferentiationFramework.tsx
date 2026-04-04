'use client'

import { type FC, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import type { Capability, Prospect } from '@/types'

interface DifferentiationFrameworkProps {
  level: 'surface' | 'mechanism' | 'proof'
  capability: Capability
  prospect: Prospect
}

interface LevelDef {
  id: 'surface' | 'mechanism' | 'proof'
  label: string
  sublabel: string
}

const LEVELS: LevelDef[] = [
  { id: 'surface', label: 'Level 1 — Surface', sublabel: 'What Goodfire does' },
  { id: 'mechanism', label: 'Level 2 — Mechanism', sublabel: 'How it works differently' },
  { id: 'proof', label: 'Level 3 — Proof', sublabel: 'Published evidence' },
]

function getDifferentiationText(
  levelId: 'surface' | 'mechanism' | 'proof',
  capability: Capability,
  prospect: Prospect
): string {
  const modelRef = prospect.model_families[0] ?? 'your models'
  const capName = capability.name.toLowerCase()

  // Capability-specific text for known capabilities
  if (capName.includes('rlfr') || capName.includes('hallucination')) {
    switch (levelId) {
      case 'surface':
        return 'We look inside AI models to understand how they actually work — and fix hallucinations at the source.'
      case 'mechanism':
        return `When ${modelRef} hallucinates, we identify the specific internal components responsible — not just flag the output, but diagnose the cause and fix it permanently using SAE-based reward signals on frozen model activations, at 90x lower cost per intervention than LLM-as-judge alternatives.`
      case 'proof':
        return `In a recent engagement, our RLFR technique reduced hallucinations by 58% on Gemma 12B across 8 domains (Prasad et al., Feb 2026). We also made 10 specific predictions about model behavior that the client's eval suite missed. 8 were confirmed.`
    }
  }

  if (capName.includes('reasoning') || capName.includes('theater')) {
    switch (levelId) {
      case 'surface':
        return 'We detect when reasoning models are performing rather than reasoning — cutting inference costs without accuracy loss.'
      case 'mechanism':
        return `Attention probes decode ${modelRef}'s internal beliefs during chain-of-thought, measuring whether each reasoning step adds genuine information. When the model is performing rather than reasoning, probe-guided early exit terminates the chain at 95% confidence.`
      case 'proof':
        return 'Our Reasoning Theater probes achieved 68% token savings on MMLU and 30% on GPQA-Diamond via probe-guided early exit (Boppana et al., Mar 2026) — without accuracy degradation.'
    }
  }

  if (capName.includes('guardrail') || capName.includes('safety') || capName.includes('sae')) {
    switch (levelId) {
      case 'surface':
        return 'We provide real-time AI guardrails that work at the model level — no separate classifier needed.'
      case 'mechanism':
        return `SAE probes run directly on ${modelRef}'s internal activations, detecting PII, toxicity, and safety violations with sub-millisecond latency. No separate model deployment, no additional inference cost.`
      case 'proof':
        return 'SAE-based safety probes are deployed across 44M+ users at Rakuten with sub-millisecond inference overhead — production-grade safety without the latency penalty.'
    }
  }

  // Generic fallback using capability data
  const keyResult = capability.key_results[0] ?? capability.description
  switch (levelId) {
    case 'surface':
      return `We look inside AI models to understand how they actually work. Goodfire provides ${capability.name} — turning interpretability research into production tools.`
    case 'mechanism':
      return `${capability.description} This technique is applicable to ${modelRef} and similar architectures.`
    case 'proof':
      return `${capability.name} (${capability.authors}, ${capability.date}): ${keyResult}`
  }
}

export const DifferentiationFramework: FC<DifferentiationFrameworkProps> = ({
  level,
  capability,
  prospect,
}) => {
  const texts = useMemo(() => {
    return LEVELS.map((l) => ({
      ...l,
      text: getDifferentiationText(l.id, capability, prospect),
      isActive: l.id === level,
    }))
  }, [level, capability, prospect])

  return (
    <Card>
      <div className="space-y-0.5">
        <h3 className="text-xs uppercase tracking-wider font-medium text-text-secondary mb-3">
          Differentiation Framework
        </h3>
        {texts.map((item, index) => (
          <div key={item.id}>
            <div
              className={`rounded-md p-3 transition-colors duration-200 ${
                item.isActive
                  ? 'bg-[#F0EDE6] border-l-2 border-[#C45A3C] pl-4'
                  : 'opacity-50 pl-4 border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold ${item.isActive ? 'text-[#C45A3C]' : 'text-text-tertiary'}`}>
                  {item.label}
                </span>
                <span className="text-[10px] text-text-tertiary">
                  {item.sublabel}
                </span>
              </div>
              <p className={`text-sm leading-relaxed ${item.isActive ? 'text-text-primary' : 'text-text-tertiary'}`}>
                {item.text}
              </p>
            </div>
            {index < texts.length - 1 && (
              <div className="ml-5 h-2 border-l border-border-subtle" />
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
