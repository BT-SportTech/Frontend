import type { SchoolFormState } from '../interfaces/school.interface'
import { emptySchoolForm } from './schoolForm'

const DRAFT_KEY = 'Sportech_school_form_draft'

export interface SchoolFormDraft {
  editingId: string | null
  step: number
  form: Omit<SchoolFormState, 'logoFile'>
  logoDraftDataUrl?: string
  logoFileName?: string
  updatedAt: string
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return new File([blob], fileName, { type: blob.type || 'image/png' })
}

export function hasMeaningfulSchoolDraft(
  form: SchoolFormState,
  step: number,
): boolean {
  if (step > 0) return true
  if (form.logoFile || form.logoUrl.trim()) return true

  const empty = emptySchoolForm()
  return (Object.keys(empty) as (keyof SchoolFormState)[]).some((key) => {
    if (key === 'logoFile' || key === 'type') return false
    const value = form[key]
    const baseline = empty[key]
    return value !== baseline
  })
}

export function readSchoolDraft(): SchoolFormDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SchoolFormDraft
  } catch {
    return null
  }
}

export async function writeSchoolDraft(input: {
  editingId: string | null
  step: number
  form: SchoolFormState
}): Promise<void> {
  const { logoFile, ...rest } = input.form
  const draft: SchoolFormDraft = {
    editingId: input.editingId,
    step: input.step,
    form: rest,
    updatedAt: new Date().toISOString(),
  }

  if (logoFile) {
    draft.logoDraftDataUrl = await fileToDataUrl(logoFile)
    draft.logoFileName = logoFile.name
  }

  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

export function clearSchoolDraft(): void {
  localStorage.removeItem(DRAFT_KEY)
}

export async function draftToFormState(
  draft: SchoolFormDraft,
): Promise<SchoolFormState> {
  const form: SchoolFormState = {
    ...emptySchoolForm(),
    ...draft.form,
    logoFile: null,
  }

  if (draft.logoDraftDataUrl) {
    form.logoFile = await dataUrlToFile(
      draft.logoDraftDataUrl,
      draft.logoFileName ?? 'school-logo.png',
    )
  }

  return form
}
