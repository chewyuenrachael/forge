'use client'

import { type FC, useState, useCallback, useMemo, useEffect } from 'react'
import { X, Check, ChevronRight, ChevronLeft, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { InvitationGenerator } from './InvitationGenerator'
import { RSVPTracker } from './RSVPTracker'
import { PostEventCapture } from './PostEventCapture'
import type { DinnerEvent, DinnerInvitee } from '@/lib/events'
import type { PeerCluster, Prospect, Signal } from '@/types'

interface DinnerPlannerProps {
  cluster: PeerCluster
  prospects: Prospect[]
  signals: Signal[]
  onComplete: () => void
  onClose: () => void
}

type Step = 1 | 2 | 3 | 4 | 5

const STEP_LABELS: Record<Step, string> = {
  1: 'Event Details',
  2: 'Guest List',
  3: 'Invitation',
  4: 'Track RSVPs',
  5: 'Post-Event',
}

const REGION_CITIES: Record<string, string[]> = {
  EU: ['London', 'Frankfurt', 'Paris', 'Amsterdam'],
  US: ['New York', 'San Francisco', 'Washington DC'],
  APAC: ['Singapore', 'Tokyo'],
}

function getCitiesForRegion(region: string): string[] {
  if (region.toLowerCase().includes('eu') || region.toLowerCase().includes('europe')) {
    return REGION_CITIES['EU'] ?? []
  }
  if (region.toLowerCase().includes('us') || region.toLowerCase().includes('america') || region.toLowerCase().includes('north')) {
    return REGION_CITIES['US'] ?? []
  }
  if (region.toLowerCase().includes('apac') || region.toLowerCase().includes('asia') || region.toLowerCase().includes('pacific')) {
    return REGION_CITIES['APAC'] ?? []
  }
  return [...(REGION_CITIES['EU'] ?? []), ...(REGION_CITIES['US'] ?? []), ...(REGION_CITIES['APAC'] ?? [])]
}

function defaultDateThreeWeeks(): string {
  const d = new Date()
  d.setDate(d.getDate() + 21)
  return d.toISOString().split('T')[0] ?? ''
}

interface ManualContact {
  name: string
  title: string
  company: string
}

export const DinnerPlanner: FC<DinnerPlannerProps> = ({
  cluster,
  prospects,
  signals,
  onComplete,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [dinner, setDinner] = useState<DinnerEvent | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 state
  const [eventName, setEventName] = useState(`${cluster.name} AI Governance Dinner`)
  const cities = useMemo(() => getCitiesForRegion(cluster.region), [cluster.region])
  const [city, setCity] = useState(cities[0] ?? 'London')
  const [date, setDate] = useState(defaultDateThreeWeeks)
  const [format, setFormat] = useState<'chatham_house' | 'panel' | 'roundtable' | 'fireside'>('chatham_house')
  const topSignal = useMemo(
    () => signals.length > 0 ? signals.sort((a, b) => b.relevance_score - a.relevance_score)[0] ?? null : null,
    [signals]
  )
  const [topic, setTopic] = useState(
    topSignal
      ? `${topSignal.title}: Practical Approaches for ${cluster.industry}`
      : `AI Model Governance: Practical Approaches for ${cluster.industry}`
  )
  const [budget, setBudget] = useState(10000)
  const [maxAttendees, setMaxAttendees] = useState(12)
  const [goodfireAttendees, setGoodfireAttendees] = useState('')

  // Step 2 state
  const sortedProspects = useMemo(
    () => [...prospects].sort((a, b) => b.priority_score - a.priority_score),
    [prospects]
  )
  const [selectedProspectIds, setSelectedProspectIds] = useState<Set<string>>(() => {
    const top = sortedProspects.slice(0, Math.min(12, sortedProspects.length))
    return new Set(top.filter((p) => p.contacts.length > 0).map((p) => p.id))
  })
  const [manualContacts, setManualContacts] = useState<ManualContact[]>([])
  const [showManualAdd, setShowManualAdd] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualTitle, setManualTitle] = useState('')
  const [manualCompany, setManualCompany] = useState('')

  const toggleProspect = useCallback((id: string): void => {
    setSelectedProspectIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleAddManualContact = useCallback((): void => {
    if (!manualName.trim() || !manualCompany.trim()) return
    setManualContacts((prev) => [...prev, { name: manualName.trim(), title: manualTitle.trim(), company: manualCompany.trim() }])
    setManualName('')
    setManualTitle('')
    setManualCompany('')
    setShowManualAdd(false)
  }, [manualName, manualTitle, manualCompany])

  const removeManualContact = useCallback((index: number): void => {
    setManualContacts((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Build invitees from selections
  const buildInvitees = useCallback((): DinnerInvitee[] => {
    const invitees: DinnerInvitee[] = []

    for (const prospect of sortedProspects) {
      if (!selectedProspectIds.has(prospect.id)) continue
      const contact = prospect.contacts[0]
      if (!contact) continue
      invitees.push({
        prospect_id: prospect.id,
        contact,
        rsvp_status: 'not_invited',
        post_event_notes: null,
        follow_up_status: 'pending',
      })
    }

    for (const mc of manualContacts) {
      invitees.push({
        prospect_id: `manual_${mc.name.replace(/\s+/g, '_').toLowerCase()}`,
        contact: {
          name: mc.name,
          title: mc.title,
          email: null,
          linkedin_url: null,
          persona: 'executive',
          is_champion: false,
        },
        rsvp_status: 'not_invited',
        post_event_notes: null,
        follow_up_status: 'pending',
      })
    }

    return invitees
  }, [sortedProspects, selectedProspectIds, manualContacts])

  // Step navigation
  const handleNext = useCallback(async (): Promise<void> => {
    setSaving(true)
    setError(null)
    try {
      if (currentStep === 1 && !dinner) {
        const gfAttendees = goodfireAttendees.split(',').map((s) => s.trim()).filter(Boolean)
        const res = await fetch('/api/dinners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: eventName,
            cluster_id: cluster.id,
            city,
            date,
            format,
            topic,
            budget_estimate: budget,
            max_attendees: maxAttendees,
            goodfire_attendees: gfAttendees,
            signal_id: topSignal?.id ?? null,
          }),
        })
        if (!res.ok) {
          const err = await res.json() as { error: string }
          throw new Error(err.error)
        }
        const json = await res.json() as { data: DinnerEvent }
        setDinner(json.data)
      } else if (currentStep === 1 && dinner) {
        const gfAttendees = goodfireAttendees.split(',').map((s) => s.trim()).filter(Boolean)
        const res = await fetch(`/api/dinners/${dinner.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: eventName,
            city,
            date,
            format,
            topic,
            budget_estimate: budget,
            max_attendees: maxAttendees,
            goodfire_attendees: gfAttendees,
          }),
        })
        if (!res.ok) {
          const err = await res.json() as { error: string }
          throw new Error(err.error)
        }
        const json = await res.json() as { data: DinnerEvent }
        setDinner(json.data)
      } else if (currentStep === 2 && dinner) {
        const invitees = buildInvitees()
        const res = await fetch(`/api/dinners/${dinner.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invitees }),
        })
        if (!res.ok) {
          const err = await res.json() as { error: string }
          throw new Error(err.error)
        }
        const json = await res.json() as { data: DinnerEvent }
        setDinner(json.data)
      }

      if (currentStep < 5) {
        setCurrentStep((currentStep + 1) as Step)
      } else {
        onComplete()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }, [currentStep, dinner, eventName, cluster.id, city, date, format, topic, budget, maxAttendees, goodfireAttendees, topSignal, buildInvitees, onComplete])

  const handleBack = useCallback((): void => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }, [currentStep])

  // RSVP handler
  const handleUpdateRSVP = useCallback(async (prospectId: string, status: string): Promise<void> => {
    if (!dinner) return
    try {
      const res = await fetch(`/api/dinners/${dinner.id}/rsvp`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId, status }),
      })
      if (res.ok) {
        const json = await res.json() as { data: DinnerEvent }
        setDinner(json.data)
      }
    } catch {
      // Silently handle — the UI state will remain unchanged
    }
  }, [dinner])

  // Post-event handlers
  const handleSaveNotes = useCallback(async (prospectId: string, notes: string): Promise<void> => {
    if (!dinner) return
    try {
      const res = await fetch(`/api/dinners/${dinner.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId, notes }),
      })
      if (res.ok) {
        const json = await res.json() as { data: DinnerEvent }
        setDinner(json.data)
      }
    } catch {
      // Silent
    }
  }, [dinner])

  const handleGenerateFollowUp = useCallback(async (prospectId: string): Promise<void> => {
    if (!dinner) return
    try {
      await fetch(`/api/dinners/${dinner.id}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId }),
      })
    } catch {
      // Silent
    }
  }, [dinner])

  const handleCreatePipelineEntry = useCallback(async (prospectId: string): Promise<void> => {
    if (prospectId.startsWith('manual_')) return
    try {
      await fetch(`/api/prospects/${prospectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipeline_stage: 'meeting_booked',
        }),
      })
    } catch {
      // Silent
    }
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const activeDinner = dinner

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-base border border-border rounded-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div>
            <h2 className="text-lg font-semibold text-text-primary font-display">Plan Dinner</h2>
            <p className="text-xs text-text-secondary mt-0.5">{cluster.name} &middot; {cluster.industry}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-elevated rounded-md transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 px-6 py-4 border-b border-border-subtle">
          {([1, 2, 3, 4, 5] as Step[]).map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-150 ${
                  step < currentStep
                    ? 'bg-accent-amber text-text-inverse'
                    : step === currentStep
                    ? 'border-2 border-accent-amber bg-elevated text-accent-amber'
                    : 'border border-border-subtle text-text-tertiary'
                }`}
              >
                {step < currentStep ? <Check className="w-3.5 h-3.5" /> : step}
              </div>
              <span
                className={`text-xs hidden sm:inline ${
                  step === currentStep ? 'text-text-primary font-medium' : 'text-text-tertiary'
                }`}
              >
                {STEP_LABELS[step]}
              </span>
              {step < 5 && <div className={`w-6 h-px ${step < currentStep ? 'bg-accent-amber' : 'bg-border-subtle'}`} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {/* Step 1: Event Details */}
          {currentStep === 1 && (
            <div className="space-y-5 max-w-2xl">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-text-secondary font-medium">Event Name</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  maxLength={500}
                  className="w-full h-9 px-3 text-sm bg-base border border-border rounded-md text-text-primary focus:border-accent-amber focus:ring-1 focus:ring-accent-amber/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-text-secondary font-medium">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-base border border-border rounded-md text-text-primary focus:border-accent-amber focus:ring-1 focus:ring-accent-amber/30"
                  >
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-text-secondary font-medium">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-base border border-border rounded-md text-text-primary focus:border-accent-amber focus:ring-1 focus:ring-accent-amber/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-text-secondary font-medium">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as typeof format)}
                  className="w-full h-9 px-3 text-sm bg-base border border-border rounded-md text-text-primary focus:border-accent-amber focus:ring-1 focus:ring-accent-amber/30"
                >
                  <option value="chatham_house">Chatham House Rule</option>
                  <option value="panel">Panel Discussion</option>
                  <option value="roundtable">Roundtable</option>
                  <option value="fireside">Fireside Chat</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-text-secondary font-medium">Topic</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={5000}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-base border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent-amber focus:ring-1 focus:ring-accent-amber/30 resize-none"
                />
                {topSignal && (
                  <p className="text-xs text-text-tertiary">
                    Auto-suggested from signal: &ldquo;{topSignal.title}&rdquo;
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-text-secondary font-medium">Budget</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">$</span>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full h-9 pl-7 pr-3 text-sm font-mono bg-base border border-border rounded-md text-text-primary focus:border-accent-amber focus:ring-1 focus:ring-accent-amber/30"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-text-secondary font-medium">Max Attendees</label>
                  <input
                    type="number"
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(Number(e.target.value))}
                    className="w-full h-9 px-3 text-sm font-mono bg-base border border-border rounded-md text-text-primary focus:border-accent-amber focus:ring-1 focus:ring-accent-amber/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-text-secondary font-medium">Goodfire Attendees</label>
                <input
                  type="text"
                  value={goodfireAttendees}
                  onChange={(e) => setGoodfireAttendees(e.target.value)}
                  placeholder="e.g., Eric Ho, Tom McGrath"
                  className="w-full h-9 px-3 text-sm bg-base border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent-amber focus:ring-1 focus:ring-accent-amber/30"
                />
              </div>
            </div>
          )}

          {/* Step 2: Guest List */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-text-primary">Select Guests from {cluster.name}</h3>
                <span className="text-sm font-mono text-text-secondary">
                  {selectedProspectIds.size + manualContacts.length}/{maxAttendees} selected
                </span>
              </div>

              <div className="space-y-2">
                {sortedProspects.map((prospect) => {
                  const primaryContact = prospect.contacts[0]
                  const noContacts = prospect.contacts.length === 0
                  const isSelected = selectedProspectIds.has(prospect.id)

                  return (
                    <div
                      key={prospect.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-accent-amber/40 bg-accent-amber/5'
                          : 'border-border-subtle hover:bg-elevated'
                      }`}
                      onClick={() => !noContacts && toggleProspect(prospect.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={noContacts}
                        onChange={() => toggleProspect(prospect.id)}
                        className="rounded border-border text-accent-amber focus:ring-accent-amber/30"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{prospect.name}</span>
                          {noContacts && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-amber-500/15 text-amber-400">
                              <AlertTriangle className="w-3 h-3" />
                              No contacts
                            </span>
                          )}
                        </div>
                        {primaryContact && (
                          <span className="text-xs text-text-secondary">
                            {primaryContact.name} &middot; {primaryContact.title}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-text-secondary">
                        ICP: <span className="text-accent-amber">{prospect.priority_score}</span>
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Manual contacts */}
              {manualContacts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase tracking-wider text-text-secondary font-medium">Manual Additions</h4>
                  {manualContacts.map((mc, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border-subtle">
                      <div className="flex-1">
                        <span className="text-sm text-text-primary">{mc.name}</span>
                        <span className="text-xs text-text-secondary block">{mc.title} &middot; {mc.company}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeManualContact(i)}
                        className="p-1 text-text-tertiary hover:text-red-400 transition-colors duration-150"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showManualAdd ? (
                <div className="p-4 border border-border-subtle rounded-lg space-y-3">
                  <h4 className="text-xs uppercase tracking-wider text-text-secondary font-medium">Add External Contact</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Name"
                      maxLength={500}
                      className="h-9 px-3 text-sm bg-base border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent-amber focus:ring-1 focus:ring-accent-amber/30"
                    />
                    <input
                      type="text"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="Title"
                      maxLength={500}
                      className="h-9 px-3 text-sm bg-base border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent-amber focus:ring-1 focus:ring-accent-amber/30"
                    />
                    <input
                      type="text"
                      value={manualCompany}
                      onChange={(e) => setManualCompany(e.target.value)}
                      placeholder="Company"
                      maxLength={500}
                      className="h-9 px-3 text-sm bg-base border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent-amber focus:ring-1 focus:ring-accent-amber/30"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddManualContact}
                      disabled={!manualName.trim() || !manualCompany.trim()}
                      className="h-8 px-3 text-xs font-medium rounded-md bg-accent-amber text-text-inverse hover:bg-accent-amber-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowManualAdd(false)}
                      className="h-8 px-3 text-xs font-medium rounded-md border border-border text-text-secondary hover:bg-elevated transition-colors duration-150"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowManualAdd(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-elevated rounded-md transition-colors duration-150"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add External Contact
                </button>
              )}
            </div>
          )}

          {/* Step 3: Invitation */}
          {currentStep === 3 && activeDinner && (
            <InvitationGenerator
              dinner={activeDinner}
              invitees={activeDinner.invitees}
              signal={topSignal}
            />
          )}

          {/* Step 4: Track RSVPs */}
          {currentStep === 4 && activeDinner && (
            <RSVPTracker
              dinner={activeDinner}
              onUpdateRSVP={(prospectId, status) => { void handleUpdateRSVP(prospectId, status) }}
            />
          )}

          {/* Step 5: Post-Event */}
          {currentStep === 5 && activeDinner && (
            <PostEventCapture
              dinner={activeDinner}
              onSaveNotes={(prospectId, notes) => { void handleSaveNotes(prospectId, notes) }}
              onGenerateFollowUp={(prospectId) => { void handleGenerateFollowUp(prospectId) }}
              onCreatePipelineEntry={(prospectId) => { void handleCreatePipelineEntry(prospectId) }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={currentStep === 1 ? onClose : handleBack}
            className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-md border border-border text-text-primary hover:bg-elevated transition-colors duration-150"
          >
            {currentStep === 1 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                Back
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => { void handleNext() }}
            disabled={saving || (currentStep === 1 && (!eventName.trim() || !topic.trim()))}
            className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-md bg-accent-amber text-text-inverse hover:bg-accent-amber-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {saving ? 'Saving...' : currentStep === 5 ? 'Complete' : 'Next'}
            {!saving && currentStep < 5 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
