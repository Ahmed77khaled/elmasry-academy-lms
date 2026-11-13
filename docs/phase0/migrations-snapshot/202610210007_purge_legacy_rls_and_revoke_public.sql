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
