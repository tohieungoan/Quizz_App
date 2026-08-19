const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

let refreshPromise: Promise<void> | null = null

const buildHeaders = (extra?: Record<string, string>): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra }
  if (headers['Content-Type'] === '') delete headers['Content-Type']

  const token = localStorage.getItem('token')
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

const refreshAccessToken = async (): Promise<void> => {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) throw new Error('No refresh token available')

  const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!response.ok) throw new Error('Refresh token expired or revoked')

  const data = await response.json()
  localStorage.setItem('token', data.access_token)
  localStorage.setItem('refresh_token', data.refresh_token)
}

const clearSession = (): void => {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

/** Retry one time after a shared token refresh; concurrent 401s cannot deadlock. */
const fetchWithAuth = async (url: string, init: RequestInit): Promise<Response> => {
  const request = () => fetch(url, {
    ...init,
    headers: buildHeaders(init.headers as Record<string, string>),
  })

  const response = await request()
  if (response.status !== 401) return response

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }

  try {
    await refreshPromise
  } catch {
    clearSession()
    window.location.href = '/login'
    throw new Error('Session expired. Redirecting to login...')
  }
  return request()
}

export class ApiError extends Error {
  public fieldErrors?: Record<string, string>
  public status: number
  public code?: string
  public details?: unknown

  constructor(
    message: string,
    status: number,
    fieldErrors?: Record<string, string>,
    code?: string,
    details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.code = code
    this.details = details
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    let message = `HTTP error ${response.status}`
    let fieldErrors: Record<string, string> | undefined

    if (Array.isArray(error.detail)) {
      fieldErrors = {}
      error.detail.forEach((item: any) => {
        const fieldName = item.loc[item.loc.length - 1]
        fieldErrors![fieldName] = item.msg
      })
      message = 'Please check the highlighted fields for errors.'
    } else if (error.detail) {
      message = typeof error.detail === 'string'
        ? error.detail
        : error.detail.message || JSON.stringify(error.detail)
    } else if (error.message) {
      message = error.message
    }

    throw new ApiError(
      message,
      response.status,
      fieldErrors,
      error.detail?.code,
      error.detail,
    )
  }
  if (response.status === 204) return undefined as T
  return response.json()
}

export const apiClient = {
  get: <T = unknown>(endpoint: string, extraHeaders?: Record<string, string>): Promise<T> =>
    fetchWithAuth(`${BASE_URL}${endpoint}`, { method: 'GET', headers: extraHeaders })
      .then(handleResponse<T>),

  post: <T = unknown>(endpoint: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<T> =>
    fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: extraHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse<T>),

  postMultipart: <T = unknown>(endpoint: string, body: FormData, config?: RequestInit): Promise<T> =>
    fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': '' },
      body,
      ...config,
    }).then(handleResponse<T>),

  postForm: <T = unknown>(endpoint: string, params: URLSearchParams): Promise<T> =>
    fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    }).then(handleResponse<T>),

  put: <T = unknown>(endpoint: string, body: unknown, extraHeaders?: Record<string, string>): Promise<T> =>
    fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: extraHeaders,
      body: JSON.stringify(body),
    }).then(handleResponse<T>),

  patch: <T = unknown>(endpoint: string, body: unknown): Promise<T> =>
    fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then(handleResponse<T>),

  delete: <T = unknown>(endpoint: string): Promise<T> =>
    fetchWithAuth(`${BASE_URL}${endpoint}`, { method: 'DELETE' }).then(handleResponse<T>),
}
