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
