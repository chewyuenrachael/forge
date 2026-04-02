import { type FC, type ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export const Modal: FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-overlay" onClick={onClose} role="presentation" />
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-border-subtle bg-surface p-6">
        <h2 className="font-display text-xl font-semibold text-text-primary mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}
