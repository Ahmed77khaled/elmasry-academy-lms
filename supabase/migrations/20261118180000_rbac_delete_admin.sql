-- Migration: rbac_delete_admin
-- Description: Allows active platform owners to delete administrator accounts securely with audit logging, session termination, self-deletion prevention, and last-owner protection.

-- 1. Update check constraint on admin_audit_log to allow 'admin_deleted'
ALTER TABLE public.admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_action_check;

ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT admin_audit_log_action_check CHECK (action IN (
    'owner_claimed', 'owner_transferred', 'owner_added', 'owner_removed',
    'admin_invited', 'admin_role_changed', 'admin_disabled', 'admin_enabled',
    'role_created', 'role_updated', 'role_deleted', 'role_permissions_changed',
    'branding_logo_changed', 'telegram_notification_language_changed',
    'admin_deleted'
  ));

-- 2. Update route_admin_audit_notification trigger function to handle admin_deleted
CREATE OR REPLACE FUNCTION private.route_admin_audit_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  v_event_type text;
  v_event_id uuid;
BEGIN
  v_event_type := CASE NEW.action
    WHEN 'admin_invited' THEN 'admin.invited'
    WHEN 'admin_enabled' THEN 'admin.enabled'
    WHEN 'admin_disabled' THEN 'admin.disabled'
    WHEN 'admin_deleted' THEN 'admin.disabled'
    WHEN 'admin_role_changed' THEN 'admin.role_changed'
    WHEN 'owner_claimed' THEN 'admin.owner_changed'
    WHEN 'owner_transferred' THEN 'admin.owner_changed'
    WHEN 'owner_added' THEN 'admin.owner_changed'
    WHEN 'owner_removed' THEN 'admin.owner_changed'
    WHEN 'role_created' THEN 'admin.role_catalog_changed'
    WHEN 'role_updated' THEN 'admin.role_catalog_changed'
    WHEN 'role_deleted' THEN 'admin.role_catalog_changed'
    WHEN 'role_permissions_changed' THEN 'admin.permissions_changed'
    WHEN 'branding_logo_changed' THEN 'branding.logo_changed'
    ELSE NULL
  END;

  IF v_event_type IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.platform_audit_events (
    event_type, outcome, source, actor_auth_user_id, target_auth_user_id,
    subject_type, subject_id, occurred_at
  ) VALUES (
    v_event_type, 'success', 'admin_audit_trigger', NEW.actor_auth_user_id,
    NEW.target_auth_user_id,
    CASE WHEN NEW.target_auth_user_id IS NULL THEN NULL ELSE 'admin' END,
    NEW.target_auth_user_id, COALESCE(NEW.created_at, clock_timestamp())
  ) RETURNING event_id INTO v_event_id;

  INSERT INTO public.telegram_notification_outbox (event_id)
  VALUES (v_event_id);
  RETURN NEW;
END;
$function$;

-- 3. Create rbac_delete_admin RPC
CREATE OR REPLACE FUNCTION public.rbac_delete_admin(
  p_admin_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE
  v_target public.admins%ROWTYPE;
BEGIN
  -- Strict Platform Owner Check
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only a platform owner may delete administrators.'
      USING ERRCODE = '42501';
  END IF;

  IF p_admin_id IS NULL THEN
    RAISE EXCEPTION 'Administrator ID is required.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('elmasry_platform_owner_management', 0));

  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_user_id = auth.uid() AND is_owner IS TRUE AND is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Only an active platform owner may delete administrators.'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_target
  FROM public.admins
  WHERE admin_id = p_admin_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Administrator not found.';
  END IF;

  -- Cannot delete yourself
  IF v_target.auth_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own administrator account.'
      USING ERRCODE = '42501';
  END IF;

  -- At least one other active platform owner must remain
  IF v_target.is_owner IS TRUE
     AND NOT EXISTS (
       SELECT 1 FROM public.admins
       WHERE is_owner IS TRUE AND is_active IS TRUE
         AND admin_id <> v_target.admin_id
     ) THEN
    RAISE EXCEPTION 'At least one other active platform owner must remain.'
      USING ERRCODE = '42501';
  END IF;

  -- 1. Remove from public.admins
  DELETE FROM public.admins
  WHERE admin_id = v_target.admin_id;

  -- 2. Terminate active sessions
  DELETE FROM auth.sessions
  WHERE user_id = v_target.auth_user_id;

  -- 3. Attempt to delete auth user, or securely deactivate if financial history exists
  BEGIN
    DELETE FROM auth.users
    WHERE id = v_target.auth_user_id;
  EXCEPTION
    WHEN foreign_key_violation THEN
      UPDATE auth.users
      SET banned_until = '2999-01-01 00:00:00+00',
          encrypted_password = '',
          raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"deleted": true, "deleted_at": "now()"}'::jsonb
      WHERE id = v_target.auth_user_id;
  END;

  -- 4. Audit log entry
  INSERT INTO public.admin_audit_log (
    actor_auth_user_id, target_auth_user_id, action, before_state, after_state
  ) VALUES (
    auth.uid(), v_target.auth_user_id, 'admin_deleted',
    jsonb_build_object('admin_id', v_target.admin_id, 'role', v_target.role, 'is_owner', v_target.is_owner, 'is_active', v_target.is_active),
    jsonb_build_object('deleted', true)
  );

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.rbac_delete_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rbac_delete_admin(uuid) TO authenticated;

COMMENT ON FUNCTION public.rbac_delete_admin(uuid) IS
  'Securely deletes an administrator. Callable only by an active platform owner. Prevents self-deletion and ensures at least one platform owner remains.';
