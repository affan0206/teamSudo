import {
  AcademicDataset,
  CsvImportRowValidation,
  Intervention,
  InterventionStatus,
  RiskLevel,
  RiskThresholds,
  ScoreStatus,
} from '../src/types/academic';
import { AuthenticatedUserProfile } from '../src/types/auth';

export interface ServerAuthResult {
  status: number;
  authenticated: boolean;
  user: AuthenticatedUserProfile | null;
  token?: string;
  error?: string;
}

export interface ServerDataResult {
  status: number;
  user?: AuthenticatedUserProfile;
  dataset?: AcademicDataset;
  thresholds?: RiskThresholds;
  intervention?: Intervention;
  appliedCount?: number;
  error?: string;
}

export function authenticateUserCredentials(
  email: string,
  password: string
): ServerAuthResult;

export function verifySessionToken(token: string | null | undefined): ServerAuthResult;

export function revokeSessionToken(token: string | null | undefined): {
  status: number;
  revoked: boolean;
};

export function requestPasswordResetNotice(email: string): {
  status: number;
  message: string;
  error?: string;
};

export function getAuthorizedDatasetForSession(
  token: string | null | undefined,
  requestedStudentIdOverride?: string | null
): ServerDataResult;

export function serverUpsertAssessmentScore(
  token: string | null | undefined,
  input: {
    studentId: string;
    assessmentId: string;
    marksObtained: number | null;
    status?: ScoreStatus;
  }
): ServerDataResult;

export function serverUpsertAttendanceRecord(
  token: string | null | undefined,
  input: {
    studentId: string;
    subjectId: string;
    classesAttended: number;
    classesHeld: number;
  }
): ServerDataResult;

export function serverCreateInterventionRecord(
  token: string | null | undefined,
  input: {
    studentId: string;
    subjectId: string | null;
    riskLevelAtCreation: RiskLevel;
    triggerFactors: string[];
    actionTitle: string;
    description: string;
    assignedFaculty: string;
    followUpDate: string;
    status?: InterventionStatus;
    outcomeNotes?: string;
  }
): ServerDataResult;

export function serverUpdateInterventionRecord(
  token: string | null | undefined,
  input: {
    interventionId: string;
    status: InterventionStatus;
    outcomeNotes: string;
    followUpDate?: string;
  }
): ServerDataResult;

export function serverCommitValidatedCsvRows(
  token: string | null | undefined,
  validRows: CsvImportRowValidation[]
): ServerDataResult;

export function serverSaveRiskThresholds(
  token: string | null | undefined,
  thresholds: RiskThresholds
): ServerDataResult;

export function serverResetDemoDataset(
  token: string | null | undefined
): ServerDataResult;

export function createAcademicInsightRbacPlugin(): {
  name: string;
  configureServer: (server: unknown) => void;
  configurePreviewServer: (server: unknown) => void;
};
