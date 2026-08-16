import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

export type MultiSelectOption = {
  value: string
  label: string
}

type MultiSelectDropdownProps = {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  menuPlacement?: 'top' | 'bottom'
  'aria-invalid'?: boolean
  'aria-label'?: string
}

export function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  emptyMessage = 'No options available',
  disabled = false,
  className = '',
  menuPlacement = 'bottom',
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selectedOptions = useMemo(() => {
    const selected = new Set(value)
    return options.filter((option) => selected.has(option.value))
  }, [options, value])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function toggleValue(optionValue: string) {
    if (value.includes(optionValue)) {
      onChange(value.filter((id) => id !== optionValue))
      return
    }
    onChange([...value, optionValue])
  }

  function removeValue(optionValue: string) {
    onChange(value.filter((id) => id !== optionValue))
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen(true)
    }
  }

  const summary =
    selectedOptions.length === 0
      ? null
      : selectedOptions.length <= 2
        ? selectedOptions.map((option) => option.label).join(', ')
        : `${selectedOptions.length} selected`

  return (
    <div ref={rootRef} className={className}>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          aria-invalid={ariaInvalid}
          aria-label={ariaLabel}
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={onTriggerKeyDown}
          className="flex h-11 w-full items-center justify-between gap-2 rounded-none border border-line/90 bg-bg px-3.5 text-left text-ink outline-none transition hover:border-ink/25 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-400"
        >
          <span
            className={`min-w-0 flex-1 truncate text-sm ${
              summary ? 'font-medium text-ink' : 'text-ink/35'
            }`}
          >
            {summary ?? placeholder}
          </span>
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className={`h-4 w-4 shrink-0 text-ink/40 transition ${open ? 'rotate-180' : ''}`}
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {open ? (
          <div
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            className={`absolute z-30 max-h-48 w-full overflow-y-auto rounded-none border border-line bg-white py-1 shadow-lg shadow-ink/10 ${
              menuPlacement === 'top'
                ? 'bottom-full mb-1.5'
                : 'top-full mt-1.5'
            }`}
          >
            {options.length === 0 ? (
              <p className="px-3.5 py-2.5 text-sm text-ink/50">{emptyMessage}</p>
            ) : (
              options.map((option) => {
                const selected = value.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => toggleValue(option.value)}
                    className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition hover:bg-accent/40 ${
                      selected
                        ? 'bg-primary/5 font-medium text-ink'
                        : 'text-ink/80'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        selected
                          ? 'border-primary bg-primary text-white'
                          : 'border-line bg-white'
                      }`}
                    >
                      {selected ? (
                        <svg
                          viewBox="0 0 12 12"
                          className="h-3 w-3"
                          fill="none"
                        >
                          <path
                            d="M2.5 6.2L4.8 8.5L9.5 3.5"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </span>
                    <span className="min-w-0 truncate">{option.label}</span>
                  </button>
                )
              })
            )}
          </div>
        ) : null}
      </div>

      {selectedOptions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex max-w-full items-center gap-1 rounded-none bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
            >
              <span className="truncate">{option.label}</span>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${option.label}`}
                className="shrink-0 rounded text-primary/70 hover:text-primary disabled:opacity-50"
                onClick={() => removeValue(option.value)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
