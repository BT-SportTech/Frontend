import { api, uploadGameImage } from '../api'
import type { Game, GamePayload, Paginated } from '../types'

export type GamesListParams = {
  page: number
  limit: number
  search?: string
  isActive?: boolean
  includeInactive?: boolean
}

export const gamesKeys = {
  all: ['games'] as const,
  lists: () => [...gamesKeys.all, 'list'] as const,
  list: (params: GamesListParams) => [...gamesKeys.lists(), params] as const,
  details: () => [...gamesKeys.all, 'detail'] as const,
  detail: (id: string) => [...gamesKeys.details(), id] as const,
}

export async function fetchGames(
  params: GamesListParams,
): Promise<Paginated<Game>> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.search) searchParams.set('search', params.search)
  if (params.isActive !== undefined) {
    searchParams.set('isActive', String(params.isActive))
  }
  if (params.includeInactive) {
    searchParams.set('includeInactive', 'true')
  }

  return api<Paginated<Game>>(`/games?${searchParams.toString()}`)
}

export async function fetchGame(id: string): Promise<Game> {
  return api<Game>(`/games/${id}`)
}

export type GameFormState = {
  name: string
  sidesPerMatch: string
  playersPerSide: string
  winPoints: string
  lossPoints: string
  imageUrl: string
  imageFile: File | null
}

export function emptyGameForm(): GameFormState {
  return {
    name: '',
    sidesPerMatch: '2',
    playersPerSide: '1',
    winPoints: '0',
    lossPoints: '0',
    imageUrl: '',
    imageFile: null,
  }
}

export function gameToForm(game: Game): GameFormState {
  return {
    name: game.name,
    sidesPerMatch: String(game.sidesPerMatch),
    playersPerSide: String(game.playersPerSide),
    winPoints: String(game.winPoints),
    lossPoints: String(game.lossPoints),
    imageUrl: game.imageUrl ?? '',
    imageFile: null,
  }
}

export function formToGamePayload(form: GameFormState): GamePayload {
  return {
    name: form.name.trim(),
    sidesPerMatch: Math.max(2, parseInt(form.sidesPerMatch, 10) || 2),
    playersPerSide: Math.max(1, parseInt(form.playersPerSide, 10) || 1),
    winPoints: Math.max(0, parseInt(form.winPoints, 10) || 0),
    lossPoints: parseInt(form.lossPoints, 10) || 0,
    imageUrl: form.imageUrl.trim() || null,
  }
}

export type SaveGameInput = {
  editingId: string | null
  form: GameFormState
}

export async function saveGame({
  editingId,
  form,
}: SaveGameInput): Promise<Game> {
  let imageUrl = form.imageUrl.trim()
  if (form.imageFile) {
    const uploaded = await uploadGameImage(form.imageFile)
    imageUrl = uploaded.url
  }

  const payload: GamePayload = {
    ...formToGamePayload(form),
    imageUrl: imageUrl || null,
  }

  if (editingId) return updateGame(editingId, payload)
  return createGame(payload)
}

export async function createGame(payload: GamePayload): Promise<Game> {
  return api<Game>('/games', { method: 'POST', body: payload })
}

export async function updateGame(
  id: string,
  payload: Partial<GamePayload>,
): Promise<Game> {
  return api<Game>(`/games/${id}`, { method: 'PATCH', body: payload })
}

export async function deactivateGame(id: string): Promise<{ message: string }> {
  return api<{ message: string }>(`/games/${id}`, { method: 'DELETE' })
}
