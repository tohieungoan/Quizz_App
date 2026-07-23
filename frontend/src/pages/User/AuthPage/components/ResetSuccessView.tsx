import React, { useState, useEffect } from 'react'
import { Mail, ArrowLeft } from 'lucide-react'

interface ResetSuccessViewProps {
  email: string
  onBackToLogin: () => void
}

export const ResetSuccessView: React.FC<ResetSuccessViewProps> = ({ email, onBackToLogin }) => {
  const [countdown, setCountdown] = useState(60)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (countdown === 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleResend = () => {
    setIsResending(true)
    // Simulate resend email (frontend only)
    setTimeout(() => {
      setIsResending(false)
      setCountdown(60)
    }, 800)
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-6 animate-in fade-in duration-500 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-bounce">
        <Mail className="w-10 h-10" />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-headline-md text-headline-md text-on-surface font-bold text-2xl">Check your inbox</h3>
        <p className="text-on-surface-variant font-body-md max-w-sm text-sm leading-relaxed">
          We've sent password reset instructions to <strong className="text-on-surface">{email}</strong>. Please check your email to proceed.
        </p>
      </div>

      <div className="w-full flex flex-col gap-3 mt-4">
        <button
          type="button"
          onClick={() => window.open(`https://mail.google.com/`, '_blank')}
          className="font-button text-button bg-primary text-on-primary w-full py-4 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          Open Gmail
        </button>

        <button
          type="button"
          disabled={countdown > 0 || isResending}
          onClick={handleResend}
          className="font-label-bold text-label-bold text-primary hover:underline py-2 disabled:text-outline disabled:no-underline transition-all text-sm focus:outline-none"
        >
          {isResending ? 'Resending...' : countdown > 0 ? `Resend email in ${countdown}s` : 'Resend reset link'}
        </button>
      </div>

      <button
        type="button"
        onClick={onBackToLogin}
        className="font-label-bold text-label-bold text-on-surface-variant hover:text-primary transition-colors text-center py-2 text-sm mt-4 flex items-center justify-center gap-1.5 focus:outline-none"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sign In
      </button>
    </div>
  )
}


