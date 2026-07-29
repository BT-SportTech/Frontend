import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import type { Paginated, School, SchoolListItem, SchoolType } from '../../lib/types'
import { Pagination } from '../../components/Pagination'
import {
  Button,
  FieldLabel,
  GlassPanel,
  SelectInput,
  TextInput,
} from '../../components/ui'
import { useAdminSearchStore } from '../../stores/useAdminSearchStore'

const SCHOOL_TYPES: SchoolType[] = [
  'PUBLIC',
  'PRIVATE',
  'INTERNATIONAL',
  'RESIDENTIAL',
  'GOVERNMENT_AIDED',
]

interface SchoolFormState {
  name: string
  code: string
  type: SchoolType
  email: string
  contactNumber: string
  state: string
  district: string
  city: string
  pincode: string
  principalName: string
  website: string
}

const emptyForm = (): SchoolFormState => ({
  name: '',
  code: '',
  type: 'PRIVATE',
  email: '',
  contactNumber: '',
  state: '',
  district: '',
  city: '',
  pincode: '',
  principalName: '',
  website: '',
})

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
  const [form, setForm] = useState<SchoolFormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [search])

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

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  async function openEdit(id: string) {
    setError('')
    try {
      const school = await api<School>(`/schools/${id}`)
      setEditingId(id)
      setForm({
        name: school.name ?? '',
        code: school.code ?? '',
        type: school.type ?? 'PRIVATE',
        email: school.email ?? '',
        contactNumber: school.contactNumber ?? '',
        state: school.state ?? '',
        district: school.district ?? '',
        city: school.city ?? '',
        pincode: school.pincode ?? '',
        principalName: school.principalName ?? '',
        website: school.website ?? '',
      })
      setModalOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load school')
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        code: form.code,
        type: form.type,
        email: form.email || undefined,
        contactNumber: form.contactNumber || undefined,
        state: form.state || undefined,
        district: form.district || undefined,
        city: form.city || undefined,
        pincode: form.pincode || undefined,
        principalName: form.principalName || undefined,
        website: form.website || undefined,
      }

      if (editingId) {
        await api(`/schools/${editingId}`, { method: 'PATCH', body: payload })
      } else {
        await api('/schools', { method: 'POST', body: payload })
      }
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

  function setField<K extends keyof SchoolFormState>(key: K, value: SchoolFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Schools</h1>
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

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-sm">
          <GlassPanel strong className="animate-rise max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <h2 className="font-display text-xl font-semibold text-ink">
              {editingId ? 'Edit school' : 'Add school'}
            </h2>
            <form onSubmit={onSave} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldLabel>School name</FieldLabel>
                  <TextInput
                    required
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Code</FieldLabel>
                  <TextInput
                    required
                    value={form.code}
                    onChange={(e) => setField('code', e.target.value)}
                    disabled={Boolean(editingId)}
                  />
                </div>
                <div>
                  <FieldLabel>Type</FieldLabel>
                  <SelectInput
                    value={form.type}
                    onChange={(e) =>
                      setField('type', e.target.value as SchoolType)
                    }
                  >
                    {SCHOOL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replaceAll('_', ' ')}
                      </option>
                    ))}
                  </SelectInput>
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <TextInput
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Contact</FieldLabel>
                  <TextInput
                    value={form.contactNumber}
                    onChange={(e) => setField('contactNumber', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Principal</FieldLabel>
                  <TextInput
                    value={form.principalName}
                    onChange={(e) => setField('principalName', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Website</FieldLabel>
                  <TextInput
                    value={form.website}
                    onChange={(e) => setField('website', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>State</FieldLabel>
                  <TextInput
                    value={form.state}
                    onChange={(e) => setField('state', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>District</FieldLabel>
                  <TextInput
                    value={form.district}
                    onChange={(e) => setField('district', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>City</FieldLabel>
                  <TextInput
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Pincode</FieldLabel>
                  <TextInput
                    value={form.pincode}
                    onChange={(e) => setField('pincode', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          </GlassPanel>
        </div>
      ) : null}
    </div>
  )
}
