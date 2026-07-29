import type { InputHTMLAttributes } from 'react'
import { FieldLabel, TextInput } from '../ui'

interface LoginFormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function LoginFormField({
  label,
  error,
  id,
  ...inputProps
}: LoginFormFieldProps) {
  const fieldId = id ?? inputProps.name

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...inputProps}
      />
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
