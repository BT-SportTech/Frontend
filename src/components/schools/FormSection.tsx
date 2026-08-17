import type { ReactNode } from 'react'

export function FormSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="w-full space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
        {title}
      </h3>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        {children}
      </div>
    </section>
  )
}
