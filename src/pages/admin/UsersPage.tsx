import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Paginated, UserListItem } from '../../lib/types'
import { Pagination } from '../../components/Pagination'
import { GlassPanel } from '../../components/ui'
import { useAdminSearchStore } from '../../stores/useAdminSearchStore'

export function UsersPage() {
  const search = useAdminSearchStore((state) => state.users)
  const [data, setData] = useState<UserListItem[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setPage(1)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (search) params.set('search', search)

      const res = await api<Paginated<UserListItem>>(`/users?${params.toString()}`)
      setData(res.data)
      setTotal(res.meta.total)
      setTotalPages(res.meta.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Users</h1>
        <p className="mt-1.5 text-sm text-ink/55">
          Browse students, professionals, and admins
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <GlassPanel strong className="overflow-hidden">
        <div className="min-h-[28rem] overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm text-ink">
            <thead className="border-b border-line bg-accent/40 text-ink/80">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">School / Company</th>
                <th className="px-4 py-3 font-semibold">Location</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="h-[24rem] px-4 text-center align-middle text-ink/60"
                  >
                    Loading…
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="h-[24rem] px-4 text-center align-middle text-ink/60"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                data.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-line/50 transition hover:bg-accent/25"
                  >
                    <td className="px-4 py-3 font-semibold text-ink">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">{u.email}</td>
                    <td className="px-4 py-3 font-medium text-ink/90">{u.role}</td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {u.school?.name ||
                        u.company ||
                        (u.presentClass ? `Class ${u.presentClass}` : '—')}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {[u.city, u.state].filter(Boolean).join(', ') || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </GlassPanel>
    </div>
  )
}
