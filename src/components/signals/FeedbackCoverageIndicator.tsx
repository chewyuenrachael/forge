'use client'

import { type FC } from 'react'

interface FeedbackCoverageIndicatorProps {
  coverage: number
  totalSignals: number
  ratedSignals: number
}

function getCoverageColor(coverage: number): string {
  if (coverage >= 50) return 'bg-[#3D6B35]'
  if (coverage >= 30) return 'bg-[#8A6B20]'
  return 'bg-[#8A2020]'
}

function getCoverageTextColor(coverage: number): string {
  if (coverage >= 50) return 'text-[#3D6B35]'
  if (coverage >= 30) return 'text-[#8A6B20]'
  return 'text-[#8A2020]'
}

function getCoverageMessage(coverage: number): string {
  if (coverage >= 50) return `Feedback: ${coverage}%`
  if (coverage >= 30) return `Feedback: ${coverage}% — rate more signals`
  return 'Low feedback — rate signals to improve recommendations'
}

export const FeedbackCoverageIndicator: FC<FeedbackCoverageIndicatorProps> = ({
  coverage,
  totalSignals,
  ratedSignals,
}) => {
  if (totalSignals === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-text-tertiary flex-shrink-0" />
        No signals
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${getCoverageTextColor(coverage)}`}
      title={`${ratedSignals} of ${totalSignals} signals rated`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${getCoverageColor(coverage)} flex-shrink-0`} />
      {getCoverageMessage(coverage)}
    </span>
  )
}
