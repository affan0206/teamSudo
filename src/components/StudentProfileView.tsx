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

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToDirectory}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-imperial transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Roster Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <select
            value={student.id}
            onChange={(e) => onSelectStudent(e.target.value)}
            aria-label="Select student profile"
            className="input-field w-auto py-1.5 text-xs font-medium"
          >
            {allEvaluations.map((ev) => (
              <option key={ev.student.id} value={ev.student.id}>
                {ev.student.rollNumber} — {ev.student.fullName} ({ev.riskLevel})
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
            className="btn-primary text-xs py-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Intervention</span>
          </button>
        </div>
      </div>

      {/* Swiss Editorial Dossier Masthead + 4-Cell Metric Matrix */}
      <section className="card-surface overflow-hidden">
        <div className="p-6 border-b border-stone-border flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-subtle/30">
          <div>
            <div className="section-kicker mb-2">
              <span className="section-kicker-num">01 //</span>
              <span>Student Academic Dossier</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink-primary">
                {student.fullName}
              </h1>
              <RiskBadge
                level={evaluation.riskLevel}
                size="md"
                showIncompleteTag={evaluation.hasIncompleteData}
              />
            </div>
            <p className="text-xs text-ink-secondary mt-1.5 font-mono">
              {student.rollNumber} · Sem {student.semester} ({student.section}) · Advisor:{' '}
              {student.advisorName}
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-ink-muted">
            <span className="px-2.5 py-1 rounded bg-surface border border-stone-border">
              Pass Floor: {thresholds.passingScorePct}%
            </span>
            <span className="px-2.5 py-1 rounded bg-surface border border-stone-border">
              Min Attendance: {thresholds.warningAttendancePct}%
            </span>
          </div>
        </div>

        {/* 4-Cell Hairline Standing Matrix */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-stone-border">
          <div className="p-5 flex flex-col justify-between">
            <div className="section-kicker">
              <span className="section-kicker-num">A //</span>
              <span>Academic Score</span>
            </div>
            <div className="my-2">
              <div
                className={`font-display text-3xl font-bold tabular-nums tracking-tight ${
                  (evaluation.overallScorePercentage ?? 100) < thresholds.passingScorePct
                    ? 'text-magenta'
                    : 'text-ink-primary'
                }`}
              >
                {evaluation.overallScorePercentage !== null
                  ? `${evaluation.overallScorePercentage}%`
                  : 'N/A'}
              </div>
            </div>
            <div className="text-[11px] text-ink-muted font-mono">
              {evaluation.failingSubjectsCount} failing · Floor {thresholds.passingScorePct}%
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between">
            <div className="section-kicker">
              <span className="section-kicker-num">B //</span>
              <span>Attendance</span>
            </div>
            <div className="my-2">
              <div
                className={`font-display text-3xl font-bold tabular-nums tracking-tight ${
                  (evaluation.overallAttendancePercentage ?? 100) < thresholds.criticalAttendancePct
                    ? 'text-magenta'
                    : 'text-ink-primary'
                }`}
              >
                {evaluation.overallAttendancePercentage !== null
                  ? `${evaluation.overallAttendancePercentage}%`
                  : 'N/A'}
              </div>
            </div>
            <div className="text-[11px] text-ink-muted font-mono tabular-nums">
              {evaluation.totalClassesAttended}/{evaluation.totalClassesHeld} sessions
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between">
            <div className="section-kicker">
              <span className="section-kicker-num">C //</span>
              <span>Trajectory Delta</span>
            </div>
            <div className="my-2.5">
              <TrendDeltaPill delta={evaluation.overallTrendDeltaPoints} />
            </div>
            <div className="text-[11px] text-ink-muted">Midterm → Assessment 2</div>
          </div>

          <div className="p-5 flex flex-col justify-between">
            <div className="section-kicker">
              <span className="section-kicker-num">D //</span>
              <span>Interventions</span>
            </div>
            <div className="my-2">
              <div className="font-display text-3xl font-bold text-ink-primary tabular-nums tracking-tight">
                {evaluation.interventions.length}
              </div>
            </div>
            <div className="text-[11px] text-ink-muted font-mono">
              {evaluation.activeInterventionsCount} active cases
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Banner */}
      {(editFeedback || intvSuccess) && (
        <div
          className={`p-3 rounded-md border text-xs flex items-center justify-between ${
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

      {/* Concise Risk Factors & Recommended Actions (Expandable on demand) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Risk Factors */}
        <div className="lg:col-span-5 card-surface overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-border flex items-center justify-between">
            <div>
              <div className="section-kicker mb-0.5">
                <span className="section-kicker-num">02 //</span>
                <span>Diagnostic Signals</span>
              </div>
              <h2 className="font-display text-sm font-bold text-ink-primary">
                Risk Indicators ({evaluation.evidence.length})
              </h2>
            </div>
          </div>

          <div className="divide-y divide-stone-border text-xs">
            {evaluation.evidence.map((ev) => {
              const isExpanded = Boolean(expandedEvidenceIds[ev.id]);
              return (
                <div key={ev.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          ev.severity === 'HIGH'
                            ? 'bg-status-danger-dot'
                            : ev.severity === 'MEDIUM'
                            ? 'bg-status-warning-dot'
                            : 'bg-status-neutral-dot'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-ink-primary truncate">
                          {ev.headline}
                        </div>
                        <div className="font-mono text-[11px] text-ink-muted tabular-nums">
                          {ev.metricLabel}
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
                      className="text-xs font-medium text-bluebell hover:text-imperial shrink-0 inline-flex items-center gap-0.5 transition-colors"
                    >
                      <span>{isExpanded ? 'Hide' : 'Details'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <p className="mt-2 pl-4 text-xs text-ink-secondary leading-relaxed">
                      {ev.detail}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="lg:col-span-7 card-surface overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-border">
            <div className="section-kicker mb-0.5">
              <span className="section-kicker-num">03 //</span>
              <span>Prescriptive Playbook</span>
            </div>
            <h2 className="font-display text-sm font-bold text-ink-primary">
              Recommended Actions ({evaluation.recommendations.length})
            </h2>
          </div>

          <div className="divide-y divide-stone-border text-xs">
            {evaluation.recommendations.slice(0, 4).map((rec) => {
              const isExpanded = Boolean(expandedRecIds[rec.id]);
              return (
                <div key={rec.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                          rec.priority === 'URGENT'
                            ? 'bg-status-danger-bg text-status-danger-text border-status-danger-border'
                            : 'bg-subtle text-ink-secondary border-stone-border'
                        }`}
                      >
                        {rec.priority === 'URGENT' ? 'Priority' : 'Action'}
                      </span>
                      <span className="font-semibold text-ink-primary truncate">
                        {rec.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRecIds((prev) => ({
                            ...prev,
                            [rec.id]: !prev[rec.id],
                          }))
                        }
                        className="text-xs font-medium text-ink-secondary hover:text-ink-primary inline-flex items-center gap-0.5"
                      >
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrefillFromRecommendation(rec)}
                        className="btn-secondary py-1 px-2 text-[11px]"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Assign</span>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 pl-2 border-l-2 border-bluebell-border space-y-1 text-ink-secondary">
                      <div>
                        <strong className="text-ink-primary">Faculty:</strong>{' '}
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
        </div>
      </div>

      {/* Subject-Wise Academic Performance & Attendance Table (Inline Editable) */}
      <div className="card-surface overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-border flex items-center justify-between">
          <div>
            <div className="section-kicker mb-0.5">
              <span className="section-kicker-num">04 //</span>
              <span>Course Records &amp; Inline Editor</span>
            </div>
            <h2 className="font-display text-sm font-bold text-ink-primary">
              Subject Performance &amp; Attendance
            </h2>
          </div>
          <span className="text-[11px] font-mono text-ink-muted">
            Select Edit to update marks or attendance
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-border bg-subtle/60 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <th className="py-2.5 px-4">Subject</th>
                <th className="py-2.5 px-3 text-right">Attendance</th>
                <th className="py-2.5 px-3 text-right">Quiz 1 (/20)</th>
                <th className="py-2.5 px-3 text-right">Midterm (/50)</th>
                <th className="py-2.5 px-3 text-right">Asmt 2 (/30)</th>
                <th className="py-2.5 px-3 text-right">Score</th>
                <th className="py-2.5 px-3 text-right">Trend</th>
                <th className="py-2.5 px-4 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-border text-xs">
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
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink-primary">
                        {sub.subject.code} · {sub.subject.name}
                      </div>
                      <div className="text-[11px] text-ink-muted">
                        {sub.subject.instructor}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right tabular-nums">
                      {isEditing ? (
                        <div className="inline-flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            min="0"
                            value={attDraft.attended}
                            onChange={(e) =>
                              setAttDraft({ ...attDraft, attended: e.target.value })
                            }
                            className="w-12 px-1.5 py-1 text-xs border border-stone-border rounded bg-white text-right"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            min="1"
                            value={attDraft.held}
                            onChange={(e) =>
                              setAttDraft({ ...attDraft, held: e.target.value })
                            }
                            className="w-12 px-1.5 py-1 text-xs border border-stone-border rounded bg-white text-right"
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
                                : 'text-ink-primary'
                            }`}
                          >
                            {sub.attendancePercentage !== null
                              ? `${sub.attendancePercentage}%`
                              : 'N/A'}
                          </span>
                          <div className="text-[11px] text-ink-muted">
                            {sub.classesAttended}/{sub.classesHeld}
                          </div>
                        </div>
                      )}
                    </td>

                    {[q1, mid, a2].map((asmtItem) => {
                      if (!asmtItem) return <td key="empty" className="py-3 px-3" />;
                      const draftVal = scoreDrafts[asmtItem.assessment.id] ?? '';
                      return (
                        <td
                          key={asmtItem.assessment.id}
                          className="py-3 px-3 text-right tabular-nums"
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
                              className="w-16 px-1.5 py-1 text-xs border border-stone-border rounded bg-white text-right font-mono"
                            />
                          ) : asmtItem.marksObtained === null ? (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-subtle text-ink-muted border border-stone-border">
                              MISSING
                            </span>
                          ) : (
                            <div className="font-mono">
                              <span className="font-medium text-ink-primary">
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

                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {sub.weightedScorePercentage !== null ? (
                        <span
                          className={`font-semibold ${
                            sub.isFailingScore
                              ? 'text-status-danger-text'
                              : sub.isBorderlineScore
                              ? 'text-status-warning-text'
                              : 'text-ink-primary'
                          }`}
                        >
                          {sub.weightedScorePercentage}%
                        </span>
                      ) : (
                        <span className="text-ink-muted">N/A</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <TrendDeltaPill delta={sub.trendDeltaPoints} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveSubjectEdits(sub)}
                            className="p-1.5 rounded bg-imperial text-ghost hover:bg-imperial-hover"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSubjectId(null)}
                            className="p-1.5 rounded bg-surface border border-stone-border text-ink-secondary"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditingSubject(sub)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-bluebell hover:text-imperial transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
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
      </div>

      {/* Trajectory Chart + Intervention History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 card-surface p-5">
          <div className="section-kicker mb-0.5">
            <span className="section-kicker-num">05 //</span>
            <span>Cycle Progression</span>
          </div>
          <h2 className="font-display text-sm font-bold text-ink-primary mb-3">
            Assessment Trajectory
          </h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trajectoryData}
                margin={{ top: 8, right: 12, left: -16, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E2E7" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: '#57534E' }}
                  axisLine={{ stroke: '#E5E2E7' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#78736E' }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFAFF',
                    borderColor: '#E5E2E7',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#1E1B18',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
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
        </div>

        <div className="lg:col-span-6 card-surface p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="section-kicker mb-0.5">
                  <span className="section-kicker-num">06 //</span>
                  <span>Advisory Ledger</span>
                </div>
                <h2 className="font-display text-sm font-bold text-ink-primary">
                  Interventions ({evaluation.interventions.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowNewIntervention((v) => !v)}
                className="text-xs font-medium text-bluebell hover:text-imperial inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {showNewIntervention && (
              <form
                onSubmit={handleCreateInterventionSubmit}
                className="mb-4 p-3 rounded-lg bg-subtle border border-stone-border space-y-2.5 text-xs"
              >
                {intvError && (
                  <div className="p-2 rounded bg-status-danger-bg border border-status-danger-border text-status-danger-text">
                    {intvError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={intvSubjectId}
                    onChange={(e) => setIntvSubjectId(e.target.value)}
                    className="input-field py-1.5 text-xs"
                  >
                    <option value="">Cohort / Multi-Subject</option>
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
                    className="input-field py-1.5 text-xs tabular-nums"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={intvTitle}
                  onChange={(e) => setIntvTitle(e.target.value)}
                  placeholder="Action title..."
                  className="input-field py-1.5 text-xs"
                />
                <textarea
                  rows={2}
                  required
                  value={intvDescription}
                  onChange={(e) => setIntvDescription(e.target.value)}
                  placeholder="Support plan notes..."
                  className="input-field py-1.5 text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewIntervention(false)}
                    className="btn-tertiary py-1 px-2 text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary py-1 px-3 text-xs">
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-stone-border text-xs">
              {evaluation.interventions.map((intv) => {
                const isEditingIntv = editingIntvId === intv.id;
                return (
                  <div key={intv.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink-primary">
                        {intv.actionTitle}
                      </span>
                      <InterventionStatusBadge status={intv.status} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ink-muted tabular-nums">
                      <span>
                        {intv.assignedFaculty} · Follow-up {intv.followUpDate}
                      </span>
                      {!isEditingIntv && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIntvId(intv.id);
                            setIntvStatusDraft(intv.status);
                            setIntvNotesDraft(intv.outcomeNotes);
                          }}
                          className="text-bluebell hover:text-imperial hover:underline font-medium transition-colors"
                        >
                          Update
                        </button>
                      )}
                    </div>
                    {intv.outcomeNotes && !isEditingIntv && (
                      <div className="text-[11px] text-ink-secondary">
                        Note: {intv.outcomeNotes}
                      </div>
                    )}
                    {isEditingIntv && (
                      <div className="pt-2 space-y-2">
                        <select
                          value={intvStatusDraft}
                          onChange={(e) =>
                            setIntvStatusDraft(e.target.value as InterventionStatus)
                          }
                          className="input-field py-1 text-xs"
                        >
                          <option value="PLANNED">Planned</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                        <input
                          type="text"
                          value={intvNotesDraft}
                          onChange={(e) => setIntvNotesDraft(e.target.value)}
                          placeholder="Outcome note..."
                          className="input-field py-1 text-xs"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingIntvId(null)}
                            className="btn-tertiary py-1 px-2 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveInterventionUpdate(intv.id)}
                            className="btn-primary py-1 px-2.5 text-xs"
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
                <div className="py-6 text-center text-xs text-ink-muted">
                  No interventions recorded for this student.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
