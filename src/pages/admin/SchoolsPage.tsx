import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { api, uploadSchoolLogo } from '../../lib/api'
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

  async function deactivate(id: string) {
    if (!confirm('Deactivate this school?')) return
    try {
      await api(`/schools/${id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deactivate failed')
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line/70 bg-white/30 text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink/45">
                    Loading…
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink/45">
                    No schools found
                  </td>
                </tr>
              ) : (
                data.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-line/40 transition hover:bg-white/35"
                  >
                    <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                    <td className="px-4 py-3 text-ink/70">{s.code}</td>
                    <td className="px-4 py-3 text-ink/70">
                      {s.type.replaceAll('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      {[s.city, s.district, s.state].filter(Boolean).join(', ') ||
                        '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          className="!px-3 !py-1.5"
                          onClick={() => void openEdit(s.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          className="!px-3 !py-1.5"
                          onClick={() => void deactivate(s.id)}
                        >
                          Deactivate
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

      <DraftToast
        open={showDraftToast && !modalOpen}
        onResume={() => void resumeDraft()}
        onDismiss={dismissDraft}
      />
    </div>
  )
}
