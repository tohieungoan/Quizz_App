import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Users, Laptop, Award, Zap, ChevronRight, Play } from 'lucide-react'
import landingPage1 from '@/assets/images/landing-page-1.jpg'
import landingPage2 from '@/assets/images/landing-page-2.jpg'
import landingPage3 from '@/assets/images/landing-page-3.jpg'

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [nickname, setNickname] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [nickError, setNickError] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  // ── 6-digit input handlers ──
  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)
    if (digit && index < 5) {
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 0)
    }
    if (newCode.every(d => d !== '')) setCodeError(false)
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newCode = [...code]
      if (code[index]) {
        newCode[index] = ''
        setCode(newCode)
      } else if (index > 0) {
        newCode[index - 1] = ''
        setCode(newCode)
        setTimeout(() => inputRefs.current[index - 1]?.focus(), 0)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const newCode = [...code]
    for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || ''
    setCode(newCode)
    const focusIndex = Math.min(pasted.length, 5)
    setTimeout(() => inputRefs.current[focusIndex]?.focus(), 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const roomCode = code.join('')
    let isValid = true

    if (roomCode.length < 6 || !/^\d{6}$/.test(roomCode)) {
      setCodeError(true)
      isValid = false
    } else {
      setCodeError(false)
    }

    if (nickname.trim() === '') {
      setNickError(true)
      isValid = false
    } else {
      setNickError(false)
    }

    if (isValid) {
      setIsConnecting(true)
      setTimeout(() => {
        // Chuyển sang Lobby với state roomCode và nickname
        navigate('/lobby', { state: { roomCode, nickname: nickname.trim(), isHost: false, fromSource: 'landing' } })
      }, 800)
    }
  }

  return (
    <div className="flex-grow bg-[#f9f9ff]">
      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-margin-mobile md:px-margin-desktop overflow-hidden pattern-bg border-b border-outline-variant/10">
        <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Hero Text */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/5 text-primary border border-primary/10 rounded-full px-4 py-1.5 self-center lg:self-start text-xs font-bold tracking-wide uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Gamified Quizzes
            </div>
            
            <h1 className="font-headline-xl text-4xl md:text-5xl lg:text-6xl text-on-surface tracking-tight font-extrabold leading-tight">
              Host Live Quizzes. <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Engage Students.</span> <br />
              Assess Smarter.
            </h1>
            
            <p className="font-body-lg text-body-md md:text-lg text-on-surface-variant max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              The ultimate platform for synchronized real-time quiz games and professional formal examinations. Empower your classroom with rich aesthetics, instant grading, and real-time interactive dashboards.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                <span>Over 10,000+ active players today</span>
              </div>
            </div>
          </div>

          {/* Guest PIN Widget */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-white shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
              
              {/* Decorative top blur gradient */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-tertiary" />

              <h2 className="font-headline-md text-2xl text-center mb-6 text-on-surface font-extrabold">Join a Game Session</h2>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-5" id="joinGameForm">
                {/* 6 individual digit boxes */}
                <div className="flex flex-col gap-2">
                  <label className="font-label-bold text-xs uppercase tracking-wider text-on-surface-variant font-bold">Room PIN Code</label>
                  <div className="flex justify-between gap-1.5">
                    {code.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        value={digit}
                        onChange={(e) => handleCodeChange(i, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                        onPaste={handlePaste}
                        placeholder="•"
                        id={i === 0 ? 'roomCode' : undefined}
                        className={`w-[14%] aspect-square text-center font-headline-md text-xl font-bold rounded-xl border-2 focus:outline-none transition-all shadow-inner
                          placeholder:text-outline-variant/40
                          ${
                            codeError
                              ? 'border-error bg-error/5 focus:border-error focus:ring-1 focus:ring-error text-error'
                              : digit
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-outline-variant bg-[#fcfcff] focus:border-primary focus:ring-1 focus:ring-primary'
                          } ${isConnecting ? 'opacity-55 cursor-not-allowed' : ''}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        disabled={isConnecting}
                      />
                    ))}
                  </div>
                  {codeError && (
                    <span className="text-error font-body-md text-xs text-center mt-1 font-semibold flex items-center justify-center gap-1" id="codeError">
                      Please enter a valid 6-digit numeric PIN.
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-label-bold text-xs uppercase tracking-wider text-on-surface-variant font-bold" htmlFor="nickname">Your Nickname</label>
                  <input 
                    type="text"
                    id="nickname"
                    placeholder="e.g. SpeedRunner"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value)
                      if(e.target.value.trim() !== '') setNickError(false)
                    }}
                    className={`w-full rounded-xl border-2 px-4 py-3.5 font-body-md text-center text-on-surface focus:outline-none transition-all ${
                      nickError 
                        ? 'border-error bg-error/5 focus:border-error' 
                        : 'border-outline-variant bg-[#fcfcff] focus:border-primary focus:border-2'
                    }`}
                  />
                  {nickError && (
                    <span className="text-error font-body-md text-xs text-left font-semibold" id="nickError">
                      Nickname is required to display on the leaderboard.
                    </span>
                  )}
                </div>

                <button 
                  disabled={isConnecting}
                  type="submit"
                  id="joinBtn"
                  className="mt-2 font-button text-base bg-primary text-white w-full py-4 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-98 disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer font-bold"
                >
                  {isConnecting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Connecting to lobby...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Join Room
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Decorative elements for hero background */}
        <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-secondary/15 rounded-full blur-[100px] pointer-events-none -z-10" />
      </section>

      {/* Feature Highlights Section */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop bg-white relative z-20">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="font-headline-lg text-3xl md:text-4xl text-on-surface font-extrabold">Tailored Educational Tools</h2>
            <p className="font-body-md text-on-surface-variant mt-3 text-base md:text-lg">Designed to maximize learning outcomes, simplify quiz orchestration, and increase participant engagement.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 - Teachers */}
            <div className="bg-[#f9f9ff] rounded-3xl p-8 border border-outline-variant/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-start gap-4 group">
              <div className="w-full h-44 mb-4 overflow-hidden rounded-2xl shadow-sm border border-outline-variant/20 relative">
                <img 
                  alt="Teacher creating quizzes" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  src={landingPage1} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111c2d]/30 to-transparent" />
              </div>
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                <Laptop className="w-3.5 h-3.5" /> Host Studio
              </div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mt-1">For Educators</h3>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                Build beautiful MCQ, True/False, and essay exams using AI-assisted tools. Coordinate classrooms, share invite links, and control question pacing.
              </p>
            </div>
            
            {/* Feature 2 - Students */}
            <div className="bg-[#f9f9ff] rounded-3xl p-8 border border-outline-variant/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-start gap-4 group">
              <div className="w-full h-44 mb-4 overflow-hidden rounded-2xl shadow-sm border border-outline-variant/20 relative">
                <img 
                  alt="Students playing gamified quiz" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  src={landingPage2} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111c2d]/30 to-transparent" />
              </div>
              <div className="flex items-center gap-2 bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                <Zap className="w-3.5 h-3.5" /> Gamified Play
              </div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mt-1">For Participants</h3>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                Join live games with power-ups (X2, 50:50, Time Freeze). Answer quickly to build streaks, climb live standings, and view interactive results.
              </p>
            </div>
            
            {/* Feature 3 - Admins */}
            <div className="bg-[#f9f9ff] rounded-3xl p-8 border border-outline-variant/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-start gap-4 group">
              <div className="w-full h-44 mb-4 overflow-hidden rounded-2xl shadow-sm border border-outline-variant/20 relative">
                <img 
                  alt="Administrator reviewing data analytics" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  src={landingPage3} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111c2d]/30 to-transparent" />
              </div>
              <div className="flex items-center gap-2 bg-tertiary-container/30 text-tertiary-container px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                <Award className="w-3.5 h-3.5" /> Admin Insights
              </div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mt-1">For Administrators</h3>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                Manage global school groups, import rosters via CSV file, monitor user activity, and extract detailed CSV performance reports.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
