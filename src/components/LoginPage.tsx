import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from 'lucide-react';
import { sendPasswordResetRequest, signInWithEmailPassword } from '../services/authService';
import { AuthenticatedUserProfile } from '../types/auth';

interface LoginPageProps {
  onLoginSuccess: (user: AuthenticatedUserProfile) => void;
  accessErrorMessage?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  accessErrorMessage,
}) => {
  const [mode, setMode] = useState<'SIGN_IN' | 'RESET_PASSWORD'>('SIGN_IN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    accessErrorMessage ?? null
  );
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const validateSignInForm = (): string | null => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return 'Please enter your institutional email address.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }
    if (!password) {
      return 'Please enter your password.';
    }
    return null;
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResetNotice(null);

    const validationError = validateSignInForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signInWithEmailPassword(email, password);
      if (!result.authenticated || !result.user) {
        setErrorMessage(result.error || 'Invalid email or password.');
        return;
      }
      onLoginSuccess(result.user);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResetNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid institutional email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendPasswordResetRequest(trimmedEmail);
      if (!res.ok) {
        setErrorMessage(res.message);
      } else {
        setResetNotice(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ghost text-ink-primary flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-[380px] space-y-6">
        {/* Compact Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="w-10 h-10 rounded-lg bg-imperial flex items-center justify-center text-ghost shadow-card border border-imperial-border/40">
            <BookOpenCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-imperial">
              Academic Insight
            </div>
            <h1 className="text-xl font-semibold text-ink-primary tracking-tight mt-0.5">
              {mode === 'SIGN_IN'
                ? 'Sign in to Academic Insight'
                : 'Reset your password'}
            </h1>
            <p className="text-xs text-ink-secondary mt-1">
              {mode === 'SIGN_IN'
                ? 'Use your institutional email and password to continue.'
                : 'Enter your institutional email to receive reset instructions.'}
            </p>
          </div>
        </div>

        {/* Sign-In / Password Reset Card */}
        <div className="card-surface p-6 border-t-2 border-t-imperial">
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-md bg-status-danger-bg border border-status-danger-border text-xs text-status-danger-text flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-magenta shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {resetNotice && (
            <div
              role="status"
              className="mb-4 p-3 rounded-md bg-status-info-bg border border-status-info-border text-xs text-status-info-text flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-bluebell shrink-0 mt-0.5" />
              <span>{resetNotice}</span>
            </div>
          )}

          {mode === 'SIGN_IN' ? (
            <form onSubmit={handleSignInSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-medium text-ink-primary mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  disabled={isSubmitting}
                  className="input-field"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-medium text-ink-primary"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('RESET_PASSWORD');
                      setErrorMessage(null);
                      setResetNotice(null);
                    }}
                    className="text-xs font-medium text-imperial hover:text-bluebell transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                    className="input-field pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-imperial p-0.5 rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-2.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-medium text-ink-primary mb-1.5"
                >
                  Institutional email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  disabled={isSubmitting}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-2.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send reset instructions</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('SIGN_IN');
                  setErrorMessage(null);
                  setResetNotice(null);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-imperial pt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </button>
            </form>
          )}
        </div>

        {/* Minimal Security Footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
          <Lock className="w-3 h-3 text-bluebell" />
          <span>Role-based access control · Authorized academic accounts only</span>
        </div>
      </div>
    </div>
  );
};
