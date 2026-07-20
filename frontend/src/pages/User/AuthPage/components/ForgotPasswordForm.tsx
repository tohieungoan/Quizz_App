import React, { useState } from 'react'
import { Mail, ArrowLeft, ShieldAlert } from 'lucide-react'
import { InputField } from './InputField'

interface ForgotPasswordFormProps {
  onBackToLogin: () => void
  onSuccess: (email: string) => void
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToLogin,
  onSuccess,
}) => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = (): boolean => {
    if (!email) {
      setError('Email is required.')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email address.')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1500))
    setLoading(false)
    onSuccess(email)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-in fade-in duration-300" noValidate>
      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex gap-3 text-sm text-on-surface-variant">
        <ShieldAlert className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed text-sm">
          Enter the email address associated with your account, and we will email you a link to reset your password.
        </p>
      </div>

      <InputField
        id="reset-email"
        type="email"
        label="Email address"
        value={email}
        onChange={(v) => setEmail(v)}
        error={error}
        icon={<Mail className="w-5 h-5" />}
        autoComplete="email"
      />

      <button
        type="submit"
        disabled={loading}
        className="mt-2 font-button text-button bg-primary text-on-primary w-full py-4 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending instructions...
          </>
        ) : (
          'Send Reset Link'
        )}
      </button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="font-label-bold text-label-bold text-on-surface-variant hover:text-primary transition-colors text-center w-full py-2 text-sm flex items-center justify-center gap-1.5 focus:outline-none"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sign In
      </button>
    </form>
  )
}
