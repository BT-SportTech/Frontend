import { useEffect, useState, type ChangeEvent } from 'react'
import { resolveAssetUrl } from '../../lib/api'
import { Button, FieldLabel } from '../ui'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface GameImageUploadFieldProps {
  imageUrl: string
  imageFile: File | null
  onSelect: (file: File) => void
  onClear: () => void
  error?: string
}

export function GameImageUploadField({
  imageUrl,
  imageFile,
  onSelect,
  onClear,
  error,
}: GameImageUploadFieldProps) {
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

  return (
    <div>
      <FieldLabel>Game image</FieldLabel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-28 w-44 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-white">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Game image preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-2 text-center text-xs text-ink/40">
              No image
            </span>
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
          {imageFile || imageUrl ? (
            <Button type="button" variant="ghost" onClick={onClear}>
              Remove image
            </Button>
          ) : null}
          <p className="text-xs text-ink/45">
            JPEG, PNG, WebP, or GIF up to 5 MB
          </p>
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
