import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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

  // ── 6-digit input handlers (giống Dashboard) ──
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
        navigate('/lobby', { state: { roomCode, nickname: nickname.trim() } })
      }, 600)
    }
  }

  return (
    <div className="flex-grow">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-margin-mobile md:px-margin-desktop overflow-hidden pattern-bg">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
          {/* Hero Text */}
          <div className="md:col-span-7 flex flex-col gap-6 relative z-10 text-center md:text-left">
            <h1 className="font-headline-xl text-headline-lg-mobile md:text-headline-xl text-on-surface">
              Host Live Quizzes. <br />
              <span className="text-primary">Engage Students.</span> <br />
              Assess Smarter.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto md:mx-0">
              The ultimate platform for synchronized real-time quiz games and professional formal examinations. Build, play, and analyze with focused play.
            </p>
          </div>

          {/* Guest PIN Widget */}
          <div className="md:col-span-5 relative z-10 mt-12 md:mt-0">
            <div className="bg-surface-container-lowest rounded-xl p-8 custom-shadow-level-1 max-w-md mx-auto">
              <h2 className="font-headline-md text-headline-md text-center mb-6 text-on-surface">Join a Game</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4" id="joinGameForm">
                {/* 6 individual digit boxes */}
                <div>
                  <label className="font-label-bold text-label-bold text-on-surface-variant sr-only">Room Code</label>
                  <div className="flex justify-center gap-2 mb-1">
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
                        className={`w-12 h-14 text-center font-headline-md text-xl font-bold rounded-xl border-2 focus:outline-none transition-colors bg-white shadow-sm
                          placeholder:text-outline-variant/50
                          ${
                            codeError
                              ? 'border-error focus:border-error focus:ring-1 focus:ring-error'
                              : digit
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary'
                          } ${isConnecting ? 'opacity-60 cursor-not-allowed' : ''}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        disabled={isConnecting}
                      />
                    ))}
                  </div>
                  {codeError && (
                    <span className="text-error font-body-md text-sm block text-center" id="codeError">
                      Please enter a valid 6-digit code.
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-bold text-label-bold text-on-surface-variant sr-only" htmlFor="nickname">Nickname</label>
                  <input 
                    type="text"
                    id="nickname"
                    placeholder="Enter Nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className={`w-full rounded-lg border-2 px-4 py-4 font-body-md focus:border-primary focus:ring-0 transition-colors text-center ${
                      nickError ? 'border-error' : 'border-outline-variant'
                    }`}
                  />
                  {nickError && (
                    <span className="text-error font-body-md text-sm" id="nickError">
                      Nickname is required.
                    </span>
                  )}
                </div>
                <button 
                  disabled={isConnecting}
                  type="submit"
                  id="joinBtn"
                  className="mt-4 font-button text-button bg-secondary text-on-secondary w-full py-4 rounded-full custom-shadow-level-1 hover:custom-shadow-level-2 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-80 flex items-center justify-center gap-2"
                >
                  {isConnecting
                    ? (<><span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Joining room...</>)
                    : 'Join Game'
                  }
                </button>
              </form>
            </div>
          </div>

          {/* Decorative elements for hero */}
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary-fixed rounded-full blur-3xl opacity-30 -z-10"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-secondary-fixed rounded-full blur-3xl opacity-30 -z-10"></div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface-container-lowest relative z-20">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Built for Everyone</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-4">Tools designed specifically for your role in the classroom.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Feature 1 */}
            <div className="bg-surface rounded-xl p-8 custom-shadow-level-1 hover:-translate-y-2 transition-transform duration-300 border border-outline-variant/30 flex flex-col items-start gap-4">
              <div className="w-full h-48 mb-6 overflow-hidden rounded-lg shadow-sm">
                <img 
                  alt="Teacher creating quizzes" 
                  className="w-full h-full object-cover" 
                  src={landingPage1} 
                />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Teachers</h3>
              <p className="font-label-bold text-label-bold text-primary mb-2">Create &amp; Host</p>
              <p className="font-body-md text-body-md text-on-surface-variant">Build MCQ, True/False, and Short Answer quizzes with AI-assisted tools. Host live interactive rooms with ease.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-surface rounded-xl p-8 custom-shadow-level-1 hover:-translate-y-2 transition-transform duration-300 border border-outline-variant/30 flex flex-col items-start gap-4">
              <div className="w-full h-48 mb-6 overflow-hidden rounded-lg shadow-sm">
                <img 
                  alt="Students playing gamified quiz" 
                  className="w-full h-full object-cover" 
                  src={landingPage2} 
                />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Students</h3>
              <p className="font-label-bold text-label-bold text-secondary mb-2">Exam &amp; Game Modes</p>
              <p className="font-body-md text-body-md text-on-surface-variant">Engage in live quiz rooms or take scheduled formal exams. Earn progression badges as you learn.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-surface rounded-xl p-8 custom-shadow-level-1 hover:-translate-y-2 transition-transform duration-300 border border-outline-variant/30 flex flex-col items-start gap-4">
              <div className="w-full h-48 mb-6 overflow-hidden rounded-lg shadow-sm">
                <img 
                  alt="Administrator reviewing data analytics" 
                  className="w-full h-full object-cover" 
                  src={landingPage3} 
                />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Admins</h3>
              <p className="font-label-bold text-label-bold text-tertiary-container mb-2">Super Admin Insights</p>
              <p className="font-body-md text-body-md text-on-surface-variant">Access comprehensive dashboards, manage users via CSV, and generate global reports effortlessly.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
