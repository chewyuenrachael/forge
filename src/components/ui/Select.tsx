import { type FC, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export const Select: FC<SelectProps> = ({ label, options, className = '', id, ...props }) => {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs uppercase tracking-wider text-text-secondary font-medium">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`h-9 w-full rounded-md border border-border-default bg-base px-3 text-sm text-text-primary focus:border-accent-amber focus:ring-1 focus:ring-accent-amber/30 focus:outline-none transition-colors duration-150 ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
