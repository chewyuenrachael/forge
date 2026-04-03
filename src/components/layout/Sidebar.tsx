'use client'

import { type FC } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/constants'

export const Sidebar: FC = () => {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface border-r border-border-subtle flex flex-col z-40">
      {/* Wordmark */}
      <div className="px-6 py-5">
        <span className="font-display text-lg font-semibold text-text-primary tracking-widest">
          FORGE
        </span>
        <div className="text-xs text-text-tertiary mt-0.5">for Goodfire</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#C45A3C]/30 focus:ring-offset-2 focus:ring-offset-surface ${
                isActive
                  ? 'text-[#C45A3C] bg-[#C45A3C]/[0.08]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-[#F0EDE6]'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 pb-4 border-t border-border-subtle pt-4">
        <span className="text-xs text-text-tertiary">Built as proof-of-work</span>
      </div>
    </aside>
  )
}
