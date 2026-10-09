import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  Info,
  Search,
} from 'lucide-react';
import {
  STUDY_NOTES_CATALOG,
  StudyNoteTopic,
  StudySubjectCategory,
  findStudySubjectBySlug,
  getTotalStudyNotesCount,
} from '../data/studyNotesCatalog';
import { SubjectCategoryIcon } from './LandingPage';
import { LandingSectionId, PublicNavbar } from './PublicNavbar';

interface StudyNotesViewProps {
  subjectSlug?: string;
  onNavigateHome: () => void;
  onNavigateSection: (sectionId: LandingSectionId) => void;
  onNavigateLogin: () => void;
  onSelectSubjectSlug: (slug: string | null) => void;
  onNavigateDashboard?: () => void;
  isAuthenticated?: boolean;
}

const TopicDetailCard: React.FC<{
  topic: StudyNoteTopic;
  subject: StudySubjectCategory;
}> = ({ topic, subject }) => {
  return (
    <article className="card-surface overflow-hidden">
      {/* Topic Header */}
      <div className="px-6 py-5 border-b border-stone-border bg-subtle/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-surface border border-stone-border text-imperial">
              {subject.code}
            </span>
            <span className="text-xs font-medium text-ink-secondary">
              {topic.moduleTag}
            </span>
            {subject.isSampleResource && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-status-info-bg border border-status-info-border text-status-info-text">
                Sample Revision Summary
              </span>
            )}
          </div>
          <h2 className="font-display text-xl font-bold text-carbon tracking-tight">
            {topic.title}
          </h2>
        </div>

        {subject.pdfUrl && (
          <a
            href={subject.pdfUrl}
            download
            className="btn-secondary py-2 px-3.5 text-xs shrink-0 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-bluebell" />
            <span>Download Sample PDF</span>
          </a>
        )}
      </div>

      {/* Topic Body */}
      <div className="p-6 sm:p-7 space-y-7 max-w-4xl">
        {/* 1. Short Concept Explanation */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Concept Explanation
          </h3>
          <p className="text-sm sm:text-base text-carbon leading-relaxed">
            {topic.conceptExplanation}
          </p>
        </section>

        {/* 2. Important Definitions */}
        {topic.definitions.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Important Definitions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {topic.definitions.map((def) => (
                <div
                  key={def.term}
                  className="p-4 rounded-lg bg-subtle/45 border border-stone-border space-y-1"
                >
                  <div className="text-sm font-semibold text-carbon">
                    {def.term}
                  </div>
                  <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                    {def.definition}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Key Formulas */}
        {topic.formulas.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Key Formulas
            </h3>
            <div className="space-y-3">
              {topic.formulas.map((formula) => (
                <div
                  key={formula.label}
                  className="p-4 rounded-lg bg-surface border border-stone-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-ink-secondary">
                      {formula.label}
                    </div>
                    <div className="font-mono text-sm sm:text-base font-bold text-imperial tracking-tight">
                      {formula.expression}
                    </div>
                  </div>
                  <div className="text-xs text-ink-muted sm:text-right max-w-xs">
                    {formula.context}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Worked Example */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Worked Example
          </h3>
          <div className="p-5 rounded-lg bg-subtle/50 border border-stone-border space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-bluebell">
                Problem Statement
              </span>
              <p className="text-sm font-medium text-carbon mt-1 leading-relaxed">
                {topic.workedExample.problem}
              </p>
            </div>

            <div className="space-y-2 border-t border-stone-border pt-3.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Step-by-Step Solution
              </span>
              <ol className="space-y-1.5 text-sm text-ink-secondary list-decimal list-inside">
                {topic.workedExample.steps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Result:
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold px-3 py-1 rounded-md bg-surface border border-stone-border text-imperial">
                {topic.workedExample.answer}
              </span>
            </div>
          </div>
        </section>

        {/* 5. Revision Points */}
        {topic.revisionPoints.length > 0 && (
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Revision Points
            </h3>
            <ul className="space-y-2">
              {topic.revisionPoints.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-sm text-ink-secondary leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-bluebell shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
};

export const StudyNotesView: React.FC<StudyNotesViewProps> = ({
  subjectSlug,
  onNavigateHome,
  onNavigateSection,
  onNavigateLogin,
  onSelectSubjectSlug,
  onNavigateDashboard,
  isAuthenticated = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const activeSubject = useMemo(
    () => findStudySubjectBySlug(subjectSlug),
    [subjectSlug]
  );

  const filteredSubjects = useMemo(() => {
    const baseList = activeSubject ? [activeSubject] : STUDY_NOTES_CATALOG;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return baseList;

    return baseList
      .map((subject) => {
        const subjectMatches =
          subject.name.toLowerCase().includes(q) ||
          subject.code.toLowerCase().includes(q) ||
          subject.shortDescription.toLowerCase().includes(q);

        if (subjectMatches) return subject;

        const matchingTopics = subject.topics.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.conceptExplanation.toLowerCase().includes(q) ||
            t.definitions.some(
              (d) =>
                d.term.toLowerCase().includes(q) ||
                d.definition.toLowerCase().includes(q)
            )
        );

        if (matchingTopics.length === 0) return null;
        return {
          ...subject,
          topics: matchingTopics,
        };
      })
      .filter((s): s is StudySubjectCategory => s !== null);
  }, [activeSubject, searchQuery]);

  const totalNotesCount = getTotalStudyNotesCount();

  return (
    <div className="min-h-screen flex flex-col bg-ghost text-carbon">
      {/* Shared Public Navigation Bar */}
      <PublicNavbar
        onNavigateHome={onNavigateHome}
        onNavigateSection={onNavigateSection}
        onNavigateLogin={onNavigateLogin}
        onNavigateDashboard={onNavigateDashboard}
        isAuthenticated={isAuthenticated}
      />

      <main className="flex-1 max-w-[1260px] w-full mx-auto px-5 sm:px-8 lg:px-10 py-8 sm:py-10 space-y-8 animate-view-enter">
        {/* Top Breadcrumb & Back Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
              className="inline-flex items-center gap-1.5 font-medium text-bluebell hover:text-imperial transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Landing Page</span>
            </a>
            <span className="text-ink-muted">/</span>
            <button
              type="button"
              onClick={() => onSelectSubjectSlug(null)}
              className={`font-medium transition-colors ${
                activeSubject
                  ? 'text-ink-secondary hover:text-carbon'
                  : 'text-carbon font-semibold'
              }`}
            >
              Study Notes
            </button>
            {activeSubject && (
              <>
                <span className="text-ink-muted">/</span>
                <span className="font-semibold text-carbon">
                  {activeSubject.name}
                </span>
              </>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-subtle border border-stone-border text-xs text-ink-secondary">
            <Info className="w-3.5 h-3.5 text-bluebell shrink-0" />
            <span>
              Public sample revision material — not official institutional coursework
            </span>
          </div>
        </div>

        {/* Page Header Banner */}
        <header className="card-surface p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              {activeSubject ? (
                <div className="w-10 h-10 rounded-lg bg-subtle border border-stone-border text-imperial flex items-center justify-center shrink-0">
                  <SubjectCategoryIcon
                    iconKey={activeSubject.iconKey}
                    className="w-5 h-5"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-subtle border border-stone-border text-imperial flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
              )}
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
                  {activeSubject
                    ? activeSubject.name
                    : 'Study Notes & Learning Resources'}
                </h1>
                <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
                  {activeSubject
                    ? `${activeSubject.code} · ${activeSubject.shortDescription}`
                    : `Browse ${totalNotesCount} sample revision notes across ${STUDY_NOTES_CATALOG.length} subjects without signing in.`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, formulas..."
                aria-label="Search study notes"
                className="input-field pl-9 py-2 text-sm"
              />
            </div>

            {activeSubject && activeSubject.pdfUrl && (
              <a
                href={activeSubject.pdfUrl}
                download
                className="btn-primary py-2 px-4 text-xs sm:text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Subject PDF</span>
              </a>
            )}
          </div>
        </header>

        {/* Subject Switcher Bar */}
        <nav
          aria-label="Study Note Subjects"
          className="flex items-center gap-2 overflow-x-auto pb-1"
        >
          <button
            type="button"
            onClick={() => onSelectSubjectSlug(null)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors ${
              !activeSubject
                ? 'bg-imperial text-ghost border-imperial shadow-card'
                : 'bg-surface text-ink-secondary border-stone-border hover:text-carbon hover:bg-subtle/60'
            }`}
          >
            All Subjects ({totalNotesCount})
          </button>

          {STUDY_NOTES_CATALOG.map((sub) => {
            const isSelected = activeSubject?.slug === sub.slug;
            return (
              <button
                key={sub.slug}
                type="button"
                onClick={() => onSelectSubjectSlug(sub.slug)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors ${
                  isSelected
                    ? 'bg-imperial text-ghost border-imperial shadow-card'
                    : 'bg-surface text-ink-secondary border-stone-border hover:text-carbon hover:bg-subtle/60'
                }`}
              >
                <span>{sub.name}</span>
                <span
                  className={`font-mono text-[11px] px-1.5 py-0.2 rounded ${
                    isSelected
                      ? 'bg-black/15 text-ghost'
                      : 'bg-subtle text-ink-muted'
                  }`}
                >
                  {sub.topics.length}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Invalid Subject Slug Notice */}
        {subjectSlug && !activeSubject && (
          <div className="card-surface p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-display text-base font-bold text-carbon">
                Subject category not found
              </h2>
              <p className="text-sm text-ink-secondary">
                No study notes matched &ldquo;{subjectSlug}&rdquo;. Showing all available subjects below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectSubjectSlug(null)}
              className="btn-secondary text-xs shrink-0"
            >
              View All Subjects
            </button>
          </div>
        )}

        {/* Notes Content Listing */}
        <div className="space-y-10">
          {filteredSubjects.map((subject) => (
            <section key={subject.slug} className="space-y-5">
              {!activeSubject && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-subtle border border-stone-border text-imperial">
                      {subject.code}
                    </span>
                    <h2 className="font-display text-xl font-bold text-carbon">
                      {subject.name}
                    </h2>
                    <span className="text-xs font-mono text-ink-muted">
                      ({subject.topics.length}{' '}
                      {subject.topics.length === 1 ? 'note' : 'notes'})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {subject.pdfUrl && (
                      <a
                        href={subject.pdfUrl}
                        download
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-carbon transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-bluebell" />
                        <span>Sample PDF</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectSubjectSlug(subject.slug)}
                      className="text-xs font-semibold text-bluebell hover:text-imperial transition-colors"
                    >
                      Open {subject.name} view &rarr;
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {subject.topics.map((topic) => (
                  <TopicDetailCard
                    key={topic.id}
                    topic={topic}
                    subject={subject}
                  />
                ))}
              </div>
            </section>
          ))}

          {filteredSubjects.length === 0 && (
            <div className="card-surface p-12 text-center space-y-3">
              <p className="text-sm text-ink-secondary">
                No study notes matched &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn-secondary text-xs"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
