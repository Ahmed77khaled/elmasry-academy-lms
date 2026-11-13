-- Phase 0 forward-only migration: make legacy financial views EGP-only.
-- Target: TrainerPro / urmkcixqpoqkiosihhal.
--
-- Currency model supported by the supplied live evidence:
--   * payments.currency and enrollments.agreed_currency distinguish EGP/USD.
--   * expenses and cash_box_transfers have no currency column and are treated
--     as EGP-only by the current cash-box v2 RPC.
--   * USD financial data is exposed through the dedicated v2 RPC endpoints.
--
-- Count/operational columns in course_financial_summary and dashboard_metrics
-- remain cross-currency operational counts. Every monetary column in these
-- legacy views represents EGP only.
--
-- The checked application code calls RPCs, not these views directly. It calls
-- rbac_course_financial_summary (without the v2 suffix) for course details.
-- Retained evidence conflicts on whether that routine reads the legacy view or
-- delegates to rbac_course_financial_summary_v2. Resolve that discrepancy with
-- same-project function/dependency evidence before staging sign-off. Four
-- existing view signatures and security_invoker=true are preserved.
--
-- IMPORTANT: The no-currency-column EGP assumption for expenses/transfers is a
-- business/data convention, not provable from schema alone. Verify it with the
-- data owner before staging sign-off.
-- Draft for staging validation only. Do not apply directly to production.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $preflight$
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'STOP: expected current_user=postgres, got %', current_user;
  END IF;

  IF to_regclass('public.enrollment_balances') IS NULL
     OR to_regclass('public.cash_box_balances') IS NULL
     OR to_regclass('public.course_financial_summary') IS NULL
     OR to_regclass('public.dashboard_metrics') IS NULL THEN
    RAISE EXCEPTION 'STOP: one or more audited legacy financial views are missing';
  END IF;

  IF to_regclass('public.payments') IS NULL
     OR to_regclass('public.enrollments') IS NULL
     OR to_regclass('public.expenses') IS NULL
     OR to_regclass('public.cash_box_transfers') IS NULL
     OR to_regclass('public.cash_boxes') IS NULL
     OR to_regclass('public.students') IS NULL
     OR to_regclass('public.courses') IS NULL THEN
    RAISE EXCEPTION 'STOP: one or more required financial source tables are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments'
      AND column_name = 'currency' AND data_type = 'text'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'enrollments'
      AND column_name = 'agreed_currency' AND data_type = 'text'
  ) THEN
    RAISE EXCEPTION 'STOP: expected payments.currency and enrollments.agreed_currency text columns were not found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('expenses', 'cash_box_transfers')
      AND column_name = 'currency'
  ) THEN
    RAISE EXCEPTION 'STOP: expenses/transfers now have currency columns; the proposed EGP-only assumptions must be re-reviewed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.payments p
    JOIN public.enrollments e ON e.enrollment_id = p.enrollment_id
    WHERE p.currency IS DISTINCT FROM e.agreed_currency
  ) THEN
    RAISE EXCEPTION 'STOP: payment/enrollment currency mismatches exist; reconcile before changing legacy views';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.payments
    WHERE currency IS NULL OR currency NOT IN ('EGP', 'USD')
  ) OR EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE agreed_currency IS NULL OR agreed_currency NOT IN ('EGP', 'USD')
  ) THEN
    RAISE EXCEPTION 'STOP: unsupported currency values exist';
  END IF;

  -- Do not change a view while any v2 RPC source references it. The supplied
  -- audit found no such references. Separately reconcile the retained v1
  -- course-summary function definition/dependency discrepancy before staging
  -- sign-off; this preflight is not evidence that the v1 routine is independent.
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname IN ('public', 'private')
      AND p.prokind = 'f'
      AND left(p.proname, 5) = 'rbac_'
      AND position('v2' IN p.proname) > 0
      AND (
        p.prosrc ILIKE '%dashboard_metrics%'
        OR p.prosrc ILIKE '%course_financial_summary%'
        OR p.prosrc ILIKE '%cash_box_balances%'
        OR p.prosrc ILIKE '%enrollment_balances%'
      )
  ) THEN
    RAISE EXCEPTION 'STOP: a v2 RBAC function references one of the legacy financial views';
  END IF;
END;
$preflight$;

-- 1) Enrollment balances: include only EGP enrollments and EGP payments.
CREATE OR REPLACE VIEW public.enrollment_balances AS
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
    WHEN (e.agreed_cost - COALESCE(p_totals.total_paid, 0::numeric)) = 0::numeric
      AND COALESCE(p_totals.total_paid, 0::numeric) > 0::numeric THEN 'Paid'::text
    WHEN (e.agreed_cost - COALESCE(p_totals.total_paid, 0::numeric)) < 0::numeric THEN 'Overpaid'::text
    WHEN COALESCE(p_totals.total_paid, 0::numeric) = 0::numeric THEN 'Unpaid'::text
    ELSE 'Partial'::text
  END AS payment_status
FROM public.enrollments e
JOIN public.students s ON s.student_id = e.student_id
JOIN public.courses c ON c.course_id = e.course_id
LEFT JOIN (
  SELECT p.enrollment_id, SUM(p.amount) AS total_paid
  FROM public.payments p
  JOIN public.enrollments pe ON pe.enrollment_id = p.enrollment_id
  WHERE p.voided_at IS NULL
    AND p.currency = 'EGP'
    AND pe.agreed_currency = 'EGP'
  GROUP BY p.enrollment_id
) p_totals ON p_totals.enrollment_id = e.enrollment_id
WHERE e.agreed_currency = 'EGP';

ALTER VIEW public.enrollment_balances SET (security_invoker = true);
COMMENT ON VIEW public.enrollment_balances IS
  'Legacy EGP-only enrollment balances. USD enrollment balances are served by the currency-aware RBAC v2 endpoints.';

-- 2) Cash-box balances: EGP opening balance, EGP payments, and the EGP-only
-- expenses/transfers represented by the current schema and v2 cash-box RPC.
CREATE OR REPLACE VIEW public.cash_box_balances AS
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
FROM public.cash_boxes cb
LEFT JOIN (
  SELECT p.cash_box_id, SUM(p.amount) AS total
  FROM public.payments p
  WHERE p.voided_at IS NULL AND p.currency = 'EGP'
  GROUP BY p.cash_box_id
) pay_in ON pay_in.cash_box_id = cb.cash_box_id
LEFT JOIN (
  SELECT e.cash_box_id, SUM(e.amount) AS total
  FROM public.expenses e
  WHERE e.voided_at IS NULL
  GROUP BY e.cash_box_id
) exp_out ON exp_out.cash_box_id = cb.cash_box_id
LEFT JOIN (
  SELECT t.to_box_id AS cash_box_id, SUM(t.amount) AS total
  FROM public.cash_box_transfers t
  GROUP BY t.to_box_id
) tr_in ON tr_in.cash_box_id = cb.cash_box_id
LEFT JOIN (
  SELECT t.from_box_id AS cash_box_id, SUM(t.amount) AS total
  FROM public.cash_box_transfers t
  GROUP BY t.from_box_id
) tr_out ON tr_out.cash_box_id = cb.cash_box_id;

ALTER VIEW public.cash_box_balances SET (security_invoker = true);
COMMENT ON VIEW public.cash_box_balances IS
  'Legacy EGP-only cash-box balances. USD balances are served by the currency-aware RBAC v2 endpoint.';

-- 3) Course summary: money is EGP-only. Enrollment/capacity counts continue to
-- count enrollments in all currencies because capacity is operational, not FX.
CREATE OR REPLACE VIEW public.course_financial_summary AS
SELECT
  c.course_id,
  c.course_name,
  c.availability_status,
  c.max_students,
  c.default_cost,
  COUNT(e.enrollment_id) FILTER (WHERE e.status::text = 'Active'::text) AS active_enrollments,
  CASE
    WHEN c.max_students IS NULL THEN NULL::bigint
    ELSE c.max_students - COUNT(e.enrollment_id) FILTER (WHERE e.status::text = 'Active'::text)
  END AS vacant_places,
  COUNT(e.enrollment_id) AS total_enrollments,
  COALESCE(
    SUM(e.agreed_cost) FILTER (
      WHERE e.status::text <> 'Dropped'::text
        AND e.agreed_currency = 'EGP'
    ),
    0::numeric
  ) AS expected_revenue,
  COALESCE(SUM(p_totals.paid), 0::numeric) AS collected_payments,
  COALESCE(exp.total_expenses, 0::numeric) AS total_expenses,
  COALESCE(SUM(p_totals.paid), 0::numeric)
    - COALESCE(exp.total_expenses, 0::numeric) AS net_profit
FROM public.courses c
LEFT JOIN public.enrollments e ON e.course_id = c.course_id
LEFT JOIN (
  SELECT p.enrollment_id, SUM(p.amount) AS paid
  FROM public.payments p
  JOIN public.enrollments pe ON pe.enrollment_id = p.enrollment_id
  WHERE p.voided_at IS NULL
    AND p.currency = 'EGP'
    AND pe.agreed_currency = 'EGP'
  GROUP BY p.enrollment_id
) p_totals ON p_totals.enrollment_id = e.enrollment_id
LEFT JOIN (
  SELECT ex.course_id, SUM(ex.amount) AS total_expenses
  FROM public.expenses ex
  WHERE ex.course_id IS NOT NULL AND ex.voided_at IS NULL
  GROUP BY ex.course_id
) exp ON exp.course_id = c.course_id
GROUP BY
  c.course_id, c.course_name, c.availability_status,
  c.max_students, c.default_cost, exp.total_expenses;

ALTER VIEW public.course_financial_summary SET (security_invoker = true);
COMMENT ON VIEW public.course_financial_summary IS
  'Legacy course summary: monetary totals are EGP-only; enrollment/capacity counts include all currencies.';

-- 4) Dashboard: all monetary fields are EGP-only; operational counts remain
-- cross-currency. total_pending_balance is sourced from EGP-only enrollment_balances.
CREATE OR REPLACE VIEW public.dashboard_metrics AS
SELECT
  (SELECT COUNT(*) FROM public.students) AS total_students,
  (SELECT COUNT(*) FROM public.students
   WHERE created_at >= date_trunc('month'::text, now())) AS new_students_this_month,
  (SELECT COUNT(*) FROM public.courses
   WHERE availability_status::text = 'Active'::text) AS active_courses,
  (SELECT COUNT(*) FROM public.enrollments
   WHERE status::text = 'Active'::text) AS active_enrollments,
  (SELECT COALESCE(SUM(p.amount), 0::numeric)
   FROM public.payments p
   WHERE p.voided_at IS NULL AND p.currency = 'EGP'
     AND p.payment_date >= date_trunc('month'::text, now())) AS revenue_this_month,
  (SELECT COALESCE(SUM(e.amount), 0::numeric)
   FROM public.expenses e
   WHERE e.voided_at IS NULL
     AND e.expense_date >= date_trunc('month'::text, now())) AS expenses_this_month,
  (SELECT COALESCE(SUM(p.amount), 0::numeric)
   FROM public.payments p
   WHERE p.voided_at IS NULL AND p.currency = 'EGP'
     AND p.payment_date >= date_trunc('month'::text, now()))
  -
  (SELECT COALESCE(SUM(e.amount), 0::numeric)
   FROM public.expenses e
   WHERE e.voided_at IS NULL
     AND e.expense_date >= date_trunc('month'::text, now())) AS net_profit_this_month,
  (SELECT COALESCE(SUM(p.amount), 0::numeric)
   FROM public.payments p
   WHERE p.voided_at IS NULL AND p.currency = 'EGP') AS total_revenue_all_time,
  (SELECT COALESCE(SUM(e.amount), 0::numeric)
   FROM public.expenses e
   WHERE e.voided_at IS NULL) AS total_expenses_all_time,
  (SELECT COALESCE(SUM(p.amount), 0::numeric)
   FROM public.payments p
   WHERE p.voided_at IS NULL AND p.currency = 'EGP')
  -
  (SELECT COALESCE(SUM(e.amount), 0::numeric)
   FROM public.expenses e
   WHERE e.voided_at IS NULL) AS net_profit_all_time,
  (SELECT COALESCE(SUM(eb.remaining_balance), 0::numeric)
   FROM public.enrollment_balances eb
   WHERE eb.enrollment_status::text = 'Active'::text
     AND eb.remaining_balance > 0::numeric) AS total_pending_balance;

ALTER VIEW public.dashboard_metrics SET (security_invoker = true);
COMMENT ON VIEW public.dashboard_metrics IS
  'Legacy dashboard: monetary metrics and pending balances are EGP-only; operational counts include all currencies.';

COMMIT;
