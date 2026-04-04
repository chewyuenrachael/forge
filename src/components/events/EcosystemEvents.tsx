'use client'

import { type FC, useState, useCallback } from 'react'
import { Calendar, MapPin, Users, ChevronDown, ExternalLink } from 'lucide-react'
import type { EcosystemEvent, GoodfireAction } from '@/lib/events'
import type { Prospect } from '@/types'

interface EcosystemEventsProps {
  events: EcosystemEvent[]
  prospects: Prospect[]
}

const TYPE_BADGE_CLASS: Record<string, string> = {
  conference: 'bg-blue-500/15 text-blue-400',
  workshop: 'bg-purple-500/15 text-purple-400',
  summit: 'bg-amber-500/15 text-amber-400',
  roundtable: 'bg-green-500/15 text-green-400',
}

const ACTION_OPTIONS: { value: GoodfireAction; label: string }[] = [
  { value: 'attend', label: 'Attend' },
  { value: 'speak', label: 'Speak' },
  { value: 'host_side_event', label: 'Host Side Event' },
  { value: 'skip', label: 'Skip' },
]

const ACTION_BADGE_CLASS: Record<string, string> = {
  attend: 'bg-blue-500/15 text-blue-400',
  speak: 'bg-green-500/15 text-green-400',
  host_side_event: 'bg-amber-500/15 text-amber-400',
  skip: 'bg-gray-500/15 text-gray-400',
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const EcosystemEvents: FC<EcosystemEventsProps> = ({ events }) => {
  const [actions, setActions] = useState<Record<string, GoodfireAction>>(() => {
    const initial: Record<string, GoodfireAction> = {}
    for (const event of events) {
      initial[event.id] = event.goodfire_action
    }
    return initial
  })
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const handleActionChange = useCallback((eventId: string, action: GoodfireAction): void => {
    setActions((prev) => ({ ...prev, [eventId]: action }))
    setOpenDropdown(null)
  }, [])

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-4">
      {sortedEvents.map((event) => {
        const currentAction = actions[event.id] ?? event.goodfire_action

        return (
          <div key={event.id} className="bg-surface border border-border-subtle rounded-lg p-5 space-y-3 hover:bg-elevated transition-colors duration-150">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-text-primary">{event.name}</h4>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md ${TYPE_BADGE_CLASS[event.type] ?? 'bg-gray-500/15 text-gray-400'}`}>
                    {event.type}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">{event.organizer}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md ${ACTION_BADGE_CLASS[currentAction] ?? ''}`}>
                  {ACTION_OPTIONS.find((o) => o.value === currentAction)?.label ?? currentAction}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-mono">{formatEventDate(event.date)}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {event.city}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span className="font-mono">~{event.estimated_attendees.toLocaleString()}</span> attendees
              </span>
              <span className="inline-flex items-center gap-1">
                Relevance: <span className="font-mono text-accent-amber">{event.relevance_score}</span>
              </span>
            </div>

            {event.target_buyers_present.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-text-tertiary font-medium">Target buyers likely present</span>
                <div className="flex flex-wrap gap-1.5">
                  {event.target_buyers_present.map((buyer) => (
                    <span key={buyer} className="inline-flex px-2 py-0.5 text-xs rounded-md bg-base text-text-secondary">
                      {buyer}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {event.notes && (
              <p className="text-xs text-text-secondary italic">{event.notes}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === event.id ? null : event.id)}
                  className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-base rounded-md border border-border-subtle transition-colors duration-150"
                >
                  Action
                  <ChevronDown className="w-3 h-3" />
                </button>
                {openDropdown === event.id && (
                  <div className="absolute left-0 top-full mt-1 z-10 bg-surface border border-border rounded-md shadow-lg py-1 min-w-[160px]">
                    {ACTION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleActionChange(event.id, opt.value)}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-elevated transition-colors duration-150 ${
                          currentAction === opt.value ? 'text-accent-amber' : 'text-text-primary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {currentAction === 'host_side_event' && (
                <span className="inline-flex items-center gap-1 text-xs text-accent-amber cursor-pointer hover:underline">
                  <ExternalLink className="w-3 h-3" />
                  Plan Side Dinner
                </span>
              )}
            </div>
          </div>
        )
      })}

      {events.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          <Calendar className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No upcoming ecosystem events.</p>
        </div>
      )}
    </div>
  )
}
