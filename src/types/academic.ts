export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';

export type AssessmentCategory = 'QUIZ' | 'MIDTERM' | 'LAB_ASSESSMENT' | 'ENDTERM';

export type ScoreStatus = 'GRADED' | 'MISSING' | 'EXCUSED';

export type InterventionStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

export type RiskFactorCategory =
  | 'ATTENDANCE_CRITICAL'
  | 'ATTENDANCE_WARNING'
  | 'SCORE_FAILING'
  | 'SCORE_BORDERLINE'
  | 'TREND_SEVERE_DROP'
  | 'TREND_MODERATE_DROP'
  | 'MULTI_SUBJECT_STRUGGLE'
  | 'RECENT_ASSESSMENT_FAILURE'
  | 'MISSING_DATA';

export interface Student {
  id: string;
  rollNumber: string;
  fullName: string;
  email: string;
  department: string;
  semester: number;
  section: 'A' | 'B';
  advisorName: string;
  enrollmentNote?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  semester: number;
  credits: number;
  instructor: string;
  passPercentage: number;
  minAttendancePercentage: number;
}

export interface Assessment {
  id: string;
  subjectId: string;
  title: string;
  category: AssessmentCategory;
  maxMarks: number;
  weightage: number; // e.g., 20, 40, 40
  sequenceOrder: number; // 1 = Quiz 1, 2 = Midterm, 3 = Assessment 2
  assessmentDate: string;
}

export interface AssessmentScore {
  id: string;
  studentId: string;
  assessmentId: string;
  marksObtained: number | null; // Strictly nullable so missing marks are never treated as 0
  status: ScoreStatus;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string;
  classesAttended: number;
  classesHeld: number;
  updatedAt: string;
}

export interface Intervention {
  id: string;
  studentId: string;
  subjectId: string | null;
  riskLevelAtCreation: RiskLevel;
  triggerFactors: string[];
  actionTitle: string;
  description: string;
  assignedFaculty: string;
  status: InterventionStatus;
  createdDate: string;
  followUpDate: string;
  outcomeNotes: string;
  updatedAt: string;
}

export interface RiskThresholds {
  criticalAttendancePct: number; // Default 75.0
  warningAttendancePct: number; // Default 85.0
  passingScorePct: number; // Default 50.0
  borderlineScorePct: number; // Default 60.0
  criticalRecentAssessmentPct: number; // Default 40.0
  severeDropPoints: number; // Default 15.0 (represents -15.0 percentage points drop)
  moderateDropPoints: number; // Default 8.0 (represents -8.0 percentage points drop)
}

export interface AssessmentBreakdownItem {
  assessment: Assessment;
  marksObtained: number | null;
  status: ScoreStatus;
  normalizedPercentage: number | null;
}

export interface SubjectPerformanceSummary {
  subject: Subject;
  classesAttended: number | null;
  classesHeld: number | null;
  attendancePercentage: number | null;
  classesNeededForMinAttendance: number; // How many consecutive classes needed to reach threshold
  canSkipClassesStayingAboveMin: number; // Buffer of classes student could miss while staying >= threshold
  weightedScorePercentage: number | null;
  latestAssessmentPercentage: number | null;
  previousAssessmentPercentage: number | null;
  trendDeltaPoints: number | null; // Latest % minus Previous %
  gradedAssessmentsCount: number;
  totalAssessmentsCount: number;
  missingAssessmentsCount: number;
  assessments: AssessmentBreakdownItem[];
  subjectRiskFlags: string[];
  isFailingScore: boolean;
  isBorderlineScore: boolean;
  isCriticalAttendance: boolean;
  isWarningAttendance: boolean;
}

export interface RiskEvidenceItem {
  id: string;
  category: RiskFactorCategory;
  severity: 'HIGH' | 'MEDIUM' | 'INFO';
  subjectCode?: string;
  subjectName?: string;
  headline: string;
  detail: string;
  metricLabel: string;
}

export interface ActionRecommendation {
  id: string;
  category: RiskFactorCategory;
  priority: 'URGENT' | 'RECOMMENDED' | 'DATA_CHECK';
  subjectId: string | null;
  subjectCode?: string;
  title: string;
  facultyAction: string;
  studentGuidance: string;
  suggestedFollowUpDays: number;
}

export interface StudentAcademicEvaluation {
  student: Student;
  riskLevel: RiskLevel;
  priorityScore: number; // 0 to 100 deterministic severity score for sorting
  hasIncompleteData: boolean;
  missingDataSummary: string[];
  overallScorePercentage: number | null;
  overallAttendancePercentage: number | null;
  totalClassesAttended: number;
  totalClassesHeld: number;
  overallTrendDeltaPoints: number | null;
  failingSubjectsCount: number;
  borderlineSubjectsCount: number;
  lowAttendanceSubjectsCount: number;
  subjectSummaries: SubjectPerformanceSummary[];
  evidence: RiskEvidenceItem[];
  recommendations: ActionRecommendation[];
  interventions: Intervention[];
  activeInterventionsCount: number;
}

export interface AcademicDataset {
  students: Student[];
  subjects: Subject[];
  assessments: Assessment[];
  scores: AssessmentScore[];
  attendance: AttendanceRecord[];
  interventions: Intervention[];
}

export interface CsvImportRowValidation {
  rowNumber: number;
  rollNumber: string;
  studentId: string | null;
  studentName: string | null;
  subjectCode: string;
  subjectId: string | null;
  recordType: 'SCORE' | 'ATTENDANCE';
  assessmentSequence?: number;
  assessmentId?: string | null;
  assessmentTitle?: string;
  marksObtained?: number | null;
  maxMarks?: number;
  classesAttended?: number;
  classesHeld?: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
