import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Flame, Clock, Zap, HelpCircle, Shield, Sparkles, CheckCircle2, XCircle, ArrowRight, Award } from 'lucide-react'
import { roomService } from '../../../services/roomService'
import { useAuth } from '../../../hooks/useAuth'
import { getPlayerBadge, getBadgeStyle } from '@/utils/badgeHelper'

interface Option {
  id: number
  key: string // A, B, C, D
  label: string
}

interface ActiveQuestion {
  id: number
  text: string
  type: string // MULTIPLE_CHOICE, SHORT_ANSWER, TRUE_FALSE
  timeLimit: number
  options: Option[]
  audio_url?: string | null
  media_url?: string | null
  audio_play_limit?: number | null
}

const AVATAR_COLORS = [
  { bg: 'bg-[#ffeedd]', text: 'text-[#e06600]' },
  { bg: 'bg-[#e8f5e9]', text: 'text-[#2e7d32]' },
  { bg: 'bg-[#e3f2fd]', text: 'text-[#1565c0]' },
  { bg: 'bg-[#f3e5f5]', text: 'text-[#6a1b9a]' },
  { bg: 'bg-[#ffebee]', text: 'text-[#c62828]' },
]

export const ParticipantAnswer: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { status } = useAuth()

  const state = location.state as { 
    nickname?: string 
    roomCode?: string 
    roomId?: number
    participantId?: number
    score?: number 
    streak?: number 
    mode?: string
    activePowerUp?: string | null
    questionNumber?: number
    fromSource?: 'landing' | 'dashboard'
    activeTab?: string
  } | null

  const roomCode = state?.roomCode || sessionStorage.getItem('play_room_code') || ''
  const nickname = state?.nickname || sessionStorage.getItem('play_nickname') || 'Guest'
  const participantId = state?.participantId || Number(sessionStorage.getItem('play_participant_id')) || 0
  const roomId = state?.roomId || Number(sessionStorage.getItem('play_room_id')) || 0
  const [accumulatedScore, setAccumulatedScore] = useState<number>(() => state?.score ?? Number(sessionStorage.getItem('play_accumulated_score') || 0))
  const [streak, setStreak] = useState<number>(() => state?.streak ?? Number(sessionStorage.getItem('play_streak') || 0))
  const [roomMode, setRoomMode] = useState<string>(() => state?.mode || sessionStorage.getItem('play_room_mode') || 'CLASSIC')
  const activePowerUp = state?.activePowerUp || null
  const effectivePowerUp = roomMode === 'EXAM' ? null : activePowerUp
  const fromSource = state?.fromSource || (localStorage.getItem('token') ? 'dashboard' : 'landing')
  const activeTab = state?.activeTab || sessionStorage.getItem('dashboard_active_tab') || 'join_room'

  // Save variables to sessionStorage to handle page reloads gracefully
  useEffect(() => {
    if (roomCode) sessionStorage.setItem('play_room_code', roomCode)
    if (nickname) sessionStorage.setItem('play_nickname', nickname)
    if (participantId) sessionStorage.setItem('play_participant_id', String(participantId))
    if (roomId) sessionStorage.setItem('play_room_id', String(roomId))
    if (roomMode) sessionStorage.setItem('play_room_mode', roomMode)
    sessionStorage.setItem('play_streak', String(streak))
    sessionStorage.setItem('play_accumulated_score', String(accumulatedScore))
  }, [roomCode, nickname, participantId, roomId, roomMode, streak, accumulatedScore])

  // Redirect if user has not joined a room before accessing /play
  useEffect(() => {
    if (status === 'loading') return
    if (!roomCode) {
      if (status === 'authenticated') {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    }
  }, [roomCode, status, navigate])

  // Dynamic Gameplay States
  const [activeQuestion, setActiveQuestion] = useState<ActiveQuestion | null>(null)
  const [questionIndex, setQuestionIndex] = useState(1)
  const [timeLeft, setTimeLeft] = useState(20)
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [correctOptionKey, setCorrectOptionKey] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [loading, setLoading] = useState(true)
  const [audioPlayCount, setAudioPlayCount] = useState(0)
  const [allowShowRank, setAllowShowRank] = useState(true)
  const [leaderboardRoster, setLeaderboardRoster] = useState<any[]>([])

  const activeQuestionIdRef = useRef<number | null>(null)
  const resultTimeoutRef = useRef<any>(null)

  useEffect(() => {
    setAudioPlayCount(0)
    activeQuestionIdRef.current = activeQuestion ? activeQuestion.id : null
    return () => {
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current)
      }
    }
  }, [activeQuestion])

  const handleAudioPlay = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    if (activeQuestion?.audio_play_limit && activeQuestion.audio_play_limit > 0) {
      if (audioPlayCount >= activeQuestion.audio_play_limit) {
        e.currentTarget.pause()
        alert(`You have reached the play limit of ${activeQuestion.audio_play_limit} times for this audio.`)
        return
      }
      setAudioPlayCount(prev => prev + 1)
    }
  }

  // Clear play session storage helper
  const clearPlaySession = () => {
    sessionStorage.removeItem('play_room_code')
    sessionStorage.removeItem('play_participant_id')
    sessionStorage.removeItem('play_room_id')
    sessionStorage.removeItem('play_nickname')
    sessionStorage.removeItem('play_streak')
    sessionStorage.removeItem('play_accumulated_score')
    sessionStorage.removeItem('play_room_mode')
  }

  // Fetch the active question from API
  const fetchRoomQuestion = async () => {
    if (!roomCode) return
    setLoading(true)
    try {
      const roomData = await roomService.getRoom(roomCode)
      setQuestionIndex(roomData.current_question_index)
      if (roomData.mode) {
        setRoomMode(roomData.mode)
      }
      if (roomData.allow_show_rank !== undefined) {
        setAllowShowRank(roomData.allow_show_rank)
      }
      
      if (roomData.status === 'ENDED') {
        alert("The quiz session has been ended.")
        clearPlaySession()
        navigate(status === 'authenticated' ? '/dashboard' : '/', { replace: true })
        return
      }

      if (roomData.active_question) {
        setActiveQuestion({
          id: roomData.active_question.id,
          text: roomData.active_question.text || '',
          type: roomData.active_question.type || 'MULTIPLE_CHOICE',
          timeLimit: roomData.active_question.time_limit || 20,
          options: roomData.active_question.options || [],
          audio_url: roomData.active_question.audio_url,
          media_url: roomData.active_question.media_url,
          audio_play_limit: roomData.active_question.audio_play_limit
        })
        if (roomData.active_question.correct_option_key) {
          setCorrectOptionKey(roomData.active_question.correct_option_key)
        }
        
        // Sync dynamic remaining time Left based on room question start timestamp
        if (roomData.current_question_started_at) {
          const startedAtStr = roomData.current_question_started_at
          const ms = new Date(startedAtStr.endsWith('Z') ? startedAtStr : startedAtStr + 'Z').getTime()
          setStartedAtMs(ms)
          const elapsed = (Date.now() - ms) / 1000
          const limit = roomData.active_question.time_limit || 20
          const remaining = Math.max(0, Math.ceil(limit - elapsed))
          setTimeLeft(remaining)
        }
      } else {
        setActiveQuestion(null)
      }
      setLoading(false)
    } catch (err) {
      console.error("Failed to fetch active question:", err)
      setLoading(false)
    }
  }

  // Fetch round leaderboard standings when showing result on 3-question milestone
  useEffect(() => {
    if (showResult && allowShowRank && questionIndex % 3 === 0 && (roomId || roomCode)) {
      const fetchStandings = async () => {
        try {
          let list: any[] = []
          if (roomId) {
            list = await roomService.getParticipants(roomId)
          } else if (roomCode) {
            const roomData = await roomService.getRoom(roomCode)
            list = roomData.participants || []
          }
          setLeaderboardRoster(list.sort((a, b) => b.score - a.score))
        } catch (err) {
          console.error("Failed to fetch round standings:", err)
        }
      }
      fetchStandings()
    }
  }, [showResult, allowShowRank, questionIndex, roomId, roomCode])

  // Load initial question on mount and when tab becomes active / window gets focus
  useEffect(() => {
    fetchRoomQuestion()

    const handleFocus = () => {
      fetchRoomQuestion()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [roomCode])

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectAttemptRef = useRef<number>(0)

  // Establish WebSocket connection to sync room next-question triggers and fast answer submissions (<5ms)
  useEffect(() => {
    if (!roomCode) return

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
    const apiHost = baseUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1\/?$/, '')
    const token = localStorage.getItem('token')
    const wsUrl = `${wsProtocol}//${apiHost}/api/v1/ws/rooms/${roomCode}?nickname=${encodeURIComponent(nickname)}&isHost=false${token ? `&token=${token}` : ''}`

    let pingTimer: any = null
    let reconnectTimer: any = null
    let isDisposed = false

    const connectWebSocket = () => {
      if (isDisposed) return
      try {
        const socket = new WebSocket(wsUrl)
        socketRef.current = socket

        socket.onopen = () => {
          reconnectAttemptRef.current = 0
          // Request instant state sync over WebSocket
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "SYNC_STATE" }))
          }
          fetchRoomQuestion()

          // Send periodic PING to keep WebSocket connection alive
          pingTimer = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: "PING" }))
            }
          }, 5000)
        }

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === "PONG") return

            if (data.type === "SYNC_STATE_RESPONSE") {
              if (data.active_question) {
                setActiveQuestion(data.active_question)
                if (data.current_question_index) setQuestionIndex(data.current_question_index)
                if (data.time_left !== undefined) setTimeLeft(data.time_left)
                setLoading(false)
              }
              return
            }

            if (data.type === "SUBMIT_ANSWER_RESPONSE") {
              if (data.status === "SUCCESS") {
                const isAnsCorrect = data.is_correct
                const pointsForThisQuestion = Math.round(data.score || 0)
                const totalNewScore = data.total_score !== undefined && data.total_score !== null ? data.total_score : accumulatedScore + (isAnsCorrect ? pointsForThisQuestion : 0)
                const updatedStreak = isAnsCorrect ? streak + 1 : (activePowerUp === 'shield' ? streak : 0)

                setIsCorrect(isAnsCorrect)
                setPointsEarned(isAnsCorrect ? pointsForThisQuestion : 0)
                setAccumulatedScore(totalNewScore)
                setCorrectOptionKey(data.correct_option_key)
                setStreak(updatedStreak)

                sessionStorage.setItem('play_streak', String(updatedStreak))
                sessionStorage.setItem('play_final_streak', String(updatedStreak))
                sessionStorage.setItem('play_accumulated_score', String(totalNewScore))

                if (location.state) {
                  location.state.score = totalNewScore
                  location.state.streak = updatedStreak
                  location.state.activePowerUp = null
                }

                if (resultTimeoutRef.current) {
                  clearTimeout(resultTimeoutRef.current)
                }
                resultTimeoutRef.current = setTimeout(() => {
                  setShowResult(true)
                }, 400)
              }
            } else if (data.type === "NEXT_QUESTION") {
              if (data.status === "ENDED") {
                navigate('/leaderboard', {
                  state: {
                    nickname,
                    roomCode,
                    roomId,
                    score: accumulatedScore,
                    streak,
                    lastPointsEarned: isAnswered && isCorrect ? pointsEarned : 0,
                    lastIsCorrect: isCorrect,
                    questionNumber: questionIndex,
                    fromSource,
                    activeTab
                  }
                })
                return
              }
              
              // Set loading and reset activeQuestion immediately to avoid race conditions
              setLoading(true)
              setActiveQuestion(null)
              if (resultTimeoutRef.current) {
                clearTimeout(resultTimeoutRef.current)
              }

              // Reset gameplay states for the new question
              setIsAnswered(false)
              setSelectedKey(null)
              setShowResult(false)
              setIsCorrect(false)
              setPointsEarned(0)
              setCorrectOptionKey(null)
              setAnswerText('')
              if (location.state) {
                location.state.activePowerUp = null
              }
              
              // Fetch details of the next question
              fetchRoomQuestion()
            } else if (data.type === "GAME_STARTED") {
              // Fetch initial active question when host launches quiz
              fetchRoomQuestion()
            } else if (data.type === "GAME_ENDED") {
              // Navigate to leaderboard to show final scores
              navigate('/leaderboard', {
                state: {
                  nickname,
                  roomCode,
                  roomId,
                  score: accumulatedScore,
                  streak,
                  lastPointsEarned: isAnswered && isCorrect ? pointsEarned : 0,
                  lastIsCorrect: isCorrect,
                  questionNumber: questionIndex,
                  fromSource,
                  activeTab
                }
              })
            }
          } catch (e) {
            console.error("Error parsing WebSocket message:", e)
          }
        }

        socket.onclose = () => {
          if (pingTimer) clearInterval(pingTimer)
          socketRef.current = null
          if (!isDisposed) {
            const attempt = reconnectAttemptRef.current
            reconnectAttemptRef.current += 1
            const delay = attempt === 0 ? 300 : Math.min(500 * Math.pow(1.5, attempt) + Math.random() * 300, 5000)
            reconnectTimer = setTimeout(connectWebSocket, delay)
          }
        }

        socket.onerror = () => {
          if (socket) socket.close()
        }
      } catch (err) {
        console.error("Failed to connect play screen websocket:", err)
        socketRef.current = null
        if (!isDisposed) {
          const attempt = reconnectAttemptRef.current
          reconnectAttemptRef.current += 1
          const delay = attempt === 0 ? 300 : Math.min(500 * Math.pow(1.5, attempt) + Math.random() * 300, 5000)
          reconnectTimer = setTimeout(connectWebSocket, delay)
        }
      }
    }

    connectWebSocket()

    return () => {
      isDisposed = true
      if (pingTimer) clearInterval(pingTimer)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (socketRef.current) socketRef.current.close()
    }
  }, [roomCode, nickname, navigate])

  // Timer Countdown Effect (Server timestamp synced, continues even after answer is submitted)
  useEffect(() => {
    if (loading || !activeQuestion || !startedAtMs) return

    const limit = activeQuestion.timeLimit || 20

    const updateTimer = () => {
      const elapsed = (Date.now() - startedAtMs) / 1000
      const remaining = Math.max(0, Math.ceil(limit - elapsed))
      setTimeLeft(remaining)

      if (remaining === 0 && !isAnswered) {
        handleAnswerSubmit(null, null)
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 250)

    return () => clearInterval(timer)
  }, [loading, activeQuestion, startedAtMs, isAnswered])

  // Submit Answer to API (WebSocket primary, REST HTTP fallback)
  const handleAnswerSubmit = async (optionId: number | null, keyOrText: string | null) => {
    if (isAnswered) return
    if (!activeQuestion) return

    const submittedQuestionId = activeQuestion.id

    setIsAnswered(true)
    setSelectedKey(keyOrText)

    // Fast-path: Submit over persistent WebSocket connection (<5ms latency)
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({
          type: "SUBMIT_ANSWER",
          participant_id: participantId,
          question_id: submittedQuestionId,
          selected_option_id: optionId,
          answer_text: activeQuestion.type === 'SHORT_ANSWER' ? (keyOrText || '') : undefined,
          active_power_up: activePowerUp || undefined,
          streak: streak
        }))
        return
      } catch (wsErr) {
        console.warn("WebSocket submit failed, falling back to HTTP REST API:", wsErr)
      }
    }

    // Fallback path: HTTP REST API
    try {
      const res = await roomService.submitAnswer(roomCode, {
        participant_id: participantId,
        question_id: submittedQuestionId,
        selected_option_id: optionId as any,
        answer_text: activeQuestion.type === 'SHORT_ANSWER' ? (keyOrText || '') : undefined,
        active_power_up: activePowerUp || undefined,
        streak: streak
      })

      // If active question has transitioned during the network request, discard results
      if (activeQuestionIdRef.current !== submittedQuestionId) {
        console.log("Stale answer submission results discarded.")
        return
      }

      const isAnsCorrect = res.is_correct
      const pointsForThisQuestion = Math.round(res.score || 0)

      const totalNewScore = res.total_score !== undefined && res.total_score !== null ? res.total_score : accumulatedScore + (isAnsCorrect ? pointsForThisQuestion : 0)
      const updatedStreak = isAnsCorrect ? streak + 1 : (activePowerUp === 'shield' ? streak : 0)

      setIsCorrect(isAnsCorrect)
      setPointsEarned(isAnsCorrect ? pointsForThisQuestion : 0)
      setAccumulatedScore(totalNewScore)
      setCorrectOptionKey(res.correct_option_key)
      setStreak(updatedStreak)
      
      sessionStorage.setItem('play_streak', String(updatedStreak))
      sessionStorage.setItem('play_final_streak', String(updatedStreak))
      sessionStorage.setItem('play_accumulated_score', String(totalNewScore))
      
      if (location.state) {
        location.state.score = totalNewScore
        location.state.streak = updatedStreak
        location.state.activePowerUp = null
      }

      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current)
      }
      resultTimeoutRef.current = setTimeout(() => {
        if (activeQuestionIdRef.current === submittedQuestionId) {
          setShowResult(true)
        }
      }, 600)
    } catch (err) {
      console.error("Failed to submit answer:", err)
      if (activeQuestionIdRef.current !== submittedQuestionId) return

      const updatedStreak = activePowerUp === 'shield' ? streak : 0
      setStreak(updatedStreak)
      sessionStorage.setItem('play_streak', String(updatedStreak))
      sessionStorage.setItem('play_final_streak', String(updatedStreak))
      setIsCorrect(false)
      setPointsEarned(0)
      
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current)
      }
      resultTimeoutRef.current = setTimeout(() => {
        if (activeQuestionIdRef.current === submittedQuestionId) {
          setShowResult(true)
        }
      }, 600)
    }
  }

  // Helpers for option letters styling
  const getLetterBgColor = (key: string) => {
    if (isAnswered && (selectedKey === key || key === correctOptionKey)) {
      return 'bg-white text-slate-900 font-black shadow-md';
    }
    switch (key) {
      case 'A': return 'bg-rose-600 text-white font-black shadow-sm';
      case 'B': return 'bg-blue-600 text-white font-black shadow-sm';
      case 'C': return 'bg-amber-500 text-white font-black shadow-sm';
      case 'D': return 'bg-emerald-600 text-white font-black shadow-sm';
      default: return 'bg-slate-700 text-white font-black';
    }
  }

  const getOptionStyle = (key: string) => {
    if (isAnswered) {
      const isSelected = selectedKey === key;
      const isCorrectOption = key === correctOptionKey;

      if (isCorrectOption) {
        return 'border-2 border-emerald-500 bg-emerald-600 text-white ring-4 ring-emerald-500/30 scale-[1.02] shadow-lg font-bold';
      }
      if (isSelected && !isCorrectOption) {
        return 'border-2 border-rose-500 bg-rose-600 text-white ring-4 ring-rose-500/30 shadow-lg font-bold';
      }
      return 'border border-slate-200 bg-slate-50 text-slate-400 opacity-40';
    }

    switch (key) {
      case 'A': return 'border-2 border-rose-200 bg-gradient-to-r from-rose-50 via-white to-rose-100/60 hover:border-rose-500 hover:bg-rose-100/80 text-rose-950 font-bold hover:shadow-md hover:-translate-y-0.5';
      case 'B': return 'border-2 border-blue-200 bg-gradient-to-r from-blue-50 via-white to-blue-100/60 hover:border-blue-500 hover:bg-blue-100/80 text-blue-950 font-bold hover:shadow-md hover:-translate-y-0.5';
      case 'C': return 'border-2 border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-100/60 hover:border-amber-500 hover:bg-amber-100/80 text-amber-950 font-bold hover:shadow-md hover:-translate-y-0.5';
      case 'D': return 'border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-100/60 hover:border-emerald-500 hover:bg-emerald-100/80 text-emerald-950 font-bold hover:shadow-md hover:-translate-y-0.5';
      default: return 'border-2 border-slate-200 hover:border-slate-400 bg-white text-slate-800';
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#f9f9ff] flex flex-col items-center justify-center p-6 text-center">
        <div className="custom-spinner mb-4" />
        <p className="text-sm font-bold text-slate-600">Loading active question details...</p>
      </div>
    )
  }

  if (!activeQuestion) {
    return (
      <div className="w-full min-h-screen bg-[#f9f9ff] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2">No Active Question</h2>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
          Waiting for the host to present or unlock the next question of the quiz. Keep this tab open!
        </p>
      </div>
    )
  }

  const myBadge = getPlayerBadge(nickname)
  const myBadgeStyle = getBadgeStyle(myBadge)

  return (
    <div className="w-full min-h-screen bg-[#f9f9ff] text-on-surface font-body-md relative overflow-hidden flex flex-col">
      {/* Background Dots */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(#c3c0ff 1.2px, transparent 1.2px)',
          backgroundSize: '20px 20px',
          opacity: 0.35,
        }}
      />

      <div className="relative z-10 flex-grow flex flex-col max-w-xl mx-auto w-full px-4 py-6 justify-between">
        
        {/* Header Dashboard */}
        <header className="flex flex-col gap-3">
          {/* Player Badge & Score Bar */}
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border-2 border-outline-variant/30 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/20">
                {nickname.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-slate-800 leading-tight truncate max-w-[120px]">{nickname}</span>
                <span className={`text-[9px] font-black px-2 py-0.2 rounded-full border w-fit mt-0.5 ${myBadgeStyle}`}>
                  🏆 {myBadge}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-full text-xs font-black">
                <Flame className="w-3.5 h-3.5 fill-current text-amber-500 animate-bounce" />
                <span>{streak}</span>
              </div>
              <span className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                {Math.round(accumulatedScore)} Pts
              </span>
            </div>
          </div>

          {/* Question Index Bar */}
          <div className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
            <span>Question {questionIndex}</span>
            {roomMode === 'EXAM' && (
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full">
                Exam Mode
              </span>
            )}
          </div>

          {/* Time Countdown Progress Bar */}
          <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden border border-outline-variant shadow-inner relative flex items-center">
            <div 
              className={`h-full transition-all duration-1000 rounded-full bg-gradient-to-r ${
                timeLeft <= 5 ? 'from-red-500 to-red-650 animate-pulse' : 'from-primary to-secondary'
              }`}
              style={{ width: `${(timeLeft / (activeQuestion.timeLimit || 20)) * 100}%` }}
            />
            <div className="absolute right-3 flex items-center gap-1 text-[10px] font-black text-slate-900 font-headline-md tracking-wider">
              <Clock className="w-3 h-3" /> {timeLeft}s
            </div>
          </div>

          {/* Active Power-Up Alert Banner (Hidden in EXAM mode) */}
          {effectivePowerUp && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-amber-500/15 to-amber-600/10 text-amber-955 border-2 border-amber-300 rounded-xl text-xs font-bold animate-in slide-in-from-top-2 duration-300 shadow-sm">
              <Zap className="w-4 h-4 text-amber-650 animate-pulse fill-current" />
              <span>
                Active Power-Up: {effectivePowerUp === 'double' ? 'Double Points (x2)' : effectivePowerUp === 'shield' ? 'Streak Shield' : effectivePowerUp === 'fifty' ? '50:50 Split' : 'Booster Active'}
              </span>
            </div>
          )}
        </header>

        {/* Question Text */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border-2 border-outline-variant/40 shadow-md text-left my-6 flex-grow flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2.5 block">
            {activeQuestion.type === 'SHORT_ANSWER' ? 'Short Answer Quiz' : 'Multiple Choice Quiz'}
          </span>
          <h1 className="font-headline-md text-lg md:text-xl font-black text-on-surface leading-relaxed mb-4">
            {activeQuestion.text}
          </h1>

          {activeQuestion.media_url && (
            <div className="w-full flex justify-center mb-4">
              {activeQuestion.media_url.match(/\.(mp4|webm|ogg|mov)$/i) || activeQuestion.media_url.includes('/video/upload/') ? (
                <video 
                  src={activeQuestion.media_url} 
                  controls 
                  className="max-h-48 md:max-h-64 rounded-2xl border border-slate-200 shadow-sm"
                />
              ) : (
                <img 
                  src={activeQuestion.media_url} 
                  alt="Question Media" 
                  className="max-h-48 md:max-h-64 object-contain rounded-2xl border border-slate-200 shadow-sm"
                />
              )}
            </div>
          )}

          {activeQuestion.audio_url && (
            <div className="w-full flex flex-col items-center gap-2 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Listen to Audio</span>
              <audio 
                src={activeQuestion.audio_url} 
                controls 
                onPlay={handleAudioPlay}
                className="w-full max-w-sm"
              />
              {activeQuestion.audio_play_limit !== undefined && activeQuestion.audio_play_limit !== null && activeQuestion.audio_play_limit > 0 && (
                <span className="text-[10px] font-black uppercase text-rose-600 mt-1">
                  Plays: {audioPlayCount} / {activeQuestion.audio_play_limit}
                </span>
              )}
            </div>
          )}
        </section>

        {/* Answer Selection Grid / Text Input */}
        {activeQuestion.type === 'SHORT_ANSWER' ? (
          <div className="w-full flex flex-col gap-5 mb-6">
            <input
              type="text"
              value={answerText}
              disabled={isAnswered}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your answer here..."
              className={`w-full py-6 px-6 rounded-3xl border-3 text-center font-black outline-none transition-all shadow-xl text-xl tracking-wide uppercase ${
                isAnswered 
                  ? (isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-4 ring-emerald-500/10' : 'border-rose-500 bg-rose-50 text-rose-900 ring-4 ring-rose-500/10')
                  : 'border-primary/20 bg-white text-on-surface focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-slate-350'
              }`}
            />
            {!isAnswered && (
              <button
                type="button"
                onClick={() => handleAnswerSubmit(null, answerText)}
                disabled={!answerText.trim()}
                className="w-full py-5 bg-gradient-to-r from-primary to-secondary text-white rounded-3xl font-button text-base font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-98 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                Submit Answer <ArrowRight className="w-5 h-5 animate-pulse" />
              </button>
            )}
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {(() => {
              // Dynamically determine 2 incorrect options to eliminate when 50:50 power-up is active
              const options = activeQuestion.options || []
              let eliminatedKeys: string[] = []
              if (effectivePowerUp === 'fifty' && options.length > 2) {
                const correctKey = correctOptionKey || (activeQuestion as any).correct_option_key
                const incorrectOptions = options.filter(o => o.key !== correctKey)
                
                // Shuffle incorrect options randomly using question id seed
                const seed = (activeQuestion.id || 1) * 37 + nickname.length
                const shuffled = [...incorrectOptions].sort((a, b) => {
                  const hashA = (a.key.charCodeAt(0) * seed) % 17
                  const hashB = (b.key.charCodeAt(0) * seed) % 17
                  return hashA - hashB
                })
                
                eliminatedKeys = shuffled.slice(0, 2).map(o => o.key)
              }

              return options.map((opt) => {
                const isFiftyFiftyHidden = effectivePowerUp === 'fifty' && eliminatedKeys.includes(opt.key)
                if (isFiftyFiftyHidden && !isAnswered) {
                  return (
                    <div 
                      key={opt.key}
                      className="p-5 rounded-2xl border-2 border-dashed border-outline-variant bg-[#eaeaff]/30 opacity-30 flex items-center justify-center h-full min-h-[72px]"
                    >
                      <span className="text-xs font-bold italic text-slate-500">Option eliminated (50:50)</span>
                    </div>
                  )
                }

                return (
                  <button
                    type="button"
                    key={opt.key}
                    disabled={isAnswered}
                    onClick={() => handleAnswerSubmit(opt.id, opt.key)}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 relative overflow-hidden shadow-md active:scale-98 cursor-pointer ${getOptionStyle(opt.key)}`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${getLetterBgColor(opt.key)} shadow-md flex-shrink-0`}>
                      {opt.key}
                    </span>
                    <span className="font-headline-md text-sm font-extrabold leading-tight">
                      {opt.label}
                    </span>
                  </button>
                )
              })
            })()}
          </section>
        )}

        {/* Active Power-Up Selection Link Button (Disabled in EXAM mode) */}
        {!isAnswered && roomMode !== 'EXAM' && (
          <button
            type="button"
            onClick={() => navigate('/powerups', { state: { nickname, roomCode, score: accumulatedScore, streak, questionNumber: questionIndex } })}
            className="w-full py-4 bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 text-amber-955 rounded-2xl font-button text-xs font-black transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-amber-500 text-amber-600 animate-pulse" /> Select a Power-Up / Booster
          </button>
        )}

        {/* Result Popup Overlay */}
        {showResult && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 text-center animate-in slide-in-from-bottom-8 duration-300">
              
              {/* Header result badge */}
              <div className="flex justify-center mb-4">
                {isCorrect ? (
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 border-2 border-emerald-300 px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100" /> Correct
                  </span>
                ) : (
                  <span className="text-xs font-black text-rose-700 bg-rose-100 border-2 border-rose-300 px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <XCircle className="w-4 h-4 text-rose-500 fill-rose-100" /> Incorrect
                  </span>
                )}
              </div>

              <h3 className={`text-xl font-black mb-2 ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
                {isCorrect ? 'Awesome Job!' : 'Better Luck Next Time!'}
              </h3>

              <p className="text-xs text-slate-800 font-extrabold mb-6 leading-relaxed">
                {isCorrect 
                  ? `You answered quickly and earned points + Speed Bonus!` 
                  : `Correct answer was: "${correctOptionKey || 'N/A'}"`
                }
              </p>

              <div className="flex justify-center items-center gap-6 py-2 mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-outline uppercase tracking-wider font-bold">Points Earned</span>
                  <span className={`text-2xl font-black ${isCorrect ? 'text-emerald-700' : 'text-slate-800'}`}>
                    +{pointsEarned}
                  </span>
                </div>

                <div className="h-8 w-px bg-outline-variant/30" />

                <div className="flex flex-col">
                  <span className="text-[10px] text-outline uppercase tracking-wider font-bold">Current Streak</span>
                  <span className="text-2xl font-black text-amber-500 flex items-center gap-1.5">
                    <Flame className="w-6 h-6 fill-current" />
                    {streak}
                  </span>
                </div>
              </div>

              {/* Periodic Round Leaderboard Standings (Every 3 questions) */}
              {allowShowRank && questionIndex % 3 === 0 && leaderboardRoster.length > 0 && (
                <div className="mt-4 pt-4 border-t-2 border-slate-200 text-left mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500 fill-amber-400" />
                      Round {Math.floor(questionIndex / 3)} Standings
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Top Players
                    </span>
                  </div>

                  {/* My Rank Banner */}
                  {(() => {
                    const myIndex = leaderboardRoster.findIndex(
                      p => p.nickname?.trim().toLowerCase() === nickname.trim().toLowerCase()
                    )
                    if (myIndex === -1) return null
                    return (
                      <div className="mb-3 p-2.5 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl flex items-center justify-between text-xs font-black">
                        <div className="flex items-center gap-2">
                          <span className="text-primary">Your Current Rank: #{myIndex + 1} of {leaderboardRoster.length}</span>
                          <span className={`text-[9px] font-black px-2 py-0.2 rounded-full border ${getBadgeStyle(getPlayerBadge(nickname))}`}>
                            🏆 {getPlayerBadge(nickname)}
                          </span>
                        </div>
                        <span className="text-secondary">{Math.round(accumulatedScore)} pts</span>
                      </div>
                    )
                  })()}

                  {/* Roster List (Top 5) */}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {leaderboardRoster.slice(0, 5).map((p, idx) => {
                      const isMe = p.nickname?.trim().toLowerCase() === nickname.trim().toLowerCase()
                      let rankBadge = `${idx + 1}`
                      if (idx === 0) rankBadge = '🥇 1st'
                      else if (idx === 1) rankBadge = '🥈 2nd'
                      else if (idx === 2) rankBadge = '🥉 3rd'
                      const pBadge = getPlayerBadge(p.nickname, p.equipped_title)

                      return (
                        <div
                          key={p.id || idx}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                            isMe ? 'bg-primary text-white font-black shadow-xs' : 'bg-slate-100 text-slate-800 font-bold'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-[10px] font-black opacity-90">{rankBadge}</span>
                            <span className="truncate">{p.nickname}</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full border ${getBadgeStyle(pBadge)}`}>
                              🏆 {pBadge}
                            </span>
                          </div>
                          <span className="font-black flex-shrink-0">{Math.round(p.score)} pts</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Waiting Indicator for Live Quiz */}
              <div className="w-full py-4 bg-slate-50 border-2 border-slate-200 text-slate-500 rounded-2xl font-button text-sm font-extrabold flex items-center justify-center gap-2.5">
                <div className="custom-spinner text-xs" />
                <span>Waiting for the Host to advance...</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
