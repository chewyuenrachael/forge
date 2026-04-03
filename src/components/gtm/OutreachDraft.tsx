'use client'

import { type FC, useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Copy, Check } from 'lucide-react'
import type { Signal, Capability } from '@/types'

interface OutreachDraftProps {
  signal: Signal
  capabilities: Capability[]
}

const AUDIENCE_TABS = [
  { id: 'ml_engineer', label: 'ML Engineer' },
  { id: 'cto', label: 'CTO' },
  { id: 'compliance', label: 'Compliance Officer' },
]

function generateDraft(audience: string, signal: Signal, capabilities: Capability[]): { subject: string; body: string } {
  const capNames = capabilities.map((c) => c.name).join(', ')

  if (audience === 'ml_engineer') {
    return {
      subject: `Interpretability tooling for ${signal.title}`,
      body: `Hi,

I noticed ${signal.title.toLowerCase()} — this has direct implications for teams running models in production.

At Goodfire, we've built interpretability techniques that address this:

${capabilities.map((c) => `• ${c.name}: ${c.key_results[0]}`).join('\n')}

Our RLFR technique reduced hallucinations by 58% on Gemma 12B — and at 90x lower cost per intervention than LLM-as-judge alternatives. For runtime guardrails, our SAE probes are deployed across 44M+ users at Rakuten with sub-millisecond inference overhead.

For reasoning model optimization, our Reasoning Theater work achieves 68% token savings on MMLU and 30% on GPQA-Diamond via probe-guided early exit at 95% confidence.

Would 30 minutes work to walk through how ${capNames} maps to your stack?

Best regards`,
    }
  }

  if (audience === 'cto') {
    return {
      subject: `ROI impact: ${signal.title}`,
      body: `Hi,

${signal.title} creates both risk and opportunity for AI-forward organizations.

Goodfire is the commercial leader in AI interpretability — we help enterprises reduce AI costs, improve reliability, and meet regulatory requirements:

• Hallucination reduction: 58% reduction on Gemma 12B via our RLFR technique, at 90x lower cost than LLM-as-judge approaches
• Inference cost optimization: 68% token savings on reasoning workloads via Reasoning Theater probe-guided early exit
• Production guardrails: SAE probes deployed at 44M+ users (Rakuten) with sub-millisecond overhead

Our engagement model delivers measurable ROI. Typical enterprises see ${capabilities.length > 2 ? '3-5x' : '2-4x'} return on engagement investment through reduced inference costs, fewer hallucination incidents, and regulatory compliance.

I'd welcome 20 minutes to discuss how interpretability can drive cost savings and risk reduction for your AI portfolio.

Best regards`,
    }
  }

  // compliance
  return {
    subject: `Regulatory preparedness: ${signal.title}`,
    body: `Dear Compliance Team,

${signal.title} underscores the growing regulatory expectation for AI transparency and interpretability.

Goodfire provides the technical foundation for regulatory compliance:

• EU AI Act Article 13: Our interpretability tools provide the model transparency required for high-risk AI systems. Non-compliance carries fines up to €20M or 4% of global turnover.
• SR 11-7: Our Model Diff Amplification technique detects rare undesired behaviors (1 in 1,000,000 samples), directly supporting model risk management documentation.
• FDA AI/ML: Our Alzheimer's biomarker discovery with Prima Mente and Oxford demonstrates regulatory-grade scientific discovery via interpretability.

These are not theoretical — our techniques are peer-reviewed and production-deployed:
${capabilities.map((c) => `• ${c.name} (${c.authors}, ${c.date}): ${c.key_results[0]}`).join('\n')}

I would welcome a conversation about mapping Goodfire's capabilities to your specific compliance requirements.

Best regards`,
  }
}

export const OutreachDraft: FC<OutreachDraftProps> = ({ signal, capabilities }) => {
  const [activeTab, setActiveTab] = useState('ml_engineer')
  const [copied, setCopied] = useState(false)

  const draft = useMemo(
    () => generateDraft(activeTab, signal, capabilities),
    [activeTab, signal, capabilities]
  )

  const handleCopy = (): void => {
    const text = `Subject: ${draft.subject}\n\n${draft.body}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-text-primary">Outreach Draft</h2>
        <Button variant="secondary" onClick={handleCopy}>
          {copied ? (
            <span className="flex items-center gap-1"><Check className="h-4 w-4" /> Copied</span>
          ) : (
            <span className="flex items-center gap-1"><Copy className="h-4 w-4" /> Copy to clipboard</span>
          )}
        </Button>
      </div>
      <Tabs tabs={AUDIENCE_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-4 space-y-3">
        <div>
          <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">Subject</span>
          <p className="text-sm font-semibold text-text-primary mt-1">{draft.subject}</p>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">Body</span>
          <pre className="mt-1 text-sm text-text-secondary whitespace-pre-wrap font-sans leading-relaxed">
            {draft.body}
          </pre>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-border-subtle">
        <p className="text-xs text-text-tertiary">
          Signal: {signal.title} | Matched capabilities: {capabilities.map((c) => c.name).join(', ')}
        </p>
      </div>
    </Card>
  )
}
