'use client'

import { type FC, useState, useCallback } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import type { ModelFamily } from '@/types'
import type { CreatePredictionInput } from '@/lib/predictions'

interface NewPredictionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreatePredictionInput) => Promise<void>
  engagementId: string
  modelFamilies: ModelFamily[]
}

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical — Could cause significant harm (safety, financial, regulatory)' },
  { value: 'high', label: 'High — Affects core model performance (hallucination, bias)' },
  { value: 'medium', label: 'Medium — Quality issue (suboptimal output, minor inconsistency)' },
  { value: 'low', label: 'Low — Edge case or cosmetic (rare, low-impact)' },
]

const CONFIDENCE_OPTIONS = [
  { value: 'high', label: 'High — Feature activation strongly correlated, seen in 3+ models' },
  { value: 'medium', label: 'Medium — Feature activation present, limited cross-model validation' },
  { value: 'low', label: 'Low — Preliminary signal, needs further analysis' },
]

const MAX_CHARS = 2000

export const NewPredictionModal: FC<NewPredictionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  engagementId,
  modelFamilies,
}) => {
  const [description, setDescription] = useState('')
  const [methodology, setMethodology] = useState('')
  const [severity, setSeverity] = useState('high')
  const [confidence, setConfidence] = useState('medium')
  const [modelFamilyId, setModelFamilyId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const resetForm = useCallback(() => {
    setDescription('')
    setMethodology('')
    setSeverity('high')
    setConfidence('medium')
    setModelFamilyId('')
    setError(null)
    setFieldErrors({})
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {}
    if (!description.trim()) errors['description'] = 'Prediction description is required'
    if (description.length > MAX_CHARS) errors['description'] = `Description must be ${MAX_CHARS} characters or fewer`
    if (!methodology.trim()) errors['methodology'] = 'Methodology is required'
    if (methodology.length > MAX_CHARS) errors['methodology'] = `Methodology must be ${MAX_CHARS} characters or fewer`
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }, [description, methodology])

  const handleSubmit = useCallback(async () => {
    if (!validate()) return

    setSubmitting(true)
    setError(null)

    try {
      const input: CreatePredictionInput = {
        engagementId,
        description: description.trim(),
        methodology: methodology.trim(),
        severity: severity as CreatePredictionInput['severity'],
        confidence: confidence as CreatePredictionInput['confidence'],
        modelFamilyId: modelFamilyId || undefined,
      }
      await onSubmit(input)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prediction')
    } finally {
      setSubmitting(false)
    }
  }, [validate, engagementId, description, methodology, severity, confidence, modelFamilyId, onSubmit, handleClose])

  const modelFamilyOptions = [
    { value: '', label: 'Select model family (optional)' },
    ...modelFamilies.map((mf) => ({ value: mf.id, label: `${mf.name} — ${mf.provider}` })),
  ]

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Prediction" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-[#8A2020]/30 bg-[#EDCFCF] px-3 py-2">
            <AlertCircle size={14} className="text-[#8A2020] shrink-0" />
            <p className="text-sm text-[#8A2020]">{error}</p>
          </div>
        )}

        {/* Description */}
        <div>
          <label htmlFor="pred-description" className="block text-sm font-medium text-text-primary mb-1">
            Prediction <span className="text-[#8A2020]">*</span>
          </label>
          <p className="text-xs text-text-secondary mb-1.5">
            Describe a specific, testable model behavior. Include: what feature cluster you identified, in which layers, what behavior it correlates with, and what the model will do in a specific untested scenario.
          </p>
          <textarea
            id="pred-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="We identified [feature cluster] in layers [X-Y] that correlates [behavior A] with [behavior B]. We predict that when prompted with [specific scenario], the model will [specific failure mode]."
            maxLength={MAX_CHARS}
            rows={4}
            disabled={submitting}
            className={`w-full rounded-md border ${fieldErrors['description'] ? 'border-[#8A2020]' : 'border-[#D0CCC4]'} bg-[#FAFAF7] px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-[#C45A3C] focus:ring-1 focus:ring-[#C45A3C]/20 resize-none`}
          />
          <div className="flex justify-between mt-1">
            {fieldErrors['description'] && (
              <p className="text-xs text-[#8A2020]">{fieldErrors['description']}</p>
            )}
            <p className="text-xs text-text-tertiary ml-auto">{description.length}/{MAX_CHARS}</p>
          </div>
        </div>

        {/* Methodology */}
        <div>
          <label htmlFor="pred-methodology" className="block text-sm font-medium text-text-primary mb-1">
            Methodology <span className="text-[#8A2020]">*</span>
          </label>
          <p className="text-xs text-text-secondary mb-1.5">
            How did you derive this prediction? Which interpretability techniques, which features, which analysis.
          </p>
          <textarea
            id="pred-methodology"
            value={methodology}
            onChange={(e) => setMethodology(e.target.value)}
            placeholder="SAE feature extraction on layers 12-24 identified a cluster of features correlating..."
            maxLength={MAX_CHARS}
            rows={3}
            disabled={submitting}
            className={`w-full rounded-md border ${fieldErrors['methodology'] ? 'border-[#8A2020]' : 'border-[#D0CCC4]'} bg-[#FAFAF7] px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-[#C45A3C] focus:ring-1 focus:ring-[#C45A3C]/20 resize-none`}
          />
          <div className="flex justify-between mt-1">
            {fieldErrors['methodology'] && (
              <p className="text-xs text-[#8A2020]">{fieldErrors['methodology']}</p>
            )}
            <p className="text-xs text-text-tertiary ml-auto">{methodology.length}/{MAX_CHARS}</p>
          </div>
        </div>

        {/* Severity + Confidence row */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            options={SEVERITY_OPTIONS}
          />
          <Select
            label="Confidence"
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
            options={CONFIDENCE_OPTIONS}
          />
        </div>

        {/* Model Family */}
        <Select
          label="Model Family"
          value={modelFamilyId}
          onChange={(e) => setModelFamilyId(e.target.value)}
          options={modelFamilyOptions}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border-subtle">
        <Button variant="secondary" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => void handleSubmit()}
          disabled={submitting || !description.trim() || !methodology.trim()}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Creating...
            </span>
          ) : (
            'Create Prediction'
          )}
        </Button>
      </div>
    </Modal>
  )
}
