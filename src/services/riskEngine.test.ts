import { describe, expect, it } from 'vitest';
import { createInitialSyntheticDataset, DEFAULT_RISK_THRESHOLDS } from '../data/syntheticCohort';
import {
  calculateClassesNeededForThreshold,
  evaluateCohort,
  evaluateStudentAcademicStanding,
} from './riskEngine';
import {
  parseAndValidateCsv,
  SAMPLE_ERROR_TEST_CSV,
  SAMPLE_VALID_CSV,
} from './dataService';

describe('Academic Insight — Deterministic Risk Engine & Data Validation', () => {
  it('never treats missing (null) assessment marks as zero', () => {
    const dataset = createInitialSyntheticDataset();
    // stu-014 (Neha Chatterjee) has 75%-80% on Quiz 1, and null on Midterm & Assessment 2 across 4 subjects
    const neha = dataset.students.find((s) => s.id === 'stu-014')!;
    const evalResult = evaluateStudentAcademicStanding(neha, dataset, DEFAULT_RISK_THRESHOLDS);

    expect(evalResult.hasIncompleteData).toBe(true);
    expect(evalResult.riskLevel).toBe('INSUFFICIENT_DATA');
    // Her overall score must reflect her graded 75%-80% assessments, NOT ~20% from dividing by ungraded assessments
    expect(evalResult.overallScorePercentage).not.toBeNull();
    expect(evalResult.overallScorePercentage!).toBeGreaterThanOrEqual(75);
    expect(evalResult.failingSubjectsCount).toBe(0);
  });

  it('flags High Risk for severe declining trajectory even when attendance is >= 75%', () => {
    const dataset = createInitialSyntheticDataset();
    // stu-002 (Riya Nair) has >80% attendance but severe marks drop (-22.7 pts in CS401)
    const riya = dataset.students.find((s) => s.id === 'stu-002')!;
    const evalResult = evaluateStudentAcademicStanding(riya, dataset, DEFAULT_RISK_THRESHOLDS);

    expect(evalResult.overallAttendancePercentage!).toBeGreaterThanOrEqual(75);
    expect(evalResult.riskLevel).toBe('HIGH');
    expect(evalResult.evidence.some((e) => e.category === 'TREND_SEVERE_DROP')).toBe(true);
  });

  it('flags Medium Risk for single-subject failure and generates targeted subject recommendation', () => {
    const dataset = createInitialSyntheticDataset();
    // stu-008 (Sana Sheikh) is strong in 4 subjects but <50% in MA401
    const sana = dataset.students.find((s) => s.id === 'stu-008')!;
    const evalResult = evaluateStudentAcademicStanding(sana, dataset, DEFAULT_RISK_THRESHOLDS);

    expect(evalResult.riskLevel).toBe('MEDIUM');
    expect(evalResult.failingSubjectsCount).toBe(1);
    expect(evalResult.recommendations.some((r) => r.subjectCode === 'MA401')).toBe(true);
  });

  it('accurately computes consecutive classes needed to reach 75% attendance', () => {
    // 15 attended out of 25 held (60%) -> needs (0.75*25 - 15) / 0.25 = 3.75 / 0.25 = 15 classes
    expect(calculateClassesNeededForThreshold(15, 25, 75)).toBe(15);
    // 18 attended out of 25 held (72%) -> needs (18.75 - 18) / 0.25 = 3 classes (21/28 = 75.0%)
    expect(calculateClassesNeededForThreshold(18, 25, 75)).toBe(3);
    // Already above 75% -> 0 classes needed
    expect(calculateClassesNeededForThreshold(20, 25, 75)).toBe(0);
  });

  it('recalculates cohort risk distribution dynamically when thresholds change', () => {
    const dataset = createInitialSyntheticDataset();
    const defaultEvals = evaluateCohort(dataset, DEFAULT_RISK_THRESHOLDS);
    const highCountDefault = defaultEvals.filter((e) => e.riskLevel === 'HIGH').length;

    const stricterThresholds = {
      ...DEFAULT_RISK_THRESHOLDS,
      criticalAttendancePct: 85.0,
      passingScorePct: 65.0,
    };
    const strictEvals = evaluateCohort(dataset, stricterThresholds);
    const highCountStrict = strictEvals.filter((e) => e.riskLevel === 'HIGH').length;

    expect(highCountStrict).toBeGreaterThan(highCountDefault);
  });

  it('validates CSV imports accurately, catching unknown roll numbers, marks > max_marks, attended > held, and duplicates', () => {
    const dataset = createInitialSyntheticDataset();
    const validResult = parseAndValidateCsv(SAMPLE_VALID_CSV, dataset);
    expect(validResult.headerError).toBeNull();
    expect(validResult.rows.every((r) => r.isValid)).toBe(true);

    const errorResult = parseAndValidateCsv(SAMPLE_ERROR_TEST_CSV, dataset);
    expect(errorResult.headerError).toBeNull();
    const invalidRows = errorResult.rows.filter((r) => !r.isValid);
    expect(invalidRows.length).toBe(5);
    // Row 6 (MISSING mark) is valid and maps marksObtained to null
    const missingMarkRow = errorResult.rows.find((r) => r.rollNumber === 'CS2024-012')!;
    expect(missingMarkRow.isValid).toBe(true);
    expect(missingMarkRow.marksObtained).toBeNull();
  });
});
