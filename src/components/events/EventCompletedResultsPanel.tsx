import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PlayerIdentity } from '@/components/PlayerIdentity'
import { displayName } from '@/lib/displayName'
import { formatUniqueCode } from '@/lib/uniqueCode'
import {
  chessMatchmakingKeys,
  fetchChessMatches,
  type ChessMatchResult,
  type ChessMatchRow,
} from '@/lib/queries/chessMatchmaking'
import type { EventRegistrationRow } from '@/lib/queries/events'
import type { SportEvent } from '@/lib/types'

function isChessEvent(event: SportEvent) {
  return (
    event.sport?.toLowerCase() === 'chess' ||
    event.game?.name?.toLowerCase() === 'chess'
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

function OutcomeBadge({ outcome }: { outcome: string | null }) {
  const label = outcomeLabel(outcome)
  if (label === '—') return <span className="text-muted-foreground">—</span>

  const variant =
    label === 'Win' ? 'success' : label === 'Loss' ? 'destructive' : 'outline'

  return <Badge variant={variant}>{label}</Badge>
}

function formatPoints(points: number) {
  if (points > 0) return `+${points}`
  return String(points)
}

function matchScoreLabel(result: ChessMatchResult | null) {
  if (result === 'WHITE_WIN') return '1–0'
  if (result === 'BLACK_WIN') return '0–1'
  if (result === 'DRAW') return '½–½'
  return '—'
}

function playerInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

function CompletedMatchCard({ match }: { match: ChessMatchRow }) {
  const whiteWon = match.result === 'WHITE_WIN'
  const blackWon = match.result === 'BLACK_WIN'
  const isDraw = match.result === 'DRAW'

  return (
    <div className="rounded-xl border border-line/60 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold tabular-nums text-muted-foreground">
          Board {match.boardNumber}
        </span>
        <Badge variant={isDraw ? 'outline' : 'success'}>
          {matchScoreLabel(match.result)}
        </Badge>
      </div>
      <div className="space-y-2">
        <MatchPlayerRow
          side="White"
          player={match.white}
          won={whiteWon}
          dark={false}
        />
        <MatchPlayerRow
          side="Black"
          player={match.black}
          won={blackWon}
          dark
        />
      </div>
    </div>
  )
}

function MatchPlayerRow({
  side,
  player,
  won,
  dark,
}: {
  side: string
  player: ChessMatchRow['white']
  won: boolean
  dark: boolean
}) {
  const name = displayName(player.user.firstName, player.user.lastName)

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
        won ? 'bg-emerald-50 ring-1 ring-emerald-200' : ''
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          dark ? 'bg-ink/80 text-white' : 'bg-muted text-ink/70'
        }`}
      >
        {playerInitials(player.user.firstName, player.user.lastName)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {side}
        </p>
        <Link
          to={`/admin/players/${player.userId}`}
          className="truncate text-sm font-semibold text-primary hover:underline"
        >
          {name}
        </Link>
        <p className="text-xs text-muted-foreground">
          {formatUniqueCode(player.user.username)}
        </p>
      </div>
    </div>
  )
}

type EventCompletedResultsPanelProps = {
  event: SportEvent
  registrations: EventRegistrationRow[]
  isPending?: boolean
}

export function EventCompletedResultsPanel({
  event,
  registrations,
  isPending = false,
}: EventCompletedResultsPanelProps) {
  const chess = isChessEvent(event)

  const matchesQuery = useQuery({
    queryKey: chessMatchmakingKeys.matches(event.id),
    queryFn: () => fetchChessMatches(event.id),
    enabled: chess && event.status === 'COMPLETED',
  })

  const completedMatches = useMemo(() => {
    const matches = matchesQuery.data?.data ?? []
    return matches
      .filter((m) => m.status === 'COMPLETED')
      .sort((a, b) => {
        const gameA = a.gameNumber ?? a.roundNumber ?? 0
        const gameB = b.gameNumber ?? b.roundNumber ?? 0
        if (gameA !== gameB) return gameA - gameB
        const batchA = a.batchNumber ?? 0
        const batchB = b.batchNumber ?? 0
        if (batchA !== batchB) return batchA - batchB
        return a.boardNumber - b.boardNumber
      })
  }, [matchesQuery.data?.data])

  const matchGroups = useMemo(() => {
    const groups = new Map<string, ChessMatchRow[]>()
    for (const match of completedMatches) {
      const game = match.gameNumber ?? match.roundNumber ?? 0
      const batch = match.batchNumber ?? 0
      const key = `${game}-${batch}`
      const list = groups.get(key) ?? []
      list.push(match)
      groups.set(key, list)
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => {
        const [ag, ab] = a.split('-').map(Number)
        const [bg, bb] = b.split('-').map(Number)
        if (ag !== bg) return ag - bg
        return ab - bb
      })
      .map(([, groupMatches]) => {
        const first = groupMatches[0]
        return {
          gameNumber: first.gameNumber ?? first.roundNumber ?? 0,
          batchNumber: first.batchNumber ?? 0,
          matches: [...groupMatches].sort(
            (a, b) => a.boardNumber - b.boardNumber,
          ),
        }
      })
  }, [completedMatches])

  const sortedRegistrations = useMemo(() => {
    return [...registrations].sort((a, b) => {
      const pointsDiff = (b.pointsEarned ?? 0) - (a.pointsEarned ?? 0)
      if (pointsDiff !== 0) return pointsDiff
      const winsDiff = (b.eventWins ?? 0) - (a.eventWins ?? 0)
      if (winsDiff !== 0) return winsDiff
      const nameA = displayName(a.user.firstName, a.user.lastName)
      const nameB = displayName(b.user.firstName, b.user.lastName)
      return nameA.localeCompare(nameB)
    })
  }, [registrations])

  const hasGameStats = sortedRegistrations.some(
    (row) =>
      (row.eventWins ?? 0) > 0 ||
      (row.eventLosses ?? 0) > 0 ||
      (row.eventDraws ?? 0) > 0 ||
      (row.gamesCompleted ?? 0) > 0,
  )

  if (isPending) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (registrations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            No players were registered for this event.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-line px-6 py-4">
            <h2 className="text-base font-semibold text-ink">Player standings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Final outcomes, game records, and points earned for each player.
            </p>
          </div>

          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Outcome</TableHead>
                  {hasGameStats ? (
                    <>
                      <TableHead>W</TableHead>
                      <TableHead>L</TableHead>
                      <TableHead>D</TableHead>
                      <TableHead>Games</TableHead>
                    </>
                  ) : null}
                  <TableHead>Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRegistrations.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/admin/players/${row.userId}`}
                        className="hover:underline"
                      >
                        <PlayerIdentity
                          username={row.user.username}
                          firstName={row.user.firstName}
                          lastName={row.user.lastName}
                          totalPoints={row.user.totalPoints}
                        />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <OutcomeBadge outcome={row.outcome} />
                    </TableCell>
                    {hasGameStats ? (
                      <>
                        <TableCell className="font-medium text-emerald-700">
                          {row.eventWins ?? 0}
                        </TableCell>
                        <TableCell className="font-medium text-red-700">
                          {row.eventLosses ?? 0}
                        </TableCell>
                        <TableCell>{row.eventDraws ?? 0}</TableCell>
                        <TableCell>{row.gamesCompleted ?? 0}</TableCell>
                      </>
                    ) : null}
                    <TableCell>
                      <span
                        className={`font-semibold tabular-nums ${
                          row.pointsEarned > 0
                            ? 'text-emerald-700'
                            : row.pointsEarned < 0
                              ? 'text-red-700'
                              : 'text-ink'
                        }`}
                      >
                        {formatPoints(row.pointsEarned ?? 0)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 p-4 lg:hidden">
            {sortedRegistrations.map((row, index) => (
              <article
                key={row.id}
                className="rounded-lg border border-line p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">
                      #{index + 1}
                    </p>
                    <Link
                      to={`/admin/players/${row.userId}`}
                      className="mt-1 block hover:underline"
                    >
                      <PlayerIdentity
                        username={row.user.username}
                        firstName={row.user.firstName}
                        lastName={row.user.lastName}
                        totalPoints={row.user.totalPoints}
                      />
                    </Link>
                  </div>
                  <OutcomeBadge outcome={row.outcome} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  {hasGameStats ? (
                    <>
                      <div>
                        <dt className="text-xs text-muted-foreground">W / L / D</dt>
                        <dd className="mt-0.5 font-semibold tabular-nums">
                          <span className="text-emerald-700">
                            {row.eventWins ?? 0}
                          </span>
                          {' / '}
                          <span className="text-red-700">
                            {row.eventLosses ?? 0}
                          </span>
                          {' / '}
                          {row.eventDraws ?? 0}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Games</dt>
                        <dd className="mt-0.5 font-semibold">
                          {row.gamesCompleted ?? 0}
                        </dd>
                      </div>
                    </>
                  ) : null}
                  <div>
                    <dt className="text-xs text-muted-foreground">Points</dt>
                    <dd
                      className={`mt-0.5 font-semibold tabular-nums ${
                        row.pointsEarned > 0
                          ? 'text-emerald-700'
                          : row.pointsEarned < 0
                            ? 'text-red-700'
                            : ''
                      }`}
                    >
                      {formatPoints(row.pointsEarned ?? 0)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>

      {chess ? (
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-line px-6 py-4">
              <h2 className="text-base font-semibold text-ink">Match history</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Who played whom in each game, with board results.
              </p>
            </div>

            {matchesQuery.isPending ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : matchGroups.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No recorded chess pairings for this event. Results may have been
                entered manually without matchmaking.
              </p>
            ) : (
              <div className="space-y-5 p-6">
                {matchGroups.map((group) => (
                  <section key={`${group.gameNumber}-${group.batchNumber}`}>
                    <h3 className="mb-3 text-sm font-bold text-ink/70">
                      Game {group.gameNumber}
                      {group.batchNumber > 0
                        ? ` · Board set ${group.batchNumber}`
                        : ''}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {group.matches.map((match) => (
                        <CompletedMatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
