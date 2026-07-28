import React, { useState, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { InputField } from './InputField'
import { LoginFormData } from '../types'
import { authService, saveTokens, saveUserProfile } from '@/services'
import { useAuthContext } from '@/store/AuthContext'

interface LoginFormProps {
  onSwitchRegister: () => void
  onSwitchForgotPassword: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchRegister,
  onSwitchForgotPassword,
}) => {
  const [form, setForm] = useState<LoginFormData>({ email: '', password: '', rememberMe: false })
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const { setAuthenticated } = useAuthContext()

  // Countdown timer for Resend button
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Initialize countdown from localStorage based on email
  const updateCountdownFromStorage = (emailAddress: string) => {
    const lastSentStr = localStorage.getItem(`verification_sent_at_${emailAddress}`)
    if (lastSentStr) {
      const lastSent = new Date(lastSentStr)
      const elapsedSeconds = Math.floor((new Date().getTime() - lastSent.getTime()) / 1000)
      const remaining = 900 - elapsedSeconds
      if (remaining > 0) {
        setCountdown(remaining)
      } else {
        setCountdown(0)
      }
    } else {
      setCountdown(0)
    }
  }

  // Update countdown when email changes
  useEffect(() => {
    if (form.email) {
      updateCountdownFromStorage(form.email)
    }
  }, [form.email])

  // Restore saved email from localStorage (Remember Me)
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email')
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail, rememberMe: true }))
    }
  }, [])

  const handleResendVerification = async () => {
    if (!form.email || countdown > 0) return
    setResendLoading(true)
    setResendMessage(null)
    try {
      const res = await authService.resendVerification(form.email)
      setResendMessage(res.message || 'Verification email has been resent successfully.')
      localStorage.setItem(`verification_sent_at_${form.email}`, new Date().toISOString())
      setCountdown(900) // 15-minute countdown
      // Clear current errors for clean UI
      setErrors({})
    } catch (err: any) {
      setErrors({ email: err.message || 'Failed to resend verification email.' })
    } finally {
      setResendLoading(false)
    }
  }

  /** Save profile and update auth status -> App.tsx redirects automatically */
  const fetchProfileAndNavigate = async (accessToken: string) => {
    try {
      const profile = await authService.getProfileWithToken(accessToken)
      saveUserProfile(profile)
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
    }
    setAuthenticated()
  }

  // Send social token (Google) to backend
  const sendSocialToken = async (provider: string, token: string) => {
    setLoading(true)
    setErrors({})
    try {
      const data = await authService.socialLogin(provider, token)
      setSuccess(true)
      saveTokens(data)
      await fetchProfileAndNavigate(data.access_token)
    } catch (err: any) {
      setErrors({ email: err.message || `Authentication with ${provider} failed.` })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1098672097728-dummygoogleclientid.apps.googleusercontent.com'
    if (!(window as any).google) {
      alert("Google Identity Services script failed to load. Please check your internet connection.")
      return
    }
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: (tokenResponse: any) => {
        if (tokenResponse.access_token) {
          sendSocialToken('google', tokenResponse.access_token)
        }
      },
    })
    tokenClient.requestAccessToken()
  }

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    if (!form.email) newErrors.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email address.'
    if (!form.password) newErrors.password = 'Password is required.'
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})
    setResendMessage(null)

    try {
      const data = await authService.login(form.email, form.password)
      setSuccess(true)
      saveTokens(data)
      
      // Save or remove email based on Remember Me selection
      if (form.rememberMe) {
        localStorage.setItem('remembered_email', form.email)
      } else {
        localStorage.removeItem('remembered_email')
      }

      await fetchProfileAndNavigate(data.access_token)
    } catch (err: any) {
      const errMsg = err.message || ''
      if (errMsg.toLowerCase().includes('not verified') || errMsg.toLowerCase().includes('verified')) {
        const lastSentStr = localStorage.getItem(`verification_sent_at_${form.email}`)
        let shouldAutoResend = true
        if (lastSentStr) {
          const lastSent = new Date(lastSentStr)
          const diffMinutes = (new Date().getTime() - lastSent.getTime()) / (1000 * 60)
          if (diffMinutes <= 15) {
            shouldAutoResend = false
          }
        }

        if (shouldAutoResend) {
          setErrors({ email: 'Your account is not verified yet. Automatically sending a new verification email...' })
          try {
            await authService.resendVerification(form.email)
            setResendMessage('A new verification link has been sent to your email. Please check your inbox.')
            setErrors({ email: 'Your account is not verified yet. We have sent a new activation link to your email.' })
          } catch (resendErr: any) {
            setErrors({ email: `Your account is not verified yet. Failed to send a new link automatically: ${resendErr.message || ''}` })
          }
        } else {
          setErrors({ email: 'Your account is not verified yet. Please check your inbox for the activation link.' })
        }
      } else {
        setErrors({ email: errMsg || 'Incorrect email or password.' })
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center animate-bounce">
          <CheckCircle className="w-10 h-10 text-secondary" />
        </div>
        <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Welcome back!</h3>
        <p className="text-on-surface-variant font-body-md">Redirecting you now...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <InputField
          id="login-email"
          type="email"
          label="Email address"
          value={form.email}
          onChange={(v) => {
            setForm({ ...form, email: v })
            setResendMessage(null)
          }}
          error={errors.email}
          icon={<Mail className="w-5 h-5" />}
          autoComplete="email"
        />
        {errors.email && errors.email.toLowerCase().includes('verify') && (
          <button
            type="button"
            disabled={resendLoading || countdown > 0}
            onClick={handleResendVerification}
            className="text-xs text-primary font-bold hover:underline self-start disabled:opacity-75 focus:outline-none flex items-center gap-1.5 disabled:no-underline"
          >
            {resendLoading
              ? 'Resending verification email...'
              : countdown > 0
              ? `Resend in ${Math.floor(countdown / 60)}:${countdown % 60 < 10 ? '0' : ''}${countdown % 60}`
              : 'Resend verification email'}
          </button>
        )}
        {resendMessage && (
          <p className="text-xs text-green-600 font-bold">{resendMessage}</p>
        )}
      </div>
      <InputField
        id="login-password"
        type={showPwd ? 'text' : 'password'}
        label="Password"
        value={form.password}
        onChange={(v) => setForm({ ...form, password: v })}
        error={errors.password}
        icon={<Lock className="w-5 h-5" />}
        autoComplete="current-password"
        rightElement={
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="text-outline hover:text-primary transition-colors p-0.5"
            aria-label="Toggle password visibility"
          >
            {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        }
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              id="rememberMe"
              checked={form.rememberMe}
              onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-5 h-5 rounded border-2 border-outline-variant peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
              {form.rememberMe && <svg className="w-3 h-3 text-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
          </div>
          <span className="font-body-md text-sm text-on-surface-variant">Remember me</span>
        </label>
        <button
          type="button"
          onClick={onSwitchForgotPassword}
          className="font-label-bold text-label-bold text-primary hover:underline text-sm focus:outline-none"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        id="loginBtn"
        disabled={loading}
        className="mt-2 font-button text-button bg-primary text-on-primary w-full py-4 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="font-body-md text-sm text-outline">or continue with</span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>

      {/* Social Login */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          id="googleLoginBtn"
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-2 border-2 border-outline-variant rounded-xl py-3.5 font-body-md text-sm text-on-surface hover:border-primary hover:bg-primary-fixed/10 transition-all cursor-pointer w-full"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>

      <p className="text-center font-body-md text-sm text-on-surface-variant mt-1">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchRegister} className="text-primary font-label-bold hover:underline focus:outline-none">
          Sign Up
        </button>
      </p>
    </form>
  )
}
