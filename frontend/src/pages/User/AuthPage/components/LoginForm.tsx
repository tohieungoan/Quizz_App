import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { InputField } from './InputField'
import { LoginFormData } from '../types'

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
  const navigate = useNavigate()

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
    await new Promise((r) => setTimeout(r, 1500))
    setLoading(false)
    setSuccess(true)
    localStorage.setItem('token', 'mock-jwt-token')
    localStorage.setItem('user', JSON.stringify({ email: form.email }))
    setTimeout(() => navigate('/dashboard'), 1000)
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
      <InputField
        id="login-email"
        type="email"
        label="Email address"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        error={errors.email}
        icon={<Mail className="w-5 h-5" />}
        autoComplete="email"
      />
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
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          id="googleLoginBtn"
          className="flex items-center justify-center gap-2 border-2 border-outline-variant rounded-xl py-3 font-body-md text-sm text-on-surface hover:border-primary hover:bg-primary-fixed/10 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
        <button
          type="button"
          id="microsoftLoginBtn"
          className="flex items-center justify-center gap-2 border-2 border-outline-variant rounded-xl py-3 font-body-md text-sm text-on-surface hover:border-primary hover:bg-primary-fixed/10 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#F25022" d="M11.4 11.4H0V0h11.4z"/>
            <path fill="#7FBA00" d="M24 11.4H12.6V0H24z"/>
            <path fill="#00A4EF" d="M11.4 24H0V12.6h11.4z"/>
            <path fill="#FFB900" d="M24 24H12.6V12.6H24z"/>
          </svg>
          Microsoft
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
