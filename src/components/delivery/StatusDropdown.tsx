'use client'

import { type FC, useState, useRef, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/Badge'

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

interface StatusOption {
  value: string
  label: string
  variant: BadgeVariant
}

interface StatusDropdownProps {
  value: string
  options: StatusOption[]
  onChange: (newValue: string) => Promise<void>
}

export const StatusDropdown: FC<StatusDropdownProps> = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentOption = options.find((o) => o.value === value) ?? options[0]

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, handleClickOutside])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen((prev) => !prev)
    }
  }, [])

  const handleSelect = useCallback(async (optionValue: string) => {
    if (optionValue === value) {
      setOpen(false)
      return
    }
    setOpen(false)
    await onChange(optionValue)
  }, [value, onChange])

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className="focus:outline-none focus:ring-2 focus:ring-[#C45A3C]/30 rounded-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Status: ${currentOption?.label ?? value}`}
      >
        {currentOption && (
          <Badge variant={currentOption.variant}>{currentOption.label}</Badge>
        )}
      </button>

      {open && (
        <div
          className="absolute z-20 mt-1 min-w-[140px] rounded-md border border-[#D0CCC4] bg-white shadow-sm"
          role="listbox"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[#F0EDE6] transition-colors first:rounded-t-md last:rounded-b-md ${
                opt.value === value ? 'bg-[#F0EDE6]' : ''
              }`}
              onClick={() => void handleSelect(opt.value)}
            >
              <Badge variant={opt.variant} size="sm">{opt.label}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
