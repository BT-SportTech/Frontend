import type { ReactNode } from "react"
import { PageBreadcrumbs } from "./PageBreadcrumbs"
import type { BreadcrumbItem } from "@/hooks/useRouteMeta"

type PageHeaderProps = {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        {breadcrumbs?.length ? (
          <PageBreadcrumbs items={breadcrumbs} />
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
