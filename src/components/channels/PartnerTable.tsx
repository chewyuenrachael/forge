import { type FC } from 'react'
import { Users, ChevronUp, ChevronDown } from 'lucide-react'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { ChannelPartner } from '@/types'

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

interface PartnerTableProps {
  partners: ChannelPartner[]
  selectedId: string | null
  onSelect: (id: string) => void
  sortConfig: SortConfig
  onSort: (key: string) => void
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

const STATUS_LABELS: Record<string, string> = {
  cold: 'Cold',
  warm_intro: 'Warm Intro',
  active_conversation: 'Active Conv.',
  partnership_signed: 'Signed',
  certified: 'Certified',
}

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  cold: 'gray',
  warm_intro: 'blue',
  active_conversation: 'amber',
  partnership_signed: 'green',
  certified: 'green',
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`
  return `$${value}`
}

interface ColumnDef {
  key: string
  label: string
  align: 'left' | 'right'
  width: string
  mono?: boolean
  sortable: boolean
}

const COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Partner', align: 'left', width: 'flex-1 min-w-[180px]', sortable: true },
  { key: 'type', label: 'Type', align: 'left', width: 'w-[130px]', sortable: true },
  { key: 'relationship_status', label: 'Status', align: 'left', width: 'w-[120px]', sortable: true },
  { key: 'client_portfolio_overlap', label: 'Overlap', align: 'right', width: 'w-[80px]', mono: true, sortable: true },
  { key: 'estimated_annual_revenue', label: 'Est. Revenue', align: 'right', width: 'w-[110px]', mono: true, sortable: true },
  { key: 'certified_engineers', label: 'Certified', align: 'right', width: 'w-[80px]', mono: true, sortable: true },
  { key: 'engagements_sourced', label: 'Sourced', align: 'right', width: 'w-[70px]', mono: true, sortable: true },
]

export const PartnerTable: FC<PartnerTableProps> = ({ partners, selectedId, onSelect, sortConfig, onSort }) => {
  if (partners.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
          <Users size={32} className="mb-3 opacity-50" />
          <p className="text-sm">No channel partners found.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card noPadding>
      {/* Header */}
      <div className="flex items-center px-4 py-2.5 border-b border-border-subtle bg-[#F5F3EE]/50">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className={`${col.width} ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.sortable ? 'cursor-pointer select-none hover:text-text-primary' : ''}`}
            onClick={col.sortable ? () => onSort(col.key) : undefined}
          >
            <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-text-secondary font-medium">
              {col.label}
              {sortConfig.key === col.key && (
                sortConfig.direction === 'asc'
                  ? <ChevronUp size={12} />
                  : <ChevronDown size={12} />
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Rows */}
      <div>
        {partners.map((partner) => {
          const isSelected = partner.id === selectedId
          return (
            <div
              key={partner.id}
              onClick={() => onSelect(partner.id)}
              className={`flex items-center px-4 py-3 border-b border-[#E8E4D9]/60 cursor-pointer transition-colors duration-150 ${
                isSelected
                  ? 'bg-[#C45A3C]/[0.04] border-l-2 border-l-[#C45A3C]'
                  : 'border-l-2 border-l-transparent hover:bg-[#F5F3EE]/60'
              }`}
            >
              {/* Name */}
              <div className="flex-1 min-w-[180px]">
                <div className="text-sm font-medium text-text-primary">{partner.name}</div>
                {partner.notes && (
                  <div className="text-xs text-text-tertiary truncate max-w-[200px] mt-0.5">{partner.notes}</div>
                )}
              </div>
              {/* Type */}
              <div className="w-[130px]">
                <Badge variant={TYPE_VARIANT[partner.type] ?? 'gray'} size="sm">
                  {TYPE_LABELS[partner.type] ?? partner.type}
                </Badge>
              </div>
              {/* Status */}
              <div className="w-[120px]">
                <Badge variant={STATUS_VARIANT[partner.relationship_status] ?? 'gray'} size="sm">
                  {STATUS_LABELS[partner.relationship_status] ?? partner.relationship_status}
                </Badge>
              </div>
              {/* Overlap */}
              <div className="w-[80px] text-right font-mono text-sm text-text-primary">
                {partner.client_portfolio_overlap}
              </div>
              {/* Est. Revenue */}
              <div className="w-[110px] text-right font-mono text-sm font-medium text-text-primary">
                {formatCurrency(partner.estimated_annual_revenue)}
              </div>
              {/* Certified */}
              <div className="w-[80px] text-right font-mono text-sm text-text-primary">
                {partner.certified_engineers}
              </div>
              {/* Sourced */}
              <div className="w-[70px] text-right font-mono text-sm text-text-primary">
                {partner.engagements_sourced}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
