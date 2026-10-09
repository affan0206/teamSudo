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
import { ThemeToggle } from './ThemeToggle';

interface LoginPageProps {
  onLoginSuccess: (user: AuthenticatedUserProfile) => void;
  accessErrorMessage?: string | null;
  onNavigateHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  accessErrorMessage,
  onNavigateHome,
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
      return 'Please enter your email address.';
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
      setErrorMessage('Please enter a valid email address.');
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
    <div className="min-h-screen bg-ghost text-carbon grid grid-cols-1 lg:grid-cols-12">
      {/* Left Brand Panel (Night Bordeaux #450920) */}
      <aside className="hidden lg:flex lg:col-span-6 bg-sidebar text-sidebar-text border-r border-sidebar-border swiss-grid-pattern-dark flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        <a
          href="/"
          onClick={(e) => {
            if (onNavigateHome) {
              e.preventDefault();
              onNavigateHome();
            }
          }}
          className="relative z-10 inline-flex items-center gap-3 self-start"
        >
          <div className="w-9 h-9 rounded-lg bg-apricot text-bordeaux flex items-center justify-center shadow-card">
            <BookOpenCheck className="w-5 h-5" />
          </div>
          <span className="font-display text-base font-bold tracking-tight text-sidebar-text">
            Academic Insight
          </span>
        </a>

        <div className="relative z-10 max-w-md my-auto space-y-5">
          <h1 className="font-display text-3xl xl:text-4xl font-bold tracking-tight text-sidebar-text leading-tight">
            Academic performance &amp; early-warning analytics.
          </h1>
          <p className="text-sm text-sidebar-muted/90 leading-relaxed">
            Track assessment progress, attendance targets, and faculty support in one place.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 border-t border-sidebar-border pt-6 gap-6">
          <div>
            <div className="text-xs text-sidebar-muted">Attendance target</div>
            <div className="font-display text-xl font-bold text-sidebar-text tabular-nums mt-1">
              75%
            </div>
          </div>
          <div className="border-l border-sidebar-border pl-6">
            <div className="text-xs text-sidebar-muted">Passing score</div>
            <div className="font-display text-xl font-bold text-sidebar-text tabular-nums mt-1">
              50%
            </div>
          </div>
          <div className="border-l border-sidebar-border pl-6">
            <div className="text-xs text-sidebar-muted">Access model</div>
            <div className="font-display text-xl font-bold text-sidebar-text mt-1">
              Role-based
            </div>
          </div>
        </div>
      </aside>

      {/* Right Sign-In Workspace */}
      <main className="lg:col-span-6 flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 bg-ghost">
        <div className="flex items-center justify-between gap-3">
          <a
            href="/"
            onClick={(e) => {
              if (onNavigateHome) {
                e.preventDefault();
                onNavigateHome();
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-ink-secondary hover:text-carbon transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-bluebell" />
            <span>Back to Home</span>
          </a>
          <ThemeToggle showLabel />
        </div>

        <div className="w-full max-w-[380px] mx-auto my-auto py-8 space-y-6 animate-view-enter">
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl sm:text-[28px] font-bold text-carbon tracking-tight">
              {mode === 'SIGN_IN' ? 'Sign in' : 'Reset password'}
            </h2>
            <p className="text-sm text-ink-secondary">
              {mode === 'SIGN_IN'
                ? 'Enter your institutional credentials to continue.'
                : 'Enter your institutional email to receive a reset link.'}
            </p>
          </div>

          <div className="card-surface p-6 sm:p-7">
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-lg bg-status-danger-bg border border-status-danger-border text-sm text-status-danger-text flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-magenta shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {resetNotice && (
              <div
                role="status"
                className="mb-5 p-3.5 rounded-lg bg-status-info-bg border border-status-info-border text-sm text-status-info-text flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-bluebell shrink-0 mt-0.5" />
                <span>{resetNotice}</span>
              </div>
            )}

            {mode === 'SIGN_IN' ? (
              <form onSubmit={handleSignInSubmit} className="space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-sm font-medium text-carbon mb-1.5"
                  >
                    Email
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
                      className="block text-sm font-medium text-carbon"
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
                      className="text-xs font-medium text-bluebell hover:text-imperial transition-colors"
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
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-imperial p-0.5 rounded transition-colors"
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
                  className="btn-primary w-full"
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
              <form onSubmit={handleResetSubmit} className="space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-sm font-medium text-carbon mb-1.5"
                  >
                    Email
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
                  className="btn-primary w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send reset link</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('SIGN_IN');
                    setErrorMessage(null);
                    setResetNotice(null);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-imperial pt-1 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to sign in</span>
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-start text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-bluebell" />
            <span>Role-based access control</span>
          </span>
        </div>
      </main>
    </div>
  );
};
