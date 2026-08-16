import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { FormField } from '../events/EventFormField'
import { TextInput } from '../ui'
import {
  fetchPlaceDetails,
  fetchPlaceSuggestions,
  type PlaceDetails,
  type PlaceSuggestion,
} from '../../lib/queries/places'

export type PlaceAutocompleteResult = {
  venue: string
  details: PlaceDetails
  suggestion: PlaceSuggestion
}

type PlaceAutocompleteFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (result: PlaceAutocompleteResult) => void
  error?: string
  required?: boolean
  placeholder?: string
  hint?: string
}

export function PlaceAutocompleteField({
  label,
  value,
  onChange,
  onPlaceSelect,
  error,
  required,
  placeholder = 'Search venue or address…',
  hint,
}: PlaceAutocompleteFieldProps) {
  const fieldId = useId()
  const listId = `${fieldId}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<number | null>(null)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    function onDocMouseDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current != null) window.clearTimeout(debounceRef.current)
    }
  }, [])

  function scheduleSearch(query: string) {
    if (debounceRef.current != null) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      void runSearch(query)
    }, 300)
  }

  async function runSearch(query: string) {
    const q = query.trim()
    if (q.length < 2) {
      setSuggestions([])
      setLoading(false)
      setSearchError('')
      return
    }

    setLoading(true)
    setSearchError('')
    try {
      const results = await fetchPlaceSuggestions(q)
      setSuggestions(results)
      setOpen(true)
      setActiveIndex(results.length > 0 ? 0 : -1)
    } catch {
      setSuggestions([])
      setSearchError('Could not search places. Try again.')
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  async function selectSuggestion(suggestion: PlaceSuggestion) {
    setResolving(true)
    setSearchError('')
    try {
      const details = await fetchPlaceDetails(suggestion.placeId)
      const venue =
        suggestion.primaryText.trim() ||
        details.formattedAddress?.trim() ||
        suggestion.fullText.trim()
      onChange(venue)
      onPlaceSelect({ venue, details, suggestion })
      setOpen(false)
      setSuggestions([])
      setActiveIndex(-1)
    } catch {
      setSearchError('Could not load place details. Try again.')
      setOpen(true)
    } finally {
      setResolving(false)
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (event.key === 'Escape') setOpen(false)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
      return
    }
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      void selectSuggestion(suggestions[activeIndex]!)
      return
    }
    if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  const showList = open && (loading || resolving || searchError || suggestions.length > 0)

  return (
    <FormField
      label={label}
      error={error}
      required={required}
      htmlFor={fieldId}
      hint={
        hint ? <p className="mt-1 text-xs text-ink/45">{hint}</p> : undefined
      }
    >
      <div ref={rootRef} className="relative">
        <TextInput
          id={fieldId}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
          }
          aria-invalid={error ? true : undefined}
          required={required}
          placeholder={placeholder}
          value={value}
          disabled={resolving}
          autoComplete="off"
          onChange={(e) => {
            const next = e.target.value
            onChange(next)
            setOpen(true)
            scheduleSearch(next)
          }}
          onFocus={() => {
            if (value.trim().length >= 2 || suggestions.length > 0) {
              setOpen(true)
            }
          }}
          onKeyDown={onKeyDown}
        />
        {showList ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-line/90 bg-white py-1 shadow-lg shadow-ink/10"
          >
            {loading || resolving ? (
              <li className="px-3.5 py-2.5 text-sm text-ink/50">
                {resolving ? 'Loading place…' : 'Searching…'}
              </li>
            ) : searchError ? (
              <li className="px-3.5 py-2.5 text-sm text-red-600">{searchError}</li>
            ) : (
              suggestions.map((suggestion, index) => {
                const active = index === activeIndex
                return (
                  <li key={suggestion.placeId} role="presentation">
                    <button
                      type="button"
                      id={`${listId}-option-${index}`}
                      role="option"
                      aria-selected={active}
                      className={`flex w-full flex-col items-start gap-0.5 px-3.5 py-2.5 text-left transition ${
                        active ? 'bg-primary/8' : 'hover:bg-ink/[0.04]'
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => void selectSuggestion(suggestion)}
                    >
                      <span className="text-sm font-semibold text-ink">
                        {suggestion.primaryText}
                      </span>
                      {suggestion.secondaryText ? (
                        <span className="text-xs text-ink/50">
                          {suggestion.secondaryText}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        ) : null}
      </div>
    </FormField>
  )
}
