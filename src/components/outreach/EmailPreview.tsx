'use client'

import { type FC, useState, useCallback } from 'react'
import { Copy, Check, Mail, Pencil, Save, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { GeneratedOutreach } from '@/lib/outreach'

interface EmailPreviewProps {
  outreach: GeneratedOutreach
  onEdit: (edited: GeneratedOutreach) => void
  prospectName: string
  prospectId?: string
  signalId?: string
  compact?: boolean
}

const DIFF_LEVEL_LABELS: Record<string, string> = {
  surface: 'Surface',
  mechanism: 'Mechanism',
  proof: 'Proof',
}

const AUDIENCE_LABELS: Record<string, string> = {
  ml_engineer: 'ML Engineer',
  cto: 'CTO',
  compliance: 'Compliance',
  researcher: 'Researcher',
  ai_community: 'AI Community',
}

export const EmailPreview: FC<EmailPreviewProps> = ({
  outreach,
  onEdit,
  prospectName,
  prospectId,
  signalId,
  compact = false,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedSubject, setEditedSubject] = useState(outreach.subject)
  const [editedBody, setEditedBody] = useState(outreach.body)
  const [copied, setCopied] = useState(false)
  const [marked, setMarked] = useState(false)
  const [marking, setMarking] = useState(false)

  const handleCopy = useCallback((): void => {
    const text = `Subject: ${outreach.subject}\n\n${outreach.body}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // Clipboard API not available
    })
  }, [outreach])

  const handleSaveEdit = useCallback((): void => {
    onEdit({ ...outreach, subject: editedSubject, body: editedBody })
    setIsEditing(false)
  }, [outreach, editedSubject, editedBody, onEdit])

  const handleMarkSent = useCallback(async (): Promise<void> => {
    if (!prospectId || !signalId || marked) return
    setMarking(true)
    try {
      await fetch('/api/outreach/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId, signalId, outreach }),
      })
      setMarked(true)
    } catch {
      // Silently fail — user can retry
    } finally {
      setMarking(false)
    }
  }, [prospectId, signalId, outreach, marked])

  return (
    <Card>
      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-primary">{prospectName}</span>
          <div className="flex gap-1">
            <Badge variant="blue" size="sm">
              {AUDIENCE_LABELS[outreach.audience] ?? outreach.audience}
            </Badge>
            <Badge variant="gray" size="sm">
              {DIFF_LEVEL_LABELS[outreach.differentiationLevel] ?? outreach.differentiationLevel}
            </Badge>
          </div>
        </div>

        {/* Email header */}
        <div className="rounded-md border border-border-subtle bg-white p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-tertiary font-medium w-12">Subject:</span>
            {isEditing ? (
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="flex-1 h-7 rounded-md border border-[#D0CCC4] bg-white px-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-[#C45A3C]/30 focus:border-[#C45A3C]"
                maxLength={500}
              />
            ) : (
              <span className="text-text-primary font-medium">{outreach.subject}</span>
            )}
          </div>

          <div className="border-t border-border-subtle pt-2">
            {isEditing ? (
              <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={compact ? 8 : 12}
                className="w-full rounded-md border border-[#D0CCC4] bg-white px-3 py-2 text-sm text-text-primary leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#C45A3C]/30 focus:border-[#C45A3C]"
                maxLength={5000}
              />
            ) : (
              <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {outreach.body}
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        {!compact && (
          <div className="flex flex-wrap gap-2 items-center text-[10px] text-text-tertiary">
            <span>Benchmarks:</span>
            {outreach.benchmarks.length > 0 ? (
              outreach.benchmarks.map((b, i) => (
                <span key={i} className="font-mono bg-[#F0EDE6] px-1.5 py-0.5 rounded">
                  {b.length > 60 ? `${b.slice(0, 60)}...` : b}
                </span>
              ))
            ) : (
              <span className="italic">None cited</span>
            )}
          </div>
        )}

        {!compact && outreach.signalReference && (
          <div className="text-[10px] text-text-tertiary">
            Signal: <span className="font-medium">{outreach.signalReference}</span>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-2 pt-1 border-t border-border-subtle">
          {isEditing ? (
            <Button variant="ghost" size="sm" onClick={handleSaveEdit}>
              <span className="flex items-center gap-1"><Save className="h-3 w-3" /> Save</span>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => { setIsEditing(true); setEditedSubject(outreach.subject); setEditedBody(outreach.body) }}>
              <span className="flex items-center gap-1"><Pencil className="h-3 w-3" /> Edit</span>
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? (
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-[#3D6B35]" /> Copied</span>
            ) : (
              <span className="flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</span>
            )}
          </Button>

          <a
            href={outreach.gmailLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-[#F0EDE6] rounded-md transition-colors duration-200"
          >
            <ExternalLink className="h-3 w-3" /> Gmail
          </a>

          <a
            href={outreach.mailtoLink}
            className="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-[#F0EDE6] rounded-md transition-colors duration-200"
          >
            <Mail className="h-3 w-3" /> Mail
          </a>

          {prospectId && signalId && (
            <Button
              variant={marked ? 'ghost' : 'primary'}
              size="sm"
              onClick={handleMarkSent}
              disabled={marked || marking}
              className="ml-auto"
            >
              {marked ? (
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-[#3D6B35]" /> Recorded</span>
              ) : marking ? (
                <span>Recording...</span>
              ) : (
                <span>Mark as Sent</span>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
