import {
  AcademicDataset,
  ActionRecommendation,
  AssessmentBreakdownItem,
  RiskEvidenceItem,
  RiskLevel,
  RiskThresholds,
  Student,
  StudentAcademicEvaluation,
  SubjectPerformanceSummary,
} from '../types/academic';
import { DEFAULT_RISK_THRESHOLDS } from '../data/syntheticCohort';

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Calculates how many consecutive classes a student must attend to reach targetPct.
 */
export function calculateClassesNeededForThreshold(
  attended: number,
  held: number,
  targetPct: number
): number {
  if (held <= 0) return 0;
  const targetRatio = Math.min(0.99, Math.max(0.01, targetPct / 100));
  const currentRatio = attended / held;
  if (currentRatio >= targetRatio) return 0;
  const needed = Math.ceil((targetRatio * held - attended) / (1 - targetRatio));
  return Math.max(0, needed);
}

/**
 * Calculates how many future classes a student could miss while still staying >= targetPct.
 */
export function calculateAttendanceBufferClasses(
  attended: number,
  held: number,
  targetPct: number
): number {
  if (held <= 0) return 0;
  const targetRatio = Math.min(0.99, Math.max(0.01, targetPct / 100));
  const currentRatio = attended / held;
  if (currentRatio < targetRatio) return 0;
  const buffer = Math.floor(attended / targetRatio - held);
  return Math.max(0, buffer);
}

export function evaluateStudentAcademicStanding(
  student: Student,
  dataset: AcademicDataset,
  thresholds: RiskThresholds = DEFAULT_RISK_THRESHOLDS
): StudentAcademicEvaluation {
  const { subjects, assessments, scores, attendance, interventions } = dataset;

  const studentScores = scores.filter((s) => s.studentId === student.id);
  const studentAttendance = attendance.filter((a) => a.studentId === student.id);
  const studentInterventions = interventions
    .filter((i) => i.studentId === student.id)
    .sort((a, b) => b.createdDate.localeCompare(a.createdDate));

  let totalClassesAttended = 0;
  let totalClassesHeld = 0;
  let totalExpectedAssessments = 0;
  let totalMissingAssessments = 0;

  const subjectSummaries: SubjectPerformanceSummary[] = subjects.map((subject) => {
    const subAssessments = assessments
      .filter((a) => a.subjectId === subject.id)
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    const attRecord = studentAttendance.find((a) => a.subjectId === subject.id);
    const classesAttended = attRecord ? attRecord.classesAttended : null;
    const classesHeld = attRecord ? attRecord.classesHeld : null;

    if (classesAttended !== null && classesHeld !== null && classesHeld > 0) {
      totalClassesAttended += classesAttended;
      totalClassesHeld += classesHeld;
    }

    const attendancePercentage =
      classesAttended !== null && classesHeld !== null && classesHeld > 0
        ? round1((classesAttended / classesHeld) * 100)
        : null;

    const classesNeededForMinAttendance =
      classesAttended !== null && classesHeld !== null
        ? calculateClassesNeededForThreshold(
            classesAttended,
            classesHeld,
            thresholds.criticalAttendancePct
          )
        : 0;

    const canSkipClassesStayingAboveMin =
      classesAttended !== null && classesHeld !== null
        ? calculateAttendanceBufferClasses(
            classesAttended,
            classesHeld,
            thresholds.criticalAttendancePct
          )
        : 0;

    // Normalize each assessment score individually (never sum raw marks across incompatible maxMarks)
    const breakdown: AssessmentBreakdownItem[] = subAssessments.map((asmt) => {
      totalExpectedAssessments += 1;
      const scoreRec = studentScores.find((s) => s.assessmentId === asmt.id);
      const marks =
        scoreRec && scoreRec.marksObtained !== null && scoreRec.marksObtained !== undefined
          ? scoreRec.marksObtained
          : null;

      if (marks === null) {
        totalMissingAssessments += 1;
      }

      const normalizedPercentage =
        marks !== null && asmt.maxMarks > 0 ? round1((marks / asmt.maxMarks) * 100) : null;

      return {
        assessment: asmt,
        marksObtained: marks,
        status: scoreRec ? scoreRec.status : 'MISSING',
        normalizedPercentage,
      };
    });

    const gradedItems = breakdown.filter((b) => b.normalizedPercentage !== null);
    const gradedAssessmentsCount = gradedItems.length;
    const totalAssessmentsCount = breakdown.length;
    const missingAssessmentsCount = totalAssessmentsCount - gradedAssessmentsCount;

    let weightedScorePercentage: number | null = null;
    if (gradedItems.length > 0) {
      const weightedSum = gradedItems.reduce(
        (acc, item) => acc + (item.normalizedPercentage as number) * item.assessment.weightage,
        0
      );
      const totalWeight = gradedItems.reduce((acc, item) => acc + item.assessment.weightage, 0);
      weightedScorePercentage = totalWeight > 0 ? round1(weightedSum / totalWeight) : null;
    }

    // Chronological trend delta between two most recent graded assessments in this subject
    let latestAssessmentPercentage: number | null = null;
    let previousAssessmentPercentage: number | null = null;
    let trendDeltaPoints: number | null = null;

    if (gradedItems.length >= 1) {
      latestAssessmentPercentage = gradedItems[gradedItems.length - 1].normalizedPercentage;
    }
    if (gradedItems.length >= 2) {
      previousAssessmentPercentage = gradedItems[gradedItems.length - 2].normalizedPercentage;
      if (latestAssessmentPercentage !== null && previousAssessmentPercentage !== null) {
        trendDeltaPoints = round1(latestAssessmentPercentage - previousAssessmentPercentage);
      }
    }

    const isFailingScore =
      weightedScorePercentage !== null && weightedScorePercentage < thresholds.passingScorePct;
    const isBorderlineScore =
      weightedScorePercentage !== null &&
      weightedScorePercentage >= thresholds.passingScorePct &&
      weightedScorePercentage < thresholds.borderlineScorePct;
    const isCriticalAttendance =
      attendancePercentage !== null && attendancePercentage < thresholds.criticalAttendancePct;
    const isWarningAttendance =
      attendancePercentage !== null &&
      attendancePercentage >= thresholds.criticalAttendancePct &&
      attendancePercentage < thresholds.warningAttendancePct;

    const subjectRiskFlags: string[] = [];
    if (isCriticalAttendance) {
      subjectRiskFlags.push(`Attendance ${attendancePercentage}% (<${thresholds.criticalAttendancePct}%)`);
    } else if (isWarningAttendance) {
      subjectRiskFlags.push(`Attendance ${attendancePercentage}% (Borderline)`);
    }
    if (isFailingScore) {
      subjectRiskFlags.push(`Failing Score ${weightedScorePercentage}% (<${thresholds.passingScorePct}%)`);
    } else if (isBorderlineScore) {
      subjectRiskFlags.push(`Borderline Score ${weightedScorePercentage}%`);
    }
    if (trendDeltaPoints !== null && trendDeltaPoints <= -thresholds.severeDropPoints) {
      subjectRiskFlags.push(`Severe Drop ${trendDeltaPoints} pts`);
    } else if (trendDeltaPoints !== null && trendDeltaPoints <= -thresholds.moderateDropPoints) {
      subjectRiskFlags.push(`Declining Trend ${trendDeltaPoints} pts`);
    }
    if (missingAssessmentsCount > 0) {
      subjectRiskFlags.push(`${missingAssessmentsCount} Missing Assessment(s)`);
    }

    return {
      subject,
      classesAttended,
      classesHeld,
      attendancePercentage,
      classesNeededForMinAttendance,
      canSkipClassesStayingAboveMin,
      weightedScorePercentage,
      latestAssessmentPercentage,
      previousAssessmentPercentage,
      trendDeltaPoints,
      gradedAssessmentsCount,
      totalAssessmentsCount,
      missingAssessmentsCount,
      assessments: breakdown,
      subjectRiskFlags,
      isFailingScore,
      isBorderlineScore,
      isCriticalAttendance,
      isWarningAttendance,
    };
  });

  // Aggregate student-level metrics from valid (non-null) subject summaries
  const subjectsWithScores = subjectSummaries.filter((s) => s.weightedScorePercentage !== null);
  const overallScorePercentage =
    subjectsWithScores.length > 0
      ? round1(
          subjectsWithScores.reduce((acc, s) => acc + (s.weightedScorePercentage as number), 0) /
            subjectsWithScores.length
        )
      : null;

  const overallAttendancePercentage =
    totalClassesHeld > 0 ? round1((totalClassesAttended / totalClassesHeld) * 100) : null;

  const subjectsWithTrends = subjectSummaries.filter((s) => s.trendDeltaPoints !== null);
  const overallTrendDeltaPoints =
    subjectsWithTrends.length > 0
      ? round1(
          subjectsWithTrends.reduce((acc, s) => acc + (s.trendDeltaPoints as number), 0) /
            subjectsWithTrends.length
        )
      : null;

  const failingSubjects = subjectSummaries.filter((s) => s.isFailingScore);
  const borderlineSubjects = subjectSummaries.filter((s) => s.isBorderlineScore);
  const criticalAttendanceSubjects = subjectSummaries.filter((s) => s.isCriticalAttendance);
  const warningAttendanceSubjects = subjectSummaries.filter((s) => s.isWarningAttendance);
  const missingDataSubjects = subjectSummaries.filter((s) => s.missingAssessmentsCount > 0);

  const missingDataSummary: string[] = [];
  missingDataSubjects.forEach((s) => {
    const missingTitles = s.assessments
      .filter((a) => a.marksObtained === null)
      .map((a) => a.assessment.title.split(':')[0]);
    missingDataSummary.push(`${s.subject.code}: Missing ${missingTitles.join(', ')}`);
  });

  const hasIncompleteData = totalMissingAssessments > 0 || totalClassesHeld === 0;
  const isMajorityDataMissing =
    totalExpectedAssessments > 0 && totalMissingAssessments / totalExpectedAssessments >= 0.45;

  // Build explainable evidence items & recommendations
  const evidence: RiskEvidenceItem[] = [];
  const recommendations: ActionRecommendation[] = [];

  // 1. Attendance Rules Evaluation
  if (
    (overallAttendancePercentage !== null &&
      overallAttendancePercentage < thresholds.criticalAttendancePct) ||
    criticalAttendanceSubjects.length >= 2
  ) {
    const codes = criticalAttendanceSubjects.map((s) => `${s.subject.code} (${s.attendancePercentage}%)`).join(', ');
    evidence.push({
      id: `ev-${student.id}-att-crit`,
      category: 'ATTENDANCE_CRITICAL',
      severity: 'HIGH',
      headline: `Critical Attendance Shortage (${overallAttendancePercentage ?? 'N/A'}% overall)`,
      detail: `Attendance is below the ${thresholds.criticalAttendancePct}% minimum requirement in ${criticalAttendanceSubjects.length} subject(s): ${codes}. (${totalClassesAttended}/${totalClassesHeld} total classes attended).`,
      metricLabel: `${overallAttendancePercentage}% Attendance`,
    });

    const worstAttSubject = [...criticalAttendanceSubjects].sort(
      (a, b) => (a.attendancePercentage ?? 100) - (b.attendancePercentage ?? 100)
    )[0];

    recommendations.push({
      id: `rec-${student.id}-att-crit`,
      category: 'ATTENDANCE_CRITICAL',
      priority: 'URGENT',
      subjectId: worstAttSubject ? worstAttSubject.subject.id : null,
      subjectCode: worstAttSubject?.subject.code,
      title: 'Schedule Faculty Attendance Check-in & Recovery Plan',
      facultyAction: `Conduct a supportive 1-on-1 check-in to identify attendance barriers across ${criticalAttendanceSubjects.map((s) => s.subject.code).join(', ')}. Establish weekly attendance tracking before exam eligibility cutoffs.`,
      studentGuidance: worstAttSubject
        ? `Prioritize attending all upcoming sessions. In ${worstAttSubject.subject.code}, attending the next ${worstAttSubject.classesNeededForMinAttendance} consecutive classes will restore your attendance to ${thresholds.criticalAttendancePct}%.`
        : `Attend all scheduled lectures over the next 3 weeks to restore your cumulative attendance above ${thresholds.criticalAttendancePct}%.`,
      suggestedFollowUpDays: 7,
    });
  } else if (
    criticalAttendanceSubjects.length === 1 ||
    (overallAttendancePercentage !== null &&
      overallAttendancePercentage < thresholds.warningAttendancePct)
  ) {
    const targetSub = criticalAttendanceSubjects[0] || warningAttendanceSubjects[0];
    evidence.push({
      id: `ev-${student.id}-att-warn`,
      category: 'ATTENDANCE_WARNING',
      severity: 'MEDIUM',
      subjectCode: targetSub?.subject.code,
      subjectName: targetSub?.subject.name,
      headline:
        criticalAttendanceSubjects.length === 1
          ? `Single-Subject Attendance Below ${thresholds.criticalAttendancePct}% in ${criticalAttendanceSubjects[0].subject.code}`
          : `Overall Attendance in Warning Buffer (${overallAttendancePercentage}%)`,
      detail:
        criticalAttendanceSubjects.length === 1
          ? `${criticalAttendanceSubjects[0].subject.name} attendance is ${criticalAttendanceSubjects[0].attendancePercentage}% (${criticalAttendanceSubjects[0].classesAttended}/${criticalAttendanceSubjects[0].classesHeld} classes), while overall attendance is ${overallAttendancePercentage}%.`
          : `Overall attendance is ${overallAttendancePercentage}% (${totalClassesAttended}/${totalClassesHeld} classes), within the ${thresholds.criticalAttendancePct}%–${thresholds.warningAttendancePct}% early-warning buffer.`,
      metricLabel: `${targetSub?.attendancePercentage ?? overallAttendancePercentage}% Attendance`,
    });

    recommendations.push({
      id: `rec-${student.id}-att-warn`,
      category: 'ATTENDANCE_WARNING',
      priority: 'RECOMMENDED',
      subjectId: targetSub ? targetSub.subject.id : null,
      subjectCode: targetSub?.subject.code,
      title: `Preventive Attendance Advisory (${targetSub ? targetSub.subject.code : 'Cohort'})`,
      facultyAction:
        criticalAttendanceSubjects.length === 1
          ? `Notify student that ${criticalAttendanceSubjects[0].subject.code} attendance (${criticalAttendanceSubjects[0].attendancePercentage}%) is below ${thresholds.criticalAttendancePct}% and requires ${criticalAttendanceSubjects[0].classesNeededForMinAttendance} consecutive classes to recover.`
          : `Send an early attendance reminder so the student maintains their buffer above the ${thresholds.criticalAttendancePct}% threshold.`,
      studentGuidance:
        criticalAttendanceSubjects.length === 1
          ? `Attend the next ${criticalAttendanceSubjects[0].classesNeededForMinAttendance} consecutive classes in ${criticalAttendanceSubjects[0].subject.code} (${criticalAttendanceSubjects[0].subject.name}) to reach the ${thresholds.criticalAttendancePct}% requirement.`
          : `Your attendance buffer is narrow (${overallAttendancePercentage}%). Avoid unexcused absences over the next 2 weeks to stay comfortably above ${thresholds.criticalAttendancePct}%.`,
      suggestedFollowUpDays: 10,
    });
  }

  // 2. Subject Passing & Multi-Subject Struggle Rules
  if (
    failingSubjects.length >= 2 ||
    (overallScorePercentage !== null && overallScorePercentage < thresholds.passingScorePct)
  ) {
    const failingList = failingSubjects
      .map((s) => `${s.subject.code} (${s.weightedScorePercentage}%)`)
      .join(', ');
    evidence.push({
      id: `ev-${student.id}-multi-fail`,
      category: 'MULTI_SUBJECT_STRUGGLE',
      severity: 'HIGH',
      headline: `Failing Performance Across ${failingSubjects.length} Subjects`,
      detail: `Weighted scores are below the ${thresholds.passingScorePct}% passing benchmark in: ${failingList}. Overall cohort mean for this student is ${overallScorePercentage}%.`,
      metricLabel: `${failingSubjects.length} Subjects < ${thresholds.passingScorePct}%`,
    });

    recommendations.push({
      id: `rec-${student.id}-multi-fail`,
      category: 'MULTI_SUBJECT_STRUGGLE',
      priority: 'URGENT',
      subjectId: failingSubjects[0]?.subject.id ?? null,
      subjectCode: failingSubjects[0]?.subject.code,
      title: 'Coordinated Multi-Subject Academic Support Meeting',
      facultyAction: `Convene an academic advisor review covering ${failingSubjects.map((s) => s.subject.code).join(', ')}. Prioritize foundational topics and enroll the student in structured peer-tutoring labs.`,
      studentGuidance: `Focus your weekly study plan on core passing modules in ${failingSubjects.map((s) => s.subject.name).join(' and ')}. Attend guided problem-solving sessions before the end-semester exam.`,
      suggestedFollowUpDays: 7,
    });
  } else if (failingSubjects.length === 1) {
    const failSub = failingSubjects[0];
    evidence.push({
      id: `ev-${student.id}-single-fail`,
      category: 'SCORE_FAILING',
      severity: 'MEDIUM',
      subjectCode: failSub.subject.code,
      subjectName: failSub.subject.name,
      headline: `Below Passing Threshold in ${failSub.subject.code} (${failSub.weightedScorePercentage}%)`,
      detail: `Weighted score in ${failSub.subject.name} is ${failSub.weightedScorePercentage}% (Passing threshold: ${thresholds.passingScorePct}%), whereas other subjects average above passing.`,
      metricLabel: `${failSub.weightedScorePercentage}% in ${failSub.subject.code}`,
    });

    recommendations.push({
      id: `rec-${student.id}-single-fail`,
      category: 'SCORE_FAILING',
      priority: 'RECOMMENDED',
      subjectId: failSub.subject.id,
      subjectCode: failSub.subject.code,
      title: `Targeted Revision & Office Hours for ${failSub.subject.code}`,
      facultyAction: `Connect student with ${failSub.subject.instructor} for targeted concept review and practice sheets in ${failSub.subject.name}.`,
      studentGuidance: `Your performance in other courses is solid, so dedicating 3 extra hours/week to ${failSub.subject.code} (${failSub.subject.name}) past assessment questions will help bring your score above ${thresholds.passingScorePct}%.`,
      suggestedFollowUpDays: 10,
    });
  }

  // 3. Borderline Multi-Subject Check
  if (failingSubjects.length === 0 && borderlineSubjects.length >= 2) {
    const borderList = borderlineSubjects
      .map((s) => `${s.subject.code} (${s.weightedScorePercentage}%)`)
      .join(', ');
    evidence.push({
      id: `ev-${student.id}-borderline`,
      category: 'SCORE_BORDERLINE',
      severity: 'MEDIUM',
      headline: `Borderline Scores Across ${borderlineSubjects.length} Subjects`,
      detail: `Student is hovering just above passing (${thresholds.passingScorePct}%–${thresholds.borderlineScorePct}%) in ${borderList}. A minor slip on final exams could result in failure.`,
      metricLabel: `${borderlineSubjects.length} Borderline Subjects`,
    });

    recommendations.push({
      id: `rec-${student.id}-borderline`,
      category: 'SCORE_BORDERLINE',
      priority: 'RECOMMENDED',
      subjectId: borderlineSubjects[0].subject.id,
      subjectCode: borderlineSubjects[0].subject.code,
      title: 'Structured Pre-Exam Revision & Mock Practice',
      facultyAction: `Share topic-wise revision checklists for ${borderlineSubjects.map((s) => s.subject.code).join(', ')} to consolidate marks out of the ${thresholds.passingScorePct}%–${thresholds.borderlineScorePct}% danger zone.`,
      studentGuidance: `Review midterm grading rubrics in ${borderlineSubjects.map((s) => s.subject.code).join(', ')} to turn partial-credit answers into full marks.`,
      suggestedFollowUpDays: 14,
    });
  }

  // 4. Recent Critical Assessment Failure (< 40%)
  const criticalRecentSubjects = subjectSummaries.filter(
    (s) =>
      s.latestAssessmentPercentage !== null &&
      s.latestAssessmentPercentage < thresholds.criticalRecentAssessmentPct
  );
  if (criticalRecentSubjects.length > 0) {
    const critSub = criticalRecentSubjects[0];
    const latestGraded = critSub.assessments.filter((a) => a.normalizedPercentage !== null).slice(-1)[0];
    evidence.push({
      id: `ev-${student.id}-recent-crit`,
      category: 'RECENT_ASSESSMENT_FAILURE',
      severity: 'HIGH',
      subjectCode: critSub.subject.code,
      subjectName: critSub.subject.name,
      headline: `Critical Score (${critSub.latestAssessmentPercentage}%) on Recent Assessment in ${critSub.subject.code}`,
      detail: `Scored ${latestGraded?.marksObtained}/${latestGraded?.assessment.maxMarks} (${critSub.latestAssessmentPercentage}%) on ${latestGraded?.assessment.title} in ${critSub.subject.name}, below the ${thresholds.criticalRecentAssessmentPct}% critical alert floor.`,
      metricLabel: `${critSub.latestAssessmentPercentage}% Latest Assessment`,
    });
  }

  // 5. Declining Assessment Trajectory (Severe vs Moderate Drop)
  const severeDropSubjects = subjectSummaries.filter(
    (s) =>
      s.trendDeltaPoints !== null &&
      s.trendDeltaPoints <= -thresholds.severeDropPoints &&
      (s.latestAssessmentPercentage ?? 100) < 65
  );
  const moderateDropSubjects = subjectSummaries.filter(
    (s) =>
      s.trendDeltaPoints !== null &&
      s.trendDeltaPoints <= -thresholds.moderateDropPoints &&
      !severeDropSubjects.some((sev) => sev.subject.id === s.subject.id)
  );

  if (severeDropSubjects.length > 0) {
    const dropList = severeDropSubjects
      .map(
        (s) =>
          `${s.subject.code} (${s.previousAssessmentPercentage}% → ${s.latestAssessmentPercentage}%, ${s.trendDeltaPoints} pts)`
      )
      .join('; ');
    evidence.push({
      id: `ev-${student.id}-trend-severe`,
      category: 'TREND_SEVERE_DROP',
      severity: 'HIGH',
      subjectCode: severeDropSubjects[0].subject.code,
      headline: `Severe Performance Decline in ${severeDropSubjects.map((s) => s.subject.code).join(', ')}`,
      detail: `Normalized marks dropped sharply between consecutive assessments: ${dropList}.`,
      metricLabel: `${severeDropSubjects[0].trendDeltaPoints} pts Drop`,
    });

    recommendations.push({
      id: `rec-${student.id}-trend-severe`,
      category: 'TREND_SEVERE_DROP',
      priority: 'URGENT',
      subjectId: severeDropSubjects[0].subject.id,
      subjectCode: severeDropSubjects[0].subject.code,
      title: 'Early Assessment Script Walkthrough & Concept Diagnostic',
      facultyAction: `Review recent assessment scripts in ${severeDropSubjects.map((s) => s.subject.code).join(', ')} with the student to pinpoint post-Midterm concept gaps before final exams.`,
      studentGuidance: `Your early quiz scores showed strong potential, but recent marks dropped in ${severeDropSubjects.map((s) => s.subject.code).join(', ')}. Meet your course instructor this week to review the latest assessment solutions.`,
      suggestedFollowUpDays: 5,
    });
  } else if (moderateDropSubjects.length > 0) {
    const modList = moderateDropSubjects
      .map(
        (s) =>
          `${s.subject.code} (${s.previousAssessmentPercentage}% → ${s.latestAssessmentPercentage}%, ${s.trendDeltaPoints} pts)`
      )
      .join('; ');
    evidence.push({
      id: `ev-${student.id}-trend-mod`,
      category: 'TREND_MODERATE_DROP',
      severity: 'MEDIUM',
      subjectCode: moderateDropSubjects[0].subject.code,
      headline: `Declining Assessment Trend in ${moderateDropSubjects.map((s) => s.subject.code).join(', ')}`,
      detail: `Consecutive assessment scores declined by ≥${thresholds.moderateDropPoints} percentage points: ${modList}.`,
      metricLabel: `${moderateDropSubjects[0].trendDeltaPoints} pts Trend`,
    });

    recommendations.push({
      id: `rec-${student.id}-trend-mod`,
      category: 'TREND_MODERATE_DROP',
      priority: 'RECOMMENDED',
      subjectId: moderateDropSubjects[0].subject.id,
      subjectCode: moderateDropSubjects[0].subject.code,
      title: `Preventive Study Check-in for ${moderateDropSubjects.map((s) => s.subject.code).join(', ')}`,
      facultyAction: `Discuss recent assessment trajectory in ${moderateDropSubjects.map((s) => s.subject.code).join(', ')} and share practice problems on recent syllabus units.`,
      studentGuidance: `Address the recent dip in ${moderateDropSubjects.map((s) => s.subject.code).join(', ')} early by reviewing Assessment 2 feedback and attending the next tutorial session.`,
      suggestedFollowUpDays: 10,
    });
  }

  // 6. Missing / Incomplete Data Disclosure
  if (hasIncompleteData) {
    evidence.push({
      id: `ev-${student.id}-missing`,
      category: 'MISSING_DATA',
      severity: isMajorityDataMissing ? 'MEDIUM' : 'INFO',
      headline: `${totalMissingAssessments} Unrecorded Assessment Score(s) Across ${missingDataSubjects.length} Subject(s)`,
      detail: `Missing records are excluded from score denominators (never treated as zero): ${missingDataSummary.join(' | ')}.`,
      metricLabel: `${totalMissingAssessments} Missing Record(s)`,
    });

    recommendations.push({
      id: `rec-${student.id}-missing`,
      category: 'MISSING_DATA',
      priority: 'DATA_CHECK',
      subjectId: missingDataSubjects[0]?.subject.id ?? null,
      subjectCode: missingDataSubjects[0]?.subject.code,
      title: 'Reconcile Missing Assessment Records / Makeup Schedule',
      facultyAction: `Verify whether unrecorded marks (${missingDataSummary.join('; ')}) are awaiting grading, approved medical deferments, or missed sittings before finalizing risk status.`,
      studentGuidance: `Coordinate with your faculty advisor (${student.advisorName}) to confirm makeup assessment dates for any deferred or unrecorded evaluations.`,
      suggestedFollowUpDays: 7,
    });
  }

  // Determine overall RiskLevel using deterministic Worst-Trigger Precedence
  const hasHighSeverityTrigger = evidence.some((e) => e.severity === 'HIGH');
  const hasMediumSeverityTrigger = evidence.some(
    (e) => e.severity === 'MEDIUM' && e.category !== 'MISSING_DATA'
  );

  let riskLevel: RiskLevel;
  if (hasHighSeverityTrigger) {
    riskLevel = 'HIGH';
  } else if (hasMediumSeverityTrigger) {
    riskLevel = 'MEDIUM';
  } else if (isMajorityDataMissing) {
    riskLevel = 'INSUFFICIENT_DATA';
  } else {
    riskLevel = 'LOW';
  }

  // If Low Risk, provide positive reinforcement evidence & stretch recommendation
  if (riskLevel === 'LOW' && evidence.length === 0) {
    evidence.push({
      id: `ev-${student.id}-healthy`,
      category: 'SCORE_BORDERLINE',
      severity: 'INFO',
      headline: `Consistent Academic Standing (${overallScorePercentage}% Avg, ${overallAttendancePercentage}% Attendance)`,
      detail: `All ${subjects.length} enrolled subjects meet or exceed the ${thresholds.passingScorePct}% passing benchmark and ${thresholds.criticalAttendancePct}% attendance threshold.`,
      metricLabel: 'On Track',
    });

    recommendations.push({
      id: `rec-${student.id}-healthy`,
      category: 'SCORE_BORDERLINE',
      priority: 'RECOMMENDED',
      subjectId: null,
      title: 'Maintain Momentum & Peer Study Leadership',
      facultyAction: 'Acknowledge steady progress during regular advising; eligible for peer-mentoring or advanced project electives.',
      studentGuidance: 'Your attendance and assessment scores are well above institutional thresholds. Continue consistent revision ahead of end-semester examinations.',
      suggestedFollowUpDays: 30,
    });
  }

  // Deterministic 0–100 priority score for sorting students within and across risk tiers
  let priorityScore = 0;
  if (riskLevel === 'HIGH') priorityScore += 70;
  else if (riskLevel === 'MEDIUM') priorityScore += 40;
  else if (riskLevel === 'INSUFFICIENT_DATA') priorityScore += 30;
  else priorityScore += 5;

  priorityScore += failingSubjects.length * 6;
  priorityScore += criticalAttendanceSubjects.length * 6;
  if (overallTrendDeltaPoints !== null && overallTrendDeltaPoints < 0) {
    priorityScore += Math.min(12, Math.round(Math.abs(overallTrendDeltaPoints) / 2));
  }
  priorityScore = Math.min(100, Math.max(0, priorityScore));

  const activeInterventionsCount = studentInterventions.filter(
    (i) => i.status === 'PLANNED' || i.status === 'IN_PROGRESS'
  ).length;

  return {
    student,
    riskLevel,
    priorityScore,
    hasIncompleteData,
    missingDataSummary,
    overallScorePercentage,
    overallAttendancePercentage,
    totalClassesAttended,
    totalClassesHeld,
    overallTrendDeltaPoints,
    failingSubjectsCount: failingSubjects.length,
    borderlineSubjectsCount: borderlineSubjects.length,
    lowAttendanceSubjectsCount: criticalAttendanceSubjects.length,
    subjectSummaries,
    evidence,
    recommendations,
    interventions: studentInterventions,
    activeInterventionsCount,
  };
}

export function evaluateCohort(
  dataset: AcademicDataset,
  thresholds: RiskThresholds = DEFAULT_RISK_THRESHOLDS
): StudentAcademicEvaluation[] {
  return dataset.students
    .map((student) => evaluateStudentAcademicStanding(student, dataset, thresholds))
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return a.student.rollNumber.localeCompare(b.student.rollNumber);
    });
}

export function computeCohortOverviewMetrics(
  dataset: AcademicDataset,
  evaluations: StudentAcademicEvaluation[]
) {
  const totalStudents = evaluations.length;
  const highRiskCount = evaluations.filter((e) => e.riskLevel === 'HIGH').length;
  const mediumRiskCount = evaluations.filter((e) => e.riskLevel === 'MEDIUM').length;
  const lowRiskCount = evaluations.filter((e) => e.riskLevel === 'LOW').length;
  const insufficientDataCount = evaluations.filter(
    (e) => e.riskLevel === 'INSUFFICIENT_DATA'
  ).length;

  const validScores = evaluations
    .map((e) => e.overallScorePercentage)
    .filter((v): v is number => v !== null);
  const cohortAverageScore =
    validScores.length > 0
      ? Math.round(
          (validScores.reduce((acc, v) => acc + v, 0) / validScores.length) * 10
        ) / 10
      : null;

  const validAtt = evaluations
    .map((e) => e.overallAttendancePercentage)
    .filter((v): v is number => v !== null);
  const cohortAverageAttendance =
    validAtt.length > 0
      ? Math.round(
          (validAtt.reduce((acc, v) => acc + v, 0) / validAtt.length) * 10
        ) / 10
      : null;

  const cycles = [
    { seq: 1, cycleLabel: 'Quiz 1' },
    { seq: 2, cycleLabel: 'Midterm' },
    { seq: 3, cycleLabel: 'Assessment 2' },
  ];

  const assessmentCycleTrend = cycles.map(({ seq, cycleLabel }) => {
    const allCyclePcts: number[] = [];
    const highRiskCyclePcts: number[] = [];

    evaluations.forEach((ev) => {
      ev.subjectSummaries.forEach((sub) => {
        const found = sub.assessments.find(
          (a) => a.assessment.sequenceOrder === seq
        );
        if (found && found.normalizedPercentage !== null) {
          allCyclePcts.push(found.normalizedPercentage);
          if (ev.riskLevel === 'HIGH') {
            highRiskCyclePcts.push(found.normalizedPercentage);
          }
        }
      });
    });

    const cohortAvgPct =
      allCyclePcts.length > 0
        ? Math.round(
            (allCyclePcts.reduce((a, b) => a + b, 0) / allCyclePcts.length) * 10
          ) / 10
        : null;

    const highRiskAvgPct =
      highRiskCyclePcts.length > 0
        ? Math.round(
            (highRiskCyclePcts.reduce((a, b) => a + b, 0) /
              highRiskCyclePcts.length) *
              10
          ) / 10
        : null;

    return {
      cycleLabel,
      cohortAvgPct,
      highRiskAvgPct,
    };
  });

  return {
    totalStudents,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    insufficientDataCount,
    cohortAverageScore,
    cohortAverageAttendance,
    assessmentCycleTrend,
    totalSubjects: dataset.subjects.length,
  };
}

