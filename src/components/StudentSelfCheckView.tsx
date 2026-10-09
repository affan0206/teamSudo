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

function formatConciseAlert(
  ev: RiskEvidenceItem,
  evaluation: StudentAcademicEvaluation,
  thresholds: RiskThresholds
): { title: string; subtitle: string } {
  const prefix = ev.subjectCode ? `${ev.subjectCode} · ` : '';

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
        title: `${prefix}Low attendance`,
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
        title: `${prefix}Score below passing`,
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
        title: `${prefix}Borderline score`,
        subtitle: `${pct !== null ? `${pct}% score` : ev.metricLabel} · Target ${target}%`,
      };
    }
    case 'TREND_SEVERE_DROP':
    case 'TREND_MODERATE_DROP':
      return {
        title: `${prefix}Assessment score drop`,
        subtitle: ev.metricLabel,
      };
    case 'RECENT_ASSESSMENT_FAILURE':
      return {
        title: `${prefix}Low recent exam score`,
        subtitle: `${ev.metricLabel} · Target ${thresholds.passingScorePct}%`,
      };
    case 'MULTI_SUBJECT_STRUGGLE':
      return {
        title: 'Multiple subjects below passing',
        subtitle: `${evaluation.failingSubjectsCount} subjects · Target ${thresholds.passingScorePct}%`,
      };
    case 'MISSING_DATA':
      return {
        title: `${prefix}Pending assessment`,
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
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

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
      badgeClass: 'bg-status-info-bg text-imperial border-status-info-border',
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

  const visibleRecommendations = showAllRecommendations
    ? evaluation.recommendations
    : evaluation.recommendations.slice(0, 3);

  const primaryEvidence = evaluation.evidence[0];
  const primaryFocusSummary = primaryEvidence
    ? formatConciseAlert(primaryEvidence, evaluation, thresholds)
    : null;
  const primaryNextAction = evaluation.recommendations[0];

  return (
    <div className="space-y-8 lg:space-y-10">
      {/* 1. Student Header & Priority Summary */}
      <header className="space-y-6 border-b border-stone-border pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-[28px] lg:text-[30px] font-bold text-carbon tracking-tight">
              {student.fullName}
            </h1>
            <p className="text-sm text-ink-secondary mt-1">
              <span className="font-mono">{student.rollNumber}</span> · Semester{' '}
              {student.semester} · Advisor: {student.advisorName}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-sm font-semibold self-start sm:self-auto ${statusConfig.badgeClass}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
            {statusConfig.label}
          </span>
        </div>

        {/* Concise Focus & Next Step Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className={`card-surface p-4 border-l-4 ${statusConfig.accentBorder}`}
          >
            <div className="text-xs font-medium text-ink-muted">Focus area</div>
            <div className="text-sm font-semibold text-carbon mt-1">
              {primaryFocusSummary
                ? primaryFocusSummary.title
                : 'All subjects on track'}
            </div>
            <div className="text-xs text-ink-secondary font-mono tabular-nums mt-0.5">
              {primaryFocusSummary
                ? primaryFocusSummary.subtitle
                : `Target ≥${thresholds.passingScorePct}% score · ≥${thresholds.criticalAttendancePct}% attendance`}
            </div>
          </div>

          <div className="card-surface p-4 border-l-4 border-l-imperial">
            <div className="text-xs font-medium text-ink-muted">Next step</div>
            <div className="text-sm font-semibold text-carbon mt-1">
              {primaryNextAction
                ? primaryNextAction.title
                : 'Maintain current study schedule'}
            </div>
            <div className="text-xs text-ink-secondary font-mono tabular-nums mt-0.5">
              {primaryNextAction
                ? `${
                    primaryNextAction.subjectCode
                      ? `${primaryNextAction.subjectCode} · `
                      : ''
                  }Within ${primaryNextAction.suggestedFollowUpDays} days`
                : 'No immediate action required'}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Key Metric Cards (3 equal-height cards) */}
      <section
        aria-label="Academic Standing Metrics"
        className="grid grid-cols-1 sm:grid-cols-3 gap-5"
      >
        <div className="card-surface p-6 flex flex-col justify-between border-t-2 border-t-imperial">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-secondary">
              Academic score
            </span>
            <TrendDeltaPill delta={evaluation.overallTrendDeltaPoints} />
          </div>
          <div
            className={`font-display text-3xl font-bold tabular-nums my-3 ${
              evaluation.overallScorePercentage !== null &&
              evaluation.overallScorePercentage < thresholds.passingScorePct
                ? 'text-magenta'
                : 'text-carbon'
            }`}
          >
            {evaluation.overallScorePercentage !== null
              ? `${evaluation.overallScorePercentage}%`
              : 'N/A'}
          </div>
          <div className="text-xs text-ink-secondary tabular-nums">
            Target {thresholds.passingScorePct}%
          </div>
        </div>

        <div className="card-surface p-6 flex flex-col justify-between border-t-2 border-t-bluebell">
          <div className="text-sm font-medium text-ink-secondary">Attendance</div>
          <div
            className={`font-display text-3xl font-bold tabular-nums my-3 ${
              evaluation.overallAttendancePercentage !== null &&
              evaluation.overallAttendancePercentage < thresholds.criticalAttendancePct
                ? 'text-magenta'
                : 'text-carbon'
            }`}
          >
            {evaluation.overallAttendancePercentage !== null
              ? `${evaluation.overallAttendancePercentage}%`
              : 'N/A'}
          </div>
          <div className="text-xs text-ink-secondary tabular-nums">
            {evaluation.totalClassesAttended}/{evaluation.totalClassesHeld} classes · Target{' '}
            {thresholds.criticalAttendancePct}%
          </div>
        </div>

        <div className="card-surface p-6 flex flex-col justify-between border-t-2 border-t-imperial">
          <div className="text-sm font-medium text-ink-secondary">
            Subjects needing attention
          </div>
          <div
            className={`font-display text-3xl font-bold tabular-nums my-3 ${
              subjectsNeedingAttention > 0 ? 'text-magenta' : 'text-carbon'
            }`}
          >
            {subjectsNeedingAttention}
            <span className="text-base font-normal text-ink-muted ml-1.5">
              / {evaluation.subjectSummaries.length}
            </span>
          </div>
          <div className="text-xs text-ink-secondary">
            {subjectsNeedingAttention === 0
              ? 'All courses meeting targets'
              : 'Courses below target'}
          </div>
        </div>
      </section>

      {/* 3. Academic Alerts (Collapsed details by default) */}
      {evaluation.evidence.length > 0 && (
        <section className="card-surface overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-border flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-carbon">
              Academic alerts
            </h2>
            <span className="font-mono text-xs text-ink-muted tabular-nums">
              {evaluation.evidence.length}
            </span>
          </div>

          <div className="divide-y divide-stone-border">
            {evaluation.evidence.map((ev) => {
              const summary = formatConciseAlert(ev, evaluation, thresholds);
              const isExpanded = Boolean(expandedWarningIds[ev.id]);
              const dotColor =
                ev.severity === 'HIGH'
                  ? 'bg-magenta'
                  : ev.severity === 'MEDIUM'
                  ? 'bg-status-warning-dot'
                  : 'bg-bluebell';

              return (
                <div key={ev.id} className="px-6 py-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 mt-2 ${dotColor}`}
                      />
                      <div>
                        <div className="font-semibold text-carbon">
                          {summary.title}
                        </div>
                        <div className="text-xs text-ink-secondary font-mono tabular-nums mt-0.5">
                          {summary.subtitle}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleWarning(ev.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-bluebell hover:text-imperial shrink-0 transition-colors"
                    >
                      <span>{isExpanded ? 'Hide details' : 'View details'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 ml-5 pl-3.5 border-l-2 border-bluebell-border text-sm text-ink-secondary leading-relaxed max-w-3xl">
                      {ev.detail}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Subject Performance */}
      <section className="card-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-border">
          <h2 className="font-display text-lg font-semibold text-carbon">
            Subject performance
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-border bg-subtle/60 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <th className="py-3.5 px-6">Subject</th>
                <th className="py-3.5 px-4 text-right">Score</th>
                <th className="py-3.5 px-4 text-right">Trend</th>
                <th className="py-3.5 px-4 text-right">Attendance</th>
                <th className="py-3.5 px-4 text-right">Status</th>
                <th className="py-3.5 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-border text-sm">
              {evaluation.subjectSummaries.map((sub) => {
                const isExpanded = Boolean(expandedSubjectIds[sub.subject.id]);

                return (
                  <React.Fragment key={sub.subject.id}>
                    <tr className="hover:bg-bluebell-subtle/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-carbon">
                          <span className="font-mono text-imperial">{sub.subject.code}</span> ·{' '}
                          {sub.subject.name}
                        </div>
                        <div className="text-xs text-ink-muted mt-0.5">
                          {sub.subject.instructor}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right font-mono tabular-nums">
                        {sub.weightedScorePercentage !== null ? (
                          <span
                            className={`font-semibold ${
                              sub.isFailingScore ? 'text-magenta' : 'text-carbon'
                            }`}
                          >
                            {sub.weightedScorePercentage}%
                          </span>
                        ) : (
                          <span className="text-ink-muted">Pending</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <TrendDeltaPill delta={sub.trendDeltaPoints} />
                      </td>

                      <td className="py-4 px-4 text-right font-mono tabular-nums">
                        {sub.attendancePercentage !== null ? (
                          <div>
                            <span
                              className={`font-semibold ${
                                sub.isCriticalAttendance
                                  ? 'text-magenta'
                                  : sub.isWarningAttendance
                                  ? 'text-status-warning-text'
                                  : 'text-carbon'
                              }`}
                            >
                              {sub.attendancePercentage}%
                            </span>
                            <span className="text-xs text-ink-muted ml-1">
                              ({sub.classesAttended}/{sub.classesHeld})
                            </span>
                          </div>
                        ) : (
                          <span className="text-ink-muted">N/A</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        {sub.classesNeededForMinAttendance > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-status-danger-bg border border-status-danger-border text-xs font-medium text-status-danger-text tabular-nums">
                            Attend +{sub.classesNeededForMinAttendance}
                          </span>
                        ) : sub.isFailingScore ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-status-danger-bg border border-status-danger-border text-xs font-medium text-status-danger-text">
                            Below {sub.subject.passPercentage}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-status-info-bg border border-status-info-border text-xs text-imperial font-medium">
                            On track
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => toggleSubject(sub.subject.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-bluebell hover:text-imperial transition-colors"
                        >
                          <span>{isExpanded ? 'Hide' : 'View exams'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-subtle/40">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {sub.assessments.map((a) => (
                              <div
                                key={a.assessment.id}
                                className="p-3.5 rounded-lg border border-stone-border bg-surface flex items-center justify-between text-sm shadow-card"
                              >
                                <div>
                                  <div className="font-semibold text-carbon">
                                    {a.assessment.title}
                                  </div>
                                  <div className="text-xs font-mono text-ink-muted tabular-nums">
                                    Weight {a.assessment.weightage}%
                                  </div>
                                </div>
                                <div className="text-right font-mono tabular-nums">
                                  {a.marksObtained !== null ? (
                                    <div>
                                      <span className="font-semibold text-carbon">
                                        {a.marksObtained}/{a.assessment.maxMarks}
                                      </span>
                                      <div className="text-xs text-bluebell font-semibold">
                                        {a.normalizedPercentage}%
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-status-warning-text font-semibold">
                                      Pending
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

      {/* 5. Recommendations (Top 3 shown first, expandable guidance) */}
      <section className="card-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-border flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-carbon">
            Recommendations
          </h2>
          {evaluation.recommendations.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllRecommendations((prev) => !prev)}
              className="text-xs font-medium text-bluebell hover:text-imperial transition-colors"
            >
              {showAllRecommendations
                ? 'Show top 3'
                : `View all (${evaluation.recommendations.length})`}
            </button>
          )}
        </div>

        <div className="divide-y divide-stone-border">
          {visibleRecommendations.map((rec, index) => {
            const isExpanded = Boolean(expandedRecIds[rec.id]);
            return (
              <div key={rec.id} className="px-6 py-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-imperial text-ghost flex items-center justify-center font-mono text-xs font-semibold shrink-0 tabular-nums mt-0.5">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-carbon">
                        {rec.title}
                      </div>
                      <div className="text-xs text-ink-secondary font-mono tabular-nums mt-0.5">
                        {rec.subjectCode ? `${rec.subjectCode} · ` : ''}
                        Check-in within {rec.suggestedFollowUpDays} days
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleRecommendation(rec.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-bluebell hover:text-imperial shrink-0 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide details' : 'View details'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 ml-9 pl-3.5 border-l-2 border-bluebell-border text-sm text-ink-secondary leading-relaxed max-w-3xl">
                    {rec.studentGuidance}
                  </div>
                )}
              </div>
            );
          })}

          {visibleRecommendations.length === 0 && (
            <div className="py-8 text-center text-sm text-ink-muted">
              No recovery actions required.
            </div>
          )}
        </div>
      </section>

      {/* 6. Scheduled Advisor Check-Ins */}
      {evaluation.interventions.length > 0 && (
        <section className="card-surface overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-border">
            <h2 className="font-display text-lg font-semibold text-carbon">
              Advisor check-ins
            </h2>
          </div>
          <div className="divide-y divide-stone-border text-sm">
            {evaluation.interventions.map((intv) => (
              <div
                key={intv.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-semibold text-carbon">
                    {intv.actionTitle}
                  </span>
                  <span className="text-ink-muted ml-2 text-xs">
                    · {intv.assignedFaculty}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-ink-muted tabular-nums">
                    Due {intv.followUpDate}
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
