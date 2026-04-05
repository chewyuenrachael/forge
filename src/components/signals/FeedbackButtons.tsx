'use client'

import { type FC, useState, useCallback, useRef } from 'react'
import { ThumbsUp, ThumbsDown, ChevronUp, ChevronDown } from 'lucide-react'
import type { FeedbackValue } from '@/lib/constants'

interface FeedbackButtonsProps {
  signalId: string
  currentFeedback: FeedbackValue | null
  onFeedback: (signalId: string, feedback: FeedbackValue) => Promise<void>
  compact?: boolean
}

export const FeedbackButtons: FC<FeedbackButtonsProps> = ({
  signalId,
  currentFeedback,
  onFeedback,
  compact = false,
}) => {
  const [optimisticFeedback, setOptimisticFeedback] = useState<FeedbackValue | null>(currentFeedback)
  const [errorFlash, setErrorFlash] = useState<'positive' | 'negative' | null>(null)
  const [pulsing, setPulsing] = useState<'positive' | 'negative' | null>(null)
  const prevFeedbackRef = useRef<FeedbackValue | null>(currentFeedback)

  // Sync with prop changes from parent
  if (currentFeedback !== prevFeedbackRef.current) {
    prevFeedbackRef.current = currentFeedback
    setOptimisticFeedback(currentFeedback)
  }

  const handleClick = useCallback(async (value: FeedbackValue): Promise<void> => {
    const previous = optimisticFeedback

    // Optimistic update: toggle if already selected, otherwise set
    const next = optimisticFeedback === value ? null : value
    setOptimisticFeedback(next)

    // Pulse animation
    setPulsing(value)
    setTimeout(() => setPulsing(null), 150)

    try {
      // Parent handles the actual API call including null/toggle logic
      await onFeedback(signalId, value)
    } catch {
      // Revert on error
      setOptimisticFeedback(previous)
      setErrorFlash(value)
      setTimeout(() => setErrorFlash(null), 600)
    }
  }, [signalId, optimisticFeedback, onFeedback])

  if (compact) {
    return (
      <div className="inline-flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => void handleClick('positive')}
          aria-label="Mark signal as useful"
          aria-pressed={optimisticFeedback === 'positive'}
          className={`p-0.5 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C45A3C]/30 ${
            pulsing === 'positive' ? 'scale-110' : 'scale-100'
          } ${
            errorFlash === 'positive' ? 'bg-[#EDCFCF]' : ''
          } ${
            optimisticFeedback === 'positive'
              ? 'text-[#3D6B35]'
              : optimisticFeedback === 'negative'
                ? 'text-text-tertiary opacity-30'
                : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          onClick={() => void handleClick('negative')}
          aria-label="Mark signal as noise"
          aria-pressed={optimisticFeedback === 'negative'}
          className={`p-0.5 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C45A3C]/30 ${
            pulsing === 'negative' ? 'scale-110' : 'scale-100'
          } ${
            errorFlash === 'negative' ? 'bg-[#EDCFCF]' : ''
          } ${
            optimisticFeedback === 'negative'
              ? 'text-[#8A2020]'
              : optimisticFeedback === 'positive'
                ? 'text-text-tertiary opacity-30'
                : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <ChevronDown size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-text-secondary">Was this signal useful?</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handleClick('positive')}
          aria-label="Mark signal as useful"
          aria-pressed={optimisticFeedback === 'positive'}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C45A3C]/30 focus:ring-offset-2 focus:ring-offset-[#FAFAF7] ${
            pulsing === 'positive' ? 'scale-110' : 'scale-100'
          } ${
            errorFlash === 'positive' ? 'border-[#8A2020] bg-[#EDCFCF]' : ''
          } ${
            optimisticFeedback === 'positive'
              ? 'bg-[#D4E7D0] text-[#3D6B35] border-[#3D6B35]/30'
              : optimisticFeedback === 'negative'
                ? 'border-[#D0CCC4] text-text-tertiary opacity-40 cursor-default'
                : 'border-[#D0CCC4] text-text-secondary hover:bg-[#F0EDE6] hover:text-text-primary'
          }`}
        >
          <ThumbsUp size={13} />
          Useful
        </button>
        <button
          type="button"
          onClick={() => void handleClick('negative')}
          aria-label="Mark signal as noise"
          aria-pressed={optimisticFeedback === 'negative'}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C45A3C]/30 focus:ring-offset-2 focus:ring-offset-[#FAFAF7] ${
            pulsing === 'negative' ? 'scale-110' : 'scale-100'
          } ${
            errorFlash === 'negative' ? 'border-[#8A2020] bg-[#EDCFCF]' : ''
          } ${
            optimisticFeedback === 'negative'
              ? 'bg-[#EDCFCF] text-[#8A2020] border-[#8A2020]/30'
              : optimisticFeedback === 'positive'
                ? 'border-[#D0CCC4] text-text-tertiary opacity-40 cursor-default'
                : 'border-[#D0CCC4] text-text-secondary hover:bg-[#F0EDE6] hover:text-text-primary'
          }`}
        >
          <ThumbsDown size={13} />
          Noise
        </button>
      </div>
    </div>
  )
}
