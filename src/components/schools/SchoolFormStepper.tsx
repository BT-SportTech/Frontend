import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { SchoolFormState } from '../../interfaces/school.interface'
import { Button } from '../ui'
import { Stepper, type StepperItem } from '../ui/Stepper'
import { SchoolForm } from './SchoolForm'

export const SCHOOL_FORM_STEPS: StepperItem[] = [
  { id: 'basic', label: 'Basic info' },
  { id: 'location', label: 'Location' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'students', label: 'Students' },
]

export const SCHOOL_CREATE_STEPS: StepperItem[] = [
  { id: 'name', label: 'School name' },
  { id: 'location', label: 'Location' },
  { id: 'basic', label: 'Basic info' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'students', label: 'Students' },
]

export function schoolCreateFormStep(wizardStep: number): number | null {
  const map: Record<number, number> = {
    2: 0,
    3: 2,
    4: 3,
    5: 4,
  }
  return map[wizardStep] ?? null
}

interface SchoolFormStepperProps {
  form: SchoolFormState
  editing: boolean
  saving: boolean
  resetKey: string
  initialStep?: number
  steps?: StepperItem[]
  renderCustomStep?: (step: number) => ReactNode | null
  formStepForWizardStep?: (step: number) => number | null
  validateWizardStep?: (step: number) => string | null
  nameReadOnly?: boolean
  onStepChange?: (step: number) => void
  onChange: <K extends keyof SchoolFormState>(
    key: K,
    value: SchoolFormState[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  onBeforeNext?: (step: number) => boolean | Promise<boolean>
}

function defaultValidateStep(
  _currentStep: number,
  form: SchoolFormState,
  formStep: number,
): string | null {
  if (formStep === 0) {
    if (!form.name.trim()) return 'School name is required.'
    if (!form.code.trim()) return 'School code is required.'
  }
  return null
}

export function SchoolFormStepper({
  form,
  editing,
  saving,
  resetKey,
  initialStep = 0,
  steps = SCHOOL_FORM_STEPS,
  renderCustomStep,
  formStepForWizardStep,
  validateWizardStep,
  nameReadOnly = false,
  onStepChange,
  onChange,
  onSubmit,
  onCancel,
  onBeforeNext,
}: SchoolFormStepperProps) {
  const [step, setStep] = useState(initialStep)
  const [stepError, setStepError] = useState('')
  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    setStep(initialStep)
    setStepError('')
  }, [resetKey, initialStep])

  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])

  const isFirstStep = step === 0
  const isLastStep = step === steps.length - 1

  function resolveFormStep(wizardStep: number): number {
    if (formStepForWizardStep) {
      const mapped = formStepForWizardStep(wizardStep)
      return mapped ?? wizardStep
    }
    return wizardStep
  }

  function validateStep(currentStep: number): boolean {
    const error =
      validateWizardStep?.(currentStep) ??
      defaultValidateStep(currentStep, form, resolveFormStep(currentStep))
    if (error) {
      setStepError(error)
      return false
    }
    setStepError('')
    return true
  }

  async function goNext() {
    if (!validateStep(step)) return
    if (onBeforeNext) {
      setAdvancing(true)
      try {
        const allowed = await onBeforeNext(step)
        if (!allowed) return
      } finally {
        setAdvancing(false)
      }
    }
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  function goBack() {
    setStepError('')
    setStep((current) => Math.max(current - 1, 0))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateStep(step)) return
    if (!isLastStep) {
      await goNext()
      return
    }
    onSubmit(event)
  }

  const customContent = renderCustomStep?.(step)
  const mappedFormStep = formStepForWizardStep?.(step)
  const showSchoolForm =
    customContent == null &&
    (formStepForWizardStep ? mappedFormStep != null : true)

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <Stepper steps={steps} currentStep={step} />

      {stepError ? (
        <p className="rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {stepError}
        </p>
      ) : null}

      {customContent}
      {showSchoolForm ? (
        <SchoolForm
          step={mappedFormStep ?? step}
          form={form}
          editing={editing}
          nameReadOnly={nameReadOnly}
          onChange={onChange}
        />
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-line/70 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {!isFirstStep ? (
            <Button type="button" variant="ghost" onClick={goBack}>
              Back
            </Button>
          ) : null}
          {isLastStep ? (
            <Button type="submit" disabled={saving || advancing}>
              {saving ? 'Saving…' : 'Save school'}
            </Button>
          ) : (
            <Button type="submit" disabled={advancing}>
              {advancing ? 'Checking…' : 'Next'}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
