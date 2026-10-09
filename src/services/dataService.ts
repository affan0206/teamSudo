import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AcademicDataset,
  AssessmentScore,
  AttendanceRecord,
  CsvImportRowValidation,
  Intervention,
  InterventionStatus,
  RiskLevel,
  RiskThresholds,
  ScoreStatus,
} from '../types/academic';
import { DEFAULT_RISK_THRESHOLDS } from '../data/syntheticCohort';
import { getStoredSessionToken } from './authService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 20
);

export const supabaseClient: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getStoredSessionToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetches the role-scoped dataset and risk thresholds from the backend or Supabase RLS.
 * - For FACULTY: returns the authorized cohort dataset.
 * - For STUDENT: returns ONLY that authenticated student's own student row, scores,
 *   attendance, and interventions (enforced by server/database RLS).
 */
export async function fetchAuthorizedAcademicData(): Promise<{
  dataset: AcademicDataset | null;
  thresholds: RiskThresholds;
  error?: string;
}> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const [
        studentsRes,
        subjectsRes,
        assessmentsRes,
        scoresRes,
        attendanceRes,
        interventionsRes,
        thresholdsRes,
      ] = await Promise.all([
        supabaseClient.from('students').select('*'),
        supabaseClient.from('subjects').select('*'),
        supabaseClient.from('assessments').select('*'),
        supabaseClient.from('assessment_scores').select('*'),
        supabaseClient.from('attendance_records').select('*'),
        supabaseClient.from('interventions').select('*').order('created_date', { ascending: false }),
        supabaseClient.from('risk_thresholds_config').select('*').eq('id', 1).maybeSingle(),
      ]);

      if (studentsRes.error) {
        return {
          dataset: null,
          thresholds: { ...DEFAULT_RISK_THRESHOLDS },
          error: studentsRes.error.message,
        };
      }

      const dataset: AcademicDataset = {
        students: (studentsRes.data ?? []).map((s) => ({
          id: String(s.id),
          rollNumber: String(s.roll_number),
          fullName: String(s.full_name),
          email: String(s.email),
          department: String(s.department),
          semester: Number(s.semester),
          section: (s.section === 'B' ? 'B' : 'A') as 'A' | 'B',
          advisorName: String(s.advisor_name),
          enrollmentNote: s.enrollment_note ? String(s.enrollment_note) : undefined,
        })),
        subjects: (subjectsRes.data ?? []).map((sub) => ({
          id: String(sub.id),
          code: String(sub.code),
          name: String(sub.name),
          semester: Number(sub.semester),
          credits: Number(sub.credits),
          instructor: String(sub.instructor),
          passPercentage: Number(sub.pass_percentage),
          minAttendancePercentage: Number(sub.min_attendance_percentage),
        })),
        assessments: (assessmentsRes.data ?? []).map((a) => ({
          id: String(a.id),
          subjectId: String(a.subject_id),
          title: String(a.title),
          category: a.category,
          maxMarks: Number(a.max_marks),
          weightage: Number(a.weightage),
          sequenceOrder: Number(a.sequence_order),
          assessmentDate: String(a.assessment_date),
        })),
        scores: (scoresRes.data ?? []).map((sc) => ({
          id: String(sc.id),
          studentId: String(sc.student_id),
          assessmentId: String(sc.assessment_id),
          marksObtained: sc.marks_obtained === null ? null : Number(sc.marks_obtained),
          status: sc.status as ScoreStatus,
          updatedAt: String(sc.updated_at),
        })),
        attendance: (attendanceRes.data ?? []).map((att) => ({
          id: String(att.id),
          studentId: String(att.student_id),
          subjectId: String(att.subject_id),
          classesAttended: Number(att.classes_attended),
          classesHeld: Number(att.classes_held),
          updatedAt: String(att.updated_at),
        })),
        interventions: (interventionsRes.data ?? []).map((intv) => ({
          id: String(intv.id),
          studentId: String(intv.student_id),
          subjectId: intv.subject_id ? String(intv.subject_id) : null,
          riskLevelAtCreation: intv.risk_level_at_creation as RiskLevel,
          triggerFactors: Array.isArray(intv.trigger_factors) ? intv.trigger_factors : [],
          actionTitle: String(intv.action_title),
          description: String(intv.description),
          assignedFaculty: String(intv.assigned_faculty),
          status: intv.status as InterventionStatus,
          createdDate: String(intv.created_date),
          followUpDate: String(intv.follow_up_date),
          outcomeNotes: String(intv.outcome_notes ?? ''),
          updatedAt: String(intv.updated_at),
        })),
      };

      const tData = thresholdsRes.data;
      const thresholds: RiskThresholds = tData
        ? {
            criticalAttendancePct: Number(tData.critical_attendance_pct),
            warningAttendancePct: Number(tData.warning_attendance_pct),
            passingScorePct: Number(tData.passing_score_pct),
            borderlineScorePct: Number(tData.borderline_score_pct),
            criticalRecentAssessmentPct: Number(tData.critical_recent_assessment_pct),
            severeDropPoints: Number(tData.severe_drop_points),
            moderateDropPoints: Number(tData.moderate_drop_points),
          }
        : { ...DEFAULT_RISK_THRESHOLDS };

      return { dataset, thresholds };
    } catch (err) {
      return {
        dataset: null,
        thresholds: { ...DEFAULT_RISK_THRESHOLDS },
        error: err instanceof Error ? err.message : 'Failed to load data from Supabase.',
      };
    }
  }

  try {
    const res = await fetch('/api/data', {
      method: 'GET',
      headers: buildAuthHeaders(),
      credentials: 'same-origin',
    });

    const payload = (await res.json()) as {
      dataset?: AcademicDataset;
      thresholds?: RiskThresholds;
      error?: string;
    };

    if (!res.ok || !payload.dataset) {
      return {
        dataset: null,
        thresholds: { ...DEFAULT_RISK_THRESHOLDS },
        error: payload.error || 'Unauthorized access.',
      };
    }

    return {
      dataset: payload.dataset,
      thresholds: payload.thresholds ?? { ...DEFAULT_RISK_THRESHOLDS },
    };
  } catch {
    return {
      dataset: null,
      thresholds: { ...DEFAULT_RISK_THRESHOLDS },
      error: 'Unable to reach the academic data server.',
    };
  }
}

/**
 * Updates or inserts an assessment score (Faculty only, enforced by server/RLS).
 */
export async function upsertAssessmentScore(
  dataset: AcademicDataset,
  studentId: string,
  assessmentId: string,
  marksObtained: number | null,
  status: ScoreStatus = marksObtained === null ? 'MISSING' : 'GRADED'
): Promise<{ dataset: AcademicDataset; error?: string }> {
  if (isSupabaseConfigured && supabaseClient) {
    const assessment = dataset.assessments.find((a) => a.id === assessmentId);
    if (!assessment) {
      return { dataset, error: 'Selected assessment does not exist.' };
    }
    if (marksObtained !== null && (marksObtained < 0 || marksObtained > assessment.maxMarks)) {
      return {
        dataset,
        error: `Marks must be between 0 and ${assessment.maxMarks}.`,
      };
    }

    const now = new Date().toISOString();
    const recordId = `scr-${studentId}-${assessmentId}`;
    const { error } = await supabaseClient.from('assessment_scores').upsert({
      id: recordId,
      student_id: studentId,
      assessment_id: assessmentId,
      marks_obtained: marksObtained,
      status: marksObtained === null ? status : 'GRADED',
      updated_at: now,
    });

    if (error) {
      return { dataset, error: error.message };
    }

    const updatedRecord: AssessmentScore = {
      id: recordId,
      studentId,
      assessmentId,
      marksObtained,
      status: marksObtained === null ? status : 'GRADED',
      updatedAt: now,
    };
    const nextScores = [...dataset.scores];
    const idx = nextScores.findIndex(
      (s) => s.studentId === studentId && s.assessmentId === assessmentId
    );
    if (idx >= 0) nextScores[idx] = updatedRecord;
    else nextScores.push(updatedRecord);

    return { dataset: { ...dataset, scores: nextScores } };
  }

  const res = await fetch('/api/data/score', {
    method: 'POST',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify({ studentId, assessmentId, marksObtained, status }),
  });

  const payload = (await res.json()) as {
    dataset?: AcademicDataset;
    error?: string;
  };

  if (!res.ok || !payload.dataset) {
    return {
      dataset,
      error: payload.error || 'Failed to update assessment score.',
    };
  }

  return { dataset: payload.dataset };
}

/**
 * Updates a student's subject attendance record (Faculty only, enforced by server/RLS).
 */
export async function upsertAttendanceRecord(
  dataset: AcademicDataset,
  studentId: string,
  subjectId: string,
  classesAttended: number,
  classesHeld: number
): Promise<{ dataset: AcademicDataset; error?: string }> {
  if (isSupabaseConfigured && supabaseClient) {
    if (
      !Number.isInteger(classesAttended) ||
      !Number.isInteger(classesHeld) ||
      classesAttended < 0 ||
      classesHeld <= 0 ||
      classesAttended > classesHeld
    ) {
      return {
        dataset,
        error: 'Attendance counts must be valid integers with attended <= held.',
      };
    }

    const now = new Date().toISOString();
    const recordId = `att-${studentId}-${subjectId}`;
    const { error } = await supabaseClient.from('attendance_records').upsert({
      id: recordId,
      student_id: studentId,
      subject_id: subjectId,
      classes_attended: classesAttended,
      classes_held: classesHeld,
      updated_at: now,
    });

    if (error) {
      return { dataset, error: error.message };
    }

    const updatedRecord: AttendanceRecord = {
      id: recordId,
      studentId,
      subjectId,
      classesAttended,
      classesHeld,
      updatedAt: now,
    };
    const nextAtt = [...dataset.attendance];
    const idx = nextAtt.findIndex(
      (a) => a.studentId === studentId && a.subjectId === subjectId
    );
    if (idx >= 0) nextAtt[idx] = updatedRecord;
    else nextAtt.push(updatedRecord);

    return { dataset: { ...dataset, attendance: nextAtt } };
  }

  const res = await fetch('/api/data/attendance', {
    method: 'POST',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify({ studentId, subjectId, classesAttended, classesHeld }),
  });

  const payload = (await res.json()) as {
    dataset?: AcademicDataset;
    error?: string;
  };

  if (!res.ok || !payload.dataset) {
    return {
      dataset,
      error: payload.error || 'Failed to update attendance record.',
    };
  }

  return { dataset: payload.dataset };
}

/**
 * Creates a new faculty intervention record (Faculty only, enforced by server/RLS).
 */
export async function createInterventionRecord(
  dataset: AcademicDataset,
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
): Promise<{ dataset: AcademicDataset; intervention?: Intervention; error?: string }> {
  if (isSupabaseConfigured && supabaseClient) {
    const now = new Date();
    const newIntervention: Intervention = {
      id: `int-${Date.now()}`,
      studentId: input.studentId,
      subjectId: input.subjectId,
      riskLevelAtCreation: input.riskLevelAtCreation,
      triggerFactors: input.triggerFactors,
      actionTitle: input.actionTitle.trim(),
      description: input.description.trim(),
      assignedFaculty: input.assignedFaculty.trim(),
      status: input.status ?? 'PLANNED',
      createdDate: now.toISOString().split('T')[0],
      followUpDate: input.followUpDate,
      outcomeNotes: input.outcomeNotes?.trim() ?? '',
      updatedAt: now.toISOString(),
    };

    const { error } = await supabaseClient.from('interventions').insert({
      id: newIntervention.id,
      student_id: newIntervention.studentId,
      subject_id: newIntervention.subjectId,
      risk_level_at_creation: newIntervention.riskLevelAtCreation,
      trigger_factors: newIntervention.triggerFactors,
      action_title: newIntervention.actionTitle,
      description: newIntervention.description,
      assigned_faculty: newIntervention.assignedFaculty,
      status: newIntervention.status,
      created_date: newIntervention.createdDate,
      follow_up_date: newIntervention.followUpDate,
      outcome_notes: newIntervention.outcomeNotes,
      updated_at: newIntervention.updatedAt,
    });

    if (error) {
      return { dataset, error: error.message };
    }

    return {
      dataset: {
        ...dataset,
        interventions: [newIntervention, ...dataset.interventions],
      },
      intervention: newIntervention,
    };
  }

  const res = await fetch('/api/data/interventions', {
    method: 'POST',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify(input),
  });

  const payload = (await res.json()) as {
    dataset?: AcademicDataset;
    intervention?: Intervention;
    error?: string;
  };

  if (!res.ok || !payload.dataset) {
    return {
      dataset,
      error: payload.error || 'Failed to record intervention.',
    };
  }

  return {
    dataset: payload.dataset,
    intervention: payload.intervention,
  };
}

/**
 * Updates an existing intervention's status or outcome notes (Faculty only, enforced by server/RLS).
 */
export async function updateInterventionRecord(
  dataset: AcademicDataset,
  interventionId: string,
  updates: {
    status: InterventionStatus;
    outcomeNotes: string;
    followUpDate?: string;
  }
): Promise<{ dataset: AcademicDataset; error?: string }> {
  if (isSupabaseConfigured && supabaseClient) {
    const now = new Date().toISOString();
    const { error } = await supabaseClient
      .from('interventions')
      .update({
        status: updates.status,
        outcome_notes: updates.outcomeNotes.trim(),
        ...(updates.followUpDate ? { follow_up_date: updates.followUpDate } : {}),
        updated_at: now,
      })
      .eq('id', interventionId);

    if (error) {
      return { dataset, error: error.message };
    }

    const nextInterventions = dataset.interventions.map((i) =>
      i.id === interventionId
        ? {
            ...i,
            status: updates.status,
            outcomeNotes: updates.outcomeNotes.trim(),
            followUpDate: updates.followUpDate ?? i.followUpDate,
            updatedAt: now,
          }
        : i
    );

    return { dataset: { ...dataset, interventions: nextInterventions } };
  }

  const res = await fetch('/api/data/interventions', {
    method: 'PATCH',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify({
      interventionId,
      status: updates.status,
      outcomeNotes: updates.outcomeNotes,
      followUpDate: updates.followUpDate,
    }),
  });

  const payload = (await res.json()) as {
    dataset?: AcademicDataset;
    error?: string;
  };

  if (!res.ok || !payload.dataset) {
    return {
      dataset,
      error: payload.error || 'Failed to update intervention.',
    };
  }

  return { dataset: payload.dataset };
}

/**
 * Commits validated CSV rows (Faculty only, enforced by server/RLS).
 */
export async function commitValidatedCsvRows(
  dataset: AcademicDataset,
  validRows: CsvImportRowValidation[]
): Promise<{ dataset: AcademicDataset; appliedCount: number; error?: string }> {
  if (isSupabaseConfigured && supabaseClient) {
    let workingDataset = { ...dataset };
    let appliedCount = 0;
    for (const row of validRows) {
      if (!row.isValid || !row.studentId || !row.subjectId) continue;
      if (row.recordType === 'SCORE' && row.assessmentId) {
        const res = await upsertAssessmentScore(
          workingDataset,
          row.studentId,
          row.assessmentId,
          row.marksObtained ?? null,
          row.marksObtained === null ? 'MISSING' : 'GRADED'
        );
        if (!res.error) {
          workingDataset = res.dataset;
          appliedCount += 1;
        }
      } else if (
        row.recordType === 'ATTENDANCE' &&
        row.classesAttended !== undefined &&
        row.classesHeld !== undefined
      ) {
        const res = await upsertAttendanceRecord(
          workingDataset,
          row.studentId,
          row.subjectId,
          row.classesAttended,
          row.classesHeld
        );
        if (!res.error) {
          workingDataset = res.dataset;
          appliedCount += 1;
        }
      }
    }
    return { dataset: workingDataset, appliedCount };
  }

  const res = await fetch('/api/data/csv', {
    method: 'POST',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify({ validRows }),
  });

  const payload = (await res.json()) as {
    dataset?: AcademicDataset;
    appliedCount?: number;
    error?: string;
  };

  if (!res.ok || !payload.dataset) {
    return {
      dataset,
      appliedCount: 0,
      error: payload.error || 'Failed to commit CSV records.',
    };
  }

  return {
    dataset: payload.dataset,
    appliedCount: payload.appliedCount ?? 0,
  };
}

/**
 * Persists updated risk thresholds (Faculty only, enforced by server/RLS).
 */
export async function saveRiskThresholdsOnServer(
  thresholds: RiskThresholds
): Promise<{ thresholds: RiskThresholds; error?: string }> {
  if (isSupabaseConfigured && supabaseClient) {
    const { error } = await supabaseClient.from('risk_thresholds_config').upsert({
      id: 1,
      critical_attendance_pct: thresholds.criticalAttendancePct,
      warning_attendance_pct: thresholds.warningAttendancePct,
      passing_score_pct: thresholds.passingScorePct,
      borderline_score_pct: thresholds.borderlineScorePct,
      critical_recent_assessment_pct: thresholds.criticalRecentAssessmentPct,
      severe_drop_points: thresholds.severeDropPoints,
      moderate_drop_points: thresholds.moderateDropPoints,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      return { thresholds, error: error.message };
    }
    return { thresholds };
  }

  const res = await fetch('/api/data/thresholds', {
    method: 'PUT',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify({ thresholds }),
  });

  const payload = (await res.json()) as {
    thresholds?: RiskThresholds;
    error?: string;
  };

  if (!res.ok || !payload.thresholds) {
    return {
      thresholds,
      error: payload.error || 'Forbidden: Only faculty can modify risk rules.',
    };
  }

  return { thresholds: payload.thresholds };
}

/**
 * Resets synthetic cohort dataset to baseline (Faculty only, enforced by server/RLS).
 */
export async function resetDatasetOnServer(
  currentDataset: AcademicDataset
): Promise<{
  dataset: AcademicDataset;
  thresholds: RiskThresholds;
  error?: string;
}> {
  const res = await fetch('/api/data/reset', {
    method: 'POST',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
  });

  const payload = (await res.json()) as {
    dataset?: AcademicDataset;
    thresholds?: RiskThresholds;
    error?: string;
  };

  if (!res.ok || !payload.dataset) {
    return {
      dataset: currentDataset,
      thresholds: { ...DEFAULT_RISK_THRESHOLDS },
      error: payload.error || 'Forbidden: Only faculty can reset cohort data.',
    };
  }

  return {
    dataset: payload.dataset,
    thresholds: payload.thresholds ?? { ...DEFAULT_RISK_THRESHOLDS },
  };
}

/**
 * Validates CSV text for batch academic record import.
 */
export function parseAndValidateCsv(
  csvText: string,
  dataset: AcademicDataset
): {
  headerError: string | null;
  rows: CsvImportRowValidation[];
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length < 2) {
    return {
      headerError: 'CSV file must contain a header row and at least one data row.',
      rows: [],
    };
  }

  const rawHeaders = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const requiredHeaders = ['roll_number', 'subject_code', 'record_type'];
  const missingHeaders = requiredHeaders.filter((rh) => !rawHeaders.includes(rh));

  if (missingHeaders.length > 0) {
    return {
      headerError: `Missing required CSV column(s): ${missingHeaders.join(', ')}. Expected headers: roll_number,subject_code,record_type,assessment_seq,marks_obtained,classes_attended,classes_held`,
      rows: [],
    };
  }

  const colIdx = {
    rollNumber: rawHeaders.indexOf('roll_number'),
    subjectCode: rawHeaders.indexOf('subject_code'),
    recordType: rawHeaders.indexOf('record_type'),
    assessmentSeq: rawHeaders.indexOf('assessment_seq'),
    marksObtained: rawHeaders.indexOf('marks_obtained'),
    classesAttended: rawHeaders.indexOf('classes_attended'),
    classesHeld: rawHeaders.indexOf('classes_held'),
  };

  const seenKeys = new Set<string>();
  const validatedRows: CsvImportRowValidation[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map((c) => c.trim());
    const rowNumber = i + 1;
    const rollNumber = (cells[colIdx.rollNumber] ?? '').toUpperCase();
    const subjectCode = (cells[colIdx.subjectCode] ?? '').toUpperCase();
    const rawType = (cells[colIdx.recordType] ?? '').toUpperCase();

    const errors: string[] = [];
    const warnings: string[] = [];

    const student = dataset.students.find((s) => s.rollNumber.toUpperCase() === rollNumber);
    if (!student) {
      errors.push(`Student roll_number "${rollNumber || '(blank)'}" not found in cohort.`);
    }

    const subject = dataset.subjects.find((sub) => sub.code.toUpperCase() === subjectCode);
    if (!subject) {
      errors.push(`Subject code "${subjectCode || '(blank)'}" not recognized.`);
    }

    if (rawType !== 'SCORE' && rawType !== 'ATTENDANCE') {
      errors.push(`record_type must be "SCORE" or "ATTENDANCE" (received "${rawType || '(blank)'}").`);
    }

    const recordType: 'SCORE' | 'ATTENDANCE' = rawType === 'ATTENDANCE' ? 'ATTENDANCE' : 'SCORE';

    let assessmentSequence: number | undefined;
    let assessmentId: string | null = null;
    let assessmentTitle: string | undefined;
    let maxMarks: number | undefined;
    let marksObtained: number | null | undefined;
    let classesAttended: number | undefined;
    let classesHeld: number | undefined;

    if (recordType === 'SCORE') {
      const seqStr = colIdx.assessmentSeq >= 0 ? cells[colIdx.assessmentSeq] ?? '' : '';
      const seqNum = Number(seqStr);
      if (!seqStr || !Number.isInteger(seqNum) || seqNum < 1 || seqNum > 3) {
        errors.push(`assessment_seq must be 1 (Quiz 1), 2 (Midterm), or 3 (Assessment 2).`);
      } else {
        assessmentSequence = seqNum;
        if (subject) {
          const asmt = dataset.assessments.find(
            (a) => a.subjectId === subject.id && a.sequenceOrder === seqNum
          );
          if (asmt) {
            assessmentId = asmt.id;
            assessmentTitle = asmt.title;
            maxMarks = asmt.maxMarks;
          } else {
            errors.push(`No assessment #${seqNum} defined for ${subject.code}.`);
          }
        }
      }

      const dupKey = `SCORE:${rollNumber}:${subjectCode}:${assessmentSequence ?? '?'}`;
      if (seenKeys.has(dupKey)) {
        errors.push(`Duplicate CSV row for ${rollNumber} ${subjectCode} Assessment #${assessmentSequence}.`);
      }
      seenKeys.add(dupKey);

      const rawMarks = colIdx.marksObtained >= 0 ? cells[colIdx.marksObtained] ?? '' : '';
      if (rawMarks === '' || rawMarks.toUpperCase() === 'NULL' || rawMarks.toUpperCase() === 'MISSING') {
        marksObtained = null;
        warnings.push('Blank/NULL mark will be recorded explicitly as MISSING (not zero).');
      } else {
        const parsedMarks = Number(rawMarks);
        if (Number.isNaN(parsedMarks)) {
          errors.push(`Invalid numeric value "${rawMarks}" for marks_obtained.`);
        } else if (parsedMarks < 0) {
          errors.push(`Marks obtained (${parsedMarks}) cannot be negative.`);
        } else if (maxMarks !== undefined && parsedMarks > maxMarks) {
          errors.push(`Marks obtained (${parsedMarks}) exceeds max_marks (${maxMarks}) for ${assessmentTitle}.`);
        } else {
          marksObtained = parsedMarks;
        }
      }
    } else if (recordType === 'ATTENDANCE') {
      const dupKey = `ATTENDANCE:${rollNumber}:${subjectCode}`;
      if (seenKeys.has(dupKey)) {
        errors.push(`Duplicate attendance row in CSV for ${rollNumber} in ${subjectCode}.`);
      }
      seenKeys.add(dupKey);

      const rawAtt = colIdx.classesAttended >= 0 ? cells[colIdx.classesAttended] ?? '' : '';
      const rawHeld = colIdx.classesHeld >= 0 ? cells[colIdx.classesHeld] ?? '' : '';

      if (rawAtt === '' || rawHeld === '') {
        errors.push('Both classes_attended and classes_held are required for ATTENDANCE rows.');
      } else {
        const attNum = Number(rawAtt);
        const heldNum = Number(rawHeld);
        if (!Number.isInteger(attNum) || !Number.isInteger(heldNum)) {
          errors.push('classes_attended and classes_held must be whole integers.');
        } else if (attNum < 0 || heldNum <= 0) {
          errors.push('classes_attended must be >= 0 and classes_held must be > 0.');
        } else if (attNum > heldNum) {
          errors.push(`classes_attended (${attNum}) cannot exceed classes_held (${heldNum}).`);
        } else {
          classesAttended = attNum;
          classesHeld = heldNum;
        }
      }
    }

    validatedRows.push({
      rowNumber,
      rollNumber,
      studentId: student?.id ?? null,
      studentName: student?.fullName ?? null,
      subjectCode,
      subjectId: subject?.id ?? null,
      recordType,
      assessmentSequence,
      assessmentId,
      assessmentTitle,
      marksObtained,
      maxMarks,
      classesAttended,
      classesHeld,
      isValid: errors.length === 0,
      errors,
      warnings,
    });
  }

  return {
    headerError: null,
    rows: validatedRows,
  };
}

export const SAMPLE_VALID_CSV = `roll_number,subject_code,record_type,assessment_seq,marks_obtained,classes_attended,classes_held
CS2024-004,CS404,SCORE,3,22,,
CS2024-004,CS402,SCORE,3,19,,
CS2024-001,CS401,ATTENDANCE,,,20,26
CS2024-001,CS403,ATTENDANCE,,,19,25
CS2024-014,CS402,SCORE,2,39,,
CS2024-014,CS403,SCORE,2,41,,
CS2024-008,MA401,SCORE,3,21,,`;

export const SAMPLE_ERROR_TEST_CSV = `roll_number,subject_code,record_type,assessment_seq,marks_obtained,classes_attended,classes_held
CS2024-002,CS401,SCORE,3,22,,
CS2024-999,CS401,SCORE,2,35,,
CS2024-001,CS401,SCORE,2,58,,
CS2024-003,CS402,ATTENDANCE,,,29,25
CS2024-005,CS999,ATTENDANCE,,,20,25
CS2024-012,CS404,SCORE,3,MISSING,,
CS2024-002,CS401,SCORE,3,24,,`;
