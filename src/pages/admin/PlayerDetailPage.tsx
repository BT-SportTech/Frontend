import { Link, useParams } from 'react-router-dom'
import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pagination } from '../../components/Pagination'
import { GlassPanel, Skeleton, TabBar } from '../../components/ui'
import { displayName } from '../../lib/displayName'
import { rankTierFromPoints } from '../../lib/rankTier'
import {
  fetchPlayer,
  fetchPlayerMatches,
  fetchPlayerRegistrations,
  fetchPlayerStats,
  usersKeys,
} from '../../lib/queries/users'
import type { PlayerMatchRow, PlayerRegistrationRow } from '../../lib/types'

function display(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function DetailField({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="rounded-xl border border-line/60 bg-white/80 px-4 py-3.5 shadow-sm">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-ink/40">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-[15px] font-semibold leading-snug text-ink">
        {value}
      </dd>
    </div>
  )
}

function ProfileSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line/60 bg-white/50 shadow-sm">
      <h3 className="border-b border-line/50 bg-accent/30 px-5 py-3 text-xs font-bold uppercase tracking-wider text-ink/50">
        {title}
      </h3>
      <dl className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
    </section>
  )
}

function SectionBlock({
  title,
  children,
  flush = false,
}: {
  title: string
  children: ReactNode
  flush?: boolean
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line/60 bg-white/50 shadow-sm">
      <h3 className="border-b border-line/50 bg-accent/30 px-5 py-3 text-xs font-bold uppercase tracking-wider text-ink/50">
        {title}
      </h3>
      <div className={flush ? undefined : 'p-5'}>{children}</div>
    </section>
  )
}

function initials(firstName: string, lastName: string) {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)
  return `${first}${last}`.toUpperCase() || '?'
}

function ProfileHero({
  player,
}: {
  player: {
    firstName: string
    lastName: string
    username: string
    totalPoints: number
  }
}) {
  const name = displayName(player.firstName, player.lastName)
  const rank = rankTierFromPoints(player.totalPoints)

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-line/70 bg-gradient-to-br from-white via-white to-primary/[0.06] p-6 shadow-sm shadow-primary/5">
      <span
        className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/15 via-accent to-primary/10 font-display text-xl font-bold text-primary shadow-sm"
        aria-hidden
      >
        {initials(player.firstName, player.lastName)}
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          {name}
        </h1>
        <p className="mt-0.5 font-mono text-sm text-ink/50">{player.username}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {rank}
          </span>
          <span className="inline-flex rounded-full border border-line/70 bg-white/90 px-3 py-1 text-xs font-semibold tabular-nums text-ink/75">
            {player.totalPoints} pts
          </span>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number | string
  tone?: 'default' | 'win' | 'loss' | 'draw' | 'points'
}) {
  const toneClass = {
    default: 'border-line/70 bg-white/80',
    win: 'border-emerald-200/80 bg-emerald-50/90',
    loss: 'border-red-200/80 bg-red-50/90',
    draw: 'border-line/70 bg-accent/50',
    points: 'border-primary/25 bg-primary/[0.07]',
  }[tone]

  const valueClass = {
    default: 'text-ink',
    win: 'text-emerald-800',
    loss: 'text-red-800',
    draw: 'text-ink',
    points: 'text-primary',
  }[tone]

  return (
    <div className={`rounded-xl border px-4 py-3.5 shadow-sm ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink/40">
        {label}
      </p>
      <p className={`mt-1.5 font-display text-2xl font-bold tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  )
}

function OutcomeBadge({ outcome }: { outcome: string | null }) {
  const label = outcomeLabel(outcome)
  if (label === '—') return <span className="text-ink/45">—</span>

  const styles = {
    Win: 'bg-emerald-100 text-emerald-800 ring-emerald-200/80',
    Loss: 'bg-red-100 text-red-800 ring-red-200/80',
    Draw: 'bg-ink/8 text-ink/70 ring-line/80',
  }[label] ?? 'bg-ink/8 text-ink/70 ring-line/80'

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${styles}`}
    >
      {label}
    </span>
  )
}

function MatchResultBadge({ result }: { result: string }) {
  if (result === '—') return <span className="text-ink/45">—</span>
  const styles =
    result === 'Win'
      ? 'bg-emerald-100 text-emerald-800 ring-emerald-200/80'
      : result === 'Loss'
        ? 'bg-red-100 text-red-800 ring-red-200/80'
        : 'bg-ink/8 text-ink/70 ring-line/80'
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${styles}`}
    >
      {result}
    </span>
  )
}

function DataTable({
  children,
  nested = false,
}: {
  children: ReactNode
  nested?: boolean
}) {
  if (nested) {
    return <div className="overflow-x-auto">{children}</div>
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line/70 bg-white/80 shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

function outcomeLabel(outcome: string | null) {
  switch (outcome?.toUpperCase()) {
    case 'WIN':
      return 'Win'
    case 'LOSS':
      return 'Loss'
    case 'DRAW':
      return 'Draw'
    default:
      return '—'
  }
}

function matchResultForPlayer(match: PlayerMatchRow, playerId: string) {
  const isWhite = match.white.userId === playerId
  const isBlack = match.black.userId === playerId
  if (!match.result) return '—'
  if (match.result === 'DRAW') return 'Draw'
  if (match.result === 'WHITE_WIN') return isWhite ? 'Win' : 'Loss'
  if (match.result === 'BLACK_WIN') return isBlack ? 'Win' : 'Loss'
  return '—'
}

function opponentFor(match: PlayerMatchRow, playerId: string) {
  if (match.white.userId === playerId) return match.black
  if (match.black.userId === playerId) return match.white
  return null
}

function playerColor(match: PlayerMatchRow, playerId: string) {
  if (match.white.userId === playerId) return 'White'
  if (match.black.userId === playerId) return 'Black'
  return '—'
}

type PlayerTab = 'profile' | 'overview' | 'events' | 'matches'

export function PlayerDetailPage() {
  const { id = '' } = useParams()
  const [activeTab, setActiveTab] = useState<PlayerTab>('profile')
  const [regPage, setRegPage] = useState(1)
  const [matchPage, setMatchPage] = useState(1)
  const limit = 10

  const {
    data: player,
    isPending: playerPending,
    isError: playerError,
  } = useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => fetchPlayer(id),
    enabled: Boolean(id),
  })

  const { data: stats, isPending: statsPending } = useQuery({
    queryKey: usersKeys.stats(id),
    queryFn: () => fetchPlayerStats(id),
    enabled: Boolean(id),
  })

  const { data: registrations, isPending: regsPending } = useQuery({
    queryKey: usersKeys.registrations(id, { page: regPage, limit }),
    queryFn: () => fetchPlayerRegistrations(id, { page: regPage, limit }),
    enabled: Boolean(id),
  })

  const { data: matches, isPending: matchesPending } = useQuery({
    queryKey: usersKeys.matches(id, { page: matchPage, limit }),
    queryFn: () => fetchPlayerMatches(id, { page: matchPage, limit }),
    enabled: Boolean(id),
  })

  if (playerPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[32rem] w-full" />
      </div>
    )
  }

  if (playerError || !player) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/players"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          ← Back to players
        </Link>
        <GlassPanel strong className="p-8 text-center">
          <p className="font-semibold text-ink">Player not found</p>
          <p className="mt-1 text-sm text-ink/55">
            This player may have been removed or the link is invalid.
          </p>
        </GlassPanel>
      </div>
    )
  }

  const regRows = registrations?.data ?? []
  const regTotal = registrations?.meta.total ?? 0
  const regTotalPages = registrations?.meta.totalPages ?? 0
  const matchRows = matches?.data ?? []
  const matchTotal = matches?.meta.total ?? 0
  const matchTotalPages = matches?.meta.totalPages ?? 0

  return (
    <div className="space-y-6">
      <Link
        to="/admin/players"
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        ← Back to players
      </Link>

      <div>
        <TabBar
          aria-label="Player sections"
          tabs={[
            { id: 'profile', label: 'Profile' },
            { id: 'overview', label: 'Overview' },
            {
              id: 'events',
              label: 'Events',
              badge: regTotal > 0 ? regTotal : undefined,
            },
            {
              id: 'matches',
              label: 'Matches',
              badge: matchTotal > 0 ? matchTotal : undefined,
            },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />

        <div className="pt-6">
          {activeTab === 'profile' ? (
            <div className="space-y-5">
              <ProfileHero player={player} />

              <ProfileSection title="Contact">
                <DetailField label="Email" value={display(player.email)} />
                <DetailField label="Phone" value={display(player.phone)} />
                <DetailField label="Gender" value={display(player.gender)} />
              </ProfileSection>

              <ProfileSection title="Personal">
                <DetailField
                  label="Date of birth"
                  value={formatDate(player.dateOfBirth)}
                />
                <DetailField
                  label="Location"
                  value={
                    [player.city, player.district, player.state]
                      .filter(Boolean)
                      .join(', ') || '—'
                  }
                />
                <DetailField label="Class" value={display(player.presentClass)} />
              </ProfileSection>

              <ProfileSection title="Affiliation">
                <DetailField
                  label="School"
                  value={
                    player.school ? (
                      <Link
                        to={`/admin/schools/${player.school.id}`}
                        className="text-primary hover:underline"
                      >
                        {player.school.name}
                      </Link>
                    ) : (
                      '—'
                    )
                  }
                />
                <DetailField label="Joined" value={formatWhen(player.createdAt)} />
                <DetailField
                  label="Sports interested"
                  value={
                    player.sportsInterested.length > 0 ? (
                      <span className="flex flex-wrap gap-1.5">
                        {player.sportsInterested.map((sport) => (
                          <span
                            key={sport}
                            className="rounded-md bg-accent/60 px-2 py-0.5 text-xs font-semibold text-ink/80"
                          >
                            {sport}
                          </span>
                        ))}
                      </span>
                    ) : (
                      '—'
                    )
                  }
                />
              </ProfileSection>
            </div>
          ) : null}

          {activeTab === 'overview' ? (
            <div className="space-y-6">
              {statsPending || !stats ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard label="Played" value={stats.totals.played} />
                    <StatCard label="Won" value={stats.totals.won} tone="win" />
                    <StatCard label="Lost" value={stats.totals.lost} tone="loss" />
                    <StatCard label="Draw" value={stats.totals.draw} tone="draw" />
                    <StatCard
                      label="Points"
                      value={stats.totals.points}
                      tone="points"
                    />
                  </div>
                  {player.chessRating ? (
                    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-white p-5 shadow-sm">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-primary/70">
                        Chess rating
                      </p>
                      <p className="mt-1 font-display text-3xl font-bold tabular-nums text-primary">
                        {player.chessRating.rating}
                      </p>
                      <p className="mt-1.5 text-sm font-medium text-ink/60">
                        {player.chessRating.gamesPlayed} games ·{' '}
                        <span className="text-emerald-700">
                          {player.chessRating.wins}W
                        </span>{' '}
                        /{' '}
                        <span className="text-red-700">
                          {player.chessRating.losses}L
                        </span>{' '}
                        / {player.chessRating.draws}D
                      </p>
                    </div>
                  ) : null}
                  {stats.bySport.length > 0 ? (
                    <SectionBlock title="By sport" flush>
                      <DataTable nested>
                        <table className="w-full min-w-[480px] text-left text-sm">
                          <thead className="border-b border-line bg-accent/50 text-ink/70">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Sport</th>
                              <th className="px-4 py-3 font-semibold">Played</th>
                              <th className="px-4 py-3 font-semibold">W</th>
                              <th className="px-4 py-3 font-semibold">L</th>
                              <th className="px-4 py-3 font-semibold">D</th>
                              <th className="px-4 py-3 font-semibold">Points</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.bySport.map((row) => (
                              <tr
                                key={row.sport}
                                className="border-b border-line/40 last:border-0"
                              >
                                <td className="px-4 py-3 font-semibold">{row.sport}</td>
                                <td className="px-4 py-3 tabular-nums">{row.played}</td>
                                <td className="px-4 py-3 font-medium tabular-nums text-emerald-700">
                                  {row.won}
                                </td>
                                <td className="px-4 py-3 font-medium tabular-nums text-red-700">
                                  {row.lost}
                                </td>
                                <td className="px-4 py-3 tabular-nums">{row.draw}</td>
                                <td className="px-4 py-3 font-semibold tabular-nums text-primary">
                                  {row.points}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </DataTable>
                    </SectionBlock>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          {activeTab === 'events' ? (
            <>
              <DataTable>
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-line bg-accent/50 text-ink/70">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Event</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Outcome</th>
                      <th className="px-4 py-3 font-semibold">W / L / D</th>
                      <th className="px-4 py-3 font-semibold">Games</th>
                      <th className="px-4 py-3 font-semibold">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regsPending ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-ink/55">
                          Loading…
                        </td>
                      </tr>
                    ) : regRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-ink/55">
                          No events yet
                        </td>
                      </tr>
                    ) : (
                      regRows.map((row: PlayerRegistrationRow) => (
                        <tr
                          key={row.id}
                          className="border-b border-line/40 last:border-0"
                        >
                          <td className="px-4 py-3">
                            <Link
                              to={`/admin/events/${row.event.id}`}
                              className="font-semibold text-primary hover:underline"
                            >
                              {row.event.name}
                            </Link>
                            <p className="mt-0.5 text-xs text-ink/50">{row.event.sport}</p>
                          </td>
                          <td className="px-4 py-3 text-ink/80">
                            {formatWhen(row.event.startsAt)}
                          </td>
                          <td className="px-4 py-3">
                            <OutcomeBadge outcome={row.outcome} />
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            <span className="font-medium text-emerald-700">
                              {row.eventWins}
                            </span>
                            {' / '}
                            <span className="font-medium text-red-700">
                              {row.eventLosses}
                            </span>
                            {' / '}
                            {row.eventDraws}
                          </td>
                          <td className="px-4 py-3 tabular-nums">{row.gamesCompleted}</td>
                          <td className="px-4 py-3 font-semibold tabular-nums text-primary">
                            {row.pointsEarned}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </DataTable>
              {regTotalPages > 1 ? (
                <div className="mt-4">
                  <Pagination
                    page={regPage}
                    totalPages={regTotalPages}
                    total={regTotal}
                    onPageChange={setRegPage}
                  />
                </div>
              ) : null}
            </>
          ) : null}

          {activeTab === 'matches' ? (
            <>
              <DataTable>
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="border-b border-line bg-accent/50 text-ink/70">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Event</th>
                      <th className="px-4 py-3 font-semibold">Round</th>
                      <th className="px-4 py-3 font-semibold">Opponent</th>
                      <th className="px-4 py-3 font-semibold">Color</th>
                      <th className="px-4 py-3 font-semibold">Result</th>
                      <th className="px-4 py-3 font-semibold">Rating Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchesPending ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-ink/55">
                          Loading…
                        </td>
                      </tr>
                    ) : matchRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-ink/55">
                          No chess matches recorded
                        </td>
                      </tr>
                    ) : (
                      matchRows.map((match) => {
                        const opponent = opponentFor(match, id)
                        const side =
                          match.white.userId === id ? match.white : match.black
                        const result = matchResultForPlayer(match, id)
                        return (
                          <tr
                            key={match.id}
                            className="border-b border-line/40 last:border-0"
                          >
                            <td className="px-4 py-3">
                              {match.event ? (
                                <Link
                                  to={`/admin/events/${match.event.id}`}
                                  className="font-semibold text-primary hover:underline"
                                >
                                  {match.event.name}
                                </Link>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-ink/80">
                              {match.roundNumber != null
                                ? `R${match.roundNumber}${match.batchNumber != null ? ` · B${match.batchNumber}` : ''}`
                                : '—'}
                            </td>
                            <td className="px-4 py-3">
                              {opponent ? (
                                <Link
                                  to={`/admin/players/${opponent.user.id}`}
                                  className="font-semibold text-primary hover:underline"
                                >
                                  {displayName(
                                    opponent.user.firstName,
                                    opponent.user.lastName,
                                  )}
                                </Link>
                              ) : (
                                '—'
                              )}
                              {opponent ? (
                                <p className="mt-0.5 font-mono text-xs text-ink/45">
                                  {opponent.user.username}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-md bg-accent/60 px-2 py-0.5 text-xs font-semibold text-ink/75">
                                {playerColor(match, id)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <MatchResultBadge result={result} />
                            </td>
                            <td className="px-4 py-3">
                              {side.ratingDelta != null ? (
                                <span
                                  className={`font-bold tabular-nums ${
                                    side.ratingDelta > 0
                                      ? 'text-emerald-700'
                                      : side.ratingDelta < 0
                                        ? 'text-red-700'
                                        : 'text-ink/60'
                                  }`}
                                >
                                  {side.ratingDelta > 0
                                    ? `+${side.ratingDelta}`
                                    : String(side.ratingDelta)}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </DataTable>
              {matchTotalPages > 1 ? (
                <div className="mt-4">
                  <Pagination
                    page={matchPage}
                    totalPages={matchTotalPages}
                    total={matchTotal}
                    onPageChange={setMatchPage}
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
