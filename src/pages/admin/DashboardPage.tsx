import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { resolveAssetUrl } from '../../lib/api'
import { SCHOOL_TYPES } from '../../interfaces/school.interface'
import {
  dashboardKeys,
  fetchDashboardStats,
} from '../../lib/queries/dashboard'
import { GlassPanel } from '../../components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatGrid } from '@/components/layout/StatGrid'
import { toast } from '../../stores/useToastStore'

export function DashboardPage() {
  const { data: stats, isPending, isError, error } = useQuery({
    queryKey: dashboardKeys.all,
    queryFn: fetchDashboardStats,
  })

  const loading = isPending
  const schoolsTotal =
    (stats?.schoolsActive ?? 0) + (stats?.schoolsInactive ?? 0)
  const maxTypeCount = Math.max(1, ...Object.values(stats?.byType ?? {}))

  useEffect(() => {
    if (!isError) return
    toast.error(
      error instanceof Error ? error.message : 'Failed to load analytics',
    )
  }, [isError, error])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Platform analytics for schools and players."
      />

      <StatGrid
        items={[
          {
            label: 'Active schools',
            value: loading ? '—' : stats?.schoolsActive,
            to: '/admin/schools',
            accent: 'primary',
          },
          {
            label: 'Total users',
            value: loading ? '—' : stats?.usersTotal,
            accent: 'secondary',
          },
          {
            label: 'Players',
            value: loading ? '—' : stats?.players,
            to: '/admin/players',
            accent: 'primary',
          },
          {
            label: 'Professionals',
            value: loading ? '—' : stats?.professionals,
            accent: 'secondary',
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <GlassPanel strong className="p-6 lg:col-span-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-sans text-lg font-bold text-ink">
              Schools by type
            </h2>
            <p className="text-xs font-medium text-ink/50">
              {loading ? '…' : `${schoolsTotal} total`}
            </p>
          </div>
          <SchoolsByTypeChart
            byType={stats?.byType}
            loading={loading}
            maxTypeCount={maxTypeCount}
          />
          {!loading && stats ? (
            <p className="mt-4 text-xs text-ink/50">
              {stats.schoolsInactive} inactive · {stats.schoolsActive} active
            </p>
          ) : null}
        </GlassPanel>

        <GlassPanel strong className="flex flex-col p-6 lg:col-span-2">
          <h2 className="font-sans text-lg font-bold text-ink">
            Recent schools
          </h2>
          <div className="mt-4 flex-1 space-y-2">
            {loading ? (
              <p className="py-8 text-center text-sm text-ink/50">Loading…</p>
            ) : stats?.recentSchools.length ? (
              stats.recentSchools.map((school) => (
                <Link
                  key={school.id}
                  to={`/admin/schools/${school.id}`}
                  className="flex items-center gap-3 rounded-lg px-1 py-2 transition hover:bg-muted"
                >
                  {school.logoUrl ? (
                    <img
                      src={resolveAssetUrl(school.logoUrl)}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-lg border border-line bg-white object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-accent/50 text-primary">
                      <SchoolGlyph />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {school.name}
                    </p>
                    <p className="truncate text-xs text-ink/55">
                      {school.code}
                      {school.city ? ` · ${school.city}` : ''}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-ink/50">
                No schools yet
              </p>
            )}
          </div>
          <Link
            to="/admin/schools"
            className="mt-4 text-sm font-semibold text-primary transition hover:text-primary-hover"
          >
            Manage schools →
          </Link>
        </GlassPanel>
      </div>
    </div>
  )
}

function SchoolsByTypeChart({
  byType,
  loading,
  maxTypeCount,
}: {
  byType?: Record<string, number>
  loading: boolean
  maxTypeCount: number
}) {
  return (
    <div className="mt-5">
      <div
        className="relative h-48 border-b border-l border-line/80 pt-6"
        role="img"
        aria-label="Bar chart of schools by type"
      >
        <div className="pointer-events-none absolute inset-x-0 top-6 bottom-0" aria-hidden>
          {[0.25, 0.5, 0.75].map((fraction) => (
            <div
              key={fraction}
              className="absolute inset-x-0 border-t border-dashed border-line/55"
              style={{ bottom: `${fraction * 100}%` }}
            />
          ))}
        </div>

        <div className="absolute inset-x-0 top-6 bottom-0 flex items-end gap-2 px-1 sm:gap-3 sm:px-2">
          {SCHOOL_TYPES.map((type) => {
            const count = byType?.[type] ?? 0
            const heightPct = loading ? 0 : (count / maxTypeCount) * 100
            const label = type.replaceAll('_', ' ')

            return (
              <div
                key={type}
                className="relative flex h-full min-w-0 flex-1 items-end justify-center"
              >
                <div
                  className="relative w-[70%] max-w-14 rounded-t-md bg-primary transition-[height] duration-500 ease-out"
                  style={{
                    height: `${heightPct}%`,
                    minHeight: !loading && count > 0 ? 4 : 0,
                  }}
                  title={`${label}: ${count}`}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold tabular-nums text-ink">
                    {loading ? '—' : count}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-2 px-1 sm:gap-3 sm:px-2">
        {SCHOOL_TYPES.map((type) => {
          const label = type.replaceAll('_', ' ')
          return (
            <p
              key={type}
              className="min-w-0 flex-1 truncate text-center text-[10px] font-medium leading-tight text-ink/65 sm:text-xs"
              title={label}
            >
              {label}
            </p>
          )
        })}
      </div>
    </div>
  )
}

function SchoolGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}
