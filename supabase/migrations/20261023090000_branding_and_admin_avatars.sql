-- Add owner-managed public academy branding and private per-admin avatars.
-- Draft only: review and apply to the intended Supabase project separately.

BEGIN;

CREATE TABLE IF NOT EXISTS public.academy_branding (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton IS TRUE),
  logo_path text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.academy_branding (singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE public.academy_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_branding FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.academy_branding FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.admins
      WHERE auth_user_id = auth.uid() AND is_active IS TRUE
    );
$function$;

REVOKE ALL ON FUNCTION private.is_active_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_active_admin() TO authenticated;

-- The logo is public, but only active platform owners may replace it.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academy-branding', 'academy-branding', true, 2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Personal avatars stay in a private bucket and are readable only by their owner.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-avatars', 'admin-avatars', false, 2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS academy_branding_public_read ON storage.objects;
CREATE POLICY academy_branding_public_read
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'academy-branding');

DROP POLICY IF EXISTS academy_branding_owner_insert ON storage.objects;
CREATE POLICY academy_branding_owner_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'academy-branding'
    AND (storage.foldername(name))[1] = 'branding'
    AND private.is_platform_owner()
  );

DROP POLICY IF EXISTS academy_branding_owner_update ON storage.objects;
CREATE POLICY academy_branding_owner_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'academy-branding'
    AND (storage.foldername(name))[1] = 'branding'
    AND private.is_platform_owner()
  )
  WITH CHECK (
    bucket_id = 'academy-branding'
    AND (storage.foldername(name))[1] = 'branding'
    AND private.is_platform_owner()
  );

DROP POLICY IF EXISTS academy_branding_owner_delete ON storage.objects;
CREATE POLICY academy_branding_owner_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'academy-branding'
    AND (storage.foldername(name))[1] = 'branding'
    AND private.is_platform_owner()
  );

DROP POLICY IF EXISTS admin_avatars_owner_read ON storage.objects;
CREATE POLICY admin_avatars_owner_read
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'admin-avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND private.is_active_admin()
  );

DROP POLICY IF EXISTS admin_avatars_owner_insert ON storage.objects;
CREATE POLICY admin_avatars_owner_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'admin-avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND private.is_active_admin()
  );

DROP POLICY IF EXISTS admin_avatars_owner_update ON storage.objects;
CREATE POLICY admin_avatars_owner_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'admin-avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND private.is_active_admin()
  )
  WITH CHECK (
    bucket_id = 'admin-avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND private.is_active_admin()
  );

DROP POLICY IF EXISTS admin_avatars_owner_delete ON storage.objects;
CREATE POLICY admin_avatars_owner_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'admin-avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND private.is_active_admin()
  );

CREATE OR REPLACE FUNCTION public.get_academy_logo()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT logo_path FROM public.academy_branding WHERE singleton IS TRUE;
$function$;

CREATE OR REPLACE FUNCTION public.set_academy_logo(p_logo_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, auth, storage
AS $function$
DECLARE
  v_previous_path text;
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only a platform owner may change the academy logo.'
      USING ERRCODE = '42501';
  END IF;

  IF p_logo_path IS NOT NULL AND p_logo_path !~ '^branding/[0-9a-fA-F-]{36}\.(png|jpg|jpeg|webp)$' THEN
    RAISE EXCEPTION 'The logo path is invalid.' USING ERRCODE = '22023';
  END IF;

  IF p_logo_path IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'academy-branding' AND name = p_logo_path
  ) THEN
    RAISE EXCEPTION 'The uploaded logo was not found.' USING ERRCODE = '22023';
  END IF;

  SELECT logo_path INTO v_previous_path
  FROM public.academy_branding
  WHERE singleton IS TRUE
  FOR UPDATE;

  UPDATE public.academy_branding
  SET logo_path = p_logo_path,
      updated_by = auth.uid(),
      updated_at = now()
  WHERE singleton IS TRUE;

  INSERT INTO public.admin_audit_log (
    actor_auth_user_id, action, before_state, after_state
  ) VALUES (
    auth.uid(), 'branding_logo_changed',
    jsonb_build_object('logo_path', v_previous_path),
    jsonb_build_object('logo_path', p_logo_path)
  );

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_academy_logo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_academy_logo() TO anon, authenticated;
REVOKE ALL ON FUNCTION public.set_academy_logo(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_academy_logo(text) TO authenticated;

ALTER TABLE public.admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_action_check;

ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT admin_audit_log_action_check CHECK (action IN (
    'owner_claimed', 'owner_transferred', 'owner_added', 'owner_removed',
    'admin_invited', 'admin_role_changed', 'admin_disabled', 'admin_enabled',
    'role_created', 'role_updated', 'role_deleted', 'role_permissions_changed',
    'branding_logo_changed'
  ));

COMMIT;
