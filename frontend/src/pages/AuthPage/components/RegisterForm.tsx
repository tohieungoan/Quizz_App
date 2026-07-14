import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { InputField } from './InputField'
import { RegisterFormData } from '../types'

interface RegisterFormProps {
  onSwitchLogin: () => void
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchLogin }) => {
  const [form, setForm] = useState<RegisterFormData>({
    fullName: '', email: '', password: '', confirmPassword: '', agreeTerms: false,
  })
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const passwordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    const levels = [
      { score: 0, label: '', color: '' },
      { score: 1, label: 'Weak 🔴', color: 'bg-error' },
      { score: 2, label: 'Fair 🟡', color: 'bg-tertiary-fixed-dim' },
      { score: 3, label: 'Good 🟢', color: 'bg-secondary-container' },
      { score: 4, label: 'Strong 💪', color: 'bg-secondary' },
    ]
    return levels[score] || levels[0]
  }

  const strength = form.password ? passwordStrength(form.password) : { score: 0, label: '', color: '' }

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required.'
    if (!form.email) newErrors.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email address.'
    if (!form.password) newErrors.password = 'Password is required.'
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters.'
    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password.'
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.'
    if (!form.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms.'
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
    setTimeout(() => navigate('/dashboard'), 1200)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center animate-bounce">
          <CheckCircle className="w-10 h-10 text-secondary" />
        </div>
        <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Account created!</h3>
        <p className="text-on-surface-variant font-body-md text-center">Welcome to QuizzApp. Redirecting you now...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <InputField
        id="register-name"
        label="Full name"
        value={form.fullName}
        onChange={(v) => setForm({ ...form, fullName: v })}
        error={errors.fullName}
        icon={<User className="w-5 h-5" />}
        autoComplete="name"
      />
      <InputField
        id="register-email"
        type="email"
        label="Email address"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        error={errors.email}
        icon={<Mail className="w-5 h-5" />}
        autoComplete="email"
      />
      <div className="flex flex-col gap-1.5">
        <InputField
          id="register-password"
          type={showPwd ? 'text' : 'password'}
          label="Password"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
          error={errors.password}
          icon={<Lock className="w-5 h-5" />}
          autoComplete="new-password"
          rightElement={
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-outline hover:text-primary transition-colors p-0.5">
              {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          }
        />
        {/* Strength bar */}
        {form.password && (
          <div className="flex items-center justify-between pl-1 pr-1 mt-0.5 animate-in slide-in-from-top-1 duration-200">
            <div className="flex gap-1.5 flex-1 max-w-[200px]">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i <= strength.score ? strength.color : 'bg-outline-variant/40'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-label-bold text-on-surface-variant">{strength.label}</span>
          </div>
        )}
      </div>
      <InputField
        id="register-confirm"
        type={showConfirm ? 'text' : 'password'}
        label="Confirm password"
        value={form.confirmPassword}
        onChange={(v) => setForm({ ...form, confirmPassword: v })}
        error={errors.confirmPassword}
        icon={<Lock className="w-5 h-5" />}
        autoComplete="new-password"
        rightElement={
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-outline hover:text-primary transition-colors p-0.5">
            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        }
      />

      {/* Terms */}
      <div className="flex flex-col gap-1 mt-1">
        <label className="flex items-start gap-2 cursor-pointer select-none">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={form.agreeTerms}
              onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
              className="sr-only peer"
            />
            <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
              errors.agreeTerms ? 'border-error' : 'border-outline-variant peer-checked:border-primary'
            } peer-checked:bg-primary`}>
              {form.agreeTerms && (
                <svg className="w-3 h-3 text-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="font-body-md text-sm text-on-surface-variant leading-relaxed">
            I agree to the{' '}
            <a href="#" className="text-primary hover:underline font-label-bold">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-primary hover:underline font-label-bold">Privacy Policy</a>
          </span>
        </label>
        {errors.agreeTerms && (
          <span className="text-error text-sm font-body-md pl-7">{errors.agreeTerms}</span>
        )}
      </div>

      <button
        type="submit"
        id="registerBtn"
        disabled={loading}
        className="mt-1 font-button text-button bg-primary text-on-primary w-full py-4 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </button>

      <p className="text-center font-body-md text-sm text-on-surface-variant">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchLogin} className="text-primary font-label-bold hover:underline focus:outline-none">
          Sign In
        </button>
      </p>
    </form>
  )
}
