import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  FieldLabel,
  GlassPanel,
  Skeleton,
  TabBar,
  TextInput,
} from '../ui'
import {
  chessMatchmakingKeys,
  fetchChessMatches,
  fetchChessMatchmakingStatus,
  nextChessBatch,
  setChessMatchResult,
  startChessMatchmaking,
  withdrawChessPlayer,
  type ChessMatchResult,
  type ChessMatchRow,
  type ChessMatchmakingStatus,
} from '../../lib/queries/chessMatchmaking'
import { PlayerIdentity } from '../PlayerIdentity'
import { organizerEventsKeys } from '../../lib/queries/organizerEvents'
import type { SportEvent } from '../../lib/types'
import { displayName } from '../../lib/displayName'

function playerName(p: ChessMatchRow['white']) {
  return displayName(p.user.firstName, p.user.lastName)
}

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

function GameDots({
  completed,
  total,
}: {
  completed: number
  total: number
}) {
  return (
    <div className="flex items-center gap-1" aria-label={`${completed} of ${total} games`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            i < completed ? 'bg-primary' : 'bg-ink/15'
          }`}
        />
      ))}
    </div>
  )
}

function GameProgressStepper({
  currentGame,
  gamesPerPlayer,
  mmStatus,
}: {
  currentGame: number | null
  gamesPerPlayer: number
  mmStatus: string
}) {
  if (mmStatus === 'NOT_STARTED') return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {Array.from({ length: gamesPerPlayer }, (_, i) => {
        const game = i + 1
        const done =
          mmStatus === 'COMPLETED' ||
          (currentGame != null && game < currentGame)
        const active =
          mmStatus === 'IN_PROGRESS' && currentGame === game
        return (
          <div key={game} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? 'bg-primary text-white'
                  : active
                    ? 'bg-primary/15 text-primary ring-2 ring-primary'
                    : 'bg-ink/8 text-ink/40'
              }`}
              title={`Game ${game} of ${gamesPerPlayer}`}
            >
              {done ? '✓' : game}
            </div>
            {game < gamesPerPlayer ? (
              <div
                className={`h-0.5 w-6 sm:w-10 ${
                  done ? 'bg-primary' : 'bg-ink/10'
                }`}
              />
            ) : null}
          </div>
        )
      })}
      <span className="ml-1 text-sm font-medium text-ink/55">
        {mmStatus === 'COMPLETED'
          ? `All ${gamesPerPlayer} games done`
          : currentGame
            ? `Game ${currentGame} of ${gamesPerPlayer}`
            : ''}
      </span>
    </div>
  )
}

function BoardCard({
  match,
  saving,
  onResult,
}: {
  match: ChessMatchRow
  saving: boolean
  onResult: (result: ChessMatchResult) => void
}) {
  const done = match.status === 'COMPLETED'
  const whiteWon = match.result === 'WHITE_WIN'
  const blackWon = match.result === 'BLACK_WIN'
  const isDraw = match.result === 'DRAW'

  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        done
          ? 'border-line/60 bg-ink/[0.02]'
          : 'border-primary/25 bg-white shadow-sm shadow-primary/5'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-lg bg-ink/5 px-2.5 py-1 text-xs font-bold tabular-nums text-ink/70">
          Board {match.boardNumber}
          {(match.gameNumber ?? match.roundNumber) != null
            ? ` · Game ${match.gameNumber ?? match.roundNumber}`
            : ''}
        </span>
        {done ? (
          <span className="text-xs font-semibold text-emerald-700">
            {isDraw ? 'Draw' : whiteWon ? 'White won' : 'Black won'}
          </span>
        ) : (
          <span className="text-xs font-semibold text-amber-700">
            {saving ? 'Saving…' : 'Tap White, Black, or Draw'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
        <button
          type="button"
          disabled={saving || done}
          onClick={() => onResult('WHITE_WIN')}
          className={`rounded-xl border px-3 py-3 text-left transition disabled:cursor-default ${
            whiteWon
              ? 'border-emerald-400 bg-emerald-50'
              : done
                ? 'border-transparent bg-transparent opacity-50'
                : 'border-line bg-white hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]'
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">
            White
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/5 text-xs font-bold text-ink/70">
              {initials(match.white.user.firstName, match.white.user.lastName)}
            </span>
            <span className="min-w-0 font-semibold leading-tight text-ink">
              {playerName(match.white)}
            </span>
          </div>
          {saving && !done ? (
            <p className="mt-1 text-xs text-ink/40">Saving…</p>
          ) : null}
        </button>

        <div className="flex flex-col items-center justify-center self-center">
          {!done ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => onResult('DRAW')}
              className="rounded-xl border border-line bg-white px-3 py-3 text-center transition hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] disabled:cursor-default"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">
                Draw
              </p>
              <p className="mt-1.5 text-sm font-semibold text-ink">½–½</p>
            </button>
          ) : isDraw ? (
            <div className="rounded-xl border border-emerald-400 bg-emerald-50 px-3 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">
                Draw
              </p>
              <p className="mt-1.5 text-sm font-semibold text-ink">½–½</p>
            </div>
          ) : (
            <div className="rounded-xl border border-transparent px-3 py-3 text-center opacity-50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">
                Draw
              </p>
              <p className="mt-1.5 text-sm font-semibold text-ink/50">½–½</p>
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={saving || done}
          onClick={() => onResult('BLACK_WIN')}
          className={`rounded-xl border px-3 py-3 text-left transition disabled:cursor-default ${
            blackWon
              ? 'border-emerald-400 bg-emerald-50'
              : done
                ? 'border-transparent bg-transparent opacity-50'
                : 'border-line bg-white hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]'
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">
            Black
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/80 text-xs font-bold text-white">
              {initials(match.black.user.firstName, match.black.user.lastName)}
            </span>
            <span className="min-w-0 font-semibold leading-tight text-ink">
              {playerName(match.black)}
            </span>
          </div>
        </button>
      </div>
    </div>
  )
}

function matchScoreLabel(result: ChessMatchResult | null) {
  if (result === 'WHITE_WIN') return '1–0'
  if (result === 'BLACK_WIN') return '0–1'
  if (result === 'DRAW') return '½–½'
  return null
}

function formatRatingDelta(delta: number) {
  if (delta > 0) return `+${delta}`
  return String(delta)
}

function PlayerRatingLine({
  ratingAfter,
  ratingDelta,
}: {
  ratingAfter: number | null | undefined
  ratingDelta: number | null | undefined
}) {
  if (ratingAfter == null) return null

  return (
    <p className="mt-0.5 text-xs font-semibold tabular-nums text-ink/55">
      {ratingAfter} pts
      {ratingDelta != null ? (
        <span
          className={
            ratingDelta > 0
              ? 'text-emerald-700'
              : ratingDelta < 0
                ? 'text-red-600'
                : 'text-ink/45'
          }
        >
          {' '}
          ({formatRatingDelta(ratingDelta)})
        </span>
      ) : null}
    </p>
  )
}

function CompletedMatchCard({ match }: { match: ChessMatchRow }) {
  const whiteWon = match.result === 'WHITE_WIN'
  const blackWon = match.result === 'BLACK_WIN'
  const isDraw = match.result === 'DRAW'
  const scoreLabel = matchScoreLabel(match.result)

  return (
    <div className="rounded-xl border border-line/60 bg-white/80 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold tabular-nums text-ink/55">
          Board {match.boardNumber}
        </span>
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            isDraw
              ? 'bg-ink/10 text-ink/60'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {scoreLabel ??
            (isDraw ? 'Draw' : whiteWon ? 'White won' : 'Black won')}
        </span>
      </div>
      <div className="space-y-2">
        <div
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
            whiteWon ? 'bg-emerald-50 ring-1 ring-emerald-200' : ''
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/5 text-[10px] font-bold text-ink/70">
            {initials(match.white.user.firstName, match.white.user.lastName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink/35">
              White
            </p>
            <p className="truncate text-sm font-semibold text-ink">
              {playerName(match.white)}
            </p>
            <PlayerRatingLine
              ratingAfter={match.white.ratingAfter}
              ratingDelta={match.white.ratingDelta}
            />
          </div>
        </div>
        <div
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
            blackWon ? 'bg-emerald-50 ring-1 ring-emerald-200' : ''
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/80 text-[10px] font-bold text-white">
            {initials(match.black.user.firstName, match.black.user.lastName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink/35">
              Black
            </p>
            <p className="truncate text-sm font-semibold text-ink">
              {playerName(match.black)}
            </p>
            <PlayerRatingLine
              ratingAfter={match.black.ratingAfter}
              ratingDelta={match.black.ratingDelta}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function PlayerProgressCard({
  row,
  gamesPerPlayer,
  canWithdraw,
  withdrawing,
  busy,
  onWithdraw,
}: {
  row: ChessMatchmakingStatus['playerProgress'][number]
  gamesPerPlayer: number
  canWithdraw: boolean
  withdrawing: boolean
  busy: boolean
  onWithdraw: () => void
}) {
  const ratingDelta = row.rating - 1000

  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        row.withdrawn
          ? 'border-red-200/60 bg-red-50/30'
          : 'border-line/60 bg-white/80'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            row.withdrawn
              ? 'bg-red-100 text-red-700'
              : 'bg-primary/10 text-primary'
          }`}
        >
          {initials(row.user.firstName, row.user.lastName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PlayerIdentity
              username={row.user.username}
              firstName={row.user.firstName}
              lastName={row.user.lastName}
              totalPoints={row.user.totalPoints}
            />
            {row.withdrawn ? (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                Left
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-bold tabular-nums text-ink">
            Chess rating {row.rating}
            {ratingDelta !== 0 ? (
              <span
                className={
                  ratingDelta > 0
                    ? 'text-emerald-700'
                    : 'text-red-600'
                }
              >
                {' '}
                ({formatRatingDelta(ratingDelta)})
              </span>
            ) : null}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <GameDots completed={row.gamesCompleted} total={gamesPerPlayer} />
            <div className="flex gap-1.5 text-[11px] font-semibold">
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">
                {row.eventWins}W
              </span>
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">
                {row.eventLosses}L
              </span>
              {row.eventDraws > 0 ? (
                <span className="rounded bg-ink/10 px-1.5 py-0.5 text-ink/60">
                  {row.eventDraws}D
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {canWithdraw ? (
        <button
          type="button"
          disabled={busy}
          onClick={onWithdraw}
          className="mt-3 w-full rounded-lg border border-red-200/80 py-1.5 text-xs font-semibold text-red-600/90 transition hover:bg-red-50 disabled:opacity-50"
        >
          {withdrawing ? 'Removing…' : 'Remove from tournament'}
        </button>
      ) : null}
    </div>
  )
}

export function ChessMatchmakingPanel({
  event,
  presentCount,
}: {
  event: SportEvent
  presentCount: number
}) {
  const queryClient = useQueryClient()
  const [boardOverride, setBoardOverride] = useState(
    String(event.boardCount ?? 10),
  )
  const [actionError, setActionError] = useState('')
  const [subTab, setSubTab] = useState<'boards' | 'results' | 'standings'>(
    'boards',
  )
  const [subTabSeeded, setSubTabSeeded] = useState(false)
  const [savingMatchIds, setSavingMatchIds] = useState<Set<string>>(() => new Set())
  const finalizeInFlightRef = useRef(false)
  const savingMatchIdsRef = useRef<Set<string>>(new Set())
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function markSaving(matchId: string, saving: boolean) {
    setSavingMatchIds((prev) => {
      const next = new Set(prev)
      if (saving) next.add(matchId)
      else next.delete(matchId)
      savingMatchIdsRef.current = next
      return next
    })
  }

  const statusQuery = useQuery({
    queryKey: chessMatchmakingKeys.status(event.id),
    queryFn: () => fetchChessMatchmakingStatus(event.id),
  })

  const matchesQuery = useQuery({
    queryKey: chessMatchmakingKeys.matches(event.id),
    queryFn: () => fetchChessMatches(event.id),
  })

  async function invalidateAll() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: chessMatchmakingKeys.status(event.id),
      }),
      queryClient.invalidateQueries({
        queryKey: chessMatchmakingKeys.matches(event.id),
      }),
      queryClient.invalidateQueries({
        queryKey: organizerEventsKeys.registrations(event.id),
      }),
      queryClient.invalidateQueries({
        queryKey: organizerEventsKeys.detail(event.id),
      }),
    ])
  }

  async function syncAfterScoring() {
    const latestStatus = queryClient.getQueryData<ChessMatchmakingStatus>(
      chessMatchmakingKeys.status(event.id),
    )
    const games = latestStatus?.gamesPerPlayer ?? event.gamesPerPlayer ?? 3
    const tournamentMaybeComplete =
      latestStatus?.activeBatch?.pendingMatches === 0 &&
      (latestStatus?.playerProgress ?? [])
        .filter((p) => !p.withdrawn)
        .every((p) => p.gamesCompleted >= games)

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: chessMatchmakingKeys.status(event.id),
      }),
      queryClient.invalidateQueries({
        queryKey: chessMatchmakingKeys.matches(event.id),
      }),
      ...(tournamentMaybeComplete
        ? [
            queryClient.invalidateQueries({
              queryKey: organizerEventsKeys.registrations(event.id),
            }),
            queryClient.invalidateQueries({
              queryKey: organizerEventsKeys.detail(event.id),
            }),
          ]
        : []),
    ])

    if (savingMatchIdsRef.current.size === 0) {
      await maybeAutoFinalizeTournament()
    }
  }

  function scheduleDebouncedSync() {
    if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current)
    refetchTimerRef.current = setTimeout(() => {
      refetchTimerRef.current = null
      void syncAfterScoring()
    }, 400)
  }

  function applyCompletedStatus(data: ChessMatchmakingStatus) {
    queryClient.setQueryData(chessMatchmakingKeys.status(event.id), data)
    queryClient.setQueryData(
      organizerEventsKeys.detail(event.id),
      (old: SportEvent | undefined) =>
        old ? { ...old, matchmakingStatus: 'COMPLETED' } : old,
    )
  }

  const startMutation = useMutation({
    mutationFn: () => {
      const boards = parseInt(boardOverride, 10)
      return startChessMatchmaking(event.id, boards > 0 ? boards : undefined)
    },
    onSuccess: async () => {
      setActionError('')
      await invalidateAll()
    },
    onError: (err) => {
      setActionError(
        err instanceof Error ? err.message : 'Failed to start matchmaking',
      )
    },
  })

  const nextBatchMutation = useMutation({
    mutationFn: () => nextChessBatch(event.id),
    onSuccess: async (data) => {
      setActionError('')
      if (
        'matchmakingStatus' in data &&
        data.matchmakingStatus === 'COMPLETED'
      ) {
        applyCompletedStatus(data as ChessMatchmakingStatus)
      }
      await invalidateAll()
    },
    onError: async (err) => {
      try {
        const recovered = await fetchChessMatchmakingStatus(event.id)
        if (recovered.matchmakingStatus === 'COMPLETED') {
          applyCompletedStatus(recovered)
          setActionError('')
          await invalidateAll()
          return
        }
      } catch {
        /* fall through to error message */
      }
      setActionError(
        err instanceof Error ? err.message : 'Failed to generate next batch',
      )
    },
  })

  async function maybeAutoFinalizeTournament() {
    if (
      finalizeInFlightRef.current ||
      savingMatchIdsRef.current.size > 0
    ) {
      return
    }

    const cachedStatus = queryClient.getQueryData<ChessMatchmakingStatus>(
      chessMatchmakingKeys.status(event.id),
    )
    if (
      cachedStatus?.activeBatch &&
      cachedStatus.activeBatch.pendingMatches > 0
    ) {
      return
    }

    const latest = await queryClient.fetchQuery({
      queryKey: chessMatchmakingKeys.status(event.id),
      queryFn: () => fetchChessMatchmakingStatus(event.id),
    })
    if (!latest || latest.matchmakingStatus === 'COMPLETED') return

    const games = latest.gamesPerPlayer ?? event.gamesPerPlayer ?? 3
    const allDone = latest.playerProgress
      .filter((p) => !p.withdrawn)
      .every((p) => p.gamesCompleted >= games)
    const batchReady =
      !latest.activeBatch || latest.activeBatch.pendingMatches === 0

    if (!allDone || !batchReady || nextBatchMutation.isPending) return

    finalizeInFlightRef.current = true
    try {
      await nextBatchMutation.mutateAsync()
    } catch {
      const recovered = await queryClient.fetchQuery({
        queryKey: chessMatchmakingKeys.status(event.id),
        queryFn: () => fetchChessMatchmakingStatus(event.id),
      })
      if (recovered?.matchmakingStatus === 'COMPLETED') {
        applyCompletedStatus(recovered)
        setActionError('')
        await invalidateAll()
      }
    } finally {
      finalizeInFlightRef.current = false
    }
  }

  const resultMutation = useMutation({
    mutationFn: ({
      matchId,
      result,
    }: {
      matchId: string
      result: ChessMatchResult
    }) => setChessMatchResult(event.id, matchId, result),
    onMutate: async ({ matchId, result }) => {
      markSaving(matchId, true)
      setActionError('')

      await queryClient.cancelQueries({
        queryKey: chessMatchmakingKeys.matches(event.id),
      })
      await queryClient.cancelQueries({
        queryKey: chessMatchmakingKeys.status(event.id),
      })

      const previousMatches = queryClient.getQueryData<{
        eventId: string
        data: ChessMatchRow[]
      }>(chessMatchmakingKeys.matches(event.id))
      const previousStatus = queryClient.getQueryData<ChessMatchmakingStatus>(
        chessMatchmakingKeys.status(event.id),
      )

      const match = previousMatches?.data.find((m) => m.id === matchId)
      if (!match) {
        return { previousMatches, previousStatus, matchId }
      }

      const whiteWon = result === 'WHITE_WIN'
      const blackWon = result === 'BLACK_WIN'
      const isDraw = result === 'DRAW'
      const completedAt = new Date().toISOString()

      queryClient.setQueryData(
        chessMatchmakingKeys.matches(event.id),
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((m) =>
              m.id === matchId
                ? {
                    ...m,
                    status: 'COMPLETED' as const,
                    result,
                    completedAt,
                  }
                : m,
            ),
          }
        },
      )

      queryClient.setQueryData(
        chessMatchmakingKeys.status(event.id),
        (old) => {
          if (!old) return old
          return {
            ...old,
            activeBatch: old.activeBatch
              ? {
                  ...old.activeBatch,
                  pendingMatches: Math.max(
                    0,
                    old.activeBatch.pendingMatches - 1,
                  ),
                  completedMatches: old.activeBatch.completedMatches + 1,
                }
              : null,
            playerProgress: old.playerProgress.map((p) => {
              if (p.registrationId === match.white.registrationId) {
                return {
                  ...p,
                  gamesCompleted: p.gamesCompleted + 1,
                  whiteGames: p.whiteGames + 1,
                  eventWins: whiteWon ? p.eventWins + 1 : p.eventWins,
                  eventLosses: blackWon ? p.eventLosses + 1 : p.eventLosses,
                  eventDraws: isDraw ? p.eventDraws + 1 : p.eventDraws,
                }
              }
              if (p.registrationId === match.black.registrationId) {
                return {
                  ...p,
                  gamesCompleted: p.gamesCompleted + 1,
                  blackGames: p.blackGames + 1,
                  eventWins: blackWon ? p.eventWins + 1 : p.eventWins,
                  eventLosses: whiteWon ? p.eventLosses + 1 : p.eventLosses,
                  eventDraws: isDraw ? p.eventDraws + 1 : p.eventDraws,
                }
              }
              return p
            }),
          }
        },
      )

      return { previousMatches, previousStatus, matchId }
    },
    onSuccess: (data, { matchId }) => {
      setActionError('')
      queryClient.setQueryData(
        chessMatchmakingKeys.matches(event.id),
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((m) => (m.id === matchId ? data : m)),
          }
        },
      )
    },
    onError: (err, _vars, context) => {
      if (context?.previousMatches) {
        queryClient.setQueryData(
          chessMatchmakingKeys.matches(event.id),
          context.previousMatches,
        )
      }
      if (context?.previousStatus) {
        queryClient.setQueryData(
          chessMatchmakingKeys.status(event.id),
          context.previousStatus,
        )
      }
      setActionError(
        err instanceof Error ? err.message : 'Failed to save match result',
      )
    },
    onSettled: (_data, _error, { matchId }) => {
      markSaving(matchId, false)
      scheduleDebouncedSync()
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: (registrationId: string) =>
      withdrawChessPlayer(event.id, registrationId),
    onSuccess: async () => {
      setActionError('')
      await invalidateAll()
    },
    onError: (err) => {
      setActionError(
        err instanceof Error ? err.message : 'Failed to withdraw player',
      )
    },
  })

  const status = statusQuery.data
  const matches = matchesQuery.data?.data ?? []
  const mmStatus =
    status?.matchmakingStatus ?? event.matchmakingStatus ?? 'NOT_STARTED'
  const gamesPerPlayer =
    status?.gamesPerPlayer ?? event.gamesPerPlayer ?? 3
  const currentGame =
    status?.currentGame ?? status?.currentRound ?? null

  const scheduledInActiveGame = useMemo(() => {
    const activeBatchNumber = status?.activeBatch?.batchNumber ?? null
    if (!currentGame || activeBatchNumber == null) {
      return matches.filter((m) => m.status === 'SCHEDULED')
    }
    return matches.filter((m) => {
      const game = m.gameNumber ?? m.roundNumber
      return (
        game === currentGame &&
        m.batchNumber === activeBatchNumber &&
        m.status === 'SCHEDULED'
      )
    })
  }, [matches, currentGame, status?.activeBatch?.batchNumber])

  const completedInActiveBatch = useMemo(() => {
    const activeBatchNumber = status?.activeBatch?.batchNumber ?? null
    if (!status?.activeBatch || !currentGame || activeBatchNumber == null) {
      return []
    }
    return matches
      .filter((m) => {
        const game = m.gameNumber ?? m.roundNumber
        return (
          game === currentGame &&
          m.batchNumber === activeBatchNumber &&
          m.status === 'COMPLETED'
        )
      })
      .sort((a, b) => a.boardNumber - b.boardNumber)
  }, [matches, status, currentGame])

  const boardMatches = useMemo(() => {
    if (scheduledInActiveGame.length > 0) return scheduledInActiveGame
    if (status?.activeBatch?.pendingMatches === 0) {
      return completedInActiveBatch
    }
    return []
  }, [scheduledInActiveGame, completedInActiveBatch, status])

  const pastMatchGroups = useMemo(() => {
    const liveIds = new Set(boardMatches.map((m) => m.id))
    const completed = matches.filter(
      (m) => m.status === 'COMPLETED' && !liveIds.has(m.id),
    )
    const groups = new Map<string, ChessMatchRow[]>()
    for (const m of completed) {
      const game = m.gameNumber ?? m.roundNumber ?? 0
      const batch = m.batchNumber ?? 0
      const key = `${game}-${batch}`
      const list = groups.get(key) ?? []
      list.push(m)
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
  }, [matches, boardMatches])

  const pendingCount = scheduledInActiveGame.length
  const batchTotal =
    (status?.activeBatch?.completedMatches ?? 0) +
    (status?.activeBatch?.pendingMatches ?? 0)
  const batchDone = status?.activeBatch?.completedMatches ?? 0

  const sortedProgress = useMemo(() => {
    if (!status) return []
    return [...status.playerProgress].sort((a, b) => {
      if (a.withdrawn !== b.withdrawn) return a.withdrawn ? 1 : -1
      if (b.rating !== a.rating) return b.rating - a.rating
      const scoreA = a.eventWins * 2 + a.eventDraws
      const scoreB = b.eventWins * 2 + b.eventDraws
      return scoreB - scoreA
    })
  }, [status])

  const canStart = mmStatus === 'NOT_STARTED'
  const canNextBatch =
    mmStatus === 'IN_PROGRESS' &&
    status?.activeBatch != null &&
    status.activeBatch.pendingMatches === 0
  const busy =
    startMutation.isPending ||
    nextBatchMutation.isPending ||
    withdrawMutation.isPending

  const readyCount = status?.playerProgress.filter((p) => !p.withdrawn).length
    ?? presentCount

  const allPlayersFinished = useMemo(() => {
    if (!status?.playerProgress.length) return false
    return status.playerProgress
      .filter((p) => !p.withdrawn)
      .every((p) => p.gamesCompleted >= gamesPerPlayer)
  }, [status, gamesPerPlayer])

  const tournamentComplete =
    mmStatus === 'COMPLETED' || allPlayersFinished

  useEffect(() => {
    return () => {
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!status || subTabSeeded) return
    if (mmStatus === 'COMPLETED' || tournamentComplete) {
      setSubTab('standings')
    } else {
      setSubTab('boards')
    }
    setSubTabSeeded(true)
  }, [status, mmStatus, tournamentComplete, subTabSeeded])

  const showWorkspaceTabs = mmStatus !== 'NOT_STARTED'
  const pastCount = pastMatchGroups.reduce(
    (sum, group) => sum + group.matches.length,
    0,
  )
  const activeStandings = sortedProgress.filter((p) => !p.withdrawn).length

  return (
    <div className="space-y-5">
      <GlassPanel className="overflow-hidden p-0">
        <div className="px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Matchmaking</h2>
              <p className="mt-0.5 text-sm text-ink/50">
                {mmStatus === 'NOT_STARTED'
                  ? `Each player plays ${gamesPerPlayer} games — check everyone in first`
                  : mmStatus === 'COMPLETED'
                    ? 'Tournament complete'
                    : `${readyCount} players · ${gamesPerPlayer} games each · ${status?.boardCount ?? event.boardCount ?? '—'} boards per set`}
              </p>
            </div>
            <GameProgressStepper
              currentGame={currentGame}
              gamesPerPlayer={gamesPerPlayer}
              mmStatus={mmStatus}
            />
          </div>

          {statusQuery.isPending ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-12 w-full" />
            </div>
          ) : statusQuery.isError ? (
            <p className="mt-4 text-sm text-red-700">
              {statusQuery.error instanceof Error
                ? statusQuery.error.message
                : 'Failed to load status'}
            </p>
          ) : null}

          {canStart ? (
            <div className="mt-4 rounded-2xl border border-line bg-white/80 p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-28">
                  <FieldLabel>Boards</FieldLabel>
                  <TextInput
                    type="number"
                    min={1}
                    value={boardOverride}
                    onChange={(e) => setBoardOverride(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  className="min-w-[10rem]"
                  disabled={busy || presentCount < 2}
                  onClick={() => startMutation.mutate()}
                >
                  {startMutation.isPending ? 'Starting…' : 'Start pairing'}
                </Button>
              </div>
              <p className="mt-3 text-sm text-ink/50">
                {presentCount < 2
                  ? 'Mark at least 2 players present on the Check-in tab, then start.'
                  : `${presentCount} players will be paired. With ${boardOverride || '—'} boards, you may need several board sets before everyone finishes game 1.`}
              </p>
            </div>
          ) : null}

          {mmStatus === 'IN_PROGRESS' && status?.activeBatch && !canNextBatch ? (
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs font-semibold text-ink/50">
                <span>
                  Game {currentGame} of {gamesPerPlayer}
                  {status.currentBatch
                    ? ` · Board set ${status.currentBatch}`
                    : ''}
                </span>
                <span>
                  {batchDone}/{batchTotal || '—'} scored
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink/8">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${batchTotal ? Math.round((batchDone / batchTotal) * 100) : 0}%`,
                  }}
                />
              </div>
              {pendingCount > 0 ? (
                <p className="mt-2 text-sm text-ink/55">
                  Score the {pendingCount} remaining board
                  {pendingCount === 1 ? '' : 's'} in Boards.
                </p>
              ) : null}
            </div>
          ) : null}

          {canNextBatch && !tournamentComplete ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">Board set complete</p>
                <p className="mt-0.5 text-sm text-ink/55">
                  {currentGame != null && currentGame < gamesPerPlayer
                    ? `More board sets may be needed until every player finishes game ${currentGame}. Then game ${currentGame + 1} starts (winners vs winners).`
                    : 'Continue to the next board set'}
                  {readyCount % 2 === 1
                    ? ' One player gets a bye (auto-win) when this game ends.'
                    : ''}
                </p>
              </div>
              <Button
                type="button"
                disabled={busy}
                onClick={() => nextBatchMutation.mutate()}
              >
                {nextBatchMutation.isPending ? 'Loading…' : 'Next board set →'}
              </Button>
            </div>
          ) : null}

          {mmStatus === 'COMPLETED' ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-900">
              Every player has played {gamesPerPlayer} games. Results saved.
            </div>
          ) : null}

          {actionError ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
              {actionError}
            </p>
          ) : null}
        </div>
      </GlassPanel>

      {showWorkspaceTabs ? (
        <>
          <TabBar
            aria-label="Matchmaking sections"
            size="sm"
            tabs={[
              {
                id: 'boards',
                label: pendingCount > 0 ? 'Live boards' : 'Boards',
                badge: pendingCount > 0 ? pendingCount : undefined,
              },
              {
                id: 'results',
                label: 'Past results',
                badge: pastCount > 0 ? pastCount : undefined,
                disabled: pastMatchGroups.length === 0,
              },
              {
                id: 'standings',
                label: 'Standings',
                badge:
                  status && status.playerProgress.length > 0
                    ? activeStandings
                    : undefined,
                disabled: !status || status.playerProgress.length === 0,
              },
            ]}
            value={subTab}
            onChange={setSubTab}
          />

          {subTab === 'boards' ? (
            <div>
              <div className="mb-3">
                <h3 className="text-base font-semibold text-ink">
                  {pendingCount > 0 ? 'Live boards' : 'Latest boards'}
                </h3>
                <p className="text-sm text-ink/50">
                  {tournamentComplete
                    ? 'Tournament complete — see Standings for final rankings'
                    : pendingCount > 0
                      ? 'Tap the winner’s name on each board'
                      : canNextBatch
                        ? 'All scored — tap Next board set when ready'
                        : 'No active boards'}
                </p>
              </div>

              {matchesQuery.isPending ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
              ) : boardMatches.length === 0 ? (
                <GlassPanel className="p-6 text-center text-sm">
                  {tournamentComplete ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-emerald-800">
                        Tournament complete
                      </p>
                      <p className="text-ink/55">
                        Every player has played {gamesPerPlayer} games. Results
                        are saved — open Standings for the final table.
                      </p>
                    </div>
                  ) : canNextBatch ? (
                    <p className="text-ink/50">
                      Tap “Next board set” above to continue.
                    </p>
                  ) : (
                    <p className="text-ink/50">
                      Waiting for the next board set…
                    </p>
                  )}
                </GlassPanel>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {boardMatches.map((match) => (
                    <BoardCard
                      key={match.id}
                      match={match}
                      saving={savingMatchIds.has(match.id)}
                      onResult={(result) =>
                        resultMutation.mutate({ matchId: match.id, result })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {subTab === 'results' ? (
            pastMatchGroups.length === 0 ? (
              <GlassPanel className="p-6 text-center text-sm text-ink/50">
                No completed board sets yet.
              </GlassPanel>
            ) : (
              <GlassPanel className="overflow-hidden p-0">
                <div className="px-5 py-4 sm:px-6">
                  <h3 className="text-base font-semibold text-ink">
                    Past results
                  </h3>
                  <p className="mt-0.5 text-sm text-ink/50">
                    {pastMatchGroups.length} board set
                    {pastMatchGroups.length === 1 ? '' : 's'} completed · winners
                    and draws
                  </p>
                </div>
                <div className="space-y-5 border-t border-line/60 px-5 py-4 sm:px-6">
                  {pastMatchGroups.map((group) => (
                    <div key={`${group.gameNumber}-${group.batchNumber}`}>
                      <h4 className="mb-3 text-sm font-bold text-ink/70">
                        Game {group.gameNumber}
                        {group.batchNumber > 0
                          ? ` · Board set ${group.batchNumber}`
                          : ''}
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {group.matches.map((match) => (
                          <CompletedMatchCard key={match.id} match={match} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            )
          ) : null}

          {subTab === 'standings' ? (
            !status || status.playerProgress.length === 0 ? (
              <GlassPanel className="p-6 text-center text-sm text-ink/50">
                Standings appear once pairing starts.
              </GlassPanel>
            ) : (
              <GlassPanel className="overflow-hidden p-0">
                <div className="px-5 py-4 sm:px-6">
                  <h3 className="text-base font-semibold text-ink">Standings</h3>
                  <p className="mt-0.5 text-sm text-ink/50">
                    {activeStandings} active
                    {sortedProgress.some((p) => p.withdrawn)
                      ? ` · ${sortedProgress.filter((p) => p.withdrawn).length} left`
                      : ''}
                  </p>
                </div>
                <div className="grid gap-3 border-t border-line/60 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:px-6">
                  {sortedProgress.map((row) => (
                    <PlayerProgressCard
                      key={row.registrationId}
                      row={row}
                      gamesPerPlayer={gamesPerPlayer}
                      canWithdraw={!row.withdrawn && mmStatus !== 'COMPLETED'}
                      withdrawing={
                        withdrawMutation.isPending &&
                        withdrawMutation.variables === row.registrationId
                      }
                      busy={busy}
                      onWithdraw={() => {
                        if (
                          window.confirm(
                            `Remove ${row.user.firstName} ${row.user.lastName} from the tournament? Their open match will be cancelled.`,
                          )
                        ) {
                          withdrawMutation.mutate(row.registrationId)
                        }
                      }}
                    />
                  ))}
                </div>
              </GlassPanel>
            )
          ) : null}
        </>
      ) : null}
    </div>
  )
}
