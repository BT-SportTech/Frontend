import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SchoolFormStepper } from '../../components/schools'
import { GlassPanel, Skeleton } from '../../components/ui'
import type { SchoolFormState } from '../../interfaces/school.interface'
import { dashboardKeys } from '../../lib/queries/dashboard'
import {
  fetchSchool,
  saveSchool,
  schoolsKeys,
} from '../../lib/queries/schools'
import {
  clearSchoolDraft,
  draftToFormState,
  hasMeaningfulSchoolDraft,
  readSchoolDraft,
  writeSchoolDraft,
} from '../../lib/schoolDraft'
import { emptySchoolForm, schoolToForm } from '../../lib/schoolForm'
import { SCHOOL_FORM_STEPS } from '../../components/schools/SchoolFormStepper'
import { toast } from '../../stores/useToastStore'

export function SchoolEditPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<SchoolFormState>(emptySchoolForm())
  const [formStep, setFormStep] = useState(0)
  const [formSessionKey, setFormSessionKey] = useState(`edit-${id}`)
  const [formReady, setFormReady] = useState(false)
  const skipDraftSaveRef = useRef(false)

  const {
    data: school,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: schoolsKeys.detail(id),
    queryFn: () => fetchSchool(id),
    enabled: Boolean(id),
  })

  const invalidateSchoolQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: schoolsKeys.all }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
    ])
  }, [queryClient])

  const saveMutation = useMutation({
    mutationFn: saveSchool,
    onSuccess: async () => {
      clearSchoolDraft()
      toast.success('School updated.')
      await invalidateSchoolQueries()
      navigate(`/admin/schools/${id}`)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    },
  })

  useEffect(() => {
    if (!school) return

    const draft = readSchoolDraft()
    if (draft?.editingId === id) {
      void (async () => {
        try {
          skipDraftSaveRef.current = true
          const restored = await draftToFormState(draft)
          const safeStep = Math.min(
            Math.max(draft.step, 0),
            SCHOOL_FORM_STEPS.length - 1,
          )
          setForm(restored)
          setFormStep(safeStep)
          setFormSessionKey(`draft-edit-${id}-${draft.updatedAt}`)
          setFormReady(true)
          window.setTimeout(() => {
            skipDraftSaveRef.current = false
          }, 0)
        } catch {
          setForm(schoolToForm(school))
          setFormReady(true)
        }
      })()
      return
    }

    setForm(schoolToForm(school))
    setFormSessionKey(`edit-${id}`)
    setFormReady(true)
  }, [school, id])

  useEffect(() => {
    if (!isError) return
    toast.error(
      error instanceof Error ? error.message : 'Failed to load school',
    )
  }, [isError, error])

  useEffect(() => {
    if (!formReady || skipDraftSaveRef.current) return
    if (!hasMeaningfulSchoolDraft(form, formStep) && !form.logoFile) return

    const handle = window.setTimeout(() => {
      void writeSchoolDraft({
        editingId: id,
        step: formStep,
        form,
      })
    }, 350)

    return () => window.clearTimeout(handle)
  }, [form, formStep, formReady, id])

  function setField<K extends keyof SchoolFormState>(
    key: K,
    value: SchoolFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function persistDraftAndLeave() {
    if (hasMeaningfulSchoolDraft(form, formStep) || form.logoFile) {
      void writeSchoolDraft({
        editingId: id,
        step: formStep,
        form,
      })
    }
    navigate(`/admin/schools/${id}`)
  }

  function onSave(e: FormEvent) {
    e.preventDefault()
    saveMutation.mutate({ editingId: id, form })
  }

  if (isPending || !formReady) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-64" />
        <GlassPanel strong className="w-full p-6">
          <Skeleton className="h-64 w-full" />
        </GlassPanel>
      </div>
    )
  }

  if (isError || !school) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/schools"
          className="text-sm font-semibold text-primary transition hover:text-primary-hover"
        >
          ← Back to schools
        </Link>
        <p className="text-sm text-red-600">School not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/admin/schools/${id}`}
          className="text-sm font-semibold text-primary transition hover:text-primary-hover"
        >
          ← Back to school
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
          Edit school
        </h1>
        <p className="mt-1.5 text-sm text-ink/55">{school.name}</p>
      </div>

      <GlassPanel strong className="w-full p-6">
        <SchoolFormStepper
          form={form}
          editing
          saving={saveMutation.isPending}
          resetKey={formSessionKey}
          initialStep={formStep}
          onStepChange={setFormStep}
          onChange={setField}
          onSubmit={onSave}
          onCancel={persistDraftAndLeave}
        />
      </GlassPanel>
    </div>
  )
}
