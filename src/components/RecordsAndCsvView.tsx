import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Save,
  Upload,
} from 'lucide-react';
import {
  AcademicDataset,
  CsvImportRowValidation,
  StudentAcademicEvaluation,
} from '../types/academic';
import {
  parseAndValidateCsv,
  SAMPLE_ERROR_TEST_CSV,
  SAMPLE_VALID_CSV,
} from '../services/dataService';
import { RiskBadge } from './StatusBadges';

interface RecordsAndCsvViewProps {
  dataset: AcademicDataset;
  evaluations: StudentAcademicEvaluation[];
  onUpdateScore: (
    studentId: string,
    assessmentId: string,
    marksObtained: number | null
  ) => Promise<string | undefined>;
  onUpdateAttendance: (
    studentId: string,
    subjectId: string,
    classesAttended: number,
    classesHeld: number
  ) => Promise<string | undefined>;
  onCommitCsvRows: (validRows: CsvImportRowValidation[]) => Promise<number>;
  onSelectStudent: (studentId: string) => void;
}

export const RecordsAndCsvView: React.FC<RecordsAndCsvViewProps> = ({
  dataset,
  evaluations,
  onUpdateScore,
  onUpdateAttendance,
  onCommitCsvRows,
  onSelectStudent,
}) => {
  // Single Record Editor State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    dataset.students[0]?.id ?? 'stu-001'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    dataset.subjects[0]?.id ?? 'sub-cs401'
  );

  const currentEval = evaluations.find((e) => e.student.id === selectedStudentId);
  const currentSubSummary = currentEval?.subjectSummaries.find(
    (s) => s.subject.id === selectedSubjectId
  );

  const [attendedInput, setAttendedInput] = useState<string>(
    String(currentSubSummary?.classesAttended ?? 20)
  );
  const [heldInput, setHeldInput] = useState<string>(
    String(currentSubSummary?.classesHeld ?? 25)
  );
  const [marksInputs, setMarksInputs] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sync form inputs when student or subject selection changes
  React.useEffect(() => {
    if (!currentSubSummary) return;
    setAttendedInput(String(currentSubSummary.classesAttended ?? 0));
    setHeldInput(String(currentSubSummary.classesHeld ?? 25));
    const map: Record<string, string> = {};
    currentSubSummary.assessments.forEach((a) => {
      map[a.assessment.id] = a.marksObtained === null ? '' : String(a.marksObtained);
    });
    setMarksInputs(map);
    setFormMessage(null);
  }, [selectedStudentId, selectedSubjectId, currentSubSummary]);

  const handleSaveSingleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    if (!currentSubSummary) return;

    const attNum = Number(attendedInput);
    const heldNum = Number(heldInput);

    const attErr = await onUpdateAttendance(
      selectedStudentId,
      selectedSubjectId,
      attNum,
      heldNum
    );
    if (attErr) {
      setFormMessage({ type: 'error', text: attErr });
      return;
    }

    for (const item of currentSubSummary.assessments) {
      const raw = (marksInputs[item.assessment.id] ?? '').trim();
      const marksVal = raw === '' ? null : Number(raw);
      const scoreErr = await onUpdateScore(selectedStudentId, item.assessment.id, marksVal);
      if (scoreErr) {
        setFormMessage({ type: 'error', text: scoreErr });
        return;
      }
    }

    setFormMessage({
      type: 'success',
      text: `Saved ${currentSubSummary.subject.code} marks and attendance for ${currentEval?.student.fullName}. Cohort metrics and risk classifications updated.`,
    });
  };

  // CSV Import State
  const [csvText, setCsvText] = useState<string>(SAMPLE_VALID_CSV);
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);

  const validationOutcome = React.useMemo(
    () => parseAndValidateCsv(csvText, dataset),
    [csvText, dataset]
  );

  const validRows = validationOutcome.rows.filter((r) => r.isValid);
  const invalidRows = validationOutcome.rows.filter((r) => !r.isValid);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result ?? '');
      setCsvText(content);
      setCsvFeedback(null);
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCommitCsv = async () => {
    if (validRows.length === 0) return;
    const count = await onCommitCsvRows(validRows);
    setCsvFeedback(
      `Successfully imported ${count} validated academic record(s). Dashboard KPIs and student risk classifications have been recalculated.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-border pb-5">
        <div>
          <div className="section-kicker mb-1.5">
            <span className="section-kicker-num">01 //</span>
            <span>Academic Data Ingestion</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-primary tracking-tight">
            Records &amp; Batch CSV Import
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            Record individual student marks and attendance or validate batch CSV uploads with strict range and null-safety checks.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              handleDownloadSampleCsv(SAMPLE_VALID_CSV, 'academic_insight_valid_sample.csv')
            }
            className="btn-secondary text-xs py-1.5"
          >
            <Download className="w-3.5 h-3.5 text-ink-muted" />
            Valid CSV Template
          </button>
          <button
            type="button"
            onClick={() =>
              handleDownloadSampleCsv(SAMPLE_ERROR_TEST_CSV, 'academic_insight_error_test.csv')
            }
            className="btn-secondary text-xs py-1.5"
          >
            <Download className="w-3.5 h-3.5 text-ink-muted" />
            QA Error CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Single Student & Subject Record Editor */}
        <section className="lg:col-span-5 card-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-border">
            <div className="section-kicker mb-0.5">
              <span className="section-kicker-num">02 //</span>
              <span>Single Record Editor</span>
            </div>
            <h2 className="font-display text-base font-bold text-ink-primary">
              Interactive Marks &amp; Attendance Editor
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Update individual student scores or attendance counts. Leave a score blank to record it explicitly as{' '}
              <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-subtle text-ink-primary">
                MISSING (null)
              </code>
              .
            </p>
          </div>

          <form onSubmit={handleSaveSingleRecord} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5">
                Student
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="input-field font-medium"
              >
                {evaluations.map((ev) => (
                  <option key={ev.student.id} value={ev.student.id}>
                    {ev.student.rollNumber} — {ev.student.fullName} ({ev.riskLevel})
                  </option>
                ))}
              </select>
            </div>

            {currentEval && (
              <div className="px-3.5 py-3 rounded-lg bg-subtle/70 border border-stone-border flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-ink-primary">
                    {currentEval.student.fullName}
                  </div>
                  <div className="text-xs text-ink-secondary tabular-nums mt-0.5">
                    Avg:{' '}
                    <span className="font-semibold text-ink-primary">
                      {currentEval.overallScorePercentage !== null
                        ? `${currentEval.overallScorePercentage}%`
                        : 'N/A'}
                    </span>{' '}
                    · Attendance:{' '}
                    <span className="font-semibold text-ink-primary">
                      {currentEval.overallAttendancePercentage !== null
                        ? `${currentEval.overallAttendancePercentage}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <RiskBadge
                    level={currentEval.riskLevel}
                    size="sm"
                    showIncompleteTag={currentEval.hasIncompleteData}
                  />
                  <button
                    type="button"
                    onClick={() => onSelectStudent(currentEval.student.id)}
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-bluebell hover:text-imperial transition-colors"
                  >
                    Profile
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5">
                Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="input-field font-medium"
              >
                {dataset.subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code}: {sub.name} ({sub.instructor})
                  </option>
                ))}
              </select>
            </div>

            {/* Attendance Inputs */}
            <div className="pt-2 border-t border-stone-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Attendance ({currentSubSummary?.subject.code})
                </span>
                <span className="text-xs font-mono font-semibold text-imperial tabular-nums">
                  {Number(heldInput) > 0
                    ? `${Math.round((Number(attendedInput) / Number(heldInput)) * 1000) / 10}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-secondary mb-1">
                    Classes Attended
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={attendedInput}
                    onChange={(e) => setAttendedInput(e.target.value)}
                    className="input-field tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-secondary mb-1">
                    Total Classes Held
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={heldInput}
                    onChange={(e) => setHeldInput(e.target.value)}
                    className="input-field tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Assessment Score Inputs */}
            <div className="pt-2 border-t border-stone-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Assessment Marks ({currentSubSummary?.subject.code})
                </span>
                <span className="text-[11px] text-ink-muted">Blank = Missing (null)</span>
              </div>

              <div className="divide-y divide-stone-border border border-stone-border rounded-lg overflow-hidden">
                {currentSubSummary?.assessments.map((item) => {
                  const rawVal = marksInputs[item.assessment.id] ?? '';
                  const numVal = rawVal.trim() === '' ? null : Number(rawVal);
                  const normPct =
                    numVal !== null && !Number.isNaN(numVal)
                      ? Math.round((numVal / item.assessment.maxMarks) * 1000) / 10
                      : null;

                  return (
                    <div
                      key={item.assessment.id}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-surface"
                    >
                      <div>
                        <div className="text-xs font-medium text-ink-primary">
                          {item.assessment.title}
                        </div>
                        <div className="text-[11px] text-ink-muted tabular-nums">
                          Max: {item.assessment.maxMarks} · Weight: {item.assessment.weightage}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={item.assessment.maxMarks}
                          placeholder="NULL"
                          value={rawVal}
                          onChange={(e) =>
                            setMarksInputs({
                              ...marksInputs,
                              [item.assessment.id]: e.target.value,
                            })
                          }
                          className="w-20 px-2.5 py-1.5 text-xs border border-stone-border rounded-md bg-surface text-right tabular-nums focus:outline-none focus:border-bluebell"
                        />
                        <span className="w-14 text-right text-xs font-mono text-ink-secondary tabular-nums">
                          {normPct !== null ? `${normPct}%` : 'MISSING'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {formMessage && (
              <div
                className={`p-3 rounded-md border text-xs ${
                  formMessage.type === 'error'
                    ? 'bg-status-danger-bg border-status-danger-border text-status-danger-text'
                    : 'bg-status-success-bg border-status-success-border text-status-success-text'
                }`}
              >
                {formMessage.text}
              </div>
            )}

            <button type="submit" className="btn-primary w-full">
              <Save className="w-4 h-4" />
              Save Academic Record &amp; Recalculate Risk
            </button>
          </form>
        </section>

        {/* Right Column (7 cols): Validated Batch CSV Importer */}
        <section className="lg:col-span-7 card-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="section-kicker mb-0.5">
                <span className="section-kicker-num">03 //</span>
                <span>Batch Validation Engine</span>
              </div>
              <h2 className="font-display text-base font-bold text-ink-primary flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-imperial" />
                Batch CSV Import &amp; Validation Engine
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Validates student roll numbers, subject codes, max marks, attendance denominators, duplicates, and null values before committing.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setCsvText(SAMPLE_VALID_CSV);
                  setCsvFeedback(null);
                }}
                className="px-2.5 py-1.5 text-xs font-medium text-imperial bg-bluebell-light hover:bg-imperial hover:text-ghost rounded-md border border-bluebell-border transition-colors"
              >
                Load Valid Demo CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  setCsvText(SAMPLE_ERROR_TEST_CSV);
                  setCsvFeedback(null);
                }}
                className="px-2.5 py-1.5 text-xs font-medium text-status-warning-text bg-status-warning-bg hover:opacity-90 rounded-md border border-status-warning-border transition-colors"
              >
                Load Error Test CSV
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* File Upload Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-subtle/60 px-4 py-3 rounded-lg border border-stone-border">
              <div className="text-xs text-ink-secondary">
                Upload a local <code className="font-mono text-ink-primary">.csv</code> file or edit the raw CSV payload directly below.
              </div>
              <label className="btn-secondary text-xs py-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-bluebell" />
                <span>Choose .CSV File</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Editable CSV Buffer */}
            <div>
              <label className="block text-xs font-medium text-ink-primary mb-1.5">
                CSV Payload Preview &amp; Live Editor
              </label>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  setCsvFeedback(null);
                }}
                spellCheck={false}
                className="w-full p-3 text-xs font-mono bg-subtle/40 border border-stone-border rounded-lg text-ink-primary focus:outline-none focus:border-bluebell leading-relaxed"
              />
            </div>

            {validationOutcome.headerError ? (
              <div className="p-3.5 rounded-lg bg-status-danger-bg border border-status-danger-border text-xs text-status-danger-text flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationOutcome.headerError}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-status-success-text">
                      <CheckCircle2 className="w-4 h-4" />
                      {validRows.length} Valid Row(s)
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 font-semibold ${
                        invalidRows.length > 0 ? 'text-status-danger-text' : 'text-ink-muted'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      {invalidRows.length} Invalid Row(s)
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={validRows.length === 0}
                    onClick={handleCommitCsv}
                    className="btn-primary text-xs py-1.5 disabled:opacity-40"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Commit {validRows.length} Valid Row(s)
                  </button>
                </div>

                {csvFeedback && (
                  <div className="p-3 rounded-lg bg-status-success-bg border border-status-success-border text-xs text-status-success-text">
                    {csvFeedback}
                  </div>
                )}

                {/* Row-by-row validation table */}
                <div className="border border-stone-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-stone-border bg-subtle/70 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                          <th className="py-2.5 px-3.5">Row</th>
                          <th className="py-2.5 px-3.5">Student</th>
                          <th className="py-2.5 px-3.5">Subject</th>
                          <th className="py-2.5 px-3.5">Record Payload</th>
                          <th className="py-2.5 px-3.5">Validation Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-border text-xs">
                        {validationOutcome.rows.map((row) => (
                          <tr
                            key={row.rowNumber}
                            className={
                              row.isValid ? 'bg-surface' : 'bg-status-danger-bg/40'
                            }
                          >
                            <td className="py-2.5 px-3.5 font-mono text-ink-muted tabular-nums">
                              #{row.rowNumber}
                            </td>
                            <td className="py-2.5 px-3.5">
                              <div className="font-mono font-medium text-ink-primary">
                                {row.rollNumber}
                              </div>
                              {row.studentName && (
                                <div className="text-[11px] text-ink-secondary">
                                  {row.studentName}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono text-ink-primary">
                              {row.subjectCode}
                            </td>
                            <td className="py-2.5 px-3.5 tabular-nums text-ink-secondary">
                              {row.recordType === 'SCORE' ? (
                                <span>
                                  Asmt #{row.assessmentSequence ?? '?'}:{' '}
                                  <strong className="text-ink-primary">
                                    {row.marksObtained === null
                                      ? 'MISSING (null)'
                                      : row.marksObtained ?? '?'}
                                  </strong>
                                  {row.maxMarks ? ` / ${row.maxMarks}` : ''}
                                </span>
                              ) : (
                                <span>
                                  Attendance:{' '}
                                  <strong className="text-ink-primary">
                                    {row.classesAttended ?? '?'} / {row.classesHeld ?? '?'}
                                  </strong>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5">
                              {row.isValid ? (
                                <div>
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-status-success-text">
                                    <Check className="w-3.5 h-3.5" />
                                    Ready to import
                                  </span>
                                  {row.warnings.map((w, idx) => (
                                    <div
                                      key={idx}
                                      className="text-[11px] text-status-warning-text mt-0.5"
                                    >
                                      Note: {w}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  {row.errors.map((err, idx) => (
                                    <div
                                      key={idx}
                                      className="text-[11px] font-medium text-status-danger-text"
                                    >
                                      • {err}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
