import { type FC, type ChangeEventHandler } from 'react'
import { MAX_INPUT_LENGTH } from '@/lib/constants'

interface InputProps {
  label?: string
  placeholder?: string
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  type?: string
  maxLength?: number
  required?: boolean
  error?: string
  className?: string
}

export const Input: FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  maxLength = MAX_INPUT_LENGTH,
  required,
  error,
  className = '',
}) => {
  const inputId = label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs uppercase tracking-wider text-text-secondary font-medium mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        className={`h-9 w-full rounded-md border bg-base px-3 text-sm text-text-primary placeholder:text-text-tertiary transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-accent-amber/30 ${
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-border-default focus:border-accent-amber'
        }`}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
