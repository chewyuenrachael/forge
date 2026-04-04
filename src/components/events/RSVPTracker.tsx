'use client'

import { type FC, useState, useCallback } from 'react'
import { ChevronDown, AlertTriangle } from 'lucide-react'
import type { DinnerEvent, RSVPStatus } from '@/lib/events'

interface RSVPTrackerProps {
  dinner: DinnerEvent
  onUpdateRSVP: (prospectId: string, status: string) => void
}

const RSVP_OPTIONS: { value: RSVPStatus; label: string }[] = [
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'tentative', label: 'Tentative' },
  { value: 'invited', label: 'Pending' },
]

function rsvpBadgeClass(status: RSVPStatus): string {
  switch (status) {
    case 'accepted': return 'bg-green-500/15 text-green-400'
    case 'declined': return 'bg-red-500/15 text-red-400'
    case 'tentative': return 'bg-blue-500/15 text-blue-400'
    case 'invited': return 'bg-amber-500/15 text-amber-400'
    case 'not_invited': return 'bg-gray-500/15 text-gray-400'
  }
}

function rsvpLabel(status: RSVPStatus): string {
  switch (status) {
    case 'accepted': return 'Accepted \u2713'
    case 'declined': return 'Declined \u2717'
    case 'tentative': return 'Tentative'
    case 'invited': return 'Pending'
    case 'not_invited': return 'Not Invited'
  }
}

export const RSVPTracker: FC<RSVPTrackerProps> = ({ dinner, onUpdateRSVP }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const handleStatusChange = useCallback((prospectId: string, status: string): void => {
    onUpdateRSVP(prospectId, status)
    setOpenDropdown(null)
  }, [onUpdateRSVP])

  const accepted = dinner.invitees.filter((i) => i.rsvp_status === 'accepted').length
  const pending = dinner.invitees.filter((i) => i.rsvp_status === 'invited').length
  const declined = dinner.invitees.filter((i) => i.rsvp_status === 'declined').length
  const tentative = dinner.invitees.filter((i) => i.rsvp_status === 'tentative').length
  const overCapacity = accepted > dinner.max_attendees

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">Guest</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">Company</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">RSVP Status</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dinner.invitees.map((invitee) => (
              <tr key={invitee.prospect_id} className="border-b border-border-subtle">
                <td className="px-4 py-3">
                  <div>
                    <span className="text-sm text-text-primary">{invitee.contact.name}</span>
                    <span className="block text-xs text-text-secondary">{invitee.contact.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-text-primary">{invitee.prospect_id}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md ${rsvpBadgeClass(invitee.rsvp_status)}`}>
                    {rsvpLabel(invitee.rsvp_status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(openDropdown === invitee.prospect_id ? null : invitee.prospect_id)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-elevated rounded-md transition-colors duration-150"
                    >
                      Change
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {openDropdown === invitee.prospect_id && (
                      <div className="absolute right-0 top-full mt-1 z-10 bg-surface border border-border rounded-md shadow-lg py-1 min-w-[140px]">
                        {RSVP_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleStatusChange(invitee.prospect_id, opt.value)}
                            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-elevated transition-colors duration-150 ${
                              invitee.rsvp_status === opt.value ? 'text-accent-amber' : 'text-text-primary'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-surface rounded-lg border border-border-subtle">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-text-secondary">
            Accepted: <span className="font-mono text-green-400">{accepted}</span>
          </span>
          <span className="text-text-secondary">
            Pending: <span className="font-mono text-amber-400">{pending}</span>
          </span>
          <span className="text-text-secondary">
            Tentative: <span className="font-mono text-blue-400">{tentative}</span>
          </span>
          <span className="text-text-secondary">
            Declined: <span className="font-mono text-red-400">{declined}</span>
          </span>
        </div>
        <span className="text-sm font-mono text-text-primary">
          Capacity: {accepted}/{dinner.max_attendees}
        </span>
      </div>

      {overCapacity && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-sm text-amber-400">
            Over capacity — consider adding a second dinner date.
          </span>
        </div>
      )}
    </div>
  )
}
