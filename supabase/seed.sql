-- =============================================================================
-- ACADEMIC INSIGHT — SYNTHETIC SEED DATA (SUPABASE POSTGRESQL)
-- =============================================================================
-- All names, emails, roll numbers, and academic records below are 100% fictional.
-- Run after supabase/schema.sql to seed the database.

INSERT INTO public.subjects (id, code, name, semester, credits, instructor, pass_percentage, min_attendance_percentage)
VALUES
  ('sub-cs401', 'CS401', 'Data Structures & Algorithms', 4, 4, 'Dr. Aris Thorne', 50.0, 75.0),
  ('sub-cs402', 'CS402', 'Database Management Systems', 4, 4, 'Prof. Meera Krishnan', 50.0, 75.0),
  ('sub-cs403', 'CS403', 'Operating Systems', 4, 4, 'Dr. Julian Vance', 50.0, 75.0),
  ('sub-ma401', 'MA401', 'Linear Algebra & Probability', 4, 3, 'Dr. Elena Rostova', 50.0, 75.0),
  ('sub-cs404', 'CS404', 'Computer Networks', 4, 3, 'Prof. Vikram Sen', 50.0, 75.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.assessments (id, subject_id, title, category, max_marks, weightage, sequence_order, assessment_date)
VALUES
  ('asmt-cs401-1', 'sub-cs401', 'Quiz 1: Complexity & Trees', 'QUIZ', 20, 20, 1, '2026-08-14'),
  ('asmt-cs401-2', 'sub-cs401', 'Midterm Examination', 'MIDTERM', 50, 40, 2, '2026-09-12'),
  ('asmt-cs401-3', 'sub-cs401', 'Assessment 2: Graphs & DP', 'LAB_ASSESSMENT', 30, 40, 3, '2026-10-02'),

  ('asmt-cs402-1', 'sub-cs402', 'Quiz 1: Relational Algebra', 'QUIZ', 20, 20, 1, '2026-08-16'),
  ('asmt-cs402-2', 'sub-cs402', 'Midterm Examination', 'MIDTERM', 50, 40, 2, '2026-09-14'),
  ('asmt-cs402-3', 'sub-cs402', 'Assessment 2: SQL & Normalization', 'LAB_ASSESSMENT', 30, 40, 3, '2026-10-04'),

  ('asmt-cs403-1', 'sub-cs403', 'Quiz 1: Process Scheduling', 'QUIZ', 20, 20, 1, '2026-08-18'),
  ('asmt-cs403-2', 'sub-cs403', 'Midterm Examination', 'MIDTERM', 50, 40, 2, '2026-09-16'),
  ('asmt-cs403-3', 'sub-cs403', 'Assessment 2: Concurrency & Paging', 'LAB_ASSESSMENT', 30, 40, 3, '2026-10-05'),

  ('asmt-ma401-1', 'sub-ma401', 'Quiz 1: Vector Spaces', 'QUIZ', 20, 20, 1, '2026-08-20'),
  ('asmt-ma401-2', 'sub-ma401', 'Midterm Examination', 'MIDTERM', 50, 40, 2, '2026-09-18'),
  ('asmt-ma401-3', 'sub-ma401', 'Assessment 2: Eigenvalues & Distributions', 'LAB_ASSESSMENT', 30, 40, 3, '2026-10-06'),

  ('asmt-cs404-1', 'sub-cs404', 'Quiz 1: OSI & Data Link Layer', 'QUIZ', 20, 20, 1, '2026-08-22'),
  ('asmt-cs404-2', 'sub-cs404', 'Midterm Examination', 'MIDTERM', 50, 40, 2, '2026-09-20'),
  ('asmt-cs404-3', 'sub-cs404', 'Assessment 2: Routing & TCP/IP', 'LAB_ASSESSMENT', 30, 40, 3, '2026-10-07')
ON CONFLICT (id) DO NOTHING;

-- Note: Full 20-student seed records are automatically synchronized by the application's
-- seed utility (`src/services/dataService.ts`) when connected to an empty Supabase table
-- or initialized in local persistence.
