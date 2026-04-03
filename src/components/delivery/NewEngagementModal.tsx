'use client'

import { type FC, useState, useCallback } from 'react'
import { Plus, X, AlertCircle, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { CreateEngagementInput } from '@/types'

interface MilestoneRow {
  title: string
  due_date: string
}

interface NewEngagementModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateEngagementInput, milestones: MilestoneRow[]) => Promise<void>
  availableCapabilities: string[]
}

const STATUS_OPTIONS = [
  { value: 'proposed', label: 'Proposed' },
  { value: 'active', label: 'Active' },
]

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export const NewEngagementModal: FC<NewEngagementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableCapabilities,
}) => {
  const [partnerName, setPartnerName] = useState('')
  const [status, setStatus] = useState('proposed')
  const [startDate, setStartDate] = useState(todayISO())
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedCaps, setSelectedCaps] = useState<Set<string>>(new Set())
  const [milestones, setMilestones] = useState<MilestoneRow[]>([])
  const [showMilestones, setShowMilestones] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const resetForm = useCallback(() => {
    setPartnerName('')
    setStatus('proposed')
    setStartDate(todayISO())
    setEndDate('')
    setNotes('')
    setSelectedCaps(new Set())
    setMilestones([])
    setShowMilestones(false)
    setError(null)
    setFieldErrors({})
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const toggleCap = useCallback((capId: string) => {
    setSelectedCaps((prev) => {
      const next = new Set(prev)
      if (next.has(capId)) {
        next.delete(capId)
      } else {
        next.add(capId)
      }
      return next
    })
  }, [])

  const addMilestoneRow = useCallback(() => {
    setMilestones((prev) => [...prev, { title: '', due_date: '' }])
  }, [])

  const removeMilestoneRow = useCallback((idx: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const updateMilestoneRow = useCallback((idx: number, field: keyof MilestoneRow, value: string) => {
    setMilestones((prev) => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row))
  }, [])

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {}
    if (!partnerName.trim()) errors['partnerName'] = 'Partner name is required'
    if (!startDate) errors['startDate'] = 'Start date is required'
    if (endDate && endDate < startDate) errors['endDate'] = 'End date must be on or after start date'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }, [partnerName, startDate, endDate])

  const handleSubmit = useCallback(async () => {
    if (!validate()) return

    setSubmitting(true)
    setError(null)

    try {
      const input: CreateEngagementInput = {
        partner_name: partnerName.trim(),
        status: status as CreateEngagementInput['status'],
        capabilities_applied: Array.from(selectedCaps),
        start_date: startDate,
        end_date: endDate || undefined,
        notes: notes.trim() || undefined,
      }
      const validMs = milestones.filter((m) => m.title.trim() && m.due_date)
      await onSubmit(input, validMs)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create engagement')
    } finally {
      setSubmitting(false)
    }
  }, [validate, partnerName, status, selectedCaps, startDate, endDate, notes, milestones, onSubmit, handleClose])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Engagement" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-[#8A2020]/30 bg-[#EDCFCF] px-3 py-2">
            <AlertCircle size={14} className="text-[#8A2020] shrink-0" />
            <p className="text-sm text-[#8A2020]">{error}</p>
          </div>
        )}

        <Input
          label="Partner Name"
          placeholder="e.g. Acme Corp"
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          required
          error={fieldErrors['partnerName']}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
          />
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            error={fieldErrors['startDate']}
          />
        </div>

        <Input
          label="End Date (optional)"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          error={fieldErrors['endDate']}
        />

        {/* Capabilities multi-select */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-text-secondary font-medium mb-1.5">
            Capabilities
          </label>
          <div className="grid grid-cols-2 gap-2">
            {availableCapabilities.map((capId) => (
              <button
                key={capId}
                type="button"
                onClick={() => toggleCap(capId)}
                disabled={submitting}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  selectedCaps.has(capId)
                    ? 'border-[#C45A3C] bg-[#C45A3C]/10 text-[#C45A3C]'
                    : 'border-[#D0CCC4] text-text-secondary hover:bg-[#F0EDE6]'
                }`}
              >
                <span className={`h-3 w-3 rounded-sm border ${
                  selectedCaps.has(capId) ? 'bg-[#C45A3C] border-[#C45A3C]' : 'border-[#D0CCC4]'
                }`} />
                {capId.replace('cap-', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-text-secondary font-medium mb-1.5">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={5000}
            disabled={submitting}
            rows={3}
            className="w-full rounded-md border border-[#D0CCC4] bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-[#C45A3C] focus:ring-1 focus:ring-[#C45A3C]/20"
            placeholder="Optional notes about this engagement..."
          />
        </div>

        {/* Initial Milestones */}
        <div>
          <button
            type="button"
            onClick={() => setShowMilestones(!showMilestones)}
            className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <span className={`transition-transform ${showMilestones ? 'rotate-90' : ''}`}>&#9654;</span>
            Add initial milestones (optional)
          </button>

          {showMilestones && (
            <div className="mt-2 space-y-2">
              {milestones.map((ms, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Milestone title"
                    value={ms.title}
                    onChange={(e) => updateMilestoneRow(idx, 'title', e.target.value)}
                    maxLength={500}
                    disabled={submitting}
                    className="flex-1 h-8 rounded-md border border-[#D0CCC4] bg-white px-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-[#C45A3C] focus:ring-1 focus:ring-[#C45A3C]/20"
                  />
                  <input
                    type="date"
                    value={ms.due_date}
                    onChange={(e) => updateMilestoneRow(idx, 'due_date', e.target.value)}
                    disabled={submitting}
                    className="h-8 rounded-md border border-[#D0CCC4] bg-white px-2 text-sm text-text-primary focus:outline-none focus:border-[#C45A3C] focus:ring-1 focus:ring-[#C45A3C]/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeMilestoneRow(idx)}
                    disabled={submitting}
                    className="p-1 text-text-tertiary hover:text-[#8A2020] transition-colors"
                    aria-label="Remove milestone"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addMilestoneRow}
                disabled={submitting}
                className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                <Plus size={12} /> Add another milestone
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border-subtle">
        <Button variant="secondary" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => void handleSubmit()}
          disabled={submitting || !partnerName.trim()}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Creating...
            </span>
          ) : (
            'Create Engagement'
          )}
        </Button>
      </div>
    </Modal>
  )
}
