-- Phase 0 forward-only migration: make legacy public.is_admin() honor
-- public.admins.is_active. Target: TrainerPro / urmkcixqpoqkiosihhal.
--
-- This function is used by AuthContext and by legacy guarded RPCs / RLS rules.
-- The current live body checks membership only, so disabled admins still receive
-- TRUE. RBAC helpers already require is_active IS TRUE.
--
-- CREATE OR REPLACE preserves the existing function identity and owner; the
-- explicit grants below restate the audited API contract.
-- Draft for staging validation only. Do not apply directly to production.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $preflight$
DECLARE
  v_owner text;
  v_is_definer boolean;
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'STOP: expected current_user=postgres, got %', current_user;
  END IF;

  IF to_regclass('public.admins') IS NULL
     OR NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'admins'
         AND column_name = 'auth_user_id'
         AND data_type = 'uuid'
     )
     OR NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'admins'
         AND column_name = 'is_active'
         AND data_type = 'boolean'
     ) THEN
    RAISE EXCEPTION 'STOP: expected public.admins(auth_user_id uuid, is_active boolean) was not found';
  END IF;

  SELECT r.rolname, p.prosecdef
    INTO v_owner, v_is_definer
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_roles r ON r.oid = p.proowner
  WHERE n.nspname = 'public'
    AND p.proname = 'is_admin'
    AND p.pronargs = 0
    AND p.prorettype = 'boolean'::regtype;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STOP: public.is_admin() does not exist with the expected signature';
  END IF;

  IF v_owner <> 'postgres' OR v_is_definer IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'STOP: public.is_admin() owner/security mode differs from the audited baseline';
  END IF;

  IF NOT has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.is_admin()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.is_admin()', 'EXECUTE')
     OR EXISTS (
       SELECT 1
       FROM pg_proc fp
       CROSS JOIN LATERAL aclexplode(COALESCE(fp.proacl, acldefault('f', fp.proowner))) acl
       WHERE fp.oid = 'public.is_admin()'::regprocedure
         AND acl.grantee = 0
         AND acl.privilege_type = 'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'STOP: public.is_admin() EXECUTE ACL differs from the audited baseline';
  END IF;
END;
$preflight$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins AS a
    WHERE a.auth_user_id = auth.uid()
      AND a.is_active IS TRUE
  );
$function$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

COMMENT ON FUNCTION public.is_admin() IS
  'Returns true only when auth.uid() belongs to an active administrator. Legacy compatibility helper; RBAC RPCs enforce individual permissions.';

DO $postflight$
BEGIN
  IF NOT has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.is_admin()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.is_admin()', 'EXECUTE')
     OR EXISTS (
       SELECT 1
       FROM pg_proc fp
       CROSS JOIN LATERAL aclexplode(COALESCE(fp.proacl, acldefault('f', fp.proowner))) acl
       WHERE fp.oid = 'public.is_admin()'::regprocedure
         AND acl.grantee = 0
         AND acl.privilege_type = 'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FAILED: public.is_admin() EXECUTE ACL is not as expected';
  END IF;

  IF pg_get_functiondef('public.is_admin()'::regprocedure)
       NOT ILIKE '%is_active IS TRUE%' THEN
    RAISE EXCEPTION 'POSTFLIGHT FAILED: active-status predicate is missing from public.is_admin()';
  END IF;
END;
$postflight$;

COMMIT;