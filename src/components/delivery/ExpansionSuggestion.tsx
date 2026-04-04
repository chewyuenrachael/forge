'use client'

import { type FC, useState, useCallback } from 'react'
import { TrendingUp, ChevronDown, ChevronRight, Copy, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { ExpansionOpportunity, OpportunityType, ConfidenceLevel } from '@/lib/health-alerts'
import { formatCurrency } from '@/lib/health-alerts'

interface ExpansionSuggestionProps {
  opportunities: ExpansionOpportunity[]
  onInitiateExpansion: (opportunity: ExpansionOpportunity) => void
}

const OPPORTUNITY_LABELS: Record<OpportunityType, string> = {
  additional_model: 'Additional Model',
  new_capability: 'New Capability',
  monitoring_upsell: 'Runtime Monitoring',
  tier_upgrade: 'Tier Upgrade',
}

const OPPORTUNITY_BADGE_VARIANT: Record<OpportunityType, 'blue' | 'purple' | 'amber' | 'green'> = {
  additional_model: 'blue',
  new_capability: 'purple',
  monitoring_upsell: 'amber',
  tier_upgrade: 'green',
}

const CONFIDENCE_BADGE_VARIANT: Record<ConfidenceLevel, 'green' | 'amber' | 'gray'> = {
  high: 'green',
  medium: 'amber',
  low: 'gray',
}

const OPPORTUNITY_BORDER_COLOR: Record<OpportunityType, string> = {
  additional_model: 'border-l-[#3A5A80]',
  new_capability: 'border-l-[#5A3D80]',
  monitoring_upsell: 'border-l-[#8A6B20]',
  tier_upgrade: 'border-l-[#3D6B35]',
}

export const ExpansionSuggestion: FC<ExpansionSuggestionProps> = ({
  opportunities,
  onInitiateExpansion,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const totalRevenue = opportunities.reduce((sum, o) => sum + o.estimated_revenue, 0)

  const toggleExpand = useCallback((id: string): void => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const handleCopy = useCallback(async (opportunity: ExpansionOpportunity): Promise<void> => {
    try {
      await navigator.clipboard.writeText(opportunity.suggested_outreach)
      setCopiedId(opportunity.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Clipboard API may not be available
    }
  }, [])

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-[#3D6B35]" />
        <h3 className="text-sm font-semibold text-text-primary">Expansion Opportunities</h3>
      </div>
      {opportunities.length > 0 && (
        <Badge variant="green" size="sm">{opportunities.length} identified</Badge>
      )}
    </div>
  )

  if (opportunities.length === 0) {
    return (
      <Card header={header}>
        <div className="flex items-center justify-center py-8 text-sm text-text-secondary">
          No expansion opportunities detected. Opportunities appear when engagement health exceeds 90.
        </div>
      </Card>
    )
  }

  return (
    <Card header={header} noPadding>
      <div className="divide-y divide-border-subtle">
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            className={`p-4 border-l-[3px] ${OPPORTUNITY_BORDER_COLOR[opp.opportunity_type]}`}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={OPPORTUNITY_BADGE_VARIANT[opp.opportunity_type]} size="sm">
                  {OPPORTUNITY_LABELS[opp.opportunity_type]}
                </Badge>
                <Badge variant={CONFIDENCE_BADGE_VARIANT[opp.confidence]} size="sm">
                  {opp.confidence} confidence
                </Badge>
              </div>
              <span className="font-mono text-sm font-semibold text-[#3D6B35] whitespace-nowrap">
                Est: {formatCurrency(opp.estimated_revenue)}
              </span>
            </div>

            {/* Partner + description */}
            <h4 className="text-sm font-semibold text-text-primary mt-2">
              {opp.partner_name} — {OPPORTUNITY_LABELS[opp.opportunity_type]}
            </h4>
            <p className="text-sm text-text-secondary mt-1">
              <span className="font-medium text-text-primary">Current: </span>
              {opp.current_scope}
            </p>
            <p className="text-sm text-text-secondary mt-1">{opp.description}</p>
            <p className="text-xs text-text-tertiary mt-1">
              <span className="font-medium">Trigger: </span>
              {opp.trigger}
            </p>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleExpand(opp.id)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#C45A3C] hover:text-[#A8482F] transition-colors"
              >
                {expandedId === opp.id ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                Suggested Outreach
              </button>
              <Button variant="ghost" size="sm" onClick={() => onInitiateExpansion(opp)}>
                Scope Engagement
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {/* Expanded outreach */}
            {expandedId === opp.id && (
              <div className="mt-3 rounded-md border border-border-subtle bg-[#F5F3EE] p-3">
                <div className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                  Suggested Outreach
                </div>
                <pre className="text-sm text-text-primary whitespace-pre-wrap font-sans leading-relaxed">
                  {opp.suggested_outreach}
                </pre>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { void handleCopy(opp) }}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {copiedId === opp.id ? 'Copied' : 'Copy Outreach'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total revenue footer */}
      <div className="px-4 py-3 border-t border-border-subtle bg-[#F5F3EE]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Total expansion potential
          </span>
          <span className="font-mono text-sm font-semibold text-[#3D6B35]">
            {formatCurrency(totalRevenue)} across {opportunities.length} opportunit{opportunities.length !== 1 ? 'ies' : 'y'}
          </span>
        </div>
      </div>
    </Card>
  )
}
