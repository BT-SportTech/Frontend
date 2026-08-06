import { api } from '../api'
import type { MatchmakingStatus } from '../types'

export type ChessMatchResult = 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW'
export type ChessMatchStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'

export type ChessPlayerRef = {
  registrationId: string
  userId: string
  user: {
    id: string
    firstName: string
    lastName: string
    username: string
  }
}

export type ChessMatchRow = {
  id: string
  boardNumber: number
  batchNumber: number | null
  roundNumber: number | null
  /** Same as roundNumber — which game (1st, 2nd, 3rd) this match belongs to. */
  gameNumber: number | null
  result: ChessMatchResult | null
  status: ChessMatchStatus
  completedAt: string | null
  white: ChessPlayerRef
  black: ChessPlayerRef
  completedBy?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

export type ChessMatchmakingStatus = {
  eventId: string
  matchmakingStatus: MatchmakingStatus
  matchmakingStartedAt: string | null
  boardCount: number | null
  gamesPerPlayer: number
  /** Game 1, 2, 3… — each player must finish this many games total. */
  currentGame: number | null
  /** @deprecated Same as currentGame */
  currentRound: number | null
  currentBatch: number | null
  activeBatch: {
    id: string
    batchNumber: number
    boardCount: number
    pendingMatches: number
    completedMatches: number
  } | null
  playerProgress: {
    registrationId: string
    userId: string
    user: {
      id: string
      firstName: string
      lastName: string
      username: string
    }
    withdrawn: boolean
    gamesCompleted: number
    eventWins: number
    eventLosses: number
    eventDraws: number
    whiteGames: number
    blackGames: number
  }[]
  rounds: {
    id: string
    roundNumber: number
    status: string
    batches: {
      id: string
      batchNumber: number
      status: string
      matchCount: number
    }[]
  }[]
}

export type StartMatchmakingResponse = {
  roundNumber: number
  batchNumber: number
  boardCount: number
  byePlayer: { registrationId: string; userId: string } | null
  unpairedCount: number
  matches: ChessMatchRow[]
}

export const chessMatchmakingKeys = {
  all: ['chess-matchmaking'] as const,
  status: (eventId: string) =>
    [...chessMatchmakingKeys.all, 'status', eventId] as const,
  matches: (eventId: string) =>
    [...chessMatchmakingKeys.all, 'matches', eventId] as const,
}

export async function fetchChessMatchmakingStatus(
  eventId: string,
): Promise<ChessMatchmakingStatus> {
  return api(`/events/${eventId}/chess/matchmaking`)
}

export async function fetchChessMatches(
  eventId: string,
): Promise<{ eventId: string; data: ChessMatchRow[] }> {
  return api(`/events/${eventId}/chess/matches`)
}

export async function startChessMatchmaking(
  eventId: string,
  boardCount?: number,
): Promise<StartMatchmakingResponse> {
  return api(`/events/${eventId}/chess/matchmaking/start`, {
    method: 'POST',
    body: boardCount ? { boardCount } : {},
  })
}

export async function nextChessBatch(
  eventId: string,
): Promise<StartMatchmakingResponse | ChessMatchmakingStatus> {
  return api(`/events/${eventId}/chess/matchmaking/next-batch`, {
    method: 'POST',
  })
}

export async function setChessMatchResult(
  eventId: string,
  matchId: string,
  result: ChessMatchResult,
): Promise<ChessMatchRow> {
  return api(`/events/${eventId}/chess/matches/${matchId}/result`, {
    method: 'PATCH',
    body: { result },
  })
}

export async function withdrawChessPlayer(
  eventId: string,
  registrationId: string,
): Promise<{
  id: string
  userId: string
  attendedAt: string | null
  withdrawnAt: string | null
  withdrawnById: string | null
  user: {
    id: string
    firstName: string
    lastName: string
    username: string
  }
}> {
  return api(
    `/events/${eventId}/chess/registrations/${registrationId}/withdraw`,
    { method: 'POST' },
  )
}
