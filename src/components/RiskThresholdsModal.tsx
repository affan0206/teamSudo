import React, { useState } from 'react';
import { RotateCcw, SlidersHorizontal, X, Check, Info } from 'lucide-react';
import { RiskThresholds } from '../types/academic';
import { DEFAULT_RISK_THRESHOLDS } from '../data/syntheticCohort';

interface RiskThresholdsModalProps {
  isOpen: boolean;
  thresholds: RiskThresholds;
  onClose: () => void;
  onSave: (next: RiskThresholds) => void;
}

export const RiskThresholdsModal: React.FC<RiskThresholdsModalProps> = ({
  isOpen,
  thresholds,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState<RiskThresholds>(thresholds);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.criticalAttendancePct >= draft.warningAttendancePct) {
      setError('Critical attendance threshold must be lower than Warning attendance threshold.');
      return;
    }
    if (draft.passingScorePct >= draft.borderlineScorePct) {
      setError('Passing score threshold must be lower than Borderline score buffer.');
      return;
    }
    if (draft.severeDropPoints <= draft.moderateDropPoints) {
      setError('Severe drop points must be greater than Moderate drop points.');
      return;
    }
    setError(null);
    onSave(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_RISK_THRESHOLDS });
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/40 backdrop-blur-[1px] p-4">
      <div className="bg-surface border border-stone-border rounded-xl shadow-elevated max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-border bg-subtle/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-forest-light border border-forest-border flex items-center justify-center text-forest">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink-primary">
                Academic Risk Engine Rules &amp; Thresholds
              </h2>
              <p className="text-xs text-ink-secondary">
                Configure deterministic early-warning classification parameters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink-primary p-1.5 rounded-md hover:bg-subtle transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleApply} className="p-5 space-y-4">
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-forest-light/60 border border-forest-border text-xs text-ink-secondary leading-relaxed">
            <Info className="w-4 h-4 text-forest shrink-0 mt-0.5" />
            <div>
              <strong className="text-ink-primary">Explainable Rules-Based Model:</strong> Thresholds
              below govern how students are classified into High, Medium, or Low Risk. Adjusting these
              parameters recalculates all cohort metrics and recommendations immediately.
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-status-danger-bg border border-status-danger-border text-xs text-status-danger-text">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1">
                Critical Attendance Floor (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="40"
                max="95"
                value={draft.criticalAttendancePct}
                onChange={(e) =>
                  setDraft({ ...draft, criticalAttendancePct: Number(e.target.value) })
                }
                className="input-field tabular-nums"
              />
              <span className="block text-[11px] text-ink-muted mt-1">
                Default: 75%. Below triggers High/Medium Risk.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1">
                Attendance Warning Buffer (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="50"
                max="98"
                value={draft.warningAttendancePct}
                onChange={(e) =>
                  setDraft({ ...draft, warningAttendancePct: Number(e.target.value) })
                }
                className="input-field tabular-nums"
              />
              <span className="block text-[11px] text-ink-muted mt-1">
                Default: 85%. Early-warning attendance zone.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1">
                Subject Passing Score (%)
              </label>
              <input
                type="number"
                step="1"
                min="30"
                max="80"
                value={draft.passingScorePct}
                onChange={(e) => setDraft({ ...draft, passingScorePct: Number(e.target.value) })}
                className="input-field tabular-nums"
              />
              <span className="block text-[11px] text-ink-muted mt-1">
                Default: 50%. Failing ≥2 subjects = High Risk.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1">
                Borderline Score Buffer (%)
              </label>
              <input
                type="number"
                step="1"
                min="40"
                max="90"
                value={draft.borderlineScorePct}
                onChange={(e) =>
                  setDraft({ ...draft, borderlineScorePct: Number(e.target.value) })
                }
                className="input-field tabular-nums"
              />
              <span className="block text-[11px] text-ink-muted mt-1">
                Default: 60%. Flags borderline subjects.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1">
                Severe Assessment Drop (pts)
              </label>
              <input
                type="number"
                step="1"
                min="5"
                max="40"
                value={draft.severeDropPoints}
                onChange={(e) =>
                  setDraft({ ...draft, severeDropPoints: Number(e.target.value) })
                }
                className="input-field tabular-nums"
              />
              <span className="block text-[11px] text-ink-muted mt-1">
                Default: 15 pts drop between consecutive exams.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1">
                Moderate Assessment Drop (pts)
              </label>
              <input
                type="number"
                step="1"
                min="3"
                max="30"
                value={draft.moderateDropPoints}
                onChange={(e) =>
                  setDraft({ ...draft, moderateDropPoints: Number(e.target.value) })
                }
                className="input-field tabular-nums"
              />
              <span className="block text-[11px] text-ink-muted mt-1">
                Default: 8 pts drop triggers Medium Risk.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-border flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary text-xs py-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Defaults
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-tertiary text-xs py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs py-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Apply Rules &amp; Recalculate
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
