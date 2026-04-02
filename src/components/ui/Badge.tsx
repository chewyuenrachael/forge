import { type FC } from 'react'

type BadgeVariant = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'gray'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  amber: 'bg-amber-500/15 text-amber-400',
  blue: 'bg-blue-500/15 text-blue-400',
  green: 'bg-green-500/15 text-green-400',
  red: 'bg-red-500/15 text-red-400',
  purple: 'bg-purple-500/15 text-purple-400',
  gray: 'bg-gray-500/15 text-gray-400',
}

export const Badge: FC<BadgeProps> = ({ children, variant = 'gray' }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}
