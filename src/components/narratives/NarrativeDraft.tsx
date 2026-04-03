'use client'

import { type FC, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Signal, Capability } from '@/types'

interface NarrativeDraftProps {
  signal: Signal
  capability: Capability
}

interface DraftOutline {
  headline: string
  hook: string
  arguments: { title: string; detail: string }[]
  differentiation: string
  cta: string
  readTime: string
  pubDate: string
  audienceTags: string[]
}

function getDraftOutline(signal: Signal, capability: Capability): DraftOutline {
  if (capability.id === 'cap-rlfr') {
    return {
      headline: `Why ${signal.title.includes('EU') ? 'the EU AI Act Makes' : signal.title.includes('NIST') ? 'NIST RMF 2.0 Makes' : 'Industry Pressure Makes'} Hallucination Reduction a Business Imperative`,
      hook: `${signal.title} signals a turning point for AI reliability requirements. Goodfire's RLFR research demonstrates that interpretability-based approaches can reduce hallucinations by 58% at 90x lower cost than existing methods \u2014 exactly the kind of evidence the market now demands.`,
      arguments: [
        { title: 'The hallucination problem is now a liability problem', detail: 'High-profile incidents and regulatory scrutiny have transformed hallucination from a technical nuisance into a business risk. RLFR addresses this with probe-based rewards that achieve 58% reduction on Gemma 12B across 8 domains (Prasad et al., Feb 2026).' },
        { title: 'Current mitigation approaches are unsustainable', detail: 'LLM-as-judge costs scale linearly with usage. RLFR probes run on existing model activations at 90x lower cost per intervention, with no additional inference calls. The probes also double as real-time production monitors.' },
        { title: 'Interpretability provides the audit trail regulators want', detail: 'Unlike black-box approaches, probe-based rewards create a causal chain from internal model features to training outcomes. Each reward signal traces to specific features responsible for hallucination \u2014 mechanistic evidence for compliance.' },
      ],
      differentiation: 'Only Goodfire combines interpretability research with production deployment. The RLFR probes are not a research prototype \u2014 they are the same technology deployed at scale with partners like Rakuten (44M+ users). No other company offers probe-based hallucination reduction with published, peer-reviewed benchmarks.',
      cta: 'Contact Goodfire to assess how RLFR can reduce hallucination risk in your AI deployment. Request a technical briefing with benchmarks specific to your model family.',
      readTime: '8 min', pubDate: signal.date, audienceTags: ['CTOs', 'ML Engineers', 'Compliance'],
    }
  }
  if (capability.id === 'cap-reasoning-theater') {
    return {
      headline: `${signal.title.includes('OpenAI') ? 'Beyond Architecture Optimization' : signal.title.includes('DeepSeek') ? 'As Reasoning Chains Grow Longer' : 'The Hidden Cost of'} Reasoning Model Inference \u2014 And How to Cut It by 68%`,
      hook: `${signal.title} highlights the growing economics challenge of reasoning models. Goodfire's Reasoning Theater research shows that up to 68% of reasoning tokens are performative \u2014 the model already knows the answer but continues generating chain-of-thought. Our probes detect this and enable early exit.`,
      arguments: [
        { title: 'Reasoning models waste most of their tokens on performance', detail: 'Attention probes reveal that models often reach their answer early in the chain-of-thought, then continue generating tokens that look like reasoning but reflect no genuine uncertainty. 68% savings on MMLU at 95% probe confidence (Boppana et al., Mar 2026).' },
        { title: 'Interpretability-guided early exit beats architecture optimization', detail: 'Architecture changes require retraining and risk capability regression. Reasoning Theater probes deploy as inference middleware on existing models (DeepSeek-R1 671B, GPT-OSS 120B) with no model modification.' },
        { title: 'Performative reasoning detection has safety implications', detail: 'If a model\'s chain-of-thought diverges from its internal beliefs, that is a faithfulness problem. Reasoning Theater probes provide mechanistic verification that reasoning is genuine \u2014 critical for high-stakes deployments.' },
      ],
      differentiation: 'Goodfire is the only company with published research demonstrating probe-based performative reasoning detection. The probes generalize across tasks they were not trained on, and the inflection point detection ("Wait", "Aha!") provides interpretable signals that other cost optimization approaches cannot offer.',
      cta: 'Schedule a demo to see Reasoning Theater probes in action on your reasoning model workloads. We can estimate your specific token savings based on your usage patterns.',
      readTime: '7 min', pubDate: signal.date, audienceTags: ['ML Engineers', 'CTOs', 'AI Platform'],
    }
  }
  if (capability.id === 'cap-alzheimers') {
    return {
      headline: 'The First Scientific Discovery Made by Understanding How an AI Works',
      hook: `${signal.title} underscores the demand for AI transparency in clinical applications. Goodfire's work with Prima Mente and Oxford produced the strongest proof yet: by reverse-engineering a foundation model, we discovered a novel class of Alzheimer's biomarkers that outperforms existing approaches.`,
      arguments: [
        { title: 'Interpretability enabled a genuine scientific discovery', detail: 'DNA fragment length patterns were identified as a novel Alzheimer\'s biomarker class through reverse-engineering the Pleiades epigenetic foundation model. This is the first major scientific discovery from model interpretability (Wang et al., Jan 2026).' },
        { title: 'The discovery generalizes beyond the training data', detail: 'The distilled human-interpretable classifier outperforms previously reported biomarker classes on an independent cohort \u2014 demonstrating that the interpretability insights are biologically meaningful, not artifacts.' },
        { title: 'This sets the standard for clinical AI transparency', detail: 'Regulatory bodies increasingly require interpretability evidence. The Alzheimer\'s work demonstrates what regulatory-grade model understanding looks like: probing, discovery, validation, and publication.' },
      ],
      differentiation: 'No other company has demonstrated scientific discovery through model interpretability. The Prima Mente partnership \u2014 resulting in peer-reviewed research with Oxford \u2014 is proof that Goodfire\'s approach creates value that goes beyond model monitoring into genuine knowledge creation.',
      cta: 'Learn how Goodfire interpretability can unlock insights from your foundation models. Contact us for a technical consultation on biological or clinical AI applications.',
      readTime: '9 min', pubDate: signal.date, audienceTags: ['Researchers', 'Clinical AI', 'CTOs'],
    }
  }
  return {
    headline: `How ${capability.name} Changes the Game for ${signal.type === 'regulatory' ? 'AI Compliance' : 'AI Deployment'}`,
    hook: `${signal.title} creates new urgency for ${capability.partner_solution.toLowerCase()}. ${capability.description}`,
    arguments: [
      { title: 'The external landscape is shifting', detail: signal.description },
      { title: `${capability.name} addresses this directly`, detail: capability.key_results[0] ?? capability.description },
      { title: 'Production-proven interpretability', detail: capability.partner_solution },
    ],
    differentiation: `Goodfire's ${capability.name} capability is backed by published research (${capability.authors}, ${capability.date}) and represents a unique approach to ${capability.partner_solution.toLowerCase()}.`,
    cta: `Contact Goodfire to discuss how ${capability.name} applies to your use case.`,
    readTime: '6 min', pubDate: signal.date, audienceTags: ['General'],
  }
}

export const NarrativeDraft: FC<NarrativeDraftProps> = ({ signal, capability }) => {
  const [copied, setCopied] = useState(false)
  const outline = getDraftOutline(signal, capability)

  const handleCopy = (): void => {
    const text = [
      outline.headline, '', outline.hook, '',
      ...outline.arguments.flatMap((arg, i) => [`${i + 1}. ${arg.title}`, arg.detail, '']),
      'DIFFERENTIATION:', outline.differentiation, '',
      'CTA:', outline.cta, '',
      `Read time: ${outline.readTime} | Publish: ${outline.pubDate} | Audiences: ${outline.audienceTags.join(', ')}`,
    ].join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => { setCopied(false) }, 2000)
    }).catch((err: unknown) => {
      console.error('Failed to copy outline:', err)
    })
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs uppercase tracking-wider text-text-secondary font-medium">Narrative Draft</h2>
        <Button variant="ghost" className="text-xs h-7 px-2 gap-1" onClick={handleCopy}>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy Outline'}
        </Button>
      </div>
      <h3 className="font-display text-xl font-semibold text-text-primary leading-tight">{outline.headline}</h3>
      <p className="text-sm text-text-secondary mt-3 leading-relaxed">{outline.hook}</p>
      <div className="mt-4 space-y-3">
        {outline.arguments.map((arg, idx) => (
          <div key={idx}>
            <div className="flex gap-2 items-baseline">
              <span className="font-mono text-xs text-accent-amber shrink-0">{idx + 1}.</span>
              <span className="text-sm font-medium text-text-primary">{arg.title}</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed ml-5 mt-1">{arg.detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 border-l-2 border-accent-amber pl-3">
        <p className="text-xs uppercase tracking-wider text-text-tertiary font-medium mb-1">Goodfire Differentiation</p>
        <p className="text-sm text-text-secondary leading-relaxed">{outline.differentiation}</p>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-accent-amber">{outline.cta}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-border-subtle flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs text-text-tertiary">{outline.readTime} read</span>
        <span className="font-mono text-xs text-text-tertiary">Publish: {outline.pubDate}</span>
        <div className="flex gap-1">
          {outline.audienceTags.map((tag) => (
            <Badge key={tag} variant="gray">{tag}</Badge>
          ))}
        </div>
      </div>
    </Card>
  )
}
