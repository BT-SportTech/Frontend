import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, resolveAssetUrl } from '../../lib/api'
import { SCHOOL_TYPES } from '../../interfaces/school.interface'
import type { Paginated, SchoolListItem, SchoolType } from '../../lib/types'
import { GlassPanel } from '../../components/ui'

interface DashboardStats {
  schoolsActive: number
  schoolsInactive: number
  usersTotal: number
  students: number
  professionals: number
  byType: Record<SchoolType, number>
  recentSchools: SchoolListItem[]
}

const emptyByType = Object.fromEntries(
  SCHOOL_TYPES.map((type) => [type, 0]),
) as Record<SchoolType, number>

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [
          schoolsActive,
          schoolsInactive,
          usersTotal,
          students,
          professionals,
          recent,
          ...typeCounts
        ] = await Promise.all([
          api<Paginated<SchoolListItem>>('/schools?page=1&limit=1'),
          api<Paginated<SchoolListItem>>(
            '/schools?page=1&limit=1&isActive=false',
          ),
          api<Paginated<unknown>>('/users?page=1&limit=1'),
          api<Paginated<unknown>>('/users?page=1&limit=1&role=STUDENT'),
          api<Paginated<unknown>>('/users?page=1&limit=1&role=PROFESSIONAL'),
          api<Paginated<SchoolListItem>>('/schools?page=1&limit=5'),
          ...SCHOOL_TYPES.map((type) =>
            api<Paginated<SchoolListItem>>(
              `/schools?page=1&limit=1&type=${type}`,
            ),
          ),
        ])

        if (cancelled) return

        const byType = { ...emptyByType }
        SCHOOL_TYPES.forEach((type, index) => {
          byType[type] = typeCounts[index]?.meta.total ?? 0
        })

        setStats({
          schoolsActive: schoolsActive.meta.total,
          schoolsInactive: schoolsInactive.meta.total,
          usersTotal: usersTotal.meta.total,
          students: students.meta.total,
          professionals: professionals.meta.total,
          byType,
          recentSchools: recent.data,
        })
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load analytics',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const schoolsTotal =
    (stats?.schoolsActive ?? 0) + (stats?.schoolsInactive ?? 0)
  const maxTypeCount = Math.max(1, ...Object.values(stats?.byType ?? {}))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-ink/55">
          Platform analytics for schools and players.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {error}
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
            <h2 className="font-display text-lg font-bold text-ink">
              Schools by type
            </h2>
            <p className="text-xs font-medium text-ink/50">
              {loading ? '…' : `${schoolsTotal} total`}
            </p>
          </div>
          <div className="mt-5 space-y-3.5">
            {SCHOOL_TYPES.map((type) => {
              const count = stats?.byType[type] ?? 0
              const width = loading ? 0 : (count / maxTypeCount) * 100
              return (
                <div key={type}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-ink/85">
                      {type.replaceAll('_', ' ')}
                    </span>
                    <span className="font-semibold tabular-nums text-ink">
                      {loading ? '—' : count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-line/70">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {!loading && stats ? (
            <p className="mt-5 text-xs text-ink/50">
              {stats.schoolsInactive} inactive · {stats.schoolsActive} active
            </p>
          ) : null}
        </GlassPanel>

        <GlassPanel strong className="flex flex-col p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-ink">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/admin/schools" className="group block">
          <GlassPanel
            strong
            className="relative overflow-hidden p-6 transition group-hover:-translate-y-0.5"
          >
            <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Schools
            </p>
            <p className="mt-2 font-display text-xl font-bold text-ink">
              Register & manage schools
            </p>
            <p className="mt-2 text-sm text-ink/55">
              Search, create, update, and deactivate school profiles.
            </p>
          </GlassPanel>
        </Link>

        <Link to="/admin/users" className="group block">
          <GlassPanel
            strong
            className="relative overflow-hidden p-6 transition group-hover:-translate-y-0.5"
          >
            <div className="absolute inset-y-0 left-0 w-1 bg-secondary" />
            <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
              Users
            </p>
            <p className="mt-2 font-display text-xl font-bold text-ink">
              Browse players
            </p>
            <p className="mt-2 text-sm text-ink/55">
              Filter students and professionals with pagination.
            </p>
          </GlassPanel>
        </Link>
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
        <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">
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
