import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Download,
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
      text: `Updated ${currentSubSummary.subject.code} records for ${currentEval?.student.fullName}.`,
    });
  };

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
    setCsvFeedback(`Imported ${count} validated record(s).`);
  };

  return (
    <div className="space-y-8 lg:space-y-10">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-border pb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-[28px] lg:text-[30px] font-bold text-carbon tracking-tight">
            Academic records
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Update individual marks and attendance or import validated CSV files.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              handleDownloadSampleCsv(SAMPLE_VALID_CSV, 'academic_insight_valid_sample.csv')
            }
            className="btn-secondary"
          >
            <Download className="w-4 h-4 text-bluebell" />
            <span>Sample CSV</span>
          </button>
          <button
            type="button"
            onClick={() =>
              handleDownloadSampleCsv(SAMPLE_ERROR_TEST_CSV, 'academic_insight_error_test.csv')
            }
            className="btn-secondary"
          >
            <Download className="w-4 h-4 text-bluebell" />
            <span>Error test CSV</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Single Student & Subject Record Editor */}
        <section className="lg:col-span-5 card-surface overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-border">
            <h2 className="font-display text-lg font-semibold text-carbon">
              Student record editor
            </h2>
          </div>

          <form onSubmit={handleSaveSingleRecord} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-carbon mb-1.5">
                Student
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="input-field font-medium"
              >
                {evaluations.map((ev) => (
                  <option key={ev.student.id} value={ev.student.id}>
                    {ev.student.rollNumber} — {ev.student.fullName}
                  </option>
                ))}
              </select>
            </div>

            {currentEval && (
              <div className="p-4 rounded-lg bg-subtle/70 border border-stone-border flex items-center justify-between gap-2">
                <div className="text-xs text-ink-secondary tabular-nums">
                  Score{' '}
                  <strong className="text-carbon">
                    {currentEval.overallScorePercentage !== null
                      ? `${currentEval.overallScorePercentage}%`
                      : 'N/A'}
                  </strong>{' '}
                  · Attendance{' '}
                  <strong className="text-carbon">
                    {currentEval.overallAttendancePercentage !== null
                      ? `${currentEval.overallAttendancePercentage}%`
                      : 'N/A'}
                  </strong>
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
                    <span>Profile</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-carbon mb-1.5">
                Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="input-field font-medium"
              >
                {dataset.subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code}: {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Attendance Inputs */}
            <div className="pt-4 border-t border-stone-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-carbon">
                  Attendance
                </span>
                <span className="text-xs font-mono font-semibold text-imperial tabular-nums">
                  {Number(heldInput) > 0
                    ? `${Math.round((Number(attendedInput) / Number(heldInput)) * 1000) / 10}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">
                    Attended
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
                  <label className="block text-xs text-ink-secondary mb-1.5">
                    Classes held
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
            <div className="pt-4 border-t border-stone-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-carbon">
                  Assessment marks
                </span>
                <span className="text-xs text-ink-muted">Blank = unrecorded</span>
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
                      className="flex items-center justify-between gap-3 px-4 py-3 bg-surface"
                    >
                      <div>
                        <div className="text-sm font-medium text-carbon">
                          {item.assessment.title}
                        </div>
                        <div className="text-xs text-ink-muted tabular-nums">
                          Max {item.assessment.maxMarks} · Weight {item.assessment.weightage}%
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={item.assessment.maxMarks}
                          placeholder="—"
                          value={rawVal}
                          onChange={(e) =>
                            setMarksInputs({
                              ...marksInputs,
                              [item.assessment.id]: e.target.value,
                            })
                          }
                          className="w-20 px-2.5 py-1.5 text-sm border border-stone-border rounded-lg bg-surface text-right tabular-nums focus:outline-none focus:border-bluebell"
                        />
                        <span className="w-14 text-right text-xs font-mono text-ink-secondary tabular-nums">
                          {normPct !== null ? `${normPct}%` : 'Missing'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {formMessage && (
              <div
                className={`p-3.5 rounded-lg border text-sm ${
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
              <span>Save changes</span>
            </button>
          </form>
        </section>

        {/* Right Column (7 cols): Validated Batch CSV Importer */}
        <section className="lg:col-span-7 card-surface overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-carbon">
              CSV batch import
            </h2>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setCsvText(SAMPLE_VALID_CSV);
                  setCsvFeedback(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-imperial bg-bluebell-light hover:bg-imperial hover:text-ghost rounded-lg border border-bluebell-border transition-colors"
              >
                Load valid demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setCsvText(SAMPLE_ERROR_TEST_CSV);
                  setCsvFeedback(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-status-warning-text bg-status-warning-bg hover:opacity-90 rounded-lg border border-status-warning-border transition-colors"
              >
                Load error test
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-subtle/60 px-4 py-3 rounded-lg border border-stone-border">
              <span className="text-sm text-ink-secondary">
                Upload a <code className="font-mono text-carbon">.csv</code> file or edit rows below.
              </span>
              <label className="btn-secondary py-1.5 px-3 text-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-bluebell" />
                <span>Choose file</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-carbon mb-1.5">
                CSV data
              </label>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  setCsvFeedback(null);
                }}
                spellCheck={false}
                className="w-full p-3.5 text-xs font-mono bg-subtle/40 border border-stone-border rounded-lg text-carbon focus:outline-none focus:border-bluebell leading-relaxed"
              />
            </div>

            {validationOutcome.headerError ? (
              <div className="p-4 rounded-lg bg-status-danger-bg border border-status-danger-border text-sm text-status-danger-text flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationOutcome.headerError}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-status-success-text">
                      <CheckCircle2 className="w-4 h-4" />
                      {validRows.length} valid
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 font-semibold ${
                        invalidRows.length > 0 ? 'text-status-danger-text' : 'text-ink-muted'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      {invalidRows.length} invalid
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={validRows.length === 0}
                    onClick={handleCommitCsv}
                    className="btn-primary disabled:opacity-40"
                  >
                    <Check className="w-4 h-4" />
                    <span>Import {validRows.length} row(s)</span>
                  </button>
                </div>

                {csvFeedback && (
                  <div className="p-3.5 rounded-lg bg-status-success-bg border border-status-success-border text-sm text-status-success-text">
                    {csvFeedback}
                  </div>
                )}

                <div className="border border-stone-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-stone-border bg-subtle/70 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                          <th className="py-3 px-4">Row</th>
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4">Value</th>
                          <th className="py-3 px-4">Status</th>
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
                            <td className="py-3 px-4 font-mono text-ink-muted tabular-nums">
                              #{row.rowNumber}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-mono font-medium text-carbon">
                                {row.rollNumber}
                              </div>
                              {row.studentName && (
                                <div className="text-ink-secondary">
                                  {row.studentName}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-carbon">
                              {row.subjectCode}
                            </td>
                            <td className="py-3 px-4 tabular-nums text-ink-secondary">
                              {row.recordType === 'SCORE' ? (
                                <span>
                                  Exam #{row.assessmentSequence ?? '?'}:{' '}
                                  <strong className="text-carbon">
                                    {row.marksObtained === null
                                      ? 'Missing'
                                      : row.marksObtained ?? '?'}
                                  </strong>
                                  {row.maxMarks ? `/${row.maxMarks}` : ''}
                                </span>
                              ) : (
                                <span>
                                  Attendance:{' '}
                                  <strong className="text-carbon">
                                    {row.classesAttended ?? '?'}/{row.classesHeld ?? '?'}
                                  </strong>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {row.isValid ? (
                                <div>
                                  <span className="inline-flex items-center gap-1 font-medium text-status-success-text">
                                    <Check className="w-3.5 h-3.5" />
                                    Ready
                                  </span>
                                  {row.warnings.map((w, idx) => (
                                    <div
                                      key={idx}
                                      className="text-status-warning-text mt-0.5"
                                    >
                                      {w}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  {row.errors.map((err, idx) => (
                                    <div
                                      key={idx}
                                      className="font-medium text-status-danger-text"
                                    >
                                      {err}
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
