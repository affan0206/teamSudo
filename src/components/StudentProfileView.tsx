import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus,
  X,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AcademicDataset,
  ActionRecommendation,
  InterventionStatus,
  RiskEvidenceItem,
  RiskThresholds,
  StudentAcademicEvaluation,
  SubjectPerformanceSummary,
} from '../types/academic';
import { InterventionStatusBadge, RiskBadge, TrendDeltaPill } from './StatusBadges';

interface StudentProfileViewProps {
  evaluation: StudentAcademicEvaluation;
  allEvaluations: StudentAcademicEvaluation[];
  dataset: AcademicDataset;
  thresholds: RiskThresholds;
  onBackToDirectory: () => void;
  onSelectStudent: (studentId: string) => void;
  onUpdateScore: (
    studentId: string,
    assessmentId: string,
    marksObtained: number | null
  ) => Promise<string | undefined>;
  onUpdateAttendance: (
    studentId: string,
    subjectId: string,
    classesAttended: number,
    classesHeld: number
  ) => Promise<string | undefined>;
  onCreateIntervention: (input: {
    studentId: string;
    subjectId: string | null;
    actionTitle: string;
    description: string;
    assignedFaculty: string;
    followUpDate: string;
    triggerFactors: string[];
  }) => Promise<string | undefined>;
  onUpdateIntervention: (
    interventionId: string,
    status: InterventionStatus,
    outcomeNotes: string
  ) => Promise<string | undefined>;
}

const SUBJECT_LINE_COLORS = ['#0A2463', '#3E92CC', '#D8315B', '#57534E', '#1E1B18'];

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

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  evaluation,
  allEvaluations,
  dataset,
  thresholds,
  onBackToDirectory,
  onSelectStudent,
  onUpdateScore,
  onUpdateAttendance,
  onCreateIntervention,
  onUpdateIntervention,
}) => {
  const { student } = evaluation;

  // Expandable details state
  const [expandedEvidenceIds, setExpandedEvidenceIds] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedRecIds, setExpandedRecIds] = useState<Record<string, boolean>>({});
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  // Inline subject editor state
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [attDraft, setAttDraft] = useState<{ attended: string; held: string }>({
    attended: '0',
    held: '0',
  });
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});
  const [editFeedback, setEditFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Intervention creation form state
  const [showNewIntervention, setShowNewIntervention] = useState(false);
  const [intvSubjectId, setIntvSubjectId] = useState<string>('');
  const [intvTitle, setIntvTitle] = useState('');
  const [intvDescription, setIntvDescription] = useState('');
  const [intvFaculty, setIntvFaculty] = useState(student.advisorName);
  const [intvFollowUpDate, setIntvFollowUpDate] = useState('2026-10-18');
  const [intvError, setIntvError] = useState<string | null>(null);
  const [intvSuccess, setIntvSuccess] = useState<string | null>(null);

  // Outcome note editing per intervention
  const [editingIntvId, setEditingIntvId] = useState<string | null>(null);
  const [intvStatusDraft, setIntvStatusDraft] = useState<InterventionStatus>('IN_PROGRESS');
  const [intvNotesDraft, setIntvNotesDraft] = useState<string>('');

  const startEditingSubject = (subSummary: SubjectPerformanceSummary) => {
    setEditingSubjectId(subSummary.subject.id);
    setAttDraft({
      attended: String(subSummary.classesAttended ?? 0),
      held: String(subSummary.classesHeld ?? 25),
    });
    const drafts: Record<string, string> = {};
    subSummary.assessments.forEach((a) => {
      drafts[a.assessment.id] = a.marksObtained === null ? '' : String(a.marksObtained);
    });
    setScoreDrafts(drafts);
    setEditFeedback(null);
  };

  const handleSaveSubjectEdits = async (subSummary: SubjectPerformanceSummary) => {
    setEditFeedback(null);
    const attNum = Number(attDraft.attended);
    const heldNum = Number(attDraft.held);

    const attErr = await onUpdateAttendance(student.id, subSummary.subject.id, attNum, heldNum);
    if (attErr) {
      setEditFeedback({ type: 'error', message: attErr });
      return;
    }

    for (const item of subSummary.assessments) {
      const rawVal = (scoreDrafts[item.assessment.id] ?? '').trim();
      const parsedMarks = rawVal === '' ? null : Number(rawVal);
      const scoreErr = await onUpdateScore(student.id, item.assessment.id, parsedMarks);
      if (scoreErr) {
        setEditFeedback({ type: 'error', message: scoreErr });
        return;
      }
    }

    setEditingSubjectId(null);
    setEditFeedback({
      type: 'success',
      message: `Saved ${subSummary.subject.code} records.`,
    });
  };

  const handlePrefillFromRecommendation = (rec: ActionRecommendation) => {
    setIntvSubjectId(rec.subjectId ?? '');
    setIntvTitle(rec.title);
    setIntvDescription(rec.facultyAction);
    const matchingSubject = dataset.subjects.find((s) => s.id === rec.subjectId);
    setIntvFaculty(matchingSubject ? matchingSubject.instructor : student.advisorName);
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + rec.suggestedFollowUpDays);
    setIntvFollowUpDate(followUp.toISOString().split('T')[0]);
    setIntvError(null);
    setShowNewIntervention(true);
  };

  const handleCreateInterventionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntvError(null);
    const err = await onCreateIntervention({
      studentId: student.id,
      subjectId: intvSubjectId || null,
      actionTitle: intvTitle,
      description: intvDescription,
      assignedFaculty: intvFaculty,
      followUpDate: intvFollowUpDate,
      triggerFactors: evaluation.evidence.map((ev) => ev.headline),
    });
    if (err) {
      setIntvError(err);
      return;
    }
    setShowNewIntervention(false);
    setIntvTitle('');
    setIntvDescription('');
    setIntvSuccess('Intervention recorded.');
    setTimeout(() => setIntvSuccess(null), 3500);
  };

  const handleSaveInterventionUpdate = async (interventionId: string) => {
    const err = await onUpdateIntervention(interventionId, intvStatusDraft, intvNotesDraft);
    if (!err) {
      setEditingIntvId(null);
    }
  };

  const trajectoryData = [
    { period: 'Quiz 1', seq: 1 },
    { period: 'Midterm', seq: 2 },
    { period: 'Assessment 2', seq: 3 },
  ].map((step) => {
    const row: Record<string, string | number | null> = { period: step.period };
    evaluation.subjectSummaries.forEach((sub) => {
      const found = sub.assessments.find((a) => a.assessment.sequenceOrder === step.seq);
      row[sub.subject.code] = found ? found.normalizedPercentage : null;
    });
    return row;
  });

  const visibleRecommendations = showAllRecommendations
    ? evaluation.recommendations
    : evaluation.recommendations.slice(0, 3);

  return (
    <div className="space-y-8 lg:space-y-10">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToDirectory}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-imperial transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to students</span>
        </button>

        <div className="flex items-center gap-2.5">
          <select
            value={student.id}
            onChange={(e) => onSelectStudent(e.target.value)}
            aria-label="Select student profile"
            className="input-field w-auto py-2 text-sm font-medium"
          >
            {allEvaluations.map((ev) => (
              <option key={ev.student.id} value={ev.student.id}>
                {ev.student.rollNumber} — {ev.student.fullName}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setShowNewIntervention(true);
              setIntvTitle('');
              setIntvDescription('');
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>New intervention</span>
          </button>
        </div>
      </div>

      {/* Student Identity Header */}
      <header className="pb-6 border-b border-stone-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl sm:text-[28px] lg:text-[30px] font-bold tracking-tight text-carbon">
              {student.fullName}
            </h1>
            <RiskBadge
              level={evaluation.riskLevel}
              size="md"
              showIncompleteTag={evaluation.hasIncompleteData}
            />
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            <span className="font-mono">{student.rollNumber}</span> · Sem {student.semester}{' '}
            (Sec {student.section}) · Advisor: {student.advisorName}
          </p>
        </div>
      </header>

      {/* 4 Aligned Academic Standing Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          className={`card-surface p-6 flex flex-col justify-between border-t-2 ${
            (evaluation.overallScorePercentage ?? 100) < thresholds.passingScorePct
              ? 'border-t-magenta'
              : 'border-t-imperial'
          }`}
        >
          <div className="text-sm font-medium text-ink-secondary">Academic score</div>
          <div
            className={`font-display text-3xl font-bold tabular-nums my-3 ${
              (evaluation.overallScorePercentage ?? 100) < thresholds.passingScorePct
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

        <div
          className={`card-surface p-6 flex flex-col justify-between border-t-2 ${
            (evaluation.overallAttendancePercentage ?? 100) < thresholds.criticalAttendancePct
              ? 'border-t-magenta'
              : 'border-t-bluebell'
          }`}
        >
          <div className="text-sm font-medium text-ink-secondary">Attendance</div>
          <div
            className={`font-display text-3xl font-bold tabular-nums my-3 ${
              (evaluation.overallAttendancePercentage ?? 100) < thresholds.criticalAttendancePct
                ? 'text-magenta'
                : 'text-carbon'
            }`}
          >
            {evaluation.overallAttendancePercentage !== null
              ? `${evaluation.overallAttendancePercentage}%`
              : 'N/A'}
          </div>
          <div className="text-xs text-ink-secondary tabular-nums">
            {evaluation.totalClassesAttended}/{evaluation.totalClassesHeld} classes
          </div>
        </div>

        <div className="card-surface p-6 flex flex-col justify-between border-t-2 border-t-bluebell">
          <div className="text-sm font-medium text-ink-secondary">Recent trend</div>
          <div className="my-3">
            <TrendDeltaPill delta={evaluation.overallTrendDeltaPoints} />
          </div>
          <div className="text-xs text-ink-secondary">Midterm to Assessment 2</div>
        </div>

        <div className="card-surface p-6 flex flex-col justify-between border-t-2 border-t-imperial">
          <div className="text-sm font-medium text-ink-secondary">Interventions</div>
          <div className="font-display text-3xl font-bold text-carbon tabular-nums my-3">
            {evaluation.interventions.length}
          </div>
          <div className="text-xs text-ink-secondary tabular-nums">
            {evaluation.activeInterventionsCount} active
          </div>
        </div>
      </section>

      {/* Feedback Banner */}
      {(editFeedback || intvSuccess) && (
        <div
          className={`p-4 rounded-lg border text-sm flex items-center justify-between ${
            editFeedback?.type === 'error'
              ? 'bg-status-danger-bg border-status-danger-border text-status-danger-text'
              : 'bg-status-success-bg border-status-success-border text-status-success-text'
          }`}
        >
          <span>{editFeedback?.message || intvSuccess}</span>
          <button
            type="button"
            onClick={() => {
              setEditFeedback(null);
              setIntvSuccess(null);
            }}
            className="text-current hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Academic Alerts & Recommendations (Collapsed details by default) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Academic Alerts */}
        <section className="lg:col-span-5 card-surface overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-border flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-carbon">
              Academic alerts
            </h2>
            <span className="font-mono text-xs text-ink-muted tabular-nums">
              {evaluation.evidence.length}
            </span>
          </div>

          <div className="divide-y divide-stone-border text-sm">
            {evaluation.evidence.map((ev) => {
              const summary = formatConciseAlert(ev, evaluation, thresholds);
              const isExpanded = Boolean(expandedEvidenceIds[ev.id]);
              return (
                <div key={ev.id} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 mt-2 ${
                          ev.severity === 'HIGH'
                            ? 'bg-status-danger-dot'
                            : ev.severity === 'MEDIUM'
                            ? 'bg-status-warning-dot'
                            : 'bg-status-neutral-dot'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-carbon truncate">
                          {summary.title}
                        </div>
                        <div className="font-mono text-xs text-ink-secondary tabular-nums mt-0.5">
                          {summary.subtitle}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedEvidenceIds((prev) => ({
                          ...prev,
                          [ev.id]: !prev[ev.id],
                        }))
                      }
                      className="text-xs font-medium text-bluebell hover:text-imperial shrink-0 inline-flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Hide' : 'View details'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <p className="mt-3 ml-4 pl-3 border-l-2 border-bluebell-border text-sm text-ink-secondary leading-relaxed">
                      {ev.detail}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Recommendations (Top 3 shown first) */}
        <section className="lg:col-span-7 card-surface overflow-hidden">
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

          <div className="divide-y divide-stone-border text-sm">
            {visibleRecommendations.map((rec) => {
              const isExpanded = Boolean(expandedRecIds[rec.id]);
              return (
                <div key={rec.id} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded border shrink-0 ${
                            rec.priority === 'URGENT'
                              ? 'bg-status-danger-bg text-status-danger-text border-status-danger-border'
                              : 'bg-subtle text-ink-secondary border-stone-border'
                          }`}
                        >
                          {rec.priority === 'URGENT' ? 'Priority' : 'Action'}
                        </span>
                        <span className="font-semibold text-carbon truncate">
                          {rec.title}
                        </span>
                      </div>
                      <div className="text-xs text-ink-secondary font-mono tabular-nums mt-1">
                        {rec.subjectCode ? `${rec.subjectCode} · ` : ''}
                        Follow-up within {rec.suggestedFollowUpDays} days
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRecIds((prev) => ({
                            ...prev,
                            [rec.id]: !prev[rec.id],
                          }))
                        }
                        className="text-xs font-medium text-bluebell hover:text-imperial inline-flex items-center gap-0.5"
                      >
                        <span>{isExpanded ? 'Hide' : 'View details'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrefillFromRecommendation(rec)}
                        className="btn-secondary py-1.5 px-2.5 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Assign</span>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pl-3 border-l-2 border-bluebell-border space-y-1.5 text-sm text-ink-secondary">
                      <div>
                        <strong className="text-carbon">Faculty:</strong>{' '}
                        {rec.facultyAction}
                      </div>
                      <div>
                        <strong className="text-bluebell">Student:</strong>{' '}
                        {rec.studentGuidance}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Subject Performance Table (Inline Editable) */}
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
                <th className="py-3.5 px-4 text-right">Attendance</th>
                <th className="py-3.5 px-4 text-right">Quiz 1 (/20)</th>
                <th className="py-3.5 px-4 text-right">Midterm (/50)</th>
                <th className="py-3.5 px-4 text-right">Asmt 2 (/30)</th>
                <th className="py-3.5 px-4 text-right">Score</th>
                <th className="py-3.5 px-4 text-right">Trend</th>
                <th className="py-3.5 px-6 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-border text-sm">
              {evaluation.subjectSummaries.map((sub) => {
                const isEditing = editingSubjectId === sub.subject.id;
                const q1 = sub.assessments[0];
                const mid = sub.assessments[1];
                const a2 = sub.assessments[2];

                return (
                  <tr
                    key={sub.subject.id}
                    className={isEditing ? 'bg-imperial-subtle' : 'hover:bg-subtle/40'}
                  >
                    <td className="py-4 px-6">
                      <div className="font-semibold text-carbon">
                        <span className="font-mono text-imperial">{sub.subject.code}</span> ·{' '}
                        {sub.subject.name}
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5">
                        {sub.subject.instructor}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right tabular-nums">
                      {isEditing ? (
                        <div className="inline-flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            min="0"
                            value={attDraft.attended}
                            onChange={(e) =>
                              setAttDraft({ ...attDraft, attended: e.target.value })
                            }
                            className="w-14 px-2 py-1 text-sm border border-stone-border rounded bg-white text-right"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            min="1"
                            value={attDraft.held}
                            onChange={(e) =>
                              setAttDraft({ ...attDraft, held: e.target.value })
                            }
                            className="w-14 px-2 py-1 text-sm border border-stone-border rounded bg-white text-right"
                          />
                        </div>
                      ) : (
                        <div>
                          <span
                            className={`font-mono font-semibold ${
                              sub.isCriticalAttendance
                                ? 'text-status-danger-text'
                                : sub.isWarningAttendance
                                ? 'text-status-warning-text'
                                : 'text-carbon'
                            }`}
                          >
                            {sub.attendancePercentage !== null
                              ? `${sub.attendancePercentage}%`
                              : 'N/A'}
                          </span>
                          <div className="text-xs text-ink-muted">
                            {sub.classesAttended}/{sub.classesHeld}
                          </div>
                        </div>
                      )}
                    </td>

                    {[q1, mid, a2].map((asmtItem) => {
                      if (!asmtItem) return <td key="empty" className="py-4 px-4" />;
                      const draftVal = scoreDrafts[asmtItem.assessment.id] ?? '';
                      return (
                        <td
                          key={asmtItem.assessment.id}
                          className="py-4 px-4 text-right tabular-nums"
                        >
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={asmtItem.assessment.maxMarks}
                              placeholder="NULL"
                              value={draftVal}
                              onChange={(e) =>
                                setScoreDrafts({
                                  ...scoreDrafts,
                                  [asmtItem.assessment.id]: e.target.value,
                                })
                              }
                              className="w-16 px-2 py-1 text-sm border border-stone-border rounded bg-white text-right font-mono"
                            />
                          ) : asmtItem.marksObtained === null ? (
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-subtle text-ink-muted border border-stone-border">
                              Missing
                            </span>
                          ) : (
                            <div className="font-mono">
                              <span className="font-medium text-carbon">
                                {asmtItem.marksObtained}
                              </span>
                              <span className="text-ink-muted">
                                /{asmtItem.assessment.maxMarks}
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-4 px-4 text-right font-mono tabular-nums">
                      {sub.weightedScorePercentage !== null ? (
                        <span
                          className={`font-semibold ${
                            sub.isFailingScore
                              ? 'text-status-danger-text'
                              : sub.isBorderlineScore
                              ? 'text-status-warning-text'
                              : 'text-carbon'
                          }`}
                        >
                          {sub.weightedScorePercentage}%
                        </span>
                      ) : (
                        <span className="text-ink-muted">N/A</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <TrendDeltaPill delta={sub.trendDeltaPoints} />
                    </td>

                    <td className="py-4 px-6 text-right">
                      {isEditing ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveSubjectEdits(sub)}
                            className="p-1.5 rounded-md bg-imperial text-ghost hover:bg-imperial-hover"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSubjectId(null)}
                            className="p-1.5 rounded-md bg-surface border border-stone-border text-ink-secondary"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditingSubject(sub)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-bluebell hover:text-imperial transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Assessment Trend + Interventions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 card-surface p-6">
          <h2 className="font-display text-lg font-semibold text-carbon mb-4">
            Assessment trend
          </h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trajectoryData}
                margin={{ top: 8, right: 12, left: -16, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E2E7" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12, fill: '#57534E' }}
                  axisLine={{ stroke: '#E5E2E7' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#78736E' }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFAFF',
                    borderColor: '#E5E2E7',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#1E1B18',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <ReferenceLine
                  y={thresholds.passingScorePct}
                  stroke="#D8315B"
                  strokeDasharray="4 4"
                />
                {evaluation.subjectSummaries.map((sub, idx) => (
                  <Line
                    key={sub.subject.id}
                    type="monotone"
                    dataKey={sub.subject.code}
                    name={sub.subject.code}
                    stroke={SUBJECT_LINE_COLORS[idx % SUBJECT_LINE_COLORS.length]}
                    strokeWidth={2}
                    connectNulls={false}
                    dot={{ r: 3.5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-6 card-surface p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-carbon">
                Interventions
              </h2>
              <button
                type="button"
                onClick={() => setShowNewIntervention((v) => !v)}
                className="text-xs font-medium text-bluebell hover:text-imperial inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {showNewIntervention && (
              <form
                onSubmit={handleCreateInterventionSubmit}
                className="mb-5 p-4 rounded-lg bg-subtle border border-stone-border space-y-3 text-sm"
              >
                {intvError && (
                  <div className="p-2.5 rounded bg-status-danger-bg border border-status-danger-border text-status-danger-text text-xs">
                    {intvError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={intvSubjectId}
                    onChange={(e) => setIntvSubjectId(e.target.value)}
                    className="input-field py-2 text-sm"
                  >
                    <option value="">All subjects</option>
                    {dataset.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code}: {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    required
                    value={intvFollowUpDate}
                    onChange={(e) => setIntvFollowUpDate(e.target.value)}
                    className="input-field py-2 text-sm tabular-nums"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={intvTitle}
                  onChange={(e) => setIntvTitle(e.target.value)}
                  placeholder="Action title..."
                  className="input-field py-2 text-sm"
                />
                <textarea
                  rows={2}
                  required
                  value={intvDescription}
                  onChange={(e) => setIntvDescription(e.target.value)}
                  placeholder="Support plan notes..."
                  className="input-field py-2 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewIntervention(false)}
                    className="btn-tertiary py-1.5 px-3 text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary py-1.5 px-3.5 text-xs">
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-stone-border text-sm">
              {evaluation.interventions.map((intv) => {
                const isEditingIntv = editingIntvId === intv.id;
                return (
                  <div key={intv.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-carbon">
                        {intv.actionTitle}
                      </span>
                      <InterventionStatusBadge status={intv.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-ink-muted tabular-nums">
                      <span>
                        {intv.assignedFaculty} · Due {intv.followUpDate}
                      </span>
                      {!isEditingIntv && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIntvId(intv.id);
                            setIntvStatusDraft(intv.status);
                            setIntvNotesDraft(intv.outcomeNotes);
                          }}
                          className="text-bluebell hover:text-imperial font-medium transition-colors"
                        >
                          Update
                        </button>
                      )}
                    </div>
                    {intv.outcomeNotes && !isEditingIntv && (
                      <div className="text-xs text-ink-secondary">
                        Note: {intv.outcomeNotes}
                      </div>
                    )}
                    {isEditingIntv && (
                      <div className="pt-2 space-y-2.5">
                        <select
                          value={intvStatusDraft}
                          onChange={(e) =>
                            setIntvStatusDraft(e.target.value as InterventionStatus)
                          }
                          className="input-field py-1.5 text-xs"
                        >
                          <option value="PLANNED">Planned</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                        <input
                          type="text"
                          value={intvNotesDraft}
                          onChange={(e) => setIntvNotesDraft(e.target.value)}
                          placeholder="Outcome note..."
                          className="input-field py-1.5 text-xs"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingIntvId(null)}
                            className="btn-tertiary py-1 px-2.5 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveInterventionUpdate(intv.id)}
                            className="btn-primary py-1 px-3 text-xs"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {evaluation.interventions.length === 0 && (
                <div className="py-8 text-center text-sm text-ink-muted">
                  No interventions recorded.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
