'use client'

import React, { type FC, useState, useCallback } from 'react'
import {
  ChevronRight,
  CheckCircle2,
  Clock,
  Circle,
  Octagon,
  Trash2,
  MoreHorizontal,
  Plus,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { InlineEdit } from '@/components/delivery/InlineEdit'
import { StatusDropdown } from '@/components/delivery/StatusDropdown'
import { PredictionPanel } from '@/components/delivery/PredictionPanel'
import type {
  Engagement,
  Milestone,
  Prediction,
  UpdateEngagementInput,
  UpdateMilestoneInput,
  CreateMilestoneInput,
} from '@/types'
import type { PredictionOutcome } from '@/lib/constants'
import type { PredictionAccuracyReport } from '@/lib/predictions'

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

interface EngagementTrackerProps {
  engagements: Engagement[]
  predictions: Prediction[]
  accuracy: PredictionAccuracyReport | null
  onUpdateEngagement: (id: string, data: UpdateEngagementInput) => Promise<void>
  onDeleteEngagement: (id: string) => Promise<void>
  onUpdateMilestone: (id: string, data: UpdateMilestoneInput) => Promise<void>
  onDeleteMilestone: (id: string) => Promise<void>
  onCreateMilestone: (engagementId: string, data: Omit<CreateMilestoneInput, 'engagement_id'>) => Promise<void>
  onCreateEngagement: () => void
  onCreatePrediction: (engagementId: string) => void
  onRecordOutcome: (id: string, outcome: PredictionOutcome, notes?: string) => Promise<void>
}

const ENG_STATUS_OPTIONS: Array<{ value: string; label: string; variant: BadgeVariant }> = [
  { value: 'proposed', label: 'Proposed', variant: 'amber' },
  { value: 'active', label: 'Active', variant: 'green' },
  { value: 'paused', label: 'Paused', variant: 'gray' },
  { value: 'completed', label: 'Completed', variant: 'blue' },
]

const MS_STATUS_OPTIONS: Array<{ value: string; label: string; variant: BadgeVariant }> = [
  { value: 'upcoming', label: 'Upcoming', variant: 'gray' },
  { value: 'in_progress', label: 'In Progress', variant: 'amber' },
  { value: 'completed', label: 'Completed', variant: 'green' },
  { value: 'blocked', label: 'Blocked', variant: 'red' },
]

function healthColor(score: number): string {
  if (score >= 80) return 'text-[#3D6B35]'
  if (score >= 60) return 'text-[#8A6B20]'
  return 'text-[#8A2020]'
}

function progressBarColor(score: number): string {
  if (score >= 80) return 'bg-[#3D6B35]'
  if (score >= 60) return 'bg-[#8A6B20]'
  return 'bg-[#8A2020]'
}

function milestoneIcon(status: Milestone['status']): React.ReactNode {
  switch (status) {
    case 'completed': return <CheckCircle2 size={14} className="text-[#3D6B35] shrink-0" />
    case 'in_progress': return <Clock size={14} className="text-[#8A6B20] shrink-0" />
    case 'upcoming': return <Circle size={14} className="text-text-tertiary shrink-0" />
    case 'blocked': return <Octagon size={14} className="text-[#8A2020] shrink-0" />
  }
}

// ─── Add Milestone Form ───────────────────────────────────────────────

interface AddMilestoneFormProps {
  engagementId: string
  onAdd: (engagementId: string, data: Omit<CreateMilestoneInput, 'engagement_id'>) => Promise<void>
  onCancel: () => void
}

const AddMilestoneForm: FC<AddMilestoneFormProps> = ({ engagementId, onAdd, onCancel }) => {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<Milestone['status']>('upcoming')
  const [saving, setSaving] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !dueDate) return
    setSaving(true)
    try {
      await onAdd(engagementId, { title: title.trim(), due_date: dueDate, status })
      setTitle('')
      setDueDate('')
      setStatus('upcoming')
    } finally {
      setSaving(false)
    }
  }, [title, dueDate, status, engagementId, onAdd])

  return (
    <div className="flex items-center gap-2 pt-2 mt-2 border-t border-dashed border-[#D0CCC4]">
      <input
        type="text"
        placeholder="Milestone title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={500}
        disabled={saving}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        className="flex-1 h-7 rounded border border-[#D0CCC4] bg-white px-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-[#C45A3C] focus:ring-1 focus:ring-[#C45A3C]/20"
        onKeyDown={(e) => {
          if (e.key === 'Enter') void handleSubmit()
          if (e.key === 'Escape') onCancel()
        }}
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        disabled={saving}
        className="h-7 rounded border border-[#D0CCC4] bg-white px-2 text-xs text-text-primary focus:outline-none focus:border-[#C45A3C] focus:ring-1 focus:ring-[#C45A3C]/20"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as Milestone['status'])}
        disabled={saving}
        className="h-7 rounded border border-[#D0CCC4] bg-white px-2 text-xs text-text-primary focus:outline-none focus:border-[#C45A3C]"
      >
        <option value="upcoming">Upcoming</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="blocked">Blocked</option>
      </select>
      <Button size="sm" variant="primary" onClick={() => void handleSubmit()} disabled={saving || !title.trim() || !dueDate}>
        Add
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>
    </div>
  )
}

// ─── Menu Dropdown ─────────────────────────────────────────────────────

interface RowMenuProps {
  onDelete: () => void
}

const RowMenu: FC<RowMenuProps> = ({ onDelete }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-[#F0EDE6] transition-colors"
        aria-label="Engagement actions"
      >
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-[#D0CCC4] bg-white shadow-sm">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#8A2020] hover:bg-[#EDCFCF]/50 transition-colors rounded-md"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete() }}
            >
              <Trash2 size={13} />
              Delete Engagement
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────

export const EngagementTracker: FC<EngagementTrackerProps> = ({
  engagements,
  predictions,
  accuracy,
  onUpdateEngagement,
  onDeleteEngagement,
  onUpdateMilestone,
  onDeleteMilestone,
  onCreateMilestone,
  onCreateEngagement,
  onCreatePrediction,
  onRecordOutcome,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addingMilestoneFor, setAddingMilestoneFor] = useState<string | null>(null)
  const [activeTabMap, setActiveTabMap] = useState<Record<string, string>>({})

  if (engagements.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-text-secondary text-sm mb-4">No partner engagements yet</p>
          <Button variant="primary" onClick={onCreateEngagement}>
            <Plus size={14} className="mr-1.5" /> New Engagement
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card
      noPadding
      header={
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Partner Engagements</h3>
          <Button size="sm" variant="primary" onClick={onCreateEngagement}>
            <Plus size={13} className="mr-1" /> New Engagement
          </Button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-default">
              <th className="w-8" />
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Partner</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Status</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left">Capabilities</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-right">Health</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium text-left w-44">Progress</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {engagements.map((eng) => {
              const isExpanded = expandedId === eng.id
              const completed = eng.milestones.filter((m) => m.status === 'completed').length
              const total = eng.milestones.length
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0

              return (
                <React.Fragment key={eng.id}>
                  <tr
                    className="border-b border-border-subtle hover:bg-[#F0EDE6]/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : eng.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(isExpanded ? null : eng.id) } }}
                    aria-expanded={isExpanded}
                  >
                    <td className="w-8 text-center">
                      <ChevronRight
                        size={14}
                        className={`inline-block text-text-tertiary transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-left">
                      <span className="text-sm font-medium text-text-primary truncate block" title={eng.partner_name}>
                        {eng.partner_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left" onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown
                        value={eng.status}
                        options={ENG_STATUS_OPTIONS}
                        onChange={async (newStatus) => {
                          await onUpdateEngagement(eng.id, { status: newStatus as Engagement['status'] })
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex gap-1 flex-wrap">
                        {eng.capabilities_applied.map((capId) => (
                          <Badge key={capId} variant="purple" size="sm">{capId.replace('cap-', '')}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono text-sm font-semibold ${healthColor(eng.health_score)}`}>
                      {eng.health_score}
                    </td>
                    <td className="px-4 py-3 w-44">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-[#E8E4D9] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${progressBarColor(eng.health_score)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-text-secondary whitespace-nowrap">
                          {completed}/{total}
                        </span>
                      </div>
                    </td>
                    <td className="w-10 text-center" onClick={(e) => e.stopPropagation()}>
                      <RowMenu onDelete={() => void onDeleteEngagement(eng.id)} />
                    </td>
                  </tr>

                  {/* Expanded detail with tabs */}
                  {isExpanded && (() => {
                    const activeTab = activeTabMap[eng.id] ?? 'milestones'
                    const engPredictions = predictions.filter((p) => p.engagement_id === eng.id)
                    const tabItems = [
                      { id: 'milestones', label: `Milestones (${eng.milestones.length})` },
                      { id: 'predictions', label: `Predictions (${engPredictions.length})` },
                    ]

                    return (
                      <tr>
                        <td colSpan={7} className="p-0 bg-[#F0EDE6]/30 border-b border-border-subtle">
                          <div className="px-4 py-4 pl-12">
                            <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                              <Tabs
                                tabs={tabItems}
                                activeTab={activeTab}
                                onChange={(id) => setActiveTabMap((prev) => ({ ...prev, [eng.id]: id }))}
                              />
                            </div>

                            {activeTab === 'milestones' && (
                              <>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-xs font-mono text-text-secondary">
                                    Started {eng.start_date}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  {eng.milestones.map((ms) => (
                                    <div key={ms.id} className="group/ms flex items-center gap-3 py-1.5 rounded hover:bg-[#F0EDE6] px-2 -mx-2">
                                      {milestoneIcon(ms.status)}
                                      <div className="flex-1 min-w-0">
                                        <InlineEdit
                                          value={ms.title}
                                          onSave={async (newTitle) => {
                                            await onUpdateMilestone(ms.id, { title: newTitle })
                                          }}
                                          className="text-sm text-text-primary"
                                        />
                                      </div>
                                      <div onClick={(e) => e.stopPropagation()}>
                                        <StatusDropdown
                                          value={ms.status}
                                          options={MS_STATUS_OPTIONS}
                                          onChange={async (newStatus) => {
                                            await onUpdateMilestone(ms.id, { status: newStatus as Milestone['status'] })
                                          }}
                                        />
                                      </div>
                                      <InlineEdit
                                        value={ms.due_date}
                                        onSave={async (newDate) => {
                                          await onUpdateMilestone(ms.id, { due_date: newDate })
                                        }}
                                        type="date"
                                        className="font-mono text-xs text-text-secondary"
                                      />
                                      {ms.status === 'completed' && ms.completed_date && (
                                        <span className="text-xs text-text-tertiary font-mono">
                                          Done {ms.completed_date}
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => void onDeleteMilestone(ms.id)}
                                        className="opacity-0 group-hover/ms:opacity-100 p-1 text-text-tertiary hover:text-[#8A2020] transition-all"
                                        aria-label={`Delete milestone: ${ms.title}`}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* Add milestone */}
                                {addingMilestoneFor === eng.id ? (
                                  <AddMilestoneForm
                                    engagementId={eng.id}
                                    onAdd={async (engId, data) => {
                                      await onCreateMilestone(engId, data)
                                      setAddingMilestoneFor(null)
                                    }}
                                    onCancel={() => setAddingMilestoneFor(null)}
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setAddingMilestoneFor(eng.id)}
                                    className="flex items-center gap-1 mt-3 text-xs text-text-secondary hover:text-text-primary transition-colors"
                                  >
                                    <Plus size={12} /> Add Milestone
                                  </button>
                                )}
                              </>
                            )}

                            {activeTab === 'predictions' && (
                              <div onClick={(e) => e.stopPropagation()}>
                                <PredictionPanel
                                  engagement={eng}
                                  predictions={engPredictions}
                                  accuracy={accuracy}
                                  onCreatePrediction={() => onCreatePrediction(eng.id)}
                                  onRecordOutcome={onRecordOutcome}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })()}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
