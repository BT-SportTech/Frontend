import type { ComponentProps, ReactNode } from 'react'
import { FieldLabel, SelectInput, TextArea, TextInput } from '../ui'

type BaseProps = {
  label: string
  error?: string
  hint?: ReactNode
  children?: ReactNode
}

export function FormField({ label, error, hint, children }: BaseProps) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {children}
      {hint}
      {error ? (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
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
  id,
  onChange,
  ...inputProps
}: TextFieldProps) {
  const fieldId = id ?? inputProps.name
  return (
    <FormField label={label} error={error} hint={hint}>
      <TextInput
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
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
  children,
  id,
  ...selectProps
}: SelectFieldProps) {
  const fieldId = id ?? selectProps.name
  return (
    <FormField label={label} error={error} hint={hint}>
      <SelectInput
        id={fieldId}
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
  id,
  ...areaProps
}: TextAreaFieldProps) {
  const fieldId = id ?? areaProps.name
  return (
    <FormField label={label} error={error} hint={hint}>
      <TextArea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        {...areaProps}
      />
    </FormField>
  )
}
