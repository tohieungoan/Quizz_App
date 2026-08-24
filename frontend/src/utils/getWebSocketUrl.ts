/**
 * Helper to build safe WebSocket URLs regardless of environment (HTTPS vs HTTP, relative vs absolute API URL).
 */
export const getWebSocketUrl = (path: string): string => {
  const wsProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const envUrl = import.meta.env.VITE_API_BASE_URL

  let host = typeof window !== 'undefined' ? window.location.host : 'localhost:8000'

  if (envUrl && envUrl.startsWith('http')) {
    host = envUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${wsProtocol}//${host}${cleanPath}`
}
