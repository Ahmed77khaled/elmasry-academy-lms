-- RBAC foundation only. This migration is additive and intentionally does NOT:
--   * replace public.is_admin(), existing RLS policies, view grants, or RPC guards;
--   * reduce or expand current administrator access;
--   * assign roles to existing administrators, invite users, or alter business data.
-- The authorization cutover must be a later, separately reviewed migration after
-- every client query has been updated and each role has been verified safely.

-- Preflight against the canonical live schema (not the obsolete local bootstrap):
-- admins must be the Auth-linked table with the role label used by migrations 005+.
DO $preflight$
BEGIN
  IF to_regclass('public.admins') IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'admins'
         AND column_name = 'auth_user_id' AND data_type = 'uuid'
     )
     OR NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'admins'
         AND column_name = 'role' AND data_type = 'character varying'
     ) THEN
    RAISE EXCEPTION 'RBAC foundation preflight failed: expected public.admins(auth_user_id uuid, role varchar) was not found.';
  END IF;
END
$preflight$;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS admins_single_platform_owner_idx
  ON public.admins (is_owner)
  WHERE is_owner IS TRUE;

CREATE TABLE IF NOT EXISTS public.admin_roles (
  role_key text PRIMARY KEY CHECK (role_key ~ '^[a-z][a-z0-9_]{1,49}$'),
  display_name text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  is_assignable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permission_catalog (
  permission_key text PRIMARY KEY CHECK (permission_key ~ '^[a-z][a-z0-9_.]{2,99}$'),
  description text NOT NULL,
  is_delegable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
  role_key text NOT NULL REFERENCES public.admin_roles(role_key) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES public.permission_catalog(permission_key) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_key, permission_key)
);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  audit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_auth_user_id uuid NOT NULL,
  target_auth_user_id uuid,
  action text NOT NULL CHECK (action IN (
    'owner_claimed', 'owner_transferred', 'admin_invited', 'admin_role_changed',
    'admin_disabled', 'admin_enabled', 'role_created', 'role_updated',
    'role_deleted', 'role_permissions_changed'
  )),
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx
  ON public.admin_audit_log (target_auth_user_id, created_at DESC);

CREATE OR REPLACE FUNCTION private.prevent_admin_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
BEGIN
  RAISE EXCEPTION 'Administrator audit records are append-only.' USING ERRCODE = '42501';
  RETURN OLD;
END;
$function$;

REVOKE ALL ON FUNCTION private.prevent_admin_audit_mutation() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_admin_audit_log_immutable
  BEFORE UPDATE OR DELETE ON public.admin_audit_log
  FOR EACH ROW EXECUTE FUNCTION private.prevent_admin_audit_mutation();

CREATE TRIGGER trg_admin_audit_log_no_truncate
  BEFORE TRUNCATE ON public.admin_audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION private.prevent_admin_audit_mutation();

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admin_roles, public.permission_catalog,
  public.admin_role_permissions, public.admin_audit_log
  FROM PUBLIC, anon, authenticated;

INSERT INTO public.admin_roles (role_key, display_name, is_system, is_assignable)
VALUES
  ('superadmin', 'Platform Owner', true, false),
  ('academy_manager', 'Academy Manager', true, true),
  ('finance_manager', 'Finance Manager', true, true)
ON CONFLICT (role_key) DO UPDATE
SET display_name = EXCLUDED.display_name,
    is_system = EXCLUDED.is_system,
    is_assignable = EXCLUDED.is_assignable;

DO $role_fk$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.admins AS a
    LEFT JOIN public.admin_roles AS r ON r.role_key = a.role
    WHERE r.role_key IS NULL
  ) THEN
    RAISE EXCEPTION 'RBAC foundation preflight failed: public.admins contains a role key missing from public.admin_roles; reconcile role labels before applying this migration.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.admins'::regclass
      AND conname = 'admins_role_catalog_fk'
  ) THEN
    ALTER TABLE public.admins
      ADD CONSTRAINT admins_role_catalog_fk
      FOREIGN KEY (role) REFERENCES public.admin_roles(role_key)
      ON UPDATE RESTRICT ON DELETE RESTRICT NOT VALID;
  END IF;
END
$role_fk$;

ALTER TABLE public.admins VALIDATE CONSTRAINT admins_role_catalog_fk;

INSERT INTO public.permission_catalog (permission_key, description, is_delegable)
VALUES
  ('dashboard.operational.read', 'Read operational dashboard metrics.', true),
  ('dashboard.finance.read', 'Read financial dashboard metrics.', true),
  ('students.read', 'Read permitted student identity fields.', true),
  ('students.read_contact_phone', 'Read student phone numbers for follow-up.', true),
  ('students.email.read', 'Read student email addresses.', false),
  ('students.email.update', 'Create or update student email addresses.', false),
  ('students.create', 'Create student records.', true),
  ('students.update', 'Update permitted student fields.', true),
  ('students.archive', 'Archive student records.', true),
  ('students.export', 'Export permitted student data.', true),
  ('courses.read', 'Read operational course data.', true),
  ('courses.create', 'Create courses.', true),
  ('courses.update', 'Update permitted course fields.', true),
  ('courses.close', 'Close courses.', true),
  ('courses.pricing.read', 'Read course prices.', true),
  ('courses.pricing.update', 'Create or update course prices.', true),
  ('courses.export', 'Export permitted course data.', true),
  ('enrollments.read', 'Read operational enrollment data.', true),
  ('enrollments.create', 'Enroll a student using the server-side default price.', true),
  ('enrollments.update_status', 'Update enrollment status.', true),
  ('enrollments.financial.read', 'Read enrollment fees, payments, balances, and payment status.', true),
  ('enrollments.pricing.override', 'Set a non-default enrollment price.', true),
  ('enrollments.export', 'Export permitted enrollment data.', true),
  ('finance.payments.read', 'Read payment records.', true),
  ('finance.payments.record', 'Record payments.', true),
  ('finance.payments.void', 'Void payment records.', false),
  ('finance.payments.export', 'Export payment records.', true),
  ('finance.expenses.read', 'Read expense records.', true),
  ('finance.expenses.record', 'Record expenses.', true),
  ('finance.expenses.void', 'Void expense records.', false),
  ('finance.expenses.export', 'Export expense records.', true),
  ('finance.cash_boxes.read', 'Read cash boxes and balances.', true),
  ('finance.cash_boxes.update', 'Update approved cash-box metadata.', true),
  ('finance.cash_boxes.create', 'Create cash boxes.', false),
  ('finance.cash_boxes.archive', 'Archive cash boxes.', false),
  ('finance.transfers.read', 'Read cash-box transfers.', true),
  ('finance.transfers.create', 'Transfer funds between cash boxes.', true),
  ('finance.reports.read', 'Read financial reports.', true),
  ('finance.reports.export', 'Export financial reports.', true),
  ('admins.read', 'Read administrator accounts.', false),
  ('admins.invite', 'Invite administrator accounts.', false),
  ('admins.assign_role', 'Assign administrator roles.', false),
  ('admins.disable', 'Disable administrator accounts.', false),
  ('roles.read', 'Read role and permission definitions.', false),
  ('roles.create', 'Create custom roles.', false),
  ('roles.update', 'Update custom role permissions.', false),
  ('roles.delete', 'Delete custom roles.', false),
  ('audit.read', 'Read administrator audit events.', false)
ON CONFLICT (permission_key) DO UPDATE
SET description = EXCLUDED.description,
    is_delegable = EXCLUDED.is_delegable;

-- The reserved superadmin label is not itself a privilege grant. Full platform
-- access comes only from the protected is_owner marker; this avoids a legacy
-- or accidentally assigned superadmin role receiving owner powers pre-claim.
DELETE FROM public.admin_role_permissions WHERE role_key = 'superadmin';

INSERT INTO public.admin_role_permissions (role_key, permission_key)
SELECT 'academy_manager', permission_key
FROM public.permission_catalog
WHERE permission_key = ANY (ARRAY[
  'dashboard.operational.read',
  'students.read', 'students.read_contact_phone', 'students.create', 'students.update',
  'courses.read', 'courses.create', 'courses.update', 'courses.close',
  'enrollments.read', 'enrollments.create', 'enrollments.update_status'
])
ON CONFLICT DO NOTHING;

INSERT INTO public.admin_role_permissions (role_key, permission_key)
SELECT 'finance_manager', permission_key
FROM public.permission_catalog
WHERE permission_key = ANY (ARRAY[
  'dashboard.finance.read', 'students.read',
  'enrollments.read', 'enrollments.financial.read',
  'finance.payments.read', 'finance.payments.record',
  'finance.expenses.read', 'finance.expenses.record',
  'finance.cash_boxes.read', 'finance.cash_boxes.update',
  'finance.transfers.read', 'finance.transfers.create',
  'finance.reports.read', 'finance.reports.export'
])
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION private.is_platform_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins AS a
    WHERE a.auth_user_id = auth.uid()
      AND a.is_active IS TRUE
      AND a.is_owner IS TRUE
  );
$function$;

CREATE OR REPLACE FUNCTION private.has_permission(p_permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.admins AS a
      WHERE a.auth_user_id = auth.uid()
        AND a.is_active IS TRUE
        AND EXISTS (
          SELECT 1 FROM public.permission_catalog AS pc
          WHERE pc.permission_key = p_permission_key
        )
        AND (
          a.is_owner IS TRUE
          OR EXISTS (
            SELECT 1
            FROM public.admin_role_permissions AS arp
            WHERE arp.role_key = a.role
              AND arp.permission_key = p_permission_key
          )
        )
    ),
    false
  );
$function$;

REVOKE ALL ON FUNCTION private.is_platform_owner() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.has_permission(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_platform_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_permission(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_authorization()
RETURNS TABLE (role_key text, is_owner boolean, permissions text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT
    a.role::text,
    a.is_owner,
    COALESCE(
      array_agg(DISTINCT p.permission_key ORDER BY p.permission_key)
        FILTER (WHERE p.permission_key IS NOT NULL),
      ARRAY[]::text[]
    )
  FROM public.admins AS a
  LEFT JOIN public.admin_role_permissions AS arp
    ON a.is_owner IS NOT TRUE AND arp.role_key = a.role
  LEFT JOIN public.permission_catalog AS p
    ON a.is_owner IS TRUE OR p.permission_key = arp.permission_key
  WHERE a.auth_user_id = auth.uid()
    AND a.is_active IS TRUE
  GROUP BY a.role, a.is_owner;
$function$;

CREATE OR REPLACE FUNCTION public.claim_platform_owner()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_active_superadmins bigint;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required.' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('elmasry_platform_owner_claim', 0));

  IF EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_user_id = v_auth_user_id AND is_active AND is_owner
  ) THEN
    RETURN true;
  END IF;

  IF EXISTS (SELECT 1 FROM public.admins WHERE is_owner IS TRUE) THEN
    RAISE EXCEPTION 'The platform owner has already been claimed.' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_active_superadmins
  FROM public.admins
  WHERE role = 'superadmin' AND is_active IS TRUE;

  IF v_active_superadmins <> 1 OR NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_user_id = v_auth_user_id
      AND role = 'superadmin'
      AND is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Owner claim requires exactly one active superadmin and the caller must be that account.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.admins
  SET is_owner = true
  WHERE auth_user_id = v_auth_user_id
    AND role = 'superadmin'
    AND is_active IS TRUE;

  INSERT INTO public.admin_audit_log (
    actor_auth_user_id, target_auth_user_id, action, before_state, after_state
  ) VALUES (
    v_auth_user_id, v_auth_user_id, 'owner_claimed',
    jsonb_build_object('is_owner', false),
    jsonb_build_object('is_owner', true, 'role', 'superadmin')
  );

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_my_authorization() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_platform_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_authorization() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_platform_owner() TO authenticated;

COMMENT ON TABLE public.admin_roles IS
  'RBAC role catalog. Direct client access is revoked; use reviewed owner-authorized operations.';
COMMENT ON TABLE public.permission_catalog IS
  'Stable application permission keys. Direct client access is revoked.';
COMMENT ON TABLE public.admin_role_permissions IS
  'Role-to-permission mapping. Direct client access is revoked.';
COMMENT ON TABLE public.admin_audit_log IS
  'Append-only audit trail for administrator and role changes. Direct client access is revoked.';
COMMENT ON COLUMN public.admins.is_owner IS
  'Protected platform owner marker; unique across admins and not assignable through normal role changes.';
COMMENT ON COLUMN public.admins.is_active IS
  'Database-enforced administrator enablement state for future RBAC cutover.';
