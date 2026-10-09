-- =============================================================================
-- ACADEMIC INSIGHT — POSTGRESQL SCHEMA & ROLE-BASED ROW LEVEL SECURITY (SUPABASE)
-- =============================================================================
-- Enforces strict database-level access control between FACULTY and STUDENT roles.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    roll_number VARCHAR(32) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL DEFAULT 'Computer Science & Engineering',
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL DEFAULT 'A',
    advisor_name VARCHAR(120) NOT NULL DEFAULT 'Dr. Aris Thorne',
    enrollment_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER PROFILES TABLE (Server-Controlled Role & Identity Mapping)
-- Links Supabase auth.users(id) to an authorized role ('FACULTY' or 'STUDENT')
-- and, for students, binds them strictly to their single student_id.
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(160) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('FACULTY', 'STUDENT')),
    student_id TEXT NULL UNIQUE REFERENCES public.students(id) ON DELETE SET NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'Computer Science & Engineering',
    assigned_title VARCHAR(120) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_profile_role_student_binding CHECK (
        (role = 'STUDENT' AND student_id IS NOT NULL) OR
        (role = 'FACULTY' AND student_id IS NULL)
    )
);

-- 3. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(140) NOT NULL,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    credits INTEGER NOT NULL DEFAULT 4 CHECK (credits BETWEEN 1 AND 6),
    instructor VARCHAR(120) NOT NULL,
    pass_percentage NUMERIC(5,2) NOT NULL DEFAULT 50.00 CHECK (pass_percentage > 0 AND pass_percentage <= 100),
    min_attendance_percentage NUMERIC(5,2) NOT NULL DEFAULT 75.00 CHECK (min_attendance_percentage > 0 AND min_attendance_percentage <= 100)
);

-- 4. ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS public.enrollments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    UNIQUE (student_id, subject_id)
);

-- 5. ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assessments (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    category VARCHAR(32) NOT NULL CHECK (category IN ('QUIZ', 'MIDTERM', 'LAB_ASSESSMENT', 'ENDTERM')),
    max_marks NUMERIC(6,2) NOT NULL CHECK (max_marks > 0),
    weightage NUMERIC(5,2) NOT NULL CHECK (weightage > 0 AND weightage <= 100),
    sequence_order INTEGER NOT NULL CHECK (sequence_order >= 1),
    assessment_date DATE NOT NULL,
    UNIQUE (subject_id, sequence_order)
);

-- 6. ASSESSMENT SCORES TABLE
CREATE TABLE IF NOT EXISTS public.assessment_scores (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    assessment_id TEXT NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(6,2) NULL CHECK (marks_obtained IS NULL OR marks_obtained >= 0),
    status VARCHAR(24) NOT NULL DEFAULT 'GRADED' CHECK (status IN ('GRADED', 'MISSING', 'EXCUSED')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, assessment_id)
);

-- 7. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    classes_attended INTEGER NOT NULL CHECK (classes_attended >= 0),
    classes_held INTEGER NOT NULL CHECK (classes_held >= 0 AND classes_held >= classes_attended),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, subject_id)
);

-- 8. INTERVENTIONS TABLE
CREATE TABLE IF NOT EXISTS public.interventions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id TEXT NULL REFERENCES public.subjects(id) ON DELETE SET NULL,
    risk_level_at_creation VARCHAR(24) NOT NULL CHECK (risk_level_at_creation IN ('HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT_DATA')),
    trigger_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    action_title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    assigned_faculty VARCHAR(120) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED')),
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    follow_up_date DATE NOT NULL,
    outcome_notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. RISK THRESHOLDS CONFIGURATION TABLE (Faculty-managed)
CREATE TABLE IF NOT EXISTS public.risk_thresholds_config (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    critical_attendance_pct NUMERIC(5,2) NOT NULL DEFAULT 75.00,
    warning_attendance_pct NUMERIC(5,2) NOT NULL DEFAULT 85.00,
    passing_score_pct NUMERIC(5,2) NOT NULL DEFAULT 50.00,
    borderline_score_pct NUMERIC(5,2) NOT NULL DEFAULT 60.00,
    critical_recent_assessment_pct NUMERIC(5,2) NOT NULL DEFAULT 40.00,
    severe_drop_points NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    moderate_drop_points NUMERIC(5,2) NOT NULL DEFAULT 8.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_profiles_student ON public.user_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_subject ON public.enrollments(subject_id);
CREATE INDEX IF NOT EXISTS idx_scores_student ON public.assessment_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_scores_assessment ON public.assessment_scores(assessment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_interventions_student ON public.interventions(student_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON public.interventions(status);

-- =============================================================================
-- TRUSTED SERVER-SIDE RBAC HELPER FUNCTIONS (SECURITY DEFINER)
-- =============================================================================
-- Role and student identity are resolved strictly from public.user_profiles
-- using auth.uid(), never from client parameters.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS VARCHAR
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT student_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'STUDENT';
$$;

-- =============================================================================
-- STRICT ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_thresholds_config ENABLE ROW LEVEL SECURITY;

-- Drop any legacy permissive policies if present
DROP POLICY IF EXISTS "Demo mode access on synthetic students" ON public.students;
DROP POLICY IF EXISTS "Demo mode access on synthetic subjects" ON public.subjects;
DROP POLICY IF EXISTS "Demo mode access on synthetic enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Demo mode access on synthetic assessments" ON public.assessments;
DROP POLICY IF EXISTS "Demo mode access on synthetic scores" ON public.assessment_scores;
DROP POLICY IF EXISTS "Demo mode access on synthetic attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Demo mode access on synthetic interventions" ON public.interventions;

-- 1. USER PROFILES POLICIES
-- Users can read their own profile; Faculty can read cohort user profiles.
-- No client can insert/update/escalate their own role (provisioned by admin/service role only).
CREATE POLICY "Users can read own profile or faculty can read all"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.current_user_role() = 'FACULTY');

-- 2. STUDENTS POLICIES
-- Faculty can view and manage all students; Students can ONLY view their own record.
CREATE POLICY "Faculty read all students, Student reads own row"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'FACULTY'
    OR (public.current_user_role() = 'STUDENT' AND id = public.current_student_id())
  );

CREATE POLICY "Only faculty can modify students"
  ON public.students FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'FACULTY')
  WITH CHECK (public.current_user_role() = 'FACULTY');

-- 3. SUBJECTS & ASSESSMENTS POLICIES
-- Authenticated faculty and students can view course catalog & assessment definitions;
-- only faculty can modify them.
CREATE POLICY "Authenticated users read subjects"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (public.current_user_role() IN ('FACULTY', 'STUDENT'));

CREATE POLICY "Only faculty modify subjects"
  ON public.subjects FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'FACULTY')
  WITH CHECK (public.current_user_role() = 'FACULTY');

CREATE POLICY "Authenticated users read assessments"
  ON public.assessments FOR SELECT
  TO authenticated
  USING (public.current_user_role() IN ('FACULTY', 'STUDENT'));

CREATE POLICY "Only faculty modify assessments"
  ON public.assessments FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'FACULTY')
  WITH CHECK (public.current_user_role() = 'FACULTY');

-- 4. ENROLLMENTS POLICIES
CREATE POLICY "Faculty read all enrollments, Student reads own"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'FACULTY'
    OR (public.current_user_role() = 'STUDENT' AND student_id = public.current_student_id())
  );

CREATE POLICY "Only faculty modify enrollments"
  ON public.enrollments FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'FACULTY')
  WITH CHECK (public.current_user_role() = 'FACULTY');

-- 5. ASSESSMENT SCORES POLICIES
-- Students can ONLY SELECT scores where student_id matches their own server-resolved student_id.
-- Students CANNOT insert, update, or delete scores.
CREATE POLICY "Faculty read all scores, Student reads own scores"
  ON public.assessment_scores FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'FACULTY'
    OR (public.current_user_role() = 'STUDENT' AND student_id = public.current_student_id())
  );

CREATE POLICY "Only faculty insert or update scores"
  ON public.assessment_scores FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'FACULTY')
  WITH CHECK (public.current_user_role() = 'FACULTY');

-- 6. ATTENDANCE RECORDS POLICIES
CREATE POLICY "Faculty read all attendance, Student reads own attendance"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'FACULTY'
    OR (public.current_user_role() = 'STUDENT' AND student_id = public.current_student_id())
  );

CREATE POLICY "Only faculty insert or update attendance"
  ON public.attendance_records FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'FACULTY')
  WITH CHECK (public.current_user_role() = 'FACULTY');

-- 7. INTERVENTIONS POLICIES
CREATE POLICY "Faculty read all interventions, Student reads own interventions"
  ON public.interventions FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'FACULTY'
    OR (public.current_user_role() = 'STUDENT' AND student_id = public.current_student_id())
  );

CREATE POLICY "Only faculty manage interventions"
  ON public.interventions FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'FACULTY')
  WITH CHECK (public.current_user_role() = 'FACULTY');

-- 8. RISK THRESHOLDS CONFIG POLICIES
CREATE POLICY "Authenticated users read risk thresholds"
  ON public.risk_thresholds_config FOR SELECT
  TO authenticated
  USING (public.current_user_role() IN ('FACULTY', 'STUDENT'));

CREATE POLICY "Only faculty update risk thresholds"
  ON public.risk_thresholds_config FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'FACULTY')
  WITH CHECK (public.current_user_role() = 'FACULTY');
