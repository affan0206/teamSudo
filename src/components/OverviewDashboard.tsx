import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import {
  CartesianGrid,
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
  RiskLevel,
  RiskThresholds,
  StudentAcademicEvaluation,
} from '../types/academic';
import { computeCohortOverviewMetrics } from '../services/riskEngine';
import {
  InterventionStatusBadge,
  RiskBadge,
  TrendDeltaPill,
} from './StatusBadges';

interface OverviewDashboardProps {
  dataset: AcademicDataset;
  evaluations: StudentAcademicEvaluation[];
  thresholds: RiskThresholds;
  onSelectStudent: (studentId: string) => void;
  onNavigateDirectoryWithFilter: (riskFilter: RiskLevel | 'ALL') => void;
  onNavigateInterventions: () => void;
  onNavigateRecords: () => void;
  onOpenThresholdsModal: () => void;
}

type AttentionFilter = 'ATTENTION' | 'HIGH' | 'MEDIUM' | 'ALL';
type AttentionSort = 'PRIORITY' | 'SCORE_ASC' | 'ATTENDANCE_ASC' | 'TREND_DROP';

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  dataset,
  evaluations,
  thresholds,
  onSelectStudent,
  onNavigateInterventions,
  onNavigateRecords,
  onOpenThresholdsModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<AttentionFilter>('ATTENTION');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<AttentionSort>('PRIORITY');

  const metrics = useMemo(
    () => computeCohortOverviewMetrics(dataset, evaluations),
    [dataset, evaluations]
  );

  const studentsAtRiskCount = metrics.highRiskCount + metrics.mediumRiskCount;

  const attentionStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = evaluations.filter((item) => {
      if (riskFilter === 'ATTENTION') {
        if (item.riskLevel !== 'HIGH' && item.riskLevel !== 'MEDIUM') return false;
      } else if (riskFilter !== 'ALL') {
        if (item.riskLevel !== riskFilter) return false;
      }

      if (subjectFilter !== 'ALL') {
        const sub = item.subjectSummaries.find((s) => s.subject.id === subjectFilter);
        if (!sub || sub.subjectRiskFlags.length === 0) return false;
      }

      if (q) {
        const matchName = item.student.fullName.toLowerCase().includes(q);
        const matchRoll = item.student.rollNumber.toLowerCase().includes(q);
        if (!matchName && !matchRoll) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'PRIORITY') return b.priorityScore - a.priorityScore;
      if (sortBy === 'SCORE_ASC') {
        return (a.overallScorePercentage ?? 999) - (b.overallScorePercentage ?? 999);
      }
      if (sortBy === 'ATTENDANCE_ASC') {
        return (
          (a.overallAttendancePercentage ?? 999) -
          (b.overallAttendancePercentage ?? 999)
        );
      }
      if (sortBy === 'TREND_DROP') {
        return (a.overallTrendDeltaPoints ?? 999) - (b.overallTrendDeltaPoints ?? 999);
      }
      return 0;
    });
  }, [evaluations, searchQuery, riskFilter, subjectFilter, sortBy]);

  const pendingInterventions = useMemo(
    () =>
      dataset.interventions.filter(
        (i) => i.status === 'PLANNED' || i.status === 'IN_PROGRESS'
      ),
    [dataset.interventions]
  );

  return (
    <div className="space-y-6">
      {/* 1. Page Title and Short Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-border pb-4">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary tracking-tight">
            Academic Overview
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Semester 4 · Computer Science &amp; Engineering
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenThresholdsModal}
            className="btn-secondary text-xs py-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-ink-muted" />
            <span>Risk Rules</span>
          </button>
          <button
            type="button"
            onClick={onNavigateRecords}
            className="btn-secondary text-xs py-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-forest" />
            <span>Import Marks</span>
          </button>
          <button
            type="button"
            onClick={onNavigateInterventions}
            className="btn-primary text-xs py-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Intervention</span>
          </button>
        </div>
      </div>

      {/* 2. Four Compact Metric Cards */}
      <section
        aria-label="Key Academic Metrics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="card-surface p-4">
          <div className="text-xs font-medium text-ink-secondary">Total Students</div>
          <div className="text-2xl font-semibold text-ink-primary tabular-nums mt-1">
            {metrics.totalStudents}
          </div>
          <div className="text-[11px] text-ink-muted mt-1">Active cohort</div>
        </div>

        <div className="card-surface p-4">
          <div className="text-xs font-medium text-ink-secondary">Average Score</div>
          <div className="text-2xl font-semibold text-ink-primary tabular-nums mt-1">
            {metrics.cohortAverageScore !== null ? `${metrics.cohortAverageScore}%` : '—'}
          </div>
          <div className="text-[11px] text-ink-muted tabular-nums mt-1">
            Pass target {thresholds.passingScorePct}%
          </div>
        </div>

        <div className="card-surface p-4">
          <div className="text-xs font-medium text-ink-secondary">Average Attendance</div>
          <div className="text-2xl font-semibold text-ink-primary tabular-nums mt-1">
            {metrics.cohortAverageAttendance !== null
              ? `${metrics.cohortAverageAttendance}%`
              : '—'}
          </div>
          <div className="text-[11px] text-ink-muted tabular-nums mt-1">
            Target {thresholds.criticalAttendancePct}%
          </div>
        </div>

        <div className="card-surface p-4">
          <div className="text-xs font-medium text-ink-secondary">Students at Risk</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-semibold text-status-danger-text tabular-nums">
              {studentsAtRiskCount}
            </span>
            <span className="text-xs text-ink-muted tabular-nums">
              ({metrics.highRiskCount} High · {metrics.mediumRiskCount} Med)
            </span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">Require follow-up</div>
        </div>
      </section>

      {/* 3. Small, Useful Performance Chart + Compact Risk Distribution */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 card-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-ink-primary">
                Performance Trajectory
              </h2>
              <p className="text-xs text-ink-muted">
                Normalized score progression across assessment cycles
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-secondary">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-forest inline-block" />
                Cohort Avg
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-status-danger-dot inline-block" />
                High-Risk Avg
              </span>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={metrics.assessmentCycleTrend}
                margin={{ top: 6, right: 16, left: -16, bottom: 2 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E8E2" vertical={false} />
                <XAxis
                  dataKey="cycleLabel"
                  tick={{ fontSize: 11, fill: '#5A625C' }}
                  axisLine={{ stroke: '#E6E8E2' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[25, 95]}
                  tick={{ fontSize: 11, fill: '#747A74' }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E6E8E2',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine
                  y={thresholds.passingScorePct}
                  stroke="#C8811A"
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="cohortAvgPct"
                  name="Cohort Avg (%)"
                  stroke="#285C46"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#285C46', strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="highRiskAvgPct"
                  name="High-Risk Avg (%)"
                  stroke="#C93B3B"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={{ r: 3.5, fill: '#C93B3B', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 card-surface p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink-primary">Risk Breakdown</h2>
            <p className="text-xs text-ink-muted mt-0.5">Select a tier to filter the table</p>

            <div className="h-2 w-full rounded-full bg-subtle overflow-hidden flex mt-3 mb-4">
              <div
                style={{
                  width: `${(metrics.highRiskCount / metrics.totalStudents) * 100}%`,
                }}
                className="bg-status-danger-dot h-full"
              />
              <div
                style={{
                  width: `${(metrics.mediumRiskCount / metrics.totalStudents) * 100}%`,
                }}
                className="bg-status-warning-dot h-full"
              />
              <div
                style={{
                  width: `${(metrics.lowRiskCount / metrics.totalStudents) * 100}%`,
                }}
                className="bg-status-success-dot h-full"
              />
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() =>
                  setRiskFilter((prev) => (prev === 'HIGH' ? 'ATTENTION' : 'HIGH'))
                }
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md border text-xs transition-colors ${
                  riskFilter === 'HIGH'
                    ? 'bg-status-danger-bg border-status-danger-border text-status-danger-text font-semibold'
                    : 'bg-surface border-stone-border text-ink-primary hover:bg-subtle/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-danger-dot" />
                  High Risk
                </span>
                <span className="font-mono tabular-nums">{metrics.highRiskCount}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setRiskFilter((prev) => (prev === 'MEDIUM' ? 'ATTENTION' : 'MEDIUM'))
                }
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md border text-xs transition-colors ${
                  riskFilter === 'MEDIUM'
                    ? 'bg-status-warning-bg border-status-warning-border text-status-warning-text font-semibold'
                    : 'bg-surface border-stone-border text-ink-primary hover:bg-subtle/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-warning-dot" />
                  Medium Risk
                </span>
                <span className="font-mono tabular-nums">{metrics.mediumRiskCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setRiskFilter('ALL')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md border text-xs transition-colors ${
                  riskFilter === 'ALL'
                    ? 'bg-forest-light border-forest-border text-forest font-semibold'
                    : 'bg-surface border-stone-border text-ink-primary hover:bg-subtle/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-success-dot" />
                  On Track (Low Risk)
                </span>
                <span className="font-mono tabular-nums">{metrics.lowRiskCount}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Clean Table of Students Requiring Attention (Single Toolbar) */}
      <section className="card-surface overflow-hidden">
        <div className="p-4 border-b border-stone-border flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-ink-primary">
              Students Requiring Attention
            </h2>
            <span className="text-xs font-mono text-ink-muted tabular-nums">
              ({attentionStudents.length})
            </span>
          </div>

          {/* Single Unified Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student..."
                className="input-field pl-8 py-1.5 text-xs"
              />
            </div>

            <div className="inline-flex p-0.5 rounded-md bg-subtle border border-stone-border">
              {(
                [
                  { id: 'ATTENTION', label: 'At Risk' },
                  { id: 'HIGH', label: 'High' },
                  { id: 'MEDIUM', label: 'Medium' },
                  { id: 'ALL', label: 'All' },
                ] as { id: AttentionFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRiskFilter(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    riskFilter === tab.id
                      ? 'bg-surface text-ink-primary shadow-card'
                      : 'text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              aria-label="Filter by subject"
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
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as AttentionSort)}
              aria-label="Sort students"
              className="input-field w-auto py-1.5 text-xs"
            >
              <option value="PRIORITY">Sort: Priority</option>
              <option value="SCORE_ASC">Sort: Lowest Score</option>
              <option value="ATTENDANCE_ASC">Sort: Lowest Attendance</option>
              <option value="TREND_DROP">Sort: Steepest Drop</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-border bg-subtle/60 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <th className="py-2.5 px-4">Student</th>
                <th className="py-2.5 px-3">Risk</th>
                <th className="py-2.5 px-3 text-right">Score</th>
                <th className="py-2.5 px-3 text-right">Attendance</th>
                <th className="py-2.5 px-3 text-right">Trend</th>
                <th className="py-2.5 px-4">Primary Factor</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-border text-xs">
              {attentionStudents.map((item) => {
                const topFactor = item.evidence[0];
                return (
                  <tr
                    key={item.student.id}
                    onClick={() => onSelectStudent(item.student.id)}
                    className="hover:bg-subtle/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink-primary group-hover:text-forest transition-colors">
                        {item.student.fullName}
                      </div>
                      <div className="text-[11px] font-mono text-ink-muted">
                        {item.student.rollNumber}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <RiskBadge
                        level={item.riskLevel}
                        size="sm"
                        showIncompleteTag={item.hasIncompleteData}
                      />
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {item.overallScorePercentage !== null ? (
                        <span
                          className={`font-semibold ${
                            item.overallScorePercentage < thresholds.passingScorePct
                              ? 'text-status-danger-text'
                              : 'text-ink-primary'
                          }`}
                        >
                          {item.overallScorePercentage}%
                        </span>
                      ) : (
                        <span className="text-ink-muted">N/A</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {item.overallAttendancePercentage !== null ? (
                        <span
                          className={`font-semibold ${
                            item.overallAttendancePercentage <
                            thresholds.criticalAttendancePct
                              ? 'text-status-danger-text'
                              : 'text-ink-primary'
                          }`}
                        >
                          {item.overallAttendancePercentage}%
                        </span>
                      ) : (
                        <span className="text-ink-muted">N/A</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <TrendDeltaPill delta={item.overallTrendDeltaPoints} />
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      {topFactor ? (
                        <div className="truncate text-ink-secondary">
                          <span className="font-medium text-ink-primary">
                            {topFactor.headline}
                          </span>
                          <span className="text-ink-muted font-mono ml-1.5">
                            · {topFactor.metricLabel}
                          </span>
                        </div>
                      ) : (
                        <span className="text-ink-muted">On track</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent(item.student.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-forest hover:text-forest-hover"
                      >
                        <span>View</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {attentionStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-ink-muted">
                    No students match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Compact List of Pending Interventions */}
      <section className="card-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-ink-primary">
              Pending Interventions
            </h2>
            <span className="text-xs font-mono text-ink-muted tabular-nums">
              ({pendingInterventions.length})
            </span>
          </div>

          <button
            type="button"
            onClick={onNavigateInterventions}
            className="text-xs font-medium text-forest hover:text-forest-hover inline-flex items-center gap-1"
          >
            <span>Manage All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-stone-border text-xs">
          {pendingInterventions.slice(0, 5).map((intv) => {
            const st = dataset.students.find((s) => s.id === intv.studentId);
            const sub = dataset.subjects.find((s) => s.id === intv.subjectId);
            return (
              <div
                key={intv.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-subtle/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectStudent(intv.studentId)}
                    className="font-semibold text-ink-primary hover:text-forest shrink-0"
                  >
                    {st?.fullName ?? intv.studentId}
                  </button>
                  {sub && (
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-subtle border border-stone-border text-ink-secondary shrink-0">
                      {sub.code}
                    </span>
                  )}
                  <span className="text-ink-secondary truncate">{intv.actionTitle}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-ink-muted tabular-nums">
                    Due {intv.followUpDate}
                  </span>
                  <InterventionStatusBadge status={intv.status} />
                </div>
              </div>
            );
          })}

          {pendingInterventions.length === 0 && (
            <div className="py-6 text-center text-xs text-ink-muted">
              No pending interventions.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
