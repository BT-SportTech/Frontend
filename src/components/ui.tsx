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

const controlBase =
  'rounded-none border border-line/90 bg-bg text-sm font-medium text-ink outline-none transition placeholder:font-normal placeholder:text-ink/35 hover:border-ink/25 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/12 disabled:cursor-not-allowed disabled:bg-ink/[0.03] disabled:opacity-50 aria-invalid:border-red-400 aria-invalid:focus:ring-red-500/15'

export function FieldLabel({
  children,
  htmlFor,
  required,
}: {
  children: ReactNode
  htmlFor?: string
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[13px] font-semibold tracking-wide text-ink/65"
    >
      {children}
      {required ? (
        <span className="ml-0.5 text-red-500" aria-hidden>
          *
        </span>
      ) : null}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  const hasWidth = /\bw-/.test(className)
  return (
    <input
      {...rest}
      className={`${hasWidth ? '' : 'w-full'} h-11 ${controlBase} px-3.5 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 ${className}`}
    />
  )
}

const selectChevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E")`

export function SelectInput(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  const { className = '', children, style, ...rest } = props
  const hasWidth = /\bw-/.test(className)
  return (
    <select
      {...rest}
      className={`${hasWidth ? '' : 'w-full'} h-11 appearance-none ${controlBase} bg-[length:1rem] bg-[right_0.85rem_center] bg-no-repeat px-3.5 pr-10 ${className}`}
      style={{ backgroundImage: selectChevron, ...style }}
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
      className={`${hasWidth ? '' : 'w-full'} min-h-[6.5rem] ${controlBase} resize-y px-3.5 py-3 leading-relaxed ${className}`}
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
    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink/75">
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
