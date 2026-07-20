import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users, Clock, Play, Award, Eye, EyeOff, CheckCircle2, ChevronRight, BarChart2, LogOut, Flame } from 'lucide-react'

interface StudentAnswerState {
  id: string
  name: string
  answered: boolean
  answerKey: string | null
  streak: number
  score: number
}

interface QuestionDetails {
  id: number
  text: string
  options: { key: string; label: string }[]
  correctKey: string
}

const MOCK_QUESTIONS: Record<number, QuestionDetails> = {
  1: {
    id: 1,
    text: 'Which hook should you use to optimize performance by caching the result of a calculation between re-renders?',
    options: [
      { key: 'A', label: 'useEffect' },
      { key: 'B', label: 'useMemo' },
      { key: 'C', label: 'useCallback' },
      { key: 'D', label: 'useRef' }
    ],
    correctKey: 'B'
  },
  2: {
    id: 2,
    text: 'Which HTML5 tag is used to natively embed video player files in a web page?',
    options: [
      { key: 'A', label: '<media>' },
      { key: 'B', label: '<embed>' },
      { key: 'C', label: '<video>' },
      { key: 'D', label: '<play>' }
    ],
    correctKey: 'C'
  },
  3: {
    id: 3,
    text: 'What is the default main axis direction of items in a CSS Flexbox container?',
    options: [
      { key: 'A', label: 'column' },
      { key: 'B', label: 'row' },
      { key: 'C', label: 'grid' },
      { key: 'D', label: 'align-items' }
    ],
    correctKey: 'B'
  }
}

export const HostLiveReview: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // State variables passed from Lobby
  const state = location.state as { roomCode?: string; quizTitle?: string } | null
  const roomCode = state?.roomCode || '823914'
  const quizTitle = state?.quizTitle || 'Advanced Web Fundamentals Quiz'

  // Host Control States
  const [questionNumber, setQuestionNumber] = useState(1)
  const [timeLeft, setTimeLeft] = useState(20)
  const [revealAnswer, setRevealAnswer] = useState(false)
  const [students, setStudents] = useState<StudentAnswerState[]>([
    { id: '1', name: 'SpeedRunner', answered: false, answerKey: null, streak: 4, score: 3200 },
    { id: '2', name: 'SarahM', answered: false, answerKey: null, streak: 2, score: 2800 },
    { id: '3', name: 'Alex Johnson', answered: false, answerKey: null, streak: 3, score: 2400 },
    { id: '4', name: 'DevPro', score: 2200, streak: 1, answered: false, answerKey: null },
    { id: '5', name: 'Lara Croft', score: 1950, streak: 0, answered: false, answerKey: null },
    { id: '6', name: 'BugHunter', score: 1800, streak: 1, answered: false, answerKey: null },
    { id: '7', name: 'FlexboxKing', score: 1500, streak: 0, answered: false, answerKey: null }
  ])

  const activeQuestion = MOCK_QUESTIONS[((questionNumber - 1) % 3) + 1]

  // Simulate students answering in real time
  useEffect(() => {
    // Reset answers
    setStudents(prev => prev.map(s => ({ ...s, answered: false, answerKey: null })))
    setTimeLeft(20)
    setRevealAnswer(false)

    // Interval to randomly make students answer
    let answeredCount = 0
    const interval = setInterval(() => {
      setStudents(prev => {
        const thinkingStudents = prev.filter(s => !s.answered)
        if (thinkingStudents.length === 0) {
          clearInterval(interval)
          return prev
        }

        // Pick a random thinking student and assign an answer
        const randomStudent = thinkingStudents[Math.floor(Math.random() * thinkingStudents.length)]
        const randomKeys = ['A', 'B', 'C', 'D']
        // 70% chance to choose the correct key
        const chosenKey = Math.random() < 0.7 ? activeQuestion.correctKey : randomKeys[Math.floor(Math.random() * 4)]

        return prev.map(s => {
          if (s.id === randomStudent.id) {
            return { ...s, answered: true, answerKey: chosenKey }
          }
          return s
        })
      })

      answeredCount++
      if (answeredCount >= students.length) {
        clearInterval(interval)
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [questionNumber])

  // Countdown clock effect
  useEffect(() => {
    if (timeLeft <= 0) {
      setRevealAnswer(true)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Calculate answer counts for distribution chart
  const getAnswerDistribution = () => {
    const counts = { A: 0, B: 0, C: 0, D: 0 }
    students.forEach(s => {
      if (s.answered && s.answerKey) {
        counts[s.answerKey as keyof typeof counts]++
      }
    })
    return counts
  }

  const distribution = getAnswerDistribution()
  const answeredTotal = students.filter(s => s.answered).length
  const pctAnswered = Math.round((answeredTotal / students.length) * 100)

  const handleNextQuestion = () => {
    if (questionNumber >= 3) {
      // Game ended, return to dashboard
      alert('Game session completed! Redirecting back to host Dashboard.')
      navigate('/dashboard')
    } else {
      setQuestionNumber(prev => prev + 1)
    }
  }

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this live session? All progress will be cleared.')) {
      navigate('/dashboard')
    }
  }

  // Get option color code to draw colorful distribution bars (A: Red, B: Blue, C: Yellow, D: Green)
  const getOptionColorProps = (key: string, isCorrect: boolean, isRevealed: boolean) => {
    const defaultColor = 'bg-slate-400'
    let textStyle = 'text-slate-900'
    let barBg = 'bg-primary/20 border-primary/30'
    let keyBg = defaultColor

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
            {/* Active Members Count */}
            <div className="flex items-center gap-2 bg-[#eaeaff]/40 px-4 py-2 rounded-xl border-2 border-outline-variant/30 text-xs font-black text-slate-850 shadow-sm">
              <Users className="w-4 h-4 text-primary" />
              <span>{students.length} Members Active</span>
            </div>

            {/* Countdown Clock */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-xs font-black transition-all ${
              timeLeft <= 5 ? 'bg-error-container/30 border-error text-error animate-pulse shadow-sm' : 'bg-primary/10 border-primary text-primary shadow-sm'
            }`}>
              <Clock className="w-4 h-4 animate-spin-slow" />
              <span>{timeLeft > 0 ? `${timeLeft}s left` : 'Time Up!'}</span>
            </div>

            {/* End session block */}
            <button
              onClick={handleEndSession}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all border-2 border-red-300 text-xs font-black shadow-md cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Close Room
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
                  Question {questionNumber} of 3
                </span>
                <span className="text-xs text-slate-700 font-extrabold">Type: Multiple Choice</span>
              </div>
              <h2 className="font-headline-md text-lg md:text-xl font-black text-on-surface leading-relaxed">
                {activeQuestion.text}
              </h2>
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

              {/* Bar Chart Bars */}
              <div className="flex flex-col gap-4">
                {activeQuestion.options.map((opt) => {
                  const count = distribution[opt.key as keyof typeof distribution]
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

              {/* Progress Summary info */}
              <div className="mt-6 pt-4 border-t-2 border-outline-variant/20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800">Response Status:</span>
                  <span className="text-xs text-primary font-black bg-primary/5 border border-primary/20 px-2.5 py-1 rounded-full shadow-inner">{answeredTotal} / {students.length} Responded</span>
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

            {/* List */}
            <div className="flex-grow overflow-y-auto flex flex-col gap-2.5 pr-1">
              {students.map((student) => (
                <div 
                  key={student.id} 
                  className={`flex items-center justify-between p-2.5 rounded-xl border-2 border-outline-variant/25 bg-slate-50 hover:bg-slate-100/50 transition-colors`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Status indicator */}
                    <div className="w-6 h-6 rounded-md bg-slate-300 text-slate-800 flex items-center justify-center font-black text-[9px] shadow-sm">
                      {student.name.slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-black text-on-surface">{student.name}</span>
                      {student.streak > 0 && (
                        <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-250 px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 mt-1 shadow-sm">
                          <Flame className="w-2.5 h-2.5 fill-current text-amber-500" /> {student.streak} streak
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission indicator badge */}
                  <div>
                    {student.answered ? (
                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 border-2 border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-100" /> Done
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-amber-700 bg-amber-100 border-2 border-amber-300 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-550 animate-ping" /> Thinking
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <footer className="bg-white rounded-2xl border-2 border-outline-variant/30 shadow-md p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800">Live Room Actions:</span>
          </div>

          <button
            onClick={handleNextQuestion}
            className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-xl font-button text-sm font-bold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-98 cursor-pointer"
          >
            {questionNumber >= 3 ? (
              <>Finish Game & Close <Award className="w-4 h-4" /></>
            ) : (
              <>Next Question ({questionNumber} of 3) <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </footer>

      </div>
    </div>
  )
}
