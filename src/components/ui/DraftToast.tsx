interface DraftToastProps {
  open: boolean
  title?: string
  description?: string
  onResume: () => void
  onDismiss: () => void
}

export function DraftToast({
  open,
  title = 'Unsaved school draft',
  description = 'You left a school form unfinished. Tap to continue where you left off.',
  onResume,
  onDismiss,
}: DraftToastProps) {
  if (!open) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[110] flex justify-center p-4 sm:justify-end">
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-line bg-white p-4 shadow-2xl shadow-ink/20 animate-rise">
        <button
          type="button"
          onClick={onResume}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-xs text-ink/55">{description}</p>
          <p className="mt-2 text-xs font-semibold text-primary">
            Continue editing →
          </p>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss draft"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink/40 transition hover:bg-line/60 hover:text-ink"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
