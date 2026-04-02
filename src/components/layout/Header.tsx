import { type FC } from 'react'

interface HeaderProps {
  title: string
  subtitle?: string
}

export const Header: FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="sticky top-0 z-30 h-14 flex items-center border-b border-border-subtle bg-base/80 backdrop-blur-sm px-8">
      <div className="flex items-baseline gap-3">
        <h1 className="font-display text-xl font-semibold text-text-primary">{title}</h1>
        {subtitle && <span className="text-sm text-text-secondary">{subtitle}</span>}
      </div>
    </header>
  )
}
