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
    <div className="min-h-screen bg-ghost text-carbon grid grid-cols-1 lg:grid-cols-12">
      {/* Left Architectural Monolith (Imperial Blue #0A2463) */}
      <aside className="hidden lg:flex lg:col-span-7 bg-imperial text-ghost swiss-grid-pattern-dark flex-col justify-between p-10 xl:p-14 relative overflow-hidden border-r border-imperial-border/20">
        {/* Subtle structural corner accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-28 w-96 h-96 rounded-full border border-bluebell/20"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-36 -left-24 w-80 h-80 rounded-full border border-magenta/25"
        />

        {/* Top Institutional Telemetry Bar */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/12 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-ghost text-imperial flex items-center justify-center font-bold shadow-card">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display text-sm font-bold tracking-tight text-ghost">
                Academic Insight
              </div>
              <div className="font-mono text-[11px] text-bluebell-border tracking-wider uppercase">
                SYS // 04.26 · Early Warning Architecture
              </div>
            </div>
          </div>

          <span className="font-mono text-[11px] px-2.5 py-1 rounded border border-bluebell/40 bg-bluebell/15 text-ghost tracking-wider uppercase">
            Deterministic Risk Engine
          </span>
        </div>

        {/* Center Editorial Statement */}
        <div className="relative z-10 max-w-xl my-auto py-12 space-y-6">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-bluebell-border">
            <span className="w-2 h-2 rounded-full bg-magenta" />
            <span>Academic Intelligence, Reimagined</span>
          </div>

          <h1 className="font-display text-3xl xl:text-[42px] font-bold tracking-tight text-ghost leading-[1.12]">
            Identify academic drift before it defines a student&rsquo;s semester.
          </h1>

          <p className="text-sm xl:text-base text-bluebell-border/90 leading-relaxed max-w-lg">
            A precision telemetry and advisory workspace that unifies assessment velocity,
            attendance thresholds, and explainable faculty interventions into a single
            institutional record.
          </p>
        </div>

        {/* Bottom 3-Column Swiss Architectural Matrix */}
        <div className="relative z-10 grid grid-cols-3 border-t border-white/15 pt-6 gap-6">
          <div className="space-y-1.5">
            <div className="font-mono text-[11px] text-bluebell-border uppercase tracking-wider">
              01 // Attendance
            </div>
            <div className="font-display text-xl font-bold text-ghost tabular-nums">
              75.0% <span className="text-xs font-normal text-bluebell-border">floor</span>
            </div>
            <p className="text-xs text-bluebell-border/75 leading-relaxed">
              Live class-deficit recovery projections per course.
            </p>
          </div>

          <div className="space-y-1.5 border-l border-white/12 pl-6">
            <div className="font-mono text-[11px] text-bluebell-border uppercase tracking-wider">
              02 // Trajectory
            </div>
            <div className="font-display text-xl font-bold text-ghost tabular-nums">
              3 Cycles <span className="text-xs font-normal text-bluebell-border">tracked</span>
            </div>
            <p className="text-xs text-bluebell-border/75 leading-relaxed">
              Null-safe weighted grading across Quiz, Midterm, and Assessment 2.
            </p>
          </div>

          <div className="space-y-1.5 border-l border-white/12 pl-6">
            <div className="font-mono text-[11px] text-bluebell-border uppercase tracking-wider">
              03 // Governance
            </div>
            <div className="font-display text-xl font-bold text-ghost tabular-nums">
              Strict RBAC
            </div>
            <p className="text-xs text-bluebell-border/75 leading-relaxed">
              Isolated student self-check and full faculty cohort triage.
            </p>
          </div>
        </div>
      </aside>

      {/* Right Luminous Authentication Canvas (Ghost White #FFFAFF) */}
      <main className="lg:col-span-5 flex flex-col justify-between px-6 py-10 sm:px-12 lg:px-12 xl:px-16 bg-ghost">
        {/* Mobile Brand Header */}
        <div className="flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-md bg-imperial flex items-center justify-center text-ghost shadow-card">
              <BookOpenCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display text-sm font-bold text-imperial">
                Academic Insight
              </div>
              <div className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                Early Warning System
              </div>
            </div>
          </div>

          <div className="font-mono text-[11px] text-ink-muted uppercase tracking-wider">
            PORTAL // AUTH
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-[380px] mx-auto my-auto py-8 space-y-7 animate-view-enter">
          <div className="space-y-2">
            <div className="section-kicker">
              <span>{mode === 'SIGN_IN' ? '01 // Institutional Access' : '02 // Account Recovery'}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-[26px] font-bold text-carbon tracking-tight">
              {mode === 'SIGN_IN'
                ? 'Sign in to your workspace'
                : 'Reset your password'}
            </h2>
            <p className="text-xs text-ink-secondary leading-relaxed">
              {mode === 'SIGN_IN'
                ? 'Enter your university credentials to access your authorized faculty or student portal.'
                : 'Enter your institutional email address to receive password reset instructions.'}
            </p>
          </div>

          <div className="card-surface p-6 sm:p-7 border-t-2 border-t-imperial">
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-md bg-status-danger-bg border border-status-danger-border text-xs text-status-danger-text flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-magenta shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {resetNotice && (
              <div
                role="status"
                className="mb-5 p-3.5 rounded-md bg-status-info-bg border border-status-info-border text-xs text-status-info-text flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-bluebell shrink-0 mt-0.5" />
                <span className="leading-relaxed">{resetNotice}</span>
              </div>
            )}

            {mode === 'SIGN_IN' ? (
              <form onSubmit={handleSignInSubmit} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-carbon mb-1.5"
                  >
                    Institutional Email
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
                    className="input-field py-2.5"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-carbon"
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
                      className="input-field py-2.5 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-imperial p-0.5 rounded transition-colors"
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

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full py-2.5 text-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <span>Sign in to Academic Insight</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-semibold text-carbon mb-1.5"
                  >
                    Institutional Email
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
                    className="input-field py-2.5"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-2.5 text-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending instructions...</span>
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
                  className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-imperial pt-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Security & Governance Footnote */}
        <div className="flex items-center justify-between border-t border-stone-border pt-4 text-[11px] text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-bluebell" />
            <span>Role-based access control enforced</span>
          </span>
          <span className="font-mono">REV 4.2</span>
        </div>
      </main>
    </div>
  );
};
