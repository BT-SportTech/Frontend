import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import type { BreadcrumbItem } from "@/hooks/useRouteMeta"

export function PageBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm lg:flex">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1">
          {index > 0 ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          ) : null}
          {item.to ? (
            <Link
              to={item.to}
              className="font-medium text-muted-foreground transition hover:text-primary"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
