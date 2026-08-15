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

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`skeleton rounded-md ${className}`}
      aria-hidden
    />
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
      'bg-primary text-white hover:bg-primary-hover shadow-sm shadow-primary/20',
    secondary:
      'bg-secondary text-white hover:brightness-95 shadow-sm shadow-secondary/20',
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

export type TabItem<T extends string = string> = {
  id: T
  label: string
  badge?: string | number
  disabled?: boolean
}

export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  size = 'md',
  className = '',
  'aria-label': ariaLabel = 'Tabs',
}: {
  tabs: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex gap-5 overflow-x-auto border-b border-line/70 ${className}`}
    >
      {tabs.map((tab) => {
        const active = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`relative inline-flex shrink-0 items-center gap-1.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              size === 'sm' ? 'pb-2.5 text-sm' : 'pb-3 text-[15px]'
            } ${
              active
                ? 'text-ink'
                : 'text-ink/40 hover:text-ink/65'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge != null && tab.badge !== '' ? (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'bg-ink/6 text-ink/40'
                }`}
              >
                {tab.badge}
              </span>
            ) : null}
            {active ? (
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
