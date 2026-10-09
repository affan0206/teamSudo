import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ArrowUpRight,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  AcademicDataset,
  RiskEvidenceItem,
  RiskLevel,
  RiskThresholds,
  StudentAcademicEvaluation,
} from '../types/academic';
import { InterventionStatusBadge, RiskBadge, TrendDeltaPill } from './StatusBadges';

interface StudentDirectoryProps {
  dataset: AcademicDataset;
  evaluations: StudentAcademicEvaluation[];
  thresholds: RiskThresholds;
  initialRiskFilter: RiskLevel | 'ALL';
  onSelectStudent: (studentId: string) => void;
}

type SortField = 'PRIORITY' | 'SCORE' | 'ATTENDANCE' | 'TREND' | 'ROLL';
type SortOrder = 'ASC' | 'DESC';

function formatShortIssueLabel(ev: RiskEvidenceItem | undefined): string {
  if (!ev) return 'On track';
  const prefix = ev.subjectCode ? `${ev.subjectCode} · ` : '';
  switch (ev.category) {
    case 'ATTENDANCE_CRITICAL':
    case 'ATTENDANCE_WARNING':
      return `${prefix}Low attendance (${ev.metricLabel})`;
    case 'SCORE_FAILING':
      return `${prefix}Below passing (${ev.metricLabel})`;
    case 'SCORE_BORDERLINE':
      return `${prefix}Borderline score (${ev.metricLabel})`;
    case 'TREND_SEVERE_DROP':
    case 'TREND_MODERATE_DROP':
      return `${prefix}Score drop (${ev.metricLabel})`;
    case 'RECENT_ASSESSMENT_FAILURE':
      return `${prefix}Low recent exam (${ev.metricLabel})`;
    case 'MULTI_SUBJECT_STRUGGLE':
      return `Multiple failing subjects (${ev.metricLabel})`;
    case 'MISSING_DATA':
      return `${prefix}Missing marks`;
    default:
      return `${prefix}${ev.metricLabel}`;
  }
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({
  dataset,
  evaluations,
  thresholds,
  initialRiskFilter,
  onSelectStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>(initialRiskFilter);
  const [sectionFilter, setSectionFilter] = useState<'ALL' | 'A' | 'B'>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('PRIORITY');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');

  React.useEffect(() => {
    setRiskFilter(initialRiskFilter);
  }, [initialRiskFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortField(field);
      setSortOrder(field === 'ROLL' ? 'ASC' : 'DESC');
    }
  };

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = evaluations.filter((item) => {
      if (q) {
        const matchesName = item.student.fullName.toLowerCase().includes(q);
        const matchesRoll = item.student.rollNumber.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll) return false;
      }

      if (riskFilter !== 'ALL' && item.riskLevel !== riskFilter) {
        return false;
      }

      if (sectionFilter !== 'ALL' && item.student.section !== sectionFilter) {
        return false;
      }

      if (subjectFilter !== 'ALL') {
        const subSummary = item.subjectSummaries.find((s) => s.subject.id === subjectFilter);
        if (!subSummary || subSummary.subjectRiskFlags.length === 0) {
          return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'PRIORITY':
          comparison = a.priorityScore - b.priorityScore;
          break;
        case 'SCORE':
          comparison = (a.overallScorePercentage ?? -1) - (b.overallScorePercentage ?? -1);
          break;
        case 'ATTENDANCE':
          comparison =
            (a.overallAttendancePercentage ?? -1) - (b.overallAttendancePercentage ?? -1);
          break;
        case 'TREND':
          comparison = (a.overallTrendDeltaPoints ?? 0) - (b.overallTrendDeltaPoints ?? 0);
          break;
        case 'ROLL':
          comparison = a.student.rollNumber.localeCompare(b.student.rollNumber);
          break;
      }
      return sortOrder === 'ASC' ? comparison : -comparison;
    });
  }, [
    evaluations,
    searchQuery,
    riskFilter,
    sectionFilter,
    subjectFilter,
    sortField,
    sortOrder,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setRiskFilter('ALL');
    setSectionFilter('ALL');
    setSubjectFilter('ALL');
    setSortField('PRIORITY');
    setSortOrder('DESC');
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    riskFilter !== 'ALL' ||
    sectionFilter !== 'ALL' ||
    subjectFilter !== 'ALL';

  const countByTier = useMemo(() => {
    return {
      ALL: evaluations.length,
      HIGH: evaluations.filter((e) => e.riskLevel === 'HIGH').length,
      MEDIUM: evaluations.filter((e) => e.riskLevel === 'MEDIUM').length,
      LOW: evaluations.filter((e) => e.riskLevel === 'LOW').length,
      INSUFFICIENT_DATA: evaluations.filter((e) => e.riskLevel === 'INSUFFICIENT_DATA')
        .length,
    };
  }, [evaluations]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-stone-border">
        <div>
          <h1 className="font-display text-2xl sm:text-[28px] lg:text-[30px] font-bold tracking-tight text-carbon">
            Students
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            {filteredAndSorted.length} of {evaluations.length} students
          </p>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="btn-secondary"
          >
            <RotateCcw className="w-4 h-4 text-bluebell" />
            <span>Reset filters</span>
          </button>
        )}
      </header>

      {/* Table with Single Filter Toolbar */}
      <div className="card-surface overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-stone-border flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex flex-wrap rounded-lg p-1 bg-subtle border border-stone-border text-xs">
            {(
              [
                { id: 'ALL', label: `All (${countByTier.ALL})` },
                { id: 'HIGH', label: `High (${countByTier.HIGH})` },
                { id: 'MEDIUM', label: `Medium (${countByTier.MEDIUM})` },
                { id: 'LOW', label: `On track (${countByTier.LOW})` },
                { id: 'INSUFFICIENT_DATA', label: `Incomplete (${countByTier.INSUFFICIENT_DATA})` },
              ] as { id: RiskLevel | 'ALL'; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRiskFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  riskFilter === tab.id
                    ? 'bg-imperial text-ghost shadow-card'
                    : 'text-ink-secondary hover:text-carbon'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student..."
                className="input-field pl-9 py-2 text-sm"
              />
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              aria-label="Filter by Subject"
              className="input-field w-auto py-2 text-sm"
            >
              <option value="ALL">All subjects</option>
              {dataset.subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code}
                </option>
              ))}
            </select>

            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value as 'ALL' | 'A' | 'B')}
              aria-label="Filter by Section"
              className="input-field w-auto py-2 text-sm"
            >
              <option value="ALL">All sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-border bg-subtle/60 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <th className="py-3.5 px-5">
                  <button
                    type="button"
                    onClick={() => handleSort('ROLL')}
                    className="inline-flex items-center gap-1 hover:text-carbon"
                  >
                    ID
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-3.5 px-5">Student</th>
                <th className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('PRIORITY')}
                    className="inline-flex items-center gap-1 hover:text-carbon"
                  >
                    Standing
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('SCORE')}
                    className="inline-flex items-center gap-1 hover:text-carbon ml-auto"
                  >
                    Score
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('ATTENDANCE')}
                    className="inline-flex items-center gap-1 hover:text-carbon ml-auto"
                  >
                    Attendance
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('TREND')}
                    className="inline-flex items-center gap-1 hover:text-carbon ml-auto"
                  >
                    Trend
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-3.5 px-5">Key alert</th>
                <th className="py-3.5 px-4">Intervention</th>
                <th className="py-3.5 px-5 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-border text-sm">
              {filteredAndSorted.map((item) => {
                const latestIntervention = item.interventions[0];
                const primaryEvidence = item.evidence[0];
                const isScoreLow =
                  item.overallScorePercentage !== null &&
                  item.overallScorePercentage < thresholds.passingScorePct;
                const isAttLow =
                  item.overallAttendancePercentage !== null &&
                  item.overallAttendancePercentage < thresholds.criticalAttendancePct;

                return (
                  <tr
                    key={item.student.id}
                    onClick={() => onSelectStudent(item.student.id)}
                    className="hover:bg-bluebell-subtle/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-5 font-mono text-xs text-ink-muted whitespace-nowrap">
                      {item.student.rollNumber}
                    </td>

                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="font-semibold text-carbon group-hover:text-imperial transition-colors">
                        {item.student.fullName}
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5">
                        Sec {item.student.section} · {item.student.advisorName}
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <RiskBadge
                        level={item.riskLevel}
                        size="sm"
                        showIncompleteTag={item.hasIncompleteData}
                      />
                    </td>

                    <td className="py-4 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                      {item.overallScorePercentage !== null ? (
                        <span
                          className={`font-semibold ${
                            isScoreLow ? 'text-magenta' : 'text-carbon'
                          }`}
                        >
                          {item.overallScorePercentage}%
                        </span>
                      ) : (
                        <span className="text-ink-muted">N/A</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                      {item.overallAttendancePercentage !== null ? (
                        <span
                          className={`font-semibold ${
                            isAttLow ? 'text-magenta' : 'text-carbon'
                          }`}
                        >
                          {item.overallAttendancePercentage}%
                        </span>
                      ) : (
                        <span className="text-ink-muted">N/A</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <TrendDeltaPill delta={item.overallTrendDeltaPoints} />
                    </td>

                    <td className="py-4 px-5 text-ink-secondary">
                      {formatShortIssueLabel(primaryEvidence)}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {latestIntervention ? (
                        <InterventionStatusBadge status={latestIntervention.status} />
                      ) : item.riskLevel === 'HIGH' || item.riskLevel === 'MEDIUM' ? (
                        <span className="text-xs font-medium text-status-warning-text">
                          Unassigned
                        </span>
                      ) : (
                        <span className="text-xs text-ink-muted">—</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent(item.student.id);
                        }}
                        className="inline-flex items-center gap-1 text-sm font-medium text-bluebell group-hover:text-imperial transition-colors"
                      >
                        <span>View</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredAndSorted.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-ink-muted">
                    No students match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
