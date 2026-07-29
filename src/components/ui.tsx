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
      className={`${strong ? 'glass-strong' : 'glass'} rounded-2xl ${className}`}
    >
      {children}
    </div>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-ink/80">
      {children}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  return (
    <input
      {...rest}
      className={`w-full rounded-xl border border-line/80 bg-white/50 px-3.5 py-2.5 text-ink outline-none transition placeholder:text-ink/35 focus:border-primary/40 focus:bg-white/70 focus:ring-2 focus:ring-primary/20 ${className}`}
    />
  )
}

export function SelectInput(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  const { className = '', children, ...rest } = props
  return (
    <select
      {...rest}
      className={`w-full rounded-xl border border-line/80 bg-white/50 px-3.5 py-2.5 text-ink outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20 ${className}`}
    >
      {children}
    </select>
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
      'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20',
    secondary:
      'bg-secondary text-white hover:bg-secondary/90 shadow-md shadow-secondary/20',
    ghost: 'bg-white/40 text-ink hover:bg-white/70 border border-line/70',
    danger: 'bg-red-600/90 text-white hover:bg-red-600',
  }[variant]

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    />
  )
}
