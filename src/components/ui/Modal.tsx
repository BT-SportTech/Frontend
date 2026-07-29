import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { GlassPanel } from '../ui'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Modal({
  open,
  title,
  onClose,
  children,
  className = '',
}: ModalProps) {
  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative z-10 w-full max-w-lg"
      >
        <GlassPanel
          strong
          className={`modal-content animate-rise max-h-[90vh] overflow-y-auto p-6 shadow-2xl shadow-ink/20 ${className}`}
        >
          <h2
            id="modal-title"
            className="text-[1.375rem] font-semibold tracking-tight text-ink"
          >
            {title}
          </h2>
          {children}
        </GlassPanel>
      </div>
    </div>,
    document.body,
  )
}
