import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { resolveAssetUrl } from '../../lib/api'
import { SCHOOL_TYPES } from '../../interfaces/school.interface'
import {
  dashboardKeys,
  fetchDashboardStats,
} from '../../lib/queries/dashboard'
import { GlassPanel } from '../../components/ui'

export function DashboardPage() {
  const { data: stats, isPending, isError, error } = useQuery({
    queryKey: dashboardKeys.all,
    queryFn: fetchDashboardStats,
  })

  const loading = isPending
  const schoolsTotal =
    (stats?.schoolsActive ?? 0) + (stats?.schoolsInactive ?? 0)
  const maxTypeCount = Math.max(1, ...Object.values(stats?.byType ?? {}))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-ink">
          Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-ink/55">
          Platform analytics for schools and players.
        </p>
      </div>

      {isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Failed to load analytics'}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active schools"
          value={stats?.schoolsActive}
          loading={loading}
          accent="primary"
          to="/admin/schools"
        />
        <StatCard
          label="Total users"
          value={stats?.usersTotal}
          loading={loading}
          accent="secondary"
          to="/admin/users"
        />
        <StatCard
          label="Students"
          value={stats?.students}
          loading={loading}
          accent="primary"
          to="/admin/users"
        />
        <StatCard
          label="Professionals"
          value={stats?.professionals}
          loading={loading}
          accent="secondary"
          to="/admin/users"
        />
      </div>

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
                <div
                  key={school.id}
                  className="flex items-center gap-3 rounded-lg px-1 py-2"
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
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-ink/50">
                No schools yet
              </p>
            )}
          </div>
          <Link
            to="/admin/schools"
            className="mt-4 text-sm font-semibold text-primary transition hover:text-[#1a43be]"
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

function StatCard({
  label,
  value,
  loading,
  accent,
  to,
}: {
  label: string
  value?: number
  loading: boolean
  accent: 'primary' | 'secondary'
  to: string
}) {
  const labelClass =
    accent === 'primary' ? 'text-primary' : 'text-secondary'
  const barClass = accent === 'primary' ? 'bg-primary' : 'bg-secondary'

  return (
    <Link to={to} className="group block">
      <GlassPanel
        strong
        className="relative overflow-hidden p-5 transition group-hover:-translate-y-0.5"
      >
        <div className={`absolute inset-y-0 left-0 w-1 ${barClass}`} />
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${labelClass}`}
        >
          {label}
        </p>
        <p className="mt-2 font-sans text-3xl font-bold tabular-nums text-ink">
          {loading ? '—' : (value ?? 0).toLocaleString()}
        </p>
      </GlassPanel>
    </Link>
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
