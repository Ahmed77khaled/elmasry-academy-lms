-- RBAC authorization cutover draft.
--
-- This is intentionally a separate, fail-closed migration after the additive
-- RBAC catalog, read endpoints, and write endpoints. It revokes legacy direct
-- table/view access and legacy unscoped RPC execution from client roles.
--
-- NOT APPLIED and NOT PostgreSQL-validated. Review and verify against a safe
-- staging project before applying anywhere. No row data is changed by this file.

BEGIN;

DO $preflight$
DECLARE
  v_function text;
  v_oid oid;
  v_required_functions text[] := ARRAY[
    'private.has_permission(text)',
    'private.is_platform_owner()',
    'public.get_my_authorization()',
    'public.claim_platform_owner()',
    'public.can_claim_platform_owner()',
    'public.rbac_list_students(text,integer,integer,uuid)',
    'public.rbac_list_courses(integer,integer,uuid)',
    'public.rbac_list_enrollments(text,integer,integer,uuid,uuid)',
    'public.rbac_list_cash_boxes()',
    'public.rbac_list_payments(integer,integer)',
    'public.rbac_search_payments(text,integer)',
    'public.rbac_list_expenses(integer,integer)',
    'public.rbac_list_transfers(integer,integer)',
    'public.rbac_operational_dashboard_metrics()',
    'public.rbac_finance_dashboard_metrics()',
    'public.rbac_course_financial_summary(uuid)',
    'public.rbac_create_student(text,text,text,text,text,text,text,text)',
    'public.rbac_update_student(uuid,text,text,text,text,text,text,text,text)',
    'public.rbac_create_course(text,text,text,integer,text,date,date,integer,numeric,text,text,text,text,text)',
    'public.rbac_update_course(uuid,text,text,text,integer,text,date,date,integer,numeric,text,text,text,text,text)',
    'public.rbac_close_course(uuid)',
    'public.rbac_enroll_student(uuid,uuid,numeric,text)',
    'public.rbac_set_enrollment_status(uuid,text)',
    'public.rbac_record_payment(uuid,uuid,numeric,date,text,text,text)',
    'public.rbac_record_expense(uuid,numeric,date,text,text,text,uuid)',
    'public.rbac_transfer_between_boxes(uuid,uuid,numeric,date,text)',
    'public.rbac_create_cash_box(character varying,character varying,character varying,numeric,text)',
    'public.rbac_archive_cash_box(uuid)',
    'public.rbac_void_payment(uuid,text)',
    'public.rbac_void_expense(uuid,text)',
    'public.rbac_list_assignable_roles()',
    'public.rbac_list_admins()',
    'public.rbac_list_roles()',
    'public.rbac_list_delegable_permissions()',
    'public.rbac_list_audit_events(integer)',
    'public.rbac_set_admin_role(uuid,text)',
    'public.rbac_set_admin_active(uuid,boolean)',
    'public.rbac_set_admin_owner(uuid,boolean)',
    'public.rbac_create_custom_role(text,text,text[])',
    'public.rbac_update_custom_role_permissions(text,text[])',
    'public.rbac_delete_custom_role(text)'
  ];
BEGIN
  IF to_regclass('public.admins') IS NULL
     OR to_regclass('public.students') IS NULL
     OR to_regclass('public.courses') IS NULL
     OR to_regclass('public.enrollments') IS NULL
     OR to_regclass('public.payments') IS NULL
     OR to_regclass('public.expenses') IS NULL
     OR to_regclass('public.cash_boxes') IS NULL
     OR to_regclass('public.cash_box_transfers') IS NULL
     OR to_regclass('public.payment_receipt_number_seq') IS NULL THEN
    RAISE EXCEPTION 'RBAC cutover preflight failed: one or more protected tables are missing.';
  END IF;

  IF to_regclass('public.enrollment_balances') IS NULL
     OR to_regclass('public.cash_box_balances') IS NULL
     OR to_regclass('public.course_financial_summary') IS NULL
     OR to_regclass('public.dashboard_metrics') IS NULL THEN
    RAISE EXCEPTION 'RBAC cutover preflight failed: expected legacy views are missing; reconcile the view inventory before cutover.';
  END IF;

  IF (SELECT count(*) FROM public.admins WHERE is_active IS TRUE AND is_owner IS TRUE) < 1 THEN
    RAISE EXCEPTION 'RBAC cutover requires at least one active platform owner to be claimed first.';
  END IF;

  FOREACH v_function IN ARRAY v_required_functions LOOP
    v_oid := to_regprocedure(v_function);
    IF v_oid IS NULL THEN
      RAISE EXCEPTION 'RBAC cutover preflight failed: required endpoint % is missing.', v_function;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc AS p
      JOIN pg_roles AS r ON r.oid = p.proowner
      WHERE p.oid = v_oid
        AND p.prosecdef IS TRUE
        AND (r.rolsuper IS TRUE OR r.rolbypassrls IS TRUE)
    ) THEN
      RAISE EXCEPTION 'RBAC cutover preflight failed: endpoint % is not SECURITY DEFINER owned by a BYPASSRLS/superuser role.', v_function;
    END IF;
  END LOOP;
END
$preflight$;

-- Remove direct PostgREST access. All application access must use the
-- permission-checked SECURITY DEFINER endpoints listed in the preflight.
REVOKE ALL PRIVILEGES ON TABLE
  public.admins,
  public.students,
  public.courses,
  public.enrollments,
  public.payments,
  public.expenses,
  public.cash_boxes,
  public.cash_box_transfers
FROM PUBLIC, anon, authenticated;

-- Migration 008 grants column-level cash-box metadata UPDATE separately from
-- table-level privileges; remove that residual grant explicitly as well.
REVOKE UPDATE (name, type, owner, is_active, notes)
  ON TABLE public.cash_boxes FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES ON TABLE
  public.enrollment_balances,
  public.cash_box_balances,
  public.course_financial_summary,
  public.dashboard_metrics
FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES ON SEQUENCE public.payment_receipt_number_seq
  FROM PUBLIC, anon, authenticated;

-- Revoke every legacy overload (including historical signatures) while
-- retaining is_admin() for the existing sign-in gate and auth callbacks.
DO $legacy_rpc_revoke$
DECLARE
  v_function record;
BEGIN
  FOR v_function IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'enroll_student',
        'record_payment',
        'record_expense',
        'transfer_between_boxes',
        'void_payment',
        'void_expense',
        'set_enrollment_status',
        'create_cash_box'
      ])
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_function.signature);
  END LOOP;
END
$legacy_rpc_revoke$;

-- Preserve the authenticated compatibility check used only to confirm that
-- the current session belongs to an administrator; permission checks are
-- performed by the RBAC endpoints after this cutover.
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_authorization() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_platform_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_claim_platform_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_set_admin_owner(uuid, boolean) TO authenticated;

COMMIT;
