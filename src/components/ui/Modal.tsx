import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { GlassPanel } from '../ui'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
  panelClassName?: string
}

export function Modal({
  open,
  title,
  onClose,
  children,
  className = 'w-full max-w-[calc(100vw-2rem)] sm:max-w-lg',
  panelClassName = '',
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
        className="absolute inset-0 bg-ink/55"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-10 w-full ${className}`}
      >
        <GlassPanel
          strong
          className={`modal-content animate-rise max-h-[90vh] overflow-y-auto p-6 shadow-2xl shadow-ink/20 ${panelClassName}`}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2
              id="modal-title"
              className="text-[1.375rem] font-semibold tracking-tight text-ink"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink/50 transition hover:bg-line/60 hover:text-ink"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          {children}
        </GlassPanel>
      </div>
    </div>,
    document.body,
  )
}
