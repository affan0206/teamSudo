import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ArrowUpRight,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  AcademicDataset,
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
    <div className="space-y-7">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-stone-border">
        <div className="space-y-1">
          <div className="section-kicker">01 // Cohort Roster &amp; Audit</div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-carbon">
            Student Directory
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary">
            Showing <strong className="font-mono text-carbon">{filteredAndSorted.length}</strong> of{' '}
            <strong className="font-mono text-carbon">{evaluations.length}</strong> enrolled student profiles
          </p>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="btn-secondary text-xs py-2"
          >
            <RotateCcw className="w-3.5 h-3.5 text-bluebell" />
            <span>Reset Filters</span>
          </button>
        )}
      </header>

      {/* Table with Single Filter Toolbar */}
      <div className="card-surface overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-border flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap rounded-md p-0.5 bg-subtle border border-stone-border text-xs">
            {(
              [
                { id: 'ALL', label: `All (${countByTier.ALL})` },
                { id: 'HIGH', label: `High Risk (${countByTier.HIGH})` },
                { id: 'MEDIUM', label: `Medium (${countByTier.MEDIUM})` },
                { id: 'LOW', label: `On Track (${countByTier.LOW})` },
                { id: 'INSUFFICIENT_DATA', label: `Incomplete (${countByTier.INSUFFICIENT_DATA})` },
              ] as { id: RiskLevel | 'ALL'; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRiskFilter(tab.id)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  riskFilter === tab.id
                    ? 'bg-imperial text-ghost shadow-card'
                    : 'text-ink-secondary hover:text-carbon'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or ID..."
                className="input-field pl-8 py-1.5 text-xs"
              />
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              aria-label="Filter by Subject"
              className="input-field w-auto py-1.5 text-xs"
            >
              <option value="ALL">All Subjects</option>
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
              className="input-field w-auto py-1.5 text-xs"
            >
              <option value="ALL">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-border bg-subtle/60 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('ROLL')}
                    className="inline-flex items-center gap-1 hover:text-carbon"
                  >
                    ID
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('PRIORITY')}
                    className="inline-flex items-center gap-1 hover:text-carbon"
                  >
                    Standing
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('SCORE')}
                    className="inline-flex items-center gap-1 hover:text-carbon ml-auto"
                  >
                    Score
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('ATTENDANCE')}
                    className="inline-flex items-center gap-1 hover:text-carbon ml-auto"
                  >
                    Attendance
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('TREND')}
                    className="inline-flex items-center gap-1 hover:text-carbon ml-auto"
                  >
                    Velocity
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Primary Factor</th>
                <th className="py-3 px-3">Follow-Up</th>
                <th className="py-3 px-4 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-border text-xs">
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
                    <td className="py-3.5 px-4 font-mono text-xs text-ink-muted whitespace-nowrap">
                      {item.student.rollNumber}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-carbon group-hover:text-imperial transition-colors">
                        {item.student.fullName}
                      </div>
                      <div className="text-[11px] text-ink-muted">
                        Sec {item.student.section} · {item.student.advisorName}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <RiskBadge
                        level={item.riskLevel}
                        size="sm"
                        showIncompleteTag={item.hasIncompleteData}
                      />
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                      {item.overallScorePercentage !== null ? (
                        <div className="inline-flex flex-col items-end gap-1">
                          <span
                            className={`font-semibold ${
                              isScoreLow ? 'text-magenta' : 'text-carbon'
                            }`}
                          >
                            {item.overallScorePercentage}%
                          </span>
                          <div className="w-14 h-1 bg-subtle rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isScoreLow ? 'bg-magenta' : 'bg-bluebell'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(0, item.overallScorePercentage)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-ink-muted">N/A</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
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

                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <TrendDeltaPill delta={item.overallTrendDeltaPoints} />
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      {primaryEvidence ? (
                        <div className="truncate text-ink-secondary">
                          <span className="font-medium text-carbon">
                            {primaryEvidence.headline}
                          </span>
                          <span className="font-mono text-ink-muted ml-1">
                            · {primaryEvidence.metricLabel}
                          </span>
                        </div>
                      ) : (
                        <span className="text-ink-muted">On track</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {latestIntervention ? (
                        <InterventionStatusBadge status={latestIntervention.status} />
                      ) : item.riskLevel === 'HIGH' || item.riskLevel === 'MEDIUM' ? (
                        <span className="text-[11px] font-medium text-status-warning-text">
                          Unassigned
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-muted">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent(item.student.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-bluebell group-hover:text-imperial transition-colors"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredAndSorted.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-xs text-ink-muted">
                    No student records match the selected filters.
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
