'use client'

import { type FC, useState } from 'react'
import { Award } from 'lucide-react'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { ChannelPartner } from '@/types'

interface CertificationTrackerProps {
  partner: ChannelPartner
  onUpdate: (id: string, data: Partial<ChannelPartner>) => Promise<void>
}

const TARGET_ENGINEERS = 10
const ASSESSMENTS_PER_ENGINEER = 6
const LICENSE_FEE = 50_000

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`
  return `$${value}`
}

export const CertificationTracker: FC<CertificationTrackerProps> = ({ partner, onUpdate }) => {
  const [editing, setEditing] = useState(false)
  const [count, setCount] = useState(String(partner.certified_engineers))
  const [saving, setSaving] = useState(false)

  const certified = partner.certified_engineers
  const progress = Math.min(certified / TARGET_ENGINEERS, 1)
  const capacity = certified * ASSESSMENTS_PER_ENGINEER
  const revenuePotential = capacity * LICENSE_FEE

  const handleSave = async (): Promise<void> => {
    const parsed = Math.max(0, Math.min(100, parseInt(count, 10) || 0))
    if (parsed === partner.certified_engineers) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onUpdate(partner.id, { certified_engineers: parsed })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card header={
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-text-tertiary" />
          <h3 className="text-sm font-semibold text-text-primary">Certification Progress</h3>
        </div>
        {partner.relationship_status === 'certified' && (
          <Badge variant="green" size="sm">Fully Certified</Badge>
        )}
      </div>
    }>
      <div className="space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-text-secondary">
              Certified Engineers: <span className="font-mono font-medium text-text-primary">{certified}</span>
            </span>
            <span className="text-xs text-text-tertiary">
              Target: {TARGET_ENGINEERS}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#E8E4D9] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#3D6B35] transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-text-tertiary text-right font-mono">
            {certified}/{TARGET_ENGINEERS}
          </div>
        </div>

        {/* Revenue math */}
        <div className="rounded-md bg-[#F5F3EE] p-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Each engineer runs</span>
            <span className="font-mono text-text-primary">{ASSESSMENTS_PER_ENGINEER} assessments/yr</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">{certified} engineers x {ASSESSMENTS_PER_ENGINEER}</span>
            <span className="font-mono text-text-primary">{capacity} capacity/yr</span>
          </div>
          <div className="flex justify-between text-xs border-t border-[#D0CCC4] pt-1 mt-1">
            <span className="text-text-secondary">At {formatCurrency(LICENSE_FEE)} license fee</span>
            <span className="font-mono font-semibold text-text-primary">{formatCurrency(revenuePotential)}/yr</span>
          </div>
        </div>

        {/* Edit count */}
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              min={0}
              max={100}
              className="h-8 w-20 rounded-md border border-[#D0CCC4] bg-white px-2 text-sm font-mono text-text-primary focus:outline-none focus:border-[#C45A3C] focus:ring-1 focus:ring-[#C45A3C]/20"
            />
            <Button size="sm" variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setCount(String(partner.certified_engineers)) }}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            Update Count
          </Button>
        )}
      </div>
    </Card>
  )
}
