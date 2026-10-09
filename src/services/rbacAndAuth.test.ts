import { describe, expect, it } from 'vitest';
import {
  authenticateUserCredentials,
  getAuthorizedDatasetForSession,
  revokeSessionToken,
  serverCreateInterventionRecord,
  serverResetDemoDataset,
  serverSaveRiskThresholds,
  serverUpsertAssessmentScore,
  serverUpsertAttendanceRecord,
  verifySessionToken,
} from '../../server/authAndDataServer.mjs';
import { DEFAULT_RISK_THRESHOLDS } from '../data/syntheticCohort';

describe('Authentication & Role-Based Access Control (RBAC)', () => {
  it('1. Rejects unauthenticated access to academic data and mutations with 401', () => {
    const unauthData = getAuthorizedDatasetForSession(null);
    expect(unauthData.status).toBe(401);
    expect(unauthData.dataset).toBeUndefined();

    const unauthReset = serverResetDemoDataset(null);
    expect(unauthReset.status).toBe(401);
  });

  it('2. Rejects invalid credentials and tampered tokens', () => {
    const badPassword = authenticateUserCredentials(
      'aris.thorne@demo.university.edu',
      'WrongPassword123'
    );
    expect(badPassword.status).toBe(401);
    expect(badPassword.authenticated).toBe(false);
    expect(badPassword.token).toBeUndefined();

    const unknownUser = authenticateUserCredentials(
      'unknown.visitor@demo.university.edu',
      'Faculty#2026!'
    );
    expect(unknownUser.status).toBe(401);
    expect(unknownUser.authenticated).toBe(false);

    const forgedToken = verifySessionToken('eyJzdWIiOiJ1c3ItZmFjLTAwMSJ9.forgedsig');
    expect(forgedToken.status).toBe(401);
    expect(forgedToken.authenticated).toBe(false);
  });

  it('3. Establishes valid sessions on login and invalidates them upon logout', () => {
    const loginRes = authenticateUserCredentials(
      'aarav.mehta@demo.university.edu',
      'Student#001!'
    );
    expect(loginRes.status).toBe(200);
    expect(loginRes.authenticated).toBe(true);
    expect(loginRes.user?.role).toBe('STUDENT');
    expect(loginRes.user?.studentId).toBe('stu-001');
    expect(loginRes.token).toBeDefined();

    // Session verification succeeds before logout
    const activeCheck = verifySessionToken(loginRes.token);
    expect(activeCheck.status).toBe(200);
    expect(activeCheck.authenticated).toBe(true);

    // Revoke session on logout
    revokeSessionToken(loginRes.token);

    // Subsequent verification or data access fails with 401
    const afterLogoutCheck = verifySessionToken(loginRes.token);
    expect(afterLogoutCheck.status).toBe(401);
    expect(afterLogoutCheck.authenticated).toBe(false);

    const afterLogoutData = getAuthorizedDatasetForSession(loginRes.token);
    expect(afterLogoutData.status).toBe(401);
  });

  it('4. Restricts STUDENT role strictly to their own student record and blocks access to other students', () => {
    const studentLogin = authenticateUserCredentials(
      'aarav.mehta@demo.university.edu',
      'Student#001!'
    );
    const token = studentLogin.token!;

    // Authorized request returns ONLY stu-001 data, never other cohort students
    const dataRes = getAuthorizedDatasetForSession(token);
    expect(dataRes.status).toBe(200);
    expect(dataRes.dataset?.students).toHaveLength(1);
    expect(dataRes.dataset?.students[0].id).toBe('stu-001');
    expect(
      dataRes.dataset?.scores.every((s) => s.studentId === 'stu-001')
    ).toBe(true);
    expect(
      dataRes.dataset?.attendance.every((a) => a.studentId === 'stu-001')
    ).toBe(true);
    expect(
      dataRes.dataset?.interventions.every((i) => i.studentId === 'stu-001')
    ).toBe(true);

    // Attempting to request another student's ID (stu-002) is rejected with 403 Forbidden
    const crossStudentAttempt = getAuthorizedDatasetForSession(token, 'stu-002');
    expect(crossStudentAttempt.status).toBe(403);
    expect(crossStudentAttempt.dataset).toBeUndefined();
  });

  it('5. Blocks STUDENT role from modifying marks, attendance, interventions, risk rules, or resetting demo data (403 Forbidden)', () => {
    const studentLogin = authenticateUserCredentials(
      'aarav.mehta@demo.university.edu',
      'Student#001!'
    );
    const token = studentLogin.token!;

    const scoreAttempt = serverUpsertAssessmentScore(token, {
      studentId: 'stu-001',
      assessmentId: 'asmt-cs401-1',
      marksObtained: 20,
    });
    expect(scoreAttempt.status).toBe(403);

    const attendanceAttempt = serverUpsertAttendanceRecord(token, {
      studentId: 'stu-001',
      subjectId: 'sub-cs401',
      classesAttended: 25,
      classesHeld: 25,
    });
    expect(attendanceAttempt.status).toBe(403);

    const interventionAttempt = serverCreateInterventionRecord(token, {
      studentId: 'stu-001',
      subjectId: 'sub-cs401',
      riskLevelAtCreation: 'HIGH',
      triggerFactors: ['Attendance'],
      actionTitle: 'Unauthorized self-intervention',
      description: 'Should fail',
      assignedFaculty: 'Dr. Aris Thorne',
      followUpDate: '2026-10-25',
    });
    expect(interventionAttempt.status).toBe(403);

    const thresholdsAttempt = serverSaveRiskThresholds(token, {
      ...DEFAULT_RISK_THRESHOLDS,
      passingScorePct: 30,
    });
    expect(thresholdsAttempt.status).toBe(403);

    const resetAttempt = serverResetDemoDataset(token);
    expect(resetAttempt.status).toBe(403);
  });

  it('6. Allows FACULTY role to access cohort records and perform authorized updates', () => {
    const facultyLogin = authenticateUserCredentials(
      'aris.thorne@demo.university.edu',
      'Faculty#2026!'
    );
    expect(facultyLogin.status).toBe(200);
    expect(facultyLogin.user?.role).toBe('FACULTY');
    const token = facultyLogin.token!;

    const cohortData = getAuthorizedDatasetForSession(token);
    expect(cohortData.status).toBe(200);
    expect(cohortData.dataset?.students.length).toBe(20);

    const updateRes = serverUpsertAssessmentScore(token, {
      studentId: 'stu-001',
      assessmentId: 'asmt-cs401-1',
      marksObtained: 11,
    });
    expect(updateRes.status).toBe(200);

    // Restore clean baseline after test
    const resetRes = serverResetDemoDataset(token);
    expect(resetRes.status).toBe(200);
  });
});
