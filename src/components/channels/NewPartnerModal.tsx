'use client'

import { type FC, type ChangeEvent, useState } from 'react'

import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { MAX_INPUT_LENGTH, MAX_TEXTAREA_LENGTH } from '@/lib/constants'
import type { ChannelPartner } from '@/types'

interface NewPartnerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreatePartnerFormData) => Promise<void>
}

export interface CreatePartnerFormData {
  name: string
  type: ChannelPartner['type']
  relationship_status: ChannelPartner['relationship_status']
  primary_contact_name: string
  primary_contact_title: string
  primary_contact_email: string
  client_portfolio_overlap: number
  estimated_annual_revenue: number
  notes: string
}

const TYPE_OPTIONS = [
  { value: 'big_four', label: 'Big Four' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'systems_integrator', label: 'Systems Integrator' },
  { value: 'platform', label: 'Platform' },
]

const STATUS_OPTIONS = [
  { value: 'cold', label: 'Cold' },
  { value: 'warm_intro', label: 'Warm Intro' },
  { value: 'active_conversation', label: 'Active Conversation' },
  { value: 'partnership_signed', label: 'Partnership Signed' },
  { value: 'certified', label: 'Certified' },
]

const INITIAL_FORM: CreatePartnerFormData = {
  name: '',
  type: 'consulting',
  relationship_status: 'cold',
  primary_contact_name: '',
  primary_contact_title: '',
  primary_contact_email: '',
  client_portfolio_overlap: 0,
  estimated_annual_revenue: 0,
  notes: '',
}

export const NewPartnerModal: FC<NewPartnerModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState<CreatePartnerFormData>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = (): void => {
    setForm(INITIAL_FORM)
    setError(null)
    onClose()
  }

  const handleSubmit = async (): Promise<void> => {
    if (!form.name.trim()) {
      setError('Partner name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit(form)
      setForm(INITIAL_FORM)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create partner')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof CreatePartnerFormData, value: string | number): void => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Channel Partner" size="lg">
      <div className="space-y-5">
        {/* Partner info */}
        <div className="space-y-3">
          <Input
            label="Partner Name"
            value={form.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('name', e.target.value)}
            placeholder="e.g., Deloitte AI Practice"
            required
            maxLength={MAX_INPUT_LENGTH}
            error={error && !form.name.trim() ? error : undefined}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              value={form.type}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => updateField('type', e.target.value)}
              options={TYPE_OPTIONS}
            />
            <Select
              label="Status"
              value={form.relationship_status}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => updateField('relationship_status', e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>

        {/* Financial */}
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-text-secondary font-medium">Financial Estimates</div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Portfolio Overlap"
              value={String(form.client_portfolio_overlap)}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('client_portfolio_overlap', parseInt(e.target.value, 10) || 0)}
              type="number"
              placeholder="50"
            />
            <Input
              label="Est. Annual Revenue"
              value={String(form.estimated_annual_revenue)}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('estimated_annual_revenue', parseInt(e.target.value, 10) || 0)}
              type="number"
              placeholder="2500000"
            />
          </div>
        </div>

        {/* Primary contact */}
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-text-secondary font-medium">Primary Contact (optional)</div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Name"
              value={form.primary_contact_name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('primary_contact_name', e.target.value)}
              placeholder="Jane Smith"
              maxLength={MAX_INPUT_LENGTH}
            />
            <Input
              label="Title"
              value={form.primary_contact_title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('primary_contact_title', e.target.value)}
              placeholder="Partner, AI Practice"
              maxLength={MAX_INPUT_LENGTH}
            />
          </div>
          <Input
            label="Email"
            value={form.primary_contact_email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('primary_contact_email', e.target.value)}
            placeholder="jsmith@firm.com"
            type="email"
            maxLength={MAX_INPUT_LENGTH}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-text-secondary font-medium mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateField('notes', e.target.value)}
            placeholder="Internal notes about this partnership..."
            maxLength={MAX_TEXTAREA_LENGTH}
            rows={3}
            className="w-full rounded-md border border-[#D0CCC4] bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors duration-200 focus:outline-none focus:border-[#C45A3C] focus:ring-1 focus:ring-[#C45A3C]/20 resize-none"
          />
        </div>

        {/* Error */}
        {error && form.name.trim() && (
          <p className="text-xs text-[#8A2020]">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving || !form.name.trim()}>
            {saving ? 'Creating...' : 'Create Partner'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
