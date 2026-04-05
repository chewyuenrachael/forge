import { type FC } from 'react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface KeyMetricHighlightProps {
  name: string
  value: string
  trend: 'up' | 'down' | 'stable'
  context?: string
}

export const KeyMetricHighlight: FC<KeyMetricHighlightProps> = ({
  name,
  value,
  trend,
  context,
}) => {
  const trendColor = trend === 'up'
    ? 'text-[#3D6B35] bg-[#D4E7D0]'
    : trend === 'down'
      ? 'text-[#8A2020] bg-[#EDCFCF]'
      : 'text-[#5C5A50] bg-[#E8E4D9]'

  const TrendIcon = trend === 'up'
    ? ArrowUpRight
    : trend === 'down'
      ? ArrowDownRight
      : Minus

  const trendLabel = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'

  return (
    <Card className="text-center py-8">
      <div className="text-xs uppercase tracking-wider text-text-tertiary font-medium mb-3">
        {name}
      </div>
      <div className="flex items-center justify-center gap-3">
        <span className="font-display text-4xl font-semibold text-text-primary">
          {value}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-sm font-medium font-mono ${trendColor}`}>
          <TrendIcon size={16} />
          {trendLabel}
        </span>
      </div>
      {context && (
        <div className="mt-3 text-sm text-text-secondary max-w-md mx-auto">
          {context}
        </div>
      )}
    </Card>
  )
}
