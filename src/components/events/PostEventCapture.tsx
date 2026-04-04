'use client'

import { type FC, useState, useCallback } from 'react'
import { Copy, Check, Mail, ArrowRight, UserPlus } from 'lucide-react'
import type { DinnerEvent, DinnerInvitee } from '@/lib/events'

interface PostEventCaptureProps {
  dinner: DinnerEvent
  onSaveNotes: (prospectId: string, notes: string) => void
  onGenerateFollowUp: (prospectId: string) => void
  onCreatePipelineEntry: (prospectId: string) => void
}

interface AttendeeState {
  notes: string
  generateFollowUp: boolean
  createPipeline: boolean
  scheduleMeeting: boolean
  followUpText: string | null
  followUpSent: boolean
  pipelineCreated: boolean
  copiedFollowUp: boolean
  notesSaved: boolean
}

function generateFollowUpTemplate(dinner: DinnerEvent, invitee: DinnerInvitee, notes: string): string {
  const goodfireHost = dinner.goodfire_attendees.length > 0
    ? dinner.goodfire_attendees[0]
    : 'The Goodfire Team'

  const notesLine = notes
    ? `I wanted to follow up on your interest in ${notes.slice(0, 200)}${notes.length > 200 ? '...' : ''}.`
    : 'I wanted to follow up on the themes we explored during the evening.'

  return `Dear ${invitee.contact.name},

Thank you for joining our dinner in ${dinner.city}. ${notesLine}

At Goodfire, we have been working on interpretability tools that directly address several of the challenges discussed \u2014 particularly around model transparency and auditability under ${dinner.topic}.

I would welcome the opportunity to show you how our sparse autoencoder technology works in practice and explore whether it could support your team\u2019s objectives.

Would you be available for a 30-minute call in the next two weeks?

Best regards,
${goodfireHost}
Goodfire`
}

export const PostEventCapture: FC<PostEventCaptureProps> = ({
  dinner,
  onSaveNotes,
  onGenerateFollowUp,
  onCreatePipelineEntry,
}) => {
  const acceptedInvitees = dinner.invitees.filter((inv) => inv.rsvp_status === 'accepted')

  const [attendeeStates, setAttendeeStates] = useState<Record<string, AttendeeState>>(() => {
    const initial: Record<string, AttendeeState> = {}
    for (const inv of acceptedInvitees) {
      initial[inv.prospect_id] = {
        notes: inv.post_event_notes ?? '',
        generateFollowUp: true,
        createPipeline: true,
        scheduleMeeting: false,
        followUpText: null,
        followUpSent: false,
        pipelineCreated: false,
        copiedFollowUp: false,
        notesSaved: false,
      }
    }
    return initial
  })

  const updateAttendeeState = useCallback((prospectId: string, update: Partial<AttendeeState>): void => {
    setAttendeeStates((prev) => {
      const existing = prev[prospectId]
      if (!existing) return prev
      return { ...prev, [prospectId]: { ...existing, ...update } }
    })
  }, [])

  const handleSaveNotes = useCallback((prospectId: string): void => {
    const state = attendeeStates[prospectId]
    if (!state) return
    onSaveNotes(prospectId, state.notes)
    updateAttendeeState(prospectId, { notesSaved: true })
    setTimeout(() => updateAttendeeState(prospectId, { notesSaved: false }), 2000)
  }, [attendeeStates, onSaveNotes, updateAttendeeState])

  const handleGenerateFollowUp = useCallback((invitee: DinnerInvitee): void => {
    const state = attendeeStates[invitee.prospect_id]
    if (!state) return
    const text = generateFollowUpTemplate(dinner, invitee, state.notes)
    updateAttendeeState(invitee.prospect_id, { followUpText: text })
    onGenerateFollowUp(invitee.prospect_id)
  }, [attendeeStates, dinner, onGenerateFollowUp, updateAttendeeState])

  const handleCopyFollowUp = useCallback(async (prospectId: string): Promise<void> => {
    const state = attendeeStates[prospectId]
    if (!state?.followUpText) return
    await navigator.clipboard.writeText(state.followUpText)
    updateAttendeeState(prospectId, { copiedFollowUp: true })
    setTimeout(() => updateAttendeeState(prospectId, { copiedFollowUp: false }), 2000)
  }, [attendeeStates, updateAttendeeState])

  const handleMarkSent = useCallback((prospectId: string): void => {
    updateAttendeeState(prospectId, { followUpSent: true })
  }, [updateAttendeeState])

  const handleCreatePipeline = useCallback((prospectId: string): void => {
    onCreatePipelineEntry(prospectId)
    updateAttendeeState(prospectId, { pipelineCreated: true })
  }, [onCreatePipelineEntry, updateAttendeeState])

  const followUpsSent = Object.values(attendeeStates).filter((s) => s.followUpSent).length
  const pipelineCreated = Object.values(attendeeStates).filter((s) => s.pipelineCreated).length

  return (
    <div className="space-y-6">
      {acceptedInvitees.map((invitee) => {
        const state = attendeeStates[invitee.prospect_id]
        if (!state) return null

        const goodfireHost = dinner.goodfire_attendees.length > 0
          ? (dinner.goodfire_attendees[0] ?? 'The Goodfire Team')
          : 'The Goodfire Team'
        const subject = encodeURIComponent(`Following up from ${dinner.name}`)
        const mailtoBody = encodeURIComponent(state.followUpText ?? '')
        const mailtoUrl = invitee.contact.email
          ? `mailto:${invitee.contact.email}?subject=${subject}&body=${mailtoBody}&from=${encodeURIComponent(goodfireHost)}`
          : null

        return (
          <div key={invitee.prospect_id} className="bg-surface border border-border-subtle rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">{invitee.contact.name}</h4>
                <span className="text-xs text-text-secondary">{invitee.contact.title}</span>
              </div>
              {state.pipelineCreated && (
                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-md bg-green-500/15 text-green-400">
                  Pipeline Created
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-text-secondary font-medium">Meeting Notes</label>
              <textarea
                value={state.notes}
                onChange={(e) => updateAttendeeState(invitee.prospect_id, { notes: e.target.value })}
                placeholder="E.g., Interested in model audit for claims processing model. Deploying Llama 3.3. Asked about EU AI Act compliance timeline."
                className="w-full h-24 px-3 py-2 text-sm bg-base border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent-amber focus:ring-1 focus:ring-accent-amber/30 resize-none"
                maxLength={5000}
              />
              <button
                type="button"
                onClick={() => handleSaveNotes(invitee.prospect_id)}
                className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-elevated rounded-md transition-colors duration-150"
              >
                {state.notesSaved ? <Check className="w-3 h-3 text-green-400" /> : <ArrowRight className="w-3 h-3" />}
                {state.notesSaved ? 'Saved' : 'Save Notes'}
              </button>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.generateFollowUp}
                  onChange={(e) => updateAttendeeState(invitee.prospect_id, { generateFollowUp: e.target.checked })}
                  className="rounded border-border text-accent-amber focus:ring-accent-amber/30"
                />
                <span className="text-text-primary">Generate follow-up email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.createPipeline}
                  onChange={(e) => updateAttendeeState(invitee.prospect_id, { createPipeline: e.target.checked })}
                  className="rounded border-border text-accent-amber focus:ring-accent-amber/30"
                />
                <span className="text-text-primary">Create pipeline opportunity</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.scheduleMeeting}
                  onChange={(e) => updateAttendeeState(invitee.prospect_id, { scheduleMeeting: e.target.checked })}
                  className="rounded border-border text-accent-amber focus:ring-accent-amber/30"
                />
                <span className="text-text-primary">Schedule 1:1 meeting</span>
              </label>
            </div>

            {state.generateFollowUp && !state.followUpText && (
              <button
                type="button"
                onClick={() => handleGenerateFollowUp(invitee)}
                className="inline-flex items-center gap-2 h-8 px-3 text-xs font-medium rounded-md border border-border text-text-primary hover:bg-elevated transition-colors duration-150"
              >
                <Mail className="w-3.5 h-3.5" />
                Generate Follow-up
              </button>
            )}

            {state.followUpText && (
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-text-secondary font-medium">Follow-up Preview</label>
                <div className="bg-base border border-border-subtle rounded-md p-4">
                  <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                    {state.followUpText}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyFollowUp(invitee.prospect_id)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border border-border text-text-primary hover:bg-elevated transition-colors duration-150"
                  >
                    {state.copiedFollowUp ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {state.copiedFollowUp ? 'Copied' : 'Copy Follow-up'}
                  </button>
                  {mailtoUrl && (
                    <a
                      href={mailtoUrl}
                      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border border-border text-text-primary hover:bg-elevated transition-colors duration-150"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Open in Gmail
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleMarkSent(invitee.prospect_id)}
                    disabled={state.followUpSent}
                    className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md transition-colors duration-150 ${
                      state.followUpSent
                        ? 'bg-green-500/15 text-green-400 cursor-default'
                        : 'border border-border text-text-primary hover:bg-elevated'
                    }`}
                  >
                    {state.followUpSent ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    {state.followUpSent ? 'Sent' : 'Mark Sent'}
                  </button>
                </div>
              </div>
            )}

            {state.createPipeline && !state.pipelineCreated && (
              <button
                type="button"
                onClick={() => handleCreatePipeline(invitee.prospect_id)}
                className="inline-flex items-center gap-2 h-8 px-3 text-xs font-medium rounded-md bg-accent-amber text-text-inverse hover:bg-accent-amber-hover transition-colors duration-150"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create Pipeline Opportunity
              </button>
            )}
          </div>
        )
      })}

      {acceptedInvitees.length > 0 && (
        <div className="bg-surface border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-primary">
            Dinner complete: <span className="font-mono text-accent-amber">{acceptedInvitees.length}</span> attendees.{' '}
            <span className="font-mono text-green-400">{followUpsSent}</span> follow-ups sent.{' '}
            <span className="font-mono text-blue-400">{pipelineCreated}</span> new pipeline opportunities created.
          </p>
        </div>
      )}

      {acceptedInvitees.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          <p className="text-sm">No accepted invitees yet. RSVPs must be confirmed before capturing post-event notes.</p>
        </div>
      )}
    </div>
  )
}
