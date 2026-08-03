import { useEffect, useId, useRef, useState } from 'react'
import {
  DEFAULT_THEME_COLOR,
  THEME_PRESETS,
  isDefaultThemeColor,
} from '../../lib/theme'
import { useThemeStore } from '../../stores/useThemeStore'

export function ThemeColorPicker() {
  const color = useThemeStore((state) => state.color)
  const setColor = useThemeStore((state) => state.setColor)
  const resetColor = useThemeStore((state) => state.resetColor)
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState(color)
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const isDefault = isDefaultThemeColor(color)

  useEffect(() => {
    setCustom(color)
  }, [color])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Choose theme color"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        title="Theme color"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-ink/60 transition hover:border-primary/30 hover:text-primary"
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
          <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
        <span
          className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full ring-2 ring-white"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Theme colors"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-64 animate-fade-in rounded-xl border border-line/90 bg-white p-4 shadow-lg shadow-ink/10"
        >
          <p className="text-sm font-semibold text-ink">Theme color</p>
          <p className="mt-0.5 text-xs text-ink/50">
            Updates accents and the morphism background
          </p>

          <div className="mt-3 grid grid-cols-4 gap-2.5">
            {THEME_PRESETS.map((preset) => {
              const selected = color.toLowerCase() === preset.value.toLowerCase()
              return (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.name}
                  aria-label={preset.name}
                  aria-pressed={selected}
                  onClick={() => {
                    setColor(preset.value)
                    setOpen(false)
                  }}
                  className={`relative h-9 w-full rounded-lg transition ${
                    selected
                      ? 'ring-2 ring-primary ring-offset-2'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.value }}
                />
              )
            })}
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-ink/60">
              Custom color
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                aria-label="Custom theme color"
                onChange={(event) => {
                  setCustom(event.target.value)
                  setColor(event.target.value)
                }}
                className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-white p-1"
              />
              <input
                type="text"
                value={custom}
                spellCheck={false}
                aria-label="Theme color hex value"
                onChange={(event) => setCustom(event.target.value)}
                onBlur={() => setColor(custom)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setColor(custom)
                    setOpen(false)
                  }
                }}
                className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </label>

          <button
            type="button"
            disabled={isDefault}
            onClick={() => {
              resetColor()
              setCustom(DEFAULT_THEME_COLOR)
              setOpen(false)
            }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-semibold text-ink/75 transition hover:bg-accent/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-ink/75"
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
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset to default
          </button>
        </div>
      ) : null}
    </div>
  )
}
