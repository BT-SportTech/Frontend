import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function GlassPanel({
  children,
  className = '',
  strong = false,
}: {
  children: ReactNode
  className?: string
  strong?: boolean
}) {
  return (
    <div
      className={`${strong ? 'glass-strong' : 'glass'} rounded-xl ${className}`}
    >
      {children}
    </div>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-ink/70">
      {children}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  const hasWidth = /\bw-/.test(className)
  return (
    <input
      {...rest}
      className={`${hasWidth ? '' : 'w-full'} rounded-lg border border-line bg-white px-3.5 py-2.5 text-ink outline-none transition placeholder:text-ink/35 focus:border-primary focus:ring-2 focus:ring-primary/15 ${className}`}
    />
  )
}

export function SelectInput(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  const { className = '', children, ...rest } = props
  const hasWidth = /\bw-/.test(className)
  return (
    <select
      {...rest}
      className={`${hasWidth ? '' : 'w-full'} rounded-lg border border-line bg-white px-3.5 py-2.5 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 ${className}`}
    >
      {children}
    </select>
  )
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  const { className = '', ...rest } = props
  const hasWidth = /\bw-/.test(className)
  return (
    <textarea
      {...rest}
      className={`${hasWidth ? '' : 'w-full'} rounded-lg border border-line bg-white px-3.5 py-2.5 text-ink outline-none transition placeholder:text-ink/35 focus:border-primary focus:ring-2 focus:ring-primary/15 ${className}`}
    />
  )
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm font-medium text-ink/75">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-line text-primary focus:ring-primary/20"
      />
      {label}
    </label>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}) {
  const styles = {
    primary:
      'bg-primary text-white hover:bg-[#1a43be] shadow-sm shadow-primary/20',
    secondary:
      'bg-secondary text-white hover:bg-[#0c635c] shadow-sm shadow-secondary/20',
    ghost: 'bg-white text-ink hover:bg-accent/50 border border-line',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[variant]

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    />
  )
}
