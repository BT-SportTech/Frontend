import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { api, resolveAssetUrl, uploadSchoolLogo } from '../../lib/api'
import type { Paginated, School, SchoolListItem } from '../../lib/types'
import {
  emptySchoolForm,
  formToSchoolPayload,
  schoolToForm,
} from '../../lib/schoolForm'
import {
  clearSchoolDraft,
  draftToFormState,
  hasMeaningfulSchoolDraft,
  readSchoolDraft,
  writeSchoolDraft,
} from '../../lib/schoolDraft'
import type { SchoolFormState } from '../../interfaces/school.interface'
import { Pagination } from '../../components/Pagination'
import {
  SCHOOL_FORM_STEPS,
  SchoolFormStepper,
} from '../../components/schools'
import { Button, GlassPanel } from '../../components/ui'
import { DraftToast } from '../../components/ui/DraftToast'
import { Modal } from '../../components/ui/Modal'
import { useAdminSearchStore } from '../../stores/useAdminSearchStore'

export function SchoolsPage() {
  const search = useAdminSearchStore((state) => state.schools)
  const [data, setData] = useState<SchoolListItem[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SchoolFormState>(emptySchoolForm())
  const [formStep, setFormStep] = useState(0)
  const [formSessionKey, setFormSessionKey] = useState('new')
  const [saving, setSaving] = useState(false)
  const [showDraftToast, setShowDraftToast] = useState(false)
  const [deactivateTarget, setDeactivateTarget] =
    useState<SchoolListItem | null>(null)
  const [deactivating, setDeactivating] = useState(false)
  const skipDraftSaveRef = useRef(false)

  useEffect(() => {
    setPage(1)
  }, [search])

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

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (search) params.set('search', search)

      const res = await api<Paginated<SchoolListItem>>(
        `/schools?${params.toString()}`,
      )
      setData(res.data)
      setTotal(res.meta.total)
      setTotalPages(res.meta.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schools')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!modalOpen || skipDraftSaveRef.current) return
    if (!hasMeaningfulSchoolDraft(form, formStep) && !form.logoFile) return

    const handle = window.setTimeout(() => {
      void writeSchoolDraft({
        editingId,
        step: formStep,
        form,
      })
    }, 350)

    return () => window.clearTimeout(handle)
  }, [modalOpen, editingId, form, formStep])

  const persistDraftAndClose = useCallback(() => {
    if (hasMeaningfulSchoolDraft(form, formStep) || form.logoFile) {
      void writeSchoolDraft({
        editingId,
        step: formStep,
        form,
      }).then(() => setShowDraftToast(true))
    }
    setModalOpen(false)
  }, [editingId, form, formStep])

  function openCreate() {
    skipDraftSaveRef.current = true
    setEditingId(null)
    setForm(emptySchoolForm())
    setFormStep(0)
    setFormSessionKey(`new-${Date.now()}`)
    setModalOpen(true)
    window.setTimeout(() => {
      skipDraftSaveRef.current = false
    }, 0)
  }

  async function openEdit(id: string) {
    setError('')
    try {
      const school = await api<School>(`/schools/${id}`)
      skipDraftSaveRef.current = true
      setEditingId(id)
      setForm(schoolToForm(school))
      setFormStep(0)
      setFormSessionKey(`edit-${id}-${Date.now()}`)
      setModalOpen(true)
      window.setTimeout(() => {
        skipDraftSaveRef.current = false
      }, 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load school')
    }
  }

  async function resumeDraft() {
    const draft = readSchoolDraft()
    if (!draft) {
      setShowDraftToast(false)
      return
    }

    try {
      skipDraftSaveRef.current = true
      const restored = await draftToFormState(draft)
      const safeStep = Math.min(
        Math.max(draft.step, 0),
        SCHOOL_FORM_STEPS.length - 1,
      )
      setEditingId(draft.editingId)
      setForm(restored)
      setFormStep(safeStep)
      setFormSessionKey(
        `draft-${draft.editingId ?? 'new'}-${draft.updatedAt}`,
      )
      setShowDraftToast(false)
      setModalOpen(true)
      window.setTimeout(() => {
        skipDraftSaveRef.current = false
      }, 0)
    } catch {
      setError('Unable to restore the saved draft')
    }
  }

  function dismissDraft() {
    clearSchoolDraft()
    setShowDraftToast(false)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      let logoUrl = form.logoUrl.trim()
      if (form.logoFile) {
        const uploaded = await uploadSchoolLogo(form.logoFile)
        logoUrl = uploaded.url
      }

      const payload = {
        ...formToSchoolPayload(form),
        logoUrl: logoUrl || undefined,
      }

      if (editingId) {
        await api(`/schools/${editingId}`, { method: 'PATCH', body: payload })
      } else {
        await api('/schools', { method: 'POST', body: payload })
      }

      clearSchoolDraft()
      setShowDraftToast(false)
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return
    setDeactivating(true)
    setError('')
    try {
      await api(`/schools/${deactivateTarget.id}`, { method: 'DELETE' })
      setDeactivateTarget(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deactivate failed')
      setDeactivateTarget(null)
    } finally {
      setDeactivating(false)
    }
  }

  function setField<K extends keyof SchoolFormState>(
    key: K,
    value: SchoolFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

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
        <Button onClick={openCreate}>Add school</Button>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <GlassPanel strong className="overflow-hidden">
        <div className="min-h-[28rem] overflow-x-auto">
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
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="h-[24rem] px-4 text-center align-middle text-ink/60"
                  >
                    Loading…
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="h-[24rem] px-4 text-center align-middle text-ink/60"
                  >
                    No schools found
                  </td>
                </tr>
              ) : (
                data.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-line/50 transition hover:bg-accent/25"
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          className="!h-9 !w-9 !px-0 !py-0"
                          title="Edit"
                          aria-label="Edit school"
                          onClick={() => void openEdit(s.id)}
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
                            <circle cx="12" cy="12" r="10" />
                            <path d="m4.9 4.9 14.2 14.2" />
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
        <div className="px-4 pb-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </GlassPanel>

      <Modal
        open={modalOpen}
        title={editingId ? 'Edit school' : 'Add school'}
        onClose={persistDraftAndClose}
        className="max-w-3xl"
      >
        <SchoolFormStepper
          form={form}
          editing={Boolean(editingId)}
          saving={saving}
          resetKey={formSessionKey}
          initialStep={formStep}
          onStepChange={setFormStep}
          onChange={setField}
          onSubmit={onSave}
          onCancel={persistDraftAndClose}
        />
      </Modal>

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
            onClick={() => void confirmDeactivate()}
          >
            {deactivating ? 'Deactivating…' : 'Deactivate'}
          </Button>
        </div>
      </Modal>

      <DraftToast
        open={showDraftToast && !modalOpen}
        onResume={() => void resumeDraft()}
        onDismiss={dismissDraft}
      />
    </div>
  )
}
