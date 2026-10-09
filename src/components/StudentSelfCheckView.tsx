import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  RiskEvidenceItem,
  RiskThresholds,
  StudentAcademicEvaluation,
} from '../types/academic';
import { InterventionStatusBadge, TrendDeltaPill } from './StatusBadges';

interface StudentSelfCheckViewProps {
  evaluation: StudentAcademicEvaluation;
  thresholds: RiskThresholds;
}

function formatConciseWarningSummary(
  ev: RiskEvidenceItem,
  evaluation: StudentAcademicEvaluation,
  thresholds: RiskThresholds
): { title: string; subtitle: string } {
  const prefix = ev.subjectCode ? `${ev.subjectCode}: ` : '';

  switch (ev.category) {
    case 'ATTENDANCE_CRITICAL':
    case 'ATTENDANCE_WARNING': {
      const subSummary = ev.subjectCode
        ? evaluation.subjectSummaries.find((s) => s.subject.code === ev.subjectCode)
        : null;
      const pct =
        subSummary?.attendancePercentage ?? evaluation.overallAttendancePercentage;
      const target =
        subSummary?.subject.minAttendancePercentage ?? thresholds.criticalAttendancePct;
      return {
        title: `${prefix}Attendance below target`,
        subtitle: `${pct !== null ? `${pct}% attendance` : ev.metricLabel} · Target ${target}%`,
      };
    }
    case 'SCORE_FAILING': {
      const subSummary = ev.subjectCode
        ? evaluation.subjectSummaries.find((s) => s.subject.code === ev.subjectCode)
        : null;
      const pct =
        subSummary?.weightedScorePercentage ?? evaluation.overallScorePercentage;
      const target = subSummary?.subject.passPercentage ?? thresholds.passingScorePct;
      return {
        title: `${prefix}Score below passing threshold`,
        subtitle: `${pct !== null ? `${pct}% score` : ev.metricLabel} · Target ${target}%`,
      };
    }
    case 'SCORE_BORDERLINE': {
      const subSummary = ev.subjectCode
        ? evaluation.subjectSummaries.find((s) => s.subject.code === ev.subjectCode)
        : null;
      const pct =
        subSummary?.weightedScorePercentage ?? evaluation.overallScorePercentage;
      const target = subSummary?.subject.passPercentage ?? thresholds.passingScorePct;
      return {
        title: `${prefix}Score near passing threshold`,
        subtitle: `${pct !== null ? `${pct}% score` : ev.metricLabel} · Pass target ${target}%`,
      };
    }
    case 'TREND_SEVERE_DROP':
    case 'TREND_MODERATE_DROP':
      return {
        title: `${prefix}Recent assessment score drop`,
        subtitle: `${ev.metricLabel} between recent assessments`,
      };
    case 'RECENT_ASSESSMENT_FAILURE':
      return {
        title: `${prefix}Low recent assessment score`,
        subtitle: `${ev.metricLabel} · Target ${thresholds.passingScorePct}%`,
      };
    case 'MULTI_SUBJECT_STRUGGLE':
      return {
        title: 'Multiple subjects below passing',
        subtitle: `${evaluation.failingSubjectsCount} subjects below ${thresholds.passingScorePct}%`,
      };
    case 'MISSING_DATA':
      return {
        title: `${prefix}Pending assessment record`,
        subtitle: ev.metricLabel,
      };
    default:
      return {
        title: ev.headline,
        subtitle: ev.metricLabel,
      };
  }
}

export const StudentSelfCheckView: React.FC<StudentSelfCheckViewProps> = ({
  evaluation,
  thresholds,
}) => {
  const { student } = evaluation;
  const [expandedWarningIds, setExpandedWarningIds] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedRecIds, setExpandedRecIds] = useState<Record<string, boolean>>({});
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Record<string, boolean>>(
    {}
  );

  const toggleWarning = (id: string) => {
    setExpandedWarningIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRecommendation = (id: string) => {
    setExpandedRecIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSubject = (id: string) => {
    setExpandedSubjectIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const subjectsNeedingAttention = evaluation.subjectSummaries.filter(
    (s) =>
      s.isFailingScore ||
      s.isBorderlineScore ||
      s.isCriticalAttendance ||
      s.isWarningAttendance
  ).length;

  const statusConfig = {
    HIGH: {
      label: 'Action Recommended',
      badgeClass:
        'bg-status-danger-bg text-status-danger-text border-status-danger-border',
      dotClass: 'bg-magenta',
      accentBorder: 'border-l-magenta',
    },
    MEDIUM: {
      label: 'Needs Attention',
      badgeClass:
        'bg-status-warning-bg text-status-warning-text border-status-warning-border',
      dotClass: 'bg-status-warning-dot',
      accentBorder: 'border-l-status-warning-dot',
    },
    LOW: {
      label: 'On Track',
      badgeClass:
        'bg-status-info-bg text-imperial border-status-info-border',
      dotClass: 'bg-bluebell',
      accentBorder: 'border-l-bluebell',
    },
    INSUFFICIENT_DATA: {
      label: 'Pending Grades',
      badgeClass:
        'bg-status-neutral-bg text-status-neutral-text border-status-neutral-border',
      dotClass: 'bg-status-neutral-dot',
      accentBorder: 'border-l-stone-strong',
    },
  }[evaluation.riskLevel];

  const topRecommendations = evaluation.recommendations.slice(0, 3);
  const primaryEvidence = evaluation.evidence[0];
  const primaryFocusSummary = primaryEvidence
    ? formatConciseWarningSummary(primaryEvidence, evaluation, thresholds)
    : null;
  const primaryNextAction = topRecommendations[0];

  return (
    <div className="space-y-8">
      {/* 1. Initial Viewport: Identity, Standing, Primary Focus Area & Immediate Next Action */}
      <section
        aria-label="Student Standing and Priority Focus"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
      >
        {/* Left Editorial Identity & Focus Card (7 cols) */}
        <div className="lg:col-span-7 card-surface p-6 flex flex-col justify-between border-t-2 border-t-imperial">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="section-kicker">01 // Personal Academic Standing</div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-semibold ${statusConfig.badgeClass}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
                {statusConfig.label}
              </span>
            </div>

            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
                {student.fullName}
              </h1>
              <p className="text-xs text-ink-secondary mt-1 font-mono">
                {student.rollNumber} · Semester {student.semester} ({student.department}) ·
                Advisor: <strong className="text-carbon">{student.advisorName}</strong>
              </p>
            </div>
          </div>

          {/* Primary Focus Area & Next Action Callout */}
          <div className="mt-6 pt-5 border-t border-stone-border grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`p-3.5 rounded-md bg-subtle/60 border border-stone-border border-l-4 ${statusConfig.accentBorder}`}
            >
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                Primary Area of Focus
              </div>
              <div className="text-xs font-semibold text-carbon mt-1">
                {primaryFocusSummary
                  ? primaryFocusSummary.title
                  : 'All enrolled courses are on track'}
              </div>
              <div className="text-[11px] text-ink-secondary font-mono tabular-nums mt-0.5">
                {primaryFocusSummary
                  ? primaryFocusSummary.subtitle
                  : `Maintaining ≥${thresholds.passingScorePct}% score and ≥${thresholds.criticalAttendancePct}% attendance`}
              </div>
            </div>

            <div className="p-3.5 rounded-md bg-imperial-subtle border border-imperial-border/70 border-l-4 border-l-imperial">
              <div className="font-mono text-[10px] uppercase tracking-wider text-imperial">
                Recommended Next Action
              </div>
              <div className="text-xs font-semibold text-carbon mt-1">
                {primaryNextAction
                  ? primaryNextAction.title
                  : 'Continue current study schedule'}
              </div>
              <div className="text-[11px] text-ink-secondary font-mono tabular-nums mt-0.5">
                {primaryNextAction
                  ? `${
                      primaryNextAction.subjectCode
                        ? `${primaryNextAction.subjectCode} · `
                        : ''
                    }Suggested within ${primaryNextAction.suggestedFollowUpDays} days`
                  : 'No immediate recovery steps required'}
              </div>
            </div>
          </div>
        </div>

        {/* Right 3-Pillar Standing Matrix (5 cols) */}
        <div
          aria-label="Student Summary Metrics"
          className="lg:col-span-5 card-surface grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 divide-y sm:divide-y-0 sm:divide-x lg:divide-x-0 lg:divide-y divide-stone-border overflow-hidden"
        >
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                01 // Academic Score
              </div>
              <div className="text-xs font-medium text-ink-secondary mt-0.5">
                Pass threshold {thresholds.passingScorePct}%
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <TrendDeltaPill delta={evaluation.overallTrendDeltaPoints} />
                <span
                  className={`font-display text-2xl font-bold tabular-nums ${
                    evaluation.overallScorePercentage !== null &&
                    evaluation.overallScorePercentage < thresholds.passingScorePct
                      ? 'text-magenta'
                      : 'text-carbon'
                  }`}
                >
                  {evaluation.overallScorePercentage !== null
                    ? `${evaluation.overallScorePercentage}%`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                02 // Attendance
              </div>
              <div className="text-xs font-medium text-ink-secondary tabular-nums mt-0.5">
                {evaluation.totalClassesAttended}/{evaluation.totalClassesHeld} classes · Target{' '}
                {thresholds.criticalAttendancePct}%
              </div>
            </div>
            <div className="text-right">
              <span
                className={`font-display text-2xl font-bold tabular-nums ${
                  evaluation.overallAttendancePercentage !== null &&
                  evaluation.overallAttendancePercentage < thresholds.criticalAttendancePct
                    ? 'text-magenta'
                    : 'text-carbon'
                }`}
              >
                {evaluation.overallAttendancePercentage !== null
                  ? `${evaluation.overallAttendancePercentage}%`
                  : 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                03 // Subjects Needing Attention
              </div>
              <div className="text-xs font-medium text-ink-secondary mt-0.5">
                {subjectsNeedingAttention === 0
                  ? 'All courses meeting targets'
                  : 'Review flagged courses below'}
              </div>
            </div>
            <div className="text-right">
              <span
                className={`font-display text-2xl font-bold tabular-nums ${
                  subjectsNeedingAttention > 0 ? 'text-magenta' : 'text-carbon'
                }`}
              >
                {subjectsNeedingAttention}
              </span>
              <span className="text-xs font-mono text-ink-muted ml-1 tabular-nums">
                / {evaluation.subjectSummaries.length}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Concise Warning Summary (Expandable "View details") */}
      {evaluation.evidence.length > 0 && (
        <section className="card-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-border flex items-center justify-between">
            <div>
              <div className="section-kicker">02 // Evidence &amp; Standing Indicators</div>
              <h2 className="font-display text-base font-bold text-carbon mt-0.5">
                Academic Alerts ({evaluation.evidence.length})
              </h2>
            </div>
          </div>

          <div className="divide-y divide-stone-border">
            {evaluation.evidence.map((ev) => {
              const summary = formatConciseWarningSummary(ev, evaluation, thresholds);
              const isExpanded = Boolean(expandedWarningIds[ev.id]);
              const dotColor =
                ev.severity === 'HIGH'
                  ? 'bg-magenta'
                  : ev.severity === 'MEDIUM'
                  ? 'bg-status-warning-dot'
                  : 'bg-bluebell';

              return (
                <div key={ev.id} className="px-5 py-3.5 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dotColor}`}
                      />
                      <div>
                        <div className="font-semibold text-carbon">
                          {summary.title}
                        </div>
                        <div className="text-ink-secondary font-mono text-[11px] tabular-nums mt-0.5">
                          {summary.subtitle}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleWarning(ev.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-bluebell hover:text-imperial shrink-0 transition-colors"
                    >
                      <span>{isExpanded ? 'Hide details' : 'View details'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 ml-5 pl-3.5 border-l-2 border-bluebell-border text-xs text-ink-secondary leading-relaxed">
                      {ev.detail}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Subject-Wise Performance */}
      <section className="card-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-border flex items-center justify-between">
          <div>
            <div className="section-kicker">03 // Course Breakdown</div>
            <h2 className="font-display text-base font-bold text-carbon mt-0.5">
              Subject-Wise Performance
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted hidden sm:inline">
            Select Assessments to inspect individual exam marks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-border bg-subtle/60 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <th className="py-3 px-5">Subject</th>
                <th className="py-3 px-4">Weighted Score</th>
                <th className="py-3 px-3 text-right">Recent Trend</th>
                <th className="py-3 px-4 text-right">Attendance</th>
                <th className="py-3 px-4 text-right">Course Standing</th>
                <th className="py-3 px-5 text-right">Assessments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-border text-xs">
              {evaluation.subjectSummaries.map((sub) => {
                const isExpanded = Boolean(expandedSubjectIds[sub.subject.id]);
                const scoreBarColor = sub.isFailingScore
                  ? 'bg-magenta'
                  : sub.isBorderlineScore
                  ? 'bg-status-warning-dot'
                  : 'bg-bluebell';

                return (
                  <React.Fragment key={sub.subject.id}>
                    <tr className="hover:bg-bluebell-subtle/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-carbon">
                          <span className="font-mono text-imperial">{sub.subject.code}</span> ·{' '}
                          {sub.subject.name}
                        </div>
                        <div className="text-[11px] text-ink-muted mt-0.5">
                          Instructor: {sub.subject.instructor}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 w-48">
                        {sub.weightedScorePercentage !== null ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between font-mono tabular-nums">
                              <span
                                className={`font-semibold ${
                                  sub.isFailingScore ? 'text-magenta' : 'text-carbon'
                                }`}
                              >
                                {sub.weightedScorePercentage}%
                              </span>
                              <span className="text-[10px] text-ink-muted">
                                Pass {sub.subject.passPercentage}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-subtle rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${scoreBarColor}`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, sub.weightedScorePercentage)
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="font-mono text-ink-muted">Pending</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <TrendDeltaPill delta={sub.trendDeltaPoints} />
                      </td>

                      <td className="py-3.5 px-4 text-right tabular-nums">
                        {sub.attendancePercentage !== null ? (
                          <div>
                            <span
                              className={`font-mono font-semibold ${
                                sub.isCriticalAttendance
                                  ? 'text-magenta'
                                  : sub.isWarningAttendance
                                  ? 'text-status-warning-text'
                                  : 'text-carbon'
                              }`}
                            >
                              {sub.attendancePercentage}%
                            </span>
                            <span className="text-[11px] font-mono text-ink-muted ml-1">
                              ({sub.classesAttended}/{sub.classesHeld})
                            </span>
                          </div>
                        ) : (
                          <span className="text-ink-muted">N/A</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {sub.classesNeededForMinAttendance > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-status-danger-bg border border-status-danger-border text-[11px] font-medium text-status-danger-text tabular-nums">
                            Attend next +{sub.classesNeededForMinAttendance} classes
                          </span>
                        ) : sub.isFailingScore ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-status-danger-bg border border-status-danger-border text-[11px] font-medium text-status-danger-text">
                            Below {sub.subject.passPercentage}% pass target
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-status-info-bg border border-status-info-border text-[11px] text-imperial font-medium">
                            On track
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => toggleSubject(sub.subject.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-bluebell hover:text-imperial transition-colors"
                        >
                          <span>{isExpanded ? 'Hide' : 'Assessments'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-subtle/45">
                        <td colSpan={6} className="px-5 py-3.5">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {sub.assessments.map((a) => (
                              <div
                                key={a.assessment.id}
                                className="px-3.5 py-2.5 rounded-md border border-stone-border bg-surface flex items-center justify-between text-xs shadow-card"
                              >
                                <div>
                                  <div className="font-semibold text-carbon">
                                    {a.assessment.title}
                                  </div>
                                  <div className="text-[11px] font-mono text-ink-muted tabular-nums">
                                    Weight {a.assessment.weightage}%
                                  </div>
                                </div>
                                <div className="text-right font-mono tabular-nums">
                                  {a.marksObtained !== null ? (
                                    <div>
                                      <span className="font-semibold text-carbon">
                                        {a.marksObtained}/{a.assessment.maxMarks}
                                      </span>
                                      <div className="text-[11px] text-bluebell font-semibold">
                                        {a.normalizedPercentage}%
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-status-warning-text font-semibold">
                                      PENDING
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Three or Fewer Prioritized Recommendations (Expandable) */}
      <section className="card-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-border flex items-center justify-between">
          <div>
            <div className="section-kicker">04 // Constructive Action Plan</div>
            <h2 className="font-display text-base font-bold text-carbon mt-0.5">
              Recommended Next Steps ({topRecommendations.length})
            </h2>
          </div>
        </div>

        <div className="divide-y divide-stone-border">
          {topRecommendations.map((rec, index) => {
            const isExpanded = Boolean(expandedRecIds[rec.id]);
            return (
              <div key={rec.id} className="px-5 py-3.5 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded bg-imperial text-ghost flex items-center justify-center font-mono text-[11px] font-semibold shrink-0 tabular-nums">
                      0{index + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-semibold text-carbon">
                        {rec.title}
                      </span>
                      {rec.subjectCode && (
                        <span className="ml-2 font-mono text-[11px] px-1.5 py-0.5 rounded bg-imperial-light border border-imperial-border text-imperial">
                          {rec.subjectCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleRecommendation(rec.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-bluebell hover:text-imperial shrink-0 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide details' : 'View details'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 ml-9 pl-3.5 border-l-2 border-bluebell-border space-y-1.5 text-xs text-ink-secondary">
                    <p className="leading-relaxed text-carbon">
                      {rec.studentGuidance}
                    </p>
                    <div className="text-[11px] font-mono text-ink-muted tabular-nums">
                      Suggested check-in window: Within {rec.suggestedFollowUpDays} days
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {topRecommendations.length === 0 && (
            <div className="py-6 text-center text-xs text-ink-muted">
              No recovery actions required. Keep maintaining your current schedule.
            </div>
          )}
        </div>
      </section>

      {/* 5. Compact Faculty Support Actions (if any logged for this student) */}
      {evaluation.interventions.length > 0 && (
        <section className="card-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-border">
            <div className="section-kicker">05 // Faculty Support</div>
            <h2 className="font-display text-base font-bold text-carbon mt-0.5">
              Scheduled Advisor Check-Ins ({evaluation.interventions.length})
            </h2>
          </div>
          <div className="divide-y divide-stone-border text-xs">
            {evaluation.interventions.map((intv) => (
              <div
                key={intv.id}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-semibold text-carbon">
                    {intv.actionTitle}
                  </span>
                  <span className="text-ink-muted ml-2 font-mono">
                    · {intv.assignedFaculty}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-ink-muted tabular-nums">
                    Follow-up {intv.followUpDate}
                  </span>
                  <InterventionStatusBadge status={intv.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
