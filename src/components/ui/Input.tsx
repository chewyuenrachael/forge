import { type FC, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input: FC<InputProps> = ({ label, className = '', id, ...props }) => {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs uppercase tracking-wider text-text-secondary font-medium">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`h-9 w-full rounded-md border border-border-default bg-base px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-amber focus:ring-1 focus:ring-accent-amber/30 focus:outline-none transition-colors duration-150 ${className}`}
        {...props}
      />
    </div>
  )
}
