import { useEffect, useState, type FormEvent } from 'react'
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

interface SchoolFormStepperProps {
  form: SchoolFormState
  editing: boolean
  saving: boolean
  resetKey: string
  initialStep?: number
  onStepChange?: (step: number) => void
  onChange: <K extends keyof SchoolFormState>(
    key: K,
    value: SchoolFormState[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function SchoolFormStepper({
  form,
  editing,
  saving,
  resetKey,
  initialStep = 0,
  onStepChange,
  onChange,
  onSubmit,
  onCancel,
}: SchoolFormStepperProps) {
  const [step, setStep] = useState(initialStep)
  const [stepError, setStepError] = useState('')

  useEffect(() => {
    setStep(initialStep)
    setStepError('')
  }, [resetKey, initialStep])

  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])

  const isFirstStep = step === 0
  const isLastStep = step === SCHOOL_FORM_STEPS.length - 1

  function validateStep(currentStep: number): boolean {
    if (currentStep === 0) {
      if (!form.name.trim()) {
        setStepError('School name is required.')
        return false
      }
      if (!form.code.trim()) {
        setStepError('School code is required.')
        return false
      }
    }
    setStepError('')
    return true
  }

  function goNext() {
    if (!validateStep(step)) return
    setStep((current) => Math.min(current + 1, SCHOOL_FORM_STEPS.length - 1))
  }

  function goBack() {
    setStepError('')
    setStep((current) => Math.max(current - 1, 0))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateStep(step)) return
    if (!isLastStep) {
      goNext()
      return
    }
    onSubmit(event)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Stepper steps={SCHOOL_FORM_STEPS} currentStep={step} />

      {stepError ? (
        <p className="rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {stepError}
        </p>
      ) : null}

      <SchoolForm
        step={step}
        form={form}
        editing={editing}
        onChange={onChange}
      />

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
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save school'}
            </Button>
          ) : (
            <Button type="submit">Next</Button>
          )}
        </div>
      </div>
    </form>
  )
}
