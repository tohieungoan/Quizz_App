import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { roomService } from '@/services'
import { getPlayerBadge, getBadgeStyle } from '@/utils/badgeHelper'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Player {
  id: string
  name: string
  initials: string
  avatarBg: string
  avatarText: string
  isMe?: boolean
  animDelay?: number
  equipped_title?: string | null
}

interface HostMember {
  nickname: string
  equipped_title?: string | null
}

// ─── Constants ───────────────────────────────────────────────────────────────
const AVATAR_COLORS: { bg: string; text: string }[] = [
  { bg: 'bg-secondary-fixed-dim', text: 'text-on-secondary-fixed' },
  { bg: 'bg-tertiary-fixed-dim', text: 'text-on-tertiary-fixed' },
  { bg: 'bg-primary-fixed-dim', text: 'text-on-primary-fixed-variant' },
  { bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
  { bg: 'bg-surface-container-highest', text: 'text-on-surface-variant' },
  { bg: 'bg-on-primary-container', text: 'text-primary' },
  { bg: 'bg-tertiary-container', text: 'text-on-tertiary-container' },
  { bg: 'bg-error-container', text: 'text-on-error-container' },
]


const GRADIENTS = [
  'from-primary/20 to-secondary/20',
  'from-secondary/20 to-tertiary/20',
  'from-primary/20 to-error/20',
  'from-tertiary/20 to-primary/20',
  'from-secondary/20 to-primary/20',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getInitials = (name: string): string => {
  if (!name) return '??'
  const parts = String(name).trim().split(/[\s_]+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return String(name).slice(0, 2).toUpperCase()
}

const getAvatarColor = (id: string) => {
  const index = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

const formatRoomCode = (code: string): string => {
  if (code.length <= 3) return code
  return code.slice(0, 3) + ' ' + code.slice(3)
}

// ─── Component ───────────────────────────────────────────────────────────────
export const LobbyWaiting: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const state = location.state as { roomCode?: string; nickname?: string; isHost?: boolean; fromSource?: 'landing' | 'dashboard'; activeTab?: string; roomId?: number; participantId?: number; quizTitle?: string; progressionMode?: string; allowShowRank?: boolean } | null
  
  const queryParams = new URLSearchParams(location.search)
  const urlRoomCode = queryParams.get('roomCode')

  const [roomCode, setRoomCode] = useState(state?.roomCode || urlRoomCode || '')
  const [nickname, setNickname] = useState(() => {
    if (state?.nickname) return state.nickname
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        const u = JSON.parse(stored)
        if (u && (u.fullname || u.name)) return u.fullname || u.name
      } catch (e) {
        console.error(e)
      }
    }
    // For unauthenticated guest accounts, generate a unique Guest nickname per session
    let guestId = sessionStorage.getItem('guest_nickname')
    if (!guestId) {
      const randomNum = Math.floor(1000 + Math.random() * 9000)
      guestId = `Guest_${randomNum}`
      sessionStorage.setItem('guest_nickname', guestId)
    }
    return guestId
  })
  
  const [roomId, setRoomId] = useState(state?.roomId || 0)
  const [participantId, setParticipantId] = useState(state?.participantId || 0)
  const [isJoiningRoom, setIsJoiningRoom] = useState(false)

  const isHost = !!state?.isHost
  const fromSource = state?.fromSource || (localStorage.getItem('token') ? 'dashboard' : 'landing')
  const activeTab = state?.activeTab || sessionStorage.getItem('dashboard_active_tab') || 'join_room'

  // Common lobby states
  const [players, setPlayers] = useState<Player[]>([])
  const [copied, setCopied] = useState(false)

  // Host specific states
  const [countdown, setCountdown] = useState(900) // 15 minutes (900 seconds)
  const [showAllMembers, setShowAllMembers] = useState(false)
  const [hostMembers, setHostMembers] = useState<HostMember[]>([])
  const [createdAt, setCreatedAt] = useState<string>('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>((location.state as any)?.qrCodeUrl || '')

  // 1. Fetch room details to get status, created_at, and qr_code_url
  useEffect(() => {
    if (!roomCode) return
    roomService.getRoom(roomCode)
      .then((res) => {
        if (res.status === 'PLAYING' && !isHost) {
          navigate('/play', {
            state: {
              nickname,
              roomCode,
              roomId: res.id,
              participantId,
              mode: res.mode,
              score: 0,
              streak: 0,
              questionNumber: res.current_question_index || 1,
              fromSource,
              activeTab
            }
          })
          return
        }
        if (res.id) {
          setRoomId(res.id)
        }
        if (res.created_at) {
          setCreatedAt(res.created_at)
        }
        if (res.qr_code_url) {
          setQrCodeUrl(res.qr_code_url)
        }
      })
      .catch((err) => {
        console.error("Failed to load room details:", err)
      })
  }, [roomCode, isHost, nickname, participantId, fromSource, activeTab, navigate])

  // Countdown timer based on actual created_at
  useEffect(() => {
    if (!createdAt) return

    const updateTimer = () => {
      const utcStr = createdAt.endsWith('Z') ? createdAt : createdAt + 'Z'
      const createdMs = new Date(utcStr).getTime()
      const elapsedSeconds = Math.floor((Date.now() - createdMs) / 1000)
      const remaining = 900 - elapsedSeconds // 15 minutes

      if (remaining <= 0) {
        setCountdown(0)
        if (!isHost) {
          alert("The lobby has expired because the host did not start the quiz in 15 minutes.")
          navigate('/')
        } else {
          const targetRoomId = roomId || state?.roomId
          if (targetRoomId) {
            roomService.endRoom(targetRoomId).catch(() => {})
          }
          alert("The lobby has expired (15-minute start limit reached).")
          navigate('/dashboard')
        }
      } else {
        setCountdown(remaining)
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [createdAt, isHost, roomId, state?.roomId, navigate])

  // 2. If user came via direct URL (location.search has roomCode), perform joinRoom safely
  const hasAttemptedJoin = useRef(false)
  useEffect(() => {
    if (isHost) return
    if (urlRoomCode && !participantId && !isJoiningRoom && !hasAttemptedJoin.current) {
      hasAttemptedJoin.current = true
      setIsJoiningRoom(true)

      const doJoin = async (attemptsLeft = 2) => {
        try {
          const res = await roomService.joinRoom(urlRoomCode, nickname)
          setRoomId(res.room_id)
          setParticipantId(res.id)
          setIsJoiningRoom(false)
        } catch (err: any) {
          if (attemptsLeft > 1) {
            // Retry once after 500ms in case of initial network/auth setup delay
            setTimeout(() => doJoin(attemptsLeft - 1), 500)
          } else {
            setIsJoiningRoom(false)
            hasAttemptedJoin.current = false
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to join room'
            alert(`Join Error: ${errorMsg}`)
            navigate(localStorage.getItem('token') ? '/dashboard' : '/')
          }
        }
      }

      doJoin()
    }
  }, [urlRoomCode, participantId, isHost, nickname, navigate, isJoiningRoom])

  // Fetch initial participants roster once when room is resolved
  useEffect(() => {
    const targetRoomId = roomId || state?.roomId
    if (!targetRoomId) return

    const fetchInitialParticipants = async () => {
      try {
        const res = await roomService.getParticipants(targetRoomId)
        if (isHost) {
          setHostMembers(res.map((p: any): HostMember => ({
            nickname: p.nickname || 'Guest',
            equipped_title: p.equipped_title ?? null,
          })))
        } else {
          const mapped: Player[] = res.map((p: any): Player => {
            const nick = p.nickname || 'Guest'
            const isMe = nick === nickname
            const color = getAvatarColor(String(p.id) + nick)
            return {
              id: String(p.id),
              name: nick,
              initials: getInitials(nick),
              avatarBg: isMe ? 'bg-primary' : color.bg,
              avatarText: isMe ? 'text-on-primary' : color.text,
              isMe,
              equipped_title: p.equipped_title ?? null,
            }
          })
          setPlayers(mapped)
        }
      } catch (err) {
        console.error("Failed to fetch initial room participants:", err)
      }
    }

    fetchInitialParticipants()
  }, [roomId, state?.roomId, isHost, nickname])

  // WebSocket real-time synchronization hook for participant roster and state sync
  useEffect(() => {
    const isReadyToConnect = isHost ? (roomId > 0) : (participantId > 0)
    if (!roomCode || !isReadyToConnect) return

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
    const apiHost = baseUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1\/?$/, '')
    const token = localStorage.getItem('token')
    const wsUrl = `${wsProtocol}//${apiHost}/api/v1/ws/rooms/${roomCode}?nickname=${encodeURIComponent(nickname)}&isHost=${isHost}${token ? `&token=${token}` : ''}`

    let socket: WebSocket | null = null
    let pingTimer: any = null
    let reconnectTimer: any = null
    let isDisposed = false
    let reconnectAttempt = 0

    const connectWebSocket = () => {
      if (isDisposed) return
      try {
        socket = new WebSocket(wsUrl)

        socket.onopen = () => {
          console.log(`WebSocket connection opened for room: ${roomCode}`)
          reconnectAttempt = 0
          
          // Re-verify room status on reconnect: if already PLAYING, redirect!
          if (!isHost) {
            roomService.getRoom(roomCode)
              .then((res) => {
                if (res.status === 'PLAYING') {
                  navigate('/play', {
                    state: {
                      nickname,
                      roomCode,
                      roomId: res.id,
                      participantId: participantId || state?.participantId,
                      mode: res.mode,
                      score: 0,
                      streak: 0,
                      questionNumber: res.current_question_index || 1,
                      fromSource,
                      activeTab
                    }
                  })
                }
              })
              .catch((err) => console.error("Error checking room status on WS open:", err))
          }

          // Periodic PING to keep connection alive
          pingTimer = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: "PING" }))
            }
          }, 5000)
        }

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            const msgType = data.t || data.type
            if (msgType === "PONG" || msgType === "PO") return

            if (msgType === "PLAYER_JOINED" || msgType === "PJ" || msgType === "PLAYER_LEFT" || msgType === "PL") {
              // 1. Immediate UI roster update from WebSocket payload array if available
              const activePlayersList = data.p || data.players
              if (Array.isArray(activePlayersList)) {
                if (isHost) {
                  setHostMembers(activePlayersList.map((pName: string): HostMember => ({
                    nickname: pName,
                    equipped_title: null
                  })))
                } else {
                  const mapped: Player[] = data.players.map((pName: string, idx: number): Player => {
                    const isMe = pName === nickname
                    const color = getAvatarColor(String(idx) + pName)
                    return {
                      id: String(idx),
                      name: pName,
                      initials: getInitials(pName),
                      avatarBg: isMe ? 'bg-primary' : color.bg,
                      avatarText: isMe ? 'text-on-primary' : color.text,
                      isMe,
                    }
                  })
                  setPlayers(mapped)
                }
              }

              // 2. Re-fetch full participant details (with equipped titles) from API
              const targetRoomId = roomId || state?.roomId
              if (targetRoomId) {
                roomService.getParticipants(targetRoomId)
                  .then((res: any[]) => {
                    if (isHost) {
                      setHostMembers(res.map((p: any): HostMember => ({
                        nickname: p.nickname || 'Guest',
                        equipped_title: p.equipped_title ?? null,
                      })))
                    } else {
                      const mapped: Player[] = res.map((p: any): Player => {
                        const nick = p.nickname || 'Guest'
                        const isMe = nick === nickname
                        const color = getAvatarColor(String(p.id) + nick)
                        return {
                          id: String(p.id),
                          name: nick,
                          initials: getInitials(nick),
                          avatarBg: isMe ? 'bg-primary' : color.bg,
                          avatarText: isMe ? 'text-on-primary' : color.text,
                          isMe,
                          equipped_title: p.equipped_title ?? null,
                        }
                      })
                      setPlayers(mapped)
                    }
                  })
                  .catch((err: any) => console.error("Failed to refresh participants:", err))
              }
            } else if (data.type === "GAME_STARTED") {
              if (!isHost) {
                navigate('/play', {
                  state: {
                    nickname,
                    roomCode,
                    roomId: roomId || state?.roomId,
                    participantId: participantId || state?.participantId,
                    mode: (state as any)?.mode,
                    score: 0,
                    streak: 0,
                    questionNumber: 1,
                    fromSource,
                    activeTab
                  }
                })
              }
            } else if (data.type === "GAME_ENDED") {
              alert("The session has been ended by host.")
              navigate(localStorage.getItem('token') ? '/dashboard' : '/')
            } else if (data.type === "ERROR") {
              alert(data.message || "An error occurred in room connection.")
              navigate(localStorage.getItem('token') ? '/dashboard' : '/')
            }
          } catch (e) {
            console.error("Error parsing WebSocket message:", e)
          }
        }

        socket.onclose = (event) => {
          console.log("WebSocket connection closed", event)
          if (pingTimer) clearInterval(pingTimer)
          if (!isDisposed) {
            const delay = reconnectAttempt === 0 ? 300 : Math.min(500 * Math.pow(1.5, reconnectAttempt) + Math.random() * 300, 5000)
            reconnectAttempt += 1
            reconnectTimer = setTimeout(connectWebSocket, delay)
          }
        }

        socket.onerror = (error) => {
          console.error("WebSocket connection error:", error)
          if (socket) socket.close()
        }
      } catch (err) {
        console.error("Failed to establish WebSocket room connection:", err)
        if (!isDisposed) {
          const delay = reconnectAttempt === 0 ? 300 : Math.min(500 * Math.pow(1.5, reconnectAttempt) + Math.random() * 300, 5000)
          reconnectAttempt += 1
          reconnectTimer = setTimeout(connectWebSocket, delay)
        }
      }
    }

    connectWebSocket()

    return () => {
      isDisposed = true
      if (pingTimer) clearInterval(pingTimer)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (socket) {
        socket.close()
      }
    }
  }, [roomCode, roomId, participantId, isHost, nickname, navigate, fromSource, activeTab, state?.roomId, state?.participantId])

  const myPlayer: Player = {
    id: 'me',
    name: nickname,
    initials: getInitials(nickname),
    avatarBg: 'bg-primary',
    avatarText: 'text-on-primary',
    isMe: true,
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode).catch(() => { })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeave = async () => {
    if (isHost) {
      const targetRoomId = roomId || state?.roomId
      if (targetRoomId) {
        try {
          await roomService.endRoom(targetRoomId)
        } catch (err) {
          console.error("Failed to end room by host:", err)
        }
      }
    } else {
      const targetParticipantId = participantId || state?.participantId
      if (targetParticipantId) {
        try {
          await roomService.leaveRoom(targetParticipantId)
        } catch (err) {
          console.error("Failed to leave room on backend:", err)
        }
      }
    }

    const isLoggedIn = !!(localStorage.getItem('token') || localStorage.getItem('user'))
    if (isLoggedIn || fromSource === 'dashboard') {
      navigate('/dashboard', { state: { activeTab } })
    } else {
      navigate('/')
    }
  }

  const handleStartGame = async () => {
    if (hostMembers.length === 0) {
      alert("Cannot start quiz session: No participants have joined the room yet. Please wait for players to join.")
      return
    }
    const targetRoomId = roomId || state?.roomId
    if (!targetRoomId) return
    try {
      await roomService.startRoom(targetRoomId)
      navigate('/host-panel', {
        state: {
          roomCode,
          roomId: targetRoomId,
          quizTitle: state?.quizTitle || 'Advanced Web Fundamentals Quiz',
          progressionMode: state?.progressionMode || 'manual',
          allowShowRank: state?.allowShowRank ?? true
        }
      })
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to start game'
      alert(`Start Error: ${errorMsg}`)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const allPlayers = players

  // ─── RENDER 1: HOST LOBBY VIEW ──────────────────────────────────────────────
  if (isHost) {
    return (
      <div className="w-full h-screen flex flex-col bg-gradient-to-br from-surface-container-low to-surface-container-highest relative overflow-hidden bg-surface-bright text-on-surface font-body-md">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col h-full w-full p-8 lg:p-12 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 mb-12">
            <button
              onClick={handleLeave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-dim hover:text-primary transition-all font-button text-sm shadow-sm group"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
              Back to Dashboard
            </button>

            <div className="text-center">
              <h2 className="font-headline-xl text-primary mb-2 text-4xl lg:text-5xl tracking-tight font-extrabold">Room Lobby</h2>
              <p className="font-headline-md text-on-surface italic opacity-85 text-base sm:text-lg">Waiting for participants to join the session...</p>
            </div>

            <div className="bg-error-container text-on-error-container px-6 py-3.5 rounded-2xl border border-error/20 flex items-center gap-3 shadow-lg shadow-error/10 animate-pulse">
              <span className="material-symbols-outlined text-[32px]">timer</span>
              <div className="flex flex-col text-left">
                <span className="font-label-bold text-[10px] uppercase tracking-widest opacity-70">Lobby Closes in</span>
                <span className="font-headline-md text-2xl font-bold">{formatTime(countdown)}</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center lg:gap-16 mb-12">
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
              <p className="font-label-bold text-outline uppercase tracking-[0.4em] mb-3 text-xs font-semibold">Room Access Code</p>
              <h1 className="font-headline-xl text-6xl sm:text-7xl lg:text-8xl text-primary tracking-[0.15em] font-black mb-8 drop-shadow-sm flex justify-center lg:justify-start">
                {formatRoomCode(roomCode)}
              </h1>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start w-full">
                <button
                  onClick={() => {
                    const lobbyUrl = `${window.location.origin}/lobby?roomCode=${roomCode}`
                    navigator.clipboard.writeText(lobbyUrl).catch(() => {})
                    alert('Invite link copied to clipboard!')
                  }}
                  className="bg-primary text-on-primary px-8 py-3.5 rounded-full font-button text-base shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-98 transition-all flex items-center justify-center gap-2 min-w-[200px]"
                >
                  <span className="material-symbols-outlined">share</span> Share Invite Link
                </button>
                <button
                  onClick={handleCopy}
                  className="border-2 border-primary/20 text-primary bg-white/50 backdrop-blur px-8 py-3.5 rounded-full font-button text-base hover:bg-primary/5 hover:border-primary transition-all flex items-center justify-center gap-2 min-w-[200px]"
                >
                  <span className="material-symbols-outlined">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
                <button
                  onClick={handleStartGame}
                  disabled={hostMembers.length === 0}
                  title={hostMembers.length === 0 ? "Waiting for participants to join before starting" : "Start Quiz Session"}
                  className={`px-8 py-3.5 rounded-full font-button text-base transition-all flex items-center justify-center gap-2 min-w-[200px] cursor-pointer ${
                    hostMembers.length === 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none opacity-80'
                      : 'bg-secondary text-on-secondary shadow-xl shadow-secondary/20 hover:shadow-secondary/35 hover:-translate-y-0.5 active:scale-98'
                  }`}
                >
                  Start Quiz Session <span className="material-symbols-outlined">rocket_launch</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center lg:items-center lg:translate-x-10">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-surface-container-highest relative group transition-transform hover:scale-103">
                <div className="w-56 h-56 bg-surface-container-low rounded-2xl flex items-center justify-center border-2 border-dashed border-primary/20 group-hover:border-primary transition-colors overflow-hidden">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Room QR Code" className="w-full h-full object-cover p-2" />
                  ) : (
                    <span className="material-symbols-outlined text-[120px] text-primary/20 group-hover:text-primary transition-colors">qr_code_2</span>
                  )}
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-secondary text-on-secondary px-5 py-2 rounded-full text-xs font-label-bold shadow-lg tracking-wider">
                  SCAN TO JOIN
                </div>
              </div>
              <p className="mt-6 text-on-surface-variant font-body-lg font-medium text-sm text-center">Participants can scan to join instantly</p>

            </div>
          </div>

          {/* Participants Section */}
          <div className="bg-white/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-sm w-full mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-secondary/15 text-secondary rounded-xl flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-[28px] fill-icon">groups</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-2xl font-bold text-on-surface">{hostMembers.length} Members Joined</h3>
                  <p className="text-on-surface-variant text-xs font-body-md">Participants currently in the room</p>
                </div>
              </div>
              <div className="flex -space-x-3">
                {hostMembers.slice(0, 6).map((member, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-surface-container-highest shadow-sm flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                    {getInitials(member.nickname)}
                  </div>
                ))}
                {hostMembers.length > 6 && (
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-primary text-on-primary flex items-center justify-center text-xs font-bold shadow-sm">
                    +{hostMembers.length - 6}
                  </div>
                )}
              </div>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {(showAllMembers ? hostMembers : hostMembers.slice(0, 8)).map((member, idx) => {
                const color = getAvatarColor(String(idx) + member.nickname)
                const badge = getPlayerBadge(member.nickname, member.equipped_title)
                return (
                  <div key={idx} className="bg-white/90 p-4 rounded-2xl border border-white/80 shadow-md hover:shadow-xl hover:scale-103 hover:border-primary/20 transition-all duration-300 flex items-center gap-4 cursor-default group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors" />
                    <div className={`w-12 h-12 rounded-full ${color.bg} flex items-center justify-center ${color.text} group-hover:scale-110 transition-transform font-black text-sm shadow-inner flex-shrink-0`}>
                      {getInitials(member.nickname)}
                    </div>
                    <div className="flex flex-col text-left truncate flex-grow">
                      <span className="font-bold text-on-surface truncate text-base mb-1">{member.nickname}</span>
                      <div className="flex">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getBadgeStyle(badge)}`}>
                          {badge}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {hostMembers.length > 8 && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setShowAllMembers(!showAllMembers)}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-on-primary font-button text-sm shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-98 transition-all group"
                >
                  <span className="font-bold">{showAllMembers ? 'Show Less' : 'Show All'}</span>
                  <span className={`material-symbols-outlined transition-transform ${showAllMembers ? 'rotate-180' : 'group-hover:translate-y-0.5'}`}>
                    expand_more
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── RENDER 2: PARTICIPANT LOBBY VIEW ─────────────────────────────────────────
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md relative overflow-hidden">
      {/* Background dot pattern */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(#c7c4d8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.35,
        }}
      />

      {/* Blob glows */}
      <div className="absolute pointer-events-none z-0 overflow-hidden inset-0">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary rounded-full blur-[120px] opacity-[0.06]" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-secondary rounded-full blur-[120px] opacity-[0.06]" />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen max-w-3xl mx-auto w-full">
        {/* Header */}
        <header className="flex justify-between items-center h-20 px-4 md:px-10 flex-shrink-0">
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 px-4 py-2 bg-surface/80 backdrop-blur-md rounded-lg text-error font-button text-button shadow-sm active:scale-95 transition-transform hover:bg-error-container group"
          >
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">logout</span>
            Leave Room
          </button>

          {/* Status indicator */}
          <div className="flex items-center gap-3 bg-surface/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-sm">
            <span className="pulse-indicator" />
            <span className="font-label-bold text-label-bold text-on-surface-variant">
              {allPlayers.length} in the room
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow flex flex-col items-center justify-start px-4 md:px-10 gap-6 pb-6">
          {/* Center Card */}
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-[0px_4px_12px_rgba(30,41,59,0.05)] border-2 border-primary-fixed p-8 flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-primary text-4xl">school</span>
            </div>

            <h1 className="font-headline-md text-headline-md text-on-surface">
              🎯 Waiting for the Game to Start
            </h1>

            {/* Room code */}
            <div className="mt-5 flex flex-col items-center">
              <span className="text-on-surface-variant font-label-bold text-label-bold uppercase tracking-widest mb-1">
                Room Code
              </span>
              <div className="flex items-center gap-3">
                <span className="font-headline-xl text-headline-xl text-primary tracking-tighter">
                  {formatRoomCode(roomCode)}
                </span>
                <button
                  onClick={handleCopy}
                  title="Copy code"
                  className="p-2 text-primary hover:bg-primary-fixed rounded-lg transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined">
                    {copied ? 'check_circle' : 'content_copy'}
                  </span>
                </button>
              </div>
            </div>

            {/* Waiting status */}
            <div className="mt-6 flex flex-col items-center gap-3 w-full">
              <div className="flex items-center gap-3 justify-center">
                <div className="custom-spinner" />
                <p className="text-on-surface-variant font-body-md text-body-md italic">
                  Waiting for the host to start the quiz...
                </p>
              </div>
              <p className="text-on-surface font-label-bold text-label-bold mt-1">Get ready! 🚀</p>
            </div>
          </section>

          {/* Roster Section */}
          <section className="w-full flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label-bold text-label-bold">
                <span className="material-symbols-outlined text-sm">groups</span>
                {allPlayers.length} {allPlayers.length === 1 ? 'Player' : 'Players'} Joined
              </div>
              <span className="text-on-surface-variant font-label-bold text-label-bold text-sm">
                {nickname} (You)
              </span>
            </div>

            {/* Player grid - wide horizontal bar layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* "Me" chip — highlighted */}
              <div className="bg-primary/5 border-2 border-primary ring-2 ring-primary/20 px-5 py-3.5 rounded-2xl flex items-center justify-between gap-4 shadow-sm relative overflow-hidden transition-all duration-300 animate-pulse">
                <div className="flex items-center gap-3.5 min-w-0 flex-grow">
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-on-primary font-black text-sm flex-shrink-0 shadow-md">
                    {myPlayer.initials}
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-extrabold text-on-surface text-base truncate">{nickname}</span>
                    <span className="text-[9px] bg-primary text-on-primary px-2 py-0.5 rounded-md font-black uppercase flex-shrink-0">You</span>
                  </div>
                </div>
                <span className={`text-xs font-black px-3 py-1 rounded-full border flex-shrink-0 shadow-xs ${getBadgeStyle(getPlayerBadge(nickname))}`}>
                  🏆 {getPlayerBadge(nickname)}
                </span>
              </div>

              {/* Other players */}
              {players.filter(p => !p.isMe).map((player, index) => {
                const badge = getPlayerBadge(player.name, player.equipped_title)
                return (
                  <div
                    key={player.id}
                    className="bg-white/90 border border-outline-variant/60 px-5 py-3.5 rounded-2xl flex items-center justify-between gap-4 shadow-sm hover:shadow-md hover:bg-white transition-all duration-300 fade-in-up"
                    style={{ animationDelay: `${(player.animDelay ?? 0) || index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-grow">
                      <div className={`w-11 h-11 rounded-full ${player.avatarBg} flex items-center justify-center ${player.avatarText} text-sm font-black flex-shrink-0 shadow-inner`}>
                        {player.initials}
                      </div>
                      <span className="font-extrabold text-on-surface text-base truncate">{player.name}</span>
                    </div>
                    <span className={`text-xs font-black px-3 py-1 rounded-full border flex-shrink-0 shadow-xs ${getBadgeStyle(badge)}`}>
                      🏆 {badge}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        </main>

        {/* Footer Banner */}
        <footer className="px-4 md:px-10 pb-6 pt-2 flex-shrink-0">
          <div className="w-full bg-primary py-4 px-6 rounded-xl flex items-center justify-center gap-4 shadow-lg overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-on-primary/10 rounded-full blur-xl" />
            <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-secondary-container/20 rounded-full blur-xl" />
            <span className="material-symbols-outlined text-secondary-container text-2xl animate-bounce z-10">
              tips_and_updates
            </span>
            <p className="font-body-md text-body-md text-on-primary text-center z-10">
              <span className="font-bold">Quick Tip:</span> Fast answers earn more points during the live game!
            </p>
          </div>
        </footer>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.33); opacity: 0; }
          80%, 100% { opacity: 0; }
        }
        @keyframes pulse-dot {
          0%   { transform: scale(0.8); }
          50%  { transform: scale(1); }
          100% { transform: scale(0.8); }
        }
        .pulse-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6cf8bb;
          position: relative;
          animation: pulse-dot 1.25s cubic-bezier(0.455, 0.03, 0.515, 0.955) -0.4s infinite;
        }
        .pulse-indicator::before {
          content: '';
          display: block;
          position: absolute;
          width: 300%;
          height: 300%;
          box-sizing: border-box;
          margin-left: -100%;
          margin-top: -100%;
          border-radius: 45px;
          background-color: #6cf8bb;
          animation: pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }
        .custom-spinner {
          border: 3px solid rgba(79, 70, 229, 0.1);
          border-left-color: #4f46e5;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
