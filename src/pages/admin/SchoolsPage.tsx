import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { resolveAssetUrl } from '../../lib/api'
import type { SchoolListItem } from '../../lib/types'
import { Pagination } from '../../components/Pagination'
import { Button, GlassPanel } from '../../components/ui'
import { DraftToast } from '../../components/ui/DraftToast'
import { Modal } from '../../components/ui/Modal'
import { dashboardKeys } from '../../lib/queries/dashboard'
import {
  deactivateSchool,
  fetchSchools,
  schoolsKeys,
} from '../../lib/queries/schools'
import {
  clearSchoolDraft,
  hasMeaningfulSchoolDraft,
  readSchoolDraft,
} from '../../lib/schoolDraft'
import { emptySchoolForm } from '../../lib/schoolForm'
import { useAdminSearchStore } from '../../stores/useAdminSearchStore'
import { toast } from '../../stores/useToastStore'

export function SchoolsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const search = useAdminSearchStore((state) => state.schools)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [prevSearch, setPrevSearch] = useState(search)
  const [showDraftToast, setShowDraftToast] = useState(false)
  const [deactivateTarget, setDeactivateTarget] =
    useState<SchoolListItem | null>(null)

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
    queryKey: schoolsKeys.list({ page: listPage, limit, search }),
    queryFn: () => fetchSchools({ page: listPage, limit, search }),
  })

  const schools = data?.data ?? []
  const total = data?.meta.total ?? 0
  const totalPages = data?.meta.totalPages ?? 0

  const invalidateSchoolQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: schoolsKeys.all }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
    ])
  }, [queryClient])

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateSchool(id),
    onSuccess: async () => {
      setDeactivateTarget(null)
      toast.success('School deactivated.')
      await invalidateSchoolQueries()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Deactivate failed')
      setDeactivateTarget(null)
    },
  })

  useEffect(() => {
    if (!isError) return
    toast.error(
      listError instanceof Error
        ? listError.message
        : 'Failed to load schools',
    )
  }, [isError, listError])

  useEffect(() => {
    const draft = readSchoolDraft()
    if (!draft) return
    const restoredForm = { ...emptySchoolForm(), ...draft.form, logoFile: null }
    if (
      hasMeaningfulSchoolDraft(restoredForm, draft.step) ||
      Boolean(draft.logoDraftDataUrl)
    ) {
      setShowDraftToast(true)
    }
  }, [])

  function resumeDraft() {
    const draft = readSchoolDraft()
    setShowDraftToast(false)
    if (!draft) return
    if (draft.editingId) {
      navigate(`/admin/schools/${draft.editingId}/edit`)
      return
    }
    navigate('/admin/schools/new')
  }

  function dismissDraft() {
    clearSchoolDraft()
    setShowDraftToast(false)
  }

  function confirmDeactivate() {
    if (!deactivateTarget) return
    deactivateMutation.mutate(deactivateTarget.id)
  }

  const deactivating = deactivateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Schools
          </h1>
          <p className="mt-1.5 text-sm text-ink/55">
            Register and manage school profiles
          </p>
        </div>
        <Button onClick={() => navigate('/admin/schools/new')}>
          Add school
        </Button>
      </div>

      <GlassPanel strong className="overflow-hidden">
        <div className="hidden min-h-[28rem] overflow-x-auto lg:block">
          <table className="w-full min-w-[1100px] text-left text-sm text-ink">
            <thead className="border-b border-line bg-accent/40 text-ink/80">
              <tr>
                <th className="px-4 py-3 font-semibold">School</th>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Pincode</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr>
                  <td
                    colSpan={9}
                    className="h-[24rem] px-4 text-center align-middle text-ink/60"
                  >
                    Loading…
                  </td>
                </tr>
              ) : schools.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="h-[24rem] px-4 text-center align-middle text-ink/60"
                  >
                    No schools found
                  </td>
                </tr>
              ) : (
                schools.map((s) => (
                  <tr
                    key={s.id}
                    role="link"
                    tabIndex={0}
                    className="cursor-pointer border-b border-line/50 transition hover:bg-accent/25"
                    onClick={() =>
                      window.open(
                        `/admin/schools/${s.id}`,
                        '_blank',
                        'noopener,noreferrer',
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        window.open(
                          `/admin/schools/${s.id}`,
                          '_blank',
                          'noopener,noreferrer',
                        )
                      }
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {s.logoUrl ? (
                          <img
                            src={resolveAssetUrl(s.logoUrl)}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg border border-line object-cover bg-white"
                          />
                        ) : (
                          <span
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-accent/50 text-primary"
                            aria-hidden
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-5 w-5"
                            >
                              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                              <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                          </span>
                        )}
                        <span className="font-semibold text-ink">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">{s.code}</td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {s.type.replaceAll('_', ' ')}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {s.contactNumber || '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {s.email || '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {[s.city, s.district, s.state].filter(Boolean).join(', ') ||
                        '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {s.pincode || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                          s.isActive
                            ? 'bg-secondary/10 text-secondary'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          className="!h-9 !w-9 !px-0 !py-0"
                          title="Edit"
                          aria-label="Edit school"
                          onClick={() => navigate(`/admin/schools/${s.id}/edit`)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                            aria-hidden
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </Button>
                        <Button
                          variant="danger"
                          className="!h-9 !w-9 !px-0 !py-0"
                          title="Deactivate"
                          aria-label="Deactivate school"
                          onClick={() => setDeactivateTarget(s)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                            aria-hidden
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {isPending ? (
            <p className="py-16 text-center text-sm text-ink/60">Loading…</p>
          ) : schools.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink/60">
              No schools found
            </p>
          ) : (
            schools.map((s) => {
              const location =
                [s.city, s.district, s.state].filter(Boolean).join(', ') ||
                '—'
              return (
                <article
                  key={s.id}
                  className="rounded-xl border border-line/70 bg-white/80 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {s.logoUrl ? (
                      <img
                        src={resolveAssetUrl(s.logoUrl)}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg border border-line object-cover bg-white"
                      />
                    ) : (
                      <span
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-accent/50 text-primary"
                        aria-hidden
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5"
                        >
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                          <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        className="text-left font-semibold text-ink hover:text-primary"
                        onClick={() =>
                          window.open(
                            `/admin/schools/${s.id}`,
                            '_blank',
                            'noopener,noreferrer',
                          )
                        }
                      >
                        {s.name}
                      </button>
                      <p className="mt-1 text-sm text-ink/60">{location}</p>
                      <span
                        className={`mt-2 inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                          s.isActive
                            ? 'bg-secondary/10 text-secondary'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 border-t border-line/60 pt-3">
                    <Button
                      variant="ghost"
                      className="!h-9 flex-1"
                      onClick={() => navigate(`/admin/schools/${s.id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      className="!h-9 flex-1"
                      onClick={() => setDeactivateTarget(s)}
                    >
                      Deactivate
                    </Button>
                  </div>
                </article>
              )
            })
          )}
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
        open={Boolean(deactivateTarget)}
        title="Deactivate school"
        onClose={() => {
          if (!deactivating) setDeactivateTarget(null)
        }}
        className="max-w-md"
      >
        <p className="text-sm leading-relaxed text-ink/80">
          Are you sure you want to deactivate{' '}
          <span className="font-semibold text-ink">
            {deactivateTarget?.name}
          </span>
          {deactivateTarget?.code ? (
            <>
              {' '}
              (
              <span className="font-medium text-ink/90">
                {deactivateTarget.code}
              </span>
              )
            </>
          ) : null}
          ? This school will no longer appear in active listings.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="ghost"
            disabled={deactivating}
            onClick={() => setDeactivateTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={deactivating}
            onClick={confirmDeactivate}
          >
            {deactivating ? 'Deactivating…' : 'Deactivate'}
          </Button>
        </div>
      </Modal>

      <DraftToast
        open={showDraftToast}
        onResume={resumeDraft}
        onDismiss={dismissDraft}
      />
    </div>
  )
}
