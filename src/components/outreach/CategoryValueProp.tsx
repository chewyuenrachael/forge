'use client'

import { type FC, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { CustomerCategoryDef, Prospect } from '@/types'

interface CategoryValuePropProps {
  category: CustomerCategoryDef
  prospect: Prospect
}

function personalizeValueProp(category: CustomerCategoryDef, prospect: Prospect): string {
  const modelRef = prospect.model_families[0] ?? 'production models'
  const pain = prospect.pain_points[0] ?? 'AI transparency'
  const regulation = prospect.regulatory_exposure[0] ?? null

  switch (category.id) {
    case 'data_sovereign_enterprise':
      return `${prospect.name} deploys ${modelRef} on-premise${regulation ? ` for ${regulation} compliance` : ' for data sovereignty'}. Self-hosting means owning the model risk — Goodfire provides the interpretability layer that makes ${modelRef} auditable and compliant.`
    case 'ai_native_startup':
      return `${prospect.name}'s fine-tuned ${modelRef} for ${pain.toLowerCase()} may contain behaviors introduced during post-training that standard evals cannot detect. Goodfire surfaces what changed, why, and how to fix it.`
    case 'research_institution':
      return `${prospect.name}'s ${modelRef} has learned patterns in research data that no human has discovered. Goodfire can extract that knowledge — as demonstrated with the Alzheimer's biomarker discovery.`
    case 'cost_optimizer':
      return `${prospect.name}'s reasoning model costs on ${modelRef} are a direct target for optimization. Goodfire's Reasoning Theater probes can cut token usage by 68% by detecting performative reasoning and enabling early exit.`
    case 'model_customization_platform':
      return `${prospect.name}'s customers need interpretability for the models they serve. Goodfire provides white-label interpretability infrastructure that makes ${prospect.name} the trusted choice for regulated enterprises.`
    case 'sovereign_ai_initiative':
      return `${prospect.name}'s national AI program requires national AI transparency. Goodfire provides the interpretability infrastructure ensuring domestic ${modelRef} models meet domestic standards${regulation ? ` including ${regulation}` : ''}.`
    default:
      return `${prospect.name} can benefit from Goodfire's interpretability infrastructure for ${modelRef}, addressing ${pain.toLowerCase()} with production-proven techniques.`
  }
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

export const CategoryValueProp: FC<CategoryValuePropProps> = ({ category, prospect }) => {
  const personalized = useMemo(
    () => personalizeValueProp(category, prospect),
    [category, prospect]
  )

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <h3 className="text-xs uppercase tracking-wider font-medium text-text-secondary mb-1">
            Value Proposition — {category.name.replace(/_/g, ' ')}
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {category.description}
          </p>
        </div>

        <div className="flex gap-4 text-xs text-text-tertiary">
          <span className="font-mono">
            {formatCurrency(category.avg_deal_size.low)}–{formatCurrency(category.avg_deal_size.high)}
          </span>
          <span className="font-mono">
            {category.sales_cycle_days.low}–{category.sales_cycle_days.high} days
          </span>
          {category.regulatory_tailwinds.length > 0 && (
            <div className="flex gap-1">
              {category.regulatory_tailwinds.map((r) => (
                <Badge key={r} variant="red" size="sm">{r}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border-subtle pt-3">
          <p className="text-sm text-text-primary leading-relaxed italic">
            &ldquo;{category.goodfire_value_prop}&rdquo;
          </p>
        </div>

        <div className="border-t border-border-subtle pt-3">
          <span className="text-xs font-medium text-text-secondary">
            Personalized for {prospect.name}:
          </span>
          <p className="text-sm text-text-secondary leading-relaxed mt-1">
            {personalized}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {prospect.pain_points.slice(0, 3).map((p) => (
              <Badge key={p} variant="amber" size="sm">{p}</Badge>
            ))}
            {prospect.regulatory_exposure.slice(0, 2).map((r) => (
              <Badge key={r} variant="red" size="sm">{r}</Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
