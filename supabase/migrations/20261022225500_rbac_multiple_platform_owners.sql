-- Allow more than one trusted platform owner while protecting the last
-- active owner. This is an additive follow-up to the already-applied RBAC
-- foundation/endpoints and must run before the authorization cutover.
-- It does not change admin assignments or apply the cutover.

BEGIN;

DROP INDEX IF EXISTS public.admins_single_platform_owner_idx;

ALTER TABLE public.admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_action_check;

ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT admin_audit_log_action_check CHECK (action IN (
    'owner_claimed', 'owner_transferred', 'owner_added', 'owner_removed',
    'admin_invited', 'admin_role_changed', 'admin_disabled', 'admin_enabled',
    'role_created', 'role_updated', 'role_deleted', 'role_permissions_changed'
  ));

CREATE OR REPLACE FUNCTION public.can_claim_platform_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT auth.uid() IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.admins WHERE is_owner IS TRUE)
    AND (SELECT count(*) FROM public.admins
         WHERE role = 'superadmin' AND is_active IS TRUE) = 1
    AND EXISTS (
      SELECT 1 FROM public.admins
      WHERE auth_user_id = auth.uid()
        AND role = 'superadmin'
        AND is_active IS TRUE
    );
$function$;

CREATE OR REPLACE FUNCTION public.rbac_set_admin_owner(
  p_admin_id uuid,
  p_is_owner boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE
  v_target public.admins%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_user_id = auth.uid() AND is_owner IS TRUE AND is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Only a platform owner may change platform-owner membership.'
      USING ERRCODE = '42501';
  END IF;
  IF p_admin_id IS NULL OR p_is_owner IS NULL THEN
    RAISE EXCEPTION 'Administrator and owner status are required.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('elmasry_platform_owner_management', 0));
  -- Re-check after serialization so two owners cannot concurrently remove
  -- each other using stale authorization decisions.
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_user_id = auth.uid() AND is_owner IS TRUE AND is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Only an active platform owner may change platform-owner membership.'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_target
  FROM public.admins
  WHERE admin_id = p_admin_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Administrator not found.';
  END IF;
  IF v_target.auth_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Owners cannot change their own owner status; ask another active owner.'
      USING ERRCODE = '42501';
  END IF;
  IF v_target.is_owner IS NOT DISTINCT FROM p_is_owner THEN
    RETURN true;
  END IF;
  IF p_is_owner IS TRUE AND (v_target.is_active IS NOT TRUE OR v_target.auth_user_id IS NULL) THEN
    RAISE EXCEPTION 'Only an active administrator linked to an Auth user can become a platform owner.'
      USING ERRCODE = '42501';
  END IF;
  IF p_is_owner IS FALSE AND v_target.is_owner IS TRUE
     AND NOT EXISTS (
       SELECT 1 FROM public.admins
       WHERE is_owner IS TRUE AND is_active IS TRUE
         AND admin_id <> v_target.admin_id
     ) THEN
    RAISE EXCEPTION 'At least one other active platform owner must remain.'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.admins
  SET is_owner = p_is_owner
  WHERE admin_id = v_target.admin_id;

  INSERT INTO public.admin_audit_log (
    actor_auth_user_id, target_auth_user_id, action, before_state, after_state
  ) VALUES (
    auth.uid(), v_target.auth_user_id,
    CASE WHEN p_is_owner THEN 'owner_added' ELSE 'owner_removed' END,
    jsonb_build_object('is_owner', v_target.is_owner, 'role', v_target.role),
    jsonb_build_object('is_owner', p_is_owner, 'role', v_target.role)
  );
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_set_admin_active(
  p_admin_id uuid,
  p_is_active boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE
  v_target public.admins%ROWTYPE;
  v_action text;
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only a platform owner may enable or disable administrators.'
      USING ERRCODE = '42501';
  END IF;
  IF p_admin_id IS NULL OR p_is_active IS NULL THEN
    RAISE EXCEPTION 'Administrator and active status are required.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('elmasry_platform_owner_management', 0));
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_user_id = auth.uid() AND is_owner IS TRUE AND is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Only an active platform owner may enable or disable administrators.'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_target
  FROM public.admins
  WHERE admin_id = p_admin_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Administrator not found.';
  END IF;
  IF v_target.auth_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot disable your own administrator account.'
      USING ERRCODE = '42501';
  END IF;
  IF v_target.is_active IS NOT DISTINCT FROM p_is_active THEN
    RETURN true;
  END IF;
  IF p_is_active IS FALSE AND v_target.is_owner IS TRUE
     AND NOT EXISTS (
       SELECT 1 FROM public.admins
       WHERE is_owner IS TRUE AND is_active IS TRUE
         AND admin_id <> v_target.admin_id
     ) THEN
    RAISE EXCEPTION 'At least one other active platform owner must remain.'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.admins
  SET is_active = p_is_active
  WHERE admin_id = v_target.admin_id;

  v_action := CASE WHEN p_is_active THEN 'admin_enabled' ELSE 'admin_disabled' END;
  INSERT INTO public.admin_audit_log (
    actor_auth_user_id, target_auth_user_id, action, before_state, after_state
  ) VALUES (
    auth.uid(), v_target.auth_user_id, v_action,
    jsonb_build_object('is_active', v_target.is_active, 'is_owner', v_target.is_owner),
    jsonb_build_object('is_active', p_is_active, 'is_owner', v_target.is_owner)
  );
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.can_claim_platform_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_claim_platform_owner() TO authenticated;
REVOKE ALL ON FUNCTION public.rbac_set_admin_owner(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rbac_set_admin_owner(uuid, boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.rbac_set_admin_active(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rbac_set_admin_active(uuid, boolean) TO authenticated;

COMMIT;
