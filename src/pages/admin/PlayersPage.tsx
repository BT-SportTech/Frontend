import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Pagination } from '../../components/Pagination'
import { GlassPanel, SelectInput } from '../../components/ui'
import { displayName } from '../../lib/displayName'
import {
  getCitiesInState,
  getStates,
  withCurrentOption,
} from '../../lib/locations'
import { fetchUsers, usersKeys } from '../../lib/queries/users'
import { RANK_TIERS, rankTierFromPoints, type RankTier } from '../../lib/rankTier'
import { formatUniqueCode } from '../../lib/uniqueCode'
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
  const [stateFilter, setStateFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [rankFilter, setRankFilter] = useState<RankTier | ''>('')

  if (search !== prevSearch) {
    setPrevSearch(search)
    setPage(1)
  }

  const listPage = search !== prevSearch ? 1 : page

  const states = useMemo(() => getStates(), [])
  const cities = useMemo(
    () =>
      withCurrentOption(
        stateFilter ? getCitiesInState(stateFilter) : [],
        cityFilter,
      ),
    [stateFilter, cityFilter],
  )

  const listParams = {
    page: listPage,
    limit,
    search,
    role: 'PLAYER' as const,
    ...(stateFilter ? { state: stateFilter } : {}),
    ...(cityFilter ? { city: cityFilter } : {}),
    ...(rankFilter ? { rank: rankFilter } : {}),
  }

  const {
    data,
    isPending,
    isError,
    error: listError,
  } = useQuery({
    queryKey: usersKeys.list(listParams),
    queryFn: () => fetchUsers(listParams),
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

  const hasFilters = Boolean(stateFilter || cityFilter || rankFilter)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Players</h1>
          <p className="mt-1 text-sm text-ink/55">
            Browse registered players and view their profiles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SelectInput
            className="w-44"
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value)
              setCityFilter('')
              setPage(1)
            }}
            aria-label="Filter by state"
          >
            <option value="">All states</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            className="w-40"
            value={cityFilter}
            disabled={!stateFilter}
            onChange={(e) => {
              setCityFilter(e.target.value)
              setPage(1)
            }}
            aria-label="Filter by city"
          >
            <option value="">
              {stateFilter ? 'All cities' : 'Select state first'}
            </option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            className="w-40"
            value={rankFilter}
            onChange={(e) => {
              setRankFilter(e.target.value as RankTier | '')
              setPage(1)
            }}
            aria-label="Filter by rank"
          >
            <option value="">All ranks</option>
            {RANK_TIERS.map((rank) => (
              <option key={rank} value={rank}>
                {rank}
              </option>
            ))}
          </SelectInput>
          {hasFilters ? (
            <button
              type="button"
              className="text-sm font-semibold text-primary hover:underline"
              onClick={() => {
                setStateFilter('')
                setCityFilter('')
                setRankFilter('')
                setPage(1)
              }}
            >
              Clear
            </button>
          ) : null}
          <p className="text-sm font-medium text-ink/60">
            {total} player{total === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <GlassPanel strong className="overflow-hidden">
        <div className="min-h-[28rem] overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm text-ink">
            <thead className="border-b border-line bg-accent/40 text-ink/80">
              <tr>
                <th className="px-4 py-3 font-semibold">Player</th>
                <th className="px-4 py-3 font-semibold">State</th>
                <th className="px-4 py-3 font-semibold">Rank</th>
                <th className="px-4 py-3 font-semibold">Unique Code</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr>
                  <td
                    colSpan={6}
                    className="h-[24rem] px-4 text-center align-middle text-ink/60"
                  >
                    Loading…
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="h-[24rem] px-4 text-center align-middle text-ink/60"
                  >
                    No players found
                  </td>
                </tr>
              ) : (
                players.map((player) => {
                  const name =
                    displayName(player.firstName, player.lastName).trim() ||
                    player.username ||
                    'Unknown player'
                  const rank = rankTierFromPoints(player.totalPoints ?? 0)
                  return (
                    <tr
                      key={player.id}
                      className="cursor-pointer border-b border-line/50 transition hover:bg-accent/25"
                      onClick={() => navigate(`/admin/players/${player.id}`)}
                    >
                      <td className="px-4 py-3 font-semibold text-ink">
                        {name}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink/90">
                        {player.state?.trim() || '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink/90">
                        {rank}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink/90">
                        {formatUniqueCode(player.username)}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink/90">
                        {player.city?.trim() || '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink/90">
                        {formatWhen(player.createdAt)}
                      </td>
                    </tr>
                  )
                })
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
