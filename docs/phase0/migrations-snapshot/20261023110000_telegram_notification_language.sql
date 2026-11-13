-- Store the language for the shared administrator Telegram group.
-- Only active platform owners can read or change the preference through RPCs.

BEGIN;

CREATE TABLE public.platform_notification_settings (
  singleton_id smallint PRIMARY KEY DEFAULT 1 CHECK (singleton_id = 1),
  group_language text NOT NULL DEFAULT 'ar'
    CHECK (group_language IN ('ar', 'en')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.platform_notification_settings (singleton_id, group_language)
VALUES (1, 'ar')
ON CONFLICT (singleton_id) DO NOTHING;

ALTER TABLE public.platform_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_notification_settings FORCE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.platform_notification_settings
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.platform_notification_settings TO service_role;

CREATE OR REPLACE FUNCTION public.rbac_get_telegram_group_language()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE
  v_language text;
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only an active platform owner may read Telegram notification settings.'
      USING ERRCODE = '42501';
  END IF;

  SELECT group_language INTO v_language
  FROM public.platform_notification_settings
  WHERE singleton_id = 1;

  RETURN COALESCE(v_language, 'ar');
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_set_telegram_group_language(p_language text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth
AS $function$
DECLARE
  v_previous_language text;
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only an active platform owner may change Telegram notification settings.'
      USING ERRCODE = '42501';
  END IF;
  IF p_language IS NULL OR p_language NOT IN ('ar', 'en') THEN
    RAISE EXCEPTION 'Telegram notification language must be ar or en.'
      USING ERRCODE = '22023';
  END IF;

  SELECT group_language INTO v_previous_language
  FROM public.platform_notification_settings
  WHERE singleton_id = 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Telegram notification settings are not initialized.';
  END IF;

  IF v_previous_language IS DISTINCT FROM p_language THEN
    UPDATE public.platform_notification_settings
    SET group_language = p_language,
        updated_at = now(),
        updated_by = auth.uid()
    WHERE singleton_id = 1;

    INSERT INTO public.admin_audit_log (
      actor_auth_user_id,
      action,
      before_state,
      after_state
    ) VALUES (
      auth.uid(),
      'telegram_notification_language_changed',
      jsonb_build_object('group_language', v_previous_language),
      jsonb_build_object('group_language', p_language)
    );
  END IF;

  RETURN p_language;
END;
$function$;

ALTER TABLE public.admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_action_check;

ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT admin_audit_log_action_check CHECK (action IN (
    'owner_claimed', 'owner_transferred', 'owner_added', 'owner_removed',
    'admin_invited', 'admin_role_changed', 'admin_disabled', 'admin_enabled',
    'role_created', 'role_updated', 'role_deleted', 'role_permissions_changed',
    'branding_logo_changed', 'telegram_notification_language_changed'
  ));

REVOKE ALL ON FUNCTION public.rbac_get_telegram_group_language() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rbac_get_telegram_group_language() TO authenticated;
REVOKE ALL ON FUNCTION public.rbac_set_telegram_group_language(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rbac_set_telegram_group_language(text) TO authenticated;

COMMENT ON TABLE public.platform_notification_settings IS
  'Owner-controlled settings for shared platform notifications; group language defaults to Arabic.';

COMMIT;
