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
  SELECT c.course_id, c.course_name::text, c.description, c.level::text,
    c.duration_weeks, c.prerequisite_courses, c.start_date, c.end_date,
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
