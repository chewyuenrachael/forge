'use client'

import { type FC, type FormEvent, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { MAX_INPUT_LENGTH, MAX_TEXTAREA_LENGTH } from '@/lib/constants'
import type { IntakeFormData } from '@/types'

interface IntakeFormProps {
  onSubmit: (data: IntakeFormData) => void
  initialData?: Partial<IntakeFormData>
}

const MODEL_FAMILY_OPTIONS = [
  { value: 'Llama', label: 'Llama' },
  { value: 'DeepSeek', label: 'DeepSeek' },
  { value: 'Gemma', label: 'Gemma' },
  { value: 'GPT', label: 'GPT' },
  { value: 'Claude', label: 'Claude' },
  { value: 'Proprietary', label: 'Proprietary' },
  { value: 'Biological FM', label: 'Biological FM' },
  { value: 'Other', label: 'Other' },
]

const MODEL_SIZE_OPTIONS = [
  { value: '<10B', label: '<10B' },
  { value: '10-70B', label: '10-70B' },
  { value: '70B+', label: '70B+' },
  { value: 'Unknown', label: 'Unknown' },
]

const DEPLOYMENT_OPTIONS = [
  { value: 'Production', label: 'Production' },
  { value: 'Pre-deployment', label: 'Pre-deployment' },
  { value: 'Research', label: 'Research' },
]

const SCALE_OPTIONS = [
  { value: '<1M tokens/day', label: '<1M tokens/day' },
  { value: '1-100M', label: '1-100M tokens/day' },
  { value: '100M-1B', label: '100M-1B tokens/day' },
  { value: '1B+', label: '1B+ tokens/day' },
]

const PAIN_POINT_OPTIONS = [
  'Hallucination',
  'Bias/Fairness',
  'Safety/Jailbreak',
  'Compliance/Regulatory',
  'Inference Cost',
  'Scientific Discovery',
  'Model Quality/Reliability',
] as const

const REGULATORY_OPTIONS = [
  'EU AI Act',
  'SR 11-7 Banking',
  'FDA Medical Devices',
  'None',
] as const

const TEAM_OPTIONS = [
  'ML Engineers',
  'Research Scientists',
  'Compliance/Legal',
  'Executive Leadership',
] as const

type FormErrors = Partial<Record<keyof IntakeFormData, string>>

export const IntakeForm: FC<IntakeFormProps> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState<IntakeFormData>({
    partnerName: initialData?.partnerName ?? '',
    modelFamily: initialData?.modelFamily ?? '',
    modelSize: initialData?.modelSize ?? '',
    deploymentContext: initialData?.deploymentContext ?? '',
    painPoints: initialData?.painPoints ?? [],
    regulatoryExposure: initialData?.regulatoryExposure ?? [],
    teamComposition: initialData?.teamComposition ?? [],
    scale: initialData?.scale ?? '',
    additionalContext: initialData?.additionalContext ?? '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const toggleArrayField = (field: 'painPoints' | 'regulatoryExposure' | 'teamComposition', value: string): void => {
    setFormData((prev) => {
      if (field === 'regulatoryExposure') {
        if (value === 'None') {
          return { ...prev, regulatoryExposure: prev.regulatoryExposure.includes('None') ? [] : ['None'] }
        }
        const without = prev.regulatoryExposure.filter((v) => v !== 'None' && v !== value)
        if (prev.regulatoryExposure.includes(value)) {
          return { ...prev, regulatoryExposure: without }
        }
        return { ...prev, regulatoryExposure: [...without, value] }
      }

      const current = prev[field]
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [field]: updated }
    })
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {}
    if (!formData.partnerName.trim()) {
      newErrors.partnerName = 'Partner name is required'
    }
    if (!formData.modelFamily) {
      newErrors.modelFamily = 'Please select a model family'
    }
    if (!formData.modelSize) {
      newErrors.modelSize = 'Please select a model size'
    }
    if (!formData.deploymentContext) {
      newErrors.deploymentContext = 'Please select a deployment context'
    }
    if (!formData.scale) {
      newErrors.scale = 'Please select a scale'
    }
    if (formData.painPoints.length === 0) {
      newErrors.painPoints = 'Select at least one pain point'
    }
    return newErrors
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section: Partner Information */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary mb-4">Partner Information</h2>
        <div className="space-y-4">
          <div>
            <Input
              label="Partner Name"
              maxLength={MAX_INPUT_LENGTH}
              placeholder="e.g., Acme Corp"
              value={formData.partnerName}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, partnerName: e.target.value }))
                setErrors((prev) => ({ ...prev, partnerName: undefined }))
              }}
              error={errors.partnerName}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="additionalContext" className="block text-xs uppercase tracking-wider text-text-secondary font-medium">
              Additional Context
            </label>
            <textarea
              id="additionalContext"
              rows={4}
              maxLength={MAX_TEXTAREA_LENGTH}
              placeholder="Describe the partner's situation, goals, or specific needs..."
              value={formData.additionalContext}
              onChange={(e) => setFormData((prev) => ({ ...prev, additionalContext: e.target.value }))}
              className="w-full rounded-md border border-[#D0CCC4] bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-[#C45A3C] focus:ring-1 focus:ring-[#C45A3C]/20 focus:outline-none transition-colors duration-200 resize-none"
            />
            <span className="text-xs text-text-tertiary font-mono">{formData.additionalContext.length}/{MAX_TEXTAREA_LENGTH}</span>
          </div>
        </div>
      </Card>

      {/* Section: Model Details */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary mb-4">Model Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              label="Model Family"
              placeholder="Select model family..."
              options={MODEL_FAMILY_OPTIONS}
              value={formData.modelFamily}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, modelFamily: e.target.value }))
                setErrors((prev) => ({ ...prev, modelFamily: undefined }))
              }}
            />
            {errors.modelFamily && <span className="text-xs text-accent-red mt-1 block">{errors.modelFamily}</span>}
          </div>
          <div>
            <Select
              label="Model Size"
              placeholder="Select model size..."
              options={MODEL_SIZE_OPTIONS}
              value={formData.modelSize}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, modelSize: e.target.value }))
                setErrors((prev) => ({ ...prev, modelSize: undefined }))
              }}
            />
            {errors.modelSize && <span className="text-xs text-accent-red mt-1 block">{errors.modelSize}</span>}
          </div>
          <div>
            <Select
              label="Deployment Context"
              placeholder="Select deployment context..."
              options={DEPLOYMENT_OPTIONS}
              value={formData.deploymentContext}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, deploymentContext: e.target.value }))
                setErrors((prev) => ({ ...prev, deploymentContext: undefined }))
              }}
            />
            {errors.deploymentContext && <span className="text-xs text-accent-red mt-1 block">{errors.deploymentContext}</span>}
          </div>
          <div>
            <Select
              label="Scale"
              placeholder="Select scale..."
              options={SCALE_OPTIONS}
              value={formData.scale}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, scale: e.target.value }))
                setErrors((prev) => ({ ...prev, scale: undefined }))
              }}
            />
            {errors.scale && <span className="text-xs text-accent-red mt-1 block">{errors.scale}</span>}
          </div>
        </div>
      </Card>

      {/* Section: Pain Points & Requirements */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary mb-4">Pain Points & Requirements</h2>
        <div className="space-y-6">
          {/* Pain Points */}
          <div>
            <span className="block text-xs uppercase tracking-wider text-text-secondary font-medium mb-2">
              Primary Pain Points
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PAIN_POINT_OPTIONS.map((pp) => (
                <label key={pp} className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-elevated transition-colors duration-150">
                  <input
                    type="checkbox"
                    checked={formData.painPoints.includes(pp)}
                    onChange={() => toggleArrayField('painPoints', pp)}
                    className="h-4 w-4 rounded border-border-default bg-base accent-[#C45A3C]"
                  />
                  <span className="text-sm text-text-primary">{pp}</span>
                </label>
              ))}
            </div>
            {errors.painPoints && <span className="text-xs text-accent-red mt-1 block">{errors.painPoints}</span>}
          </div>

          {/* Regulatory Exposure */}
          <div>
            <span className="block text-xs uppercase tracking-wider text-text-secondary font-medium mb-2">
              Regulatory Exposure
            </span>
            <div className="grid grid-cols-2 gap-2">
              {REGULATORY_OPTIONS.map((reg) => (
                <label key={reg} className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-elevated transition-colors duration-150">
                  <input
                    type="checkbox"
                    checked={formData.regulatoryExposure.includes(reg)}
                    onChange={() => toggleArrayField('regulatoryExposure', reg)}
                    className="h-4 w-4 rounded border-border-default bg-base accent-[#C45A3C]"
                  />
                  <span className="text-sm text-text-primary">{reg}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Team Composition */}
          <div>
            <span className="block text-xs uppercase tracking-wider text-text-secondary font-medium mb-2">
              Team Composition
            </span>
            <div className="grid grid-cols-2 gap-2">
              {TEAM_OPTIONS.map((team) => (
                <label key={team} className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-elevated transition-colors duration-150">
                  <input
                    type="checkbox"
                    checked={formData.teamComposition.includes(team)}
                    onChange={() => toggleArrayField('teamComposition', team)}
                    className="h-4 w-4 rounded border-border-default bg-base accent-[#C45A3C]"
                  />
                  <span className="text-sm text-text-primary">{team}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" type="submit">
          Analyze Capabilities &rarr;
        </Button>
      </div>
    </form>
  )
}
