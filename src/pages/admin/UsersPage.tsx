import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import type { Paginated, UserListItem, UserRole } from '../../lib/types'
import { Pagination } from '../../components/Pagination'
import {
  Button,
  GlassPanel,
  SelectInput,
  TextInput,
} from '../../components/ui'

const ROLES: UserRole[] = ['STUDENT', 'PROFESSIONAL', 'ADMIN']

export function UsersPage() {
  const [data, setData] = useState<UserListItem[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (search) params.set('search', search)
      if (role) params.set('role', role)

      const res = await api<Paginated<UserListItem>>(`/users?${params.toString()}`)
      setData(res.data)
      setTotal(res.meta.total)
      setTotalPages(res.meta.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, role])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Users</h1>
        <p className="mt-1 text-sm text-ink/55">
          Browse students, professionals, and admins
        </p>
      </div>

      <GlassPanel strong className="p-4 sm:p-5">
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            setPage(1)
            setSearch(searchInput.trim())
          }}
        >
          <TextInput
            className="min-w-[200px] flex-1"
            placeholder="Search name, email, phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <SelectInput
            className="w-44"
            value={role}
            onChange={(e) => {
              setPage(1)
              setRole(e.target.value)
            }}
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </SelectInput>
          <Button type="submit" variant="ghost">
            Search
          </Button>
        </form>
      </GlassPanel>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <GlassPanel strong className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-line/70 bg-white/30 text-ink/60">
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
                  <td colSpan={5} className="px-4 py-8 text-center text-ink/45">
                    Loading…
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink/45">
                    No users found
                  </td>
                </tr>
              ) : (
                data.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-line/40 transition hover:bg-white/35"
                  >
                    <td className="px-4 py-3 font-medium text-ink">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-4 py-3 text-ink/70">{u.email}</td>
                    <td className="px-4 py-3 text-ink/70">{u.role}</td>
                    <td className="px-4 py-3 text-ink/70">
                      {u.school?.name ||
                        u.company ||
                        (u.presentClass ? `Class ${u.presentClass}` : '—')}
                    </td>
                    <td className="px-4 py-3 text-ink/70">
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
