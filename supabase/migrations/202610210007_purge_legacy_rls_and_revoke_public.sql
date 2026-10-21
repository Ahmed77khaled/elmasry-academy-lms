-- ============================================================================
-- Migration: 202610210007_purge_legacy_rls_and_revoke_public.sql
-- Project: Elmasry Academy LMS (TrainerPro)
-- Target: Dedicated RLS Purge & PUBLIC Privilege Lockdown
-- Lead Architect: Eng. Ahmed El-Falah (م/ أحمد الفلاح)
-- ============================================================================
-- Purpose:
-- 1. In PostgreSQL, permissive policies combine via OR logic. Any leftover
--    permissive policy (e.g. anon_select_*, anon_insert_*, Allow authenticated read)
--    from initial development migrations (001-004) would completely bypass admin restrictions.
-- 2. Dynamically purge ALL existing policies on the 8 core tables.
-- 3. Explicitly revoke table privileges from PUBLIC and anon.
-- 4. Establish singular, authoritative admin-only policies on all core tables.
-- 5. Revoke execution of sensitive RPC functions from PUBLIC and anon.
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
-- 2. ENFORCE AND FORCE ROW LEVEL SECURITY
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
-- 3. REVOKE PRIVILEGES FROM PUBLIC AND ANON
-- ============================================================================
-- In PostgreSQL, PUBLIC is a pseudo-role representing every role.
-- Revoking from PUBLIC and anon closes direct REST access for unauthenticated users.
REVOKE ALL ON TABLE public.admins, public.students, public.courses, public.cash_boxes,
                    public.enrollments, public.payments, public.expenses, public.cash_box_transfers
FROM PUBLIC, anon;

-- Grant required table operations to authenticated role (RLS will filter to is_admin only)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admins, public.students, public.courses, public.cash_boxes,
                                              public.enrollments, public.payments, public.expenses, public.cash_box_transfers
TO authenticated;


-- ============================================================================
-- 4. CREATE SINGULAR, CRISP ADMIN-ONLY RLS POLICIES
-- ============================================================================

-- 1) Admins: allow authenticated user to verify own admin row, and active admins to manage all
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

-- 5) Enrollments: Only authenticated administrators can read/write
CREATE POLICY "enrollments_admin_only_policy" ON public.enrollments
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6) Payments: Only authenticated administrators can read; direct writes blocked by ledger trigger
CREATE POLICY "payments_admin_only_policy" ON public.payments
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7) Expenses: Only authenticated administrators can read; direct writes blocked by ledger trigger
CREATE POLICY "expenses_admin_only_policy" ON public.expenses
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 8) Cash Box Transfers: Only authenticated administrators can read; direct writes blocked by ledger trigger
CREATE POLICY "transfers_admin_only_policy" ON public.cash_box_transfers
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ============================================================================
-- 5. SECURE RPC EXECUTION PRIVILEGES (REVOKE FROM PUBLIC & ANON)
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
