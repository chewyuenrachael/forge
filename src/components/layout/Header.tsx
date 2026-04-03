import { type FC } from 'react'
import { Badge } from '@/components/ui/Badge'
import { EU_AI_ACT_DEADLINE } from '@/lib/constants'

interface HeaderProps {
  title: string
  subtitle?: string
}

function daysUntilEUAIAct(): number {
  const deadline = new Date(EU_AI_ACT_DEADLINE)
  const now = new Date()
  const diffMs = deadline.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

export const Header: FC<HeaderProps> = ({ title, subtitle }) => {
  const daysLeft = daysUntilEUAIAct()

  return (
    <header className="sticky top-0 z-10 h-14 flex items-center justify-between border-b border-border-subtle bg-base/80 backdrop-blur-sm px-8">
      <div className="flex items-baseline gap-3">
        <h1 className="font-display text-lg font-semibold text-text-primary">{title}</h1>
        {subtitle && <span className="text-sm text-text-secondary">{subtitle}</span>}
      </div>
      <Badge variant="amber" size="sm">
        <span className="font-mono">{daysLeft}</span>d to EU AI Act
      </Badge>
    </header>
  )
}
