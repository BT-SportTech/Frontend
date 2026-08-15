import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PlayerIdentity } from '../../components/PlayerIdentity'
import { Pagination } from '../../components/Pagination'
import { GlassPanel } from '../../components/ui'
import { fetchUsers, usersKeys } from '../../lib/queries/users'
import { useAdminSearchStore } from '../../stores/useAdminSearchStore'
import { toast } from '../../stores/useToastStore'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    dateStyle: 'medium',
  })
}

export function PlayersPage() {
  const navigate = useNavigate()
  const search = useAdminSearchStore((state) => state.players)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [prevSearch, setPrevSearch] = useState(search)

  if (search !== prevSearch) {
    setPrevSearch(search)
    setPage(1)
  }

  const listPage = search !== prevSearch ? 1 : page

  const {
    data,
    isPending,
    isError,
    error: listError,
  } = useQuery({
    queryKey: usersKeys.list({
      page: listPage,
      limit,
      search,
      role: 'PLAYER',
    }),
    queryFn: () =>
      fetchUsers({ page: listPage, limit, search, role: 'PLAYER' }),
  })

  const players = data?.data ?? []
  const total = data?.meta.total ?? 0
  const totalPages = data?.meta.totalPages ?? 0

  useEffect(() => {
    if (isError && listError) {
      toast.error(
        listError instanceof Error ? listError.message : 'Failed to load players.',
      )
    }
  }, [isError, listError])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Players</h1>
          <p className="mt-1 text-sm text-ink/55">
            Browse registered players and view their profiles.
          </p>
        </div>
        <p className="text-sm font-medium text-ink/60">
          {total} player{total === 1 ? '' : 's'}
        </p>
      </div>

      <GlassPanel strong className="overflow-hidden">
        <div className="min-h-[28rem] overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm text-ink">
            <thead className="border-b border-line bg-accent/40 text-ink/80">
              <tr>
                <th className="px-4 py-3 font-semibold">Player</th>
                <th className="px-4 py-3 font-semibold">School</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr>
                  <td
                    colSpan={4}
                    className="h-[24rem] px-4 text-center align-middle text-ink/60"
                  >
                    Loading…
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="h-[24rem] px-4 text-center align-middle text-ink/60"
                  >
                    No players found
                  </td>
                </tr>
              ) : (
                players.map((player) => (
                  <tr
                    key={player.id}
                    className="cursor-pointer border-b border-line/50 transition hover:bg-accent/25"
                    onClick={() => navigate(`/admin/players/${player.id}`)}
                  >
                    <td className="px-4 py-3">
                      <PlayerIdentity
                        username={player.username}
                        firstName={player.firstName}
                        lastName={player.lastName}
                        totalPoints={player.totalPoints ?? 0}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {player.school?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {player.city?.trim() || '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {formatWhen(player.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="border-t border-line px-4 py-3">
            <Pagination
              page={listPage}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </GlassPanel>
    </div>
  )
}
