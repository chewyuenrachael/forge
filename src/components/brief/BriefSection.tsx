'use client'

import { type FC, type ReactNode, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface BriefSectionProps {
  title: string
  icon: ReactNode
  children: ReactNode
  priority?: 'high' | 'normal' | 'low'
  defaultOpen?: boolean
}

export const BriefSection: FC<BriefSectionProps> = ({
  title,
  icon,
  children,
  priority = 'normal',
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const borderClass = priority === 'high'
    ? 'border-l-2 border-l-[#8A6B20] pl-4'
    : ''

  return (
    <section className={`mb-8 ${borderClass}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <span className="text-text-tertiary">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="text-text-tertiary">{icon}</span>
        <span className="text-xs uppercase tracking-wider text-text-tertiary font-medium group-hover:text-text-secondary transition-colors duration-150">
          {title}
        </span>
      </button>
      <div className="mt-2 mb-4 border-b border-border-subtle" />
      {isOpen && <div className="mt-4">{children}</div>}
    </section>
  )
}
