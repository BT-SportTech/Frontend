import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pagination } from '../../components/Pagination'
import { GlassPanel } from '../../components/ui'
import { fetchUsers, usersKeys } from '../../lib/queries/users'
import { useAdminSearchStore } from '../../stores/useAdminSearchStore'

export function UsersPage() {
  const search = useAdminSearchStore((state) => state.users)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [prevSearch, setPrevSearch] = useState(search)

  if (search !== prevSearch) {
    setPrevSearch(search)
    setPage(1)
  }

  const listPage = search !== prevSearch ? 1 : page

  const { data, isPending, isError, error } = useQuery({
    queryKey: usersKeys.list({ page: listPage, limit, search }),
    queryFn: () => fetchUsers({ page: listPage, limit, search }),
  })

  const users = data?.data ?? []
  const total = data?.meta.total ?? 0
  const totalPages = data?.meta.totalPages ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Users</h1>
        <p className="mt-1.5 text-sm text-ink/55">
          Browse students, professionals, and admins
        </p>
      </div>

      {isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Failed to load users'}
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
              {isPending ? (
                <tr>
                  <td
                    colSpan={5}
                    className="h-[24rem] px-4 text-center align-middle text-ink/60"
                  >
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="h-[24rem] px-4 text-center align-middle text-ink/60"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
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
            page={listPage}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </GlassPanel>
    </div>
  )
}
