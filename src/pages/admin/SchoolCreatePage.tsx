import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  SCHOOL_CREATE_STEPS,
  SchoolFormStepper,
  schoolCreateFormStep,
} from '../../components/schools'
import { FormSection } from '../../components/schools/FormSection'
import { PlaceAutocompleteField } from '../../components/places/PlaceAutocompleteField'
import { FieldLabel, GlassPanel, TextInput } from '../../components/ui'
import type { SchoolFormState } from '../../interfaces/school.interface'
import {
  matchDistrictOption,
  matchStateOption,
} from '../../lib/locations'
import { dashboardKeys } from '../../lib/queries/dashboard'
import {
  fetchSchoolsByName,
  saveSchool,
  schoolsKeys,
} from '../../lib/queries/schools'
import type { PlaceDetails } from '../../lib/queries/places'
import {
  clearSchoolDraft,
  draftToFormState,
  hasMeaningfulSchoolDraft,
  readSchoolDraft,
  writeSchoolDraft,
} from '../../lib/schoolDraft'
import { emptySchoolForm } from '../../lib/schoolForm'
import {
  findMatchingCampus,
  formatSchoolLocation,
} from '../../lib/schoolLocation'
import type { SchoolListItem } from '../../lib/types'
import { toast } from '../../stores/useToastStore'

export function SchoolCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<SchoolFormState>(emptySchoolForm())
  const [formStep, setFormStep] = useState(0)
  const [formSessionKey, setFormSessionKey] = useState('new')
  const [nameMatches, setNameMatches] = useState<SchoolListItem[]>([])
  const [locationQuery, setLocationQuery] = useState('')
  const [locationWarning, setLocationWarning] = useState('')
  const skipDraftSaveRef = useRef(false)
  const draftRestoredRef = useRef(false)

  const invalidateSchoolQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: schoolsKeys.all }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
    ])
  }, [queryClient])

  const saveMutation = useMutation({
    mutationFn: saveSchool,
    onSuccess: async (school) => {
      clearSchoolDraft()
      toast.success('School created.')
      await invalidateSchoolQueries()
      navigate(`/admin/schools/${school.id}`)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    },
  })

  const refreshNameMatches = useCallback(async (name: string) => {
    const matches = await fetchSchoolsByName(name)
    setNameMatches(matches)
    return matches
  }, [])

  useEffect(() => {
    if (draftRestoredRef.current) return
    draftRestoredRef.current = true

    const draft = readSchoolDraft()
    if (!draft || draft.editingId) return

    void (async () => {
      try {
        skipDraftSaveRef.current = true
        const restored = await draftToFormState(draft)
        const safeStep = Math.min(
          Math.max(draft.step, 0),
          SCHOOL_CREATE_STEPS.length - 1,
        )
        setForm(restored)
        setFormStep(safeStep)
        setFormSessionKey(`draft-new-${draft.updatedAt}`)
        setLocationQuery(
          restored.fullAddress ||
            [restored.city, restored.district, restored.state]
              .filter(Boolean)
              .join(', '),
        )
        if (restored.name.trim()) {
          await refreshNameMatches(restored.name)
        }
        window.setTimeout(() => {
          skipDraftSaveRef.current = false
        }, 0)
      } catch {
        toast.error('Unable to restore the saved draft')
      }
    })()
  }, [refreshNameMatches])

  useEffect(() => {
    if (skipDraftSaveRef.current) return
    if (!hasMeaningfulSchoolDraft(form, formStep) && !form.logoFile) return

    const handle = window.setTimeout(() => {
      void writeSchoolDraft({
        editingId: null,
        step: formStep,
        form,
      })
    }, 350)

    return () => window.clearTimeout(handle)
  }, [form, formStep])

  useEffect(() => {
    if (nameMatches.length === 0) {
      setLocationWarning('')
      return
    }
    const match = findMatchingCampus(form, nameMatches)
    setLocationWarning(
      match
        ? 'A school with this name already exists at this location. You can still continue.'
        : '',
    )
  }, [form, nameMatches])

  function setField<K extends keyof SchoolFormState>(
    key: K,
    value: SchoolFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function applyPlaceToForm(details: PlaceDetails, venue: string) {
    const matchedState = matchStateOption(details.state)
    const matchedDistrict = matchedState
      ? matchDistrictOption(
          matchedState,
          details.district,
          details.city,
        )
      : ''
    const matchedCity = details.city?.trim() ?? ''

    setForm((prev) => ({
      ...prev,
      fullAddress: details.formattedAddress?.trim() || venue,
      state: matchedState || prev.state,
      district: matchedDistrict || prev.district,
      city: matchedCity || prev.city,
      pincode: details.pincode?.trim() || prev.pincode,
      latitude:
        details.latitude != null ? String(details.latitude) : prev.latitude,
      longitude:
        details.longitude != null ? String(details.longitude) : prev.longitude,
    }))
    setLocationQuery(venue)
  }

  async function handleBeforeNext(step: number): Promise<boolean> {
    if (step !== 0) return true
    try {
      await refreshNameMatches(form.name)
      return true
    } catch {
      toast.error('Could not check for existing schools. Try again.')
      return false
    }
  }

  function handleValidateWizardStep(step: number): string | null {
    if (step === 0 || step === 1) {
      if (step === 0 && !form.name.trim()) return 'School name is required.'
      if (step === 1) {
        const hasLocation =
          form.state.trim() ||
          form.city.trim() ||
          form.fullAddress.trim() ||
          locationQuery.trim()
        if (!hasLocation) {
          return 'Select or enter a location for this school.'
        }
      }
      return null
    }

    const mappedStep = schoolCreateFormStep(step)
    if (mappedStep === 0 && !form.code.trim()) {
      return 'School code is required.'
    }
    return null
  }

  function persistDraftAndLeave() {
    if (hasMeaningfulSchoolDraft(form, formStep) || form.logoFile) {
      void writeSchoolDraft({
        editingId: null,
        step: formStep,
        form,
      })
    }
    navigate('/admin/schools')
  }

  function onSave(e: FormEvent) {
    e.preventDefault()
    saveMutation.mutate({ editingId: null, form })
  }

  function renderCustomStep(step: number) {
    if (step === 0) {
      return (
        <FormSection title="School name">
          <div className="sm:col-span-2">
            <FieldLabel>School name</FieldLabel>
            <TextInput
              required
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Enter school name"
            />
            <p className="mt-1.5 text-xs text-ink/45">
              We will check if schools with this name already exist.
            </p>
          </div>
        </FormSection>
      )
    }

    if (step === 1) {
      return (
        <div className="space-y-4">
          {nameMatches.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">
                Existing campuses with this name
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-amber-900/90">
                {nameMatches.map((campus) => (
                  <li key={campus.id}>
                    {formatSchoolLocation(campus)}
                    {campus.code ? ` (${campus.code})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {locationWarning ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-900">
              {locationWarning}
            </p>
          ) : null}

          <FormSection title="Location">
            <div className="sm:col-span-2">
              <PlaceAutocompleteField
                label="Search location"
                required
                placeholder="Search school address or area…"
                value={locationQuery}
                onChange={setLocationQuery}
                onPlaceSelect={(result) =>
                  applyPlaceToForm(result.details, result.venue)
                }
                hint="Pick a place to auto-fill state, district, city, and pincode"
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Full address</FieldLabel>
              <TextInput
                value={form.fullAddress}
                onChange={(e) => setField('fullAddress', e.target.value)}
                placeholder="Street, area, city"
              />
            </div>
            <div>
              <FieldLabel>State</FieldLabel>
              <TextInput
                value={form.state}
                onChange={(e) => setField('state', e.target.value)}
                placeholder="State"
              />
            </div>
            <div>
              <FieldLabel>District</FieldLabel>
              <TextInput
                value={form.district}
                onChange={(e) => setField('district', e.target.value)}
                placeholder="District"
              />
            </div>
            <div>
              <FieldLabel>City</FieldLabel>
              <TextInput
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <FieldLabel>Pincode</FieldLabel>
              <TextInput
                value={form.pincode}
                onChange={(e) => setField('pincode', e.target.value)}
                placeholder="560001"
              />
            </div>
          </FormSection>
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/schools"
          className="text-sm font-semibold text-primary transition hover:text-primary-hover"
        >
          ← Back to schools
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
          Add school
        </h1>
        <p className="mt-1.5 text-sm text-ink/55">
          Register a new school profile step by step
        </p>
      </div>

      <GlassPanel strong className="w-full p-6">
        <SchoolFormStepper
          form={form}
          editing={false}
          saving={saveMutation.isPending}
          resetKey={formSessionKey}
          initialStep={formStep}
          steps={SCHOOL_CREATE_STEPS}
          renderCustomStep={renderCustomStep}
          formStepForWizardStep={schoolCreateFormStep}
          validateWizardStep={handleValidateWizardStep}
          onBeforeNext={handleBeforeNext}
          nameReadOnly
          onStepChange={setFormStep}
          onChange={setField}
          onSubmit={onSave}
          onCancel={persistDraftAndLeave}
        />
      </GlassPanel>
    </div>
  )
}
