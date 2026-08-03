import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LoginFieldErrors, LoginFormValues } from '../interfaces'
import { loginSchema, parseLoginFieldErrors } from '../schemas/login.schema'
import { useAuthStore } from '../stores/useAuthStore'

const initialValues: LoginFormValues = {
  email: '',
  password: '',
}

export function useLoginForm() {
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const [values, setValues] = useState<LoginFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  function setField(field: keyof LoginFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    setSubmitError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError('')
    setFieldErrors({})

    const result = loginSchema.safeParse(values)
    if (!result.success) {
      setFieldErrors(parseLoginFieldErrors(result.error))
      return
    }

    setLoading(true)
    try {
      await login(result.data.email.trim(), result.data.password)
      const role = useAuthStore.getState().user?.role
      navigate(role === 'ORGANIZER' ? '/organizer' : '/admin', { replace: true })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return {
    values,
    fieldErrors,
    submitError,
    loading,
    setField,
    handleSubmit,
  }
}
