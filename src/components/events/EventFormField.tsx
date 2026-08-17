import type { ComponentProps, ReactNode } from 'react'
import { FieldLabel, SelectInput, TextArea, TextInput } from '../ui'

type BaseProps = {
  label: string
  error?: string
  hint?: ReactNode
  required?: boolean
  children?: ReactNode
}

export function FormField({
  label,
  error,
  hint,
  required,
  htmlFor,
  children,
}: BaseProps & { htmlFor?: string }) {
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={htmlFor} required={required}>
        {label}
      </FieldLabel>
      {children}
      {hint}
      {error ? (
        <p className="mt-1.5 text-[13px] font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type TextFieldProps = BaseProps &
  Omit<ComponentProps<typeof TextInput>, 'children'>

export function TextFormField({
  label,
  error,
  hint,
  required,
  id,
  onChange,
  ...inputProps
}: TextFieldProps) {
  const fieldId = id ?? inputProps.name
  return (
    <FormField
      label={label}
      error={error}
      hint={hint}
      required={required}
      htmlFor={fieldId}
    >
      <TextInput
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error && fieldId ? `${fieldId}-error` : undefined}
        onChange={onChange}
        {...inputProps}
      />
    </FormField>
  )
}

type SelectFieldProps = BaseProps &
  Omit<ComponentProps<typeof SelectInput>, 'children'> & {
    children: ReactNode
  }

export function SelectFormField({
  label,
  error,
  hint,
  required,
  children,
  id,
  ...selectProps
}: SelectFieldProps) {
  const fieldId = id ?? selectProps.name
  return (
    <FormField
      label={label}
      error={error}
      hint={hint}
      required={required}
      htmlFor={fieldId}
    >
      <SelectInput
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        {...selectProps}
      >
        {children}
      </SelectInput>
    </FormField>
  )
}

type TextAreaFieldProps = BaseProps &
  Omit<ComponentProps<typeof TextArea>, 'children'>

export function TextAreaFormField({
  label,
  error,
  hint,
  required,
  id,
  ...areaProps
}: TextAreaFieldProps) {
  const fieldId = id ?? areaProps.name
  return (
    <FormField
      label={label}
      error={error}
      hint={hint}
      required={required}
      htmlFor={fieldId}
    >
      <TextArea
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        {...areaProps}
      />
    </FormField>
  )
}
