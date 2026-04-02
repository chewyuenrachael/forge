'use client'

import { type FC } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/constants'

export const Sidebar: FC = () => {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-base border-r border-border-subtle flex flex-col z-40">
      <div className="p-6">
        <span className="font-display text-lg font-semibold text-accent-amber tracking-widest">
          FORGE
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'text-text-primary bg-elevated border-l-[3px] border-accent-amber'
                  : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border-subtle">
        <span className="text-xs text-text-tertiary">Built for Goodfire</span>
      </div>
    </aside>
  )
}
