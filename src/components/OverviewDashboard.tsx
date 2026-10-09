import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AcademicDataset,
  RiskEvidenceItem,
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

  const subjectBottlenecks = useMemo(() => {
    return dataset.subjects
      .map((subject) => {
        const summaries = evaluations
          .map((ev) => ev.subjectSummaries.find((s) => s.subject.id === subject.id))
          .filter((s): s is NonNullable<typeof s> => Boolean(s));

        const validScores = summaries
          .map((s) => s.weightedScorePercentage)
          .filter((v): v is number => v !== null);
        const avgScore =
          validScores.length > 0
            ? Math.round(
                (validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10
              ) / 10
            : null;

        const validAtt = summaries
          .map((s) => s.attendancePercentage)
          .filter((v): v is number => v !== null);
        const avgAttendance =
          validAtt.length > 0
            ? Math.round((validAtt.reduce((a, b) => a + b, 0) / validAtt.length) * 10) /
              10
            : null;

        const flaggedCount = summaries.filter(
          (s) =>
            s.isFailingScore ||
            s.isCriticalAttendance ||
            s.subjectRiskFlags.length > 0
        ).length;

        return {
          subject,
          avgScore,
          avgAttendance,
          flaggedCount,
        };
      })
      .sort((a, b) => b.flaggedCount - a.flaggedCount);
  }, [dataset.subjects, evaluations]);

  const lowAttendanceStudentsCount = useMemo(
    () =>
      evaluations.filter(
        (e) =>
          e.overallAttendancePercentage !== null &&
          e.overallAttendancePercentage < thresholds.criticalAttendancePct
      ).length,
    [evaluations, thresholds.criticalAttendancePct]
  );

  const unaddressedHighRiskCount = useMemo(
    () =>
      evaluations.filter(
        (e) => e.riskLevel === 'HIGH' && e.activeInterventionsCount === 0
      ).length,
    [evaluations]
  );

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
    <div className="space-y-8 lg:space-y-10">
      {/* 1. Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-border pb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-[28px] lg:text-[30px] font-bold text-carbon tracking-tight">
            Cohort overview
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            B.Tech CS · Semester {dataset.students[0]?.semester ?? 5} · {metrics.totalStudents} students
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenThresholdsModal}
            className="btn-secondary"
          >
            <SlidersHorizontal className="w-4 h-4 text-bluebell" />
            <span>Risk rules</span>
          </button>
          <button
            type="button"
            onClick={onNavigateRecords}
            className="btn-secondary"
          >
            <Upload className="w-4 h-4 text-bluebell" />
            <span>Import CSV</span>
          </button>
          <button
            type="button"
            onClick={onNavigateInterventions}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>New intervention</span>
          </button>
        </div>
      </header>

      {/* 2. Key Metric Cards (4 aligned cards with one clear label, one prominent value, and concise context) */}
      <section
        aria-label="Key Cohort Metrics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        <div className="card-surface p-6 flex flex-col justify-between border-t-2 border-t-magenta">
          <div className="text-sm font-medium text-ink-secondary">
            Students needing attention
          </div>
          <div className="font-display text-3xl font-bold text-carbon tabular-nums my-3">
            {studentsAtRiskCount}
            <span className="text-base font-normal text-ink-muted ml-1.5">
              / {metrics.totalStudents}
            </span>
          </div>
          <div className="text-xs text-ink-secondary tabular-nums">
            <span className="text-magenta font-semibold">{metrics.highRiskCount} high</span>
            {' · '}
            <span>{metrics.mediumRiskCount} medium</span>
            {' · '}
            <span>{metrics.lowRiskCount} on track</span>
          </div>
        </div>

        <div className="card-surface p-6 flex flex-col justify-between border-t-2 border-t-imperial">
          <div className="text-sm font-medium text-ink-secondary">
            Average score
          </div>
          <div className="font-display text-3xl font-bold text-carbon tabular-nums my-3">
            {metrics.cohortAverageScore !== null
              ? `${metrics.cohortAverageScore}%`
              : '—'}
          </div>
          <div className="text-xs text-ink-secondary tabular-nums">
            Pass target {thresholds.passingScorePct}%
          </div>
        </div>

        <div className="card-surface p-6 flex flex-col justify-between border-t-2 border-t-bluebell">
          <div className="text-sm font-medium text-ink-secondary">
            Average attendance
          </div>
          <div className="font-display text-3xl font-bold text-carbon tabular-nums my-3">
            {metrics.cohortAverageAttendance !== null
              ? `${metrics.cohortAverageAttendance}%`
              : '—'}
          </div>
          <div className="text-xs text-ink-secondary tabular-nums">
            {lowAttendanceStudentsCount > 0 ? (
              <span className="text-magenta font-medium">
                {lowAttendanceStudentsCount} below {thresholds.criticalAttendancePct}% target
              </span>
            ) : (
              <span>Target {thresholds.criticalAttendancePct}%</span>
            )}
          </div>
        </div>

        <div className="card-surface p-6 flex flex-col justify-between border-t-2 border-t-imperial">
          <div className="text-sm font-medium text-ink-secondary">
            Active interventions
          </div>
          <div className="font-display text-3xl font-bold text-carbon tabular-nums my-3">
            {pendingInterventions.length}
          </div>
          <div className="text-xs text-ink-secondary tabular-nums">
            {unaddressedHighRiskCount > 0
              ? `${unaddressedHighRiskCount} high-risk unassigned`
              : 'All high-risk assigned'}
          </div>
        </div>
      </section>

      {/* 3. Main Chart & Subject Performance Summary */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Assessment Trend Chart */}
        <div className="lg:col-span-7 card-surface p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <h2 className="font-display text-lg font-semibold text-carbon">
              Assessment trend
            </h2>

            <div className="flex items-center gap-4 text-xs text-ink-secondary">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-imperial inline-block" />
                Cohort average
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-magenta inline-block" />
                High-risk average
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={metrics.assessmentCycleTrend}
                margin={{ top: 10, right: 16, left: -16, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="cohortAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3E92CC" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#3E92CC" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E2E7" vertical={false} />
                <XAxis
                  dataKey="cycleLabel"
                  tick={{ fontSize: 12, fill: '#57534E' }}
                  axisLine={{ stroke: '#E5E2E7' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[25, 95]}
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
                    boxShadow: '0 10px 24px -4px rgba(10, 36, 99, 0.12)',
                  }}
                />
                <ReferenceLine
                  y={thresholds.passingScorePct}
                  stroke="#3E92CC"
                  strokeDasharray="4 4"
                  label={{
                    value: `Target ${thresholds.passingScorePct}%`,
                    position: 'insideBottomRight',
                    fill: '#3E92CC',
                    fontSize: 11,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cohortAvgPct"
                  fill="url(#cohortAreaGrad)"
                  stroke="none"
                />
                <Line
                  type="monotone"
                  dataKey="cohortAvgPct"
                  name="Cohort average (%)"
                  stroke="#0A2463"
                  strokeWidth={2.25}
                  dot={{ r: 4, fill: '#0A2463', stroke: '#FFFAFF', strokeWidth: 1.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="highRiskAvgPct"
                  name="High-risk average (%)"
                  stroke="#D8315B"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={{ r: 4, fill: '#D8315B', stroke: '#FFFAFF', strokeWidth: 1.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right (5 cols): Subject Overview */}
        <div className="lg:col-span-5 card-surface p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-5">
              <h2 className="font-display text-lg font-semibold text-carbon">
                Subject performance
              </h2>
              {subjectFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSubjectFilter('ALL')}
                  className="text-xs font-medium text-bluebell hover:text-imperial"
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="space-y-3">
              {subjectBottlenecks.map(
                ({ subject, avgScore, avgAttendance, flaggedCount }) => {
                  const isSelected = subjectFilter === subject.id;
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() =>
                        setSubjectFilter((prev) =>
                          prev === subject.id ? 'ALL' : subject.id
                        )
                      }
                      className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-imperial-light border-imperial text-carbon shadow-card'
                          : 'bg-surface border-stone-border hover:border-bluebell-border hover:bg-subtle/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs font-semibold text-imperial shrink-0">
                            {subject.code}
                          </span>
                          <span className="font-medium text-carbon truncate">
                            {subject.name}
                          </span>
                        </div>
                        <span
                          className={`text-xs tabular-nums shrink-0 px-2 py-0.5 rounded-md ${
                            flaggedCount > 0
                              ? 'bg-status-danger-bg text-status-danger-text font-medium'
                              : 'bg-status-info-bg text-imperial'
                          }`}
                        >
                          {flaggedCount > 0 ? `${flaggedCount} flagged` : 'On track'}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-xs text-ink-secondary tabular-nums">
                        <span>
                          Score <strong className="text-carbon">{avgScore ?? '—'}%</strong>
                        </span>
                        <span>
                          Attendance <strong className="text-carbon">{avgAttendance ?? '—'}%</strong>
                        </span>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Students Needing Attention Table */}
      <section className="card-surface overflow-hidden">
        <div className="p-6 border-b border-stone-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-lg font-semibold text-carbon">
              Students needing attention
            </h2>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-subtle border border-stone-border text-imperial font-semibold tabular-nums">
              {attentionStudents.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student..."
                className="input-field pl-9 py-2 text-sm"
              />
            </div>

            <div className="inline-flex p-1 rounded-lg bg-subtle border border-stone-border">
              {(
                [
                  { id: 'ATTENTION', label: 'At risk' },
                  { id: 'HIGH', label: 'High' },
                  { id: 'MEDIUM', label: 'Medium' },
                  { id: 'ALL', label: 'All' },
                ] as { id: AttentionFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRiskFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    riskFilter === tab.id
                      ? 'bg-imperial text-ghost shadow-card'
                      : 'text-ink-secondary hover:text-carbon'
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
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as AttentionSort)}
              aria-label="Sort students"
              className="input-field w-auto py-2 text-sm"
            >
              <option value="PRIORITY">Sort: Priority</option>
              <option value="SCORE_ASC">Sort: Lowest score</option>
              <option value="ATTENDANCE_ASC">Sort: Lowest attendance</option>
              <option value="TREND_DROP">Sort: Score drop</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-border bg-subtle/60 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <th className="py-3.5 px-6">Student</th>
                <th className="py-3.5 px-4">Standing</th>
                <th className="py-3.5 px-4 text-right">Score</th>
                <th className="py-3.5 px-4 text-right">Attendance</th>
                <th className="py-3.5 px-4 text-right">Trend</th>
                <th className="py-3.5 px-6">Key alert</th>
                <th className="py-3.5 px-6 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-border text-sm">
              {attentionStudents.map((item) => {
                const topFactor = item.evidence[0];
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
                    className="hover:bg-bluebell-subtle/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6">
                      <div className="font-semibold text-carbon group-hover:text-imperial transition-colors">
                        {item.student.fullName}
                      </div>
                      <div className="text-xs font-mono text-ink-muted mt-0.5">
                        {item.student.rollNumber} · Sec {item.student.section}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <RiskBadge
                        level={item.riskLevel}
                        size="sm"
                        showIncompleteTag={item.hasIncompleteData}
                      />
                    </td>

                    <td className="py-4 px-4 text-right font-mono tabular-nums">
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

                    <td className="py-4 px-4 text-right font-mono tabular-nums">
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

                    <td className="py-4 px-4 text-right">
                      <TrendDeltaPill delta={item.overallTrendDeltaPoints} />
                    </td>

                    <td className="py-4 px-6 text-ink-secondary">
                      {formatShortIssueLabel(topFactor)}
                    </td>

                    <td className="py-4 px-6 text-right">
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

              {attentionStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-ink-muted">
                    No students match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Scheduled Interventions */}
      <section className="card-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-lg font-semibold text-carbon">
              Scheduled interventions
            </h2>
            <span className="text-xs font-mono text-ink-muted tabular-nums">
              ({pendingInterventions.length})
            </span>
          </div>

          <button
            type="button"
            onClick={onNavigateInterventions}
            className="text-sm font-medium text-bluebell hover:text-imperial inline-flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-stone-border text-sm">
          {pendingInterventions.slice(0, 4).map((intv) => {
            const st = dataset.students.find((s) => s.id === intv.studentId);
            const sub = dataset.subjects.find((s) => s.id === intv.subjectId);
            return (
              <div
                key={intv.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-subtle/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectStudent(intv.studentId)}
                    className="font-semibold text-carbon hover:text-imperial shrink-0 transition-colors"
                  >
                    {st?.fullName ?? intv.studentId}
                  </button>
                  {sub && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-imperial-light border border-imperial-border text-imperial shrink-0">
                      {sub.code}
                    </span>
                  )}
                  <span className="text-ink-secondary truncate">{intv.actionTitle}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-xs text-ink-muted tabular-nums">
                    Due {intv.followUpDate}
                  </span>
                  <InterventionStatusBadge status={intv.status} />
                </div>
              </div>
            );
          })}

          {pendingInterventions.length === 0 && (
            <div className="py-8 text-center text-sm text-ink-muted">
              No pending interventions.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
