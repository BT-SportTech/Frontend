const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export function getApiBaseUrl() {
  return API_BASE
}

export function resolveAssetUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:'))
    return url
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`
}

const ACCESS_KEY = 'sporttech_access_token'
const REFRESH_KEY = 'sporttech_refresh_token'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  auth?: boolean
  skipRefresh?: boolean
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const data = (await res.json()) as {
      accessToken: string
      refreshToken: string
    }
    setTokens(data.accessToken, data.refreshToken)
    return true
  } catch {
    return false
  }
}

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, skipRefresh = false, headers, ...rest } = options

  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  }

  if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = getAccessToken()
    if (token) finalHeaders.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && auth && !skipRefresh) {
    if (!refreshPromise) {
      refreshPromise = tryRefresh().finally(() => {
        refreshPromise = null
      })
    }
    const ok = await refreshPromise
    if (ok) {
      return api<T>(path, { ...options, skipRefresh: true })
    }
    clearTokens()
    throw new Error('Session expired. Please sign in again.')
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const err = (await res.json()) as { message?: string | string[] }
      if (Array.isArray(err.message)) message = err.message.join(', ')
      else if (err.message) message = err.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function uploadSchoolLogo(
  file: File,
): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const token = getAccessToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/schools/upload-logo`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (res.status === 401) {
    const ok = await tryRefresh()
    if (ok) return uploadSchoolLogo(file)
    clearTokens()
    throw new Error('Session expired. Please sign in again.')
  }

  if (!res.ok) {
    let message = `Upload failed (${res.status})`
    try {
      const err = (await res.json()) as { message?: string | string[] }
      if (Array.isArray(err.message)) message = err.message.join(', ')
      else if (err.message) message = err.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  return (await res.json()) as { url: string }
}
