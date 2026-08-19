import { Link, useParams } from 'react-router-dom'
import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '../../components/Pagination'
import { displayName } from '../../lib/displayName'
import { rankTierFromPoints } from '../../lib/rankTier'
import { formatUniqueCode } from '../../lib/uniqueCode'
import {
  fetchPlayer,
  fetchPlayerMatches,
  fetchPlayerRegistrations,
  fetchPlayerStats,
  usersKeys,
} from '../../lib/queries/users'
import type { PlayerMatchRow, PlayerRegistrationRow, PlayerDetail } from '../../lib/types'

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
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  )
}

function ProfileFieldsSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
    </section>
  )
}

function initials(firstName: string, lastName: string) {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)
  return `${first}${last}`.toUpperCase() || '?'
}

function interleaveDot(items: ReactNode[]) {
  return items.flatMap((item, index) =>
    index === 0 ? [item] : [<span key={`dot-${index}`} className="mx-1.5">·</span>, item],
  )
}

function PlayerSummaryCard({ player }: { player: PlayerDetail }) {
  const name = displayName(player.firstName, player.lastName)
  const rank = rankTierFromPoints(player.totalPoints)
  const location =
    [player.city, player.district, player.state].filter(Boolean).join(', ')

  const contactLine: ReactNode[] = []
  if (player.email) contactLine.push(player.email)
  if (player.phone) contactLine.push(player.phone)
  if (location) contactLine.push(location)
  if (player.school) {
    contactLine.push(
      <Link
        key="school"
        to={`/admin/schools/${player.school.id}`}
        className="text-primary hover:underline"
      >
        {player.school.name}
      </Link>,
    )
  }

  const detailParts: ReactNode[] = []
  if (player.sportsInterested.length > 0) {
    detailParts.push(player.sportsInterested.join(', '))
  }
  detailParts.push(`${player.totalPoints} pts`)
  if (player.chessRating) {
    detailParts.push(`Chess ${player.chessRating.rating}`)
  }
  detailParts.push(`Joined ${formatDate(player.createdAt)}`)

  return (
    <Card>
      <CardContent className="flex gap-4 p-6">
        <span
          className="inline-flex h-14 w-14 shrink-0 items-center justify-center self-start rounded-xl bg-primary/10 text-lg font-bold text-primary"
          aria-hidden
        >
          {initials(player.firstName, player.lastName)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {name}
            </h1>
            <Badge variant="outline" className="font-medium text-muted-foreground">
              {rank}
            </Badge>
          </div>

          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {formatUniqueCode(player.username)}
          </p>

          {contactLine.length > 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {interleaveDot(contactLine)}
            </p>
          ) : null}

          <p className="mt-1.5 text-sm text-muted-foreground">
            {interleaveDot(detailParts)}
          </p>
        </div>
      </CardContent>
    </Card>
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
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-semibold text-ink">Player not found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This player may have been removed or the link is invalid.
            </p>
          </CardContent>
        </Card>
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
      <PlayerSummaryCard player={player} />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PlayerTab)}>
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">
            Events{regTotal > 0 ? ` (${regTotal})` : ''}
          </TabsTrigger>
          <TabsTrigger value="matches">
            Matches{matchTotal > 0 ? ` (${matchTotal})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardContent className="space-y-8 p-6">
              <ProfileFieldsSection title="Contact">
                <DetailField label="Email" value={display(player.email)} />
                <DetailField label="Phone" value={display(player.phone)} />
                <DetailField label="Gender" value={display(player.gender)} />
              </ProfileFieldsSection>

              <Separator />

              <ProfileFieldsSection title="Personal">
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
              </ProfileFieldsSection>

              <Separator />

              <ProfileFieldsSection title="Affiliation">
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
                          <Badge key={sport} variant="outline">{sport}</Badge>
                        ))}
                      </span>
                    ) : (
                      '—'
                    )
                  }
                />
              </ProfileFieldsSection>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="mt-4 space-y-6">
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
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          Chess rating
                        </p>
                        <p className="mt-1 text-3xl font-bold tabular-nums text-primary">
                          {player.chessRating.rating}
                        </p>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          {player.chessRating.gamesPlayed} games ·{' '}
                          <span className="text-emerald-700">
                            {player.chessRating.wins}W
                          </span>
                          {' / '}
                          <span className="text-red-700">
                            {player.chessRating.losses}L
                          </span>
                          {' / '}
                          {player.chessRating.draws}D
                        </p>
                      </CardContent>
                    </Card>
                  ) : null}
                  {stats.bySport.length > 0 ? (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">By sport</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Sport</TableHead>
                              <TableHead>Played</TableHead>
                              <TableHead>W</TableHead>
                              <TableHead>L</TableHead>
                              <TableHead>D</TableHead>
                              <TableHead>Points</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.bySport.map((row) => (
                              <TableRow key={row.sport}>
                                <TableCell className="font-semibold">
                                  {row.sport}
                                </TableCell>
                                <TableCell>{row.played}</TableCell>
                                <TableCell className="font-medium text-emerald-700">
                                  {row.won}
                                </TableCell>
                                <TableCell className="font-medium text-red-700">
                                  {row.lost}
                                </TableCell>
                                <TableCell>{row.draw}</TableCell>
                                <TableCell className="font-semibold text-primary">
                                  {row.points}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ) : null}
                </>
              )}
        </TabsContent>

        <TabsContent value="events" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>W / L / D</TableHead>
                      <TableHead>Games</TableHead>
                      <TableHead>Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regsPending ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          Loading…
                        </TableCell>
                      </TableRow>
                    ) : regRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          No events yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      regRows.map((row: PlayerRegistrationRow) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Link
                              to={`/admin/events/${row.event.id}`}
                              className="font-semibold text-primary hover:underline"
                            >
                              {row.event.name}
                            </Link>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {row.event.sport}
                            </p>
                          </TableCell>
                          <TableCell>{formatWhen(row.event.startsAt)}</TableCell>
                          <TableCell>
                            <OutcomeBadge outcome={row.outcome} />
                          </TableCell>
                          <TableCell className="tabular-nums">
                            <span className="font-medium text-emerald-700">
                              {row.eventWins}
                            </span>
                            {' / '}
                            <span className="font-medium text-red-700">
                              {row.eventLosses}
                            </span>
                            {' / '}
                            {row.eventDraws}
                          </TableCell>
                          <TableCell>{row.gamesCompleted}</TableCell>
                          <TableCell className="font-semibold text-primary">
                            {row.pointsEarned}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 p-4 lg:hidden">
                {regsPending ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
                ) : regRows.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">No events yet</p>
                ) : (
                  regRows.map((row: PlayerRegistrationRow) => (
                    <article
                      key={row.id}
                      className="rounded-lg border border-line p-4"
                    >
                      <Link
                        to={`/admin/events/${row.event.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {row.event.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">{row.event.sport}</p>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="text-xs text-muted-foreground">Date</dt>
                          <dd className="mt-0.5 font-medium">
                            {formatWhen(row.event.startsAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Outcome</dt>
                          <dd className="mt-0.5">
                            <OutcomeBadge outcome={row.outcome} />
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">W / L / D</dt>
                          <dd className="mt-0.5 tabular-nums font-medium">
                            <span className="text-emerald-700">{row.eventWins}</span>
                            {' / '}
                            <span className="text-red-700">{row.eventLosses}</span>
                            {' / '}
                            {row.eventDraws}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Points</dt>
                          <dd className="mt-0.5 font-semibold text-primary">
                            {row.pointsEarned}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {regTotalPages > 1 ? (
            <Pagination
              page={regPage}
              totalPages={regTotalPages}
              total={regTotal}
              onPageChange={setRegPage}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="matches" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Round</TableHead>
                      <TableHead>Opponent</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Rating Δ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchesPending ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          Loading…
                        </TableCell>
                      </TableRow>
                    ) : matchRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          No chess matches recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      matchRows.map((match) => {
                        const opponent = opponentFor(match, id)
                        const side =
                          match.white.userId === id ? match.white : match.black
                        const result = matchResultForPlayer(match, id)
                        return (
                          <TableRow key={match.id}>
                            <TableCell>
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
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {match.roundNumber != null
                                ? `R${match.roundNumber}${match.batchNumber != null ? ` · B${match.batchNumber}` : ''}`
                                : '—'}
                            </TableCell>
                            <TableCell>
                              {opponent ? (
                                <>
                                  <Link
                                    to={`/admin/players/${opponent.user.id}`}
                                    className="font-semibold text-primary hover:underline"
                                  >
                                    {displayName(
                                      opponent.user.firstName,
                                      opponent.user.lastName,
                                    )}
                                  </Link>
                                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                    {formatUniqueCode(opponent.user.username)}
                                  </p>
                                </>
                              ) : (
                                '—'
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{playerColor(match, id)}</Badge>
                            </TableCell>
                            <TableCell>
                              <MatchResultBadge result={result} />
                            </TableCell>
                            <TableCell>
                              {side.ratingDelta != null ? (
                                <span
                                  className={`font-bold tabular-nums ${
                                    side.ratingDelta > 0
                                      ? 'text-emerald-700'
                                      : side.ratingDelta < 0
                                        ? 'text-red-700'
                                        : 'text-muted-foreground'
                                  }`}
                                >
                                  {side.ratingDelta > 0
                                    ? `+${side.ratingDelta}`
                                    : String(side.ratingDelta)}
                                </span>
                              ) : (
                                '—'
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 p-4 lg:hidden">
                {matchesPending ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
                ) : matchRows.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No chess matches recorded
                  </p>
                ) : (
                  matchRows.map((match) => {
                    const opponent = opponentFor(match, id)
                    const side =
                      match.white.userId === id ? match.white : match.black
                    const result = matchResultForPlayer(match, id)
                    return (
                      <article
                        key={match.id}
                        className="rounded-lg border border-line p-4"
                      >
                        {match.event ? (
                          <Link
                            to={`/admin/events/${match.event.id}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {match.event.name}
                          </Link>
                        ) : (
                          <p className="font-semibold text-ink">—</p>
                        )}
                        <p className="mt-1 text-sm text-muted-foreground">
                          {match.roundNumber != null
                            ? `Round ${match.roundNumber}${match.batchNumber != null ? ` · Batch ${match.batchNumber}` : ''}`
                            : 'Round —'}
                        </p>
                        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div className="col-span-2">
                            <dt className="text-xs text-muted-foreground">Opponent</dt>
                            <dd className="mt-0.5 font-medium">
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
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Color</dt>
                            <dd className="mt-0.5 font-medium">
                              {playerColor(match, id)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Result</dt>
                            <dd className="mt-0.5">
                              <MatchResultBadge result={result} />
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Rating Δ</dt>
                            <dd className="mt-0.5 font-bold tabular-nums">
                              {side.ratingDelta != null ? (
                                <span
                                  className={
                                    side.ratingDelta > 0
                                      ? 'text-emerald-700'
                                      : side.ratingDelta < 0
                                        ? 'text-red-700'
                                        : 'text-muted-foreground'
                                  }
                                >
                                  {side.ratingDelta > 0
                                    ? `+${side.ratingDelta}`
                                    : String(side.ratingDelta)}
                                </span>
                              ) : (
                                '—'
                              )}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {matchTotalPages > 1 ? (
            <Pagination
              page={matchPage}
              totalPages={matchTotalPages}
              total={matchTotal}
              onPageChange={setMatchPage}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
