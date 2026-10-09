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
      label: 'Action Required',
      badgeClass:
        'bg-status-danger-bg text-status-danger-text border-status-danger-border',
      dotClass: 'bg-status-danger-dot',
    },
    MEDIUM: {
      label: 'Needs Attention',
      badgeClass:
        'bg-status-warning-bg text-status-warning-text border-status-warning-border',
      dotClass: 'bg-status-warning-dot',
    },
    LOW: {
      label: 'On Track',
      badgeClass:
        'bg-status-success-bg text-status-success-text border-status-success-border',
      dotClass: 'bg-status-success-dot',
    },
    INSUFFICIENT_DATA: {
      label: 'Pending Grades',
      badgeClass:
        'bg-status-neutral-bg text-status-neutral-text border-status-neutral-border',
      dotClass: 'bg-status-neutral-dot',
    },
  }[evaluation.riskLevel];

  const topRecommendations = evaluation.recommendations.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 1. Student Name and Current Academic Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-border pb-4">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary tracking-tight">
            {student.fullName}
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5 font-mono">
            {student.rollNumber} · Semester {student.semester} ({student.department}) ·
            Advisor: {student.advisorName}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-medium ${statusConfig.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* 2. Three Key Metrics */}
      <section
        aria-label="Student Summary Metrics"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="card-surface p-4 border-t-2 border-t-imperial">
          <div className="text-xs font-medium text-ink-secondary">Academic Score</div>
          <div className="flex items-baseline justify-between mt-1">
            <span
              className={`text-2xl font-semibold tabular-nums ${
                evaluation.overallScorePercentage !== null &&
                evaluation.overallScorePercentage < thresholds.passingScorePct
                  ? 'text-magenta'
                  : 'text-ink-primary'
              }`}
            >
              {evaluation.overallScorePercentage !== null
                ? `${evaluation.overallScorePercentage}%`
                : 'N/A'}
            </span>
            <TrendDeltaPill delta={evaluation.overallTrendDeltaPoints} />
          </div>
          <div className="text-[11px] text-ink-muted tabular-nums mt-1">
            Passing threshold {thresholds.passingScorePct}%
          </div>
        </div>

        <div className="card-surface p-4 border-t-2 border-t-bluebell">
          <div className="text-xs font-medium text-ink-secondary">Attendance</div>
          <div
            className={`text-2xl font-semibold tabular-nums mt-1 ${
              evaluation.overallAttendancePercentage !== null &&
              evaluation.overallAttendancePercentage < thresholds.criticalAttendancePct
                ? 'text-magenta'
                : 'text-ink-primary'
            }`}
          >
            {evaluation.overallAttendancePercentage !== null
              ? `${evaluation.overallAttendancePercentage}%`
              : 'N/A'}
          </div>
          <div className="text-[11px] text-ink-muted tabular-nums mt-1">
            {evaluation.totalClassesAttended}/{evaluation.totalClassesHeld} classes ·
            Target {thresholds.criticalAttendancePct}%
          </div>
        </div>

        <div
          className={`card-surface p-4 border-t-2 ${
            subjectsNeedingAttention > 0 ? 'border-t-magenta' : 'border-t-bluebell'
          }`}
        >
          <div className="text-xs font-medium text-ink-secondary">
            Subjects Needing Attention
          </div>
          <div
            className={`text-2xl font-semibold tabular-nums mt-1 ${
              subjectsNeedingAttention > 0 ? 'text-magenta' : 'text-ink-primary'
            }`}
          >
            {subjectsNeedingAttention}{' '}
            <span className="text-sm font-normal text-ink-muted">
              of {evaluation.subjectSummaries.length}
            </span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            {subjectsNeedingAttention === 0
              ? 'All courses meeting targets'
              : 'Review flagged courses below'}
          </div>
        </div>
      </section>

      {/* 3. Concise Warning Summary (Expandable "View details") */}
      {evaluation.evidence.length > 0 && (
        <section className="card-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-primary">
              Academic Alerts ({evaluation.evidence.length})
            </h2>
          </div>

          <div className="divide-y divide-stone-border">
            {evaluation.evidence.map((ev) => {
              const summary = formatConciseWarningSummary(ev, evaluation, thresholds);
              const isExpanded = Boolean(expandedWarningIds[ev.id]);
              const dotColor =
                ev.severity === 'HIGH'
                  ? 'bg-status-danger-dot'
                  : ev.severity === 'MEDIUM'
                  ? 'bg-status-warning-dot'
                  : 'bg-status-neutral-dot';

              return (
                <div key={ev.id} className="px-4 py-3 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 mt-1 ${dotColor}`}
                      />
                      <div>
                        <div className="font-semibold text-ink-primary">
                          {summary.title}
                        </div>
                        <div className="text-ink-secondary tabular-nums mt-0.5">
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
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-2.5 ml-4 pl-3 border-l-2 border-stone-border text-xs text-ink-secondary leading-relaxed">
                      {ev.detail}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Subject-Wise Performance */}
      <section className="card-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-border">
          <h2 className="text-sm font-semibold text-ink-primary">
            Subject-Wise Performance
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-border bg-subtle/60 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <th className="py-2.5 px-4">Subject</th>
                <th className="py-2.5 px-4">Score</th>
                <th className="py-2.5 px-3 text-right">Trend</th>
                <th className="py-2.5 px-4 text-right">Attendance</th>
                <th className="py-2.5 px-4 text-right">Standing</th>
                <th className="py-2.5 px-4 text-right">Details</th>
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
                    <tr className="hover:bg-subtle/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-ink-primary">
                          {sub.subject.code} · {sub.subject.name}
                        </div>
                        <div className="text-[11px] text-ink-muted">
                          {sub.subject.instructor}
                        </div>
                      </td>

                      <td className="py-3 px-4 w-44">
                        {sub.weightedScorePercentage !== null ? (
                          <div className="space-y-1">
                            <div className="font-mono font-semibold tabular-nums text-ink-primary">
                              {sub.weightedScorePercentage}%
                            </div>
                            <div className="h-1.5 w-28 bg-subtle rounded-full overflow-hidden">
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

                      <td className="py-3 px-3 text-right">
                        <TrendDeltaPill delta={sub.trendDeltaPoints} />
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums">
                        {sub.attendancePercentage !== null ? (
                          <div>
                            <span
                              className={`font-mono font-semibold ${
                                sub.isCriticalAttendance
                                  ? 'text-status-danger-text'
                                  : sub.isWarningAttendance
                                  ? 'text-status-warning-text'
                                  : 'text-ink-primary'
                              }`}
                            >
                              {sub.attendancePercentage}%
                            </span>
                            <span className="text-[11px] text-ink-muted ml-1">
                              ({sub.classesAttended}/{sub.classesHeld})
                            </span>
                          </div>
                        ) : (
                          <span className="text-ink-muted">N/A</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {sub.classesNeededForMinAttendance > 0 ? (
                          <span className="text-[11px] font-medium text-status-danger-text tabular-nums">
                            Need +{sub.classesNeededForMinAttendance} classes
                          </span>
                        ) : sub.isFailingScore ? (
                          <span className="text-[11px] font-medium text-status-danger-text">
                            Below {sub.subject.passPercentage}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-status-success-text font-medium">
                            On track
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => toggleSubject(sub.subject.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-bluebell hover:text-imperial transition-colors"
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
                      <tr className="bg-subtle/40">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {sub.assessments.map((a) => (
                              <div
                                key={a.assessment.id}
                                className="px-3 py-2 rounded border border-stone-border bg-surface flex items-center justify-between text-xs"
                              >
                                <div>
                                  <div className="font-medium text-ink-primary">
                                    {a.assessment.title}
                                  </div>
                                  <div className="text-[11px] text-ink-muted tabular-nums">
                                    Weight {a.assessment.weightage}%
                                  </div>
                                </div>
                                <div className="text-right font-mono tabular-nums">
                                  {a.marksObtained !== null ? (
                                    <div>
                                      <span className="font-semibold text-ink-primary">
                                        {a.marksObtained}/{a.assessment.maxMarks}
                                      </span>
                                      <div className="text-[11px] text-ink-muted">
                                        {a.normalizedPercentage}%
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-status-warning-text font-semibold">
                                      MISSING
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

      {/* 5. Three or Fewer Prioritized Recommendations (Expandable) */}
      <section className="card-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-primary">
            Recommended Next Steps ({topRecommendations.length})
          </h2>
        </div>

        <div className="divide-y divide-stone-border">
          {topRecommendations.map((rec, index) => {
            const isExpanded = Boolean(expandedRecIds[rec.id]);
            return (
              <div key={rec.id} className="px-4 py-3 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-imperial-light border border-imperial-border flex items-center justify-center font-mono text-[11px] font-semibold text-imperial shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-semibold text-ink-primary">
                        {rec.title}
                      </span>
                      {rec.subjectCode && (
                        <span className="ml-2 font-mono text-[11px] px-1.5 py-0.5 rounded bg-subtle border border-stone-border text-ink-secondary">
                          {rec.subjectCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleRecommendation(rec.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-bluebell hover:text-imperial shrink-0 transition-colors"
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
                  <div className="mt-2.5 ml-7 pl-3 border-l-2 border-bluebell-border space-y-1.5 text-xs text-ink-secondary">
                    <p className="leading-relaxed text-ink-primary">
                      {rec.studentGuidance}
                    </p>
                    <div className="text-[11px] text-ink-muted tabular-nums">
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

      {/* Compact Faculty Support Actions (if any logged for this student) */}
      {evaluation.interventions.length > 0 && (
        <section className="card-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-border">
            <h2 className="text-sm font-semibold text-ink-primary">
              Scheduled Advisor Check-Ins ({evaluation.interventions.length})
            </h2>
          </div>
          <div className="divide-y divide-stone-border text-xs">
            {evaluation.interventions.map((intv) => (
              <div
                key={intv.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-semibold text-ink-primary">
                    {intv.actionTitle}
                  </span>
                  <span className="text-ink-muted ml-2">
                    · {intv.assignedFaculty}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-ink-muted tabular-nums">
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
