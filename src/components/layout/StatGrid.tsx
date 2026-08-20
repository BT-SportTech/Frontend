import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatItem = {
  label: string
  value: string | number | null | undefined
  hint?: string
  to?: string
  accent?: "primary" | "secondary" | "warning"
}

const accentClass = {
  primary: "text-primary",
  secondary: "text-secondary",
  warning: "text-amber-600",
}

export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const content = (
          <Card className="transition hover:shadow-md">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p
                className={cn(
                  "mt-2 text-3xl font-bold tracking-tight",
                  accentClass[item.accent ?? "primary"],
                )}
              >
                {item.value ?? "—"}
              </p>
              {item.hint ? (
                <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
              ) : null}
            </CardContent>
          </Card>
        )
        return item.to ? (
          <Link key={item.label} to={item.to} className="block">
            {content}
          </Link>
        ) : (
          <div key={item.label}>{content}</div>
        )
      })}
    </div>
  )
}
