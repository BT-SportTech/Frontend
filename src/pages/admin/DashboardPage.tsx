import { Link } from 'react-router-dom'
import { GlassPanel } from '../../components/ui'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Overview</h1>
        <p className="mt-1 text-sm text-ink/55">
          Manage registered schools and players from one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/admin/schools" className="group block">
          <GlassPanel strong className="p-6 transition group-hover:bg-white/75">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary/80">
              Schools
            </p>
            <p className="mt-2 font-display text-xl font-semibold text-ink">
              Register & manage schools
            </p>
            <p className="mt-2 text-sm text-ink/55">
              Search, create, update, and deactivate school profiles.
            </p>
          </GlassPanel>
        </Link>

        <Link to="/admin/users" className="group block">
          <GlassPanel strong className="p-6 transition group-hover:bg-white/75">
            <p className="text-sm font-semibold uppercase tracking-wide text-secondary/90">
              Users
            </p>
            <p className="mt-2 font-display text-xl font-semibold text-ink">
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
