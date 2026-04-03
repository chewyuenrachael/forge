'use client'

import { type FC, useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { ContentCalendarItem } from '@/types'

interface ContentCalendarProps {
  items: ContentCalendarItem[]
  selectedDate?: string
  onSelectDate: (date: string) => void
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const
const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const TYPE_COLOR: Record<string, 'blue' | 'amber' | 'green' | 'purple' | 'gray'> = {
  research: 'blue', regulatory: 'amber', conference: 'green', competitive: 'purple', suggested: 'gray',
}

function parseDate(dateStr: string): { year: number; month: number; day: number } | null {
  const parts = dateStr.split('-')
  const y = Number(parts[0]); const m = Number(parts[1]); const d = Number(parts[2])
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null
  return { year: y, month: m - 1, day: d }
}

export const ContentCalendar: FC<ContentCalendarProps> = ({ items, selectedDate, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(3)
  const [currentYear, setCurrentYear] = useState(2026)

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOffset = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7

  const itemsByDay = useMemo(() => {
    const map: Record<number, ContentCalendarItem[]> = {}
    for (const item of items) {
      const parsed = parseDate(item.date)
      if (parsed && parsed.year === currentYear && parsed.month === currentMonth) {
        const existing = map[parsed.day]
        if (existing) { existing.push(item) } else { map[parsed.day] = [item] }
      }
    }
    return map
  }, [items, currentMonth, currentYear])

  const selectedItems = useMemo(() => {
    if (!selectedDate) return []
    return items.filter((item) => item.date === selectedDate)
  }, [items, selectedDate])

  const handlePrev = (): void => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1) }
    else { setCurrentMonth(currentMonth - 1) }
  }

  const handleNext = (): void => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1) }
    else { setCurrentMonth(currentMonth + 1) }
  }

  const formatDateKey = (day: number): string => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const todayStr = '2026-04-02'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          {MONTH_NAMES[currentMonth] ?? ''} {currentYear}
        </h2>
        <div className="flex gap-1">
          <Button variant="ghost" className="h-7 w-7 p-0 flex items-center justify-center" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="h-7 w-7 p-0 flex items-center justify-center" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7">
        {DAY_HEADERS.map((name) => (
          <div key={name} className="text-xs uppercase tracking-wider text-text-secondary font-medium text-center py-2">
            {name}
          </div>
        ))}
        {Array.from({ length: firstDayOffset }, (_, i) => (
          <div key={`empty-${i}`} className="h-24 border border-border-subtle bg-base" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dateKey = formatDateKey(day)
          const dayItems = itemsByDay[day]
          const isToday = dateKey === todayStr
          const isSelected = selectedDate === dateKey
          return (
            <button
              key={day}
              onClick={() => onSelectDate(dateKey)}
              className={`h-24 border border-border-subtle p-1 text-left transition-colors duration-150 hover:bg-elevated overflow-hidden ${
                isToday ? 'border-accent-amber border-2' : ''
              } ${isSelected ? 'bg-elevated' : ''}`}
            >
              <span className={`text-xs block mb-0.5 ${isToday ? 'text-accent-amber font-semibold' : 'text-text-secondary'}`}>
                {day}
              </span>
              <div className="space-y-0.5">
                {dayItems?.slice(0, 2).map((item) => (
                  <div key={item.id} className="truncate leading-none">
                    <span className={`text-[10px] font-medium px-1 py-px rounded ${
                      TYPE_COLOR[item.type] === 'blue' ? 'bg-blue-500/15 text-blue-400' :
                      TYPE_COLOR[item.type] === 'amber' ? 'bg-amber-500/15 text-amber-400' :
                      TYPE_COLOR[item.type] === 'green' ? 'bg-green-500/15 text-green-400' :
                      TYPE_COLOR[item.type] === 'purple' ? 'bg-purple-500/15 text-purple-400' :
                      'bg-gray-500/15 text-gray-400'
                    }`}>
                      {item.title.length > 20 ? item.title.slice(0, 18) + '...' : item.title}
                    </span>
                  </div>
                ))}
                {(dayItems?.length ?? 0) > 2 && (
                  <span className="text-[10px] text-text-tertiary">+{(dayItems?.length ?? 0) - 2} more</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selectedDate && selectedItems.length > 0 && (
        <Card className="mt-2">
          <h3 className="text-sm font-medium text-text-primary mb-2">{selectedDate}</h3>
          <div className="space-y-2">
            {selectedItems.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <Badge variant={TYPE_COLOR[item.type] ?? 'gray'}>{item.type}</Badge>
                <div>
                  <p className="text-sm font-medium text-text-primary">{item.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
