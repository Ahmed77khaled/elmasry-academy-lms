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
ALTER FUNCTION public.enroll_student(uuid, uuid, numeric, text)
  SET search_path = pg_catalog, public;
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

CREATE FUNCTION public.void_payment(
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
