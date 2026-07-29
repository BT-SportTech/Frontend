import { useState, type InputHTMLAttributes } from 'react'
import { FieldLabel, TextInput } from '../ui'

interface LoginFormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-3.2 4.4" />
      <path d="M6.1 6.1A17.5 17.5 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 4.4-1" />
    </svg>
  )
}

export function LoginFormField({
  label,
  error,
  id,
  type = 'text',
  className = '',
  ...inputProps
}: LoginFormFieldProps) {
  const fieldId = id ?? inputProps.name
  const isPassword = type === 'password'
  const [showPassword, setShowPassword] = useState(false)

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <TextInput
          id={fieldId}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={`${isPassword ? 'pr-11' : ''} ${className}`}
          {...inputProps}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-ink/40 transition hover:text-ink/70"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <EyeIcon open={showPassword} />
          </button>
        ) : null}
      </div>
      {error ? (
        <p
          id={`${fieldId}-error`}
          className="mt-1.5 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
