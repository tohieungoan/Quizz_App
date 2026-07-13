import React, { useState } from 'react'
import landingPage1 from '@/assets/images/landing-page-1.jpg'
import landingPage2 from '@/assets/images/landing-page-2.jpg'
import landingPage3 from '@/assets/images/landing-page-3.jpg'

export const LandingPage: React.FC = () => {
  const [roomCode, setRoomCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [nickError, setNickError] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let isValid = true

    // Validate Room Code (phải là 6 chữ số)
    if (!/^\d{6}$/.test(roomCode)) {
      setCodeError(true)
      isValid = false
    } else {
      setCodeError(false)
    }

    // Validate Nickname (không được rỗng)
    if (nickname.trim() === '') {
      setNickError(true)
      isValid = false
    } else {
      setNickError(false)
    }

    if (isValid) {
      setIsConnecting(true)
      setTimeout(() => {
        alert(`Connecting to game room: ${roomCode} as ${nickname}`)
        setIsConnecting(false)
      }, 1000)
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
                <div className="flex flex-col gap-1">
                  <label className="font-label-bold text-label-bold text-on-surface-variant sr-only" htmlFor="roomCode">Room Code</label>
                  <input 
                    type="text"
                    id="roomCode"
                    maxLength={6}
                    placeholder="Enter 6-digit room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
                    className={`w-full rounded-lg border-2 px-4 py-4 font-body-md focus:border-primary focus:ring-0 transition-colors text-center text-lg tracking-widest placeholder:tracking-normal placeholder:text-outline ${
                      codeError ? 'border-error' : 'border-outline-variant'
                    }`}
                  />
                  {codeError && (
                    <span className="text-error font-body-md text-sm" id="codeError">
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
                  className="mt-4 font-button text-button bg-secondary text-on-secondary w-full py-4 rounded-full custom-shadow-level-1 hover:custom-shadow-level-2 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-80"
                >
                  {isConnecting ? 'Connecting...' : 'Join Game'}
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
