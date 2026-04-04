'use client'

import { type FC, type ChangeEvent, useState, useCallback } from 'react'
import { X, Mail, Briefcase, ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { CertificationTracker } from '@/components/channels/CertificationTracker'
import { RevenueAttribution } from '@/components/channels/RevenueAttribution'
import type { ChannelPartner, Engagement } from '@/types'
import { MAX_TEXTAREA_LENGTH } from '@/lib/constants'

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

interface PartnerDetailProps {
  partner: ChannelPartner
  engagements: Engagement[]
  onUpdate: (id: string, data: Partial<ChannelPartner>) => Promise<void>
  onClose: () => void
}

const TYPE_LABELS: Record<string, string> = {
  big_four: 'Big Four',
  consulting: 'Consulting',
  systems_integrator: 'Systems Integrator',
  platform: 'Platform',
}

const TYPE_VARIANT: Record<string, BadgeVariant> = {
  big_four: 'blue',
  consulting: 'purple',
  systems_integrator: 'amber',
  platform: 'green',
}

const STATUS_OPTIONS = [
  { value: 'cold', label: 'Cold' },
  { value: 'warm_intro', label: 'Warm Intro' },
  { value: 'active_conversation', label: 'Active Conversation' },
  { value: 'partnership_signed', label: 'Partnership Signed' },
  { value: 'certified', label: 'Certified' },
]

const NEXT_ACTIONS: Record<string, string[]> = {
  cold: [
    'Identify warm introduction path — check mutual connections.',
    'Research partner\'s AI practice and key decision makers.',
    'Prepare Goodfire capability one-pager for initial outreach.',
  ],
  warm_intro: [
    'Schedule introductory meeting with partner practice lead.',
    'Prepare partner pitch deck with relevant case studies.',
    'Identify 2-3 mutual clients for reference conversation.',
  ],
  active_conversation: [
    'Propose pilot engagement to validate partnership model.',
    'Define certification program structure and timeline.',
    'Draft partnership agreement terms with legal.',
  ],
  partnership_signed: [
    'Launch certification training for first cohort of engineers.',
    'Create co-branded marketing materials.',
    'Identify first 3 joint opportunities from partner portfolio.',
  ],
  certified: [
    'Review quarterly pipeline and sourced deal performance.',
    'Plan next certification cohort to expand capacity.',
    'Evaluate co-investment in joint marketing events.',
  ],
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`
  return `$${value}`
}

export const PartnerDetail: FC<PartnerDetailProps> = ({ partner, engagements, onUpdate, onClose }) => {
  const [notes, setNotes] = useState(partner.notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)

  const handleStatusChange = useCallback(async (e: ChangeEvent<HTMLSelectElement>): Promise<void> => {
    await onUpdate(partner.id, { relationship_status: e.target.value as ChannelPartner['relationship_status'] })
  }, [partner.id, onUpdate])

  const handleNotesBlur = useCallback(async (): Promise<void> => {
    const trimmed = notes.trim()
    if (trimmed === (partner.notes ?? '')) return
    setSavingNotes(true)
    try {
      await onUpdate(partner.id, { notes: trimmed || null })
    } finally {
      setSavingNotes(false)
    }
  }, [notes, partner.id, partner.notes, onUpdate])

  const overlap = partner.client_portfolio_overlap
  const warmIntros = Math.round(overlap * 0.1)
  const closedDeals = Math.round(overlap * 0.01)
  const avgDealSize = 125_000
  const projectedRevenue = closedDeals * avgDealSize

  const actions = NEXT_ACTIONS[partner.relationship_status] ?? []

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[480px] bg-white border-l border-border-subtle shadow-lg flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-border-subtle shrink-0">
        <div>
          <h2 className="font-display text-xl font-semibold text-text-primary">{partner.name}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={TYPE_VARIANT[partner.type] ?? 'gray'} size="sm">
              {TYPE_LABELS[partner.type] ?? partner.type}
            </Badge>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-text-tertiary hover:text-text-primary hover:bg-[#F0EDE6] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#C45A3C]/30"
          aria-label="Close detail panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

        {/* Status */}
        <Select
          label="Relationship Status"
          value={partner.relationship_status}
          onChange={handleStatusChange}
          options={STATUS_OPTIONS}
        />

        {/* Primary contact */}
        {partner.primary_contact && partner.primary_contact.name ? (
          <div className="rounded-md border border-[#E8E4D9] p-3 space-y-1.5">
            <div className="text-xs uppercase tracking-wider text-text-tertiary font-medium">Primary Contact</div>
            <div className="text-sm font-medium text-text-primary">{partner.primary_contact.name}</div>
            {partner.primary_contact.title && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Briefcase size={12} />
                {partner.primary_contact.title}
              </div>
            )}
            {partner.primary_contact.email && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Mail size={12} />
                {partner.primary_contact.email}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[#D0CCC4] p-3 text-center">
            <p className="text-xs text-text-tertiary">No primary contact set</p>
          </div>
        )}

        {/* Business Case */}
        <div>
          <div className="text-xs uppercase tracking-wider text-text-secondary font-medium mb-2">Business Case</div>
          <div className="rounded-md bg-[#F5F3EE] p-4 space-y-2 font-mono text-xs">
            <div className="text-text-secondary font-sans text-[11px] uppercase tracking-wider font-medium mb-2">
              The {partner.name.split(' ')[0]} Multiplier
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary font-sans">Relevant clients</span>
              <span className="text-text-primary">{overlap}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary font-sans">At 10% conversion</span>
              <span className="text-text-primary">{warmIntros} warm intros</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary font-sans">At 10% close rate</span>
              <span className="text-text-primary">{closedDeals} Tier 1 deals</span>
            </div>
            <div className="border-t border-[#D0CCC4] pt-2 mt-2 flex justify-between font-semibold">
              <span className="text-text-secondary font-sans">Revenue potential</span>
              <span className="text-text-primary">{formatCurrency(projectedRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary font-sans">Est. annual revenue</span>
              <span className="text-text-primary font-semibold">{formatCurrency(partner.estimated_annual_revenue)}</span>
            </div>
          </div>
        </div>

        {/* Certification */}
        <CertificationTracker partner={partner} onUpdate={onUpdate} />

        {/* Revenue */}
        <RevenueAttribution partner={partner} engagements={engagements} />

        {/* Next actions */}
        <div>
          <div className="text-xs uppercase tracking-wider text-text-secondary font-medium mb-2">Recommended Next Actions</div>
          <div className="space-y-2">
            {actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-text-primary">
                <ArrowRight size={14} className="text-text-tertiary mt-0.5 shrink-0" />
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs uppercase tracking-wider text-text-secondary font-medium">Notes</label>
            {savingNotes && <span className="text-[10px] text-text-tertiary">Saving...</span>}
          </div>
          <textarea
            value={notes}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Internal notes about this partnership..."
            maxLength={MAX_TEXTAREA_LENGTH}
            rows={4}
            className="w-full rounded-md border border-[#D0CCC4] bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors duration-200 focus:outline-none focus:border-[#C45A3C] focus:ring-1 focus:ring-[#C45A3C]/20 resize-none"
          />
        </div>
      </div>
    </div>
  )
}
