'use client'

import { type FC, useState, useRef, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'

interface InlineEditProps {
  value: string
  onSave: (newValue: string) => Promise<void>
  type?: 'text' | 'date'
  maxLength?: number
  placeholder?: string
  className?: string
}

export const InlineEdit: FC<InlineEditProps> = ({
  value,
  onSave,
  type = 'text',
  maxLength = 500,
  placeholder = '',
  className = '',
}) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if (type === 'text') {
        inputRef.current.select()
      }
    }
  }, [editing, type])

  const save = useCallback(async () => {
    const trimmed = draft.trim()
    if (trimmed === value || trimmed.length === 0) {
      setDraft(value)
      setEditing(false)
      return
    }

    setSaving(true)
    setError(false)
    try {
      await onSave(trimmed)
      setEditing(false)
    } catch {
      setError(true)
      setDraft(value)
      setTimeout(() => {
        setError(false)
        setEditing(false)
      }, 800)
    } finally {
      setSaving(false)
    }
  }, [draft, value, onSave])

  const cancel = useCallback(() => {
    setDraft(value)
    setEditing(false)
  }, [value])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void save()
    } else if (e.key === 'Escape') {
      cancel()
    }
  }, [save, cancel])

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`text-left hover:underline hover:decoration-border-default decoration-dotted underline-offset-2 cursor-text ${className}`}
        title="Click to edit"
      >
        {value || <span className="text-text-tertiary">{placeholder}</span>}
      </button>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void save()}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        className={`h-7 rounded border px-1.5 text-sm text-text-primary bg-white transition-colors ${
          error ? 'border-[#8A2020]' : 'border-[#D0CCC4] focus:border-[#C45A3C]'
        } focus:outline-none focus:ring-1 focus:ring-[#C45A3C]/20 ${className}`}
        style={{ width: type === 'date' ? '140px' : `${Math.max(80, draft.length * 8)}px` }}
      />
      {saving && <Loader2 size={12} className="animate-spin text-text-tertiary" />}
    </span>
  )
}
