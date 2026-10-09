import React, { useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
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

  const [studentId, setStudentId] = useState(evaluations[0]?.student.id ?? 'stu-001');
  const [subjectId, setSubjectId] = useState<string>('');
  const [actionTitle, setActionTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedFaculty, setAssignedFaculty] = useState('Dr. Aris Thorne');
  const [followUpDate, setFollowUpDate] = useState('2026-10-18');
  const [formError, setFormError] = useState<string | null>(null);

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
    <div className="space-y-8 lg:space-y-10">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-border pb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-[28px] lg:text-[30px] font-bold text-carbon tracking-tight">
            Interventions
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Track faculty mentoring and student follow-ups.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New intervention</span>
        </button>
      </header>

      {/* 4 Clean Status Filter Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`card-surface p-6 text-left transition-all border-t-2 border-t-imperial ${
            statusFilter === 'ALL'
              ? 'ring-2 ring-imperial border-imperial bg-imperial-subtle/40'
              : 'hover:bg-subtle/50'
          }`}
        >
          <div className="text-sm font-medium text-ink-secondary">All interventions</div>
          <div className="font-display text-3xl font-bold text-carbon tabular-nums mt-2">
            {dataset.interventions.length}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('PLANNED')}
          className={`card-surface p-6 text-left transition-all border-t-2 border-t-status-warning-dot ${
            statusFilter === 'PLANNED'
              ? 'ring-2 ring-status-warning-dot border-status-warning-border bg-status-warning-bg/20'
              : 'hover:bg-subtle/50'
          }`}
        >
          <div className="text-sm font-medium text-ink-secondary">Planned</div>
          <div className="font-display text-3xl font-bold text-carbon tabular-nums mt-2">
            {plannedCount}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`card-surface p-6 text-left transition-all border-t-2 border-t-bluebell ${
            statusFilter === 'IN_PROGRESS'
              ? 'ring-2 ring-bluebell border-bluebell-border bg-bluebell-light/30'
              : 'hover:bg-subtle/50'
          }`}
        >
          <div className="text-sm font-medium text-ink-secondary">In progress</div>
          <div className="font-display text-3xl font-bold text-carbon tabular-nums mt-2">
            {inProgressCount}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('COMPLETED')}
          className={`card-surface p-6 text-left transition-all border-t-2 border-t-bluebell ${
            statusFilter === 'COMPLETED'
              ? 'ring-2 ring-status-success-dot border-status-success-border bg-status-success-bg/20'
              : 'hover:bg-subtle/50'
          }`}
        >
          <div className="text-sm font-medium text-ink-secondary">Completed</div>
          <div className="font-display text-3xl font-bold text-carbon tabular-nums mt-2">
            {completedCount}
          </div>
        </button>
      </div>

      {/* Interventions List Container */}
      <section className="card-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-border flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-carbon">
            Intervention log ({filteredInterventions.length})
          </h2>
          {statusFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className="text-xs font-medium text-bluebell hover:text-imperial transition-colors"
            >
              Show all ({dataset.interventions.length})
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
                className="p-6 hover:bg-subtle/30 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left: Student & Action */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onSelectStudent(intv.studentId)}
                        className="text-sm font-semibold text-carbon hover:text-imperial inline-flex items-center gap-1 transition-colors"
                      >
                        {studentEval?.student.fullName ?? intv.studentId}
                        <ArrowUpRight className="w-4 h-4 text-ink-muted" />
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
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-subtle text-carbon border border-stone-border">
                        {subject ? subject.code : 'General'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-carbon">
                        {intv.actionTitle}
                      </h3>
                      <p className="text-sm text-ink-secondary leading-relaxed mt-1 max-w-2xl">
                        {intv.description}
                      </p>
                    </div>

                    {intv.outcomeNotes && !isEditing && (
                      <div className="pt-2 text-xs text-ink-secondary">
                        <strong className="text-carbon">Outcome: </strong>
                        {intv.outcomeNotes}
                      </div>
                    )}
                  </div>

                  {/* Right: Metadata & Inline Status Update */}
                  <div className="lg:w-72 shrink-0 flex flex-col justify-between gap-3 lg:border-l lg:border-stone-border lg:pl-6">
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
                          className="text-xs font-medium text-bluebell hover:text-imperial transition-colors"
                        >
                          Update
                        </button>
                      )}
                    </div>

                    <div className="text-xs text-ink-secondary space-y-1">
                      <div>
                        Faculty:{' '}
                        <span className="font-medium text-carbon">
                          {intv.assignedFaculty}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 tabular-nums text-ink-muted">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due {intv.followUpDate}</span>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="p-3.5 rounded-lg bg-subtle/70 border border-stone-border space-y-3">
                        <select
                          value={statusDraft}
                          onChange={(e) =>
                            setStatusDraft(e.target.value as InterventionStatus)
                          }
                          className="input-field py-2 text-xs"
                        >
                          <option value="PLANNED">Planned</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                        <textarea
                          rows={2}
                          value={notesDraft}
                          onChange={(e) => setNotesDraft(e.target.value)}
                          placeholder="Outcome note..."
                          className="input-field py-2 text-xs"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="btn-tertiary text-xs py-1.5 px-2.5"
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
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            Save
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbon/40 backdrop-blur-[1px] p-4">
          <div className="bg-surface border border-stone-border rounded-xl shadow-elevated max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-border bg-subtle/50">
              <h2 className="font-display text-lg font-semibold text-carbon">
                New intervention
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-carbon hover:bg-subtle transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5 text-sm">
              {formError && (
                <div className="p-3.5 rounded-lg bg-status-danger-bg border border-status-danger-border text-status-danger-text text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-medium text-carbon mb-1.5">
                  Student
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
                      {ev.student.rollNumber} — {ev.student.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-carbon mb-1.5">
                    Subject
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">All subjects</option>
                    {dataset.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-carbon mb-1.5">
                    Assigned faculty
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-carbon mb-1.5">
                    Action title
                  </label>
                  <input
                    type="text"
                    required
                    value={actionTitle}
                    onChange={(e) => setActionTitle(e.target.value)}
                    placeholder="e.g., Weekly Remedial Lab"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block font-medium text-carbon mb-1.5">
                    Follow-up date
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
                <label className="block font-medium text-carbon mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline the academic support plan..."
                  className="input-field"
                />
              </div>

              <div className="pt-4 border-t border-stone-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
