import { useEffect, useRef, useState } from 'react'


export type AdminRoomsConnectionState = 'connecting' | 'connected' | 'fallback' | 'offline'

export interface AdminRoomEvent {
  type: 'ROOMS_INVALIDATED'
  room_id: number
  room_code?: string | null
  reason: string
  reasons?: string[]
  emitted_at?: string
}

interface UseAdminRoomsRealtimeOptions {
  enabled?: boolean
  fallbackIntervalMs?: number
  onInvalidate: (event: AdminRoomEvent | null) => void
}

const buildAdminRoomsWebSocketUrl = (): string => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
    || import.meta.env.VITE_API_URL
    || 'http://localhost:8000/api/v1'
  const url = new URL(apiBaseUrl, window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = `${url.pathname.replace(/\/$/, '').replace(/\/api\/v1$/, '')}/api/v1/ws/admin/rooms`
  return url.toString()
}

export const useAdminRoomsRealtime = ({
  enabled = true,
  fallbackIntervalMs = 15_000,
  onInvalidate,
}: UseAdminRoomsRealtimeOptions): AdminRoomsConnectionState => {
  const callbackRef = useRef(onInvalidate)
  const [connectionState, setConnectionState] = useState<AdminRoomsConnectionState>('connecting')

  useEffect(() => {
    callbackRef.current = onInvalidate
  }, [onInvalidate])

  useEffect(() => {
    if (!enabled) return

    const token = localStorage.getItem('token')
    if (!token) {
      setConnectionState('offline')
      return
    }

    let disposed = false
    let socket: WebSocket | null = null
    let reconnectAttempt = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let fallbackTimer: ReturnType<typeof setInterval> | null = null
    let reconciliationTimer: ReturnType<typeof setInterval> | null = null
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null
    let connectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null
    let latestEvent: AdminRoomEvent | null = null

    const stopTimer = (timer: ReturnType<typeof setTimeout> | null) => {
      if (timer) clearTimeout(timer)
    }

    const stopFallback = () => {
      if (fallbackTimer) clearInterval(fallbackTimer)
      fallbackTimer = null
    }

    const startFallback = () => {
      if (fallbackTimer || disposed) return
      setConnectionState(navigator.onLine ? 'fallback' : 'offline')
      fallbackTimer = setInterval(() => {
        if (navigator.onLine && document.visibilityState === 'visible') {
          callbackRef.current(null)
        }
      }, fallbackIntervalMs)
    }

    const queueInvalidation = (event: AdminRoomEvent) => {
      latestEvent = event
      if (invalidateTimer) return
      invalidateTimer = setTimeout(() => {
        invalidateTimer = null
        callbackRef.current(latestEvent)
        latestEvent = null
      }, 250)
    }

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer || !navigator.onLine) return
      const baseDelay = Math.min(30_000, 1_000 * 2 ** reconnectAttempt)
      const jitteredDelay = Math.round(baseDelay * (0.8 + Math.random() * 0.4))
      reconnectAttempt += 1
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        connect()
      }, jitteredDelay)
    }

    const connect = () => {
      if (disposed || !navigator.onLine) {
        startFallback()
        return
      }
      if (
        socket
        && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)
      ) return

      setConnectionState('connecting')
      try {
        socket = new WebSocket(buildAdminRoomsWebSocketUrl(), ['bearer', token])
      } catch {
        socket = null
        startFallback()
        scheduleReconnect()
        return
      }
      connectionTimeoutTimer = setTimeout(() => {
        if (socket?.readyState === WebSocket.CONNECTING) socket.close()
      }, 10_000)

      socket.onopen = () => {
        stopTimer(connectionTimeoutTimer)
        connectionTimeoutTimer = null
        reconnectAttempt = 0
        stopFallback()
        setConnectionState('connected')
        heartbeatTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'PING' }))
          }
        }, 25_000)
      }

      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as Partial<AdminRoomEvent>
          if (event.type === 'ROOMS_INVALIDATED' && typeof event.room_id === 'number') {
            queueInvalidation(event as AdminRoomEvent)
          }
        } catch {
          // Ignore malformed or unrelated server messages without breaking the stream.
        }
      }

      socket.onerror = () => socket?.close()
      socket.onclose = () => {
        stopTimer(connectionTimeoutTimer)
        connectionTimeoutTimer = null
        if (heartbeatTimer) clearInterval(heartbeatTimer)
        heartbeatTimer = null
        socket = null
        if (!disposed) {
          startFallback()
          scheduleReconnect()
        }
      }
    }

    const handleOnline = () => {
      stopFallback()
      connect()
      callbackRef.current(null)
    }
    const handleOffline = () => {
      setConnectionState('offline')
      socket?.close()
      startFallback()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') callbackRef.current(null)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    reconciliationTimer = setInterval(() => {
      if (navigator.onLine && document.visibilityState === 'visible') {
        callbackRef.current(null)
      }
    }, 60_000)
    connect()

    return () => {
      disposed = true
      socket?.close()
      stopTimer(reconnectTimer)
      stopTimer(invalidateTimer)
      stopTimer(connectionTimeoutTimer)
      if (heartbeatTimer) clearInterval(heartbeatTimer)
      if (reconciliationTimer) clearInterval(reconciliationTimer)
      stopFallback()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, fallbackIntervalMs])

  return connectionState
}
