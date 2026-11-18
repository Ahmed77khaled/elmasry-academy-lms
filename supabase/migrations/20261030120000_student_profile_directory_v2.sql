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
      OR (private.has_permission('students.read_contact_phone') AND (
            s.phone ILIKE '%' || left(btrim(p_search), 100) || '%'
            OR (length(regexp_replace(left(btrim(p_search), 100), '[^\d]', '', 'g')) >= 3 
                AND regexp_replace(s.phone, '[^\d]', '', 'g') ILIKE '%' || regexp_replace(left(btrim(p_search), 100), '[^\d]', '', 'g') || '%')
         )))
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
