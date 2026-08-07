import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users, Clock, Play, Award, Eye, EyeOff, CheckCircle2, ChevronRight, BarChart2, LogOut, Flame, ArrowLeft } from 'lucide-react'
import { roomService } from '@/services'
import { getPlayerBadge, getBadgeStyle } from '@/utils/badgeHelper'

interface ParticipantAnswerState {
  id: string
  name: string
  answered: boolean
  answerKey: string | null
  streak: number
  score: number
  equipped_title?: string | null
}

interface QuestionDetails {
  id: number
  text: string
  type?: string // MULTIPLE_CHOICE, SHORT_ANSWER
  time_limit?: number
  options: { key: string; label: string }[]
  correctKey: string
  audio_url?: string | null
  media_url?: string | null
}

export const HostLiveReview: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // State variables passed from Lobby or restored from sessionStorage
  const state = location.state as { roomCode?: string; quizTitle?: string; roomId?: number; progressionMode?: string; allowShowRank?: boolean } | null
  const roomCode = state?.roomCode || sessionStorage.getItem('host_room_code') || ''
  const quizTitle = state?.quizTitle || sessionStorage.getItem('host_quiz_title') || 'Live Quiz Session'
  const roomId = state?.roomId || Number(sessionStorage.getItem('host_room_id') || 0)

  // Persist session parameters
  useEffect(() => {
    if (state?.roomCode) sessionStorage.setItem('host_room_code', state.roomCode)
    if (state?.roomId) sessionStorage.setItem('host_room_id', String(state.roomId))
    if (state?.quizTitle) sessionStorage.setItem('host_quiz_title', state.quizTitle)
  }, [state])

  const [autoAdvance, setAutoAdvance] = useState(state?.progressionMode === 'auto')
  const [allowShowRank, setAllowShowRank] = useState(state?.allowShowRank ?? true)
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false)
  const [leaderboardTimeLeft, setLeaderboardTimeLeft] = useState(5)
  const [hasInitializedAutoAdvance, setHasInitializedAutoAdvance] = useState(false)

  const handleAutoAdvanceChange = async (val: boolean) => {
    setAutoAdvance(val)
    const activeRoomId = roomId || state?.roomId
    if (activeRoomId) {
      try {
        await roomService.updateSettings(activeRoomId, {
          progression_mode: val ? 'auto' : 'manual'
        })
      } catch (err) {
        console.error("Failed to update room progression_mode in DB:", err)
      }
    }
  }

  const [questionNumber, setQuestionNumber] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(3)
  const [timeLeft, setTimeLeft] = useState(20)
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null)
  const [revealAnswer, setRevealAnswer] = useState(false)
  const [participants, setParticipants] = useState<ParticipantAnswerState[]>([])
  const [distribution, setDistribution] = useState<Record<string, number>>({ A: 0, B: 0, C: 0, D: 0 })
  const [activeQuestion, setActiveQuestion] = useState<QuestionDetails>({
    id: 0,
    text: 'Loading active question...',
    type: 'MULTIPLE_CHOICE',
    options: [],
    correctKey: ''
  })

  // Real-time updates via WebSocket + 10s polling fallback for Host Panel
  useEffect(() => {
    const token = localStorage.getItem('token')
    const activeRoomId = roomId || state?.roomId
    if (!activeRoomId || !token) return

    const fetchLiveSession = async () => {
      try {
        const data = await roomService.getLiveSession(activeRoomId)
          
          if (data.status === 'ENDED') {
            navigate('/dashboard')
            return
          }

          setQuestionNumber(data.current_question_index)
          if (data.total_questions !== undefined) {
            setTotalQuestions(data.total_questions)
          }
          if (data.progression_mode && !hasInitializedAutoAdvance) {
            setAutoAdvance(data.progression_mode === 'auto')
            setHasInitializedAutoAdvance(true)
          }
          if (data.allow_show_rank !== undefined) {
            setAllowShowRank(data.allow_show_rank)
          }
          
          // Map participants
          setParticipants(data.participants.map((p: any) => ({
            id: String(p.id),
            name: p.nickname,
            answered: p.answered,
            answerKey: null,
            streak: 0,
            score: p.score,
            equipped_title: p.equipped_title ?? null,
          })))

          // Map active question
          if (data.active_question) {
            setActiveQuestion({
              id: data.active_question.id,
              text: data.active_question.text,
              type: data.active_question.type || 'MULTIPLE_CHOICE',
              time_limit: data.active_question.time_limit || 20,
              options: data.active_question.options || [],
              correctKey: data.active_question.correct_option_key || '',
              audio_url: data.active_question.audio_url,
              media_url: data.active_question.media_url
            })

            // Sync timer
            if (data.current_question_started_at) {
              const startedAtStr = data.current_question_started_at
              const ms = new Date(startedAtStr.endsWith('Z') ? startedAtStr : startedAtStr + 'Z').getTime()
              setStartedAtMs(ms)
              const elapsed = (Date.now() - ms) / 1000
              const limit = data.active_question.time_limit || 20
              const remaining = Math.max(0, Math.ceil(limit - elapsed))
              setTimeLeft(remaining)
              
              if (remaining === 0) {
                setRevealAnswer(true)
              } else {
                setRevealAnswer(false)
              }
            }
          }

          // Map distribution
          if (data.answer_distribution) {
            setDistribution(data.answer_distribution)
          }
      } catch (err) {
        console.error("Failed to fetch live session:", err)
      }
    }

    fetchLiveSession()

    // 1. Establish WebSocket for instant event-driven updates (zero log spam)
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
    const apiHost = baseUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1\/?$/, '')
    const wsUrl = `${wsProtocol}//${apiHost}/api/v1/ws/rooms/${roomCode}?nickname=Host&isHost=true${token ? `&token=${token}` : ''}`

    let socket: WebSocket | null = null
    let pingTimer: any = null
    let reconnectTimer: any = null
    let isDisposed = false
    let reconnectAttempt = 0

    const connectHostWS = () => {
      if (isDisposed) return
      try {
        socket = new WebSocket(wsUrl)
        socket.onopen = () => {
          reconnectAttempt = 0
          pingTimer = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: "PING" }))
            }
          }, 5000)
        }

        socket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data)
            if (msg.type === "PONG") return
            if (["ANSWER_SUBMITTED", "PLAYER_JOINED", "PLAYER_LEFT", "NEXT_QUESTION"].includes(msg.type)) {
              fetchLiveSession()
            }
          } catch (e) {
            console.error("Failed to parse WS message in Host Panel:", e)
          }
        }

        socket.onclose = () => {
          if (pingTimer) clearInterval(pingTimer)
          if (!isDisposed) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempt) + Math.random() * 500, 10000)
            reconnectAttempt += 1
            reconnectTimer = setTimeout(connectHostWS, delay)
          }
        }

        socket.onerror = () => {
          if (socket) socket.close()
        }
      } catch (e) {
        console.error("Failed to establish WS in Host Panel:", e)
        if (!isDisposed) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempt) + Math.random() * 500, 10000)
          reconnectAttempt += 1
          reconnectTimer = setTimeout(connectHostWS, delay)
        }
      }
    }

    connectHostWS()

    return () => {
      isDisposed = true
      if (pingTimer) clearInterval(pingTimer)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (socket) socket.close()
    }
  }, [state?.roomId, roomCode, navigate])

  // Host Countdown Timer Effect (Synced with server timestamp)
  useEffect(() => {
    if (showLeaderboardModal || !startedAtMs) {
      if (timeLeft <= 0) {
        setRevealAnswer(true)
      }
      return
    }

    const limit = activeQuestion.time_limit || 20

    const updateHostTimer = () => {
      const elapsed = (Date.now() - startedAtMs) / 1000
      const remaining = Math.max(0, Math.ceil(limit - elapsed))
      setTimeLeft(remaining)
      if (remaining === 0) {
        setRevealAnswer(true)
      }
    }

    updateHostTimer()
    const timer = setInterval(updateHostTimer, 250)

    return () => clearInterval(timer)
  }, [startedAtMs, showLeaderboardModal, activeQuestion])

  // Leaderboard Modal 5s Auto-advance countdown
  useEffect(() => {
    if (!showLeaderboardModal || !autoAdvance) {
      setLeaderboardTimeLeft(5)
      return
    }

    if (leaderboardTimeLeft <= 0) {
      proceedToNextQuestion()
      return
    }

    const timer = setInterval(() => {
      setLeaderboardTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [showLeaderboardModal, autoAdvance, leaderboardTimeLeft])

  // Auto Advance countdown clock trigger (if ON)
  useEffect(() => {
    if (timeLeft <= 0 && autoAdvance && !showLeaderboardModal) {
      const timer = setTimeout(() => {
        handleNextQuestion()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, autoAdvance, showLeaderboardModal, questionNumber])

  const answeredTotal = participants.filter(s => s.answered).length
  const pctAnswered = participants.length > 0 ? Math.round((answeredTotal / participants.length) * 100) : 0

  const proceedToNextQuestion = async () => {
    setShowLeaderboardModal(false)

    const token = localStorage.getItem('token')
    const activeRoomId = roomId || state?.roomId
    if (!activeRoomId || !token) {
      alert("Host session invalid or expired. Please re-enter room from Dashboard.")
      return
    }
    
    try {
      setRevealAnswer(false)
      await roomService.nextQuestion(activeRoomId)
    } catch (err) {
      console.error("Failed to advance question:", err)
      alert("Error advancing to the next question.")
    }
  }

  const handleNextQuestion = async () => {
    // Check if we should trigger the 3-question Leaderboard standings modal
    if (allowShowRank && questionNumber % 3 === 0 && questionNumber < totalQuestions && !showLeaderboardModal) {
      setLeaderboardTimeLeft(5)
      setShowLeaderboardModal(true)
      return
    }

    await proceedToNextQuestion()
  }

  const handleEndSession = async () => {
    const token = localStorage.getItem('token')
    const activeRoomId = roomId || state?.roomId
    if (!activeRoomId || !token) return

    const confirmClose = window.confirm("Are you sure you want to close this room? This will end the live session for all players.")
    if (!confirmClose) return

    try {
      await roomService.endRoom(activeRoomId)
      navigate('/dashboard')
    } catch (err) {
      console.error("Failed to close room:", err)
      alert("Error closing room session.")
    }
  }

  const getOptionColorProps = (key: string, isCorrect: boolean, isRevealed: boolean) => {
    let textStyle = 'text-slate-800'
    let keyBg = 'bg-slate-500'
    let barBg = 'bg-primary/20 border-primary/30 ring-2 ring-primary/5'

    if (isRevealed && isCorrect) {
      textStyle = 'text-emerald-800 font-black'
      keyBg = 'bg-emerald-500'
      barBg = 'bg-emerald-500/25 border-emerald-400 ring-2 ring-emerald-500/10'
      return { textStyle, keyBg, barBg }
    }

    switch (key) {
      case 'A':
        keyBg = 'bg-red-500'
        barBg = 'bg-red-500/20 border-red-300'
        textStyle = 'text-red-950 font-bold'
        break
      case 'B':
        keyBg = 'bg-blue-500'
        barBg = 'bg-blue-500/20 border-blue-300'
        textStyle = 'text-blue-950 font-bold'
        break
      case 'C':
        keyBg = 'bg-amber-500'
        barBg = 'bg-amber-500/20 border-amber-300'
        textStyle = 'text-amber-950 font-bold'
        break
      case 'D':
        keyBg = 'bg-emerald-500'
        barBg = 'bg-emerald-500/20 border-emerald-300'
        textStyle = 'text-emerald-950 font-bold'
        break
    }

    return { textStyle, keyBg, barBg }
  }

  return (
    <div className="w-full min-h-screen bg-[#f9f9ff] text-on-surface font-body-md relative overflow-hidden flex flex-col">
      {/* Background Dot Grid */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(#c3c0ff 1.2px, transparent 1.2px)',
          backgroundSize: '20px 20px',
          opacity: 0.35,
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 flex-grow flex flex-col w-full max-w-[1280px] mx-auto px-6 py-6 justify-between gap-6">
        
        {/* Top Control Bar */}
        <header className="bg-white rounded-2xl border-2 border-outline-variant/30 shadow-md p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border-2 border-primary/20">
              <BarChart2 className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-base font-black text-on-surface leading-tight">{quizTitle}</h1>
              <p className="text-[10px] text-slate-800 font-extrabold mt-0.5 uppercase tracking-wide">Host Dashboard • PIN: <strong className="text-primary font-black">{roomCode}</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Auto Advance Toggle */}
            <div className="flex items-center gap-3 bg-[#f5f5fa] border-2 border-outline-variant/30 px-4 py-2 rounded-xl text-xs font-black text-slate-800 shadow-sm">
              <span>Auto Advance:</span>
              <button
                type="button"
                onClick={() => handleAutoAdvanceChange(!autoAdvance)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoAdvance ? 'bg-primary' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoAdvance ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Active Members Count */}
            <div className="flex items-center gap-2 bg-[#eaeaff]/40 px-4 py-2 rounded-xl border-2 border-outline-variant/30 text-xs font-black text-slate-850 shadow-sm">
              <Users className="w-4 h-4 text-primary" />
              <span>{participants.length} Members Active</span>
            </div>

            {/* Countdown Clock */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-xs font-black transition-all ${
              timeLeft <= 5 ? 'bg-error-container/30 border-error text-error animate-pulse shadow-sm' : 'bg-primary/10 border-primary text-primary shadow-sm'
            }`}>
              <Clock className="w-4 h-4 animate-spin-slow" />
              <span>{timeLeft > 0 ? `${timeLeft}s left` : 'Time Up!'}</span>
            </div>

            {/* Exit to Dashboard (Keep Room Running) */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all border-2 border-slate-300 text-xs font-black shadow-sm cursor-pointer"
              title="Return to Dashboard while keeping this live room running"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>

            {/* End session block */}
            <button
              onClick={handleEndSession}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all border-2 border-red-300 text-xs font-black shadow-md cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> End Room
            </button>
          </div>
        </header>

        {/* Dashboard Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
          
          {/* LEFT COLUMN: Question and Answers Statistics (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Active Question Box */}
            <div className="bg-white rounded-3xl p-6 border-2 border-outline-variant/30 shadow-md text-left flex flex-col justify-between">
              <div className="flex justify-between items-center mb-3">
                <span className="bg-primary text-white px-3.5 py-1 rounded-full text-xs font-black shadow-sm">
                  Question {questionNumber} of {totalQuestions}
                </span>
                <span className="text-xs text-slate-700 font-extrabold">
                  Type: {activeQuestion.type === 'SHORT_ANSWER' ? 'Short Answer' : 'Multiple Choice'}
                </span>
              </div>
              <h2 className="font-headline-md text-lg md:text-xl font-black text-on-surface leading-relaxed mb-4">
                {activeQuestion.text}
              </h2>

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
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Audio Track</span>
                  <audio 
                    src={activeQuestion.audio_url} 
                    controls 
                    className="w-full max-w-sm"
                  />
                </div>
              )}
            </div>

            {/* Live Chart Distribution */}
            <div className="bg-white rounded-3xl p-6 border-2 border-outline-variant/30 shadow-md flex-grow flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-headline-md text-sm font-extrabold text-on-surface">Live Answer Analytics</h3>
                  <p className="text-[10px] text-slate-800 font-bold mt-0.5">Real-time answers distribution chart</p>
                </div>
                <button
                  onClick={() => setRevealAnswer(!revealAnswer)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-100 hover:bg-amber-200 border-2 border-amber-350 text-amber-955 transition-all rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  {revealAnswer ? (
                    <><EyeOff className="w-3.5 h-3.5" /> Hide Correct Option</>
                  ) : (
                    <><Eye className="w-3.5 h-3.5" /> Show Correct Option</>
                  )}
                </button>
              </div>

              {/* Bar Chart Bars / Short Answer Text Grid */}
              {activeQuestion.type === 'SHORT_ANSWER' ? (
                <div className="flex flex-col gap-4 text-left overflow-y-auto max-h-[300px] pr-2">
                  {Object.entries(distribution).length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-extrabold italic text-sm">
                      No text answers submitted yet.
                    </div>
                  ) : (
                    Object.entries(distribution)
                      .sort((a, b) => b[1] - a[1])
                      .map(([answer, count], idx) => {
                        const maxCount = Math.max(...Object.values(distribution), 1)
                        const percentWidth = Math.round((count / maxCount) * 100)
                        
                        // Short answer is correct if it matches any correct option from DB
                        const isCorrect = activeQuestion.options.some(
                          opt => opt.label.trim().toLowerCase() === answer.trim().toLowerCase()
                        )

                        return (
                          <div key={idx} className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs font-black">
                              <span className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                                  isCorrect && revealAnswer ? 'bg-emerald-500' : 'bg-slate-400'
                                } shadow-sm`}>
                                  {idx + 1}
                                </span>
                                <span className={`text-sm ${
                                  isCorrect && revealAnswer ? 'text-emerald-800 font-black' : 'text-slate-800'
                                }`}>
                                  "{answer}" {(isCorrect && revealAnswer) && (
                                    <span className="text-[9px] bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded-full border border-emerald-350 font-black ml-2">CORRECT</span>
                                  )}
                                </span>
                              </span>
                              <span className="text-slate-800 font-extrabold">{count} responses</span>
                            </div>

                            {/* Response Bar representation */}
                            <div className="w-full bg-[#f3f3f9] h-7 rounded-xl overflow-hidden border border-outline-variant/30 relative flex items-center shadow-inner">
                              <div
                                className={`h-full transition-all duration-500 rounded-r-xl border-r-2 ${
                                  isCorrect && revealAnswer 
                                    ? 'bg-emerald-500/25 border-emerald-450 ring-2 ring-emerald-500/5 animate-pulse'
                                    : 'bg-slate-500/10 border-slate-400'
                                }`}
                                style={{ width: `${percentWidth}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {activeQuestion.options.map((opt) => {
                    const count = distribution[opt.key as keyof typeof distribution] || 0
                    const maxCount = Math.max(...Object.values(distribution), 1)
                    const percentWidth = Math.round((count / maxCount) * 100)
                    const isCorrectOption = opt.key === activeQuestion.correctKey
                    
                    const colors = getOptionColorProps(opt.key, isCorrectOption, revealAnswer)

                    return (
                      <div key={opt.key} className="flex flex-col gap-1.5 text-left">
                        <div className="flex justify-between items-center text-xs font-extrabold">
                          <span className={`flex items-center gap-2 ${colors.textStyle}`}>
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white ${colors.keyBg} shadow-md`}>
                              {opt.key}
                            </span>
                            {opt.label} {(revealAnswer && isCorrectOption) && '✓ (Correct)'}
                          </span>
                          <span className="text-slate-800 font-black">{count} answers</span>
                        </div>

                        {/* Bar body */}
                        <div className="h-6.5 w-full bg-slate-100 border-2 border-outline-variant/30 rounded-lg overflow-hidden relative flex items-center">
                          <div 
                            className={`h-full transition-all duration-500 rounded-r-md border-r-2 ${colors.barBg}`}
                            style={{ width: `${percentWidth}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Progress Summary info */}
              <div className="mt-6 pt-4 border-t-2 border-outline-variant/20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800">Response Status:</span>
                  <span className="text-xs text-primary font-black bg-primary/5 border border-primary/20 px-2.5 py-1 rounded-full shadow-inner">{answeredTotal} / {participants.length} Responded</span>
                </div>

                <div className="w-1/3 bg-slate-200 h-2.5 rounded-full overflow-hidden border border-outline-variant shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 rounded-full"
                    style={{ width: `${pctAnswered}%` }}
                  />
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Active Roster Status (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 border-2 border-outline-variant/30 shadow-md flex flex-col justify-between max-h-[500px]">
            <div className="mb-4">
              <h3 className="font-headline-md text-sm font-extrabold text-on-surface">Participant Roster</h3>
              <p className="text-[10px] text-slate-850 font-bold mt-0.5">Submissions tracking</p>
            </div>

            <div className="flex-grow overflow-y-auto flex flex-col gap-2.5 pr-1.5">
              {participants.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold text-xs italic">
                  No players in the room.
                </div>
              ) : (
                <>
                  {participants.slice(0, 50).map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-3 rounded-xl border border-outline-variant bg-surface-container-lowest/30 shadow-xs">
                      <span className="text-xs font-black text-slate-850 truncate max-w-[150px]">
                        {p.name}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-600 font-extrabold">{Math.round(p.score)} pts</span>
                        {p.answered ? (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Answered
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                            Thinking...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {participants.length > 50 && (
                    <div className="py-2 text-center text-xs font-extrabold text-primary bg-primary/5 rounded-xl border border-primary/20">
                      + {participants.length - 50} more active participants
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Advance Bar Footer */}
            <div className="mt-4 pt-4 border-t-2 border-outline-variant/20">
              <button
                onClick={handleNextQuestion}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-button text-sm font-extrabold hover:shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer shadow-md"
              >
                {questionNumber >= totalQuestions ? (
                  <>End Quiz Session <Award className="w-4 h-4" /></>
                ) : (
                  <>Advance Next Question <ChevronRight className="w-4.5 h-4.5" /></>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 3-Question Round Leaderboard Standings Modal */}
      {showLeaderboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-primary/20 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-primary via-indigo-600 to-secondary text-white flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  Round {Math.floor(questionNumber / 3)} Standings
                </span>
                <h3 className="font-extrabold text-xl flex items-center gap-2 mt-1">
                  <Award className="w-6 h-6 text-amber-300 fill-amber-300" /> Leaderboard Standings (Q{questionNumber})
                </h3>
                <p className="text-xs text-indigo-100 mt-0.5">Current top rankings after completing round</p>
              </div>
              {autoAdvance && (
                <div className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-2xl flex items-center gap-2 text-xs font-black">
                  <Clock className="w-4 h-4 animate-spin-slow" />
                  <span>Auto-next: {leaderboardTimeLeft}s</span>
                </div>
              )}
            </div>

            {/* Leaderboard Roster Body */}
            <div className="p-6 overflow-y-auto flex-grow space-y-3">
              {participants.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-bold text-xs italic">
                  No player standings available.
                </div>
              ) : (
                participants
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((p, idx) => {
                    let rankBadge = `${idx + 1}`
                    let bgStyle = 'bg-surface-container-lowest border-outline-variant/30'
                    let rankBg = 'bg-slate-200 text-slate-700'
                    
                    if (idx === 0) {
                      rankBadge = '🥇 1st'
                      bgStyle = 'bg-amber-50/70 border-amber-300 shadow-xs'
                      rankBg = 'bg-amber-400 text-slate-900 font-black'
                    } else if (idx === 1) {
                      rankBadge = '🥈 2nd'
                      bgStyle = 'bg-slate-50 border-slate-300'
                      rankBg = 'bg-slate-300 text-slate-800 font-black'
                    } else if (idx === 2) {
                      rankBadge = '🥉 3rd'
                      bgStyle = 'bg-amber-900/5 border-amber-700/30'
                      rankBg = 'bg-amber-700 text-white font-black'
                    }

                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${bgStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold ${rankBg}`}>
                            {rankBadge}
                          </span>
                          <span className="font-extrabold text-sm text-on-surface truncate max-w-[150px]">
                            {p.name}
                          </span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getBadgeStyle(getPlayerBadge(p.name, p.equipped_title))}`}>
                            🏆 {getPlayerBadge(p.name, p.equipped_title)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            {Math.round(p.score)} pts
                          </span>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center flex-shrink-0">
              <span className="text-xs text-slate-500 font-bold">
                Question {questionNumber} of {totalQuestions} completed
              </span>
              <button
                onClick={proceedToNextQuestion}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                Continue to Question {questionNumber + 1} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
