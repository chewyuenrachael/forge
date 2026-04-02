import { type FC, type ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent-amber text-text-inverse hover:bg-accent-amber-hover',
  secondary: 'border border-border-default text-text-primary hover:bg-elevated',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-elevated',
}

export const Button: FC<ButtonProps> = ({ variant = 'secondary', className = '', children, disabled, ...props }) => {
  return (
    <button
      className={`h-9 px-4 text-sm font-medium rounded-md transition-colors duration-150 focus:ring-2 focus:ring-accent-amber/40 focus:ring-offset-2 focus:ring-offset-base ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
