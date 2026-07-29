import { useEffect, useState, type ChangeEvent } from 'react'
import { resolveAssetUrl } from '../../lib/api'
import { Button, FieldLabel } from '../ui'

const MAX_LOGO_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface LogoUploadFieldProps {
  logoUrl: string
  logoFile: File | null
  onSelect: (file: File) => void
  onClear: () => void
  error?: string
}

export function LogoUploadField({
  logoUrl,
  logoFile,
  onSelect,
  onClear,
  error,
}: LogoUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState('')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (logoFile) {
      const objectUrl = URL.createObjectURL(logoFile)
      setPreviewUrl(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }

    setPreviewUrl(logoUrl ? resolveAssetUrl(logoUrl) : '')
  }, [logoFile, logoUrl])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError('Please choose a JPEG, PNG, WebP, or GIF image.')
      return
    }

    if (file.size > MAX_LOGO_SIZE) {
      setLocalError('Logo must be 5 MB or smaller.')
      return
    }

    setLocalError('')
    onSelect(file)
  }

  const displayError = error ?? localError

  return (
    <div>
      <FieldLabel>School logo</FieldLabel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-white">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="School logo preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-2 text-center text-xs text-ink/40">No logo</span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <label className="inline-flex cursor-pointer">
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="inline-flex items-center justify-center rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-accent/40">
              Choose image
            </span>
          </label>
          {logoFile || logoUrl ? (
            <Button type="button" variant="ghost" onClick={onClear}>
              Remove logo
            </Button>
          ) : null}
          <p className="text-xs text-ink/45">JPEG, PNG, WebP, or GIF up to 5 MB</p>
        </div>
      </div>
      {displayError ? (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  )
}
