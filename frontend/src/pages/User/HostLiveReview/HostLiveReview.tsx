import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users, Clock, Play, Award, Eye, EyeOff, CheckCircle2, ChevronRight, BarChart2, LogOut, Flame, ArrowLeft, Mic, MicOff, MessageSquare, ThumbsUp, HelpCircle } from 'lucide-react'
import { roomService } from '@/services'
import { getPlayerBadge, getBadgeStyle } from '@/utils/badgeHelper'
import { useHostAudioStream, QAChatBox, TopVotedQuestionsList, ChatMessage, QuestionVoteItem } from '@/features/QA'

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

  // Q&A & Voting states
  const [isQAMode, setIsQAMode] = useState(false)
  const [topVotedQuestions, setTopVotedQuestions] = useState<QuestionVoteItem[]>([])
  const [currentQAQuestionId, setCurrentQAQuestionId] = useState<number | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [wsSocket, setWsSocket] = useState<WebSocket | null>(null)

  const { isMicOn, toggleMic, micError } = useHostAudioStream({
    socket: wsSocket,
    isConnected: !!wsSocket && wsSocket.readyState === WebSocket.OPEN,
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

          if (data.top_voted_questions) {
            setTopVotedQuestions(data.top_voted_questions)
          }

          if (data.chat_messages && Array.isArray(data.chat_messages)) {
            setChatMessages(data.chat_messages)
          }

          if (data.qa_state) {
            if (data.qa_state.is_active) setIsQAMode(true)
            if (data.qa_state.current_question_id) setCurrentQAQuestionId(data.qa_state.current_question_id)
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
          setWsSocket(socket)
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
            if (msg.type === "QUESTION_VOTED") {
              if (msg.top_questions) setTopVotedQuestions(msg.top_questions)
            }
            if (msg.type === "QA_SESSION_STARTED") {
              setIsQAMode(true)
              if (msg.current_question_id) setCurrentQAQuestionId(msg.current_question_id)
            }
            if (msg.type === "QA_QUESTION_CHANGED") {
              if (msg.current_question_id) setCurrentQAQuestionId(msg.current_question_id)
            }
            if (msg.type === "CHAT_MESSAGE_RECEIVED" || msg.t === "CMR") {
              const msgText = msg.text || msg.message || ""
              const msgSender = msg.sender || "User"
              if (msgText) {
                setChatMessages((prev) => {
                  const isDup = prev.some(
                    (m) => m.sender === msgSender && m.text === msgText && (!msg.timestamp || !m.timestamp || m.timestamp === msg.timestamp)
                  )
                  if (isDup) return prev
                  return [...prev, { sender: msgSender, text: msgText, avatar: msg.avatar, timestamp: msg.timestamp }]
                })
              }
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

  const handleStartQA = async () => {
    setIsQAMode(true)
    if (wsSocket && wsSocket.readyState === WebSocket.OPEN) {
      try {
        wsSocket.send(JSON.stringify({ type: "START_QA_SESSION", t: "SQS" }))
      } catch (wsErr) {
        console.warn("WebSocket START_QA_SESSION failed, using REST fallback:", wsErr)
      }
    }
    try {
      const res = await roomService.startQA(roomCode)
      if (res.top_voted_questions) setTopVotedQuestions(res.top_voted_questions)
      if (res.qa_state?.current_question_id) setCurrentQAQuestionId(res.qa_state.current_question_id)
    } catch (err) {
      console.error("Failed to start QA mode via HTTP REST:", err)
    }
  }

  const handleNextQAQuestion = async (targetQId?: number) => {
    let nextId = targetQId
    if (!nextId && topVotedQuestions.length > 0) {
      const currentIdx = topVotedQuestions.findIndex(q => String(q.question_id) === String(currentQAQuestionId))
      if (currentIdx !== -1 && currentIdx + 1 < topVotedQuestions.length) {
        nextId = topVotedQuestions[currentIdx + 1].question_id
      } else {
        nextId = topVotedQuestions[0].question_id
      }
    }
    if (!nextId) return

    setCurrentQAQuestionId(nextId)
    if (wsSocket && wsSocket.readyState === WebSocket.OPEN) {
      try {
        wsSocket.send(JSON.stringify({ type: "NEXT_QA_QUESTION", t: "NQQ", question_id: nextId }))
      } catch (e) {}
    }
    try {
      await roomService.selectQAQuestion(roomCode, nextId)
    } catch (e) {}
  }

  const handleSendChatMessage = async (msgContent: string) => {
    const text = msgContent.trim()
    if (!text) return

    let sentViaWS = false
    if (wsSocket && wsSocket.readyState === WebSocket.OPEN) {
      try {
        wsSocket.send(JSON.stringify({ type: "SEND_CHAT_MESSAGE", t: "SCM", sender: "Host", message: text }))
        sentViaWS = true
      } catch (wsErr) {
        console.warn("WebSocket send chat message failed, using REST fallback:", wsErr)
      }
    }

    if (!sentViaWS) {
      try {
        const res = await roomService.sendChatMessage(roomCode, "Host", text)
        if (res && res.text) {
          setChatMessages((prev) => {
            const isDuplicate = prev.some(
              (m) => m.text === res.text && m.sender === "Host"
            )
            if (isDuplicate) return prev
            return [...prev, { sender: "Host", text: res.text, avatar: res.avatar, timestamp: res.timestamp }]
          })
        }
      } catch (err) {
        console.error("Failed to send chat message via REST API:", err)
      }
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
      <div className="relative z-10 flex-grow flex flex-col w-full max-w-[1340px] mx-auto px-3 sm:px-6 py-4 sm:py-6 justify-between gap-4 sm:gap-6">
        
        {/* Top Control Bar */}
        <header className="bg-white/90 backdrop-blur-xl rounded-3xl border-2 border-slate-200/80 shadow-lg p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 transition-all">
          {/* Top Row: Title + PIN + Action buttons */}
          <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-100 sm:border-none sm:pb-0">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-primary/20 flex-shrink-0">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight line-clamp-1">{quizTitle}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Host Dashboard</span>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(roomCode).catch(() => {})
                      alert(`Room PIN ${roomCode} copied to clipboard!`)
                    }}
                    className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-2.5 py-0.5 rounded-full font-black text-xs border border-primary/20 cursor-pointer"
                    title="Click to copy PIN"
                  >
                    PIN: {roomCode}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              {/* Start Q&A Mode Button (Only enabled after completing all quiz questions) */}
              <button
                disabled={questionNumber < totalQuestions && !isQAMode}
                onClick={() => (isQAMode ? setIsQAMode(false) : handleStartQA())}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  isQAMode
                    ? 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-700 cursor-pointer active:scale-98'
                    : questionNumber >= totalQuestions
                    ? 'bg-gradient-to-r from-indigo-600 via-primary to-purple-600 text-white hover:opacity-95 shadow-md shadow-indigo-500/20 cursor-pointer active:scale-98'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                }`}
                title={questionNumber < totalQuestions && !isQAMode ? 'Finish all quiz questions first to start Q&A' : 'Start live Q&A session'}
              >
                <HelpCircle className="w-4 h-4" />
                <span>{isQAMode ? 'Quiz View' : questionNumber >= totalQuestions ? 'Start Q&A' : 'Q&A (Finish Quiz First)'}</span>
              </button>

              {/* Exit to Dashboard */}
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1 px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all rounded-xl border border-slate-250 text-xs font-black shadow-xs cursor-pointer active:scale-98"
                title="Return to Dashboard while keeping this live room running"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Dashboard</span>
              </button>

              {/* End session block */}
              <button
                onClick={handleEndSession}
                className="flex items-center gap-1 px-3.5 py-2 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 transition-all border border-rose-200 text-xs font-black shadow-xs cursor-pointer active:scale-98"
              >
                <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">End Room</span>
              </button>
            </div>
          </div>

          {/* Bottom Status Row (Auto Advance + Members + Clock) */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-4 pt-1 sm:pt-0 border-t border-slate-100/80">
            {/* Auto Advance Toggle */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold text-slate-700 shadow-2xs">
              <span>Auto Advance:</span>
              <button
                type="button"
                onClick={() => handleAutoAdvanceChange(!autoAdvance)}
                className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoAdvance ? 'bg-primary' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoAdvance ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Active Members Count */}
            <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 sm:py-2 rounded-xl border border-emerald-200 text-xs font-extrabold text-emerald-800 shadow-2xs">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>{participants.length} Active</span>
            </div>

            {/* Countdown Clock */}
            <div className={`flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl border text-xs font-black transition-all ${
              timeLeft <= 5 ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse shadow-xs' : 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
            }`}>
              <Clock className="w-4 h-4 animate-spin-slow" />
              <span>{timeLeft > 0 ? `${timeLeft}s left` : 'Time Up!'}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Grid Content */}
        {isQAMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 flex-grow">
            {/* Left 8 Cols: Active Q&A Question + Top Voted Questions List */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Active Q&A Question Hero Box */}
              <div className="bg-white rounded-3xl p-6 border-2 border-indigo-100 shadow-lg text-left flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-3.5">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <h2 className="font-extrabold text-slate-800 text-sm">Currently Addressing Question</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Voice Mic Toggle Button */}
                    <button
                      onClick={toggleMic}
                      className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-98 ${
                        isMicOn
                          ? 'bg-rose-600 text-white animate-pulse border border-rose-700'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                      }`}
                      title={isMicOn ? 'Stop voice mic streaming' : 'Stream live microphone audio to members'}
                    >
                      {isMicOn ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>{isMicOn ? 'Mic Live (ON)' : 'Voice Mic'}</span>
                    </button>

                    <button
                      onClick={() => handleNextQAQuestion()}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer active:scale-98"
                    >
                      Next Question <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {currentQAQuestionId ? (() => {
                  const activeQAQ = topVotedQuestions.find((q) => String(q.question_id) === String(currentQAQuestionId))
                  const text = activeQAQ?.text || `Question #${currentQAQuestionId}`
                  const mediaUrl = activeQAQ?.media_url || null
                  const audioUrl = activeQAQ?.audio_url || null
                  const options = activeQAQ?.options || []

                  return (
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 w-fit">
                        Question #{currentQAQuestionId}
                      </span>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                        {text}
                      </h3>

                      {/* Optional Question Media Image */}
                      {mediaUrl && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-2xs max-h-52 w-full bg-slate-50 flex items-center justify-center">
                          <img src={mediaUrl} alt="Question Media" className="max-h-52 object-contain w-full" />
                        </div>
                      )}

                      {/* Optional Question Audio Player */}
                      {audioUrl && (
                        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                          <audio controls src={audioUrl} className="w-full h-10 rounded-xl" />
                        </div>
                      )}

                      {/* Question Answer Options Grid */}
                      {options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
                          {options.map((opt: any) => (
                            <div
                              key={opt.key || opt.id}
                              className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-between gap-2 shadow-2xs ${
                                opt.is_correct
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 ring-1 ring-emerald-400/30'
                                  : 'bg-slate-50 border-slate-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center flex-shrink-0 shadow-2xs ${
                                  opt.is_correct
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-700 text-white'
                                }`}>
                                  {opt.key}
                                </span>
                                <span className="truncate">{opt.label || opt.content}</span>
                              </div>
                              {opt.is_correct && (
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex-shrink-0">
                                  Correct
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })() : (
                  <div className="py-6 text-center text-slate-500 font-semibold text-xs">
                    Select a top-voted question below or click "Next Question" to start answering.
                  </div>
                )}
              </div>

              {/* Top Voted Questions List */}
              <TopVotedQuestionsList
                questions={topVotedQuestions}
                currentActiveQuestionId={currentQAQuestionId}
                isHost={true}
                onSelectQuestion={(qid) => handleNextQAQuestion(qid)}
              />
            </div>

            {/* Right 4 Cols: Live Q&A Chat Box */}
            <div className="lg:col-span-4 flex flex-col gap-4 h-[580px]">
              {/* End Q&A Session CTA */}
              <div className="bg-white rounded-3xl p-4 border-2 border-rose-100 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">Q&A Active</span>
                  <p className="text-xs text-slate-600 font-bold mt-1">Finished answering questions?</p>
                </div>
                <button
                  onClick={handleEndSession}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <LogOut className="w-4 h-4" /> End Room
                </button>
              </div>

              <div className="flex-grow">
                <QAChatBox
                  messages={chatMessages}
                  onSendMessage={handleSendChatMessage}
                  currentNickname="Host"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 flex-grow">
          
          {/* LEFT COLUMN: Question and Answers Statistics (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5 sm:gap-6">
            
            {/* Active Question Box */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200/80 shadow-lg text-left flex flex-col justify-between transition-all">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                <span className="bg-gradient-to-r from-primary to-indigo-600 text-white px-3.5 py-1 rounded-full text-xs font-black shadow-xs">
                  Question {questionNumber} of {totalQuestions}
                </span>
                <span className="text-xs text-slate-600 font-black bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Type: {activeQuestion.type === 'SHORT_ANSWER' ? 'Short Answer' : 'Multiple Choice'}
                </span>
              </div>
              <h2 className="font-headline-md text-base sm:text-lg md:text-xl font-black text-slate-900 leading-snug sm:leading-relaxed mb-4">
                {activeQuestion.text}
              </h2>

              {activeQuestion.media_url && (
                <div className="w-full flex justify-center mb-4">
                  {activeQuestion.media_url.match(/\.(mp4|webm|ogg|mov)$/i) || activeQuestion.media_url.includes('/video/upload/') ? (
                    <video 
                      src={activeQuestion.media_url} 
                      controls 
                      className="max-h-48 sm:max-h-64 rounded-2xl border border-slate-200 shadow-xs object-cover"
                    />
                  ) : (
                    <img 
                      src={activeQuestion.media_url} 
                      alt="Question Media" 
                      className="max-h-48 sm:max-h-64 object-contain rounded-2xl border border-slate-200 shadow-xs"
                    />
                  )}
                </div>
              )}

              {activeQuestion.audio_url && (
                <div className="w-full flex flex-col items-center gap-2 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Audio Track</span>
                  <audio 
                    src={activeQuestion.audio_url} 
                    controls 
                    className="w-full max-w-sm h-9"
                  />
                </div>
              )}
            </div>

            {/* Live Chart Distribution */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200/80 shadow-lg flex-grow flex flex-col justify-between">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4 sm:mb-6">
                <div>
                  <h3 className="font-headline-md text-sm sm:text-base font-extrabold text-slate-900">Live Answer Analytics</h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">Real-time answer distribution breakdown</p>
                </div>
                <button
                  onClick={() => setRevealAnswer(!revealAnswer)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 transition-all rounded-xl text-xs font-black shadow-2xs cursor-pointer active:scale-98"
                >
                  {revealAnswer ? (
                    <><EyeOff className="w-3.5 h-3.5 text-amber-700" /> Hide Correct</>
                  ) : (
                    <><Eye className="w-3.5 h-3.5 text-amber-700" /> Show Correct</>
                  )}
                </button>
              </div>

              {/* Bar Chart Bars / Short Answer Text Grid */}
              {activeQuestion.type === 'SHORT_ANSWER' ? (
                <div className="flex flex-col gap-3.5 text-left overflow-y-auto max-h-[260px] sm:max-h-[310px] pr-1.5">
                  {Object.entries(distribution).length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-extrabold italic text-xs sm:text-sm">
                      No text answers submitted yet.
                    </div>
                  ) : (
                    Object.entries(distribution)
                      .sort((a, b) => b[1] - a[1])
                      .map(([answer, count], idx) => {
                        const maxCount = Math.max(...Object.values(distribution), 1)
                        const percentWidth = Math.round((count / maxCount) * 100)
                        
                        const isCorrect = activeQuestion.options.some(
                          opt => opt.label.trim().toLowerCase() === answer.trim().toLowerCase()
                        )

                        return (
                          <div key={idx} className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs font-black">
                              <span className="flex items-center gap-2 truncate max-w-[80%]">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                                  isCorrect && revealAnswer ? 'bg-emerald-500' : 'bg-slate-400'
                                } shadow-xs flex-shrink-0`}>
                                  {idx + 1}
                                </span>
                                <span className={`text-xs sm:text-sm truncate ${
                                  isCorrect && revealAnswer ? 'text-emerald-800 font-black' : 'text-slate-800'
                                }`}>
                                  "{answer}" {(isCorrect && revealAnswer) && (
                                    <span className="text-[9px] bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded-full border border-emerald-300 font-black ml-1.5">CORRECT</span>
                                  )}
                                </span>
                              </span>
                              <span className="text-slate-800 font-extrabold text-xs flex-shrink-0">{count} ans</span>
                            </div>

                            {/* Response Bar representation */}
                            <div className="w-full bg-slate-100 h-7 sm:h-8 rounded-xl overflow-hidden border border-slate-200 relative flex items-center shadow-inner">
                              <div
                                className={`h-full transition-all duration-500 rounded-r-xl border-r-2 ${
                                  isCorrect && revealAnswer 
                                    ? 'bg-emerald-500/25 border-emerald-500 ring-2 ring-emerald-500/10 animate-pulse'
                                    : 'bg-slate-500/15 border-slate-400'
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
                <div className="flex flex-col gap-3.5">
                  {activeQuestion.options.map((opt) => {
                    const count = distribution[opt.key as keyof typeof distribution] || 0
                    const maxCount = Math.max(...Object.values(distribution), 1)
                    const percentWidth = Math.round((count / maxCount) * 100)
                    const isCorrectOption = opt.key === activeQuestion.correctKey
                    
                    const colors = getOptionColorProps(opt.key, isCorrectOption, revealAnswer)

                    return (
                      <div key={opt.key} className="flex flex-col gap-1.5 text-left">
                        <div className="flex justify-between items-center text-xs font-extrabold">
                          <span className={`flex items-center gap-2 truncate max-w-[80%] ${colors.textStyle}`}>
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white ${colors.keyBg} shadow-xs flex-shrink-0`}>
                              {opt.key}
                            </span>
                            <span className="truncate text-xs sm:text-sm font-bold">{opt.label}</span> {(revealAnswer && isCorrectOption) && <span className="text-[11px] text-emerald-700 font-black ml-1 flex-shrink-0">✓ Correct</span>}
                          </span>
                          <span className="text-slate-800 font-black text-xs flex-shrink-0">{count} ans</span>
                        </div>

                        {/* Bar body */}
                        <div className="h-6 sm:h-7 w-full bg-slate-100 border border-slate-200/80 rounded-xl overflow-hidden relative flex items-center shadow-inner">
                          <div 
                            className={`h-full transition-all duration-500 rounded-r-lg border-r-2 ${colors.barBg}`}
                            style={{ width: `${percentWidth}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Progress Summary info */}
              <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800">Response Status:</span>
                  <span className="text-xs text-primary font-black bg-primary/10 border border-primary/20 px-3 py-1 rounded-full shadow-inner">
                    {answeredTotal} / {participants.length} Responded
                  </span>
                </div>

                <div className="w-full sm:w-1/3 bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-300 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary via-indigo-600 to-purple-600 transition-all duration-300 rounded-full"
                    style={{ width: `${pctAnswered}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Top Voted Questions Live Panel for Host */}
            <TopVotedQuestionsList
              questions={topVotedQuestions}
              currentActiveQuestionId={activeQuestion?.id}
              isHost={false}
            />

          </div>

          {/* RIGHT COLUMN: Host Controls & Active Roster Status (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Primary Action Card: Next Question CTA or Quiz Completed Choices */}
            <div className="bg-white rounded-3xl p-5 border-2 border-indigo-100 shadow-lg text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Host Control Action</span>
                <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  Q{questionNumber} / {totalQuestions}
                </span>
              </div>
              
              {questionNumber >= totalQuestions ? (
                <div className="flex flex-col gap-2.5">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl mb-1">
                    <span className="text-[11px] font-black text-indigo-900 block">🎉 Quiz Questions Finished!</span>
                    <span className="text-[10px] text-indigo-700 font-extrabold">Choose to start Q&A or end the live room session:</span>
                  </div>

                  <button
                    onClick={handleStartQA}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-primary to-purple-600 text-white rounded-2xl font-button text-xs font-black hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer shadow-md shadow-indigo-500/25"
                  >
                    <HelpCircle className="w-4 h-4" /> Start Q&A Session
                  </button>

                  <button
                    onClick={handleEndSession}
                    className="w-full py-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-2xl font-button text-xs font-black transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer shadow-xs"
                  >
                    <LogOut className="w-4 h-4" /> End Room Session
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-4 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 text-white rounded-2xl font-button text-sm font-black hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer shadow-md shadow-indigo-500/25"
                >
                  Advance Next Question <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Participant Roster Card */}
            <div className="bg-white rounded-3xl p-5 border-2 border-slate-200/80 shadow-lg flex flex-col justify-between flex-grow max-h-[520px]">
              <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-headline-md text-sm font-extrabold text-slate-900">Participant Roster</h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">Live submission status</p>
                </div>
                <span className="text-xs font-black bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                  {participants.length} Total
                </span>
              </div>

              <div className="flex-grow overflow-y-auto flex flex-col gap-2.5 pr-1">
                {participants.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-bold text-xs italic">
                    No players in the room yet.
                  </div>
                ) : (
                  <>
                    {participants.slice(0, 50).map((p) => (
                      <div key={p.id} className="flex justify-between items-center p-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 shadow-2xs hover:bg-slate-100/80 transition-all">
                        <span className="text-xs font-black text-slate-900 truncate max-w-[130px] sm:max-w-[150px]">
                          {p.name}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-600 font-extrabold">{Math.round(p.score)} pts</span>
                          {p.answered ? (
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              Answered
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 border border-slate-300 px-2 py-0.5 rounded-full">
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
            </div>
          </div>

        </div>
      )}

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
