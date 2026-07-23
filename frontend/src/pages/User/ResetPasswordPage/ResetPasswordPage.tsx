import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, GraduationCap } from 'lucide-react';
import landingPage1 from '@/assets/images/landing-page-1.jpg';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawToken = searchParams.get('token');
  const token = rawToken || 'demo-token-verify-email';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Confirm password does not match.');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate password update at frontend (no backend connection)
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 900);
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel: Visual / Brand ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col overflow-hidden">
        <img
          src={landingPage1}
          alt="QuizzApp Reset Password"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary-container/80 to-secondary/70" />
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full bg-on-primary/10 blur-3xl" />

        <div className="relative z-10 flex flex-col h-full p-12 xl:p-16">
          <Link to="/" className="flex items-center gap-3 group w-fit">
            <div className="w-11 h-11 rounded-2xl bg-on-primary/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-on-primary/30 transition-colors">
              <GraduationCap className="w-6 h-6 text-on-primary" />
            </div>
            <span className="font-heading-bold text-2xl tracking-tight text-on-primary">
              QuizzApp
            </span>
          </Link>

          <div className="my-auto max-w-lg">
            <span className="inline-block px-4 py-1.5 rounded-full bg-on-primary/15 backdrop-blur-md text-on-primary text-xs font-label-bold tracking-wider uppercase mb-6">
              SECURITY FIRST 🛡️
            </span>
            <h1 className="font-heading-bold text-4xl xl:text-5xl text-on-primary leading-tight mb-6">
              Set a new password for your account.
            </h1>
            <p className="text-on-primary/80 text-body-lg leading-relaxed">
              Create a strong and secure password to continue enjoying engaging quizzes on QuizzApp.
            </p>
          </div>

          <div className="pt-8 border-t border-on-primary/15 text-xs text-on-primary/60">
            © 2026 QuizzApp. All rights reserved.
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form Area ────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 xl:w-2/5 bg-background flex flex-col justify-between p-8 sm:p-12 xl:p-16 overflow-y-auto">
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="mb-8">
            <h2 className="font-heading-bold text-3xl text-on-surface tracking-tight mb-2">
              Create new password 🔒
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Please enter your new password below to complete the recovery process.
            </p>
          </div>

          {success ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6 text-center flex flex-col items-center gap-4 animate-in fade-in duration-300">
              <CheckCircle2 className="w-14 h-14 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="font-heading-bold text-xl text-emerald-800 dark:text-emerald-300 mb-2">
                  Password Reset Successfully! 🎉
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Your password has been updated successfully. Please sign in again to continue.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="mt-3 font-button text-button bg-primary text-on-primary w-full py-4 rounded-full shadow-md hover:shadow-lg transition-all"
              >
                Sign In Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              {error && (
                <div className="bg-error/10 border border-error/20 text-error rounded-xl p-4 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* New Password */}
              <div className="flex flex-col gap-2">
                <label className="font-label-bold text-sm text-on-surface">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-12 pr-12 py-3.5 bg-surface border border-outline/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-on-surface text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-2">
                <label className="font-label-bold text-sm text-on-surface">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-12 pr-12 py-3.5 bg-surface border border-outline/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-on-surface text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-4 font-button text-button bg-primary text-on-primary w-full py-4 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Updating password...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-label-bold text-on-surface-variant hover:text-primary transition-colors text-center w-full py-2 text-sm flex items-center justify-center gap-1.5 focus:outline-none"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel & Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

