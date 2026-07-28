import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowLeft, GraduationCap, Mail, RefreshCw } from 'lucide-react';
import landingPage1 from '@/assets/images/landing-page-1.jpg';
import { authService } from '@/services';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // States for resending verification email (if link expired)
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Verification token is missing. Please check your link.');
      setLoading(false);
      return;
    }

    const performVerification = async () => {
      try {
        await authService.verifyEmail(token);
        setSuccess(true);
        // Automatically redirect to login page after 3.5s
        setTimeout(() => {
          navigate('/login');
        }, 3500);
      } catch (err: any) {
        setError(err.message || 'Verification link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    performVerification();
  }, [token, navigate]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setResendLoading(true);
    setResendMessage(null);
    setResendError(null);

    try {
      const res = await authService.resendVerification(email);
      setResendMessage(res.message || 'Verification email has been resent successfully.');
    } catch (err: any) {
      setResendError(err.message || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel: Visual / Brand ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col overflow-hidden">
        <img
          src={landingPage1}
          alt="QuizzApp Verification"
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
              ACCOUNT ACTIVATION 🛡️
            </span>
            <h1 className="font-heading-bold text-4xl xl:text-5xl text-on-primary leading-tight mb-6">
              Verify your email address.
            </h1>
            <p className="text-on-primary/80 text-body-lg leading-relaxed">
              Unlock a world of interactive learning and hosting. Join thousands of creators today.
            </p>
          </div>

          <div className="pt-8 border-t border-on-primary/15 text-xs text-on-primary/60">
            © 2026 QuizzApp. All rights reserved.
          </div>
        </div>
      </div>

      {/* ── Right Panel: Process State Area ─────────────────────────────────── */}
      <div className="w-full lg:w-1/2 xl:w-2/5 bg-background flex flex-col justify-between p-8 sm:p-12 xl:p-16 overflow-y-auto">
        {/* Back Link */}
        <div className="flex justify-start">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-label-bold text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>

        {/* Content Box */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          {loading && (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-8 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h2 className="font-heading-bold text-2xl text-on-surface tracking-tight">
                Verifying your account
              </h2>
              <p className="text-body-md text-on-surface-variant max-w-sm">
                Please wait a moment while we process your request.
              </p>
            </div>
          )}

          {!loading && success && (
            <div className="flex flex-col items-center justify-center text-center gap-5 py-8 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 shadow-lg shadow-green-500/15 animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="font-heading-bold text-3xl text-on-surface tracking-tight">
                Verification Successful!
              </h2>
              <p className="text-body-md text-on-surface-variant max-w-sm">
                Your email has been verified. You will be redirected to the sign-in page in a few seconds...
              </p>
              <Link
                to="/login"
                className="mt-4 font-button text-button bg-primary text-on-primary px-8 py-3.5 rounded-full hover:shadow-lg transition-all"
              >
                Sign In Now
              </Link>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="text-center flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="font-heading-bold text-2xl text-on-surface tracking-tight">
                  Verification Failed
                </h2>
                <p className="text-body-md text-error/95 bg-error-container/10 border border-error/20 p-4 rounded-xl max-w-md">
                  {error}
                </p>
              </div>

              {/* Form to resend verification link */}
              <div className="border-t border-outline-variant/30 pt-6">
                <h3 className="font-heading-bold text-lg text-on-surface mb-2">
                  Need a new verification link?
                </h3>
                <p className="text-body-sm text-on-surface-variant mb-4">
                  Enter your email address below, and we will send you a new activation link.
                </p>

                <form onSubmit={handleResend} className="flex flex-col gap-4">
                  <div className="relative">
                    <InputFieldEmail
                      value={email}
                      onChange={setEmail}
                      disabled={resendLoading}
                    />
                  </div>

                  {resendError && (
                    <p className="text-xs text-error font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {resendError}
                    </p>
                  )}

                  {resendMessage && (
                    <p className="text-xs text-green-600 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {resendMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={resendLoading || !email}
                    className="font-button text-button bg-primary text-on-primary w-full py-3.5 rounded-full hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {resendLoading ? 'Resending...' : 'Send Verification Link'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Brand Footer */}
        <div className="text-center text-xs text-on-surface-variant shrink-0 pt-8">
          Need help? Contact{' '}
          <a href="mailto:support@quizzapp.com" className="text-primary hover:underline font-semibold">
            support@quizzapp.com
          </a>
        </div>
      </div>
    </div>
  );
};

// Helper component
const InputFieldEmail: React.FC<{
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
        <Mail className="w-5 h-5" />
      </div>
      <input
        type="email"
        placeholder="Enter your email address"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container border border-outline-variant hover:border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface text-sm font-sans"
        required
      />
    </div>
  );
};
