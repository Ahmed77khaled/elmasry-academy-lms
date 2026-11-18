-- Student/enrollment scoped payment history.
-- The v2 endpoint previously returned the most recent 500 payments only, which
-- forced the UI to filter client-side and could silently hide a student's older
-- payments. Add optional server-side filters while keeping the same RBAC gate.
-- Local authoring only: do not apply remotely without explicit owner approval.

DO $preflight$
BEGIN
  IF to_regprocedure('public.rbac_list_payments_v2(integer,integer)') IS NULL
     AND to_regprocedure('public.rbac_list_payments_v2(integer,integer,uuid,uuid)') IS NULL THEN
    RAISE EXCEPTION 'Payment history migration preflight failed.';
  END IF;
END
$preflight$;

DROP FUNCTION IF EXISTS public.rbac_list_payments_v2(integer, integer);

CREATE OR REPLACE FUNCTION public.rbac_list_payments_v2(
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0,
  p_student_id uuid DEFAULT NULL,
  p_enrollment_id uuid DEFAULT NULL
)
RETURNS TABLE (
  payment_id uuid, receipt_number bigint, enrollment_id uuid, student_id uuid,
  student_name text, student_phone text, course_id uuid, course_name text,
  cash_box_id uuid, cash_box_name text, amount numeric, currency text,
  payment_date date, method text, receipt_ref text, notes text,
  voided_at timestamptz, voided_by uuid, void_reason text, added_by uuid, created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
BEGIN
  IF NOT private.has_permission('finance.payments.read') THEN
    RAISE EXCEPTION 'Permission denied: finance.payments.read is required.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT p.payment_id,p.receipt_number,e.enrollment_id,s.student_id,s.name::text,
    CASE WHEN private.has_permission('students.read_contact_phone') THEN s.phone::text END,
    c.course_id,c.course_name::text,cb.cash_box_id,cb.name::text,p.amount,p.currency,
    p.payment_date,p.method::text,p.receipt_ref::text,p.notes,p.voided_at,p.voided_by,
    p.void_reason,p.added_by,p.created_at
  FROM public.payments p JOIN public.enrollments e USING(enrollment_id)
  JOIN public.students s USING(student_id) JOIN public.courses c USING(course_id)
  JOIN public.cash_boxes cb USING(cash_box_id)
  WHERE (p_student_id IS NULL OR s.student_id = p_student_id)
    AND (p_enrollment_id IS NULL OR e.enrollment_id = p_enrollment_id)
  ORDER BY p.payment_date DESC,p.created_at DESC,p.payment_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit,200),1),500) OFFSET GREATEST(COALESCE(p_offset,0),0);
END;
$function$;

REVOKE ALL ON FUNCTION public.rbac_list_payments_v2(integer, integer, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rbac_list_payments_v2(integer, integer, uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.rbac_list_payments_v2(integer, integer, uuid, uuid) IS
  'Permission-checked payment history, optionally scoped to one student or enrollment.';

NOTIFY pgrst, 'reload schema';
