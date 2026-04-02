import { type FC, type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export const Card: FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`rounded-lg border border-border-subtle bg-surface p-4 transition-colors duration-150 ${className}`}>
      {children}
    </div>
  )
}
