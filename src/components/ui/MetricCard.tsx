import { type FC } from 'react'

interface MetricCardProps {
  value: string
  label: string
  trend?: { value: string; positive: boolean }
}

export const MetricCard: FC<MetricCardProps> = ({ value, label, trend }) => {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-4">
      <div className="font-display text-3xl font-semibold text-text-primary tracking-tight">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-text-secondary font-medium">{label}</div>
      {trend && (
        <div className={`mt-2 inline-flex items-center text-xs font-medium ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
          <span className="font-mono">{trend.positive ? '+' : ''}{trend.value}</span>
        </div>
      )}
    </div>
  )
}
