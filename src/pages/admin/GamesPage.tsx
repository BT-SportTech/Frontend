import { useCallback, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pagination } from '../../components/Pagination'
import { GameImageUploadField } from '../../components/games/GameImageUploadField'
import {
  Button,
  FieldLabel,
  GlassPanel,
  TextInput,
} from '../../components/ui'
import { Modal } from '../../components/ui/Modal'
import { resolveAssetUrl } from '../../lib/api'
import {
  deactivateGame,
  emptyGameForm,
  fetchGames,
  gamesKeys,
  gameToForm,
  saveGame,
  type GameFormState,
} from '../../lib/queries/games'
import type { Game } from '../../lib/types'
import { useAdminSearchStore } from '../../stores/useAdminSearchStore'

export function GamesPage() {
  const queryClient = useQueryClient()
  const search = useAdminSearchStore((state) => state.games)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [prevSearch, setPrevSearch] = useState(search)
  const [actionError, setActionError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<GameFormState>(emptyGameForm())
  const [deactivateTarget, setDeactivateTarget] = useState<Game | null>(null)

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
    queryKey: gamesKeys.list({
      page: listPage,
      limit,
      search,
      includeInactive: true,
    }),
    queryFn: () =>
      fetchGames({
        page: listPage,
        limit,
        search,
        includeInactive: true,
      }),
  })

  const games = data?.data ?? []
  const total = data?.meta.total ?? 0
  const totalPages = data?.meta.totalPages ?? 0

  const sides = Math.max(2, parseInt(form.sidesPerMatch, 10) || 2)
  const perSide = Math.max(1, parseInt(form.playersPerSide, 10) || 1)
  const playersPerMatch = sides * perSide

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: gamesKeys.all })
  }, [queryClient])

  const saveMutation = useMutation({
    mutationFn: async () => saveGame({ editingId, form }),
    onSuccess: async () => {
      setModalOpen(false)
      setActionError('')
      await invalidate()
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : 'Save failed')
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => deactivateGame(id),
    onSuccess: async () => {
      setDeactivateTarget(null)
      setActionError('')
      await invalidate()
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : 'Deactivate failed')
      setDeactivateTarget(null)
    },
  })

  function openCreate() {
    setEditingId(null)
    setForm(emptyGameForm())
    setActionError('')
    setModalOpen(true)
  }

  function openEdit(game: Game) {
    setEditingId(game.id)
    setForm(gameToForm(game))
    setActionError('')
    setModalOpen(true)
  }

  function patchForm<K extends keyof GameFormState>(
    key: K,
    value: GameFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setActionError('Game name is required.')
      return
    }
    saveMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Games
          </h1>
          <p className="mt-1.5 text-sm text-ink/55">
            Catalog of sports with match sizing and points
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          Create game
        </Button>
      </div>

      {actionError || isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {actionError ||
            (listError instanceof Error
              ? listError.message
              : 'Failed to load games')}
        </p>
      ) : null}

      <GlassPanel strong className="overflow-hidden">
        <div className="min-h-[28rem] overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm text-ink">
            <thead className="border-b border-line bg-accent/40 text-ink/80">
              <tr>
                <th className="px-4 py-3 font-semibold">Game</th>
                <th className="px-4 py-3 font-semibold">Match size</th>
                <th className="px-4 py-3 font-semibold">Players/match</th>
                <th className="px-4 py-3 font-semibold">Win / Loss</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
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
              ) : games.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="h-[24rem] px-4 text-center align-middle text-ink/60"
                  >
                    No games found
                  </td>
                </tr>
              ) : (
                games.map((game) => (
                  <tr
                    key={game.id}
                    className="border-b border-line/50 transition hover:bg-accent/25"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {game.imageUrl ? (
                          <img
                            src={resolveAssetUrl(game.imageUrl)}
                            alt=""
                            className="h-10 w-14 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-accent/50 text-[10px] text-ink/40">
                            No img
                          </div>
                        )}
                        <p className="font-semibold text-ink">{game.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {game.sidesPerMatch} × {game.playersPerSide}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {game.playersPerMatch}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      +{game.winPoints} / −{game.lossPoints}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                          game.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-ink/10 text-ink/60'
                        }`}
                      >
                        {game.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {game.isActive ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              className="!px-2 !py-1 text-xs"
                              onClick={() => openEdit(game)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              className="!px-2 !py-1 text-xs"
                              onClick={() => setDeactivateTarget(game)}
                            >
                              Deactivate
                            </Button>
                          </>
                        ) : null}
                      </div>
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

      <Modal
        open={modalOpen}
        title={editingId ? 'Edit game' : 'Create game'}
        onClose={() => setModalOpen(false)}
        className="max-w-lg"
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <FieldLabel>Name</FieldLabel>
            <TextInput
              required
              value={form.name}
              onChange={(e) => patchForm('name', e.target.value)}
            />
          </div>

          <GameImageUploadField
            imageUrl={form.imageUrl}
            imageFile={form.imageFile}
            onSelect={(file) =>
              setForm((prev) => ({
                ...prev,
                imageFile: file,
              }))
            }
            onClear={() =>
              setForm((prev) => ({
                ...prev,
                imageFile: null,
                imageUrl: '',
              }))
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Sides per match</FieldLabel>
              <TextInput
                type="number"
                min={2}
                required
                value={form.sidesPerMatch}
                onChange={(e) => patchForm('sidesPerMatch', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Players per side</FieldLabel>
              <TextInput
                type="number"
                min={1}
                required
                value={form.playersPerSide}
                onChange={(e) => patchForm('playersPerSide', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-line bg-white/80 px-3 py-2.5">
            <span className="text-sm text-ink/55">Players per match</span>
            <span className="font-mono text-sm font-semibold tabular-nums text-ink">
              {sides} &times; {perSide} = {playersPerMatch}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Win points</FieldLabel>
              <TextInput
                type="number"
                min={0}
                value={form.winPoints}
                onChange={(e) => patchForm('winPoints', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Loss points</FieldLabel>
              <TextInput
                type="number"
                min={0}
                value={form.lossPoints}
                onChange={(e) => patchForm('lossPoints', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
            >
              Close
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? 'Saving…'
                : editingId
                  ? 'Save changes'
                  : 'Create game'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deactivateTarget}
        title="Deactivate game"
        onClose={() => setDeactivateTarget(null)}
      >
        <p className="text-sm text-ink/70">
          Deactivate “{deactivateTarget?.name}”? It will no longer appear when
          creating events.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDeactivateTarget(null)}
          >
            Back
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={deactivateMutation.isPending}
            onClick={() => {
              if (!deactivateTarget) return
              deactivateMutation.mutate(deactivateTarget.id)
            }}
          >
            {deactivateMutation.isPending ? 'Working…' : 'Deactivate'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
