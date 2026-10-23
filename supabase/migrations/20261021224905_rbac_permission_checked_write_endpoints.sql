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
