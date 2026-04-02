import {
  LayoutDashboard,
  Target,
  Cpu,
  BookOpen,
  Truck,
  Settings,
} from 'lucide-react'
import type { ElementType } from 'react'

export const MAX_INPUT_LENGTH = 500
export const MAX_TEXTAREA_LENGTH = 5000
export const MAX_SEARCH_LENGTH = 200
export const RATE_LIMIT_MAX = 10
export const RATE_LIMIT_WINDOW_MS = 60_000
export const EU_AI_ACT_DEADLINE = '2026-08-02'

export interface NavItem {
  label: string
  href: string
  icon: ElementType
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'GTM Command Center', href: '/gtm', icon: Target },
  { label: 'Solution Architect', href: '/solutions', icon: Cpu },
  { label: 'Narrative Engine', href: '/narratives', icon: BookOpen },
  { label: 'Research Delivery', href: '/delivery', icon: Truck },
  { label: 'Operations', href: '/ops', icon: Settings },
]
