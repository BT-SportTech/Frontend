import { useEffect, useState, type ChangeEvent } from 'react'
import { resolveAssetUrl } from '../../lib/api'
import { Button, FieldLabel } from '../ui'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface EventImageUploadFieldProps {
  imageUrl: string
  imageFile: File | null
  onSelect: (file: File) => void
  onClear: () => void
  error?: string
}

export function EventImageUploadField({
  imageUrl,
  imageFile,
  onSelect,
  onClear,
  error,
}: EventImageUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState('')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (imageFile) {
      const objectUrl = URL.createObjectURL(imageFile)
      setPreviewUrl(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }

    setPreviewUrl(imageUrl ? resolveAssetUrl(imageUrl) : '')
  }, [imageFile, imageUrl])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError('Please choose a JPEG, PNG, WebP, or GIF image.')
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setLocalError('Image must be 5 MB or smaller.')
      return
    }

    setLocalError('')
    onSelect(file)
  }

  const displayError = error ?? localError
  const hasImage = Boolean(previewUrl)

  return (
    <div>
      <FieldLabel>Event image</FieldLabel>
      <div
        className={`flex flex-col gap-4 rounded-none border border-dashed p-4 sm:flex-row sm:items-center ${
          displayError
            ? 'border-red-300 bg-red-50/40'
            : 'border-line bg-bg'
        }`}
      >
        <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-none border border-line/80 bg-white sm:w-44">
          {hasImage ? (
            <img
              src={previewUrl}
              alt="Event image preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="px-3 text-center">
              <p className="text-xs font-semibold text-ink/40">No image yet</p>
              <p className="mt-1 text-[11px] text-ink/30">Hero on mobile</p>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer">
              <input
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="inline-flex h-10 items-center justify-center rounded-none border border-line/90 bg-white px-4 text-sm font-semibold text-ink transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
                {hasImage ? 'Replace image' : 'Choose image'}
              </span>
            </label>
            {imageFile || imageUrl ? (
              <Button
                type="button"
                variant="ghost"
                className="!h-10 !rounded-none"
                onClick={onClear}
              >
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs leading-relaxed text-ink/45">
            Shown as the event hero in the app. JPEG, PNG, WebP, or GIF up to
            5 MB.
          </p>
        </div>
      </div>
      {displayError ? (
        <p className="mt-1.5 text-[13px] font-medium text-red-600" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  )
}
