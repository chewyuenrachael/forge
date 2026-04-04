'use client'

import { type FC, useState, useCallback, useMemo } from 'react'
import { Copy, Check, Mail, Calendar, Send } from 'lucide-react'
import type { DinnerEvent, DinnerInvitee } from '@/lib/events'
import type { Signal } from '@/types'

interface InvitationGeneratorProps {
  dinner: DinnerEvent
  invitees: DinnerInvitee[]
  signal: Signal | null
}

const FORMAT_LABELS: Record<string, string> = {
  chatham_house: 'Chatham House Rule',
  panel: 'Panel Discussion',
  roundtable: 'Roundtable',
  fireside: 'Fireside Chat',
}

function formatRuleDescription(format: string): string {
  switch (format) {
    case 'chatham_house':
      return 'The evening will follow Chatham House Rule \u2014 all discussion is non-attributable, encouraging candid exchange of perspectives and challenges.'
    case 'panel':
      return 'The evening will feature a moderated panel discussion followed by open Q&A and networking.'
    case 'roundtable':
      return 'The evening will be structured as an intimate roundtable, giving every participant the opportunity to share their perspective.'
    case 'fireside':
      return 'The evening will feature a fireside conversation followed by open discussion among all attendees.'
    default:
      return ''
  }
}

function generateInvitationText(
  dinner: DinnerEvent,
  contactName: string,
  signal: Signal | null,
  goodfireHost: string
): string {
  const venue = dinner.venue ?? 'Venue TBC'
  const signalContext = signal
    ? `With ${signal.title} reshaping expectations across the industry, this is a timely moment to exchange perspectives on practical approaches and shared challenges.`
    : 'As regulatory and market pressures accelerate, this is a timely moment to exchange perspectives on practical approaches and shared challenges.'
  const ruleDescription = formatRuleDescription(dinner.format)

  return `GOODFIRE
Executive ${FORMAT_LABELS[dinner.format] ?? 'Roundtable'} Dinner

${dinner.topic}

${dinner.date} \u00B7 ${dinner.city}
Hosted by Goodfire \u00B7 ${venue}

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

Dear ${contactName},

I would like to invite you to an intimate dinner bringing together ${dinner.max_attendees} senior leaders to discuss ${dinner.topic}.

${signalContext}

${ruleDescription}

I hope you can join us.

Best regards,
${goodfireHost}
Goodfire`
}

export const InvitationGenerator: FC<InvitationGeneratorProps> = ({ dinner, invitees, signal }) => {
  const [copiedInvitation, setCopiedInvitation] = useState(false)
  const [copiedEmails, setCopiedEmails] = useState(false)
  const [markingSent, setMarkingSent] = useState(false)
  const [markedSent, setMarkedSent] = useState(false)

  const goodfireHost = dinner.goodfire_attendees.length > 0
    ? (dinner.goodfire_attendees[0] ?? 'The Goodfire Team')
    : 'The Goodfire Team'

  const previewInvitation = useMemo(
    () => generateInvitationText(dinner, '{Recipient Name}', signal, goodfireHost),
    [dinner, signal, goodfireHost]
  )

  const allEmails = useMemo(
    () => invitees
      .filter((inv) => inv.contact.email)
      .map((inv) => inv.contact.email)
      .join('; '),
    [invitees]
  )

  const handleCopyInvitation = useCallback(async (): Promise<void> => {
    await navigator.clipboard.writeText(previewInvitation)
    setCopiedInvitation(true)
    setTimeout(() => setCopiedInvitation(false), 2000)
  }, [previewInvitation])

  const handleCopyEmails = useCallback(async (): Promise<void> => {
    await navigator.clipboard.writeText(allEmails)
    setCopiedEmails(true)
    setTimeout(() => setCopiedEmails(false), 2000)
  }, [allEmails])

  const handleMarkSent = useCallback(async (): Promise<void> => {
    setMarkingSent(true)
    try {
      const updatedInvitees = invitees.map((inv) => ({
        ...inv,
        rsvp_status: inv.rsvp_status === 'not_invited' ? 'invited' as const : inv.rsvp_status,
      }))

      const res = await fetch(`/api/dinners/${dinner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitees: updatedInvitees,
          status: 'invitations_sent',
        }),
      })

      if (res.ok) {
        setMarkedSent(true)
      }
    } finally {
      setMarkingSent(false)
    }
  }, [dinner.id, invitees])

  const calendarUrl = useMemo((): string => {
    const dateStr = dinner.date.replace(/-/g, '')
    const title = encodeURIComponent(dinner.name)
    const details = encodeURIComponent(`Topic: ${dinner.topic}\nHosted by Goodfire`)
    const location = encodeURIComponent(dinner.venue ? `${dinner.venue}, ${dinner.city}` : dinner.city)
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}&location=${location}`
  }, [dinner])

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border-subtle rounded-lg p-6">
        <pre className="whitespace-pre-wrap font-sans text-sm text-text-primary leading-relaxed">
          {previewInvitation}
        </pre>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopyInvitation}
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-md border border-border text-text-primary hover:bg-elevated transition-colors duration-150"
        >
          {copiedInvitation ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copiedInvitation ? 'Copied' : 'Copy Invitation'}
        </button>

        <button
          type="button"
          onClick={handleCopyEmails}
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-md border border-border text-text-primary hover:bg-elevated transition-colors duration-150"
        >
          {copiedEmails ? <Check className="w-4 h-4 text-green-400" /> : <Mail className="w-4 h-4" />}
          {copiedEmails ? 'Copied' : 'Copy All Emails'}
        </button>

        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-md border border-border text-text-primary hover:bg-elevated transition-colors duration-150"
        >
          <Calendar className="w-4 h-4" />
          Add to Calendar
        </a>

        <button
          type="button"
          onClick={handleMarkSent}
          disabled={markingSent || markedSent}
          className={`inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-md transition-colors duration-150 ${
            markedSent
              ? 'bg-green-500/15 text-green-400 cursor-default'
              : 'bg-accent-amber text-text-inverse hover:bg-accent-amber-hover'
          } ${markingSent ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {markedSent ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {markedSent ? 'Invitations Sent' : markingSent ? 'Sending...' : 'Mark Invitations Sent'}
        </button>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs uppercase tracking-wider text-text-secondary font-medium">Individual Gmail Links</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {invitees.filter((inv) => inv.contact.email).map((inv) => {
            const personalInvitation = generateInvitationText(dinner, inv.contact.name, signal, goodfireHost)
            const subject = encodeURIComponent(`Invitation: ${dinner.name}`)
            const body = encodeURIComponent(personalInvitation)
            const mailtoUrl = `mailto:${inv.contact.email}?subject=${subject}&body=${body}`

            return (
              <a
                key={inv.prospect_id}
                href={mailtoUrl}
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated rounded-md transition-colors duration-150"
              >
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{inv.contact.name}</span>
                <span className="text-xs text-text-tertiary truncate">({inv.contact.email})</span>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
