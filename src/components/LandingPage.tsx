import React from 'react';
import {
  Activity,
  ArrowRight,
  Atom,
  Binary,
  BookOpen,
  BookOpenCheck,
  Calculator,
  CircuitBoard,
  Cpu,
  FileText,
  Gauge,
  GraduationCap,
  LineChart,
  Lock,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import {
  STUDY_NOTES_CATALOG,
  StudySubjectCategory,
  SubjectIconKey,
  getTotalStudyNotesCount,
} from '../data/studyNotesCatalog';
import { LandingSectionId, PublicNavbar } from './PublicNavbar';

interface LandingPageProps {
  onNavigateLogin: () => void;
  onOpenNotesDirectory: () => void;
  onOpenSubjectNotes: (subjectSlug: string) => void;
  onNavigateDashboard?: () => void;
  isAuthenticated?: boolean;
}

export const SubjectCategoryIcon: React.FC<{
  iconKey: SubjectIconKey;
  className?: string;
}> = ({ iconKey, className = 'w-5 h-5' }) => {
  switch (iconKey) {
    case 'mathematics':
      return <Calculator className={className} />;
    case 'physics':
      return <Atom className={className} />;
    case 'digital-electronics':
      return <Binary className={className} />;
    case 'signals-and-systems':
      return <Activity className={className} />;
    case 'control-systems':
      return <Gauge className={className} />;
    case 'electronic-devices-and-circuits':
      return <CircuitBoard className={className} />;
    default:
      return <Cpu className={className} />;
  }
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateLogin,
  onOpenNotesDirectory,
  onOpenSubjectNotes,
  onNavigateDashboard,
  isAuthenticated = false,
}) => {
  const totalNotesCount = getTotalStudyNotesCount();

  const scrollToSection = (sectionId: LandingSectionId) => {
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCardKeyDown = (
    e: React.KeyboardEvent,
    subject: StudySubjectCategory
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenSubjectNotes(subject.slug);
    }
  };

  return (
    <div id="home" className="min-h-screen flex flex-col bg-ghost text-carbon">
      {/* Shared Public Navigation Bar */}
      <PublicNavbar
        onNavigateHome={() => scrollToSection('home')}
        onNavigateSection={scrollToSection}
        onNavigateLogin={onNavigateLogin}
        onNavigateDashboard={onNavigateDashboard}
        isAuthenticated={isAuthenticated}
      />

      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden border-b border-stone-border swiss-grid-pattern">
          <div className="max-w-[1260px] mx-auto px-5 sm:px-8 lg:px-10 py-14 sm:py-20 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left (7 cols): Headline, Supporting Text & Two Actions */}
              <div className="lg:col-span-7 space-y-6 animate-view-enter">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-stone-border text-xs font-medium text-ink-secondary shadow-card">
                  <BookOpen className="w-3.5 h-3.5 text-bluebell" />
                  <span>Academic Intelligence &amp; Open Study Library</span>
                </div>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-carbon leading-[1.08]">
                  Learn Better. Stay Ahead.
                </h1>

                <p className="text-base sm:text-lg text-ink-secondary leading-relaxed max-w-2xl">
                  Explore academic study notes and learning resources, while helping
                  educators turn student performance data into actionable insights.
                </p>

                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <button
                    type="button"
                    onClick={() => scrollToSection('study-notes')}
                    className="btn-primary px-5 py-3 text-sm"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Explore Study Notes</span>
                  </button>

                  <a
                    href="/login"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateLogin();
                    }}
                    className="btn-secondary px-5 py-3 text-sm font-semibold"
                  >
                    <LogIn className="w-4 h-4 text-bluebell" />
                    <span>Login</span>
                  </a>
                </div>
              </div>

              {/* Right (5 cols): Brand Architecture Card (Public Resources vs Protected Portal) */}
              <div className="lg:col-span-5">
                <div className="monolith-surface p-6 sm:p-7 space-y-5 swiss-grid-pattern-dark">
                  <div className="flex items-center justify-between border-b border-sidebar-border pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-apricot text-bordeaux flex items-center justify-center">
                        <BookOpenCheck className="w-4 h-4" />
                      </div>
                      <span className="font-display text-sm font-bold text-sidebar-text">
                        Platform Overview
                      </span>
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-berry/50 border border-blush/40 text-sidebar-text">
                      Two-Tier Access
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {/* Tier 1: Public Study Notes */}
                    <div className="p-4 rounded-lg bg-white/8 border border-white/12 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-cotton">
                          Public Learning Resources
                        </span>
                        <span className="text-[11px] font-mono text-sidebar-text/90 px-2 py-0.5 rounded bg-white/10">
                          Open Access
                        </span>
                      </div>
                      <p className="text-xs text-sidebar-text/85 leading-relaxed">
                        Browse {STUDY_NOTES_CATALOG.length} engineering &amp; science subjects with{' '}
                        {totalNotesCount} structured sample revision notes, formulas, and worked examples without signing in.
                      </p>
                    </div>

                    {/* Tier 2: Protected Role-Based Portals */}
                    <div className="p-4 rounded-lg bg-white/8 border border-white/12 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-text inline-flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-cotton" />
                          <span>Authorized Academic Portals</span>
                        </span>
                        <span className="text-[11px] font-mono text-sidebar-text/90 px-2 py-0.5 rounded bg-berry/60 border border-blush/40">
                          Login Required
                        </span>
                      </div>
                      <p className="text-xs text-sidebar-text/85 leading-relaxed">
                        Private student performance records, attendance targets (75%), passing thresholds (50%), and faculty interventions require institutional login.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 border-t border-sidebar-border pt-4 gap-4 text-center">
                    <div>
                      <div className="font-display text-lg font-bold text-sidebar-text tabular-nums">
                        {STUDY_NOTES_CATALOG.length}
                      </div>
                      <div className="text-[11px] text-sidebar-muted">Subjects</div>
                    </div>
                    <div className="border-l border-sidebar-border">
                      <div className="font-display text-lg font-bold text-sidebar-text tabular-nums">
                        {totalNotesCount}
                      </div>
                      <div className="text-[11px] text-sidebar-muted">Revision notes</div>
                    </div>
                    <div className="border-l border-sidebar-border">
                      <div className="font-display text-lg font-bold text-sidebar-text">
                        RBAC
                      </div>
                      <div className="text-[11px] text-sidebar-muted">Protected data</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. PUBLIC STUDY NOTES SECTION */}
        <section
          id="study-notes"
          className="scroll-mt-16 py-16 sm:py-20 border-b border-stone-border"
        >
          <div className="max-w-[1260px] mx-auto px-5 sm:px-8 lg:px-10 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-carbon">
                  Study Notes &amp; Learning Resources
                </h2>
                <p className="text-sm sm:text-base text-ink-secondary max-w-2xl">
                  Explore subject-wise notes and revision materials to support your learning.
                </p>
              </div>

              <a
                href="/notes"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenNotesDirectory();
                }}
                className="btn-secondary self-start sm:self-auto text-xs sm:text-sm"
              >
                <FileText className="w-4 h-4 text-bluebell" />
                <span>Browse All Notes ({totalNotesCount})</span>
              </a>
            </div>

            {/* Responsive Subject Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {STUDY_NOTES_CATALOG.map((subject) => {
                const notesCount = subject.topics.length;
                return (
                  <article
                    key={subject.slug}
                    role="link"
                    tabIndex={0}
                    aria-label={`${subject.name} — View ${notesCount} study notes`}
                    onClick={() => onOpenSubjectNotes(subject.slug)}
                    onKeyDown={(e) => handleCardKeyDown(e, subject)}
                    className="card-surface p-6 flex flex-col justify-between gap-5 cursor-pointer group hover:border-bluebell-border hover:shadow-elevated transition-all duration-150"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="w-10 h-10 rounded-lg bg-subtle border border-stone-border text-imperial flex items-center justify-center shrink-0 group-hover:bg-bluebell-light group-hover:border-bluebell-border transition-colors">
                          <SubjectCategoryIcon
                            iconKey={subject.iconKey}
                            className="w-5 h-5"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-subtle border border-stone-border text-ink-secondary">
                            {subject.code}
                          </span>
                          {notesCount > 0 && (
                            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-status-info-bg border border-status-info-border text-status-info-text tabular-nums">
                              {notesCount} {notesCount === 1 ? 'note' : 'notes'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="font-display text-lg font-bold text-carbon group-hover:text-imperial transition-colors">
                          {subject.name}
                        </h3>
                        <p className="text-sm text-ink-secondary line-clamp-2 leading-relaxed">
                          {subject.shortDescription}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-stone-border flex items-center justify-between">
                      <span className="text-xs text-ink-muted">
                        Sample revision summary
                      </span>
                      <a
                        href={`/notes/${subject.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onOpenSubjectNotes(subject.slug);
                        }}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-bluebell group-hover:text-imperial transition-colors"
                      >
                        <span>View Notes</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. FEATURES SECTION */}
        <section
          id="features"
          className="scroll-mt-16 py-16 sm:py-20 border-b border-stone-border bg-subtle/35"
        >
          <div className="max-w-[1260px] mx-auto px-5 sm:px-8 lg:px-10 space-y-10">
            <div className="space-y-2 max-w-2xl">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-carbon">
                Built for Clarity &amp; Academic Momentum
              </h2>
              <p className="text-sm sm:text-base text-ink-secondary">
                Combining open study materials with role-protected academic analytics for students and faculty.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-surface p-6 space-y-3 border-t-2 border-t-imperial">
                <div className="w-9 h-9 rounded-lg bg-subtle border border-stone-border text-imperial flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-display text-base font-bold text-carbon">
                  Structured Study Notes
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed">
                  Subject-wise concept summaries, key formulas, worked examples, and downloadable sample PDF revision sheets available without login.
                </p>
              </div>

              <div className="card-surface p-6 space-y-3 border-t-2 border-t-bluebell">
                <div className="w-9 h-9 rounded-lg bg-subtle border border-stone-border text-bluebell flex items-center justify-center">
                  <LineChart className="w-4 h-4" />
                </div>
                <h3 className="font-display text-base font-bold text-carbon">
                  Early-Warning Analytics
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed">
                  Automated evaluation of attendance thresholds, weighted assessment scores, and multi-cycle performance trends in the faculty portal.
                </p>
              </div>

              <div className="card-surface p-6 space-y-3 border-t-2 border-t-imperial">
                <div className="w-9 h-9 rounded-lg bg-subtle border border-stone-border text-imperial flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-display text-base font-bold text-carbon">
                  Role-Based Access Control
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed">
                  Strict separation between public study resources, individual student self-check portals, and faculty cohort management.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. HOW IT WORKS SECTION */}
        <section id="how-it-works" className="scroll-mt-16 py-16 sm:py-20">
          <div className="max-w-[1260px] mx-auto px-5 sm:px-8 lg:px-10 space-y-10">
            <div className="space-y-2 max-w-2xl">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-carbon">
                How It Works
              </h2>
              <p className="text-sm sm:text-base text-ink-secondary">
                Access open learning resources immediately or sign in to view authorized academic records.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-surface p-6 space-y-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-imperial text-ghost font-mono text-xs font-bold">
                  01
                </span>
                <h3 className="font-display text-base font-bold text-carbon">
                  Explore Public Notes
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed">
                  Select any subject card above to read definitions, key formulas, worked problems, and revision points without an account.
                </p>
              </div>

              <div className="card-surface p-6 space-y-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-imperial text-ghost font-mono text-xs font-bold">
                  02
                </span>
                <h3 className="font-display text-base font-bold text-carbon">
                  Sign In to Your Portal
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed">
                  Click Login to authenticate with your institutional account and access your role-specific student or faculty workspace.
                </p>
              </div>

              <div className="card-surface p-6 space-y-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-imperial text-ghost font-mono text-xs font-bold">
                  03
                </span>
                <h3 className="font-display text-base font-bold text-carbon">
                  Track &amp; Act on Insights
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed">
                  Students monitor attendance and exam targets while educators coordinate timely academic support and mentoring.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-border bg-surface py-8">
        <div className="max-w-[1260px] mx-auto px-5 sm:px-8 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-secondary">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-sidebar text-sidebar-text flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-[var(--soft-apricot)]" />
            </div>
            <span className="font-display font-bold text-carbon">
              Academic Insight
            </span>
            <span className="text-ink-muted">
              · Sample study notes are open educational aids; private student data requires login.
            </span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="/notes"
              onClick={(e) => {
                e.preventDefault();
                onOpenNotesDirectory();
              }}
              className="hover:text-carbon transition-colors"
            >
              Study Notes
            </a>
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                onNavigateLogin();
              }}
              className="font-semibold text-bluebell hover:text-imperial transition-colors"
            >
              Login
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
