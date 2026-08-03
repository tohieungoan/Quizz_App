const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

// Flag to avoid infinite token refreshing loop
let isRefreshing = false
let refreshQueue: Array<() => void> = []

// Automatically attach Authorization header if token exists
const buildHeaders = (extra?: Record<string, string>): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra }
  
  // If explicitly set to empty string, delete it (useful for FormData which needs to set its own Content-Type with boundaries)
  if (headers['Content-Type'] === '') {
    delete headers['Content-Type']
  }

  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

/**
 * Refresh access_token using refresh_token.
 */
const refreshAccessToken = async (): Promise<void> => {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) throw new Error('No refresh token available')

  const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) throw new Error('Refresh token expired or revoked')

  const data = await res.json()
  localStorage.setItem('token', data.access_token)
  localStorage.setItem('refresh_token', data.refresh_token)
}

/**
 * Perform fetch with automatic retry after refreshing access_token if 401 Unauthorized is received.
 * Uses a queue so that concurrent requests do not trigger multiple refresh operations.
 */
const fetchWithAuth = async (url: string, init: RequestInit): Promise<Response> => {
  const res = await fetch(url, { ...init, headers: buildHeaders(init.headers as Record<string, string>) })

  if (res.status !== 401) return res

  // Received 401 — try refreshing the token once
  if (!isRefreshing) {
    isRefreshing = true
    try {
      await refreshAccessToken()
      // Notify all pending requests in queue
      refreshQueue.forEach((cb) => cb())
      refreshQueue = []
    } catch {
      refreshQueue = []
      // Refresh failed — force log out
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      throw new Error('Session expired. Redirecting to login...')
    } finally {
      isRefreshing = false
    }
  }

  // Wait for refresh to complete, then retry with the new token
  await new Promise<void>((resolve) => {
    refreshQueue.push(resolve)
  })

  // Retry with the new token
  return fetch(url, { ...init, headers: buildHeaders(init.headers as Record<string, string>) })
}

export class ApiError extends Error {
  public fieldErrors?: Record<string, string>;
  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.fieldErrors = fieldErrors;
  }
}

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    let errorMsg = `HTTP error ${res.status}`
    let fieldErrors: Record<string, string> | undefined;

    if (Array.isArray(error.detail)) {
      fieldErrors = {};
      error.detail.forEach((e: any) => {
        const fieldName = e.loc[e.loc.length - 1];
        fieldErrors![fieldName] = e.msg;
      });
      errorMsg = "Please check the highlighted fields for errors.";
    } else if (error.detail) {
      errorMsg = typeof error.detail === 'string' 
        ? error.detail 
        : JSON.stringify(error.detail);
    } else if (error.message) {
      errorMsg = error.message;
    }

    throw new ApiError(errorMsg, fieldErrors);
  }
  return res.json()
}

export const apiClient = {
  get: <T = unknown>(endpoint: string, extraHeaders?: Record<string, string>): Promise<T> =>
    fetchWithAuth(`${BASE_URL}${endpoint}`, { method: 'GET', headers: extraHeaders })
      .then(handleResponse<T>),

  post: <T = unknown>(
    endpoint: string,
    body: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<T> =>
    fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: extraHeaders,
      body: JSON.stringify(body),
    }).then(handleResponse<T>),

  postMultipart: <T = unknown>(
    endpoint: string,
    body: FormData
  ): Promise<T> =>
    fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': '' }, // Empty string tells buildHeaders to delete it
      body: body,
    }).then(handleResponse<T>),

  /** Reserved for form-urlencoded (OAuth2 login) — authorization header not needed */
  postForm: <T = unknown>(endpoint: string, params: URLSearchParams): Promise<T> =>
    fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    }).then(handleResponse<T>),

  put: <T = unknown>(
    endpoint: string,
    body: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<T> =>
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
    fetchWithAuth(`${BASE_URL}${endpoint}`, { method: 'DELETE' })
      .then(handleResponse<T>),
}