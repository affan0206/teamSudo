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

  // Real-data per-subject bottleneck telemetry
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

        const failingCount = summaries.filter((s) => s.isFailingScore).length;

        return {
          subject,
          avgScore,
          avgAttendance,
          flaggedCount,
          failingCount,
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

  const highRiskPct =
    metrics.totalStudents > 0
      ? Math.round((metrics.highRiskCount / metrics.totalStudents) * 100)
      : 0;
  const mediumRiskPct =
    metrics.totalStudents > 0
      ? Math.round((metrics.mediumRiskCount / metrics.totalStudents) * 100)
      : 0;
  const lowRiskPct =
    metrics.totalStudents > 0
      ? Math.max(0, 100 - highRiskPct - mediumRiskPct)
      : 0;

  return (
    <div className="space-y-8">
      {/* 1. Editorial Masthead */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-border pb-5">
        <div className="space-y-1">
          <div className="section-kicker">
            <span>01 // Cohort Intelligence &amp; Triage</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
            Academic Performance Overview
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary">
            B.Tech CS — Semester {dataset.students[0]?.semester ?? 5} · {metrics.totalStudents} enrolled students across {dataset.subjects.length} core subjects
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenThresholdsModal}
            className="btn-secondary text-xs py-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-bluebell" />
            <span>Risk Rules</span>
          </button>
          <button
            type="button"
            onClick={onNavigateRecords}
            className="btn-secondary text-xs py-2"
          >
            <Upload className="w-3.5 h-3.5 text-bluebell" />
            <span>Import Marks</span>
          </button>
          <button
            type="button"
            onClick={onNavigateInterventions}
            className="btn-primary text-xs py-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Intervention</span>
          </button>
        </div>
      </header>

      {/* 2. Asymmetric Telemetry Architecture: Imperial Blue Monolith + 3-Cell Swiss Matrix */}
      <section
        aria-label="Cohort Standing and Key Metrics"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
      >
        {/* Left Anchor (5 cols): Imperial Blue Command Monolith */}
        <div className="lg:col-span-5 monolith-surface swiss-grid-pattern-dark p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-bluebell-border">
                Cohort Risk Spectrum
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/10 text-ghost tabular-nums">
                N = {metrics.totalStudents}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-4 pt-1">
              <div>
                <div className="font-display text-4xl font-bold text-ghost tabular-nums tracking-tight">
                  {studentsAtRiskCount}
                  <span className="text-lg font-normal text-bluebell-border ml-1.5">
                    / {metrics.totalStudents} at risk
                  </span>
                </div>
                <p className="text-xs text-bluebell-border/85 mt-1">
                  {metrics.lowRiskCount} students on track · {metrics.highRiskCount} require immediate academic intervention
                </p>
              </div>
            </div>

            {/* Segmented Risk Distribution Bar */}
            <div className="space-y-2 pt-1">
              <div className="h-2.5 w-full rounded-sm bg-white/12 overflow-hidden flex p-0.5 gap-0.5">
                {metrics.highRiskCount > 0 && (
                  <div
                    style={{
                      width: `${(metrics.highRiskCount / metrics.totalStudents) * 100}%`,
                    }}
                    className="bg-magenta h-full rounded-l-sm transition-all duration-300"
                    title={`High Risk: ${metrics.highRiskCount}`}
                  />
                )}
                {metrics.mediumRiskCount > 0 && (
                  <div
                    style={{
                      width: `${(metrics.mediumRiskCount / metrics.totalStudents) * 100}%`,
                    }}
                    className="bg-status-warning-dot h-full transition-all duration-300"
                    title={`Medium Risk: ${metrics.mediumRiskCount}`}
                  />
                )}
                {metrics.lowRiskCount > 0 && (
                  <div
                    style={{
                      width: `${(metrics.lowRiskCount / metrics.totalStudents) * 100}%`,
                    }}
                    className="bg-bluebell h-full rounded-r-sm transition-all duration-300"
                    title={`On Track: ${metrics.lowRiskCount}`}
                  />
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setRiskFilter((prev) => (prev === 'HIGH' ? 'ATTENTION' : 'HIGH'))
                  }
                  className={`text-left p-2.5 rounded border transition-all ${
                    riskFilter === 'HIGH'
                      ? 'bg-magenta/25 border-magenta text-ghost'
                      : 'bg-white/6 border-white/12 text-ghost hover:bg-white/12'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-bluebell-border">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-magenta" />
                      HIGH
                    </span>
                    <span>{highRiskPct}%</span>
                  </div>
                  <div className="font-display text-lg font-bold tabular-nums mt-1">
                    {metrics.highRiskCount}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setRiskFilter((prev) => (prev === 'MEDIUM' ? 'ATTENTION' : 'MEDIUM'))
                  }
                  className={`text-left p-2.5 rounded border transition-all ${
                    riskFilter === 'MEDIUM'
                      ? 'bg-white/20 border-bluebell text-ghost'
                      : 'bg-white/6 border-white/12 text-ghost hover:bg-white/12'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-bluebell-border">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-status-warning-dot" />
                      MED
                    </span>
                    <span>{mediumRiskPct}%</span>
                  </div>
                  <div className="font-display text-lg font-bold tabular-nums mt-1">
                    {metrics.mediumRiskCount}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setRiskFilter((prev) => (prev === 'ALL' ? 'ATTENTION' : 'ALL'))
                  }
                  className={`text-left p-2.5 rounded border transition-all ${
                    riskFilter === 'ALL'
                      ? 'bg-bluebell/30 border-bluebell text-ghost'
                      : 'bg-white/6 border-white/12 text-ghost hover:bg-white/12'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-bluebell-border">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-bluebell" />
                      LOW
                    </span>
                    <span>{lowRiskPct}%</span>
                  </div>
                  <div className="font-display text-lg font-bold tabular-nums mt-1">
                    {metrics.lowRiskCount}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Swiss Hairline Metric Matrix (7 cols) */}
        <div className="lg:col-span-7 card-surface grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-border overflow-hidden">
          {/* Metric 01: Cohort Mean Score */}
          <div className="p-5 sm:p-6 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                01 // Mean Score
              </div>
              <div className="text-xs font-medium text-ink-secondary">
                Weighted Cohort Average
              </div>
            </div>

            <div className="my-4">
              <div className="font-display text-3xl sm:text-4xl font-bold text-carbon tabular-nums tracking-tight">
                {metrics.cohortAverageScore !== null
                  ? `${metrics.cohortAverageScore}%`
                  : '—'}
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 w-full bg-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-imperial rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, metrics.cohortAverageScore ?? 0))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] text-ink-muted tabular-nums">
                  <span>Pass target {thresholds.passingScorePct}%</span>
                  <span className="text-imperial font-semibold">
                    {metrics.cohortAverageScore !== null
                      ? `+${(metrics.cohortAverageScore - thresholds.passingScorePct).toFixed(1)} pts`
                      : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-ink-secondary border-t border-stone-border pt-2.5">
              Normalized across Quiz 1, Midterm &amp; Assessment 2
            </div>
          </div>

          {/* Metric 02: Attendance Velocity */}
          <div className="p-5 sm:p-6 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                02 // Attendance
              </div>
              <div className="text-xs font-medium text-ink-secondary">
                Cumulative Cohort Rate
              </div>
            </div>

            <div className="my-4">
              <div className="font-display text-3xl sm:text-4xl font-bold text-carbon tabular-nums tracking-tight">
                {metrics.cohortAverageAttendance !== null
                  ? `${metrics.cohortAverageAttendance}%`
                  : '—'}
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 w-full bg-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-bluebell rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, metrics.cohortAverageAttendance ?? 0)
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] text-ink-muted tabular-nums">
                  <span>Floor {thresholds.criticalAttendancePct}%</span>
                  <span
                    className={
                      lowAttendanceStudentsCount > 0
                        ? 'text-magenta font-semibold'
                        : 'text-bluebell font-semibold'
                    }
                  >
                    {lowAttendanceStudentsCount} below floor
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-ink-secondary border-t border-stone-border pt-2.5">
              Warning buffer active below {thresholds.warningAttendancePct}%
            </div>
          </div>

          {/* Metric 03: Priority Intervention Coverage */}
          <div className="p-5 sm:p-6 flex flex-col justify-between bg-subtle/30">
            <div className="space-y-1">
              <div className="font-mono text-[11px] uppercase tracking-wider text-magenta">
                03 // Critical Alert
              </div>
              <div className="text-xs font-medium text-ink-secondary">
                High-Risk Triage Status
              </div>
            </div>

            <div className="my-4">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl sm:text-4xl font-bold text-magenta tabular-nums tracking-tight">
                  {metrics.highRiskCount}
                </span>
                <span className="text-xs font-medium text-ink-secondary">
                  high-risk profiles
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-status-danger-bg border border-status-danger-border text-status-danger-text">
                <span>Active follow-ups</span>
                <span className="font-mono font-semibold tabular-nums">
                  {pendingInterventions.length} open
                </span>
              </div>
            </div>

            <div className="text-[11px] text-ink-secondary border-t border-stone-border pt-2.5 flex items-center justify-between">
              <span>
                {unaddressedHighRiskCount > 0
                  ? `${unaddressedHighRiskCount} high-risk awaiting plan`
                  : 'All high-risk assigned'}
              </span>
              <button
                type="button"
                onClick={onNavigateInterventions}
                className="font-semibold text-bluebell hover:text-imperial inline-flex items-center gap-0.5 transition-colors"
              >
                <span>Queue</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Dual Analytical Canvas: Assessment Trajectory + Course Bottleneck Matrix */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (7 cols): Assessment Cycle Trajectory */}
        <div className="lg:col-span-7 card-surface p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="section-kicker">02 // Temporal Velocity</div>
                <h2 className="font-display text-base font-bold text-carbon mt-0.5">
                  Assessment Cycle Trajectory
                </h2>
              </div>

              <div className="flex items-center gap-4 text-xs text-ink-secondary font-mono">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-imperial inline-block" />
                  Cohort Mean
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-magenta inline-block" />
                  High-Risk Mean
                </span>
              </div>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={metrics.assessmentCycleTrend}
                  margin={{ top: 10, right: 16, left: -16, bottom: 2 }}
                >
                  <defs>
                    <linearGradient id="cohortAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3E92CC" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#3E92CC" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E2E7" vertical={false} />
                  <XAxis
                    dataKey="cycleLabel"
                    tick={{ fontSize: 11, fill: '#57534E', fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={{ stroke: '#E5E2E7' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[25, 95]}
                    tick={{ fontSize: 11, fill: '#78736E', fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFAFF',
                      borderColor: '#0A2463',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#1E1B18',
                      boxShadow: '0 10px 24px -4px rgba(10, 36, 99, 0.14)',
                    }}
                  />
                  <ReferenceLine
                    y={thresholds.passingScorePct}
                    stroke="#3E92CC"
                    strokeDasharray="4 4"
                    label={{
                      value: `Pass ${thresholds.passingScorePct}%`,
                      position: 'insideBottomRight',
                      fill: '#3E92CC',
                      fontSize: 10,
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
                    name="Cohort Avg (%)"
                    stroke="#0A2463"
                    strokeWidth={2.25}
                    dot={{ r: 4, fill: '#0A2463', stroke: '#FFFAFF', strokeWidth: 1.5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="highRiskAvgPct"
                    name="High-Risk Avg (%)"
                    stroke="#D8315B"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={{ r: 4, fill: '#D8315B', stroke: '#FFFAFF', strokeWidth: 1.5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cycle-by-cycle tabular summary strip */}
          <div className="grid grid-cols-3 border-t border-stone-border pt-3 mt-3 gap-3 text-xs">
            {metrics.assessmentCycleTrend.map((cycle) => (
              <div key={cycle.cycleLabel} className="flex items-center justify-between px-2 py-1 rounded bg-subtle/50">
                <span className="text-ink-secondary font-medium">{cycle.cycleLabel}</span>
                <span className="font-mono tabular-nums">
                  <strong className="text-imperial">{cycle.cohortAvgPct ?? '—'}%</strong>
                  <span className="text-ink-muted mx-1">/</span>
                  <span className="text-magenta font-semibold">
                    {cycle.highRiskAvgPct ?? '—'}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right (5 cols): Subject Risk Density & Bottleneck Matrix */}
        <div className="lg:col-span-5 card-surface p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <div className="section-kicker">03 // Course Telemetry</div>
                <h2 className="font-display text-base font-bold text-carbon mt-0.5">
                  Subject Risk Density
                </h2>
              </div>
              {subjectFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSubjectFilter('ALL')}
                  className="text-xs font-mono text-bluebell hover:text-imperial"
                >
                  Clear filter
                </button>
              )}
            </div>
            <p className="text-xs text-ink-secondary mb-4">
              Select any course to filter the attention table by students struggling in that subject.
            </p>

            <div className="space-y-2.5">
              {subjectBottlenecks.map(
                ({ subject, avgScore, avgAttendance, flaggedCount, failingCount }) => {
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
                      className={`w-full text-left p-2.5 rounded-md border transition-all ${
                        isSelected
                          ? 'bg-imperial-light border-imperial text-carbon shadow-card'
                          : 'bg-surface border-stone-border hover:border-bluebell-border hover:bg-subtle/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-imperial text-ghost shrink-0">
                            {subject.code}
                          </span>
                          <span className="font-semibold text-carbon truncate">
                            {subject.name}
                          </span>
                        </div>
                        <span
                          className={`font-mono text-[11px] tabular-nums shrink-0 px-1.5 py-0.5 rounded ${
                            flaggedCount > 0
                              ? 'bg-status-danger-bg text-status-danger-text font-semibold'
                              : 'bg-status-info-bg text-imperial'
                          }`}
                        >
                          {flaggedCount} flagged
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-4 text-[11px] text-ink-secondary font-mono tabular-nums">
                        <div className="flex items-center gap-3">
                          <span>
                            Mean: <strong className="text-carbon">{avgScore ?? '—'}%</strong>
                          </span>
                          <span>
                            Att: <strong className="text-carbon">{avgAttendance ?? '—'}%</strong>
                          </span>
                        </div>
                        {failingCount > 0 ? (
                          <span className="text-magenta font-medium">
                            {failingCount} below {subject.passPercentage}%
                          </span>
                        ) : (
                          <span className="text-bluebell">All passing</span>
                        )}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Priority Triage Ledger (Students Requiring Attention) */}
      <section className="card-surface overflow-hidden">
        <div className="p-5 border-b border-stone-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="section-kicker">04 // Priority Triage Ledger</div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h2 className="font-display text-base font-bold text-carbon">
                Students Requiring Attention
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-subtle border border-stone-border text-imperial font-semibold tabular-nums">
                {attentionStudents.length}
              </span>
            </div>
          </div>

          {/* Single Unified Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or ID..."
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
              <tr className="border-b border-stone-border bg-subtle/60 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-3">Standing</th>
                <th className="py-3 px-3 text-right">Score</th>
                <th className="py-3 px-3 text-right">Attendance</th>
                <th className="py-3 px-3 text-right">Velocity</th>
                <th className="py-3 px-4">Primary Risk Evidence</th>
                <th className="py-3 px-4 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-border text-xs">
              {attentionStudents.map((item, idx) => {
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
                    className="hover:bg-bluebell-subtle/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono text-[11px] text-ink-muted tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-carbon group-hover:text-imperial transition-colors">
                        {item.student.fullName}
                      </div>
                      <div className="text-[11px] font-mono text-ink-muted">
                        {item.student.rollNumber} · Sec {item.student.section}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <RiskBadge
                        level={item.riskLevel}
                        size="sm"
                        showIncompleteTag={item.hasIncompleteData}
                      />
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                      {item.overallScorePercentage !== null ? (
                        <div className="inline-flex flex-col items-end gap-1">
                          <span
                            className={`font-semibold ${
                              isScoreLow ? 'text-magenta' : 'text-carbon'
                            }`}
                          >
                            {item.overallScorePercentage}%
                          </span>
                          <div className="w-16 h-1 bg-subtle rounded-full overflow-hidden">
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

                    <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                      {item.overallAttendancePercentage !== null ? (
                        <div>
                          <span
                            className={`font-semibold ${
                              isAttLow ? 'text-magenta' : 'text-carbon'
                            }`}
                          >
                            {item.overallAttendancePercentage}%
                          </span>
                          <div className="text-[10px] text-ink-muted">
                            {item.totalClassesAttended}/{item.totalClassesHeld}
                          </div>
                        </div>
                      ) : (
                        <span className="text-ink-muted">N/A</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <TrendDeltaPill delta={item.overallTrendDeltaPoints} />
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      {topFactor ? (
                        <div className="truncate text-ink-secondary">
                          <span className="font-medium text-carbon">
                            {topFactor.headline}
                          </span>
                          <span className="text-ink-muted font-mono ml-1.5">
                            · {topFactor.metricLabel}
                          </span>
                        </div>
                      ) : (
                        <span className="text-ink-muted">All courses meeting targets</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
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

              {attentionStudents.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-ink-muted">
                    No student records match the active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Compact List of Pending Interventions */}
      <section className="card-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-border flex items-center justify-between">
          <div>
            <div className="section-kicker">05 // Advisory Operations</div>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="font-display text-sm font-bold text-carbon">
                Scheduled Faculty Interventions
              </h2>
              <span className="text-xs font-mono text-ink-muted tabular-nums">
                ({pendingInterventions.length})
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateInterventions}
            className="text-xs font-semibold text-bluebell hover:text-imperial inline-flex items-center gap-1 transition-colors"
          >
            <span>Open Intervention Tracker</span>
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
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-subtle/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectStudent(intv.studentId)}
                    className="font-semibold text-carbon hover:text-imperial shrink-0 transition-colors"
                  >
                    {st?.fullName ?? intv.studentId}
                  </button>
                  {sub && (
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-imperial-light border border-imperial-border text-imperial shrink-0">
                      {sub.code}
                    </span>
                  )}
                  <span className="text-ink-secondary truncate">{intv.actionTitle}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[11px] text-ink-muted tabular-nums">
                    Follow-up {intv.followUpDate}
                  </span>
                  <InterventionStatusBadge status={intv.status} />
                </div>
              </div>
            );
          })}

          {pendingInterventions.length === 0 && (
            <div className="py-6 text-center text-xs text-ink-muted">
              No pending interventions scheduled.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
