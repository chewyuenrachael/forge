import { type FC, type ReactNode } from 'react'

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: ReactNode
  variant: BadgeVariant
  size?: BadgeSize
}

const variantClasses: Record<BadgeVariant, string> = {
  amber: 'bg-amber-500/15 text-amber-400',
  blue: 'bg-blue-500/15 text-blue-400',
  green: 'bg-green-500/15 text-green-400',
  red: 'bg-red-500/15 text-red-400',
  purple: 'bg-purple-500/15 text-purple-400',
  gray: 'bg-gray-500/15 text-gray-400',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
}

export const Badge: FC<BadgeProps> = ({ children, variant, size = 'md' }) => {
  return (
    <span className={`inline-flex items-center font-medium rounded-md ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  )
}
