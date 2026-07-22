import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Gamepad2, ArrowLeft, User } from 'lucide-react'
import landingPage1 from '@/assets/images/landing-page-1.jpg'
import { AuthMode } from './types'
import { LoginForm } from './components/LoginForm'
import { RegisterForm } from './components/RegisterForm'
import { ForgotPasswordForm } from './components/ForgotPasswordForm'
import { ResetSuccessView } from './components/ResetSuccessView'

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialMode = (searchParams.get('mode') as AuthMode) || 'login'
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [resetEmail, setResetEmail] = useState('')

  const testimonials = [
    { text: 'QuizzApp transformed how I engage my members. Real-time results are incredible!', name: 'Ms. Sarah T.', role: 'Quiz Host' },
    { text: 'Our department performance improved 40% after adopting QuizzApp for formal exams.', name: 'Prof. David L.', role: 'Team Lead' },
    { text: 'My members actually look forward to quizzes now. The game mode is a hit!', name: 'Mr. James K.', role: 'Event Organizer' },
  ]
  const [testimonialIdx] = useState(0)
  const testimonial = testimonials[testimonialIdx]

  const getHeading = () => {
    switch (mode) {
      case 'login':
        return { title: 'Welcome back 👋', subtitle: 'Sign in to access your QuizzApp dashboard.' }
      case 'register':
        return { title: 'Create your account ✨', subtitle: 'Join thousands of creators and hosts on QuizzApp today.' }

      case 'forgot-password':
        return { title: 'Reset password 🔒', subtitle: 'Forgot your password? No worries, we got you covered.' }
      case 'reset-success':
        return { title: 'Check your email 📧', subtitle: 'Reset instructions have been sent successfully.' }
    }
  }

  const heading = getHeading()

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel: Visual / Brand ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col overflow-hidden">
        {/* Background image */}
        <img
          src={landingPage1}
          alt="QuizzApp - Engage your members"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary-container/80 to-secondary/70" />
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full bg-on-primary/10 blur-3xl" />

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col h-full p-12 xl:p-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group w-fit">
            <div className="w-11 h-11 rounded-2xl bg-on-primary/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-on-primary/30 transition-colors">
              <Gamepad2 className="w-6 h-6 text-on-primary" />
            </div>
            <span className="font-headline-md text-headline-md text-on-primary font-bold tracking-tight">QuizzApp</span>
          </Link>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center gap-8">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 bg-on-primary/15 backdrop-blur-sm rounded-full px-4 py-2 w-fit">
                <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim animate-pulse" />
                <span className="font-label-bold text-label-bold text-on-primary text-xs tracking-wider uppercase">
                  Trusted by 10,000+ Educators
                </span>
              </div>
              <h1 className="font-headline-xl text-4xl xl:text-5xl text-on-primary leading-tight font-extrabold">
                Host Live Quizzes.<br />
                <span className="text-secondary-fixed-dim">Engage Members.</span><br />
                Assess Smarter.
              </h1>
              <p className="font-body-lg text-on-primary/80 text-lg max-w-md">
                The ultimate platform for synchronized real-time quiz games and professional formal examinations.
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '10K+', label: 'Educators' },
                { value: '2M+', label: 'Members' },
                { value: '50M+', label: 'Quizzes Played' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-on-primary/10 backdrop-blur-sm rounded-2xl p-4 border border-on-primary/10"
                >
                  <p className="font-headline-lg text-2xl text-on-primary font-bold">{stat.value}</p>
                  <p className="font-body-md text-sm text-on-primary/70 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="bg-on-primary/10 backdrop-blur-sm border border-on-primary/10 rounded-2xl p-6">
              <p className="font-body-lg text-on-primary/90 italic text-base leading-relaxed">
                "{testimonial.text}"
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed-dim/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-on-primary" />
                </div>
                <div>
                  <p className="font-label-bold text-on-primary text-sm">{testimonial.name}</p>
                  <p className="font-body-md text-on-primary/60 text-xs">{testimonial.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom badge */}
          <div className="flex items-center gap-2 text-on-primary/50 font-body-md text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secured with 256-bit SSL encryption
          </div>
        </div>
      </div>

      {/* ── Right Panel: Auth Form ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-background overflow-y-auto">
        {/* Mobile logo bar */}
        <div className="lg:hidden flex items-center justify-between px-6 py-5 border-b border-outline-variant/20">
          <Link to="/" className="flex items-center gap-2">
            <Gamepad2 className="w-7 h-7 text-primary" />
            <span className="font-headline-md text-headline-md font-bold text-primary">QuizzApp</span>
          </Link>
          <Link to="/" className="flex items-center gap-1 text-on-surface-variant font-body-md text-sm hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 md:px-12">
          <div className="w-full max-w-md">
            {/* Back to home (desktop) */}
            <Link
              to="/"
              className="hidden lg:inline-flex items-center gap-1.5 text-on-surface-variant font-body-md text-sm hover:text-primary transition-colors mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to home
            </Link>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="font-headline-lg text-3xl text-on-surface font-bold">
                {heading.title}
              </h2>
              <p className="font-body-md text-on-surface-variant mt-2 text-sm leading-relaxed">
                {heading.subtitle}
              </p>
            </div>

            {/* Tab Toggle (Only for login and register) */}
            {(mode === 'login' || mode === 'register') && (
              <div className="relative flex bg-surface-container-low rounded-xl p-1 mb-8 border border-outline-variant/30">
                {/* Sliding indicator */}
                <div
                  className={`absolute top-1 bottom-1 rounded-lg bg-surface-container-lowest shadow-sm transition-all duration-300 ease-out ${
                    mode === 'login' ? 'left-1 right-[50%]' : 'left-[50%] right-1'
                  }`}
                />
                <button
                  type="button"
                  id="loginTab"
                  onClick={() => setMode('login')}
                  className={`relative flex-1 py-2.5 font-button text-sm rounded-lg transition-colors duration-200 z-10 ${
                    mode === 'login' ? 'text-primary font-bold' : 'text-on-surface-variant'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  id="registerTab"
                  onClick={() => setMode('register')}
                  className={`relative flex-1 py-2.5 font-button text-sm rounded-lg transition-colors duration-200 z-10 ${
                    mode === 'register' ? 'text-primary font-bold' : 'text-on-surface-variant'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Animated form switcher */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300" key={mode}>
              {mode === 'login' && (
                <LoginForm
                  onSwitchRegister={() => setMode('register')}
                  onSwitchForgotPassword={() => setMode('forgot-password')}
                />
              )}
              {mode === 'register' && (
                <RegisterForm onSwitchLogin={() => setMode('login')} />
              )}
              {mode === 'forgot-password' && (
                <ForgotPasswordForm
                  onBackToLogin={() => setMode('login')}
                  onSuccess={(email) => {
                    setResetEmail(email)
                    setMode('reset-success')
                  }}
                />
              )}
              {mode === 'reset-success' && (
                <ResetSuccessView
                  email={resetEmail}
                  onBackToLogin={() => setMode('login')}
                />
              )}
            </div>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="px-6 py-5 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-body-md text-xs text-outline">
            © 2026 QuizzApp. All rights reserved.
          </p>
          <div className="flex gap-4">
            {['Privacy Policy', 'Terms of Service', 'Support'].map((link) => (
              <a key={link} href="#" className="font-body-md text-xs text-outline hover:text-primary transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
