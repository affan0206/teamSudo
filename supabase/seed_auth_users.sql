-- =============================================================================
-- ACADEMIC INSIGHT — AUTHORIZED ACCOUNT PROVISIONING SCRIPT (SUPABASE SQL EDITOR)
-- =============================================================================
-- Public self-registration is intentionally disabled so arbitrary visitors cannot
-- register as FACULTY or claim another student's identity.
-- Run this script in the Supabase SQL Editor (after running supabase/schema.sql)
-- to provision authorized test accounts for evaluation.

DO $$
DECLARE
  faculty_uid UUID := '11111111-1111-4111-8111-111111111101';
  stu001_uid  UUID := '22222222-2222-4222-8222-222222222001';
  stu007_uid  UUID := '22222222-2222-4222-8222-222222222007';
  stu015_uid  UUID := '22222222-2222-4222-8222-222222222015';
BEGIN
  -- Ensure synthetic student rows exist for foreign-key binding
  INSERT INTO public.students (id, roll_number, full_name, email, department, semester, section, advisor_name)
  VALUES
    ('stu-001', 'CS2024-001', 'Aarav Mehta', 'aarav.mehta@demo.university.edu', 'Computer Science & Engineering', 4, 'A', 'Dr. Aris Thorne'),
    ('stu-007', 'CS2024-007', 'Rohan Deshmukh', 'rohan.deshmukh@demo.university.edu', 'Computer Science & Engineering', 4, 'A', 'Prof. Meera Krishnan'),
    ('stu-015', 'CS2024-015', 'Priya Sundaram', 'priya.sundaram@demo.university.edu', 'Computer Science & Engineering', 4, 'A', 'Dr. Aris Thorne')
  ON CONFLICT (id) DO NOTHING;

  -- 1. Provision Authorized Faculty Account: aris.thorne@demo.university.edu
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    faculty_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'aris.thorne@demo.university.edu',
    crypt('Faculty#2026!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Dr. Aris Thorne"}',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_profiles (id, email, full_name, role, student_id, department, assigned_title)
  VALUES (
    faculty_uid,
    'aris.thorne@demo.university.edu',
    'Dr. Aris Thorne',
    'FACULTY',
    NULL,
    'Computer Science & Engineering',
    'Faculty Advisor & Academic Coordinator'
  ) ON CONFLICT (id) DO NOTHING;

  -- 2. Provision Authorized Student Account (High Risk): aarav.mehta@demo.university.edu -> stu-001
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    stu001_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'aarav.mehta@demo.university.edu',
    crypt('Student#001!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Aarav Mehta"}',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_profiles (id, email, full_name, role, student_id, department, assigned_title)
  VALUES (
    stu001_uid,
    'aarav.mehta@demo.university.edu',
    'Aarav Mehta',
    'STUDENT',
    'stu-001',
    'Computer Science & Engineering',
    'B.Tech CSE · Semester 4 (CS2024-001)'
  ) ON CONFLICT (id) DO NOTHING;

  -- 3. Provision Authorized Student Account (Medium Risk): rohan.deshmukh@demo.university.edu -> stu-007
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    stu007_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rohan.deshmukh@demo.university.edu',
    crypt('Student#007!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Rohan Deshmukh"}',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_profiles (id, email, full_name, role, student_id, department, assigned_title)
  VALUES (
    stu007_uid,
    'rohan.deshmukh@demo.university.edu',
    'Rohan Deshmukh',
    'STUDENT',
    'stu-007',
    'Computer Science & Engineering',
    'B.Tech CSE · Semester 4 (CS2024-007)'
  ) ON CONFLICT (id) DO NOTHING;

  -- 4. Provision Authorized Student Account (Low Risk): priya.sundaram@demo.university.edu -> stu-015
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    stu015_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'priya.sundaram@demo.university.edu',
    crypt('Student#015!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Priya Sundaram"}',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_profiles (id, email, full_name, role, student_id, department, assigned_title)
  VALUES (
    stu015_uid,
    'priya.sundaram@demo.university.edu',
    'Priya Sundaram',
    'STUDENT',
    'stu-015',
    'Computer Science & Engineering',
    'B.Tech CSE · Semester 4 (CS2024-015)'
  ) ON CONFLICT (id) DO NOTHING;
END $$;
