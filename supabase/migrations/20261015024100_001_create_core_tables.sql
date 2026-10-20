/*
# Create Core Tables for Elmasry Academy LMS

1. New Tables
- `students`: Student directory with background info (name, phone, email, employment/graduation status, college, notes)
- `courses`: Course catalog with cost, level, duration, capacity, resource links
- `cash_boxes`: Treasury/cash management (Main, Online, Bank, Petty Cash types)
- `enrollments`: Links students to courses with agreed cost and status
- `payments`: Payment records tied to enrollments and cash boxes, with void support
- `expenses`: Operating costs deducted from cash boxes, optionally linked to courses
- `cash_transfers`: Inter-box money transfers

2. Security
- RLS enabled on ALL tables
- Single-tenant admin app (no public signup) — policies allow anon + authenticated full CRUD
- All financial data is intentionally shared within the single admin context

3. Important Notes
- All monetary columns use numeric(12,2) for precision
- enrollments has a UNIQUE constraint on (student_id, course_id) to prevent duplicate enrollment
- payments has voided/voided_at columns for safe reversal (never hard-delete financial records)
- cash_boxes has archived flag for soft-archive
- courses has nullable max_students (NULL = unlimited seats)
*/

-- ===== STUDENTS =====
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  employment_status text DEFAULT 'Unemployed' CHECK (employment_status IN ('Employed', 'Unemployed', 'Student', 'Freelancer')),
  grad_status text DEFAULT 'Undergrad' CHECK (grad_status IN ('Graduate', 'Undergrad')),
  grad_college text,
  previous_courses text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_students" ON students;
CREATE POLICY "anon_select_students" ON students FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_students" ON students;
CREATE POLICY "anon_insert_students" ON students FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_students" ON students;
CREATE POLICY "anon_update_students" ON students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_students" ON students;
CREATE POLICY "anon_delete_students" ON students FOR DELETE TO anon, authenticated USING (true);

-- ===== COURSES =====
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name text NOT NULL,
  default_cost numeric(12,2) DEFAULT 0,
  availability_status text DEFAULT 'Upcoming' CHECK (availability_status IN ('Upcoming', 'Active', 'Closed')),
  level text DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  duration_weeks int DEFAULT 4,
  max_students int,
  prerequisite_courses text,
  description text,
  link_whatsapp text,
  link_tasks text,
  link_drive text,
  link_sources text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_courses" ON courses;
CREATE POLICY "anon_select_courses" ON courses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_courses" ON courses;
CREATE POLICY "anon_insert_courses" ON courses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_courses" ON courses;
CREATE POLICY "anon_update_courses" ON courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_courses" ON courses;
CREATE POLICY "anon_delete_courses" ON courses FOR DELETE TO anon, authenticated USING (true);

-- ===== CASH_BOXES =====
CREATE TABLE IF NOT EXISTS cash_boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  box_type text DEFAULT 'Main' CHECK (box_type IN ('Main', 'Branch', 'Online', 'Petty Cash')),
  owner text DEFAULT 'م/ أحمد الفلاح',
  opening_balance numeric(12,2) DEFAULT 0,
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE cash_boxes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_cash_boxes" ON cash_boxes;
CREATE POLICY "anon_select_cash_boxes" ON cash_boxes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_cash_boxes" ON cash_boxes;
CREATE POLICY "anon_insert_cash_boxes" ON cash_boxes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_cash_boxes" ON cash_boxes;
CREATE POLICY "anon_update_cash_boxes" ON cash_boxes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_cash_boxes" ON cash_boxes;
CREATE POLICY "anon_delete_cash_boxes" ON cash_boxes FOR DELETE TO anon, authenticated USING (true);

-- ===== ENROLLMENTS =====
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  agreed_cost numeric(12,2) NOT NULL DEFAULT 0,
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Dropped')),
  attendance_status text DEFAULT 'Regular' CHECK (attendance_status IN ('Regular', 'Irregular', 'N/A')),
  enrolled_on date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id)
);
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_enrollments" ON enrollments;
CREATE POLICY "anon_select_enrollments" ON enrollments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_enrollments" ON enrollments;
CREATE POLICY "anon_insert_enrollments" ON enrollments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_enrollments" ON enrollments;
CREATE POLICY "anon_update_enrollments" ON enrollments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_enrollments" ON enrollments;
CREATE POLICY "anon_delete_enrollments" ON enrollments FOR DELETE TO anon, authenticated USING (true);

-- ===== PAYMENTS =====
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  cash_box_id uuid NOT NULL REFERENCES cash_boxes(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Vodafone Cash', 'InstaPay')),
  receipt_ref text,
  notes text,
  voided boolean DEFAULT false,
  voided_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_payments" ON payments;
CREATE POLICY "anon_select_payments" ON payments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_payments" ON payments;
CREATE POLICY "anon_update_payments" ON payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_payments" ON payments;
CREATE POLICY "anon_delete_payments" ON payments FOR DELETE TO anon, authenticated USING (true);

-- ===== EXPENSES =====
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_box_id uuid NOT NULL REFERENCES cash_boxes(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  category text DEFAULT 'Other' CHECK (category IN ('Rent', 'Salary', 'Supplies', 'Hardware', 'Marketing', 'Utilities', 'Other')),
  description text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_expenses" ON expenses;
CREATE POLICY "anon_select_expenses" ON expenses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_expenses" ON expenses;
CREATE POLICY "anon_insert_expenses" ON expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_expenses" ON expenses;
CREATE POLICY "anon_update_expenses" ON expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_expenses" ON expenses;
CREATE POLICY "anon_delete_expenses" ON expenses FOR DELETE TO anon, authenticated USING (true);

-- ===== CASH_TRANSFERS =====
CREATE TABLE IF NOT EXISTS cash_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_box_id uuid NOT NULL REFERENCES cash_boxes(id) ON DELETE CASCADE,
  to_box_id uuid NOT NULL REFERENCES cash_boxes(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  transfer_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now(),
  CHECK (from_box_id != to_box_id)
);
ALTER TABLE cash_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_cash_transfers" ON cash_transfers;
CREATE POLICY "anon_select_cash_transfers" ON cash_transfers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_cash_transfers" ON cash_transfers;
CREATE POLICY "anon_insert_cash_transfers" ON cash_transfers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_cash_transfers" ON cash_transfers;
CREATE POLICY "anon_update_cash_transfers" ON cash_transfers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_cash_transfers" ON cash_transfers;
CREATE POLICY "anon_delete_cash_transfers" ON cash_transfers FOR DELETE TO anon, authenticated USING (true);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment ON payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payments_cash_box ON payments(cash_box_id);
CREATE INDEX IF NOT EXISTS idx_payments_voided ON payments(voided);
CREATE INDEX IF NOT EXISTS idx_expenses_cash_box ON expenses(cash_box_id);
CREATE INDEX IF NOT EXISTS idx_expenses_course ON expenses(course_id);
CREATE INDEX IF NOT EXISTS idx_cash_transfers_from ON cash_transfers(from_box_id);
CREATE INDEX IF NOT EXISTS idx_cash_transfers_to ON cash_transfers(to_box_id);
