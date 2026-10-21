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
