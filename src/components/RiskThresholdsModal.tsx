import React, { useState } from 'react';
import { RotateCcw, SlidersHorizontal, X, Check } from 'lucide-react';
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
      setError('Critical attendance must be lower than warning attendance.');
      return;
    }
    if (draft.passingScorePct >= draft.borderlineScorePct) {
      setError('Passing score must be lower than borderline score.');
      return;
    }
    if (draft.severeDropPoints <= draft.moderateDropPoints) {
      setError('Severe drop points must be greater than moderate drop points.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bordeaux/65 backdrop-blur-[1px] p-4">
      <div className="bg-surface border border-stone-border rounded-xl shadow-elevated max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-border bg-subtle/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bluebell-light border border-bluebell-border flex items-center justify-center text-imperial">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <h2 className="font-display text-lg font-semibold text-carbon">
              Risk thresholds
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-imperial p-1.5 rounded-lg hover:bg-subtle transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleApply} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-status-danger-bg border border-status-danger-border text-sm text-status-danger-text">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-carbon mb-1.5">
                Critical attendance (%)
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
              <span className="block text-xs text-ink-muted mt-1">
                Default: 75%
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-carbon mb-1.5">
                Warning attendance (%)
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
              <span className="block text-xs text-ink-muted mt-1">
                Default: 85%
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-carbon mb-1.5">
                Passing score (%)
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
              <span className="block text-xs text-ink-muted mt-1">
                Default: 50%
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-carbon mb-1.5">
                Borderline score (%)
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
              <span className="block text-xs text-ink-muted mt-1">
                Default: 60%
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-carbon mb-1.5">
                Severe score drop (pts)
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
              <span className="block text-xs text-ink-muted mt-1">
                Default: 15 pts
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-carbon mb-1.5">
                Moderate score drop (pts)
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
              <span className="block text-xs text-ink-muted mt-1">
                Default: 8 pts
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-border flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
            >
              <RotateCcw className="w-4 h-4 text-bluebell" />
              <span>Reset defaults</span>
            </button>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="btn-tertiary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                <Check className="w-4 h-4" />
                <span>Apply rules</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
