import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Flame, Clock, Zap, HelpCircle, Shield, Sparkles, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'

interface Question {
  id: number
  text: string
  options: { key: string; label: string }[]
  correctKey: string
  points: number
}

const MOCK_QUESTIONS_POOL: Record<number, Question> = {
  1: {
    id: 1,
    text: 'Which hook should you use to optimize performance by caching the result of a calculation between re-renders?',
    options: [
      { key: 'A', label: 'useEffect' },
      { key: 'B', label: 'useMemo' },
      { key: 'C', label: 'useCallback' },
      { key: 'D', label: 'useRef' }
    ],
    correctKey: 'B',
    points: 1000
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
    correctKey: 'C',
    points: 1000
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
    correctKey: 'B',
    points: 1000
  }
}

export const ParticipantAnswer: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // State variables passed from Router
  const state = location.state as { 
    nickname?: string 
    roomCode?: string 
    score?: number 
    streak?: number 
    activePowerUp?: string | null
    questionNumber?: number
    fromSource?: 'landing' | 'dashboard'
    activeTab?: string
  } | null

  const nickname = state?.nickname || 'Guest'
  const roomCode = state?.roomCode || '823914'
  const currentScore = state?.score ?? 0
  const currentStreak = state?.streak ?? 0
  const activePowerUp = state?.activePowerUp || null
  const questionNumber = state?.questionNumber || 1
  const fromSource = state?.fromSource || 'landing'
  const activeTab = state?.activeTab || sessionStorage.getItem('dashboard_active_tab') || 'join_room'

  // Get active question details based on current index (loop 1-3)
  const activeQuestionIndex = ((questionNumber - 1) % 3) + 1
  const activeQuestion = MOCK_QUESTIONS_POOL[activeQuestionIndex]

  // Game Play States
  const [timeLeft, setTimeLeft] = useState(20) // 20 seconds timer
  const [isAnswered, setIsAnswered] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)

  // Reset page states when questionNumber changes
  useEffect(() => {
    setTimeLeft(20)
    setIsAnswered(false)
    setSelectedKey(null)
    setShowResult(false)
    setIsCorrect(false)
    setPointsEarned(0)
  }, [questionNumber])

  // Timer Countdown Effect
  useEffect(() => {
    if (isAnswered || timeLeft <= 0) {
      if (timeLeft === 0 && !isAnswered) {
        handleAnswerSubmit(null)
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, isAnswered])

  const handleAnswerSubmit = (key: string | null) => {
    if (isAnswered) return
    setIsAnswered(true)
    setSelectedKey(key)

    const correct = key === activeQuestion.correctKey
    setIsCorrect(correct)

    let basePoints = correct ? activeQuestion.points : 0
    let speedBonus = 0
    let finalPoints = 0

    if (correct) {
      // Speed bonus calculation (higher score if answered faster)
      speedBonus = Math.round((timeLeft / 20) * 200)
      finalPoints = basePoints + speedBonus

      // Double points power-up booster
      if (activePowerUp === 'double') {
        finalPoints *= 2
      }
    }

    setPointsEarned(finalPoints)
    
    setTimeout(() => {
      setShowResult(true)
    }, 600)
  }

  // Helper colors for option letters
  const getLetterBgColor = (key: string, isSelected: boolean = false) => {
    if (isAnswered && (selectedKey === key || key === activeQuestion.correctKey)) {
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
      const isCorrectOption = key === activeQuestion.correctKey;

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

  const handleNextScreen = () => {
    const nextScore = currentScore + pointsEarned
    const nextStreak = isCorrect ? currentStreak + 1 : (activePowerUp === 'shield' ? currentStreak : 0)

    // Check if we should display the leaderboard (every 3 questions)
    const shouldShowLeaderboard = questionNumber % 3 === 0

    if (shouldShowLeaderboard) {
      navigate('/leaderboard', {
        state: {
          nickname,
          roomCode,
          score: nextScore,
          streak: nextStreak,
          lastPointsEarned: pointsEarned,
          lastIsCorrect: isCorrect,
          questionNumber: questionNumber,
          fromSource,
          activeTab,
        }
      })
    } else {
      // Go directly to next question, resetting powerups
      navigate('/play', {
        state: {
          nickname,
          roomCode,
          score: nextScore,
          streak: nextStreak,
          activePowerUp: null,
          questionNumber: questionNumber + 1,
          fromSource,
          activeTab,
        }
      })
    }
  }

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
          <div className="flex justify-between items-center bg-white px-4 py-3.5 rounded-2xl border-2 border-outline-variant/30 shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800">Question {questionNumber} of 3 (Game Loop)</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-secondary-container bg-[#005236] border border-secondary px-3 py-1 rounded-full text-xs font-black">
                <Flame className="w-4 h-4 fill-current text-secondary-container animate-bounce" />
                <span>{isCorrect && showResult ? currentStreak + 1 : currentStreak} Streak</span>
              </div>
              <span className="text-sm font-extrabold text-primary">{currentScore + (isAnswered && isCorrect ? pointsEarned : 0)} Pts</span>
            </div>
          </div>

          {/* Time Countdown Progress Bar */}
          <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden border border-outline-variant shadow-inner relative flex items-center">
            <div 
              className={`h-full transition-all duration-1000 rounded-full bg-gradient-to-r ${
                timeLeft <= 5 ? 'from-red-500 to-red-650 animate-pulse' : 'from-primary to-secondary'
              }`}
              style={{ width: `${(timeLeft / 20) * 100}%` }}
            />
            <div className="absolute right-3 flex items-center gap-1 text-[10px] font-black text-slate-900 font-headline-md tracking-wider">
              <Clock className="w-3 h-3" /> {timeLeft}s
            </div>
          </div>

          {/* Active Power-Up Alert Banner */}
          {activePowerUp && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-amber-550/15 to-amber-600/10 text-amber-950 border-2 border-amber-300 rounded-xl text-xs font-bold animate-in slide-in-from-top-2 duration-300 shadow-sm">
              <Zap className="w-4 h-4 text-amber-650 animate-pulse fill-current" />
              <span>
                Active Power-Up: {activePowerUp === 'double' ? 'Double Points (x2)' : activePowerUp === 'shield' ? 'Streak Shield' : activePowerUp === 'fifty' ? '50:50 Split' : 'Booster Active'}
              </span>
            </div>
          )}
        </header>

        {/* Question Text */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border-2 border-outline-variant/40 shadow-md text-left my-6 flex-grow flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2.5 block">Multiple Choice Quiz</span>
          <h1 className="font-headline-md text-lg md:text-xl font-black text-on-surface leading-relaxed">
            {activeQuestion.text}
          </h1>
        </section>

        {/* Answer Selection Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {activeQuestion.options.map((opt) => {
            // Apply 50:50 power-up logic (hide 2 random incorrect answers - A and D)
            const isFiftyFiftyHidden = activePowerUp === 'fifty' && (opt.key === 'A' || opt.key === 'D')
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
                key={opt.key}
                disabled={isAnswered}
                onClick={() => handleAnswerSubmit(opt.key)}
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
          })}
        </section>

        {/* Active Power-Up Selection Link Button */}
        {!isAnswered && (
          <button
            onClick={() => navigate('/powerups', { state: { nickname, roomCode, score: currentScore, streak: currentStreak, questionNumber } })}
            className="w-full py-4 bg-amber-100 hover:bg-amber-200 border-2 border-amber-350 text-amber-955 rounded-2xl font-button text-xs font-black transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-amber-500 text-amber-600 animate-pulse" /> Select a Power-Up / Booster
          </button>
        )}

        {/* Slide-Up Result Details Banner */}
        {showResult && (
          <div className={`fixed inset-x-0 bottom-0 border-t-4 shadow-[0_-10px_40px_rgba(0,0,0,0.12)] py-6 px-5 z-50 animate-in slide-in-from-bottom duration-300 ${
            isCorrect ? 'bg-emerald-50 border-emerald-500' : 'bg-red-50 border-red-500'
          }`}>
            <div className="max-w-lg mx-auto flex flex-col gap-4 text-center">
              
              <div className="flex items-center justify-center gap-2">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 fill-emerald-100" />
                    <h2 className="font-headline-md text-xl font-black text-emerald-900">Correct! Well done</h2>
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8 text-red-600 fill-red-100" />
                    <h2 className="font-headline-md text-xl font-black text-red-900">Incorrect! Keep trying</h2>
                  </>
                )}
              </div>

              <p className="font-body-md text-xs text-slate-800 font-bold">
                {isCorrect 
                  ? `You answered quickly and earned points + Speed Bonus!` 
                  : `Correct answer was option: ${activeQuestion.correctKey}. ${activeQuestion.options.find(o => o.key === activeQuestion.correctKey)?.label}`
                }
              </p>

              <div className="flex justify-center items-center gap-6 py-2">
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
                    {isCorrect ? currentStreak + 1 : (activePowerUp === 'shield' ? currentStreak : 0)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleNextScreen}
                className="w-full mt-2 py-4 bg-primary text-white rounded-2xl font-button text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                {questionNumber % 3 === 0 ? (
                  <>View Live Leaderboard <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Next Question <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
