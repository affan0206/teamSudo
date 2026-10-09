import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { InterventionStatus, RiskLevel } from '../types/academic';

export const RiskBadge: React.FC<{
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIncompleteTag?: boolean;
}> = ({ level, size = 'md', showIncompleteTag = false }) => {
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : size === 'lg'
      ? 'px-3 py-1 text-xs'
      : 'px-2.5 py-0.5 text-xs';

  const config: Record<
    RiskLevel,
    {
      label: string;
      bg: string;
      text: string;
      border: string;
      dot: string;
    }
  > = {
    HIGH: {
      label: 'High Risk',
      bg: 'bg-status-danger-bg',
      text: 'text-status-danger-text',
      border: 'border-status-danger-border',
      dot: 'bg-status-danger-dot',
    },
    MEDIUM: {
      label: 'Medium Risk',
      bg: 'bg-status-warning-bg',
      text: 'text-status-warning-text',
      border: 'border-status-warning-border',
      dot: 'bg-status-warning-dot',
    },
    LOW: {
      label: 'Low Risk',
      bg: 'bg-status-success-bg',
      text: 'text-status-success-text',
      border: 'border-status-success-border',
      dot: 'bg-status-success-dot',
    },
    INSUFFICIENT_DATA: {
      label: 'Insufficient Data',
      bg: 'bg-status-neutral-bg',
      text: 'text-status-neutral-text',
      border: 'border-status-neutral-border border-dashed',
      dot: 'bg-status-neutral-dot',
    },
  };

  const current = config[level];

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${current.bg} ${current.text} ${current.border} ${sizeClasses}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
        <span>{current.label}</span>
      </span>
      {showIncompleteTag && level !== 'INSUFFICIENT_DATA' && (
        <span
          title="One or more assessments are unrecorded (null). Missing records are excluded from score denominators."
          className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border border-dashed border-stone-strong bg-subtle text-ink-secondary"
        >
          Partial Data
        </span>
      )}
    </div>
  );
};

export const InterventionStatusBadge: React.FC<{ status: InterventionStatus }> = ({ status }) => {
  const styles: Record<
    InterventionStatus,
    { label: string; classes: string; dot: string }
  > = {
    PLANNED: {
      label: 'Planned',
      classes: 'bg-status-warning-bg text-status-warning-text border-status-warning-border',
      dot: 'bg-status-warning-dot',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      classes: 'bg-forest-subtle text-forest border-forest-border',
      dot: 'bg-forest',
    },
    COMPLETED: {
      label: 'Completed',
      classes: 'bg-status-success-bg text-status-success-text border-status-success-border',
      dot: 'bg-status-success-dot',
    },
  };

  const item = styles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-md border ${item.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dot}`} />
      {item.label}
    </span>
  );
};

export const TrendDeltaPill: React.FC<{ delta: number | null }> = ({ delta }) => {
  if (delta === null || Number.isNaN(delta)) {
    return <span className="text-xs text-ink-muted tabular-nums">—</span>;
  }

  if (delta <= -15) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-status-danger-text bg-status-danger-bg border border-status-danger-border px-2 py-0.5 rounded-md tabular-nums">
        <TrendingDown className="w-3 h-3 shrink-0" />
        {delta > 0 ? `+${delta}` : delta} pts
      </span>
    );
  }

  if (delta <= -8) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-status-warning-text bg-status-warning-bg border border-status-warning-border px-2 py-0.5 rounded-md tabular-nums">
        <TrendingDown className="w-3 h-3 shrink-0" />
        {delta} pts
      </span>
    );
  }

  if (delta >= 5) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-status-success-text bg-status-success-bg border border-status-success-border px-2 py-0.5 rounded-md tabular-nums">
        <TrendingUp className="w-3 h-3 shrink-0" />+{delta} pts
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-secondary tabular-nums">
      <Minus className="w-3 h-3 text-ink-muted shrink-0" />
      {delta > 0 ? `+${delta}` : delta} pts
    </span>
  );
};
