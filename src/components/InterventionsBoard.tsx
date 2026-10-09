import React, { useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  X,
} from 'lucide-react';
import {
  AcademicDataset,
  InterventionStatus,
  StudentAcademicEvaluation,
} from '../types/academic';
import { InterventionStatusBadge, RiskBadge } from './StatusBadges';

interface InterventionsBoardProps {
  dataset: AcademicDataset;
  evaluations: StudentAcademicEvaluation[];
  onSelectStudent: (studentId: string) => void;
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

export const InterventionsBoard: React.FC<InterventionsBoardProps> = ({
  dataset,
  evaluations,
  onSelectStudent,
  onCreateIntervention,
  onUpdateIntervention,
}) => {
  const [statusFilter, setStatusFilter] = useState<InterventionStatus | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [studentId, setStudentId] = useState(evaluations[0]?.student.id ?? 'stu-001');
  const [subjectId, setSubjectId] = useState<string>('');
  const [actionTitle, setActionTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedFaculty, setAssignedFaculty] = useState('Dr. Aris Thorne');
  const [followUpDate, setFollowUpDate] = useState('2026-10-18');
  const [formError, setFormError] = useState<string | null>(null);

  // Inline update state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<InterventionStatus>('IN_PROGRESS');
  const [notesDraft, setNotesDraft] = useState('');

  const filteredInterventions = dataset.interventions.filter((i) =>
    statusFilter === 'ALL' ? true : i.status === statusFilter
  );

  const plannedCount = dataset.interventions.filter((i) => i.status === 'PLANNED').length;
  const inProgressCount = dataset.interventions.filter((i) => i.status === 'IN_PROGRESS').length;
  const completedCount = dataset.interventions.filter((i) => i.status === 'COMPLETED').length;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const targetEval = evaluations.find((ev) => ev.student.id === studentId);
    const err = await onCreateIntervention({
      studentId,
      subjectId: subjectId || null,
      actionTitle,
      description,
      assignedFaculty,
      followUpDate,
      triggerFactors: targetEval ? targetEval.evidence.map((ev) => ev.headline) : [],
    });
    if (err) {
      setFormError(err);
      return;
    }
    setShowCreateModal(false);
    setActionTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-border pb-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-forest mb-1">
            Academic Support Operations
          </div>
          <h1 className="text-2xl font-semibold text-ink-primary tracking-tight">
            Faculty Interventions &amp; Follow-Up Tracker
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Monitor planned, active, and completed academic support actions across the cohort.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary shrink-0"
        >
          <Plus className="w-4 h-4" />
          Log New Intervention
        </button>
      </div>

      {/* Status Filter Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`card-surface p-4 text-left transition-all ${
            statusFilter === 'ALL'
              ? 'ring-2 ring-forest border-forest'
              : 'hover:bg-subtle/50'
          }`}
        >
          <div className="text-xs font-medium text-ink-secondary">Total Recorded</div>
          <div className="text-2xl font-semibold text-ink-primary tabular-nums mt-1">
            {dataset.interventions.length}
          </div>
          <div className="text-[11px] text-ink-muted mt-1">All cohort support actions</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('PLANNED')}
          className={`card-surface p-4 text-left transition-all ${
            statusFilter === 'PLANNED'
              ? 'ring-2 ring-status-warning-dot border-status-warning-border bg-status-warning-bg/20'
              : 'hover:bg-subtle/50'
          }`}
        >
          <div className="text-xs font-medium text-ink-secondary flex items-center justify-between">
            <span>Planned</span>
            <Clock className="w-3.5 h-3.5 text-status-warning-dot" />
          </div>
          <div className="text-2xl font-semibold text-ink-primary tabular-nums mt-1">
            {plannedCount}
          </div>
          <div className="text-[11px] text-ink-muted mt-1">Scheduled for check-in</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`card-surface p-4 text-left transition-all ${
            statusFilter === 'IN_PROGRESS'
              ? 'ring-2 ring-forest border-forest bg-forest-light/20'
              : 'hover:bg-subtle/50'
          }`}
        >
          <div className="text-xs font-medium text-ink-secondary flex items-center justify-between">
            <span>In Progress</span>
            <Clock className="w-3.5 h-3.5 text-forest" />
          </div>
          <div className="text-2xl font-semibold text-ink-primary tabular-nums mt-1">
            {inProgressCount}
          </div>
          <div className="text-[11px] text-ink-muted mt-1">Active mentoring or labs</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('COMPLETED')}
          className={`card-surface p-4 text-left transition-all ${
            statusFilter === 'COMPLETED'
              ? 'ring-2 ring-status-success-dot border-status-success-border bg-status-success-bg/20'
              : 'hover:bg-subtle/50'
          }`}
        >
          <div className="text-xs font-medium text-ink-secondary flex items-center justify-between">
            <span>Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success-dot" />
          </div>
          <div className="text-2xl font-semibold text-ink-primary tabular-nums mt-1">
            {completedCount}
          </div>
          <div className="text-[11px] text-ink-muted mt-1">Closed with outcome notes</div>
        </button>
      </div>

      {/* Interventions Table / List Container */}
      <section className="card-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-primary">
              Intervention Log ({filteredInterventions.length})
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Click any student name to inspect their full academic standing, or update status and outcome notes inline.
            </p>
          </div>
          {statusFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className="text-xs font-medium text-forest hover:text-forest-hover"
            >
              Show All ({dataset.interventions.length})
            </button>
          )}
        </div>

        <div className="divide-y divide-stone-border">
          {filteredInterventions.map((intv) => {
            const studentEval = evaluations.find((e) => e.student.id === intv.studentId);
            const subject = dataset.subjects.find((s) => s.id === intv.subjectId);
            const isEditing = editingId === intv.id;

            return (
              <div
                key={intv.id}
                className="p-5 hover:bg-subtle/30 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left: Student, Action & Evidence Triggers */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onSelectStudent(intv.studentId)}
                        className="text-sm font-semibold text-ink-primary hover:text-forest inline-flex items-center gap-1 transition-colors"
                      >
                        {studentEval?.student.fullName ?? intv.studentId}
                        <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted" />
                      </button>
                      <span className="font-mono text-xs text-ink-muted">
                        {studentEval?.student.rollNumber}
                      </span>
                      {studentEval && (
                        <RiskBadge
                          level={studentEval.riskLevel}
                          size="sm"
                          showIncompleteTag={studentEval.hasIncompleteData}
                        />
                      )}
                      {subject ? (
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-subtle text-ink-primary border border-stone-border">
                          {subject.code}: {subject.name}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-subtle text-ink-secondary border border-stone-border">
                          Cohort-Wide Advisory
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-ink-primary">
                        {intv.actionTitle}
                      </h3>
                      <p className="text-xs text-ink-secondary leading-relaxed mt-1">
                        {intv.description}
                      </p>
                    </div>

                    {intv.triggerFactors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {intv.triggerFactors.map((tf, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 rounded bg-subtle/80 border border-stone-border text-ink-secondary"
                          >
                            Trigger: {tf}
                          </span>
                        ))}
                      </div>
                    )}

                    {intv.outcomeNotes && !isEditing && (
                      <div className="mt-2 pt-2 border-t border-stone-border/70 text-xs text-ink-secondary">
                        <span className="font-semibold text-ink-primary">Outcome Note: </span>
                        {intv.outcomeNotes}
                      </div>
                    )}
                  </div>

                  {/* Right: Metadata & Inline Status Update */}
                  <div className="lg:w-80 shrink-0 flex flex-col justify-between gap-3 lg:border-l lg:border-stone-border lg:pl-5">
                    <div className="flex items-center justify-between gap-2">
                      <InterventionStatusBadge status={intv.status} />
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(intv.id);
                            setStatusDraft(intv.status);
                            setNotesDraft(intv.outcomeNotes);
                          }}
                          className="text-xs font-medium text-forest hover:text-forest-hover"
                        >
                          Update Status
                        </button>
                      )}
                    </div>

                    <div className="text-xs text-ink-secondary space-y-1">
                      <div>
                        Assigned Faculty:{' '}
                        <span className="font-medium text-ink-primary">
                          {intv.assignedFaculty}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 tabular-nums text-ink-muted">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Logged {intv.createdDate}</span>
                        <span>·</span>
                        <span className="text-ink-secondary font-medium">
                          Follow-up {intv.followUpDate}
                        </span>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="p-3 rounded-lg bg-subtle/70 border border-stone-border space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-ink-secondary mb-1">
                            Status
                          </label>
                          <select
                            value={statusDraft}
                            onChange={(e) =>
                              setStatusDraft(e.target.value as InterventionStatus)
                            }
                            className="input-field py-1.5 text-xs"
                          >
                            <option value="PLANNED">Planned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-ink-secondary mb-1">
                            Outcome / Progress Note
                          </label>
                          <textarea
                            rows={2}
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            placeholder="Enter outcome or progress note..."
                            className="input-field py-1.5 text-xs"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="btn-tertiary text-xs py-1 px-2"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await onUpdateIntervention(
                                intv.id,
                                statusDraft,
                                notesDraft
                              );
                              setEditingId(null);
                            }}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            Save Update
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Create Intervention Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/40 backdrop-blur-[1px] p-4">
          <div className="bg-surface border border-stone-border rounded-xl shadow-elevated max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-border bg-subtle/50">
              <div>
                <h2 className="text-base font-semibold text-ink-primary">
                  Record Academic Support Intervention
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Assign a constructive follow-up action for a student requiring support.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary hover:bg-subtle transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-status-danger-bg border border-status-danger-border text-status-danger-text">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-medium text-ink-primary mb-1.5">
                  Student *
                </label>
                <select
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    const found = evaluations.find(
                      (ev) => ev.student.id === e.target.value
                    );
                    if (found) setAssignedFaculty(found.student.advisorName);
                  }}
                  className="input-field"
                >
                  {evaluations.map((ev) => (
                    <option key={ev.student.id} value={ev.student.id}>
                      {ev.student.rollNumber} — {ev.student.fullName} ({ev.riskLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-ink-primary mb-1.5">
                    Target Subject
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Cohort / Multi-Subject</option>
                    {dataset.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-ink-primary mb-1.5">
                    Assigned Faculty *
                  </label>
                  <input
                    type="text"
                    required
                    value={assignedFaculty}
                    onChange={(e) => setAssignedFaculty(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-ink-primary mb-1.5">
                    Intervention Action Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={actionTitle}
                    onChange={(e) => setActionTitle(e.target.value)}
                    placeholder="e.g., Weekly Remedial Lab & Attendance Check-in"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ink-primary mb-1.5">
                    Follow-Up Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="input-field tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-ink-primary mb-1.5">
                  Support Plan Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline the constructive academic support plan..."
                  className="input-field"
                />
              </div>

              <div className="pt-3 border-t border-stone-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs py-1.5"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-1.5">
                  Save Intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
