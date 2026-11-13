# Local Migration Inventory — Elmasry Academy LMS

> **Repository Directory:** `D:\Fel7o Gamal Project\LMS_platform-main\LMS_platform-main\supabase\migrations`  
> **Total Migration Files Found:** 20 files  

## 1. Summary of Migrations Inventory

| # | Version | Filename | Size (Bytes) | Git Tracking | Draft? | SHA-256 (First 16 chars) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `20261015024100` | `20261015024100_001_create_core_tables.sql` | 10,673 | `Tracked (Git)` | `NO` | `0a4586a39454996d...` |
| 2 | `20261015024134` | `20261015024134_002_create_database_views.sql` | 6,035 | `Tracked (Git)` | `NO` | `c94b4623ddecc094...` |
| 3 | `20261015024155` | `20261015024155_003_create_rpc_functions.sql` | 7,441 | `Tracked (Git)` | `NO` | `3b669e7fde150fcc...` |
| 4 | `20261015024209` | `20261015024209_004_fix_constraint_and_seed.sql` | 880 | `Tracked (Git)` | `NO` | `51c1f52157909162...` |
| 5 | `202610210005` | `202610210005_production_hardening.sql` | 25,139 | `Tracked (Git)` | `NO` | `c434bdc7c2a0ccb0...` |
| 6 | `202610210006` | `202610210006_security_and_authorization_hardening.sql` | 15,057 | `Tracked (Git)` | `NO` | `2476c9cb19e38329...` |
| 7 | `202610210007` | `202610210007_purge_legacy_rls_and_revoke_public.sql` | 8,137 | `Tracked (Git)` | `NO` | `5b6f2351acdd9b23...` |
| 8 | `202610210008` | `202610210008_protect_cash_boxes_opening_balance.sql` | 9,245 | `Tracked (Git)` | `NO` | `75d418a778b8e07c...` |
| 9 | `20261021171218` | `20261021171218_allow_cash_box_creator_nullification_on_auth_delete.sql` | 3,301 | `Tracked (Git)` | `NO` | `8b6062c2ac8253e2...` |
| 10 | `20261021214608` | `20261021214608_add_login_alert_dedupe.sql` | 753 | `Tracked (Git)` | `NO` | `f8f29a9cac267f12...` |
| 11 | `20261021223822` | `20261021223822_rbac_catalog_and_authorization_primitives.sql` | 15,340 | `Tracked (Git)` | `NO` | `b3bf1746b26fcb0b...` |
| 12 | `20261021224440` | `20261021224440_rbac_role_aware_data_endpoints.sql` | 23,196 | `Tracked (Git)` | `NO` | `053ee2d38796214f...` |
| 13 | `20261021224905` | `20261021224905_rbac_permission_checked_write_endpoints.sql` | 34,121 | `Tracked (Git)` | `NO` | `c6fc9da6599a5c2d...` |
| 14 | `20261022225500` | `20261022225500_rbac_multiple_platform_owners.sql` | 6,772 | `Tracked (Git)` | `NO` | `9600893d725331f6...` |
| 15 | `20261022230000` | `20261022230000_rbac_authorization_cutover.sql` | 6,895 | `Tracked (Git)` | `YES (Draft Only)` | `f0cd46ca95ec75c5...` |
| 16 | `20261023090000` | `20261023090000_branding_and_admin_avatars.sql` | 7,302 | `Tracked (Git)` | `YES (Draft Only)` | `cd03219c19380e13...` |
| 17 | `20261023100000` | `20261023100000_platform_audit_and_telegram_outbox.sql` | 19,088 | `Tracked (Git)` | `YES (Draft Only)` | `a16ef1f39e4e38f8...` |
| 18 | `20261023110000` | `20261023110000_telegram_notification_language.sql` | 4,001 | `Tracked (Git)` | `NO` | `537f726e32ca0104...` |
| 19 | `20261030120000` | `20261030120000_student_profile_directory_v2.sql` | 9,087 | `Untracked (??)` | `NO` | `54c20dcf1d2a2d70...` |
| 20 | `20261030130000` | `20261030130000_course_enrollment_currency_v2.sql` | 30,301 | `Untracked (??)` | `NO` | `6011c61475fca480...` |

## 2. Git Tracking Status Analysis
- **Tracked in Git (18 files):** Versions `20261015024100` through `20261023110000`.
- **Untracked in Git (2 files):**
  1. `20261030120000_student_profile_directory_v2.sql` (Git status: `??`)
  2. `20261030130000_course_enrollment_currency_v2.sql` (Git status: `??`)

## 3. Draft Migration Identification
- **Draft Migration (1 file):** `20261023090000_branding_and_admin_avatars.sql`
  * Comment inside file explicitly states: `Draft only - not for live application yet`.
  * Creates `academy_branding` table which **does not exist on the live database**.

## 4. Full SHA-256 Checksums
```text
0a4586a39454996dc23a8486f11cded621d5bea8490ab38f8fae735088028299  20261015024100_001_create_core_tables.sql
c94b4623ddecc094d7305dc0472612eac929bcb9a6352f9cb6b972d36a0f09da  20261015024134_002_create_database_views.sql
3b669e7fde150fcca962907a4efce59166f53c52df377be7ef92836392894493  20261015024155_003_create_rpc_functions.sql
51c1f521579091623b528280824c60ade1eb8ed735d3b37698bab9a27ed2ebfb  20261015024209_004_fix_constraint_and_seed.sql
c434bdc7c2a0ccb0d522cd727a694abd08cf25684cf9e8341639f019cd4d604b  202610210005_production_hardening.sql
2476c9cb19e3832974b190cef332f6df4d2e804a46d4af5fa6b32ce59b9510da  202610210006_security_and_authorization_hardening.sql
5b6f2351acdd9b2384dcb88a553fada2688b8aedc31520f3a024ad338b642873  202610210007_purge_legacy_rls_and_revoke_public.sql
75d418a778b8e07c40a5c256b027cb0a836d5de3990fd698a9a67a05c07f7e5c  202610210008_protect_cash_boxes_opening_balance.sql
8b6062c2ac8253e2862782dd1b762455edccb8c078e8e38946bbf12779446f1f  20261021171218_allow_cash_box_creator_nullification_on_auth_delete.sql
f8f29a9cac267f12f5672f4455fea24a589dd25b90b132e0866f514fae14700b  20261021214608_add_login_alert_dedupe.sql
b3bf1746b26fcb0b3ffda3be0e715ca961774da43eaabc3aa657b5759feb9fae  20261021223822_rbac_catalog_and_authorization_primitives.sql
053ee2d38796214f624d8ded4a34d1f29c4c58cea22a18d4da2de47d6ea50386  20261021224440_rbac_role_aware_data_endpoints.sql
c6fc9da6599a5c2d21e1b1cc0b02d7c63a9032ddaec90409e1626f310a376c5e  20261021224905_rbac_permission_checked_write_endpoints.sql
9600893d725331f68fc9963f9918ec295fe4bfd602ab33f51a60631c275ab0c7  20261022225500_rbac_multiple_platform_owners.sql
f0cd46ca95ec75c54a176594a9e3ba01a1b2db61a5c013c90ff517e9ce0ed68a  20261022230000_rbac_authorization_cutover.sql
cd03219c19380e1321493e470efa688466c00a1158a834d598181a196cf2544d  20261023090000_branding_and_admin_avatars.sql
a16ef1f39e4e38f891603fe558525452849d0e040592b765ce81a32f9482938a  20261023100000_platform_audit_and_telegram_outbox.sql
537f726e32ca0104215cde24f843b4c7cb7f9ec9cc945848c5ee611bfc0a07db  20261023110000_telegram_notification_language.sql
54c20dcf1d2a2d7001c3f3c5bc971d3ab8f43103ce9e37db145a02ca01675fd3  20261030120000_student_profile_directory_v2.sql
6011c61475fca480be446eb52e8f24c8c2fab2bd1089e08411fb0e38f40ed7c9  20261030130000_course_enrollment_currency_v2.sql
```

## 5. Full SQL Content of Local Migrations
### File: `20261015024100_001_create_core_tables.sql`
> **Version:** `20261015024100` | **Size:** `10673` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `NO`
> **SHA-256:** `0a4586a39454996dc23a8486f11cded621d5bea8490ab38f8fae735088028299`

```sql
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
```

---

### File: `20261015024134_002_create_database_views.sql`
> **Version:** `20261015024134` | **Size:** `6035` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `NO`
> **SHA-256:** `c94b4623ddecc094d7305dc0472612eac929bcb9a6352f9cb6b972d36a0f09da`

```sql
/*
# Create Database Views for Financial Calculations

1. New Views
- `enrollment_balances`: Computes total paid and remaining balance per enrollment by summing non-voided payments
- `cash_box_balances`: Computes live cash box balances from opening + payments in - expenses out + transfers in - transfers out
- `course_financial_summary`: Computes expected/collected revenue, expenses, and net profit per course
- `dashboard_metrics`: Aggregates all KPI numbers in one query

2. Important Notes
- All financial math is done server-side. The frontend NEVER uses .reduce() or client-side calculations.
- enrollment_balances shows payment_status as Paid/Partial/Unpaid/Overpaid based on remaining amount
- cash_box_balances includes breakdown of all in/out flows
- dashboard_metrics uses date_trunc('month', now()) for monthly figures
- course_financial_summary uses a CTE for expenses to avoid GROUP BY issues
*/

-- ===== ENROLLMENT_BALANCES VIEW =====
CREATE OR REPLACE VIEW enrollment_balances AS
SELECT
  e.id AS enrollment_id,
  e.student_id,
  s.name AS student_name,
  s.phone AS student_phone,
  e.course_id,
  c.course_name,
  e.agreed_cost,
  COALESCE(SUM(CASE WHEN p.voided = false THEN p.amount ELSE 0 END), 0) AS total_paid,
  e.agreed_cost - COALESCE(SUM(CASE WHEN p.voided = false THEN p.amount ELSE 0 END), 0) AS remaining_balance,
  CASE
    WHEN e.agreed_cost - COALESCE(SUM(CASE WHEN p.voided = false THEN p.amount ELSE 0 END), 0) <= 0
      AND COALESCE(SUM(CASE WHEN p.voided = false THEN p.amount ELSE 0 END), 0) > 0 THEN 'Paid'
    WHEN e.agreed_cost - COALESCE(SUM(CASE WHEN p.voided = false THEN p.amount ELSE 0 END), 0) < 0 THEN 'Overpaid'
    WHEN COALESCE(SUM(CASE WHEN p.voided = false THEN p.amount ELSE 0 END), 0) = 0 THEN 'Unpaid'
    ELSE 'Partial'
  END AS payment_status,
  e.status AS enrollment_status,
  e.attendance_status,
  e.enrolled_on
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN courses c ON c.id = e.course_id
LEFT JOIN payments p ON p.enrollment_id = e.id
GROUP BY e.id, s.name, s.phone, c.course_name;

-- ===== CASH_BOX_BALANCES VIEW =====
CREATE OR REPLACE VIEW cash_box_balances AS
SELECT
  cb.id AS cash_box_id,
  cb.name,
  cb.box_type,
  cb.owner,
  cb.opening_balance,
  cb.archived,
  COALESCE(pay_in.total_in, 0) AS total_payments_in,
  COALESCE(exp_out.total_out, 0) AS total_expenses_out,
  COALESCE(tf_in.total_in, 0) AS total_transfers_in,
  COALESCE(tf_out.total_out, 0) AS total_transfers_out,
  cb.opening_balance
    + COALESCE(pay_in.total_in, 0)
    - COALESCE(exp_out.total_out, 0)
    + COALESCE(tf_in.total_in, 0)
    - COALESCE(tf_out.total_out, 0) AS current_balance
FROM cash_boxes cb
LEFT JOIN (
  SELECT cash_box_id, SUM(amount) AS total_in
  FROM payments WHERE voided = false
  GROUP BY cash_box_id
) pay_in ON pay_in.cash_box_id = cb.id
LEFT JOIN (
  SELECT cash_box_id, SUM(amount) AS total_out
  FROM expenses
  GROUP BY cash_box_id
) exp_out ON exp_out.cash_box_id = cb.id
LEFT JOIN (
  SELECT to_box_id, SUM(amount) AS total_in
  FROM cash_transfers
  GROUP BY to_box_id
) tf_in ON tf_in.to_box_id = cb.id
LEFT JOIN (
  SELECT from_box_id, SUM(amount) AS total_out
  FROM cash_transfers
  GROUP BY from_box_id
) tf_out ON tf_out.from_box_id = cb.id;

-- ===== COURSE_FINANCIAL_SUMMARY VIEW =====
CREATE OR REPLACE VIEW course_financial_summary AS
WITH course_exp AS (
  SELECT course_id, COALESCE(SUM(amount), 0) AS total_expenses
  FROM expenses WHERE course_id IS NOT NULL
  GROUP BY course_id
),
enrollment_pay AS (
  SELECT
    e.course_id,
    COUNT(DISTINCT e.id) AS total_enrollments,
    SUM(e.agreed_cost) AS expected_revenue,
    COALESCE(SUM(CASE WHEN p.voided = false THEN p.amount ELSE 0 END), 0) AS collected_revenue,
    COUNT(CASE WHEN e.status = 'Active' THEN 1 END) AS active_enrollments
  FROM enrollments e
  LEFT JOIN payments p ON p.enrollment_id = e.id
  GROUP BY e.course_id
)
SELECT
  c.id AS course_id,
  c.course_name,
  c.default_cost,
  c.availability_status,
  c.max_students,
  COALESCE(ep.total_enrollments, 0) AS total_enrollments,
  COALESCE(ep.expected_revenue, 0) AS expected_revenue,
  COALESCE(ep.collected_revenue, 0) AS collected_revenue,
  COALESCE(ce.total_expenses, 0) AS course_expenses,
  COALESCE(ep.collected_revenue, 0) - COALESCE(ce.total_expenses, 0) AS net_profit,
  COALESCE(ep.active_enrollments, 0) AS active_enrollments
FROM courses c
LEFT JOIN enrollment_pay ep ON ep.course_id = c.id
LEFT JOIN course_exp ce ON ce.course_id = c.id;

-- ===== DASHBOARD_METRICS VIEW =====
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT
  (SELECT COUNT(*) FROM students) AS total_students,
  (SELECT COUNT(*) FROM students WHERE created_at >= date_trunc('month', now())) AS new_students_this_month,
  (SELECT COUNT(*) FROM courses WHERE availability_status = 'Active') AS active_courses,
  (SELECT COUNT(*) FROM enrollments WHERE status = 'Active') AS active_enrollments,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE voided = false AND date_trunc('month', payment_date) = date_trunc('month', now())) AS revenue_this_month,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE voided = false) AS total_revenue_all_time,
  (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE date_trunc('month', expense_date) = date_trunc('month', now())) AS expenses_this_month,
  (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS total_expenses_all_time,
  (
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE voided = false AND date_trunc('month', payment_date) = date_trunc('month', now()))
    -
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE date_trunc('month', expense_date) = date_trunc('month', now()))
  ) AS net_profit_this_month,
  (
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE voided = false)
    -
    (SELECT COALESCE(SUM(amount), 0) FROM expenses)
  ) AS total_net_profit_all_time,
  (
    SELECT COALESCE(SUM(remaining_balance), 0)
    FROM enrollment_balances
    WHERE enrollment_status = 'Active' AND remaining_balance > 0
  ) AS outstanding_balance;
```

---

### File: `20261015024155_003_create_rpc_functions.sql`
> **Version:** `20261015024155` | **Size:** `7441` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `NO`
> **SHA-256:** `3b669e7fde150fcca962907a4efce59166f53c52df377be7ef92836392894493`

```sql
/*
# Create Atomic RPC Functions for Safe Financial Mutations

1. New Functions
- `enroll_student(p_student_id, p_course_id, p_agreed_cost)`: Atomically creates an enrollment with seat availability check (FOR UPDATE lock on course row). Returns the enrollment record or raises an error.
- `record_payment(p_enrollment_id, p_cash_box_id, p_amount, p_payment_date, p_payment_method, p_receipt_ref, p_notes)`: Records a payment, rejecting overpayments and payments on dropped enrollments. Returns the payment record or raises an error.
- `void_payment(p_payment_id)`: Marks a payment as voided (sets voided=true, voided_at=now()). Never deletes. Returns the voided payment record.
- `record_expense(p_cash_box_id, p_amount, p_expense_date, p_category, p_course_id, p_description, p_notes)`: Records an expense. Does NOT block negative balances (UI warns), but stores the expense.
- `transfer_between_boxes(p_from_box_id, p_to_box_id, p_amount, p_transfer_date, p_notes)`: Creates a transfer record between two different cash boxes. Returns the transfer record.

2. Important Notes
- All functions use SECURITY DEFINER to bypass RLS for internal operations
- enroll_student locks the course row with FOR UPDATE to prevent race conditions on seat counts
- record_payment checks enrollment status and remaining balance before inserting
- void_payment uses a soft-delete pattern (voided flag) to preserve financial history
- All functions return the created/modified record as JSON
- Errors are raised with RAISE EXCEPTION for the frontend to catch
*/

-- ===== ENROLL_STUDENT =====
CREATE OR REPLACE FUNCTION enroll_student(
  p_student_id uuid,
  p_course_id uuid,
  p_agreed_cost numeric DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course RECORD;
  v_enrollment enrollments;
  v_existing_count int;
  v_cost numeric(12,2);
BEGIN
  -- Lock the course row to prevent concurrent seat races
  SELECT * INTO v_course FROM courses WHERE id = p_course_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الكورس غير موجود';
  END IF;

  IF v_course.availability_status = 'Closed' THEN
    RAISE EXCEPTION 'هذا الكورس مغلق ولا يمكن التسجيل فيه';
  END IF;

  -- Check if already enrolled
  SELECT COUNT(*) INTO v_existing_count
  FROM enrollments WHERE student_id = p_student_id AND course_id = p_course_id;

  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'هذا الطالب مسجل بالفعل في هذا الكورس';
  END IF;

  -- Check seat capacity if max_students is set
  IF v_course.max_students IS NOT NULL THEN
    SELECT COUNT(*) INTO v_existing_count
    FROM enrollments WHERE course_id = p_course_id AND status = 'Active';

    IF v_existing_count >= v_course.max_students THEN
      RAISE EXCEPTION 'لا توجد مقاعد متاحة في هذا الكورس (ممتلئ)';
    END IF;
  END IF;

  -- Use provided cost or fall back to course default
  v_cost := COALESCE(p_agreed_cost, v_course.default_cost, 0);

  INSERT INTO enrollments (student_id, course_id, agreed_cost, status)
  VALUES (p_student_id, p_course_id, v_cost, 'Active')
  RETURNING * INTO v_enrollment;

  RETURN json_build_object(
    'success', true,
    'enrollment', row_to_json(v_enrollment)
  );
END;
$$;

-- ===== RECORD_PAYMENT =====
CREATE OR REPLACE FUNCTION record_payment(
  p_enrollment_id uuid,
  p_cash_box_id uuid,
  p_amount numeric,
  p_payment_date date DEFAULT CURRENT_DATE,
  p_payment_method text DEFAULT 'Cash',
  p_receipt_ref text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment RECORD;
  v_total_paid numeric(12,2);
  v_remaining numeric(12,2);
  v_payment payments;
BEGIN
  -- Lock the enrollment row
  SELECT * INTO v_enrollment FROM enrollments WHERE id = p_enrollment_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الاشتراك غير موجود';
  END IF;

  IF v_enrollment.status = 'Dropped' THEN
    RAISE EXCEPTION 'لا يمكن تسجيل دفعة لطالب منسحب';
  END IF;

  -- Calculate current paid amount (non-voided)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payments WHERE enrollment_id = p_enrollment_id AND voided = false;

  v_remaining := v_enrollment.agreed_cost - v_total_paid;

  IF p_amount > v_remaining THEN
    RAISE EXCEPTION 'المبلغ المُدخل (%) يتجاوز المتبقي (%)', p_amount, v_remaining;
  END IF;

  INSERT INTO payments (enrollment_id, cash_box_id, amount, payment_date, payment_method, receipt_ref, notes)
  VALUES (p_enrollment_id, p_cash_box_id, p_amount, p_payment_date, p_payment_method, p_receipt_ref, p_notes)
  RETURNING * INTO v_payment;

  RETURN json_build_object(
    'success', true,
    'payment', row_to_json(v_payment)
  );
END;
$$;

-- ===== VOID_PAYMENT =====
CREATE OR REPLACE FUNCTION void_payment(p_payment_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
BEGIN
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الدفعة غير موجودة';
  END IF;

  IF v_payment.voided = true THEN
    RAISE EXCEPTION 'هذه الدفعة ملغاة بالفعل';
  END IF;

  UPDATE payments SET voided = true, voided_at = now()
  WHERE id = p_payment_id
  RETURNING * INTO v_payment;

  RETURN json_build_object(
    'success', true,
    'payment', row_to_json(v_payment)
  );
END;
$$;

-- ===== RECORD_EXPENSE =====
CREATE OR REPLACE FUNCTION record_expense(
  p_cash_box_id uuid,
  p_amount numeric,
  p_expense_date date DEFAULT CURRENT_DATE,
  p_category text DEFAULT 'Other',
  p_course_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expense expenses;
BEGIN
  INSERT INTO expenses (cash_box_id, amount, expense_date, category, course_id, description, notes)
  VALUES (p_cash_box_id, p_amount, p_expense_date, p_category, p_course_id, p_description, p_notes)
  RETURNING * INTO v_expense;

  RETURN json_build_object(
    'success', true,
    'expense', row_to_json(v_expense)
  );
END;
$$;

-- ===== TRANSFER_BETWEEN_BOXES =====
CREATE OR REPLACE FUNCTION transfer_between_boxes(
  p_from_box_id uuid,
  p_to_box_id uuid,
  p_amount numeric,
  p_transfer_date date DEFAULT CURRENT_DATE,
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer cash_transfers;
BEGIN
  IF p_from_box_id = p_to_box_id THEN
    RAISE EXCEPTION 'لا يمكن التحويل بين نفس الخزنة';
  END IF;

  INSERT INTO cash_transfers (from_box_id, to_box_id, amount, transfer_date, notes)
  VALUES (p_from_box_id, p_to_box_id, p_amount, p_transfer_date, p_notes)
  RETURNING * INTO v_transfer;

  RETURN json_build_object(
    'success', true,
    'transfer', row_to_json(v_transfer)
  );
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION enroll_student TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_payment TO anon, authenticated;
GRANT EXECUTE ON FUNCTION void_payment TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_expense TO anon, authenticated;
GRANT EXECUTE ON FUNCTION transfer_between_boxes TO anon, authenticated;
```

---

### File: `20261015024209_004_fix_constraint_and_seed.sql`
> **Version:** `20261015024209` | **Size:** `880` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `NO`
> **SHA-256:** `51c1f521579091623b528280824c60ade1eb8ed735d3b37698bab9a27ed2ebfb`

```sql
/*
# Fix cash_boxes box_type constraint and seed default boxes

1. Changes
- Alter the check constraint on cash_boxes.box_type to include 'Bank' type
- Seed 3 default cash boxes

2. Notes
- The original constraint only allowed Main/Branch/Online/Petty Cash
- Adding 'Bank' to support InstaPay/Bank box as specified in the design
*/

ALTER TABLE cash_boxes DROP CONSTRAINT IF EXISTS cash_boxes_box_type_check;
ALTER TABLE cash_boxes ADD CONSTRAINT cash_boxes_box_type_check
  CHECK (box_type IN ('Main', 'Branch', 'Online', 'Petty Cash', 'Bank'));

INSERT INTO cash_boxes (name, box_type, owner, opening_balance) VALUES
  ('الخزنة الرئيسية (الكاش)', 'Main', 'م/ أحمد الفلاح', 0),
  ('فودافون كاش', 'Online', 'م/ أحمد الفلاح', 0),
  ('إنستاباي / البنك', 'Bank', 'م/ أحمد الفلاح', 0)
ON CONFLICT DO NOTHING;
```

---

### File: `202610210005_production_hardening.sql`
> **Version:** `202610210005` | **Size:** `25139` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `NO`
> **SHA-256:** `c434bdc7c2a0ccb0d522cd727a694abd08cf25684cf9e8341639f019cd4d604b`

```sql
-- Production hardening for the live TrainerPro schema (2026-10-21).

-- IMPORTANT: This migration targets the live *_id schema, not the legacy

-- 001-004 schema currently present in this repository. See README before use.

-- It has NOT been applied to the Supabase project.



BEGIN;



-- Fail fast if this migration is pointed at a database with the legacy schema.

DO $preflight$

BEGIN

  IF to_regclass('public.payments') IS NULL

     OR to_regclass('public.expenses') IS NULL

     OR to_regclass('public.cash_box_transfers') IS NULL

     OR to_regclass('public.admins') IS NULL THEN

    RAISE EXCEPTION 'TrainerPro live schema preflight failed: expected payments, expenses, cash_box_transfers and admins tables.';

  END IF;



  IF NOT EXISTS (

    SELECT 1 FROM information_schema.columns

    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_id'

  ) OR NOT EXISTS (

    SELECT 1 FROM information_schema.columns

    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'voided_at'

  ) OR NOT EXISTS (

    SELECT 1 FROM information_schema.columns

    WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'enrollment_id'

  ) THEN

    RAISE EXCEPTION 'TrainerPro live schema preflight failed: expected payment_id, voided_at and enrollment_id columns.';

  END IF;



  IF to_regprocedure('public.is_admin()') IS NULL

     OR to_regprocedure('public.record_payment(uuid,uuid,numeric,date,text,text,text)') IS NULL

     OR to_regprocedure('public.record_expense(uuid,numeric,date,text,text,text,uuid)') IS NULL

     OR to_regprocedure('public.transfer_between_boxes(uuid,uuid,numeric,date,text)') IS NULL THEN

    RAISE EXCEPTION 'TrainerPro live schema preflight failed: one or more expected RPC functions are missing.';

  END IF;

END;

$preflight$;



-- Stable, unique, database-generated receipt numbers. Keep receipt_ref for a

-- bank/provider reference supplied by the operator; it is not the receipt ID.

ALTER TABLE public.payments

  ADD COLUMN IF NOT EXISTS receipt_number bigint;



CREATE SEQUENCE IF NOT EXISTS public.payment_receipt_number_seq AS bigint;

ALTER SEQUENCE public.payment_receipt_number_seq

  OWNED BY public.payments.receipt_number;



WITH unnumbered AS (

  SELECT payment_id,

         row_number() OVER (ORDER BY payment_date, created_at, payment_id) AS row_num

  FROM public.payments

  WHERE receipt_number IS NULL

)

UPDATE public.payments AS p

SET receipt_number = nextval('public.payment_receipt_number_seq'::regclass)

FROM unnumbered AS u

WHERE p.payment_id = u.payment_id;



SELECT setval(

  'public.payment_receipt_number_seq'::regclass,

  GREATEST(COALESCE((SELECT max(receipt_number) FROM public.payments), 0), 1),

  COALESCE((SELECT max(receipt_number) FROM public.payments), 0) > 0

);



REVOKE ALL ON SEQUENCE public.payment_receipt_number_seq FROM PUBLIC, anon, authenticated;



ALTER TABLE public.payments

  ALTER COLUMN receipt_number SET DEFAULT nextval('public.payment_receipt_number_seq'::regclass),

  ALTER COLUMN receipt_number SET NOT NULL;



CREATE UNIQUE INDEX IF NOT EXISTS payments_receipt_number_uidx

  ON public.payments (receipt_number);



-- Void audit metadata for payments and expenses. Existing voids, if any, are

-- retained and clearly marked as historical records without an available reason.

ALTER TABLE public.payments

  ADD COLUMN IF NOT EXISTS voided_by uuid,

  ADD COLUMN IF NOT EXISTS void_reason text;



ALTER TABLE public.expenses

  ADD COLUMN IF NOT EXISTS voided_at timestamptz,

  ADD COLUMN IF NOT EXISTS voided_by uuid,

  ADD COLUMN IF NOT EXISTS void_reason text;



UPDATE public.payments

SET void_reason = 'إلغاء قديم — لم يُسجل السبب وقتها'

WHERE voided_at IS NOT NULL

  AND NULLIF(btrim(void_reason), '') IS NULL;



UPDATE public.expenses

SET void_reason = 'إلغاء قديم — لم يُسجل السبب وقتها'

WHERE voided_at IS NOT NULL

  AND NULLIF(btrim(void_reason), '') IS NULL;



DO $constraints$

BEGIN

  IF NOT EXISTS (

    SELECT 1 FROM pg_constraint

    WHERE conrelid = 'public.payments'::regclass

      AND conname = 'payments_voided_by_fkey'

  ) THEN

    ALTER TABLE public.payments

      ADD CONSTRAINT payments_voided_by_fkey

      FOREIGN KEY (voided_by) REFERENCES auth.users(id) ON DELETE RESTRICT;

  END IF;



  IF NOT EXISTS (

    SELECT 1 FROM pg_constraint

    WHERE conrelid = 'public.expenses'::regclass

      AND conname = 'expenses_voided_by_fkey'

  ) THEN

    ALTER TABLE public.expenses

      ADD CONSTRAINT expenses_voided_by_fkey

      FOREIGN KEY (voided_by) REFERENCES auth.users(id) ON DELETE RESTRICT;

  END IF;



  IF NOT EXISTS (

    SELECT 1 FROM pg_constraint

    WHERE conrelid = 'public.payments'::regclass

      AND conname = 'payments_void_reason_required_check'

  ) THEN

    ALTER TABLE public.payments

      ADD CONSTRAINT payments_void_reason_required_check

      CHECK (voided_at IS NULL OR (void_reason IS NOT NULL AND length(btrim(void_reason)) >= 5));

  END IF;



  IF NOT EXISTS (

    SELECT 1 FROM pg_constraint

    WHERE conrelid = 'public.expenses'::regclass

      AND conname = 'expenses_void_reason_required_check'

  ) THEN

    ALTER TABLE public.expenses

      ADD CONSTRAINT expenses_void_reason_required_check

      CHECK (voided_at IS NULL OR (void_reason IS NOT NULL AND length(btrim(void_reason)) >= 5));

  END IF;

END;

$constraints$;



-- Enforce immutable ledger entries. The only permitted update is the first

-- transition from active to voided, with actor and reason recorded.

CREATE OR REPLACE FUNCTION public.prevent_financial_record_mutation()

RETURNS trigger

LANGUAGE plpgsql

SECURITY INVOKER

SET search_path = pg_catalog, public

AS $function$

BEGIN

  IF TG_OP = 'DELETE' THEN

    RAISE EXCEPTION 'Financial records cannot be deleted; use the audited void operation.';

  END IF;


  IF (to_jsonb(NEW) - 'voided_at' - 'voided_by' - 'void_reason')

     IS DISTINCT FROM

     (to_jsonb(OLD) - 'voided_at' - 'voided_by' - 'void_reason') THEN

    RAISE EXCEPTION 'Financial record fields are immutable; use an audited void operation.';

  END IF;



  IF OLD.voided_at IS NOT NULL THEN

    RAISE EXCEPTION 'A voided financial record is immutable.';

  END IF;



  IF NEW.voided_at IS NULL THEN

    IF NEW.voided_by IS DISTINCT FROM OLD.voided_by

       OR NEW.void_reason IS DISTINCT FROM OLD.void_reason THEN

      RAISE EXCEPTION 'Void metadata may only be set as part of a void operation.';

    END IF;

  ELSIF NEW.voided_by IS NULL

     OR NULLIF(btrim(NEW.void_reason), '') IS NULL

     OR length(btrim(NEW.void_reason)) < 5 THEN

    RAISE EXCEPTION 'Voiding requires an authenticated actor and a reason of at least 5 characters.';

  END IF;



  RETURN NEW;

END;

$function$;



DROP TRIGGER IF EXISTS trg_payments_financial_immutability ON public.payments;

CREATE TRIGGER trg_payments_financial_immutability

BEFORE UPDATE OR DELETE ON public.payments

FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_record_mutation();



DROP TRIGGER IF EXISTS trg_expenses_financial_immutability ON public.expenses;

CREATE TRIGGER trg_expenses_financial_immutability

BEFORE UPDATE OR DELETE ON public.expenses

FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_record_mutation();



-- Harden SECURITY DEFINER routines against mutable search_path resolution.

ALTER FUNCTION public.is_admin()

  SET search_path = pg_catalog, public;



-- Bring the RPC in line with the documented rule: closed courses cannot be

-- enrolled into, even when a caller bypasses the frontend course selector.

DROP FUNCTION IF EXISTS public.enroll_student(uuid, uuid, numeric, text);

DROP FUNCTION IF EXISTS public.enroll_student(uuid, uuid, numeric);

DROP FUNCTION IF EXISTS public.enroll_student(uuid, uuid);



CREATE OR REPLACE FUNCTION public.enroll_student(

  p_student_id uuid,

  p_course_id uuid,

  p_agreed_cost numeric DEFAULT NULL,

  p_status text DEFAULT 'Active'

)

RETURNS public.enrollments

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = pg_catalog, public

AS $function$

DECLARE

  v_course public.courses%ROWTYPE;

  v_active_count integer;

  v_enrollment public.enrollments%ROWTYPE;

  v_final_cost numeric;

BEGIN

  IF public.is_admin() IS NOT TRUE THEN

    RAISE EXCEPTION 'Unauthorized: admin access required';

  END IF;

  IF p_status IS NULL OR p_status NOT IN ('Active', 'Completed', 'Dropped') THEN

    RAISE EXCEPTION 'Invalid status: %. Must be Active, Completed, or Dropped', p_status;

  END IF;



  SELECT * INTO v_course

  FROM public.courses

  WHERE course_id = p_course_id

  FOR UPDATE;



  IF NOT FOUND THEN

    RAISE EXCEPTION 'Course not found: %', p_course_id;

  END IF;

  IF v_course.availability_status = 'Closed' THEN

    RAISE EXCEPTION 'Cannot enroll into a closed course: %', p_course_id;

  END IF;



  SELECT count(*) INTO v_active_count

  FROM public.enrollments

  WHERE course_id = p_course_id AND status = 'Active';



  IF v_course.max_students IS NOT NULL

     AND v_active_count >= v_course.max_students THEN

    RAISE EXCEPTION 'Course is full (max_students = %, active = %)',

                    v_course.max_students, v_active_count;

  END IF;



  v_final_cost := COALESCE(p_agreed_cost, v_course.default_cost);

  IF v_final_cost IS NULL THEN

    RAISE EXCEPTION 'agreed_cost is required: course has no default_cost set';

  END IF;



  INSERT INTO public.enrollments (student_id, course_id, agreed_cost, status)

  VALUES (p_student_id, p_course_id, v_final_cost, p_status)

  RETURNING * INTO v_enrollment;



  RETURN v_enrollment;

END;

$function$;



ALTER FUNCTION public.record_payment(uuid, uuid, numeric, date, text, text, text)

  SET search_path = pg_catalog, public;

ALTER FUNCTION public.record_expense(uuid, numeric, date, text, text, text, uuid)

  SET search_path = pg_catalog, public;

ALTER FUNCTION public.transfer_between_boxes(uuid, uuid, numeric, date, text)

  SET search_path = pg_catalog, public;

ALTER FUNCTION public.set_updated_at()

  SET search_path = pg_catalog, public;



-- Keep existing void_payment clients from silently voiding without a reason:

-- the optional arg preserves the old RPC call shape but rejects missing reason.

DROP FUNCTION IF EXISTS public.void_payment(uuid);

DROP FUNCTION IF EXISTS public.void_payment(uuid, text);



CREATE OR REPLACE FUNCTION public.void_payment(

  p_payment_id uuid,

  p_void_reason text DEFAULT NULL

)

RETURNS public.payments

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = pg_catalog, public

AS $function$

DECLARE

  v_payment public.payments%ROWTYPE;

  v_reason text;

BEGIN

  IF NOT public.is_admin() THEN

    RAISE EXCEPTION 'Unauthorized: admin access required';

  END IF;



  v_reason := NULLIF(btrim(p_void_reason), '');

  IF v_reason IS NULL OR length(v_reason) < 5 THEN

    RAISE EXCEPTION 'سبب الإلغاء مطلوب ويجب ألا يقل عن 5 أحرف';

  END IF;



  SELECT * INTO v_payment

  FROM public.payments

  WHERE payment_id = p_payment_id

  FOR UPDATE;



  IF NOT FOUND THEN

    RAISE EXCEPTION 'Payment not found: %', p_payment_id;

  END IF;

  IF v_payment.voided_at IS NOT NULL THEN

    RAISE EXCEPTION 'Payment is already voided: %', p_payment_id;

  END IF;



  UPDATE public.payments

  SET voided_at = clock_timestamp(),

      voided_by = auth.uid(),

      void_reason = v_reason

  WHERE payment_id = p_payment_id

  RETURNING * INTO v_payment;



  RETURN v_payment;

END;

$function$;



DROP FUNCTION IF EXISTS public.void_expense(uuid);

DROP FUNCTION IF EXISTS public.void_expense(uuid, text);



CREATE OR REPLACE FUNCTION public.void_expense(

  p_expense_id uuid,

  p_void_reason text

)

RETURNS public.expenses

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = pg_catalog, public

AS $function$

DECLARE

  v_expense public.expenses%ROWTYPE;

  v_reason text;

BEGIN

  IF NOT public.is_admin() THEN

    RAISE EXCEPTION 'Unauthorized: admin access required';

  END IF;



  v_reason := NULLIF(btrim(p_void_reason), '');

  IF v_reason IS NULL OR length(v_reason) < 5 THEN

    RAISE EXCEPTION 'سبب الإلغاء مطلوب ويجب ألا يقل عن 5 أحرف';

  END IF;



  SELECT * INTO v_expense

  FROM public.expenses

  WHERE expense_id = p_expense_id

  FOR UPDATE;



  IF NOT FOUND THEN

    RAISE EXCEPTION 'Expense not found: %', p_expense_id;

  END IF;

  IF v_expense.voided_at IS NOT NULL THEN

    RAISE EXCEPTION 'Expense is already voided: %', p_expense_id;

  END IF;



  UPDATE public.expenses

  SET voided_at = clock_timestamp(),

      voided_by = auth.uid(),

      void_reason = v_reason

  WHERE expense_id = p_expense_id

  RETURNING * INTO v_expense;



  RETURN v_expense;

END;

$function$;



-- Serialize enrollment-status changes with registrations and seat-capacity checks.

DROP FUNCTION IF EXISTS public.set_enrollment_status(uuid, text);



CREATE OR REPLACE FUNCTION public.set_enrollment_status(

  p_enrollment_id uuid,

  p_status text

)

RETURNS public.enrollments

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = pg_catalog, public

AS $function$

DECLARE

  v_course_id uuid;

  v_course public.courses%ROWTYPE;

  v_enrollment public.enrollments%ROWTYPE;

  v_active_count integer;

BEGIN

  IF NOT public.is_admin() THEN

    RAISE EXCEPTION 'Unauthorized: admin access required';

  END IF;

  IF p_status NOT IN ('Active', 'Completed', 'Dropped') THEN

    RAISE EXCEPTION 'Invalid enrollment status: %', p_status;

  END IF;



  SELECT course_id INTO v_course_id

  FROM public.enrollments

  WHERE enrollment_id = p_enrollment_id;

  IF NOT FOUND THEN

    RAISE EXCEPTION 'Enrollment not found: %', p_enrollment_id;

  END IF;



  -- Use the same lock order as enroll_student: course first, then enrollment.

  SELECT * INTO v_course

  FROM public.courses

  WHERE course_id = v_course_id

  FOR UPDATE;

  IF NOT FOUND THEN

    RAISE EXCEPTION 'Course not found: %', v_course_id;

  END IF;



  SELECT * INTO v_enrollment

  FROM public.enrollments

  WHERE enrollment_id = p_enrollment_id

  FOR UPDATE;

  IF NOT FOUND THEN

    RAISE EXCEPTION 'Enrollment not found: %', p_enrollment_id;

  END IF;



  IF p_status = 'Active' AND v_enrollment.status <> 'Active' THEN

    IF v_course.availability_status = 'Closed' THEN

      RAISE EXCEPTION 'Cannot reactivate an enrollment in a closed course';

    END IF;

    IF v_course.max_students IS NOT NULL THEN

      SELECT count(*) INTO v_active_count

      FROM public.enrollments

      WHERE course_id = v_course_id AND status = 'Active';

      IF v_active_count >= v_course.max_students THEN

        RAISE EXCEPTION 'Course is full; cannot reactivate this enrollment';

      END IF;

    END IF;

  END IF;



  UPDATE public.enrollments

  SET status = p_status

  WHERE enrollment_id = p_enrollment_id

  RETURNING * INTO v_enrollment;



  RETURN v_enrollment;

END;

$function$;



-- Lock both cash boxes in deterministic UUID order to avoid transfer deadlocks.

DROP FUNCTION IF EXISTS public.transfer_between_boxes(uuid, uuid, numeric, date, text);

DROP FUNCTION IF EXISTS public.transfer_between_boxes(uuid, uuid, numeric, date);



CREATE OR REPLACE FUNCTION public.transfer_between_boxes(

  p_from_box_id uuid,

  p_to_box_id uuid,

  p_amount numeric,

  p_transfer_date date,

  p_notes text DEFAULT NULL

)

RETURNS public.cash_box_transfers

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = pg_catalog, public

AS $function$

DECLARE

  v_from_box public.cash_boxes%ROWTYPE;

  v_to_box public.cash_boxes%ROWTYPE;

  v_transfer public.cash_box_transfers%ROWTYPE;

BEGIN

  IF NOT public.is_admin() THEN

    RAISE EXCEPTION 'Unauthorized: admin access required';

  END IF;

  IF p_from_box_id IS NULL OR p_to_box_id IS NULL OR p_from_box_id = p_to_box_id THEN

    RAISE EXCEPTION 'Source and destination must be two different cash boxes';

  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN

    RAISE EXCEPTION 'Transfer amount must be greater than zero';

  END IF;



  PERFORM 1

  FROM public.cash_boxes AS cb

  WHERE cb.cash_box_id IN (p_from_box_id, p_to_box_id)

  ORDER BY cb.cash_box_id

  FOR UPDATE;



  SELECT * INTO v_from_box

  FROM public.cash_boxes

  WHERE cash_box_id = p_from_box_id;

  IF NOT FOUND OR NOT v_from_box.is_active THEN

    RAISE EXCEPTION 'Source cash box not found or inactive: %', p_from_box_id;

  END IF;



  SELECT * INTO v_to_box

  FROM public.cash_boxes

  WHERE cash_box_id = p_to_box_id;

  IF NOT FOUND OR NOT v_to_box.is_active THEN

    RAISE EXCEPTION 'Destination cash box not found or inactive: %', p_to_box_id;

  END IF;



  INSERT INTO public.cash_box_transfers (

    from_box_id, to_box_id, amount, transfer_date, added_by, notes

  ) VALUES (

    p_from_box_id, p_to_box_id, p_amount, p_transfer_date, auth.uid(), p_notes

  )

  RETURNING * INTO v_transfer;



  RETURN v_transfer;

END;

$function$;



-- A closed ledger must not be writable directly through PostgREST. All

-- financial writes now pass through the audited SECURITY DEFINER RPCs.

REVOKE TRUNCATE, REFERENCES, TRIGGER

  ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;



REVOKE DELETE

  ON TABLE public.admins, public.students, public.courses, public.cash_boxes,

            public.enrollments, public.payments, public.expenses,

            public.cash_box_transfers

  FROM PUBLIC, anon, authenticated;



REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER

  ON TABLE public.admins, public.enrollments, public.payments, public.expenses,

            public.cash_box_transfers

  FROM PUBLIC, anon, authenticated;



REVOKE ALL

  ON TABLE public.admins, public.students, public.courses, public.cash_boxes,

            public.enrollments, public.payments, public.expenses,

            public.cash_box_transfers

  FROM PUBLIC, anon;



GRANT SELECT

  ON TABLE public.admins, public.students, public.courses, public.cash_boxes,

            public.enrollments, public.payments, public.expenses,

            public.cash_box_transfers

  TO authenticated;



REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER

  ON TABLE public.cash_box_balances, public.course_financial_summary,

            public.dashboard_metrics, public.enrollment_balances

  FROM PUBLIC, anon, authenticated;



-- Do not expose SECURITY DEFINER RPCs to anon or PUBLIC. Authenticated calls

-- are still individually checked against public.admins inside each function.

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.enroll_student(uuid, uuid, numeric, text) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.record_payment(uuid, uuid, numeric, date, text, text, text) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.record_expense(uuid, numeric, date, text, text, text, uuid) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.transfer_between_boxes(uuid, uuid, numeric, date, text) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.void_payment(uuid, text) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.void_expense(uuid, text) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.set_enrollment_status(uuid, text) FROM PUBLIC, anon;



GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

GRANT EXECUTE ON FUNCTION public.enroll_student(uuid, uuid, numeric, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.record_payment(uuid, uuid, numeric, date, text, text, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.record_expense(uuid, numeric, date, text, text, text, uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.transfer_between_boxes(uuid, uuid, numeric, date, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.void_payment(uuid, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.void_expense(uuid, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.set_enrollment_status(uuid, text) TO authenticated;



-- Exclude voided expenses from all cash, course, and dashboard totals.

CREATE OR REPLACE VIEW public.cash_box_balances

WITH (security_invoker = true) AS

SELECT

  cb.cash_box_id,

  cb.name,

  cb.type,

  cb.owner,

  cb.is_active,

  cb.opening_balance,

  COALESCE(pay_in.total, 0::numeric) AS total_payments_in,

  COALESCE(exp_out.total, 0::numeric) AS total_expenses_out,

  COALESCE(tr_in.total, 0::numeric) AS total_transfers_in,

  COALESCE(tr_out.total, 0::numeric) AS total_transfers_out,

  cb.opening_balance

    + COALESCE(pay_in.total, 0::numeric)

    + COALESCE(tr_in.total, 0::numeric)

    - COALESCE(exp_out.total, 0::numeric)

    - COALESCE(tr_out.total, 0::numeric) AS current_balance

FROM public.cash_boxes AS cb

LEFT JOIN (

  SELECT cash_box_id, sum(amount) AS total

  FROM public.payments

  WHERE voided_at IS NULL

  GROUP BY cash_box_id

) AS pay_in ON pay_in.cash_box_id = cb.cash_box_id

LEFT JOIN (

  SELECT cash_box_id, sum(amount) AS total

  FROM public.expenses

  WHERE voided_at IS NULL

  GROUP BY cash_box_id

) AS exp_out ON exp_out.cash_box_id = cb.cash_box_id

LEFT JOIN (

  SELECT to_box_id AS cash_box_id, sum(amount) AS total

  FROM public.cash_box_transfers

  GROUP BY to_box_id

) AS tr_in ON tr_in.cash_box_id = cb.cash_box_id

LEFT JOIN (

  SELECT from_box_id AS cash_box_id, sum(amount) AS total

  FROM public.cash_box_transfers

  GROUP BY from_box_id

) AS tr_out ON tr_out.cash_box_id = cb.cash_box_id;



CREATE OR REPLACE VIEW public.course_financial_summary

WITH (security_invoker = true) AS

SELECT

  c.course_id,

  c.course_name,

  c.availability_status,

  c.max_students,

  c.default_cost,

  count(e.enrollment_id) FILTER (WHERE e.status = 'Active') AS active_enrollments,

  CASE

    WHEN c.max_students IS NULL THEN NULL::bigint

    ELSE c.max_students - count(e.enrollment_id) FILTER (WHERE e.status = 'Active')

  END AS vacant_places,

  count(e.enrollment_id) AS total_enrollments,

  COALESCE(sum(e.agreed_cost) FILTER (WHERE e.status <> 'Dropped'), 0::numeric) AS expected_revenue,

  COALESCE(sum(p_totals.paid), 0::numeric) AS collected_payments,

  COALESCE(exp.total_expenses, 0::numeric) AS total_expenses,

  COALESCE(sum(p_totals.paid), 0::numeric) - COALESCE(exp.total_expenses, 0::numeric) AS net_profit

FROM public.courses AS c

LEFT JOIN public.enrollments AS e ON e.course_id = c.course_id

LEFT JOIN (

  SELECT p.enrollment_id, sum(p.amount) AS paid

  FROM public.payments AS p

  WHERE p.voided_at IS NULL

  GROUP BY p.enrollment_id

) AS p_totals ON p_totals.enrollment_id = e.enrollment_id

LEFT JOIN (

  SELECT expenses.course_id, sum(expenses.amount) AS total_expenses

  FROM public.expenses

  WHERE expenses.course_id IS NOT NULL

    AND expenses.voided_at IS NULL

  GROUP BY expenses.course_id

) AS exp ON exp.course_id = c.course_id

GROUP BY c.course_id, c.course_name, c.availability_status, c.max_students, c.default_cost, exp.total_expenses;



CREATE OR REPLACE VIEW public.dashboard_metrics

WITH (security_invoker = true) AS

SELECT

  (SELECT count(*) FROM public.students) AS total_students,

  (SELECT count(*) FROM public.students WHERE created_at >= date_trunc('month', now())) AS new_students_this_month,

  (SELECT count(*) FROM public.courses WHERE availability_status = 'Active') AS active_courses,

  (SELECT count(*) FROM public.enrollments WHERE status = 'Active') AS active_enrollments,

  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.payments

    WHERE voided_at IS NULL AND payment_date >= date_trunc('month', now())) AS revenue_this_month,

  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.expenses

    WHERE voided_at IS NULL AND expense_date >= date_trunc('month', now())) AS expenses_this_month,

  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.payments

    WHERE voided_at IS NULL AND payment_date >= date_trunc('month', now()))

    -

  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.expenses

    WHERE voided_at IS NULL AND expense_date >= date_trunc('month', now())) AS net_profit_this_month,

  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.payments WHERE voided_at IS NULL) AS total_revenue_all_time,

  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.expenses WHERE voided_at IS NULL) AS total_expenses_all_time,

  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.payments WHERE voided_at IS NULL)

    -

  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.expenses WHERE voided_at IS NULL) AS net_profit_all_time,

  (SELECT COALESCE(sum(eb.remaining_balance), 0::numeric)

    FROM public.enrollment_balances AS eb

    WHERE eb.enrollment_status = 'Active' AND eb.remaining_balance > 0::numeric) AS total_pending_balance;


REVOKE ALL ON public.cash_box_balances, public.course_financial_summary,

  public.dashboard_metrics, public.enrollment_balances FROM PUBLIC, anon;

GRANT SELECT ON public.cash_box_balances, public.course_financial_summary,

  public.dashboard_metrics, public.enrollment_balances TO authenticated;



COMMIT;
```

---

### File: `202610210006_security_and_authorization_hardening.sql`
> **Version:** `202610210006` | **Size:** `15057` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `NO`
> **SHA-256:** `2476c9cb19e3832974b190cef332f6df4d2e804a46d4af5fa6b32ce59b9510da`

```sql
-- ============================================================================
-- Migration: 202610210006_security_and_authorization_hardening.sql
-- Project: Elmasry Academy LMS (TrainerPro)
-- Target: Production Hardening Phase 2 (RLS & Financial RPCs Authorization)
--
-- Fixes:
-- 1. Restrict PostgREST reads/writes exclusively to administrators via RLS.
-- 2. Harden record_payment and record_expense with is_admin() guards and added_by = auth.uid().
-- 3. Recreate enrollment_balances view to unify ledger accounting on voided_at IS NULL.
-- 4. Eliminate legacy voided column discrepancies across all calculations.
-- 5. Standardize admin lookup on auth_user_id column.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 0. CANONICAL IS_ADMIN FUNCTION DEFINITION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ============================================================================
-- 1. RECREATE ENROLLMENT_BALANCES VIEW WITH UNIFIED VOID CHECKING
-- ============================================================================
DROP VIEW IF EXISTS public.enrollment_balances CASCADE;

CREATE OR REPLACE VIEW public.enrollment_balances
WITH (security_invoker = true) AS
SELECT
  e.enrollment_id,
  e.student_id,
  s.name AS student_name,
  e.course_id,
  c.course_name,
  e.agreed_cost,
  e.status AS enrollment_status,
  e.enrolled_at,
  COALESCE(p_totals.total_paid, 0::numeric) AS total_paid,
  e.agreed_cost - COALESCE(p_totals.total_paid, 0::numeric) AS remaining_balance,
  CASE
    WHEN (e.agreed_cost - COALESCE(p_totals.total_paid, 0::numeric)) = 0
         AND COALESCE(p_totals.total_paid, 0::numeric) > 0 THEN 'Paid'
    WHEN (e.agreed_cost - COALESCE(p_totals.total_paid, 0::numeric)) < 0 THEN 'Overpaid'
    WHEN COALESCE(p_totals.total_paid, 0::numeric) = 0 THEN 'Unpaid'
    ELSE 'Partial'
  END AS payment_status
FROM public.enrollments AS e
JOIN public.students AS s ON s.student_id = e.student_id
JOIN public.courses AS c ON c.course_id = e.course_id
LEFT JOIN (
  SELECT enrollment_id, sum(amount) AS total_paid
  FROM public.payments
  WHERE voided_at IS NULL
  GROUP BY enrollment_id
) AS p_totals ON p_totals.enrollment_id = e.enrollment_id;

REVOKE ALL ON public.enrollment_balances FROM PUBLIC, anon;
GRANT SELECT ON public.enrollment_balances TO authenticated;

-- Recreate dashboard_metrics to maintain dependency tree with updated enrollment_balances
CREATE OR REPLACE VIEW public.dashboard_metrics
WITH (security_invoker = true) AS
SELECT
  (SELECT count(*) FROM public.students) AS total_students,
  (SELECT count(*) FROM public.students WHERE created_at >= date_trunc('month', now())) AS new_students_this_month,
  (SELECT count(*) FROM public.courses WHERE availability_status = 'Active') AS active_courses,
  (SELECT count(*) FROM public.enrollments WHERE status = 'Active') AS active_enrollments,
  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.payments
    WHERE voided_at IS NULL AND payment_date >= date_trunc('month', now())) AS revenue_this_month,
  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.expenses
    WHERE voided_at IS NULL AND expense_date >= date_trunc('month', now())) AS expenses_this_month,
  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.payments
    WHERE voided_at IS NULL AND payment_date >= date_trunc('month', now()))
    -
  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.expenses
    WHERE voided_at IS NULL AND expense_date >= date_trunc('month', now())) AS net_profit_this_month,
  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.payments WHERE voided_at IS NULL) AS total_revenue_all_time,
  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.expenses WHERE voided_at IS NULL) AS total_expenses_all_time,
  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.payments WHERE voided_at IS NULL)
    -
  (SELECT COALESCE(sum(amount), 0::numeric) FROM public.expenses WHERE voided_at IS NULL) AS net_profit_all_time,
  (SELECT COALESCE(sum(eb.remaining_balance), 0::numeric)
    FROM public.enrollment_balances AS eb
    WHERE eb.enrollment_status = 'Active' AND eb.remaining_balance > 0::numeric) AS total_pending_balance;

REVOKE ALL ON public.dashboard_metrics FROM PUBLIC, anon;
GRANT SELECT ON public.dashboard_metrics TO authenticated;


-- ============================================================================
-- 2. HARDEN RECORD_PAYMENT & RECORD_EXPENSE RPCs
-- ============================================================================

-- Drop old overloads for record_payment
DROP FUNCTION IF EXISTS public.record_payment(uuid, uuid, numeric, date, text, text, text);
DROP FUNCTION IF EXISTS public.record_payment(uuid, uuid, numeric, date, text, text);
DROP FUNCTION IF EXISTS public.record_payment(uuid, uuid, numeric, date, text);
DROP FUNCTION IF EXISTS public.record_payment(uuid, uuid, numeric, date);
DROP FUNCTION IF EXISTS public.record_payment(uuid, uuid, numeric);

CREATE OR REPLACE FUNCTION public.record_payment(
  p_enrollment_id uuid,
  p_cash_box_id uuid,
  p_amount numeric,
  p_payment_date date DEFAULT CURRENT_DATE,
  p_method text DEFAULT 'Cash',
  p_receipt_ref text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_enrollment public.enrollments%ROWTYPE;
  v_cash_box public.cash_boxes%ROWTYPE;
  v_total_paid numeric(12,2);
  v_remaining numeric(12,2);
  v_payment public.payments%ROWTYPE;
BEGIN
  -- Strict Admin Guard
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: only administrators can record payments';
  END IF;

  -- Validate Amount
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'المبلغ يجب أن يكون أكبر من صفر';
  END IF;

  -- Lock and validate cash box
  SELECT * INTO v_cash_box
  FROM public.cash_boxes
  WHERE cash_box_id = p_cash_box_id
  FOR UPDATE;

  IF NOT FOUND OR NOT v_cash_box.is_active THEN
    RAISE EXCEPTION 'الخزينة المحددة غير موجودة أو غير نشطة';
  END IF;

  -- Lock and validate enrollment row
  SELECT * INTO v_enrollment
  FROM public.enrollments
  WHERE enrollment_id = p_enrollment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الاشتراك المحدد غير موجود';
  END IF;

  IF v_enrollment.status = 'Dropped' THEN
    RAISE EXCEPTION 'لا يمكن تسجيل دفعة لمتدرب منسحب';
  END IF;

  -- Calculate current active total paid (strictly excluding voided records)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.payments
  WHERE enrollment_id = p_enrollment_id
    AND voided_at IS NULL;

  v_remaining := v_enrollment.agreed_cost - v_total_paid;

  IF p_amount > v_remaining THEN
    RAISE EXCEPTION 'المبلغ المُدخل (%) يتجاوز المتبقي المطلوب (%)', p_amount, v_remaining;
  END IF;

  -- Insert payment with audited added_by = auth.uid()
  INSERT INTO public.payments (
    enrollment_id,
    cash_box_id,
    amount,
    payment_date,
    method,
    receipt_ref,
    notes,
    added_by
  ) VALUES (
    p_enrollment_id,
    p_cash_box_id,
    p_amount,
    COALESCE(p_payment_date, CURRENT_DATE),
    COALESCE(p_method, 'Cash'),
    p_receipt_ref,
    p_notes,
    auth.uid()
  )
  RETURNING * INTO v_payment;

  RETURN v_payment;
END;
$function$;

-- Drop old overloads for record_expense
DROP FUNCTION IF EXISTS public.record_expense(uuid, numeric, date, text, text, text, uuid);
DROP FUNCTION IF EXISTS public.record_expense(uuid, numeric, date, text, text, text);
DROP FUNCTION IF EXISTS public.record_expense(uuid, numeric, date, text, text);
DROP FUNCTION IF EXISTS public.record_expense(uuid, numeric, date, text);
DROP FUNCTION IF EXISTS public.record_expense(uuid, numeric, date);
DROP FUNCTION IF EXISTS public.record_expense(uuid, numeric);

CREATE OR REPLACE FUNCTION public.record_expense(
  p_cash_box_id uuid,
  p_amount numeric,
  p_expense_date date DEFAULT CURRENT_DATE,
  p_category text DEFAULT 'Other',
  p_description text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_course_id uuid DEFAULT NULL
)
RETURNS public.expenses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_cash_box public.cash_boxes%ROWTYPE;
  v_expense public.expenses%ROWTYPE;
BEGIN
  -- Strict Admin Guard
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: only administrators can record expenses';
  END IF;

  -- Validate Amount
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'المبلغ يجب أن يكون أكبر من صفر';
  END IF;

  -- Lock and validate cash box
  SELECT * INTO v_cash_box
  FROM public.cash_boxes
  WHERE cash_box_id = p_cash_box_id
  FOR UPDATE;

  IF NOT FOUND OR NOT v_cash_box.is_active THEN
    RAISE EXCEPTION 'الخزينة المحددة غير موجودة أو غير نشطة';
  END IF;

  -- Validate course if provided
  IF p_course_id IS NOT NULL THEN
    PERFORM 1 FROM public.courses WHERE course_id = p_course_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'الدورة التدريبية المحددة غير موجودة';
    END IF;
  END IF;

  -- Insert expense with audited added_by = auth.uid()
  INSERT INTO public.expenses (
    cash_box_id,
    amount,
    expense_date,
    category,
    description,
    notes,
    course_id,
    added_by
  ) VALUES (
    p_cash_box_id,
    p_amount,
    COALESCE(p_expense_date, CURRENT_DATE),
    COALESCE(p_category, 'Other'),
    p_description,
    p_notes,
    p_course_id,
    auth.uid()
  )
  RETURNING * INTO v_expense;

  RETURN v_expense;
END;
$function$;

REVOKE ALL ON FUNCTION public.record_payment(uuid, uuid, numeric, date, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_payment(uuid, uuid, numeric, date, text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.record_expense(uuid, numeric, date, text, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_expense(uuid, numeric, date, text, text, text, uuid) TO authenticated;


-- ============================================================================
-- 3. STRICT RLS POLICIES ON ALL CORE TABLES (ADMINS ONLY)
-- ============================================================================

-- Ensure RLS is enabled and forced on all core tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins FORCE ROW LEVEL SECURITY;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students FORCE ROW LEVEL SECURITY;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses FORCE ROW LEVEL SECURITY;

ALTER TABLE public.cash_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_boxes FORCE ROW LEVEL SECURITY;

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments FORCE ROW LEVEL SECURITY;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses FORCE ROW LEVEL SECURITY;

ALTER TABLE public.cash_box_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_box_transfers FORCE ROW LEVEL SECURITY;

-- CRITICAL FIX: In PostgreSQL, permissive policies combine via OR logic.
-- To prevent any legacy permissive policy (such as anon_select_*, anon_insert_*, Allow authenticated read, etc.)
-- from silently bypassing admin-only restrictions, we dynamically purge ALL existing policies
-- on the 8 core tables before creating the singular, authoritative admin policy.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'admins', 'students', 'courses', 'cash_boxes',
        'enrollments', 'payments', 'expenses', 'cash_box_transfers'
      )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Revoke all table-level privileges from anon and public to block direct REST endpoints for unauthenticated users
REVOKE ALL ON TABLE public.admins, public.students, public.courses, public.cash_boxes,
                    public.enrollments, public.payments, public.expenses, public.cash_box_transfers
FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admins, public.students, public.courses, public.cash_boxes,
                                              public.enrollments, public.payments, public.expenses, public.cash_box_transfers
TO authenticated;

-- 1) Admins table: user can verify own membership via auth_user_id, and full admins can read all
CREATE POLICY "admins_admin_only_policy" ON public.admins
FOR ALL TO authenticated
USING (auth_user_id = auth.uid() OR public.is_admin())
WITH CHECK (public.is_admin());

-- 2) Students: Only authenticated administrators can read/write
CREATE POLICY "students_admin_only_policy" ON public.students
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3) Courses: Only authenticated administrators can read/write
CREATE POLICY "courses_admin_only_policy" ON public.courses
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4) Cash boxes: Only authenticated administrators can read/write
CREATE POLICY "cash_boxes_admin_only_policy" ON public.cash_boxes
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5) Enrollments: Only authenticated administrators can read; writes via RPC or is_admin()
CREATE POLICY "enrollments_admin_only_policy" ON public.enrollments
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6) Payments: Only authenticated administrators can read; direct writes revoked / restricted
CREATE POLICY "payments_admin_only_policy" ON public.payments
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7) Expenses: Only authenticated administrators can read; direct writes revoked / restricted
CREATE POLICY "expenses_admin_only_policy" ON public.expenses
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 8) Cash Box Transfers: Only authenticated administrators can read; direct writes revoked / restricted
CREATE POLICY "transfers_admin_only_policy" ON public.cash_box_transfers
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

COMMIT;
```

---

### File: `202610210007_purge_legacy_rls_and_revoke_public.sql`
> **Version:** `202610210007` | **Size:** `8137` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `NO`
> **SHA-256:** `5b6f2351acdd9b2384dcb88a553fada2688b8aedc31520f3a024ad338b642873`

```sql
-- ============================================================================
-- Migration: 202610210007_purge_legacy_rls_and_revoke_public.sql
-- Project: Elmasry Academy LMS (TrainerPro)
-- Target: Dedicated RLS Purge, Financial Write Lockdown & Transfer Immutability
-- Lead Architect: Eng. Ahmed El-Falah (م/ أحمد الفلاح)
-- ============================================================================
-- Key Hardening:
-- 1. Dynamically purges all existing RLS policies on the 8 core tables (clearing duplicates).
-- 2. Fully closes direct PostgREST writes (INSERT/UPDATE/DELETE) on the 4 transactional tables:
--    enrollments, payments, expenses, cash_box_transfers.
--    Writes to these tables MUST go exclusively through authorized SECURITY DEFINER RPCs.
-- 3. Grants SELECT, INSERT, UPDATE, DELETE to authenticated admins ONLY on entity tables:
--    admins, students, courses, cash_boxes.
-- 4. Establishes singular, authoritative admin-only RLS policies.
-- 5. Adds missing immutability trigger on cash_box_transfers.
-- 6. Revokes execution of sensitive RPC functions from PUBLIC and anon.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DYNAMIC PURGE OF ALL EXISTING POLICIES ON THE 8 CORE TABLES
-- ============================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'admins', 'students', 'courses', 'cash_boxes',
        'enrollments', 'payments', 'expenses', 'cash_box_transfers'
      )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;


-- ============================================================================
-- 2. ENFORCE AND FORCE ROW LEVEL SECURITY ON ALL 8 TABLES
-- ============================================================================
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins FORCE ROW LEVEL SECURITY;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students FORCE ROW LEVEL SECURITY;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses FORCE ROW LEVEL SECURITY;

ALTER TABLE public.cash_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_boxes FORCE ROW LEVEL SECURITY;

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments FORCE ROW LEVEL SECURITY;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses FORCE ROW LEVEL SECURITY;

ALTER TABLE public.cash_box_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_box_transfers FORCE ROW LEVEL SECURITY;


-- ============================================================================
-- 3. TABLE PRIVILEGES: STRICT SPLIT BETWEEN ENTITIES AND TRANSACTIONAL LEDGER
-- ============================================================================
-- Step 3a: Completely revoke all table privileges from PUBLIC and anon
REVOKE ALL ON TABLE public.admins, public.students, public.courses, public.cash_boxes,
                    public.enrollments, public.payments, public.expenses, public.cash_box_transfers
FROM PUBLIC, anon;

-- Step 3b: Entity Tables (Students, Courses, Cash Boxes)
-- Allow authenticated admins to perform standard CRUD operations via UI
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.students, public.courses, public.cash_boxes
TO authenticated;

-- Step 3c: Administrative & Financial Tables (Admins, Enrollments, Payments, Expenses, Transfers)
-- READ-ONLY for authenticated users. Direct INSERT, UPDATE, DELETE are strictly REVOKED!
-- 1. Admins: Provisioning is restricted to trusted administrative channels / database operators;
--    authenticated sessions can only query to verify own identity or active admin list.
-- 2. Ledger & Enrollments: All writes must execute via audited SECURITY DEFINER RPCs.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.admins, public.enrollments, public.payments, public.expenses, public.cash_box_transfers
FROM authenticated;

GRANT SELECT ON TABLE public.admins, public.enrollments, public.payments, public.expenses, public.cash_box_transfers
TO authenticated;


-- ============================================================================
-- 4. CREATE SINGULAR, CRISP ADMIN-ONLY RLS POLICIES
-- ============================================================================

-- 1) Admins: SELECT only for authenticated users to verify identity / check active admin status
CREATE POLICY "admins_admin_only_policy" ON public.admins
FOR SELECT TO authenticated
USING (auth_user_id = auth.uid() OR public.is_admin());

-- 2) Students: Only authenticated administrators can read/write
CREATE POLICY "students_admin_only_policy" ON public.students
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3) Courses: Only authenticated administrators can read/write
CREATE POLICY "courses_admin_only_policy" ON public.courses
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4) Cash boxes: Only authenticated administrators can read/write
CREATE POLICY "cash_boxes_admin_only_policy" ON public.cash_boxes
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5) Enrollments: SELECT only for authenticated admins; writes exclusively via enroll_student / set_enrollment_status RPCs
CREATE POLICY "enrollments_admin_only_policy" ON public.enrollments
FOR SELECT TO authenticated
USING (public.is_admin());

-- 6) Payments: SELECT only for authenticated admins; writes exclusively via record_payment / void_payment RPCs
CREATE POLICY "payments_admin_only_policy" ON public.payments
FOR SELECT TO authenticated
USING (public.is_admin());

-- 7) Expenses: SELECT only for authenticated admins; writes exclusively via record_expense / void_expense RPCs
CREATE POLICY "expenses_admin_only_policy" ON public.expenses
FOR SELECT TO authenticated
USING (public.is_admin());

-- 8) Cash Box Transfers: SELECT only for authenticated admins; writes exclusively via transfer_between_boxes RPC
CREATE POLICY "transfers_admin_only_policy" ON public.cash_box_transfers
FOR SELECT TO authenticated
USING (public.is_admin());


-- ============================================================================
-- 5. IMMUTABILITY TRIGGER ON CASH_BOX_TRANSFERS
-- ============================================================================
-- Enforce append-only ledger for transfers, matching payments and expenses
CREATE OR REPLACE FUNCTION public.prevent_transfer_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RAISE EXCEPTION 'Cash box transfers are append-only and cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_transfers_financial_immutability ON public.cash_box_transfers;
CREATE TRIGGER trg_transfers_financial_immutability
BEFORE UPDATE OR DELETE ON public.cash_box_transfers
FOR EACH ROW EXECUTE FUNCTION public.prevent_transfer_mutation();


-- ============================================================================
-- 6. SECURE RPC EXECUTION PRIVILEGES (REVOKE FROM PUBLIC & ANON)
-- ============================================================================
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN (
    SELECT proname, oid
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'is_admin', 'record_payment', 'record_expense',
        'transfer_between_boxes', 'void_payment', 'void_expense',
        'enroll_student', 'set_enrollment_status'
      )
  ) LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon;', p.oid::regprocedure);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated;', p.oid::regprocedure);
  END LOOP;
END $$;

COMMIT;
```

---

### File: `202610210008_protect_cash_boxes_opening_balance.sql`
> **Version:** `202610210008` | **Size:** `9245` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `NO`
> **SHA-256:** `75d418a778b8e07c40a5c256b027cb0a836d5de3990fd698a9a67a05c07f7e5c`

```sql
-- ============================================================================
-- 🏛️ Migration 008: Protect Cash Boxes Opening Balance & Audited Creation RPC
-- Elmasry Academy LMS — Financial Ledger Integrity Hardening
-- Lead Architect: Eng. Ahmed El-Falah (م/ أحمد الفلاح)
-- Date: 21 October 2026
-- Reviewer: OpenCode (DeepSeek 4.1) Peer Reviewed
-- ============================================================================
-- PURPOSE:
-- 1. Preflight check: verify live schema with cash_box_id, type, is_active, opening_balance.
-- 2. Add `added_by` column to `cash_boxes` (ON DELETE SET NULL, WITHOUT DEFAULT)
--    so legacy historical records retain NULL (unattributed) rather than falsely
--    attributing legacy records to the administrator executing this migration.
-- 3. Trigger `trg_cash_boxes_immutability` (SECURITY INVOKER):
--    - Enforces opening_balance >= 0 and finite on INSERT.
--    - Rejects spoofed added_by and forces NEW.added_by := auth.uid().
--    - Blocks hard DELETE (mandating soft-delete via is_active = false).
--    - Freezes opening_balance, added_by, cash_box_id, and created_at on UPDATE.
-- 4. Audited RPC `create_cash_box()` with SECURITY DEFINER, safe search_path,
--    and explicit is_admin() authorization gating.
-- 5. Multi-layered Table & Column Privileges Lockdown (Defense-in-Depth):
--    - In PostgreSQL, table-level and column-level privileges are cumulative (union).
--    - Migration 007 previously granted table-level UPDATE on cash_boxes to authenticated.
--    - To enforce column-level protection on opening_balance, table-level UPDATE
--      MUST be explicitly revoked before granting column-specific UPDATE.
--    - Revoke table-level INSERT, UPDATE, DELETE, TRUNCATE from authenticated, anon, PUBLIC.
--    - Explicitly revoke column-level UPDATE on sensitive/protected columns.
--    - Grant table-level SELECT and column-level UPDATE strictly on operational fields:
--      (name, type, owner, is_active, notes).
-- ============================================================================

BEGIN;

-- Preflight: Fail fast if pointed at a legacy 001 schema missing canonical cash_box_id
DO $preflight$
BEGIN
  IF to_regclass('public.cash_boxes') IS NULL THEN
    RAISE EXCEPTION 'Migration 008 preflight failed: table public.cash_boxes does not exist.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cash_boxes' AND column_name = 'cash_box_id'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cash_boxes' AND column_name = 'opening_balance'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cash_boxes' AND column_name = 'is_active'
  ) THEN
    RAISE EXCEPTION 'Migration 008 preflight failed: expected cash_box_id, opening_balance, and is_active columns matching canonical schema.';
  END IF;

  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'Migration 008 preflight failed: required authorization function public.is_admin() is missing.';
  END IF;
END;
$preflight$;

-- Step 1: Add added_by tracking column to cash_boxes if not present (WITHOUT DEFAULT)
ALTER TABLE public.cash_boxes 
  ADD COLUMN IF NOT EXISTS added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.cash_boxes.added_by IS
  'UUID of administrator who created this cash box. NULL for legacy records created prior to Migration 008.';

-- Step 2: Trigger Function (SECURITY INVOKER - executes with caller privileges)
CREATE OR REPLACE FUNCTION public.prevent_cash_box_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- 1. On INSERT: Validate opening balance, reject spoofed added_by, bind creator identity
  IF TG_OP = 'INSERT' THEN
    IF NEW.opening_balance IS NULL OR NEW.opening_balance < 0.00 THEN
      RAISE EXCEPTION 'Opening balance cannot be null or negative.';
    END IF;

    IF NEW.opening_balance > 99999999.99 THEN
      RAISE EXCEPTION 'Opening balance exceeds maximum permitted numerical threshold (99,999,999.99).';
    END IF;

    -- Security Enforcement: Reject any explicit added_by that differs from caller identity
    IF NEW.added_by IS NOT NULL AND NEW.added_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized: cannot assign added_by to another user identity; must match authenticated user.'
        USING ERRCODE = '42501';
    END IF;

    -- Enforce caller identity
    NEW.added_by := auth.uid();
    RETURN NEW;
  END IF;

  -- 2. On DELETE: Block hard deletion (soft-delete via is_active = false is required)
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Direct deletion of cash boxes is prohibited; set is_active = false to archive.'
      USING ERRCODE = '42501';
  END IF;

  -- 3. On UPDATE: Prohibit modifying opening_balance, added_by, cash_box_id, or created_at
  IF TG_OP = 'UPDATE' THEN
    IF NEW.cash_box_id IS DISTINCT FROM OLD.cash_box_id THEN
      RAISE EXCEPTION 'The primary key (cash_box_id) of a cash box cannot be altered.';
    END IF;
    IF NEW.opening_balance IS DISTINCT FROM OLD.opening_balance THEN
      RAISE EXCEPTION 'The opening_balance of a cash box is immutable and cannot be modified after creation.';
    END IF;
    IF NEW.added_by IS DISTINCT FROM OLD.added_by THEN
      RAISE EXCEPTION 'The creator (added_by) of a cash box cannot be altered.';
    END IF;
    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'The creation timestamp (created_at) of a cash box cannot be altered.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_cash_box_mutation() IS
  'SECURITY INVOKER trigger function guarding cash_boxes against DELETE, invalid initial balances, spoofed added_by, and post-creation UPDATE to opening_balance.';

-- Step 3: Bind the Trigger to cash_boxes (INSERT, UPDATE, DELETE)
DROP TRIGGER IF EXISTS trg_cash_boxes_immutability ON public.cash_boxes;

CREATE TRIGGER trg_cash_boxes_immutability
  BEFORE INSERT OR UPDATE OR DELETE ON public.cash_boxes
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_cash_box_mutation();

-- Step 4: Create Audited RPC for Cash Box Creation (SECURITY DEFINER with safe search_path)
CREATE OR REPLACE FUNCTION public.create_cash_box(
  p_name varchar,
  p_type varchar DEFAULT 'Main',
  p_owner varchar DEFAULT NULL,
  p_opening_balance numeric DEFAULT 0.00,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_box_id uuid;
BEGIN
  -- Strict administrative authorization gate
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only system administrators can create cash boxes.'
      USING ERRCODE = '42501';
  END IF;

  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Cash box name is required.';
  END IF;

  IF p_opening_balance IS NULL OR p_opening_balance < 0.00 THEN
    RAISE EXCEPTION 'Opening balance cannot be null or negative.';
  END IF;

  IF p_opening_balance > 99999999.99 THEN
    RAISE EXCEPTION 'Opening balance exceeds maximum permitted numerical threshold (99,999,999.99).';
  END IF;

  INSERT INTO public.cash_boxes (name, type, owner, opening_balance, notes, added_by)
  VALUES (
    trim(p_name),
    COALESCE(trim(p_type), 'Main'),
    trim(p_owner),
    COALESCE(p_opening_balance, 0.00),
    trim(p_notes),
    auth.uid()
  )
  RETURNING cash_box_id INTO v_box_id;

  RETURN v_box_id;
END;
$$;

COMMENT ON FUNCTION public.create_cash_box(varchar, varchar, varchar, numeric, text) IS
  'Audited administrative RPC for creating cash boxes with atomic validation and creator tracking via auth.uid().';

-- Secure the RPC execution grants: authenticated only
REVOKE ALL ON FUNCTION public.create_cash_box FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_cash_box TO authenticated;

-- Step 5: Table & Column Level Privileges Lockdown (Defense-in-Depth)
-- 1. Explicitly revoke table-level write privileges from authenticated, anon, PUBLIC.
--    NOTE: In PostgreSQL, table-level and column-level privileges are cumulative (union).
--    Migration 007 previously granted table-level `UPDATE` on public.cash_boxes to authenticated.
--    Granting column-level UPDATE on selected columns does NOT restrict an existing table-level UPDATE.
--    Therefore, table-level UPDATE MUST be explicitly revoked so that only column-level UPDATE grants apply.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.cash_boxes FROM authenticated, anon, PUBLIC;

-- 2. Explicitly remove any prior column-level UPDATE grants on protected columns (table-level was removed in Step 1)
REVOKE UPDATE (cash_box_id, opening_balance, added_by, created_at) ON TABLE public.cash_boxes FROM authenticated, anon, PUBLIC;

-- 3. Grant table-level SELECT for reading cash boxes
GRANT SELECT ON TABLE public.cash_boxes TO authenticated;

-- 4. Grant column-level UPDATE strictly on operational fields (defense-in-depth against trigger failure)
GRANT UPDATE (name, type, owner, is_active, notes) ON TABLE public.cash_boxes TO authenticated;

COMMIT;
```

---

### File: `20261021171218_allow_cash_box_creator_nullification_on_auth_delete.sql`
> **Version:** `20261021171218` | **Size:** `3301` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `NO`
> **SHA-256:** `8b6062c2ac8253e2862782dd1b762455edccb8c078e8e38946bbf12779446f1f`

```sql
-- Migration 008 uses ON DELETE SET NULL for cash_boxes.added_by.
-- Permit that FK-driven nullification while keeping creator reassignment prohibited.
BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.prevent_cash_box_mutation()') IS NULL THEN
    RAISE EXCEPTION 'Migration 008 is required: public.prevent_cash_box_mutation() does not exist.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cash_boxes'
      AND column_name = 'added_by' AND data_type = 'uuid' AND is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION 'Migration 008 prerequisite failed: public.cash_boxes.added_by (nullable uuid) does not exist.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.cash_boxes'::regclass
      AND tgname = 'trg_cash_boxes_immutability'
      AND tgenabled <> 'D'
  ) THEN
    RAISE EXCEPTION 'Migration 008 prerequisite failed: trg_cash_boxes_immutability is not bound or enabled on public.cash_boxes.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_cash_box_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- On INSERT: validate opening balance, reject spoofed added_by, bind creator identity.
  IF TG_OP = 'INSERT' THEN
    IF NEW.opening_balance IS NULL OR NEW.opening_balance < 0.00 THEN
      RAISE EXCEPTION 'Opening balance cannot be null or negative.';
    END IF;

    IF NEW.opening_balance > 99999999.99 THEN
      RAISE EXCEPTION 'Opening balance exceeds maximum permitted numerical threshold (99,999,999.99).';
    END IF;

    IF NEW.added_by IS NOT NULL AND NEW.added_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized: cannot assign added_by to another user identity; must match authenticated user.'
        USING ERRCODE = '42501';
    END IF;

    NEW.added_by := auth.uid();
    RETURN NEW;
  END IF;

  -- On DELETE: block hard deletion; cash boxes are archived with is_active = false.
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Direct deletion of cash boxes is prohibited; set is_active = false to archive.'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.cash_box_id IS DISTINCT FROM OLD.cash_box_id THEN
      RAISE EXCEPTION 'The primary key (cash_box_id) of a cash box cannot be altered.';
    END IF;
    IF NEW.opening_balance IS DISTINCT FROM OLD.opening_balance THEN
      RAISE EXCEPTION 'The opening_balance of a cash box is immutable and cannot be modified after creation.';
    END IF;
    -- The FK's ON DELETE SET NULL action must be allowed, but never reassign a creator.
    IF NEW.added_by IS DISTINCT FROM OLD.added_by
       AND NOT (OLD.added_by IS NOT NULL AND NEW.added_by IS NULL) THEN
      RAISE EXCEPTION 'The creator (added_by) of a cash box cannot be altered.';
    END IF;
    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'The creation timestamp (created_at) of a cash box cannot be altered.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_cash_box_mutation() IS
  'Guards cash_boxes against deletion, invalid opening balances, creator reassignment, and changes to immutable fields; permits ON DELETE SET NULL for the creator foreign key.';

COMMIT;
```

---

### File: `20261021214608_add_login_alert_dedupe.sql`
> **Version:** `20261021214608` | **Size:** `753` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `NO`
> **SHA-256:** `f8f29a9cac267f12f5672f4455fea24a589dd25b90b132e0866f514fae14700b`

```sql
-- Stores only a one-way hash of Supabase session IDs to prevent duplicate
-- Telegram alerts. No email address or IP address is persisted in this table.
BEGIN;

CREATE TABLE IF NOT EXISTS public.login_alert_dedupe (
  session_hash TEXT PRIMARY KEY
    CHECK (session_hash ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_alert_dedupe_created_at
  ON public.login_alert_dedupe (created_at);

ALTER TABLE public.login_alert_dedupe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_alert_dedupe FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.login_alert_dedupe FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.login_alert_dedupe TO service_role;

COMMIT;
```

---

### File: `20261021223822_rbac_catalog_and_authorization_primitives.sql`
> **Version:** `20261021223822` | **Size:** `15340` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `NO`
> **SHA-256:** `b3bf1746b26fcb0b3ffda3be0e715ca961774da43eaabc3aa657b5759feb9fae`

```sql
-- RBAC foundation only. This migration is additive and intentionally does NOT:
--   * replace public.is_admin(), existing RLS policies, view grants, or RPC guards;
--   * reduce or expand current administrator access;
--   * assign roles to existing administrators, invite users, or alter business data.
-- The authorization cutover must be a later, separately reviewed migration after
-- every client query has been updated and each role has been verified safely.

-- Preflight against the canonical live schema (not the obsolete local bootstrap):
-- admins must be the Auth-linked table with the role label used by migrations 005+.
DO $preflight$
BEGIN
  IF to_regclass('public.admins') IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'admins'
         AND column_name = 'auth_user_id' AND data_type = 'uuid'
     )
     OR NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'admins'
         AND column_name = 'role' AND data_type = 'character varying'
     ) THEN
    RAISE EXCEPTION 'RBAC foundation preflight failed: expected public.admins(auth_user_id uuid, role varchar) was not found.';
  END IF;
END
$preflight$;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS admins_single_platform_owner_idx
  ON public.admins (is_owner)  WHERE is_owner IS TRUE;

CREATE TABLE IF NOT EXISTS public.admin_roles (
  role_key text PRIMARY KEY CHECK (role_key ~ '^[a-z][a-z0-9_]{1,49}$'),
  display_name text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  is_assignable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permission_catalog (
  permission_key text PRIMARY KEY CHECK (permission_key ~ '^[a-z][a-z0-9_.]{2,99}$'),
  description text NOT NULL,
  is_delegable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
  role_key text NOT NULL REFERENCES public.admin_roles(role_key) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES public.permission_catalog(permission_key) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_key, permission_key)
);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  audit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_auth_user_id uuid NOT NULL,
  target_auth_user_id uuid,
  action text NOT NULL CHECK (action IN (
    'owner_claimed', 'owner_transferred', 'admin_invited', 'admin_role_changed',
    'admin_disabled', 'admin_enabled', 'role_created', 'role_updated',
    'role_deleted', 'role_permissions_changed'
  )),
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx
  ON public.admin_audit_log (target_auth_user_id, created_at DESC);

CREATE OR REPLACE FUNCTION private.prevent_admin_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
BEGIN
  RAISE EXCEPTION 'Administrator audit records are append-only.' USING ERRCODE = '42501';
  RETURN OLD;
END;
$function$;

REVOKE ALL ON FUNCTION private.prevent_admin_audit_mutation() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_admin_audit_log_immutable
  BEFORE UPDATE OR DELETE ON public.admin_audit_log
  FOR EACH ROW EXECUTE FUNCTION private.prevent_admin_audit_mutation();

CREATE TRIGGER trg_admin_audit_log_no_truncate
  BEFORE TRUNCATE ON public.admin_audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION private.prevent_admin_audit_mutation();

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admin_roles, public.permission_catalog,
  public.admin_role_permissions, public.admin_audit_log
  FROM PUBLIC, anon, authenticated;

INSERT INTO public.admin_roles (role_key, display_name, is_system, is_assignable)
VALUES
  ('superadmin', 'Platform Owner', true, false),
  ('academy_manager', 'Academy Manager', true, true),
  ('finance_manager', 'Finance Manager', true, true)
ON CONFLICT (role_key) DO UPDATE
SET display_name = EXCLUDED.display_name,
    is_system = EXCLUDED.is_system,
    is_assignable = EXCLUDED.is_assignable;

DO $role_fk$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.admins AS a
    LEFT JOIN public.admin_roles AS r ON r.role_key = a.role
    WHERE r.role_key IS NULL
  ) THEN
    RAISE EXCEPTION 'RBAC foundation preflight failed: public.admins contains a role key missing from public.admin_roles; reconcile role labels before applying this migration.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.admins'::regclass
      AND conname = 'admins_role_catalog_fk'
  ) THEN
    ALTER TABLE public.admins
      ADD CONSTRAINT admins_role_catalog_fk
      FOREIGN KEY (role) REFERENCES public.admin_roles(role_key)
      ON UPDATE RESTRICT ON DELETE RESTRICT NOT VALID;
  END IF;
END
$role_fk$;

ALTER TABLE public.admins VALIDATE CONSTRAINT admins_role_catalog_fk;

INSERT INTO public.permission_catalog (permission_key, description, is_delegable)
VALUES
  ('dashboard.operational.read', 'Read operational dashboard metrics.', true),
  ('dashboard.finance.read', 'Read financial dashboard metrics.', true),
  ('students.read', 'Read permitted student identity fields.', true),
  ('students.read_contact_phone', 'Read student phone numbers for follow-up.', true),
  ('students.email.read', 'Read student email addresses.', false),
  ('students.email.update', 'Create or update student email addresses.', false),
  ('students.create', 'Create student records.', true),
  ('students.update', 'Update permitted student fields.', true),
  ('students.archive', 'Archive student records.', true),
  ('students.export', 'Export permitted student data.', true),
  ('courses.read', 'Read operational course data.', true),
  ('courses.create', 'Create courses.', true),
  ('courses.update', 'Update permitted course fields.', true),
  ('courses.close', 'Close courses.', true),
  ('courses.pricing.read', 'Read course prices.', true),
  ('courses.pricing.update', 'Create or update course prices.', true),
  ('courses.export', 'Export permitted course data.', true),
  ('enrollments.read', 'Read operational enrollment data.', true),
  ('enrollments.create', 'Enroll a student using the server-side default price.', true),
  ('enrollments.update_status', 'Update enrollment status.', true),
  ('enrollments.financial.read', 'Read enrollment fees, payments, balances, and payment status.', true),
  ('enrollments.pricing.override', 'Set a non-default enrollment price.', true),
  ('enrollments.export', 'Export permitted enrollment data.', true),
  ('finance.payments.read', 'Read payment records.', true),
  ('finance.payments.record', 'Record payments.', true),
  ('finance.payments.void', 'Void payment records.', false),
  ('finance.payments.export', 'Export payment records.', true),
  ('finance.expenses.read', 'Read expense records.', true),
  ('finance.expenses.record', 'Record expenses.', true),
  ('finance.expenses.void', 'Void expense records.', false),
  ('finance.expenses.export', 'Export expense records.', true),
  ('finance.cash_boxes.read', 'Read cash boxes and balances.', true),
  ('finance.cash_boxes.update', 'Update approved cash-box metadata.', true),
  ('finance.cash_boxes.create', 'Create cash boxes.', false),
  ('finance.cash_boxes.archive', 'Archive cash boxes.', false),
  ('finance.transfers.read', 'Read cash-box transfers.', true),
  ('finance.transfers.create', 'Transfer funds between cash boxes.', true),
  ('finance.reports.read', 'Read financial reports.', true),
  ('finance.reports.export', 'Export financial reports.', true),
  ('admins.read', 'Read administrator accounts.', false),
  ('admins.invite', 'Invite administrator accounts.', false),
  ('admins.assign_role', 'Assign administrator roles.', false),
  ('admins.disable', 'Disable administrator accounts.', false),
  ('roles.read', 'Read role and permission definitions.', false),
  ('roles.create', 'Create custom roles.', false),
  ('roles.update', 'Update custom role permissions.', false),
  ('roles.delete', 'Delete custom roles.', false),
  ('audit.read', 'Read administrator audit events.', false)
ON CONFLICT (permission_key) DO UPDATE
SET description = EXCLUDED.description,
    is_delegable = EXCLUDED.is_delegable;

-- The reserved superadmin label is not itself a privilege grant. Full platform
-- access comes only from the protected is_owner marker; this avoids a legacy
-- or accidentally assigned superadmin role receiving owner powers pre-claim.
DELETE FROM public.admin_role_permissions WHERE role_key = 'superadmin';

INSERT INTO public.admin_role_permissions (role_key, permission_key)
SELECT 'academy_manager', permission_key
FROM public.permission_catalog
WHERE permission_key = ANY (ARRAY[
  'dashboard.operational.read',
  'students.read', 'students.read_contact_phone', 'students.create', 'students.update',
  'courses.read', 'courses.create', 'courses.update', 'courses.close',
  'enrollments.read', 'enrollments.create', 'enrollments.update_status'
])
ON CONFLICT DO NOTHING;

INSERT INTO public.admin_role_permissions (role_key, permission_key)
SELECT 'finance_manager', permission_key
FROM public.permission_catalog
WHERE permission_key = ANY (ARRAY[
  'dashboard.finance.read', 'students.read',
  'enrollments.read', 'enrollments.financial.read',
  'finance.payments.read', 'finance.payments.record',
  'finance.expenses.read', 'finance.expenses.record',
  'finance.cash_boxes.read', 'finance.cash_boxes.update',
  'finance.transfers.read', 'finance.transfers.create',
  'finance.reports.read', 'finance.reports.export'
])
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION private.is_platform_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins AS a
    WHERE a.auth_user_id = auth.uid()
      AND a.is_active IS TRUE
      AND a.is_owner IS TRUE
  );
$function$;

CREATE OR REPLACE FUNCTION private.has_permission(p_permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.admins AS a
      WHERE a.auth_user_id = auth.uid()
        AND a.is_active IS TRUE
        AND EXISTS (
          SELECT 1 FROM public.permission_catalog AS pc
          WHERE pc.permission_key = p_permission_key
        )
        AND (
          a.is_owner IS TRUE
          OR EXISTS (
            SELECT 1
            FROM public.admin_role_permissions AS arp
            WHERE arp.role_key = a.role
              AND arp.permission_key = p_permission_key
          )
        )
    ),
    false
  );
$function$;

REVOKE ALL ON FUNCTION private.is_platform_owner() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.has_permission(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_platform_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_permission(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_authorization()
RETURNS TABLE (role_key text, is_owner boolean, permissions text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT
    a.role::text,
    a.is_owner,
    COALESCE(
      array_agg(DISTINCT p.permission_key ORDER BY p.permission_key)
        FILTER (WHERE p.permission_key IS NOT NULL),
      ARRAY[]::text[]
    )
  FROM public.admins AS a
  LEFT JOIN public.admin_role_permissions AS arp
    ON a.is_owner IS NOT TRUE AND arp.role_key = a.role
  LEFT JOIN public.permission_catalog AS p
    ON a.is_owner IS TRUE OR p.permission_key = arp.permission_key
  WHERE a.auth_user_id = auth.uid()
    AND a.is_active IS TRUE
  GROUP BY a.role, a.is_owner;
$function$;

CREATE OR REPLACE FUNCTION public.claim_platform_owner()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_active_superadmins bigint;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required.' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('elmasry_platform_owner_claim', 0));

  IF EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_user_id = v_auth_user_id AND is_active AND is_owner
  ) THEN
    RETURN true;
  END IF;

  IF EXISTS (SELECT 1 FROM public.admins WHERE is_owner IS TRUE) THEN
    RAISE EXCEPTION 'The platform owner has already been claimed.' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_active_superadmins
  FROM public.admins
  WHERE role = 'superadmin' AND is_active IS TRUE;

  IF v_active_superadmins <> 1 OR NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_user_id = v_auth_user_id
      AND role = 'superadmin'
      AND is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Owner claim requires exactly one active superadmin and the caller must be that account.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.admins
  SET is_owner = true
  WHERE auth_user_id = v_auth_user_id
    AND role = 'superadmin'
    AND is_active IS TRUE;

  INSERT INTO public.admin_audit_log (
    actor_auth_user_id, target_auth_user_id, action, before_state, after_state
  ) VALUES (
    v_auth_user_id, v_auth_user_id, 'owner_claimed',
    jsonb_build_object('is_owner', false),
    jsonb_build_object('is_owner', true, 'role', 'superadmin')
  );

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_my_authorization() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_platform_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_authorization() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_platform_owner() TO authenticated;

COMMENT ON TABLE public.admin_roles IS
  'RBAC role catalog. Direct client access is revoked; use reviewed owner-authorized operations.';
COMMENT ON TABLE public.permission_catalog IS
  'Stable application permission keys. Direct client access is revoked.';
COMMENT ON TABLE public.admin_role_permissions IS
  'Role-to-permission mapping. Direct client access is revoked.';
COMMENT ON TABLE public.admin_audit_log IS
  'Append-only audit trail for administrator and role changes. Direct client access is revoked.';
COMMENT ON COLUMN public.admins.is_owner IS
  'Protected platform owner marker; unique across admins and not assignable through normal role changes.';
COMMENT ON COLUMN public.admins.is_active IS
  'Database-enforced administrator enablement state for future RBAC cutover.';
```

---

### File: `20261021224440_rbac_role_aware_data_endpoints.sql`
> **Version:** `20261021224440` | **Size:** `23196` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `NO`
> **SHA-256:** `053ee2d38796214f624d8ded4a34d1f29c4c58cea22a18d4da2de47d6ea50386`

```sql
-- RBAC role-aware read endpoints (additive rollout phase).
--
-- These SECURITY DEFINER RPCs expose explicit, permission-filtered projections.
-- They intentionally do NOT revoke current table/view grants or change legacy
-- RLS policies. Existing clients can still reach legacy paths until a later,
-- coordinated cutover after all callers have been migrated and role-tested.
-- This migration has NOT been applied to any Supabase project.

DO $preflight$
BEGIN
  IF to_regclass('public.students') IS NULL
     OR to_regclass('public.courses') IS NULL
     OR to_regclass('public.enrollments') IS NULL
     OR to_regclass('public.payments') IS NULL
     OR to_regclass('public.expenses') IS NULL
     OR to_regclass('public.cash_boxes') IS NULL
     OR to_regclass('public.cash_box_transfers') IS NULL
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'voided_at')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'voided_at')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cash_boxes' AND column_name = 'is_active') THEN
    RAISE EXCEPTION 'RBAC endpoints preflight failed: one or more canonical business tables are missing.';
  END IF;
END
$preflight$;

CREATE OR REPLACE FUNCTION public.rbac_list_students(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_student_id uuid DEFAULT NULL
)
RETURNS TABLE (
  student_id uuid, name text, phone text, email text,
  employment_status text, grad_status text, grad_college text,
  previous_courses text, notes text, created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('students.read') THEN
    RAISE EXCEPTION 'Permission denied: students.read is required.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT s.student_id, s.name::text,
    CASE WHEN private.has_permission('students.read_contact_phone') THEN s.phone::text END,
    CASE WHEN private.has_permission('students.email.read') THEN s.email::text END,
    CASE WHEN private.has_permission('students.update') THEN s.employment_status::text END,
    CASE WHEN private.has_permission('students.update') THEN s.grad_status::text END,
    CASE WHEN private.has_permission('students.update') THEN s.grad_college::text END,
    CASE WHEN private.has_permission('students.update') THEN s.previous_courses END,
    CASE WHEN private.has_permission('students.update') THEN s.notes END,
    s.created_at, s.updated_at
  FROM public.students AS s
  WHERE (p_student_id IS NULL OR s.student_id = p_student_id)
    AND (p_search IS NULL OR btrim(p_search) = ''
      OR s.name ILIKE '%' || left(btrim(p_search), 100) || '%'
      OR (private.has_permission('students.read_contact_phone') AND s.phone ILIKE '%' || left(btrim(p_search), 100) || '%'))
  ORDER BY s.name, s.student_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_courses(
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0,
  p_course_id uuid DEFAULT NULL
)
RETURNS TABLE (
  course_id uuid, course_name text, description text, level text,
  duration_weeks integer, prerequisite_courses text, start_date date, end_date date,
  max_students integer, default_cost numeric, availability_status text,
  link_whatsapp text, link_tasks text, link_drive text, link_sources text,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('courses.read') THEN
    RAISE EXCEPTION 'Permission denied: courses.read is required.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT c.course_id, c.course_name::text, c.description, c.level::text,
    c.duration_weeks, c.prerequisite_courses, c.start_date, c.end_date,
    c.max_students,
    CASE WHEN private.has_permission('courses.pricing.read') THEN c.default_cost END,
    c.availability_status::text, c.link_whatsapp, c.link_tasks, c.link_drive,
    c.link_sources, c.created_at, c.updated_at
  FROM public.courses AS c
  WHERE p_course_id IS NULL OR c.course_id = p_course_id
  ORDER BY c.start_date NULLS LAST, c.course_name, c.course_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_enrollments(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0,
  p_student_id uuid DEFAULT NULL,
  p_course_id uuid DEFAULT NULL
)
RETURNS TABLE (
  enrollment_id uuid, student_id uuid, student_name text, student_phone text,
  course_id uuid, course_name text, enrollment_status text, enrolled_at timestamptz,
  agreed_cost numeric, total_paid numeric, remaining_balance numeric, payment_status text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE
  v_finance boolean := private.has_permission('enrollments.financial.read');
  v_phone boolean := private.has_permission('students.read_contact_phone');
BEGIN
  IF NOT private.has_permission('enrollments.read') THEN
    RAISE EXCEPTION 'Permission denied: enrollments.read is required.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH paid AS (
    SELECT p.enrollment_id, sum(p.amount) AS amount_paid
    FROM public.payments AS p
    WHERE p.voided_at IS NULL
    GROUP BY p.enrollment_id
  )
  SELECT e.enrollment_id, s.student_id, s.name::text,
    CASE WHEN v_phone THEN s.phone::text END,
    c.course_id, c.course_name::text, e.status::text, e.enrolled_at,
    CASE WHEN v_finance THEN e.agreed_cost END,
    CASE WHEN v_finance THEN COALESCE(paid.amount_paid, 0::numeric) END,
    CASE WHEN v_finance THEN e.agreed_cost - COALESCE(paid.amount_paid, 0::numeric) END,
    CASE WHEN v_finance THEN
      CASE WHEN e.agreed_cost - COALESCE(paid.amount_paid, 0::numeric) < 0 THEN 'Overpaid'
           WHEN e.agreed_cost - COALESCE(paid.amount_paid, 0::numeric) = 0 AND COALESCE(paid.amount_paid, 0::numeric) > 0 THEN 'Paid'
           WHEN COALESCE(paid.amount_paid, 0::numeric) = 0 THEN 'Unpaid'
           ELSE 'Partial' END
    END
  FROM public.enrollments AS e
  JOIN public.students AS s ON s.student_id = e.student_id
  JOIN public.courses AS c ON c.course_id = e.course_id
  LEFT JOIN paid ON paid.enrollment_id = e.enrollment_id
  WHERE (p_student_id IS NULL OR s.student_id = p_student_id)
    AND (p_course_id IS NULL OR c.course_id = p_course_id)
    AND (p_search IS NULL OR btrim(p_search) = ''
      OR s.name ILIKE '%' || left(btrim(p_search), 100) || '%'
      OR c.course_name ILIKE '%' || left(btrim(p_search), 100) || '%'
      OR (v_phone AND s.phone ILIKE '%' || left(btrim(p_search), 100) || '%'))
  ORDER BY e.enrolled_at DESC, e.enrollment_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_cash_boxes()
RETURNS TABLE (
  cash_box_id uuid, name text, type text, owner text, opening_balance numeric,
  is_active boolean, notes text, total_payments_in numeric,
  total_expenses_out numeric, total_transfers_in numeric,
  total_transfers_out numeric, current_balance numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('finance.cash_boxes.read') THEN
    RAISE EXCEPTION 'Permission denied: finance.cash_boxes.read is required.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH payment_totals AS (
    SELECT p.cash_box_id, sum(p.amount) AS amount
    FROM public.payments AS p WHERE p.voided_at IS NULL GROUP BY p.cash_box_id
  ), expense_totals AS (
    SELECT e.cash_box_id, sum(e.amount) AS amount
    FROM public.expenses AS e WHERE e.voided_at IS NULL GROUP BY e.cash_box_id
  ), transfer_in AS (
    SELECT t.to_box_id AS cash_box_id, sum(t.amount) AS amount
    FROM public.cash_box_transfers AS t GROUP BY t.to_box_id
  ), transfer_out AS (
    SELECT t.from_box_id AS cash_box_id, sum(t.amount) AS amount
    FROM public.cash_box_transfers AS t GROUP BY t.from_box_id
  )
  SELECT cb.cash_box_id, cb.name::text, cb.type::text, cb.owner::text,
    cb.opening_balance, cb.is_active, cb.notes,
    COALESCE(pi.amount, 0::numeric), COALESCE(eo.amount, 0::numeric),
    COALESCE(ti.amount, 0::numeric), COALESCE(to2.amount, 0::numeric),
    cb.opening_balance + COALESCE(pi.amount, 0::numeric) - COALESCE(eo.amount, 0::numeric)
      + COALESCE(ti.amount, 0::numeric) - COALESCE(to2.amount, 0::numeric)
  FROM public.cash_boxes AS cb
  LEFT JOIN payment_totals AS pi ON pi.cash_box_id = cb.cash_box_id
  LEFT JOIN expense_totals AS eo ON eo.cash_box_id = cb.cash_box_id
  LEFT JOIN transfer_in AS ti ON ti.cash_box_id = cb.cash_box_id
  LEFT JOIN transfer_out AS to2 ON to2.cash_box_id = cb.cash_box_id
  ORDER BY cb.is_active DESC, cb.name, cb.cash_box_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_payments(
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  payment_id uuid, receipt_number bigint, enrollment_id uuid, student_id uuid,
  student_name text, student_phone text, course_id uuid, course_name text,
  cash_box_id uuid, cash_box_name text, amount numeric, payment_date date,
  method text, receipt_ref text, notes text, voided_at timestamptz,
  voided_by uuid, void_reason text, added_by uuid, created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('finance.payments.read') THEN
    RAISE EXCEPTION 'Permission denied: finance.payments.read is required.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT p.payment_id, p.receipt_number, e.enrollment_id, s.student_id,
    s.name::text, CASE WHEN private.has_permission('students.read_contact_phone') THEN s.phone::text END,
    c.course_id, c.course_name::text, cb.cash_box_id, cb.name::text, p.amount,
    p.payment_date, p.method::text, p.receipt_ref::text, p.notes, p.voided_at,
    p.voided_by, p.void_reason, p.added_by, p.created_at
  FROM public.payments AS p
  JOIN public.enrollments AS e ON e.enrollment_id = p.enrollment_id
  JOIN public.students AS s ON s.student_id = e.student_id
  JOIN public.courses AS c ON c.course_id = e.course_id
  JOIN public.cash_boxes AS cb ON cb.cash_box_id = p.cash_box_id
  ORDER BY p.payment_date DESC, p.created_at DESC, p.payment_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_search_payments(p_query text, p_limit integer DEFAULT 5)
RETURNS TABLE (payment_id uuid, receipt_number bigint, receipt_ref text,
  amount numeric, payment_date date)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE
  v_query text := left(btrim(COALESCE(p_query, '')), 100);
  v_receipt text;
BEGIN
  IF NOT private.has_permission('finance.payments.read') THEN
    RAISE EXCEPTION 'Permission denied: finance.payments.read is required.' USING ERRCODE = '42501';
  END IF;
  v_receipt := regexp_replace(v_query, '^rec[- ]*', '', 'i');
  IF v_query = '' THEN RETURN; END IF;
  RETURN QUERY
  SELECT p.payment_id, p.receipt_number, p.receipt_ref::text, p.amount, p.payment_date
  FROM public.payments AS p
  WHERE p.voided_at IS NULL
    AND (p.receipt_ref ILIKE '%' || v_query || '%'
      OR (v_receipt ~ '^[0-9]{1,18}$' AND p.receipt_number = v_receipt::bigint))
  ORDER BY p.payment_date DESC, p.created_at DESC, p.payment_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 5), 1), 20);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_expenses(
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  expense_id uuid, cash_box_id uuid, cash_box_name text, course_id uuid,
  course_name text, amount numeric, category text, description text,
  expense_date date, notes text, voided_at timestamptz, voided_by uuid,
  void_reason text, added_by uuid, created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('finance.expenses.read') THEN
    RAISE EXCEPTION 'Permission denied: finance.expenses.read is required.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT e.expense_id, cb.cash_box_id, cb.name::text, c.course_id,
    c.course_name::text, e.amount, e.category::text, e.description,
    e.expense_date, e.notes, e.voided_at, e.voided_by, e.void_reason,
    e.added_by, e.created_at
  FROM public.expenses AS e
  JOIN public.cash_boxes AS cb ON cb.cash_box_id = e.cash_box_id
  LEFT JOIN public.courses AS c ON c.course_id = e.course_id
  ORDER BY e.expense_date DESC, e.created_at DESC, e.expense_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_transfers(
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  transfer_id uuid, from_box_id uuid, from_box_name text, to_box_id uuid,
  to_box_name text, amount numeric, transfer_date date, notes text,
  added_by uuid, created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('finance.transfers.read') THEN
    RAISE EXCEPTION 'Permission denied: finance.transfers.read is required.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT t.transfer_id, fb.cash_box_id, fb.name::text, tb.cash_box_id,
    tb.name::text, t.amount, t.transfer_date, t.notes, t.added_by, t.created_at
  FROM public.cash_box_transfers AS t
  JOIN public.cash_boxes AS fb ON fb.cash_box_id = t.from_box_id
  JOIN public.cash_boxes AS tb ON tb.cash_box_id = t.to_box_id
  ORDER BY t.transfer_date DESC, t.created_at DESC, t.transfer_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_operational_dashboard_metrics()
RETURNS TABLE (total_students bigint, new_students_this_month bigint,
  active_courses bigint, active_enrollments bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('dashboard.operational.read') THEN
    RAISE EXCEPTION 'Permission denied: dashboard.operational.read is required.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT
    (SELECT count(*) FROM public.students),
    (SELECT count(*) FROM public.students WHERE created_at >= date_trunc('month', now())),
    (SELECT count(*) FROM public.courses WHERE availability_status = 'Active'),
    (SELECT count(*) FROM public.enrollments WHERE status = 'Active');
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_finance_dashboard_metrics()
RETURNS TABLE (revenue_this_month numeric, total_revenue_all_time numeric,
  expenses_this_month numeric, total_expenses_all_time numeric,
  net_profit_this_month numeric, total_net_profit_all_time numeric,
  outstanding_balance numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('dashboard.finance.read') THEN
    RAISE EXCEPTION 'Permission denied: dashboard.finance.read is required.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH payment_totals AS (
    SELECT COALESCE(sum(p.amount) FILTER (WHERE date_trunc('month', p.payment_date) = date_trunc('month', now())), 0::numeric) AS this_month,
      COALESCE(sum(p.amount), 0::numeric) AS all_time
    FROM public.payments AS p WHERE p.voided_at IS NULL
  ), expense_totals AS (
    SELECT COALESCE(sum(e.amount) FILTER (WHERE date_trunc('month', e.expense_date) = date_trunc('month', now())), 0::numeric) AS this_month,
      COALESCE(sum(e.amount), 0::numeric) AS all_time
    FROM public.expenses AS e WHERE e.voided_at IS NULL
  ), balances AS (
    SELECT COALESCE(sum(e.agreed_cost - COALESCE(p.amount_paid, 0::numeric))
      FILTER (WHERE e.status = 'Active' AND e.agreed_cost - COALESCE(p.amount_paid, 0::numeric) > 0), 0::numeric) AS outstanding
    FROM public.enrollments AS e
    LEFT JOIN (SELECT enrollment_id, sum(amount) AS amount_paid FROM public.payments
      WHERE voided_at IS NULL GROUP BY enrollment_id) AS p USING (enrollment_id)
  )
  SELECT pt.this_month, pt.all_time, et.this_month, et.all_time,
    pt.this_month - et.this_month, pt.all_time - et.all_time, b.outstanding
  FROM payment_totals AS pt CROSS JOIN expense_totals AS et CROSS JOIN balances AS b;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_course_financial_summary(p_course_id uuid DEFAULT NULL)
RETURNS TABLE (
  course_id uuid, course_name text, default_cost numeric,
  availability_status text, max_students integer, vacant_places integer,
  total_enrollments bigint, expected_revenue numeric, collected_payments numeric,
  total_expenses numeric, net_profit numeric, active_enrollments bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('finance.reports.read') THEN
    RAISE EXCEPTION 'Permission denied: finance.reports.read is required.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH enrollment_totals AS (
    SELECT e.course_id, count(*) AS total_enrollments,
      COALESCE(sum(e.agreed_cost), 0::numeric) AS expected_revenue,
      count(*) FILTER (WHERE e.status = 'Active') AS active_enrollments
    FROM public.enrollments AS e GROUP BY e.course_id
  ), payment_totals AS (
    SELECT e.course_id, COALESCE(sum(p.amount), 0::numeric) AS collected_revenue
    FROM public.enrollments AS e
    JOIN public.payments AS p ON p.enrollment_id = e.enrollment_id
    WHERE p.voided_at IS NULL GROUP BY e.course_id
  ), expense_totals AS (
    SELECT e.course_id, COALESCE(sum(e.amount), 0::numeric) AS course_expenses
    FROM public.expenses AS e
    WHERE e.course_id IS NOT NULL AND e.voided_at IS NULL
    GROUP BY e.course_id
  )
  SELECT c.course_id, c.course_name::text, c.default_cost,
    c.availability_status::text, c.max_students,
    CASE WHEN c.max_students IS NULL THEN NULL
      ELSE GREATEST(c.max_students - COALESCE(et.active_enrollments, 0)::integer, 0) END,
    COALESCE(et.total_enrollments, 0::bigint),
    COALESCE(et.expected_revenue, 0::numeric),
    COALESCE(pt.collected_revenue, 0::numeric),
    COALESCE(xt.course_expenses, 0::numeric),
    COALESCE(pt.collected_revenue, 0::numeric) - COALESCE(xt.course_expenses, 0::numeric),
    COALESCE(et.active_enrollments, 0::bigint)
  FROM public.courses AS c
  LEFT JOIN enrollment_totals AS et ON et.course_id = c.course_id
  LEFT JOIN payment_totals AS pt ON pt.course_id = c.course_id
  LEFT JOIN expense_totals AS xt ON xt.course_id = c.course_id
  WHERE p_course_id IS NULL OR c.course_id = p_course_id
  ORDER BY c.course_name, c.course_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.rbac_list_students(text, integer, integer, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_list_courses(integer, integer, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_list_enrollments(text, integer, integer, uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_list_cash_boxes() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_list_payments(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_search_payments(text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_list_expenses(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_list_transfers(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_operational_dashboard_metrics() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_finance_dashboard_metrics() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_course_financial_summary(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.rbac_list_students(text, integer, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_list_courses(integer, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_list_enrollments(text, integer, integer, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_list_cash_boxes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_list_payments(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_search_payments(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_list_expenses(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_list_transfers(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_operational_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_finance_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_course_financial_summary(uuid) TO authenticated;

COMMENT ON FUNCTION public.rbac_list_students(text, integer, integer, uuid) IS
  'RBAC draft endpoint. Explicit student projection; email is owner-only and phone requires students.read_contact_phone. Does not replace legacy table grants until coordinated cutover.';
COMMENT ON FUNCTION public.rbac_list_courses(integer, integer, uuid) IS
  'RBAC draft endpoint. Course price is NULL unless courses.pricing.read is granted. Does not replace legacy table grants until coordinated cutover.';
COMMENT ON FUNCTION public.rbac_list_enrollments(text, integer, integer, uuid, uuid) IS
  'RBAC draft endpoint. Financial enrollment fields are NULL unless enrollments.financial.read is granted. Does not replace legacy mixed-view grants until coordinated cutover.';
COMMENT ON FUNCTION public.rbac_list_cash_boxes() IS
  'RBAC draft endpoint. Requires finance.cash_boxes.read; legacy view grants remain until coordinated cutover.';
COMMENT ON FUNCTION public.rbac_list_payments(integer, integer) IS
  'RBAC draft endpoint. Requires finance.payments.read.';
COMMENT ON FUNCTION public.rbac_list_expenses(integer, integer) IS
  'RBAC draft endpoint. Requires finance.expenses.read.';
COMMENT ON FUNCTION public.rbac_list_transfers(integer, integer) IS
  'RBAC draft endpoint. Requires finance.transfers.read.';
COMMENT ON FUNCTION public.rbac_operational_dashboard_metrics() IS
  'RBAC draft endpoint. Operational metrics only; requires dashboard.operational.read.';
COMMENT ON FUNCTION public.rbac_finance_dashboard_metrics() IS
  'RBAC draft endpoint. Financial metrics only; requires dashboard.finance.read.';
COMMENT ON FUNCTION public.rbac_course_financial_summary(uuid) IS
  'RBAC draft endpoint. Course-level financial metrics require finance.reports.read.';
```

---

### File: `20261021224905_rbac_permission_checked_write_endpoints.sql`
> **Version:** `20261021224905` | **Size:** `34121` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `NO`
> **SHA-256:** `c6fc9da6599a5c2d21e1b1cc0b02d7c63a9032ddaec90409e1626f310a376c5e`

```sql
-- RBAC permission-checked write endpoints (additive compatibility phase).
-- These RPCs wrap existing validated/locked business RPCs where possible.
-- Direct table grants and legacy RPCs are intentionally unchanged here; do not
-- treat limited roles as protected until the later coordinated cutover.
-- This migration has NOT been applied or PostgreSQL-validated.

DO $preflight$
BEGIN
  IF to_regprocedure('private.has_permission(text)') IS NULL
     OR to_regprocedure('public.enroll_student(uuid,uuid,numeric,text)') IS NULL
     OR to_regprocedure('public.set_enrollment_status(uuid,text)') IS NULL
     OR to_regprocedure('public.record_payment(uuid,uuid,numeric,date,text,text,text)') IS NULL
     OR to_regprocedure('public.record_expense(uuid,numeric,date,text,text,text,uuid)') IS NULL
     OR to_regprocedure('public.transfer_between_boxes(uuid,uuid,numeric,date,text)') IS NULL
     OR to_regprocedure('public.create_cash_box(character varying,character varying,character varying,numeric,text)') IS NULL THEN
    RAISE EXCEPTION 'RBAC write endpoint preflight failed: expected authorization helpers or protected business RPCs are missing.';
  END IF;
END
$preflight$;

CREATE OR REPLACE FUNCTION public.rbac_create_student(
  p_name text,
  p_phone text DEFAULT NULL,
  p_employment_status text DEFAULT NULL,
  p_grad_status text DEFAULT NULL,
  p_grad_college text DEFAULT NULL,
  p_previous_courses text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_student_id uuid;
BEGIN
  IF NOT private.has_permission('students.create') THEN
    RAISE EXCEPTION 'Permission denied: students.create is required.' USING ERRCODE = '42501';
  END IF;
  IF p_name IS NULL OR btrim(p_name) = '' OR length(btrim(p_name)) > 255 THEN
    RAISE EXCEPTION 'Student name is required and must be at most 255 characters.';
  END IF;
  IF p_phone IS NOT NULL AND length(btrim(p_phone)) > 20 THEN
    RAISE EXCEPTION 'Student phone must be at most 20 characters.';
  END IF;
  IF p_phone IS NOT NULL AND NOT private.has_permission('students.read_contact_phone') THEN
    RAISE EXCEPTION 'Permission denied: students.read_contact_phone is required to set a student phone number.' USING ERRCODE = '42501';
  END IF;
  IF p_email IS NOT NULL AND NOT private.has_permission('students.email.update') THEN
    RAISE EXCEPTION 'Permission denied: students.email.update is required.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.students (name, phone, email, employment_status, grad_status,
    grad_college, previous_courses, notes)
  VALUES (btrim(p_name), NULLIF(btrim(p_phone), ''), NULLIF(btrim(p_email), ''), NULLIF(btrim(p_employment_status), ''),
    NULLIF(btrim(p_grad_status), ''), NULLIF(btrim(p_grad_college), ''),
    NULLIF(btrim(p_previous_courses), ''), NULLIF(btrim(p_notes), ''))
  RETURNING student_id INTO v_student_id;
  RETURN v_student_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_update_student(
  p_student_id uuid,
  p_name text,
  p_phone text DEFAULT NULL,
  p_employment_status text DEFAULT NULL,
  p_grad_status text DEFAULT NULL,
  p_grad_college text DEFAULT NULL,
  p_previous_courses text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('students.update') THEN
    RAISE EXCEPTION 'Permission denied: students.update is required.' USING ERRCODE = '42501';
  END IF;
  IF p_student_id IS NULL OR p_name IS NULL OR btrim(p_name) = '' OR length(btrim(p_name)) > 255 THEN
    RAISE EXCEPTION 'Student id and a valid name are required.';
  END IF;
  IF p_phone IS NOT NULL AND length(btrim(p_phone)) > 20 THEN
    RAISE EXCEPTION 'Student phone must be at most 20 characters.';
  END IF;
  IF p_email IS NOT NULL AND NOT private.has_permission('students.email.update') THEN
    RAISE EXCEPTION 'Permission denied: students.email.update is required.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.students AS s
  SET name = btrim(p_name),
      phone = CASE WHEN private.has_permission('students.read_contact_phone') THEN NULLIF(btrim(p_phone), '') ELSE s.phone END,
      email = CASE WHEN private.has_permission('students.email.update') THEN NULLIF(btrim(p_email), '') ELSE s.email END,
      employment_status = NULLIF(btrim(p_employment_status), ''),
      grad_status = NULLIF(btrim(p_grad_status), ''),
      grad_college = NULLIF(btrim(p_grad_college), ''),
      previous_courses = NULLIF(btrim(p_previous_courses), ''),
      notes = NULLIF(btrim(p_notes), ''), updated_at = now()
  WHERE s.student_id = p_student_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Student not found.'; END IF;
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_create_course(
  p_course_name text,
  p_description text DEFAULT NULL,
  p_level text DEFAULT NULL,
  p_duration_weeks integer DEFAULT NULL,
  p_prerequisite_courses text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_max_students integer DEFAULT NULL,
  p_default_cost numeric DEFAULT NULL,
  p_availability_status text DEFAULT 'Upcoming',
  p_link_whatsapp text DEFAULT NULL,
  p_link_tasks text DEFAULT NULL,
  p_link_drive text DEFAULT NULL,
  p_link_sources text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_course_id uuid;
BEGIN
  IF NOT private.has_permission('courses.create') THEN
    RAISE EXCEPTION 'Permission denied: courses.create is required.' USING ERRCODE = '42501';
  END IF;
  IF p_default_cost IS NOT NULL AND NOT private.has_permission('courses.pricing.update') THEN
    RAISE EXCEPTION 'Permission denied: courses.pricing.update is required to set a price.' USING ERRCODE = '42501';
  END IF;
  IF p_course_name IS NULL OR btrim(p_course_name) = '' THEN
    RAISE EXCEPTION 'Course name is required.';
  END IF;
  IF p_availability_status IS NULL OR p_availability_status NOT IN ('Upcoming', 'Active', 'Closed') THEN
    RAISE EXCEPTION 'Invalid course status.';
  END IF;
  IF p_availability_status = 'Closed' AND NOT private.has_permission('courses.close') THEN
    RAISE EXCEPTION 'Permission denied: courses.close is required.' USING ERRCODE = '42501';
  END IF;

  IF private.has_permission('courses.pricing.update') THEN
    INSERT INTO public.courses (course_name, description, level, duration_weeks,
      prerequisite_courses, start_date, end_date, max_students, default_cost,
      availability_status, link_whatsapp, link_tasks, link_drive, link_sources)
    VALUES (btrim(p_course_name), p_description, p_level, p_duration_weeks,
      p_prerequisite_courses, p_start_date, p_end_date, p_max_students, COALESCE(p_default_cost, 0),
      p_availability_status, p_link_whatsapp, p_link_tasks, p_link_drive, p_link_sources)
    RETURNING course_id INTO v_course_id;
  ELSE
    INSERT INTO public.courses (course_name, description, level, duration_weeks,
      prerequisite_courses, start_date, end_date, max_students,
      availability_status, link_whatsapp, link_tasks, link_drive, link_sources)
    VALUES (btrim(p_course_name), p_description, p_level, p_duration_weeks,
      p_prerequisite_courses, p_start_date, p_end_date, p_max_students,
      p_availability_status, p_link_whatsapp, p_link_tasks, p_link_drive, p_link_sources)
    RETURNING course_id INTO v_course_id;
  END IF;
  RETURN v_course_id;
END;
$function$;
CREATE OR REPLACE FUNCTION public.rbac_update_course(
  p_course_id uuid,
  p_course_name text,
  p_description text DEFAULT NULL,
  p_level text DEFAULT NULL,
  p_duration_weeks integer DEFAULT NULL,
  p_prerequisite_courses text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_max_students integer DEFAULT NULL,
  p_default_cost numeric DEFAULT NULL,
  p_availability_status text DEFAULT 'Upcoming',
  p_link_whatsapp text DEFAULT NULL,
  p_link_tasks text DEFAULT NULL,
  p_link_drive text DEFAULT NULL,
  p_link_sources text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_course public.courses%ROWTYPE;
BEGIN
  IF NOT private.has_permission('courses.update') THEN
    RAISE EXCEPTION 'Permission denied: courses.update is required.' USING ERRCODE = '42501';
  END IF;
  IF p_course_id IS NULL OR p_course_name IS NULL OR btrim(p_course_name) = '' THEN
    RAISE EXCEPTION 'Course id and name are required.';
  END IF;
  IF p_availability_status IS NULL OR p_availability_status NOT IN ('Upcoming', 'Active', 'Closed') THEN
    RAISE EXCEPTION 'Invalid course status.';
  END IF;

  SELECT * INTO v_course FROM public.courses WHERE course_id = p_course_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Course not found.'; END IF;
  IF p_default_cost IS NOT NULL
     AND p_default_cost IS DISTINCT FROM v_course.default_cost
     AND NOT private.has_permission('courses.pricing.update') THEN
    RAISE EXCEPTION 'Permission denied: courses.pricing.update is required to change a price.' USING ERRCODE = '42501';
  END IF;
  IF p_availability_status IS DISTINCT FROM v_course.availability_status
     AND p_availability_status = 'Closed'
     AND NOT private.has_permission('courses.close') THEN
    RAISE EXCEPTION 'Permission denied: courses.close is required.' USING ERRCODE = '42501';
  END IF;
  IF v_course.availability_status = 'Closed'
     AND p_availability_status <> 'Closed'
     AND NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only the platform owner may reopen a closed course.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.courses AS c
  SET course_name = btrim(p_course_name), description = p_description, level = p_level,
      duration_weeks = p_duration_weeks, prerequisite_courses = p_prerequisite_courses,
      start_date = p_start_date, end_date = p_end_date, max_students = p_max_students,
      default_cost = CASE WHEN private.has_permission('courses.pricing.update')
        THEN COALESCE(p_default_cost, v_course.default_cost) ELSE v_course.default_cost END,
      availability_status = p_availability_status, link_whatsapp = p_link_whatsapp,
      link_tasks = p_link_tasks, link_drive = p_link_drive, link_sources = p_link_sources,
      updated_at = now()
  WHERE c.course_id = p_course_id;
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_close_course(p_course_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_status text;
BEGIN
  IF NOT private.has_permission('courses.close') THEN
    RAISE EXCEPTION 'Permission denied: courses.close is required.' USING ERRCODE = '42501';
  END IF;
  SELECT c.availability_status::text INTO v_status
  FROM public.courses AS c WHERE c.course_id = p_course_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Course not found.'; END IF;
  IF v_status <> 'Closed' THEN
    UPDATE public.courses SET availability_status = 'Closed', updated_at = now()
    WHERE course_id = p_course_id;
  END IF;
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_enroll_student(
  p_student_id uuid,
  p_course_id uuid,
  p_agreed_cost numeric DEFAULT NULL,
  p_status text DEFAULT 'Active'
)
RETURNS TABLE (enrollment_id uuid, student_id uuid, course_id uuid,
  status text, enrolled_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_enrollment public.enrollments%ROWTYPE;
BEGIN
  IF NOT private.has_permission('enrollments.create') THEN
    RAISE EXCEPTION 'Permission denied: enrollments.create is required.' USING ERRCODE = '42501';
  END IF;
  IF p_agreed_cost IS NOT NULL
     AND NOT private.has_permission('enrollments.pricing.override') THEN
    RAISE EXCEPTION 'Permission denied: enrollment price override is not allowed.' USING ERRCODE = '42501';
  END IF;

  v_enrollment := public.enroll_student(p_student_id, p_course_id, p_agreed_cost, p_status);
  RETURN QUERY SELECT v_enrollment.enrollment_id, v_enrollment.student_id,
    v_enrollment.course_id, v_enrollment.status::text, v_enrollment.enrolled_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_set_enrollment_status(
  p_enrollment_id uuid,
  p_status text
)
RETURNS TABLE (enrollment_id uuid, student_id uuid, course_id uuid,
  status text, enrolled_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_enrollment public.enrollments%ROWTYPE;
BEGIN
  IF NOT private.has_permission('enrollments.update_status') THEN
    RAISE EXCEPTION 'Permission denied: enrollments.update_status is required.' USING ERRCODE = '42501';
  END IF;
  v_enrollment := public.set_enrollment_status(p_enrollment_id, p_status);
  RETURN QUERY SELECT v_enrollment.enrollment_id, v_enrollment.student_id,
    v_enrollment.course_id, v_enrollment.status::text, v_enrollment.enrolled_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_record_payment(
  p_enrollment_id uuid, p_cash_box_id uuid, p_amount numeric,
  p_payment_date date DEFAULT CURRENT_DATE, p_method text DEFAULT 'Cash',
  p_receipt_ref text DEFAULT NULL, p_notes text DEFAULT NULL
)
RETURNS TABLE (payment_id uuid, receipt_number bigint)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_payment public.payments%ROWTYPE;
BEGIN
  IF NOT private.has_permission('finance.payments.record') THEN
    RAISE EXCEPTION 'Permission denied: finance.payments.record is required.' USING ERRCODE = '42501';
  END IF;
  v_payment := public.record_payment(p_enrollment_id, p_cash_box_id, p_amount,
    p_payment_date, p_method, p_receipt_ref, p_notes);
  RETURN QUERY SELECT v_payment.payment_id, v_payment.receipt_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_record_expense(
  p_cash_box_id uuid, p_amount numeric,
  p_expense_date date DEFAULT CURRENT_DATE, p_category text DEFAULT 'Other',
  p_description text DEFAULT NULL, p_notes text DEFAULT NULL, p_course_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_expense public.expenses%ROWTYPE;
BEGIN
  IF NOT private.has_permission('finance.expenses.record') THEN
    RAISE EXCEPTION 'Permission denied: finance.expenses.record is required.' USING ERRCODE = '42501';
  END IF;
  v_expense := public.record_expense(p_cash_box_id, p_amount, p_expense_date,
    p_category, p_description, p_notes, p_course_id);
  RETURN v_expense.expense_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_transfer_between_boxes(
  p_from_box_id uuid, p_to_box_id uuid, p_amount numeric,
  p_transfer_date date, p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_transfer public.cash_box_transfers%ROWTYPE;
BEGIN
  IF NOT private.has_permission('finance.transfers.create') THEN
    RAISE EXCEPTION 'Permission denied: finance.transfers.create is required.' USING ERRCODE = '42501';
  END IF;
  v_transfer := public.transfer_between_boxes(p_from_box_id, p_to_box_id,
    p_amount, p_transfer_date, p_notes);
  RETURN v_transfer.transfer_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_create_cash_box(
  p_name varchar, p_type varchar DEFAULT 'Main', p_owner varchar DEFAULT NULL,
  p_opening_balance numeric DEFAULT 0.00, p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('finance.cash_boxes.create') THEN
    RAISE EXCEPTION 'Permission denied: finance.cash_boxes.create is restricted to the platform owner.' USING ERRCODE = '42501';
  END IF;
  RETURN public.create_cash_box(p_name, p_type, p_owner, p_opening_balance, p_notes);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_archive_cash_box(p_cash_box_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('finance.cash_boxes.archive') THEN
    RAISE EXCEPTION 'Permission denied: finance.cash_boxes.archive is restricted to the platform owner.' USING ERRCODE = '42501';
  END IF;
  UPDATE public.cash_boxes SET is_active = false
  WHERE cash_box_id = p_cash_box_id AND is_active IS TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active cash box not found.'; END IF;
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_void_payment(p_payment_id uuid, p_void_reason text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_payment public.payments%ROWTYPE;
BEGIN
  IF NOT private.has_permission('finance.payments.void') THEN
    RAISE EXCEPTION 'Permission denied: finance.payments.void is restricted to the platform owner.' USING ERRCODE = '42501';
  END IF;
  v_payment := public.void_payment(p_payment_id, p_void_reason);
  RETURN v_payment.payment_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_void_expense(p_expense_id uuid, p_void_reason text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_expense public.expenses%ROWTYPE;
BEGIN
  IF NOT private.has_permission('finance.expenses.void') THEN
    RAISE EXCEPTION 'Permission denied: finance.expenses.void is restricted to the platform owner.' USING ERRCODE = '42501';
  END IF;
  v_expense := public.void_expense(p_expense_id, p_void_reason);
  RETURN v_expense.expense_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_assignable_roles()
RETURNS TABLE (role_key text, display_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('roles.read') THEN
    RAISE EXCEPTION 'Permission denied: roles.read is restricted to the platform owner.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT r.role_key, r.display_name
  FROM public.admin_roles AS r
  WHERE r.is_assignable IS TRUE
  ORDER BY r.display_name, r.role_key;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_admins()
RETURNS TABLE (admin_id uuid, email text, role_key text,
  is_active boolean, is_owner boolean, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('admins.read') THEN
    RAISE EXCEPTION 'Permission denied: admins.read is restricted to the platform owner.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT a.admin_id, u.email::text, a.role::text, a.is_active, a.is_owner, a.created_at
  FROM public.admins AS a
  LEFT JOIN auth.users AS u ON u.id = a.auth_user_id
  ORDER BY a.is_owner DESC, a.created_at, a.admin_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_roles()
RETURNS TABLE (role_key text, display_name text, is_system boolean,
  is_assignable boolean, permission_keys text[])
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('roles.read') THEN
    RAISE EXCEPTION 'Permission denied: roles.read is restricted to the platform owner.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT r.role_key, r.display_name, r.is_system, r.is_assignable,
    COALESCE(array_agg(arp.permission_key ORDER BY arp.permission_key)
      FILTER (WHERE arp.permission_key IS NOT NULL), ARRAY[]::text[])
  FROM public.admin_roles AS r
  LEFT JOIN public.admin_role_permissions AS arp USING (role_key)
  GROUP BY r.role_key, r.display_name, r.is_system, r.is_assignable
  ORDER BY r.is_system DESC, r.display_name, r.role_key;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_delegable_permissions()
RETURNS TABLE (permission_key text, description text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('roles.read') THEN
    RAISE EXCEPTION 'Permission denied: roles.read is restricted to the platform owner.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT p.permission_key, p.description
  FROM public.permission_catalog AS p
  WHERE p.is_delegable IS TRUE
  ORDER BY p.permission_key;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_audit_events(p_limit integer DEFAULT 100)
RETURNS TABLE (audit_id uuid, actor_auth_user_id uuid, target_auth_user_id uuid,
  action text, before_state jsonb, after_state jsonb, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('audit.read') THEN
    RAISE EXCEPTION 'Permission denied: audit.read is restricted to the platform owner.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT a.audit_id, a.actor_auth_user_id, a.target_auth_user_id,
    a.action, a.before_state, a.after_state, a.created_at
  FROM public.admin_audit_log AS a
  ORDER BY a.created_at DESC, a.audit_id DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_set_admin_role(p_admin_id uuid, p_role_key text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_target public.admins%ROWTYPE; v_role public.admin_roles%ROWTYPE;
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only the platform owner may assign administrator roles.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_target FROM public.admins WHERE admin_id = p_admin_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Administrator not found.'; END IF;
  IF v_target.is_owner IS TRUE OR v_target.auth_user_id = auth.uid() THEN
    RAISE EXCEPTION 'The platform owner cannot change its own role or the protected owner role.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_role FROM public.admin_roles
    WHERE role_key = p_role_key AND is_assignable IS TRUE
    FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Role is missing or is not assignable.'; END IF;
  IF v_target.role = p_role_key THEN RETURN true; END IF;
  UPDATE public.admins SET role = p_role_key WHERE admin_id = p_admin_id;
  INSERT INTO public.admin_audit_log (actor_auth_user_id, target_auth_user_id,
    action, before_state, after_state)
  VALUES (auth.uid(), v_target.auth_user_id, 'admin_role_changed',
    jsonb_build_object('role', v_target.role), jsonb_build_object('role', p_role_key));
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_set_admin_active(p_admin_id uuid, p_is_active boolean)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_target public.admins%ROWTYPE; v_action text;
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only the platform owner may enable or disable administrators.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_target FROM public.admins WHERE admin_id = p_admin_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Administrator not found.'; END IF;
  IF v_target.is_owner IS TRUE OR v_target.auth_user_id = auth.uid() THEN
    RAISE EXCEPTION 'The platform owner cannot disable or modify its own active status.' USING ERRCODE = '42501';
  END IF;
  IF p_is_active IS NULL THEN RAISE EXCEPTION 'Active status is required.'; END IF;
  IF v_target.is_active IS NOT DISTINCT FROM p_is_active THEN RETURN true; END IF;

  UPDATE public.admins SET is_active = p_is_active WHERE admin_id = p_admin_id;
  v_action := CASE WHEN p_is_active THEN 'admin_enabled' ELSE 'admin_disabled' END;
  INSERT INTO public.admin_audit_log (actor_auth_user_id, target_auth_user_id,
    action, before_state, after_state)
  VALUES (auth.uid(), v_target.auth_user_id, v_action,
    jsonb_build_object('is_active', v_target.is_active), jsonb_build_object('is_active', p_is_active));
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_create_custom_role(
  p_role_key text, p_display_name text, p_permission_keys text[] DEFAULT ARRAY[]::text[]
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_keys text[] := COALESCE(p_permission_keys, ARRAY[]::text[]);
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only the platform owner may create roles.' USING ERRCODE = '42501';
  END IF;
  IF p_role_key IS NULL OR p_role_key !~ '^[a-z][a-z0-9_]{1,49}$'
     OR p_display_name IS NULL OR btrim(p_display_name) = '' OR length(btrim(p_display_name)) > 100 THEN
    RAISE EXCEPTION 'Provide a valid role key and display name.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_roles WHERE role_key = p_role_key) THEN
    RAISE EXCEPTION 'Role key already exists.';
  END IF;
  IF cardinality(v_keys) <> (SELECT count(DISTINCT permission_key)
    FROM unnest(v_keys) AS requested(permission_key)) THEN
    RAISE EXCEPTION 'Permission keys must not contain duplicates.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(v_keys) AS requested(permission_key)
    LEFT JOIN public.permission_catalog AS pc USING (permission_key)
    WHERE pc.permission_key IS NULL OR pc.is_delegable IS NOT TRUE
  ) THEN
    RAISE EXCEPTION 'Only known delegable permissions can be assigned to a custom role.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.admin_roles (role_key, display_name, is_system, is_assignable)
  VALUES (p_role_key, btrim(p_display_name), false, true);
  INSERT INTO public.admin_role_permissions (role_key, permission_key)
  SELECT p_role_key, requested.permission_key FROM unnest(v_keys) AS requested(permission_key);
  INSERT INTO public.admin_audit_log (actor_auth_user_id, action, after_state)
  VALUES (auth.uid(), 'role_created', jsonb_build_object('role_key', p_role_key,
    'display_name', btrim(p_display_name), 'permissions', to_jsonb(v_keys)));
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_update_custom_role_permissions(
  p_role_key text, p_permission_keys text[]
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_keys text[] := COALESCE(p_permission_keys, ARRAY[]::text[]);
  v_before text[]; v_role public.admin_roles%ROWTYPE;
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only the platform owner may edit custom role permissions.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_role FROM public.admin_roles WHERE role_key = p_role_key FOR UPDATE;
  IF NOT FOUND OR v_role.is_system IS TRUE THEN
    RAISE EXCEPTION 'System or unknown roles cannot be edited.' USING ERRCODE = '42501';
  END IF;
  IF cardinality(v_keys) <> (SELECT count(DISTINCT permission_key)
    FROM unnest(v_keys) AS requested(permission_key)) THEN
    RAISE EXCEPTION 'Permission keys must not contain duplicates.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(v_keys) AS requested(permission_key)
    LEFT JOIN public.permission_catalog AS pc USING (permission_key)
    WHERE pc.permission_key IS NULL OR pc.is_delegable IS NOT TRUE
  ) THEN
    RAISE EXCEPTION 'Only known delegable permissions can be assigned to a custom role.' USING ERRCODE = '42501';
  END IF;
  SELECT COALESCE(array_agg(permission_key ORDER BY permission_key), ARRAY[]::text[])
  INTO v_before FROM public.admin_role_permissions WHERE role_key = p_role_key;
  DELETE FROM public.admin_role_permissions WHERE role_key = p_role_key;
  INSERT INTO public.admin_role_permissions (role_key, permission_key)
  SELECT p_role_key, requested.permission_key FROM unnest(v_keys) AS requested(permission_key);
  INSERT INTO public.admin_audit_log (actor_auth_user_id, action, before_state, after_state)
  VALUES (auth.uid(), 'role_permissions_changed',
    jsonb_build_object('role_key', p_role_key, 'permissions', to_jsonb(v_before)),
    jsonb_build_object('role_key', p_role_key, 'permissions', to_jsonb(v_keys)));
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_delete_custom_role(p_role_key text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_role public.admin_roles%ROWTYPE;
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only the platform owner may delete custom roles.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_role FROM public.admin_roles WHERE role_key = p_role_key FOR UPDATE;
  IF NOT FOUND OR v_role.is_system IS TRUE THEN
    RAISE EXCEPTION 'System or unknown roles cannot be deleted.' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admins WHERE role = p_role_key) THEN
    RAISE EXCEPTION 'A role assigned to administrators cannot be deleted.';
  END IF;
  DELETE FROM public.admin_roles WHERE role_key = p_role_key;
  INSERT INTO public.admin_audit_log (actor_auth_user_id, action, before_state)
  VALUES (auth.uid(), 'role_deleted', jsonb_build_object('role_key', p_role_key,
    'display_name', v_role.display_name));
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.rbac_create_student(text,text,text,text,text,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_update_student(uuid,text,text,text,text,text,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_create_course(text,text,text,integer,text,date,date,integer,numeric,text,text,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_update_course(uuid,text,text,text,integer,text,date,date,integer,numeric,text,text,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_close_course(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_enroll_student(uuid,uuid,numeric,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_set_enrollment_status(uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_record_payment(uuid,uuid,numeric,date,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_record_expense(uuid,numeric,date,text,text,text,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_transfer_between_boxes(uuid,uuid,numeric,date,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_create_cash_box(character varying,character varying,character varying,numeric,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_archive_cash_box(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_void_payment(uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_void_expense(uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_list_assignable_roles() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.rbac_create_student(text,text,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_update_student(uuid,text,text,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_create_course(text,text,text,integer,text,date,date,integer,numeric,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_update_course(uuid,text,text,text,integer,text,date,date,integer,numeric,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_close_course(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_enroll_student(uuid,uuid,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_set_enrollment_status(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_record_payment(uuid,uuid,numeric,date,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_record_expense(uuid,numeric,date,text,text,text,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_transfer_between_boxes(uuid,uuid,numeric,date,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_create_cash_box(character varying,character varying,character varying,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_archive_cash_box(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_void_payment(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_void_expense(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_list_assignable_roles() TO authenticated;
REVOKE ALL ON FUNCTION public.rbac_list_admins() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_list_roles() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_list_delegable_permissions() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_list_audit_events(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_set_admin_role(uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_set_admin_active(uuid,boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_create_custom_role(text,text,text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_update_custom_role_permissions(text,text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_delete_custom_role(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rbac_list_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_list_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_list_delegable_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_list_audit_events(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_set_admin_role(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_set_admin_active(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_create_custom_role(text,text,text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_update_custom_role_permissions(text,text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_delete_custom_role(text) TO authenticated;
```

---

### File: `20261022225500_rbac_multiple_platform_owners.sql`
> **Version:** `20261022225500` | **Size:** `6772` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `NO`
> **SHA-256:** `9600893d725331f68fc9963f9918ec295fe4bfd602ab33f51a60631c275ab0c7`

```sql
-- Allow more than one trusted platform owner while protecting the last
-- active owner. This is an additive follow-up to the already-applied RBAC
-- foundation/endpoints and must run before the authorization cutover.
-- It does not change admin assignments or apply the cutover.

BEGIN;

DROP INDEX IF EXISTS public.admins_single_platform_owner_idx;

ALTER TABLE public.admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_action_check;

ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT admin_audit_log_action_check CHECK (action IN (
    'owner_claimed', 'owner_transferred', 'owner_added', 'owner_removed',
    'admin_invited', 'admin_role_changed', 'admin_disabled', 'admin_enabled',
    'role_created', 'role_updated', 'role_deleted', 'role_permissions_changed'
  ));

CREATE OR REPLACE FUNCTION public.can_claim_platform_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT auth.uid() IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.admins WHERE is_owner IS TRUE)
    AND (SELECT count(*) FROM public.admins
         WHERE role = 'superadmin' AND is_active IS TRUE) = 1
    AND EXISTS (
      SELECT 1 FROM public.admins
      WHERE auth_user_id = auth.uid()
        AND role = 'superadmin'
        AND is_active IS TRUE
    );
$function$;

CREATE OR REPLACE FUNCTION public.rbac_set_admin_owner(
  p_admin_id uuid,
  p_is_owner boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE
  v_target public.admins%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_user_id = auth.uid() AND is_owner IS TRUE AND is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Only a platform owner may change platform-owner membership.'
      USING ERRCODE = '42501';
  END IF;
  IF p_admin_id IS NULL OR p_is_owner IS NULL THEN
    RAISE EXCEPTION 'Administrator and owner status are required.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('elmasry_platform_owner_management', 0));
  -- Re-check after serialization so two owners cannot concurrently remove
  -- each other using stale authorization decisions.
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_user_id = auth.uid() AND is_owner IS TRUE AND is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Only an active platform owner may change platform-owner membership.'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_target
  FROM public.admins
  WHERE admin_id = p_admin_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Administrator not found.';
  END IF;
  IF v_target.auth_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Owners cannot change their own owner status; ask another active owner.'
      USING ERRCODE = '42501';
  END IF;
  IF v_target.is_owner IS NOT DISTINCT FROM p_is_owner THEN
    RETURN true;
  END IF;
  IF p_is_owner IS TRUE AND (v_target.is_active IS NOT TRUE OR v_target.auth_user_id IS NULL) THEN
    RAISE EXCEPTION 'Only an active administrator linked to an Auth user can become a platform owner.'
      USING ERRCODE = '42501';
  END IF;
  IF p_is_owner IS FALSE AND v_target.is_owner IS TRUE
     AND NOT EXISTS (
       SELECT 1 FROM public.admins
       WHERE is_owner IS TRUE AND is_active IS TRUE
         AND admin_id <> v_target.admin_id
     ) THEN
    RAISE EXCEPTION 'At least one other active platform owner must remain.'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.admins
  SET is_owner = p_is_owner
  WHERE admin_id = v_target.admin_id;

  INSERT INTO public.admin_audit_log (
    actor_auth_user_id, target_auth_user_id, action, before_state, after_state
  ) VALUES (
    auth.uid(), v_target.auth_user_id,
    CASE WHEN p_is_owner THEN 'owner_added' ELSE 'owner_removed' END,
    jsonb_build_object('is_owner', v_target.is_owner, 'role', v_target.role),
    jsonb_build_object('is_owner', p_is_owner, 'role', v_target.role)
  );
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_set_admin_active(
  p_admin_id uuid,
  p_is_active boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE
  v_target public.admins%ROWTYPE;
  v_action text;
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only a platform owner may enable or disable administrators.'
      USING ERRCODE = '42501';
  END IF;
  IF p_admin_id IS NULL OR p_is_active IS NULL THEN
    RAISE EXCEPTION 'Administrator and active status are required.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('elmasry_platform_owner_management', 0));
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_user_id = auth.uid() AND is_owner IS TRUE AND is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Only an active platform owner may enable or disable administrators.'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_target
  FROM public.admins
  WHERE admin_id = p_admin_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Administrator not found.';
  END IF;
  IF v_target.auth_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot disable your own administrator account.'
      USING ERRCODE = '42501';
  END IF;
  IF v_target.is_active IS NOT DISTINCT FROM p_is_active THEN
    RETURN true;
  END IF;
  IF p_is_active IS FALSE AND v_target.is_owner IS TRUE
     AND NOT EXISTS (
       SELECT 1 FROM public.admins
       WHERE is_owner IS TRUE AND is_active IS TRUE
         AND admin_id <> v_target.admin_id
     ) THEN
    RAISE EXCEPTION 'At least one other active platform owner must remain.'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.admins
  SET is_active = p_is_active
  WHERE admin_id = v_target.admin_id;

  v_action := CASE WHEN p_is_active THEN 'admin_enabled' ELSE 'admin_disabled' END;
  INSERT INTO public.admin_audit_log (
    actor_auth_user_id, target_auth_user_id, action, before_state, after_state
  ) VALUES (
    auth.uid(), v_target.auth_user_id, v_action,
    jsonb_build_object('is_active', v_target.is_active, 'is_owner', v_target.is_owner),
    jsonb_build_object('is_active', p_is_active, 'is_owner', v_target.is_owner)
  );
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.can_claim_platform_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_claim_platform_owner() TO authenticated;
REVOKE ALL ON FUNCTION public.rbac_set_admin_owner(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rbac_set_admin_owner(uuid, boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.rbac_set_admin_active(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rbac_set_admin_active(uuid, boolean) TO authenticated;

COMMIT;
```

---

### File: `20261022230000_rbac_authorization_cutover.sql`
> **Version:** `20261022230000` | **Size:** `6895` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `YES (Draft Only)`
> **SHA-256:** `f0cd46ca95ec75c54a176594a9e3ba01a1b2db61a5c013c90ff517e9ce0ed68a`

```sql
-- RBAC authorization cutover draft.
--
-- This is intentionally a separate, fail-closed migration after the additive
-- RBAC catalog, read endpoints, and write endpoints. It revokes legacy direct
-- table/view access and legacy unscoped RPC execution from client roles.
--
-- NOT APPLIED and NOT PostgreSQL-validated. Review and verify against a safe
-- staging project before applying anywhere. No row data is changed by this file.

BEGIN;

DO $preflight$
DECLARE
  v_function text;
  v_oid oid;
  v_required_functions text[] := ARRAY[
    'private.has_permission(text)',
    'private.is_platform_owner()',
    'public.get_my_authorization()',
    'public.claim_platform_owner()',
    'public.can_claim_platform_owner()',
    'public.rbac_list_students(text,integer,integer,uuid)',
    'public.rbac_list_courses(integer,integer,uuid)',
    'public.rbac_list_enrollments(text,integer,integer,uuid,uuid)',
    'public.rbac_list_cash_boxes()',
    'public.rbac_list_payments(integer,integer)',
    'public.rbac_search_payments(text,integer)',
    'public.rbac_list_expenses(integer,integer)',
    'public.rbac_list_transfers(integer,integer)',
    'public.rbac_operational_dashboard_metrics()',
    'public.rbac_finance_dashboard_metrics()',
    'public.rbac_course_financial_summary(uuid)',
    'public.rbac_create_student(text,text,text,text,text,text,text,text)',
    'public.rbac_update_student(uuid,text,text,text,text,text,text,text,text)',
    'public.rbac_create_course(text,text,text,integer,text,date,date,integer,numeric,text,text,text,text,text)',
    'public.rbac_update_course(uuid,text,text,text,integer,text,date,date,integer,numeric,text,text,text,text,text)',
    'public.rbac_close_course(uuid)',
    'public.rbac_enroll_student(uuid,uuid,numeric,text)',
    'public.rbac_set_enrollment_status(uuid,text)',
    'public.rbac_record_payment(uuid,uuid,numeric,date,text,text,text)',
    'public.rbac_record_expense(uuid,numeric,date,text,text,text,uuid)',
    'public.rbac_transfer_between_boxes(uuid,uuid,numeric,date,text)',
    'public.rbac_create_cash_box(character varying,character varying,character varying,numeric,text)',
    'public.rbac_archive_cash_box(uuid)',
    'public.rbac_void_payment(uuid,text)',
    'public.rbac_void_expense(uuid,text)',
    'public.rbac_list_assignable_roles()',
    'public.rbac_list_admins()',
    'public.rbac_list_roles()',
    'public.rbac_list_delegable_permissions()',
    'public.rbac_list_audit_events(integer)',
    'public.rbac_set_admin_role(uuid,text)',
    'public.rbac_set_admin_active(uuid,boolean)',
    'public.rbac_set_admin_owner(uuid,boolean)',
    'public.rbac_create_custom_role(text,text,text[])',
    'public.rbac_update_custom_role_permissions(text,text[])',
    'public.rbac_delete_custom_role(text)'
  ];
BEGIN
  IF to_regclass('public.admins') IS NULL
     OR to_regclass('public.students') IS NULL
     OR to_regclass('public.courses') IS NULL
     OR to_regclass('public.enrollments') IS NULL
     OR to_regclass('public.payments') IS NULL
     OR to_regclass('public.expenses') IS NULL
     OR to_regclass('public.cash_boxes') IS NULL
     OR to_regclass('public.cash_box_transfers') IS NULL
     OR to_regclass('public.payment_receipt_number_seq') IS NULL THEN
    RAISE EXCEPTION 'RBAC cutover preflight failed: one or more protected tables are missing.';
  END IF;

  IF to_regclass('public.enrollment_balances') IS NULL
     OR to_regclass('public.cash_box_balances') IS NULL
     OR to_regclass('public.course_financial_summary') IS NULL
     OR to_regclass('public.dashboard_metrics') IS NULL THEN
    RAISE EXCEPTION 'RBAC cutover preflight failed: expected legacy views are missing; reconcile the view inventory before cutover.';
  END IF;

  IF (SELECT count(*) FROM public.admins WHERE is_active IS TRUE AND is_owner IS TRUE) < 1 THEN
    RAISE EXCEPTION 'RBAC cutover requires at least one active platform owner to be claimed first.';
  END IF;

  FOREACH v_function IN ARRAY v_required_functions LOOP
    v_oid := to_regprocedure(v_function);
    IF v_oid IS NULL THEN
      RAISE EXCEPTION 'RBAC cutover preflight failed: required endpoint % is missing.', v_function;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc AS p
      JOIN pg_roles AS r ON r.oid = p.proowner
      WHERE p.oid = v_oid
        AND p.prosecdef IS TRUE
        AND (r.rolsuper IS TRUE OR r.rolbypassrls IS TRUE)
    ) THEN
      RAISE EXCEPTION 'RBAC cutover preflight failed: endpoint % is not SECURITY DEFINER owned by a BYPASSRLS/superuser role.', v_function;
    END IF;
  END LOOP;
END
$preflight$;

-- Remove direct PostgREST access. All application access must use the
-- permission-checked SECURITY DEFINER endpoints listed in the preflight.
REVOKE ALL PRIVILEGES ON TABLE
  public.admins,
  public.students,
  public.courses,
  public.enrollments,
  public.payments,
  public.expenses,
  public.cash_boxes,
  public.cash_box_transfers
FROM PUBLIC, anon, authenticated;

-- Migration 008 grants column-level cash-box metadata UPDATE separately from
-- table-level privileges; remove that residual grant explicitly as well.
REVOKE UPDATE (name, type, owner, is_active, notes)
  ON TABLE public.cash_boxes FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES ON TABLE
  public.enrollment_balances,
  public.cash_box_balances,
  public.course_financial_summary,
  public.dashboard_metrics
FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES ON SEQUENCE public.payment_receipt_number_seq
  FROM PUBLIC, anon, authenticated;

-- Revoke every legacy overload (including historical signatures) while
-- retaining is_admin() for the existing sign-in gate and auth callbacks.
DO $legacy_rpc_revoke$
DECLARE
  v_function record;
BEGIN
  FOR v_function IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'enroll_student',
        'record_payment',
        'record_expense',
        'transfer_between_boxes',
        'void_payment',
        'void_expense',
        'set_enrollment_status',
        'create_cash_box'
      ])
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_function.signature);
  END LOOP;
END
$legacy_rpc_revoke$;

-- Preserve the authenticated compatibility check used only to confirm that
-- the current session belongs to an administrator; permission checks are
-- performed by the RBAC endpoints after this cutover.
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_authorization() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_platform_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_claim_platform_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_set_admin_owner(uuid, boolean) TO authenticated;

COMMIT;
```

---

### File: `20261023090000_branding_and_admin_avatars.sql`
> **Version:** `20261023090000` | **Size:** `7302` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `YES (Draft Only)`
> **SHA-256:** `cd03219c19380e1321493e470efa688466c00a1158a834d598181a196cf2544d`

```sql
-- Add owner-managed public academy branding and private per-admin avatars.
-- Draft only: review and apply to the intended Supabase project separately.

BEGIN;

CREATE TABLE IF NOT EXISTS public.academy_branding (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton IS TRUE),
  logo_path text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.academy_branding (singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE public.academy_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_branding FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.academy_branding FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.admins
      WHERE auth_user_id = auth.uid() AND is_active IS TRUE
    );
$function$;

REVOKE ALL ON FUNCTION private.is_active_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_active_admin() TO authenticated;

-- The logo is public, but only active platform owners may replace it.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academy-branding', 'academy-branding', true, 2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Personal avatars stay in a private bucket and are readable only by their owner.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-avatars', 'admin-avatars', false, 2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATESET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS academy_branding_public_read ON storage.objects;
CREATE POLICY academy_branding_public_read
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'academy-branding');

DROP POLICY IF EXISTS academy_branding_owner_insert ON storage.objects;
CREATE POLICY academy_branding_owner_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'academy-branding'
    AND (storage.foldername(name))[1] = 'branding'
    AND private.is_platform_owner()
  );

DROP POLICY IF EXISTS academy_branding_owner_update ON storage.objects;
CREATE POLICY academy_branding_owner_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'academy-branding'
    AND (storage.foldername(name))[1] = 'branding'
    AND private.is_platform_owner()
  )
  WITH CHECK (
    bucket_id = 'academy-branding'
    AND (storage.foldername(name))[1] = 'branding'
    AND private.is_platform_owner()
  );

DROP POLICY IF EXISTS academy_branding_owner_delete ON storage.objects;
CREATE POLICY academy_branding_owner_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'academy-branding'
    AND (storage.foldername(name))[1] = 'branding'
    AND private.is_platform_owner()
  );

DROP POLICY IF EXISTS admin_avatars_owner_read ON storage.objects;
CREATE POLICY admin_avatars_owner_read
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'admin-avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND private.is_active_admin()
  );

DROP POLICY IF EXISTS admin_avatars_owner_insert ON storage.objects;
CREATE POLICY admin_avatars_owner_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'admin-avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND private.is_active_admin()
  );

DROP POLICY IF EXISTS admin_avatars_owner_update ON storage.objects;
CREATE POLICY admin_avatars_owner_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'admin-avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND private.is_active_admin()
  )
  WITH CHECK (
    bucket_id = 'admin-avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND private.is_active_admin()
  );

DROP POLICY IF EXISTS admin_avatars_owner_delete ON storage.objects;
CREATE POLICY admin_avatars_owner_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'admin-avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND private.is_active_admin()
  );

CREATE OR REPLACE FUNCTION public.get_academy_logo()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT logo_path FROM public.academy_branding WHERE singleton IS TRUE;
$function$;

CREATE OR REPLACE FUNCTION public.set_academy_logo(p_logo_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, storage
AS $function$
DECLARE
  v_previous_path text;
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only a platform owner may change the academy logo.'
      USING ERRCODE = '42501';
  END IF;

  IF p_logo_path IS NOT NULL AND p_logo_path !~ '^branding/[0-9a-fA-F-]{36}\.(png|jpg|jpeg|webp)$' THEN
    RAISE EXCEPTION 'The logo path is invalid.' USING ERRCODE = '22023';
  END IF;

  IF p_logo_path IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'academy-branding' AND name = p_logo_path
  ) THEN
    RAISE EXCEPTION 'The uploaded logo was not found.' USING ERRCODE = '22023';
  END IF;

  SELECT logo_path INTO v_previous_path
  FROM public.academy_branding
  WHERE singleton IS TRUE
  FOR UPDATE;

  UPDATE public.academy_branding
  SET logo_path = p_logo_path,
      updated_by = auth.uid(),
      updated_at = now()
  WHERE singleton IS TRUE;

  INSERT INTO public.admin_audit_log (
    actor_auth_user_id, action, before_state, after_state
  ) VALUES (
    auth.uid(), 'branding_logo_changed',
    jsonb_build_object('logo_path', v_previous_path),
    jsonb_build_object('logo_path', p_logo_path)
  );

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_academy_logo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_academy_logo() TO anon, authenticated;
REVOKE ALL ON FUNCTION public.set_academy_logo(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_academy_logo(text) TO authenticated;

ALTER TABLE public.admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_action_check;

ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT admin_audit_log_action_check CHECK (action IN (
    'owner_claimed', 'owner_transferred', 'owner_added', 'owner_removed',
    'admin_invited', 'admin_role_changed', 'admin_disabled', 'admin_enabled',
    'role_created', 'role_updated', 'role_deleted', 'role_permissions_changed',
    'branding_logo_changed'
  ));

COMMIT;
```

---

### File: `20261023100000_platform_audit_and_telegram_outbox.sql`
> **Version:** `20261023100000` | **Size:** `19088` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `YES (Draft Only)`
> **SHA-256:** `a16ef1f39e4e38f891603fe558525452849d0e040592b765ce81a32f9482938a`

```sql
-- LOCAL DRAFT ONLY — do not apply to any Supabase project yet.
-- Adds a generic append-only platform event ledger and a retryable Telegram
-- group-delivery outbox. This migration does not emit events or send messages.
--
-- Preconditions to verify against the intended database before application:
--   * the RBAC foundation has created schema private;
--   * Supabase roles anon, authenticated, and service_role exist;
--   * the canonical public.admins/auth schema and existing migrations are known.
-- Review and adapt this draft after the live schema and migration history are
-- independently verified. Never apply it to production as part of this stage.

BEGIN;

DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    RAISE EXCEPTION 'Preflight failed: expected private schema from the RBAC foundation.';
  END IF;

  IF EXISTS (
    SELECT required_role.role_name
    FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS required_role(role_name)
    WHERE NOT EXISTS (
      SELECT 1 FROM pg_roles AS actual_role
      WHERE actual_role.rolname = required_role.role_name
    )
  ) THEN
    RAISE EXCEPTION 'Preflight failed: expected Supabase roles anon, authenticated, and service_role.';
  END IF;

  IF to_regclass('public.admin_audit_log') IS NULL
     OR to_regclass('public.payments') IS NULL
     OR to_regclass('public.expenses') IS NULL
     OR to_regclass('public.cash_box_transfers') IS NULL
     OR to_regclass('public.cash_boxes') IS NULL
     OR to_regclass('public.login_alert_dedupe') IS NULL
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_audit_log' AND column_name='action')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_audit_log' AND column_name='actor_auth_user_id')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_audit_log' AND column_name='target_auth_user_id')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='payment_id')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='voided_at')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='voided_by')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='expense_id')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='voided_at')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='voided_by')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cash_box_transfers' AND column_name='transfer_id')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cash_box_transfers' AND column_name='added_by')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cash_boxes' AND column_name='cash_box_id')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cash_boxes' AND column_name='is_active') THEN
    RAISE EXCEPTION 'Preflight failed: the canonical RBAC and financial audit source tables/columns were not found.';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.login_alert_dedupe', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.login_alert_dedupe', 'INSERT') THEN
    RAISE EXCEPTION 'Preflight failed: service_role must be able to read and insert login session fingerprints.';
  END IF;
END
$preflight$;

CREATE TABLE IF NOT EXISTS public.platform_audit_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN (
    'auth.login_succeeded',
    'auth.failed_sign_in_threshold',
    'admin.invited',
    'admin.enabled',
    'admin.disabled',
  'admin.role_changed',
    'admin.role_catalog_changed',
    'admin.owner_changed',
    'admin.permissions_changed',
    'branding.logo_changed',
    'security.authorization_denied',
    'finance.payment_voided',
    'finance.expense_voided',
    'finance.transfer_created',
    'finance.cash_box_archived'
  )),
  outcome text NOT NULL CHECK (outcome IN ('success', 'denied', 'failure')),
  source text NOT NULL CHECK (source IN (
    'supabase_auth', 'lms_app', 'database_rpc', 'edge_function',
    'admin_audit_trigger', 'database_trigger'
  )),
  actor_auth_user_id uuid,
  target_auth_user_id uuid,
  subject_type text CHECK (subject_type IN (
    'admin', 'role', 'student', 'course', 'enrollment', 'payment',
    'expense', 'cash_box', 'cash_box_transfer', 'auth_session'
  )),
  subject_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((subject_type IS NULL) = (subject_id IS NULL))
);

CREATE INDEX IF NOT EXISTS platform_audit_events_created_at_idx
  ON public.platform_audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS platform_audit_events_type_created_idx
  ON public.platform_audit_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS platform_audit_events_actor_created_idx
  ON public.platform_audit_events (actor_auth_user_id, created_at DESC);

CREATE OR REPLACE FUNCTION private.prevent_platform_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
BEGIN
  RAISE EXCEPTION 'Platform audit events are append-only.' USING ERRCODE = '42501';
  RETURN OLD;
END;
$function$;

REVOKE ALL ON FUNCTION private.prevent_platform_audit_event_mutation()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_platform_audit_events_immutable
  ON public.platform_audit_events;
CREATE TRIGGER trg_platform_audit_events_immutable
  BEFORE UPDATE OR DELETE ON public.platform_audit_events
  FOR EACH ROW EXECUTE FUNCTION private.prevent_platform_audit_event_mutation();

DROP TRIGGER IF EXISTS trg_platform_audit_events_no_truncate
  ON public.platform_audit_events;
CREATE TRIGGER trg_platform_audit_events_no_truncate
  BEFORE TRUNCATE ON public.platform_audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION private.prevent_platform_audit_event_mutation();

ALTER TABLE public.platform_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.platform_audit_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.platform_audit_events TO service_role;

CREATE TABLE IF NOT EXISTS public.telegram_notification_outbox (
  notification_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.platform_audit_events(event_id)
    ON DELETE RESTRICT,
  destination_key text NOT NULL DEFAULT 'admin_group'
    CHECK (destination_key = 'admin_group'),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'retry', 'sent', 'dead_letter')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 8),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  last_failure_category text CHECK (last_failure_category IN (
    'network', 'telegram_api', 'rate_limited', 'invalid_destination',
    'configuration', 'unknown'
  )),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, destination_key),
  CHECK ((status = 'sent') = (sent_at IS NOT NULL)),
  CHECK ((status = 'processing') = (lease_until IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS telegram_outbox_due_idx
  ON public.telegram_notification_outbox (next_attempt_at, created_at)
  WHERE status IN ('pending', 'retry');
CREATE INDEX IF NOT EXISTS telegram_outbox_lease_idx
  ON public.telegram_notification_outbox (lease_until)
  WHERE status = 'processing';

ALTER TABLE public.telegram_notification_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_notification_outbox FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.telegram_notification_outbox
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.telegram_notification_outbox
  TO service_role;

-- Login alert requests enqueue one fixed event atomically. This narrow
-- SECURITY INVOKER RPC cannot accept a client-controlled event type or payload.
CREATE OR REPLACE FUNCTION public.enqueue_admin_login_notification(
  p_admin_user_id uuid,
  p_session_hash text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_event_id uuid;
  v_claimed_session_hash text;
BEGIN
  IF p_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Administrator user ID is required.' USING ERRCODE = '22004';
  END IF;
  IF p_session_hash IS NULL OR p_session_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'A SHA-256 session hash is required.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.login_alert_dedupe (session_hash)
  VALUES (p_session_hash)
  ON CONFLICT (session_hash) DO NOTHING
  RETURNING session_hash INTO v_claimed_session_hash;

  IF v_claimed_session_hash IS NULL THEN RETURN NULL; END IF;

  INSERT INTO public.platform_audit_events (
    event_type, outcome, source, actor_auth_user_id, target_auth_user_id
  ) VALUES (
    'auth.login_succeeded', 'success', 'edge_function',
    p_admin_user_id, p_admin_user_id
  ) RETURNING event_id INTO v_event_id;

  INSERT INTO public.telegram_notification_outbox (event_id)
  VALUES (v_event_id);

  RETURN v_event_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.enqueue_admin_login_notification(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_admin_login_notification(uuid, text)
  TO service_role;

-- Trigger functions are SECURITY DEFINER so they can append to forced-RLS
-- tables in the same transaction as their source event. They accept no caller
-- input and map only fixed, reviewed source columns/actions.
CREATE OR REPLACE FUNCTION private.route_admin_audit_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_event_type text;
  v_event_id uuid;
BEGIN
  v_event_type := CASE NEW.action
    WHEN 'admin_invited' THEN 'admin.invited'
    WHEN 'admin_enabled' THEN 'admin.enabled'
    WHEN 'admin_disabled' THEN 'admin.disabled'
    WHEN 'admin_role_changed' THEN 'admin.role_changed'
    WHEN 'owner_claimed' THEN 'admin.owner_changed'
    WHEN 'owner_transferred' THEN 'admin.owner_changed'
    WHEN 'owner_added' THEN 'admin.owner_changed'
    WHEN 'owner_removed' THEN 'admin.owner_changed'
    WHEN 'role_created' THEN 'admin.role_catalog_changed'
    WHEN 'role_updated' THEN 'admin.role_catalog_changed'
    WHEN 'role_deleted' THEN 'admin.role_catalog_changed'
    WHEN 'role_permissions_changed' THEN 'admin.permissions_changed'
    WHEN 'branding_logo_changed' THEN 'branding.logo_changed'
    ELSE NULL
  END;

  IF v_event_type IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.platform_audit_events (
    event_type, outcome, source, actor_auth_user_id, target_auth_user_id,
    subject_type, subject_id, occurred_at
  ) VALUES (
    v_event_type, 'success', 'admin_audit_trigger', NEW.actor_auth_user_id,
    NEW.target_auth_user_id,
    CASE WHEN NEW.target_auth_user_id IS NULL THEN NULL ELSE 'admin' END,
    NEW.target_auth_user_id, COALESCE(NEW.created_at, clock_timestamp())
  ) RETURNING event_id INTO v_event_id;

  INSERT INTO public.telegram_notification_outbox (event_id)
  VALUES (v_event_id);
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.route_admin_audit_notification()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS trg_admin_audit_log_telegram_outbox
  ON public.admin_audit_log;
CREATE TRIGGER trg_admin_audit_log_telegram_outbox
  AFTER INSERT ON public.admin_audit_log
  FOR EACH ROW EXECUTE FUNCTION private.route_admin_audit_notification();

CREATE OR REPLACE FUNCTION private.route_financial_telegram_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_event_type text;
  v_actor_auth_user_id uuid;
  v_subject_type text;
  v_subject_id uuid;
  v_event_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'payments' THEN
    IF TG_OP <> 'UPDATE' OR OLD.voided_at IS NOT NULL OR NEW.voided_at IS NULL THEN
      RETURN NEW;
    END IF;
    v_event_type := 'finance.payment_voided';
    v_actor_auth_user_id := NEW.voided_by;
    v_subject_type := 'payment';
    v_subject_id := NEW.payment_id;
  ELSIF TG_TABLE_NAME = 'expenses' THEN
    IF TG_OP <> 'UPDATE' OR OLD.voided_at IS NOT NULL OR NEW.voided_at IS NULL THEN
      RETURN NEW;
    END IF;
    v_event_type := 'finance.expense_voided';
    v_actor_auth_user_id := NEW.voided_by;
    v_subject_type := 'expense';
    v_subject_id := NEW.expense_id;
  ELSIF TG_TABLE_NAME = 'cash_box_transfers' THEN
    IF TG_OP <> 'INSERT' THEN RETURN NEW; END IF;
    v_event_type := 'finance.transfer_created';
    v_actor_auth_user_id := NEW.added_by;
    v_subject_type := 'cash_box_transfer';
    v_subject_id := NEW.transfer_id;
  ELSIF TG_TABLE_NAME = 'cash_boxes' THEN
    IF TG_OP <> 'UPDATE' OR OLD.is_active IS NOT TRUE OR NEW.is_active IS NOT FALSE THEN
      RETURN NEW;
    END IF;
    v_event_type := 'finance.cash_box_archived';
    v_actor_auth_user_id := auth.uid();
    v_subject_type := 'cash_box';
    v_subject_id := NEW.cash_box_id;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.platform_audit_events (
    event_type, outcome, source, actor_auth_user_id,
    subject_type, subject_id, occurred_at
  ) VALUES (
    v_event_type, 'success', 'database_trigger', v_actor_auth_user_id,
    v_subject_type, v_subject_id, clock_timestamp()
  ) RETURNING event_id INTO v_event_id;

  INSERT INTO public.telegram_notification_outbox (event_id)
  VALUES (v_event_id);
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.route_financial_telegram_notification()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS trg_payments_telegram_notification ON public.payments;
CREATE TRIGGER trg_payments_telegram_notification
  AFTER UPDATE OF voided_at ON public.payments
  FOR EACH ROW EXECUTE FUNCTION private.route_financial_telegram_notification();

DROP TRIGGER IF EXISTS trg_expenses_telegram_notification ON public.expenses;
CREATE TRIGGER trg_expenses_telegram_notification
  AFTER UPDATE OF voided_at ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION private.route_financial_telegram_notification();

DROP TRIGGER IF EXISTS trg_cash_box_transfers_telegram_notification
  ON public.cash_box_transfers;
CREATE TRIGGER trg_cash_box_transfers_telegram_notification
  AFTER INSERT ON public.cash_box_transfers
  FOR EACH ROW EXECUTE FUNCTION private.route_financial_telegram_notification();

DROP TRIGGER IF EXISTS trg_cash_boxes_archive_telegram_notification
  ON public.cash_boxes;
CREATE TRIGGER trg_cash_boxes_archive_telegram_notification
  AFTER UPDATE OF is_active ON public.cash_boxes
  FOR EACH ROW WHEN (OLD.is_active IS TRUE AND NEW.is_active IS FALSE)
  EXECUTE FUNCTION private.route_financial_telegram_notification();

-- Atomic worker claim: concurrent invocations skip rows already leased by
-- another worker. Expired leases can be reclaimed after a crash, up to eight
-- attempts; an expired final attempt is moved to dead_letter.
CREATE OR REPLACE FUNCTION public.claim_telegram_notifications(
  p_limit integer DEFAULT 10,
  p_lease_seconds integer DEFAULT 60
)
RETURNS TABLE (
  notification_id uuid,
  event_id uuid,
  event_type text,
  outcome text,
  occurred_at timestamptz,
  attempt_count integer,
  lease_until timestamptz
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  -- Keep the database claim contract aligned with the dispatcher's eight-attempt
  -- limit. If the worker crashed during the final attempt, expire the lease into
  -- a terminal state instead of allowing another delivery attempt.
  UPDATE public.telegram_notification_outbox AS o
  SET status = 'dead_letter',
      lease_until = NULL,
      next_attempt_at = clock_timestamp(),
      last_failure_category = COALESCE(o.last_failure_category, 'unknown')
  WHERE o.attempt_count >= 8
    AND (
      o.status IN ('pending', 'retry')
      OR (o.status = 'processing' AND o.lease_until <= clock_timestamp())
    );

  RETURN QUERY
  WITH candidates AS (
    SELECT o.notification_id
    FROM public.telegram_notification_outbox AS o
    WHERE (
      (o.status IN ('pending', 'retry') AND o.next_attempt_at <= clock_timestamp())
      OR (o.status = 'processing' AND o.lease_until <= clock_timestamp())
    )
      AND o.attempt_count < 8
    ORDER BY o.next_attempt_at, o.created_at
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 10)
    FOR UPDATE SKIP LOCKED
  ), claimed AS (
    UPDATE public.telegram_notification_outbox AS o
    SET status = 'processing',
        attempt_count = o.attempt_count + 1,
        last_attempt_at = clock_timestamp(),
        lease_until = clock_timestamp() + make_interval(
          secs => LEAST(GREATEST(COALESCE(p_lease_seconds, 60), 15), 300)
        ),
        last_failure_category = NULL
    FROM candidates AS c
    WHERE o.notification_id = c.notification_id
    RETURNING o.notification_id, o.event_id, o.attempt_count, o.lease_until
  )
  SELECT c.notification_id, e.event_id, e.event_type, e.outcome,
         e.occurred_at, c.attempt_count, c.lease_until
  FROM claimed AS c
  JOIN public.platform_audit_events AS e ON e.event_id = c.event_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_telegram_notifications(integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_telegram_notifications(integer, integer)
  TO service_role;

COMMENT ON TABLE public.platform_audit_events IS
  'Append-only allowlisted platform events. Store identifiers and event metadata only; never passwords, tokens, IP addresses, message bodies, or arbitrary client metadata.';
COMMENT ON TABLE public.telegram_notification_outbox IS
  'Server-side retryable delivery state for the single administrator Telegram group. Never store bot tokens, Telegram response bodies, or rendered message text.';
COMMENT ON FUNCTION public.claim_telegram_notifications(integer, integer) IS
  'Atomically leases due Telegram outbox rows for the service-role dispatcher; uses SKIP LOCKED and caps processing at eight attempts.';
COMMENT ON FUNCTION public.enqueue_admin_login_notification(uuid, text) IS
  'Atomically deduplicates a session hash and records a successful LMS administrator login plus its group notification; callable only by service_role.';

COMMIT;
```

---

### File: `20261023110000_telegram_notification_language.sql`
> **Version:** `20261023110000` | **Size:** `4001` bytes | **Git Status:** `Tracked (Git)` | **Draft:** `NO`
> **SHA-256:** `537f726e32ca0104215cde24f843b4c7cb7f9ec9cc945848c5ee611bfc0a07db`

```sql
-- Store the language for the shared administrator Telegram group.
-- Only active platform owners can read or change the preference through RPCs.

BEGIN;

CREATE TABLE public.platform_notification_settings (
  singleton_id smallint PRIMARY KEY DEFAULT 1 CHECK (singleton_id = 1),
  group_language text NOT NULL DEFAULT 'ar'
    CHECK (group_language IN ('ar', 'en')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.platform_notification_settings (singleton_id, group_language)
VALUES (1, 'ar')
ON CONFLICT (singleton_id) DO NOTHING;

ALTER TABLE public.platform_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_notification_settings FORCE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.platform_notification_settings
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.platform_notification_settings TO service_role;

CREATE OR REPLACE FUNCTION public.rbac_get_telegram_group_language()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE
  v_language text;
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only an active platform owner may read Telegram notification settings.'
      USING ERRCODE = '42501';
  END IF;

  SELECT group_language INTO v_language
  FROM public.platform_notification_settings
  WHERE singleton_id = 1;

  RETURN COALESCE(v_language, 'ar');
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_set_telegram_group_language(p_language text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE
  v_previous_language text;
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only an active platform owner may change Telegram notification settings.'
      USING ERRCODE = '42501';
  END IF;
  IF p_language IS NULL OR p_language NOT IN ('ar', 'en') THEN
    RAISE EXCEPTION 'Telegram notification language must be ar or en.'
      USING ERRCODE = '22023';
  END IF;

  SELECT group_language INTO v_previous_language
  FROM public.platform_notification_settings
  WHERE singleton_id = 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Telegram notification settings are not initialized.';
  END IF;

  IF v_previous_language IS DISTINCT FROM p_language THEN
    UPDATE public.platform_notification_settings
    SET group_language = p_language,
        updated_at = now(),
        updated_by = auth.uid()
    WHERE singleton_id = 1;

    INSERT INTO public.admin_audit_log (
      actor_auth_user_id,
      action,
      before_state,
      after_state
    ) VALUES (
      auth.uid(),
      'telegram_notification_language_changed',
      jsonb_build_object('group_language', v_previous_language),
      jsonb_build_object('group_language', p_language)
    );
  END IF;

  RETURN p_language;
END;
$function$;

ALTER TABLE public.admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_action_check;

ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT admin_audit_log_action_check CHECK (action IN (
    'owner_claimed', 'owner_transferred', 'owner_added', 'owner_removed',
    'admin_invited', 'admin_role_changed', 'admin_disabled', 'admin_enabled',
    'role_created', 'role_updated', 'role_deleted', 'role_permissions_changed',
    'branding_logo_changed', 'telegram_notification_language_changed'
  ));

REVOKE ALL ON FUNCTION public.rbac_get_telegram_group_language() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rbac_get_telegram_group_language() TO authenticated;
REVOKE ALL ON FUNCTION public.rbac_set_telegram_group_language(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rbac_set_telegram_group_language(text) TO authenticated;

COMMENT ON TABLE public.platform_notification_settings IS
  'Owner-controlled settings for shared platform notifications; group language defaults to Arabic.';

COMMIT;
```

---

### File: `20261030120000_student_profile_directory_v2.sql`
> **Version:** `20261030120000` | **Size:** `9087` bytes | **Git Status:** `Untracked (??)` | **Draft:** `NO`
> **SHA-256:** `54c20dcf1d2a2d7001c3f3c5bc971d3ab8f43103ce9e37db145a02ca01675fd3`

```sql
-- Student profile fields and paginated, permission-checked directory endpoints.
-- Local authoring only: do not apply remotely without explicit owner approval.

DO $preflight$
BEGIN
  IF to_regclass('public.students') IS NULL
     OR to_regclass('public.enrollments') IS NULL
     OR to_regprocedure('private.has_permission(text)') IS NULL THEN
    RAISE EXCEPTION 'Student profile migration preflight failed.';
  END IF;
END
$preflight$;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS governorate text,
  ADD COLUMN IF NOT EXISTS workplace text,
  ADD COLUMN IF NOT EXISTS study_year text;

CREATE OR REPLACE FUNCTION public.rbac_list_students_v2(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0,
  p_student_id uuid DEFAULT NULL,
  p_employment_status text DEFAULT NULL,
  p_study_year text DEFAULT NULL
)
RETURNS TABLE (
  student_id uuid, name text, phone text, email text,
  employment_status text, grad_status text, grad_college text,
  previous_courses text, notes text, created_at timestamptz, updated_at timestamptz,
  country text, governorate text, workplace text, study_year text,
  active_courses text, active_course_count bigint, total_count bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_enrollments boolean := private.has_permission('enrollments.read');
BEGIN
  IF NOT private.has_permission('students.read') THEN
    RAISE EXCEPTION 'Permission denied: students.read is required.' USING ERRCODE = '42501';
  END IF;
  IF (p_employment_status IS NOT NULL OR p_study_year IS NOT NULL)
     AND NOT private.has_permission('students.update') THEN
    RAISE EXCEPTION 'Permission denied: student profile filters require students.update.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT s.student_id, s.name::text,
    CASE WHEN private.has_permission('students.read_contact_phone') THEN s.phone::text END,
    CASE WHEN private.has_permission('students.email.read') THEN s.email::text END,
    CASE WHEN private.has_permission('students.update') THEN s.employment_status::text END,
    CASE WHEN private.has_permission('students.update') THEN s.grad_status::text END,
    CASE WHEN private.has_permission('students.update') THEN s.grad_college::text END,
    CASE WHEN private.has_permission('students.update') THEN s.previous_courses END,
    CASE WHEN private.has_permission('students.update') THEN s.notes END,
    s.created_at, s.updated_at,
    CASE WHEN private.has_permission('students.update') THEN s.country::text END,
    CASE WHEN private.has_permission('students.update') THEN s.governorate::text END,
    CASE WHEN private.has_permission('students.update') THEN s.workplace::text END,
    CASE WHEN private.has_permission('students.update') THEN s.study_year::text END,
    CASE WHEN v_enrollments THEN coalesce(enr.course_names, '')::text END,
    CASE WHEN v_enrollments THEN coalesce(enr.course_count, 0)::bigint END,
    count(*) OVER ()
  FROM public.students AS s
  LEFT JOIN LATERAL (
    SELECT (array_agg(c.course_name ORDER BY c.course_name))[1] AS course_names,
      count(*) AS course_count
    FROM public.enrollments AS e
    JOIN public.courses AS c ON c.course_id = e.course_id
    WHERE e.student_id = s.student_id AND e.status = 'Active'
  ) AS enr ON v_enrollments
  WHERE (p_student_id IS NULL OR s.student_id = p_student_id)
    AND (p_employment_status IS NULL OR s.employment_status = p_employment_status)
    AND (p_study_year IS NULL OR s.study_year = p_study_year)
    AND (p_search IS NULL OR btrim(p_search) = ''
      OR s.name ILIKE '%' || left(btrim(p_search), 100) || '%'
      OR (private.has_permission('students.read_contact_phone') AND s.phone ILIKE '%' || left(btrim(p_search), 100) || '%'))
  ORDER BY s.name, s.student_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 100)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_create_student_v2(
  p_name text,
  p_phone text DEFAULT NULL,
  p_employment_status text DEFAULT NULL,
  p_grad_status text DEFAULT NULL,
  p_grad_college text DEFAULT NULL,
  p_previous_courses text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_governorate text DEFAULT NULL,
  p_workplace text DEFAULT NULL,
  p_study_year text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_student_id uuid;
BEGIN
  IF NOT private.has_permission('students.create') THEN
    RAISE EXCEPTION 'Permission denied: students.create is required.' USING ERRCODE = '42501';
  END IF;
  IF p_name IS NULL OR btrim(p_name) = '' OR length(btrim(p_name)) > 255 THEN
    RAISE EXCEPTION 'Student name is required and must be at most 255 characters.';
  END IF;
  IF p_phone IS NOT NULL AND NOT private.has_permission('students.read_contact_phone') THEN
    RAISE EXCEPTION 'Permission denied: students.read_contact_phone is required.' USING ERRCODE = '42501';
  END IF;
  IF p_email IS NOT NULL AND NOT private.has_permission('students.email.update') THEN
    RAISE EXCEPTION 'Permission denied: students.email.update is required.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.students (name, phone, email, employment_status, grad_status,
    grad_college, previous_courses, notes, country, governorate, workplace, study_year)
  VALUES (btrim(p_name), NULLIF(btrim(p_phone), ''), NULLIF(btrim(p_email), ''),
    NULLIF(btrim(p_employment_status), ''), NULLIF(btrim(p_grad_status), ''),
    NULLIF(btrim(p_grad_college), ''), NULLIF(btrim(p_previous_courses), ''),
    NULLIF(btrim(p_notes), ''), NULLIF(btrim(p_country), ''), NULLIF(btrim(p_governorate), ''),
    NULLIF(btrim(p_workplace), ''), NULLIF(btrim(p_study_year), ''))
  RETURNING student_id INTO v_student_id;
  RETURN v_student_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_update_student_v2(
  p_student_id uuid,
  p_name text,
  p_phone text DEFAULT NULL,
  p_employment_status text DEFAULT NULL,
  p_grad_status text DEFAULT NULL,
  p_grad_college text DEFAULT NULL,
  p_previous_courses text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_governorate text DEFAULT NULL,
  p_workplace text DEFAULT NULL,
  p_study_year text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('students.update') THEN
    RAISE EXCEPTION 'Permission denied: students.update is required.' USING ERRCODE = '42501';
  END IF;
  IF p_student_id IS NULL OR p_name IS NULL OR btrim(p_name) = '' OR length(btrim(p_name)) > 255 THEN
    RAISE EXCEPTION 'Student id and a valid name are required.';
  END IF;
  IF p_email IS NOT NULL AND NOT private.has_permission('students.email.update') THEN
    RAISE EXCEPTION 'Permission denied: students.email.update is required.' USING ERRCODE = '42501';
  END IF;
  UPDATE public.students AS s
  SET name = btrim(p_name),
      phone = CASE WHEN private.has_permission('students.read_contact_phone') THEN NULLIF(btrim(p_phone), '') ELSE s.phone END,
      email = CASE WHEN private.has_permission('students.email.update') THEN NULLIF(btrim(p_email), '') ELSE s.email END,
      employment_status = NULLIF(btrim(p_employment_status), ''),
      grad_status = NULLIF(btrim(p_grad_status), ''),
      grad_college = NULLIF(btrim(p_grad_college), ''),
      previous_courses = NULLIF(btrim(p_previous_courses), ''),
      notes = NULLIF(btrim(p_notes), ''),
      country = NULLIF(btrim(p_country), ''), governorate = NULLIF(btrim(p_governorate), ''),
      workplace = NULLIF(btrim(p_workplace), ''), study_year = NULLIF(btrim(p_study_year), ''),
      updated_at = now()
  WHERE s.student_id = p_student_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Student not found.'; END IF;
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.rbac_list_students_v2(text, integer, integer, uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_create_student_v2(text, text, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_update_student_v2(uuid, text, text, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rbac_list_students_v2(text, integer, integer, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_create_student_v2(text, text, text, text, text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_update_student_v2(uuid, text, text, text, text, text, text, text, text, text, text, text, text) TO authenticated;

COMMENT ON FUNCTION public.rbac_list_students_v2(text, integer, integer, uuid, text, text) IS
  'Paginated student directory with permission-filtered profile fields and active course summary.';

NOTIFY pgrst, 'reload schema';
```

---

### File: `20261030130000_course_enrollment_currency_v2.sql`
> **Version:** `20261030130000` | **Size:** `30301` bytes | **Git Status:** `Untracked (??)` | **Draft:** `NO`
> **SHA-256:** `6011c61475fca480be446eb52e8f24c8c2fab2bd1089e08411fb0e38f40ed7c9`

```sql
-- Dual course pricing and enrollment-level currency snapshots.
-- Existing rows are classified as EGP; no historical values are converted.
BEGIN;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS default_cost_usd numeric(12,2);

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS agreed_currency text NOT NULL DEFAULT 'EGP';

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EGP';

ALTER TABLE public.cash_boxes
  ADD COLUMN IF NOT EXISTS opening_balance_usd numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_default_cost_usd_nonnegative
  CHECK (default_cost_usd IS NULL OR default_cost_usd >= 0) NOT VALID;
ALTER TABLE public.courses VALIDATE CONSTRAINT courses_default_cost_usd_nonnegative;

ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_agreed_currency_check
  CHECK (agreed_currency IN ('EGP', 'USD')) NOT VALID;
ALTER TABLE public.enrollments VALIDATE CONSTRAINT enrollments_agreed_currency_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_currency_check CHECK (currency IN ('EGP', 'USD')) NOT VALID;
ALTER TABLE public.payments VALIDATE CONSTRAINT payments_currency_check;

ALTER TABLE public.cash_boxes
  ADD CONSTRAINT cash_boxes_opening_balance_usd_nonnegative
  CHECK (opening_balance_usd >= 0) NOT VALID;
ALTER TABLE public.cash_boxes VALIDATE CONSTRAINT cash_boxes_opening_balance_usd_nonnegative;

CREATE OR REPLACE FUNCTION public.rbac_list_courses_v2(
  p_limit integer DEFAULT 200, p_offset integer DEFAULT 0, p_course_id uuid DEFAULT NULL
)
RETURNS TABLE (
  course_id uuid, course_name text, description text, level text,
  duration_weeks integer, prerequisite_courses text, start_date date, end_date date,
  max_students integer, default_cost numeric, default_cost_usd numeric,
  availability_status text, link_whatsapp text, link_tasks text,
  link_drive text, link_sources text, created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('courses.read') THEN
    RAISE EXCEPTION 'Permission denied: courses.read is required.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT c.course_id, c.course_name::text, c.description, c.level::text,    c.duration_weeks, c.prerequisite_courses, c.start_date, c.end_date,
    c.max_students,
    CASE WHEN private.has_permission('courses.pricing.read') THEN c.default_cost END,
    CASE WHEN private.has_permission('courses.pricing.read') THEN c.default_cost_usd END,
    c.availability_status::text, c.link_whatsapp, c.link_tasks,
    c.link_drive, c.link_sources, c.created_at, c.updated_at
  FROM public.courses c
  WHERE p_course_id IS NULL OR c.course_id = p_course_id
  ORDER BY c.start_date NULLS LAST, c.course_name, c.course_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_create_course_v2(
  p_course_name text, p_description text DEFAULT NULL, p_level text DEFAULT NULL,
  p_duration_weeks integer DEFAULT NULL, p_prerequisite_courses text DEFAULT NULL,
  p_start_date date DEFAULT NULL, p_end_date date DEFAULT NULL,
  p_max_students integer DEFAULT NULL, p_default_cost numeric DEFAULT NULL,
  p_default_cost_usd numeric DEFAULT NULL, p_availability_status text DEFAULT 'Upcoming',
  p_link_whatsapp text DEFAULT NULL, p_link_tasks text DEFAULT NULL,
  p_link_drive text DEFAULT NULL, p_link_sources text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_course_id uuid;
BEGIN
  IF NOT private.has_permission('courses.create') THEN
    RAISE EXCEPTION 'Permission denied: courses.create is required.' USING ERRCODE = '42501';
  END IF;
  IF (p_default_cost IS NOT NULL OR p_default_cost_usd IS NOT NULL)
     AND NOT private.has_permission('courses.pricing.update') THEN
    RAISE EXCEPTION 'Permission denied: courses.pricing.update is required.' USING ERRCODE = '42501';
  END IF;
  IF p_course_name IS NULL OR btrim(p_course_name) = '' THEN RAISE EXCEPTION 'Course name is required.'; END IF;
  IF p_default_cost < 0 OR p_default_cost_usd < 0 THEN RAISE EXCEPTION 'Course prices cannot be negative.'; END IF;
  IF p_availability_status NOT IN ('Upcoming', 'Active', 'Closed') THEN RAISE EXCEPTION 'Invalid course status.'; END IF;
  IF p_availability_status = 'Closed' AND NOT private.has_permission('courses.close') THEN
    RAISE EXCEPTION 'Permission denied: courses.close is required.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.courses (
    course_name, description, level, duration_weeks, prerequisite_courses,
    start_date, end_date, max_students, default_cost, default_cost_usd,
    availability_status, link_whatsapp, link_tasks, link_drive, link_sources
  ) VALUES (
    btrim(p_course_name), p_description, p_level, p_duration_weeks, p_prerequisite_courses,
    p_start_date, p_end_date, p_max_students, COALESCE(p_default_cost, 0), p_default_cost_usd,
    p_availability_status, p_link_whatsapp, p_link_tasks, p_link_drive, p_link_sources
  ) RETURNING course_id INTO v_course_id;
  RETURN v_course_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_update_course_v2(
  p_course_id uuid, p_course_name text, p_description text DEFAULT NULL,
  p_level text DEFAULT NULL, p_duration_weeks integer DEFAULT NULL,
  p_prerequisite_courses text DEFAULT NULL, p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL, p_max_students integer DEFAULT NULL,
  p_default_cost numeric DEFAULT NULL, p_default_cost_usd numeric DEFAULT NULL,
  p_availability_status text DEFAULT 'Upcoming', p_link_whatsapp text DEFAULT NULL,
  p_link_tasks text DEFAULT NULL, p_link_drive text DEFAULT NULL, p_link_sources text DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_course public.courses%ROWTYPE;
BEGIN
  IF NOT private.has_permission('courses.update') THEN
    RAISE EXCEPTION 'Permission denied: courses.update is required.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_course FROM public.courses WHERE course_id = p_course_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Course not found.'; END IF;
  IF p_course_name IS NULL OR btrim(p_course_name) = '' THEN RAISE EXCEPTION 'Course name is required.'; END IF;
  IF p_default_cost < 0 OR p_default_cost_usd < 0 THEN RAISE EXCEPTION 'Course prices cannot be negative.'; END IF;
  IF (p_default_cost IS DISTINCT FROM v_course.default_cost OR p_default_cost_usd IS DISTINCT FROM v_course.default_cost_usd)
     AND NOT private.has_permission('courses.pricing.update') THEN
    RAISE EXCEPTION 'Permission denied: courses.pricing.update is required to change prices.' USING ERRCODE = '42501';
  END IF;
  IF p_availability_status NOT IN ('Upcoming', 'Active', 'Closed') THEN RAISE EXCEPTION 'Invalid course status.'; END IF;
  IF p_availability_status = 'Closed' AND v_course.availability_status <> 'Closed'
     AND NOT private.has_permission('courses.close') THEN
    RAISE EXCEPTION 'Permission denied: courses.close is required.' USING ERRCODE = '42501';
  END IF;
  IF v_course.availability_status = 'Closed' AND p_availability_status <> 'Closed'
     AND NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only the platform owner may reopen a closed course.' USING ERRCODE = '42501';
  END IF;
  UPDATE public.courses SET
    course_name = btrim(p_course_name), description = p_description, level = p_level,
    duration_weeks = p_duration_weeks, prerequisite_courses = p_prerequisite_courses,
    start_date = p_start_date, end_date = p_end_date, max_students = p_max_students,
    default_cost = CASE WHEN private.has_permission('courses.pricing.update') THEN p_default_cost ELSE v_course.default_cost END,
    default_cost_usd = CASE WHEN private.has_permission('courses.pricing.update') THEN p_default_cost_usd ELSE v_course.default_cost_usd END,
    availability_status = p_availability_status, link_whatsapp = p_link_whatsapp,
    link_tasks = p_link_tasks, link_drive = p_link_drive, link_sources = p_link_sources,
    updated_at = now()
  WHERE course_id = p_course_id;
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_enroll_student_v2(
  p_student_id uuid, p_course_id uuid, p_currency text DEFAULT 'EGP',
  p_agreed_cost numeric DEFAULT NULL, p_status text DEFAULT 'Active'
)
RETURNS TABLE (enrollment_id uuid, student_id uuid, course_id uuid, status text, enrolled_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_course public.courses%ROWTYPE; v_cost numeric;
  v_count integer; v_row public.enrollments%ROWTYPE;
BEGIN
  IF NOT private.has_permission('enrollments.create') THEN
    RAISE EXCEPTION 'Permission denied: enrollments.create is required.' USING ERRCODE = '42501';
  END IF;
  IF p_currency IS NULL OR p_currency NOT IN ('EGP', 'USD') THEN RAISE EXCEPTION 'Currency must be EGP or USD.'; END IF;
  IF p_status IS NULL OR p_status NOT IN ('Active', 'Completed', 'Dropped') THEN RAISE EXCEPTION 'Invalid enrollment status.'; END IF;
  IF p_agreed_cost IS NOT NULL AND NOT private.has_permission('enrollments.pricing.override') THEN
    RAISE EXCEPTION 'Permission denied: enrollment price override is not allowed.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_course FROM public.courses WHERE course_id = p_course_id FOR UPDATE;
  IF NOT FOUND OR v_course.availability_status = 'Closed' THEN RAISE EXCEPTION 'Course not found or closed.'; END IF;
  SELECT count(*) INTO v_count FROM public.enrollments WHERE course_id = p_course_id AND status = 'Active';
  IF v_course.max_students IS NOT NULL AND v_count >= v_course.max_students THEN RAISE EXCEPTION 'Course is full.'; END IF;
  v_cost := COALESCE(p_agreed_cost, CASE WHEN p_currency = 'USD' THEN v_course.default_cost_usd ELSE v_course.default_cost END);
  IF v_cost IS NULL OR v_cost < 0 THEN RAISE EXCEPTION 'A valid course price is required for the selected currency.'; END IF;
  INSERT INTO public.enrollments (student_id, course_id, agreed_cost, agreed_currency, status)
  VALUES (p_student_id, p_course_id, v_cost, p_currency, p_status)
  RETURNING * INTO v_row;
  RETURN QUERY SELECT v_row.enrollment_id, v_row.student_id, v_row.course_id, v_row.status::text, v_row.enrolled_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_record_payment_v2(
  p_enrollment_id uuid, p_cash_box_id uuid, p_amount numeric,
  p_payment_date date DEFAULT CURRENT_DATE, p_method text DEFAULT 'Cash',
  p_receipt_ref text DEFAULT NULL, p_notes text DEFAULT NULL
)
RETURNS TABLE (payment_id uuid, receipt_number bigint)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_enr public.enrollments%ROWTYPE; v_box public.cash_boxes%ROWTYPE;
  v_paid numeric; v_payment public.payments%ROWTYPE;
BEGIN
  IF NOT private.has_permission('finance.payments.record') THEN
    RAISE EXCEPTION 'Permission denied: finance.payments.record is required.' USING ERRCODE = '42501';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Payment amount must be positive.'; END IF;
  SELECT * INTO v_enr FROM public.enrollments WHERE enrollment_id = p_enrollment_id FOR UPDATE;
  IF NOT FOUND OR v_enr.status = 'Dropped' THEN RAISE EXCEPTION 'Enrollment not found or dropped.'; END IF;
  SELECT * INTO v_box FROM public.cash_boxes WHERE cash_box_id = p_cash_box_id FOR UPDATE;
  IF NOT FOUND OR NOT v_box.is_active THEN RAISE EXCEPTION 'Cash box not found or inactive.'; END IF;
  SELECT COALESCE(sum(amount), 0) INTO v_paid FROM public.payments
    WHERE enrollment_id = p_enrollment_id AND currency = v_enr.agreed_currency AND voided_at IS NULL;
  IF p_amount > v_enr.agreed_cost - v_paid THEN RAISE EXCEPTION 'Payment exceeds remaining balance.'; END IF;
  INSERT INTO public.payments (enrollment_id, cash_box_id, amount, currency, payment_date, method, receipt_ref, notes, added_by)
  VALUES (p_enrollment_id, p_cash_box_id, p_amount, v_enr.agreed_currency,
    COALESCE(p_payment_date, CURRENT_DATE), COALESCE(p_method, 'Cash'), p_receipt_ref, p_notes, auth.uid())
  RETURNING * INTO v_payment;
  RETURN QUERY SELECT v_payment.payment_id, v_payment.receipt_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_enrollments_v2(
  p_search text DEFAULT NULL, p_limit integer DEFAULT 200, p_offset integer DEFAULT 0,
  p_student_id uuid DEFAULT NULL, p_course_id uuid DEFAULT NULL
)
RETURNS TABLE (
  enrollment_id uuid, student_id uuid, student_name text, student_phone text,
  course_id uuid, course_name text, enrollment_status text, enrolled_at timestamptz,
  agreed_cost numeric, agreed_currency text, total_paid numeric,
  remaining_balance numeric, payment_status text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_finance boolean := private.has_permission('enrollments.financial.read');
  v_phone boolean := private.has_permission('students.read_contact_phone');
BEGIN
  IF NOT private.has_permission('enrollments.read') THEN RAISE EXCEPTION 'Permission denied: enrollments.read is required.' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  WITH paid AS (
    SELECT p.enrollment_id, sum(p.amount) AS amount_paid FROM public.payments p
    JOIN public.enrollments e USING (enrollment_id)
    WHERE p.voided_at IS NULL AND p.currency = e.agreed_currency GROUP BY p.enrollment_id
  )
  SELECT e.enrollment_id, s.student_id, s.name::text, CASE WHEN v_phone THEN s.phone::text END,
    c.course_id, c.course_name::text, e.status::text, e.enrolled_at,
    CASE WHEN v_finance THEN e.agreed_cost END,
    CASE WHEN v_finance THEN e.agreed_currency END,
    CASE WHEN v_finance THEN COALESCE(p.amount_paid, 0::numeric) END,
    CASE WHEN v_finance THEN e.agreed_cost - COALESCE(p.amount_paid, 0::numeric) END,
    CASE WHEN v_finance THEN CASE
      WHEN e.agreed_cost - COALESCE(p.amount_paid, 0::numeric) < 0 THEN 'Overpaid'
      WHEN e.agreed_cost - COALESCE(p.amount_paid, 0::numeric) = 0 AND COALESCE(p.amount_paid, 0::numeric) > 0 THEN 'Paid'
      WHEN COALESCE(p.amount_paid, 0::numeric) = 0 THEN 'Unpaid' ELSE 'Partial' END END
  FROM public.enrollments e JOIN public.students s USING (student_id)
  JOIN public.courses c USING (course_id) LEFT JOIN paid p USING (enrollment_id)
  WHERE (p_student_id IS NULL OR s.student_id = p_student_id)
    AND (p_course_id IS NULL OR c.course_id = p_course_id)
    AND (p_search IS NULL OR btrim(p_search) = '' OR s.name ILIKE '%' || left(btrim(p_search),100) || '%'
      OR c.course_name ILIKE '%' || left(btrim(p_search),100) || '%'
      OR (v_phone AND s.phone ILIKE '%' || left(btrim(p_search),100) || '%'))
  ORDER BY e.enrolled_at DESC, e.enrollment_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit,200),1),500) OFFSET GREATEST(COALESCE(p_offset,0),0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_cash_boxes_v2()
RETURNS TABLE (
  cash_box_id uuid, name text, type text, owner text, opening_balance numeric,
  opening_balance_usd numeric, is_active boolean, notes text,
  total_payments_in numeric, total_payments_in_usd numeric,
  total_expenses_out numeric, total_transfers_in numeric, total_transfers_out numeric,
  current_balance numeric, current_balance_usd numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('finance.cash_boxes.read') THEN RAISE EXCEPTION 'Permission denied: finance.cash_boxes.read is required.' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  WITH pay AS (
    SELECT p.cash_box_id, sum(p.amount) FILTER (WHERE p.currency='EGP') egp,
      sum(p.amount) FILTER (WHERE p.currency='USD') usd
    FROM public.payments p WHERE p.voided_at IS NULL GROUP BY p.cash_box_id
  ), exp AS (SELECT e.cash_box_id, sum(e.amount) amount FROM public.expenses e WHERE e.voided_at IS NULL GROUP BY e.cash_box_id),
  tin AS (SELECT t.to_box_id id, sum(t.amount) amount FROM public.cash_box_transfers t GROUP BY t.to_box_id),
  tout AS (SELECT t.from_box_id id, sum(t.amount) amount FROM public.cash_box_transfers t GROUP BY t.from_box_id)
  SELECT cb.cash_box_id, cb.name::text, cb.type::text, cb.owner::text,
    cb.opening_balance, cb.opening_balance_usd, cb.is_active, cb.notes,
    COALESCE(pay.egp,0), COALESCE(pay.usd,0), COALESCE(exp.amount,0),
    COALESCE(tin.amount,0), COALESCE(tout.amount,0),
    cb.opening_balance + COALESCE(pay.egp,0) - COALESCE(exp.amount,0) + COALESCE(tin.amount,0)-COALESCE(tout.amount,0),
    cb.opening_balance_usd + COALESCE(pay.usd,0)
  FROM public.cash_boxes cb LEFT JOIN pay ON pay.cash_box_id=cb.cash_box_id
  LEFT JOIN exp ON exp.cash_box_id=cb.cash_box_id LEFT JOIN tin ON tin.id=cb.cash_box_id
  LEFT JOIN tout ON tout.id=cb.cash_box_id ORDER BY cb.is_active DESC, cb.name, cb.cash_box_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_create_cash_box_v2(
  p_name varchar, p_type varchar DEFAULT 'Main', p_owner varchar DEFAULT NULL,
  p_opening_balance numeric DEFAULT 0, p_opening_balance_usd numeric DEFAULT 0,
  p_notes text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE v_id uuid;
BEGIN
  IF NOT private.has_permission('finance.cash_boxes.create') THEN
    RAISE EXCEPTION 'Permission denied: finance.cash_boxes.create is required.' USING ERRCODE='42501';
  END IF;
  IF p_name IS NULL OR btrim(p_name)='' THEN RAISE EXCEPTION 'Cash box name is required.'; END IF;
  IF COALESCE(p_opening_balance,0)<0 OR COALESCE(p_opening_balance_usd,0)<0
    OR COALESCE(p_opening_balance,0)>99999999.99 OR COALESCE(p_opening_balance_usd,0)>99999999.99 THEN
    RAISE EXCEPTION 'Opening balances must be between 0 and 99,999,999.99.' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.cash_boxes(name,type,owner,opening_balance,opening_balance_usd,notes,added_by)
  VALUES (btrim(p_name),COALESCE(NULLIF(btrim(p_type),''),'Main'),NULLIF(btrim(p_owner), ''),
    COALESCE(p_opening_balance,0),COALESCE(p_opening_balance_usd,0),p_notes,auth.uid())
  RETURNING cash_box_id INTO v_id;
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_payments_v2(p_limit integer DEFAULT 200, p_offset integer DEFAULT 0)
RETURNS TABLE (
  payment_id uuid, receipt_number bigint, enrollment_id uuid, student_id uuid,
  student_name text, student_phone text, course_id uuid, course_name text,
  cash_box_id uuid, cash_box_name text, amount numeric, currency text,
  payment_date date, method text, receipt_ref text, notes text,
  voided_at timestamptz, voided_by uuid, void_reason text, added_by uuid, created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('finance.payments.read') THEN RAISE EXCEPTION 'Permission denied: finance.payments.read is required.' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT p.payment_id,p.receipt_number,e.enrollment_id,s.student_id,s.name::text,
    CASE WHEN private.has_permission('students.read_contact_phone') THEN s.phone::text END,
    c.course_id,c.course_name::text,cb.cash_box_id,cb.name::text,p.amount,p.currency,
    p.payment_date,p.method::text,p.receipt_ref::text,p.notes,p.voided_at,p.voided_by,
    p.void_reason,p.added_by,p.created_at
  FROM public.payments p JOIN public.enrollments e USING(enrollment_id)
  JOIN public.students s USING(student_id) JOIN public.courses c USING(course_id)
  JOIN public.cash_boxes cb USING(cash_box_id)
  ORDER BY p.payment_date DESC,p.created_at DESC,p.payment_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit,200),1),500) OFFSET GREATEST(COALESCE(p_offset,0),0);
END;
$function$;

-- Legacy endpoints remain callable by older clients. Route writes through the
-- currency-aware endpoints so an old client cannot create a mismatched payment.
CREATE OR REPLACE FUNCTION public.rbac_enroll_student(
  p_student_id uuid, p_course_id uuid, p_agreed_cost numeric DEFAULT NULL,
  p_status text DEFAULT 'Active'
)
RETURNS TABLE (enrollment_id uuid, student_id uuid, course_id uuid, status text, enrolled_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  RETURN QUERY SELECT * FROM public.rbac_enroll_student_v2(p_student_id,p_course_id,'EGP',p_agreed_cost,p_status);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_record_payment(
  p_enrollment_id uuid, p_cash_box_id uuid, p_amount numeric,
  p_payment_date date DEFAULT CURRENT_DATE, p_method text DEFAULT 'Cash',
  p_receipt_ref text DEFAULT NULL, p_notes text DEFAULT NULL
)
RETURNS TABLE (payment_id uuid, receipt_number bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  RETURN QUERY SELECT * FROM public.rbac_record_payment_v2(
    p_enrollment_id,p_cash_box_id,p_amount,p_payment_date,p_method,p_receipt_ref,p_notes
  );
END;
$function$;

-- Keep pre-v2 aggregate reports explicitly in EGP. USD values are exposed by
-- separate fields/endpoints and are never added to EGP totals.
CREATE OR REPLACE FUNCTION public.rbac_finance_dashboard_metrics()
RETURNS TABLE (revenue_this_month numeric, total_revenue_all_time numeric,
  expenses_this_month numeric, total_expenses_all_time numeric,
  net_profit_this_month numeric, total_net_profit_all_time numeric,
  outstanding_balance numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('dashboard.finance.read') THEN RAISE EXCEPTION 'Permission denied: dashboard.finance.read is required.' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  WITH pay AS (
    SELECT COALESCE(sum(amount) FILTER (WHERE date_trunc('month',payment_date)=date_trunc('month',now())),0) month_total,
      COALESCE(sum(amount),0) all_total FROM public.payments WHERE voided_at IS NULL AND currency='EGP'
  ), exp AS (
    SELECT COALESCE(sum(amount) FILTER (WHERE date_trunc('month',expense_date)=date_trunc('month',now())),0) month_total,
      COALESCE(sum(amount),0) all_total FROM public.expenses WHERE voided_at IS NULL
  ), bal AS (
    SELECT COALESCE(sum(e.agreed_cost-COALESCE(p.total,0)) FILTER (
      WHERE e.status='Active' AND e.agreed_currency='EGP' AND e.agreed_cost-COALESCE(p.total,0)>0),0) outstanding
    FROM public.enrollments e LEFT JOIN (
      SELECT enrollment_id,sum(amount) total FROM public.payments WHERE voided_at IS NULL AND currency='EGP' GROUP BY enrollment_id
    ) p USING(enrollment_id)
  )
  SELECT pay.month_total,pay.all_total,exp.month_total,exp.all_total,
    pay.month_total-exp.month_total,pay.all_total-exp.all_total,bal.outstanding
  FROM pay CROSS JOIN exp CROSS JOIN bal;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_finance_dashboard_usd_v2()
RETURNS TABLE (revenue_this_month_usd numeric, total_revenue_all_time_usd numeric, total_pending_balance_usd numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('dashboard.finance.read') THEN RAISE EXCEPTION 'Permission denied: dashboard.finance.read is required.' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  WITH pay AS (
    SELECT COALESCE(sum(amount) FILTER (WHERE date_trunc('month',payment_date)=date_trunc('month',now())),0) month_total,
      COALESCE(sum(amount),0) all_total FROM public.payments WHERE voided_at IS NULL AND currency='USD'
  ), bal AS (
    SELECT COALESCE(sum(e.agreed_cost-COALESCE(p.total,0)) FILTER (
      WHERE e.status='Active' AND e.agreed_currency='USD' AND e.agreed_cost-COALESCE(p.total,0)>0),0) outstanding
    FROM public.enrollments e LEFT JOIN (
      SELECT enrollment_id,sum(amount) total FROM public.payments WHERE voided_at IS NULL AND currency='USD' GROUP BY enrollment_id
    ) p USING(enrollment_id)
  )
  SELECT pay.month_total,pay.all_total,bal.outstanding FROM pay CROSS JOIN bal;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_course_financial_summary_v2(p_course_id uuid DEFAULT NULL)
RETURNS TABLE (
  course_id uuid, course_name text, default_cost numeric, default_cost_usd numeric,
  availability_status text, max_students integer, vacant_places integer,
  total_enrollments bigint, expected_revenue numeric, collected_payments numeric,
  total_expenses numeric, net_profit numeric, expected_revenue_usd numeric,
  collected_payments_usd numeric, active_enrollments bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('finance.reports.read') THEN RAISE EXCEPTION 'Permission denied: finance.reports.read is required.' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  WITH enr AS (
    SELECT e.course_id,count(*) total_count,count(*) FILTER(WHERE e.status='Active') active_count,
      COALESCE(sum(e.agreed_cost) FILTER(WHERE e.agreed_currency='EGP'),0) expected_egp,
      COALESCE(sum(e.agreed_cost) FILTER(WHERE e.agreed_currency='USD'),0) expected_usd
    FROM public.enrollments e GROUP BY e.course_id
  ), pay AS (
    SELECT e.course_id,COALESCE(sum(p.amount) FILTER(WHERE p.currency='EGP'),0) paid_egp,
      COALESCE(sum(p.amount) FILTER(WHERE p.currency='USD'),0) paid_usd
    FROM public.enrollments e JOIN public.payments p USING(enrollment_id)
    WHERE p.voided_at IS NULL GROUP BY e.course_id
  ), exp AS (
    SELECT course_id,COALESCE(sum(amount),0) total FROM public.expenses WHERE course_id IS NOT NULL AND voided_at IS NULL GROUP BY course_id
  )
  SELECT c.course_id,c.course_name::text,
    CASE WHEN private.has_permission('courses.pricing.read') THEN c.default_cost END,
    CASE WHEN private.has_permission('courses.pricing.read') THEN c.default_cost_usd END,
    c.availability_status::text,c.max_students,
    CASE WHEN c.max_students IS NULL THEN NULL ELSE GREATEST(c.max_students-COALESCE(enr.active_count,0)::integer,0) END,
    COALESCE(enr.total_count,0),COALESCE(enr.expected_egp,0),COALESCE(pay.paid_egp,0),COALESCE(exp.total,0),
    COALESCE(pay.paid_egp,0)-COALESCE(exp.total,0),COALESCE(enr.expected_usd,0),COALESCE(pay.paid_usd,0),COALESCE(enr.active_count,0)
  FROM public.courses c LEFT JOIN enr ON enr.course_id=c.course_id
  LEFT JOIN pay ON pay.course_id=c.course_id LEFT JOIN exp ON exp.course_id=c.course_id
  WHERE p_course_id IS NULL OR c.course_id=p_course_id ORDER BY c.course_name,c.course_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_course_financial_summary(p_course_id uuid DEFAULT NULL)
RETURNS TABLE (
  course_id uuid, course_name text, default_cost numeric,
  availability_status text, max_students integer, vacant_places integer,
  total_enrollments bigint, expected_revenue numeric, collected_payments numeric,
  total_expenses numeric, net_profit numeric, active_enrollments bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  RETURN QUERY SELECT s.course_id,s.course_name,s.default_cost,s.availability_status,
    s.max_students,s.vacant_places,s.total_enrollments,s.expected_revenue,
    s.collected_payments,s.total_expenses,s.net_profit,s.active_enrollments
  FROM public.rbac_course_financial_summary_v2(p_course_id) s;
END;
$function$;

REVOKE ALL ON FUNCTION public.rbac_list_courses_v2(integer,integer,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_create_course_v2(text,text,text,integer,text,date,date,integer,numeric,numeric,text,text,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_update_course_v2(uuid,text,text,text,integer,text,date,date,integer,numeric,numeric,text,text,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_enroll_student_v2(uuid,uuid,text,numeric,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_record_payment_v2(uuid,uuid,numeric,date,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_list_enrollments_v2(text,integer,integer,uuid,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_list_cash_boxes_v2() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_create_cash_box_v2(character varying,character varying,character varying,numeric,numeric,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_list_payments_v2(integer,integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_finance_dashboard_usd_v2() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rbac_course_financial_summary_v2(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rbac_list_courses_v2(integer,integer,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_create_course_v2(text,text,text,integer,text,date,date,integer,numeric,numeric,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_update_course_v2(uuid,text,text,text,integer,text,date,date,integer,numeric,numeric,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_enroll_student_v2(uuid,uuid,text,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_record_payment_v2(uuid,uuid,numeric,date,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_list_enrollments_v2(text,integer,integer,uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_list_cash_boxes_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_create_cash_box_v2(character varying,character varying,character varying,numeric,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_list_payments_v2(integer,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_finance_dashboard_usd_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_course_financial_summary_v2(uuid) TO authenticated;

-- All authenticated payment writes must pass the checked RBAC endpoint. V2
-- RPCs derive currency from the locked enrollment and reject overpayments.
REVOKE ALL ON FUNCTION public.record_payment(uuid,uuid,numeric,date,text,text,text) FROM PUBLIC, anon, authenticated;

COMMIT;
```

---