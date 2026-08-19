import { useMemo } from "react"
import { useLocation, useMatches } from "react-router-dom"

export type ContentWidth = "constrained" | "wide" | "full"

export type RouteHandle = {
  title?: string
  breadcrumb?: string
  contentWidth?: ContentWidth
}

export type BreadcrumbItem = {
  label: string
  to?: string
}

export function useRouteMeta() {
  const matches = useMatches()
  const location = useLocation()

  return useMemo(() => {
    const crumbs: BreadcrumbItem[] = []
    let title = ""
    let contentWidth: ContentWidth = "constrained"

    for (const match of matches) {
      const handle = match.handle as RouteHandle | undefined
      if (!handle?.breadcrumb && !handle?.title) continue
      const label = handle.breadcrumb ?? handle.title ?? ""
      if (label) {
        const isLast = match.pathname === location.pathname
        crumbs.push({
          label,
          to: isLast ? undefined : match.pathname,
        })
      }
      if (handle.title) title = handle.title
      if (handle.contentWidth) contentWidth = handle.contentWidth
    }

    if (!title && crumbs.length) {
      title = crumbs[crumbs.length - 1].label
    }

    return { title, breadcrumbs: crumbs, contentWidth }
  }, [matches, location.pathname])
}
