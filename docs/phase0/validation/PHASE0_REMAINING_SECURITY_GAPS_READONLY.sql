-- PHASE 0 REVIEW GAPS — READ-ONLY EVIDENCE COLLECTION
-- Target project: urmkcixqpoqkiosihhal (TrainerPro)
-- Every statement in this file is SELECT-only. Do not append DDL/DML.

-- 1) All routines in public/private, including non-SECURITY DEFINER functions.
--    Includes effective EXECUTE for API roles and explicit/default ACL entries.
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  p.oid::regprocedure AS identity_signature,
  pg_get_function_result(p.oid) AS return_type,
  l.lanname AS language,
  p.provolatile AS volatility_code,
  p.prosecdef AS security_definer,
  pg_get_userbyid(p.proowner) AS owner,
  p.proconfig AS function_settings,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute,
  COALESCE(p.proacl, acldefault('f', p.proowner)) AS effective_acl_array,
  pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname IN ('public', 'private')
  AND p.prokind IN ('f', 'p')
ORDER BY n.nspname, p.proname, p.oid::regprocedure::text;

-- 2a) Effective schema USAGE/CREATE for real API/database roles.
--     has_schema_privilege(role, schema, ...) includes privileges granted to PUBLIC
--     and inherited through role membership.
SELECT
  n.nspname AS schema_name,
  r.rolname AS role_name,
  has_schema_privilege(r.oid, n.oid, 'USAGE') AS effective_usage,
  has_schema_privilege(r.oid, n.oid, 'CREATE') AS effective_create
FROM pg_namespace n
CROSS JOIN pg_roles r
WHERE n.nspname IN ('public', 'private', 'auth')
  AND r.rolname IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY n.nspname, r.rolname;

-- 2b) Explicit schema ACL entries, including PUBLIC (grantee OID 0).
--     PUBLIC is not a row in pg_roles; inspect it through aclexplode instead.
SELECT
  n.nspname AS schema_name,
  CASE
    WHEN a.grantee = 0 THEN 'PUBLIC'
    ELSE pg_get_userbyid(a.grantee)
  END AS grantee,
  a.privilege_type,
  a.is_grantable
FROM pg_namespace n
CROSS JOIN LATERAL aclexplode(
  COALESCE(n.nspacl, acldefault('n', n.nspowner))
) AS a
WHERE n.nspname IN ('public', 'private', 'auth')
ORDER BY n.nspname, grantee, a.privilege_type;

-- 3a) RLS flags for application tables in public.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  pg_get_userbyid(c.relowner) AS owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
ORDER BY c.relname;

-- 3b) Every live RLS policy in public/private.
SELECT
  schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname IN ('public', 'private')
ORDER BY schemaname, tablename, policyname;

-- 4) Exact cash_boxes.added_by FK, including confdeltype code and readable action.
SELECT
  con.conname,
  con.contype,
  con.convalidated,
  con.confdeltype,
  CASE con.confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
    ELSE 'UNKNOWN'
  END AS on_delete_action,
  con.condeferrable,
  con.condeferred,
  pg_get_constraintdef(con.oid, true) AS constraint_definition
FROM pg_constraint con
WHERE con.conrelid = 'public.cash_boxes'::regclass
  AND con.contype = 'f'
ORDER BY con.conname;

-- 5) Exact trigger metadata. tgtype bit 0 indicates ROW (otherwise STATEMENT).
SELECT
  t.tgname,
  t.tgenabled,
  CASE t.tgenabled WHEN 'O' THEN 'ENABLED_ORIGIN' WHEN 'D' THEN 'DISABLED'
                   WHEN 'R' THEN 'ENABLED_REPLICA' WHEN 'A' THEN 'ENABLED_ALWAYS' END AS enabled_state,
  CASE WHEN (t.tgtype & 1) = 1 THEN 'ROW' ELSE 'STATEMENT' END AS trigger_level,
  pg_get_triggerdef(t.oid, true) AS trigger_definition,
  p.oid::regprocedure AS trigger_function,
  pg_get_functiondef(p.oid) AS trigger_function_definition
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'public.cash_boxes'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 6) Complete columns for the audit/outbox/notification objects reported as live.
SELECT
  table_name, ordinal_position, column_name, data_type, udt_name,
  is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'platform_audit_events', 'telegram_notification_outbox',
    'platform_notification_settings', 'login_alert_dedupe', 'academy_branding'
  )
ORDER BY table_name, ordinal_position;

-- 7) Constraints for those objects.
SELECT
  con.conrelid::regclass AS table_name,
  con.conname,
  con.contype,
  con.convalidated,
  pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint con
WHERE con.conrelid IN (
  SELECT c.oid FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN (
      'platform_audit_events', 'telegram_notification_outbox',
      'platform_notification_settings', 'login_alert_dedupe', 'academy_branding'
    )
)
ORDER BY con.conrelid::regclass::text, con.conname;

-- 8) Indexes and triggers for the audit/outbox/notification objects.
SELECT
  t.relname AS table_name,
  i.relname AS index_name,
  ix.indisprimary,
  ix.indisunique,
  ix.indisvalid,
  pg_get_indexdef(i.oid) AS index_definition
FROM pg_index ix
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname IN (
    'platform_audit_events', 'telegram_notification_outbox',
    'platform_notification_settings', 'login_alert_dedupe', 'academy_branding'
  )
ORDER BY t.relname, i.relname;

SELECT
  t.tgrelid::regclass AS table_name,
  t.tgname,
  t.tgenabled,
  pg_get_triggerdef(t.oid, true) AS trigger_definition,
  p.oid::regprocedure AS trigger_function
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal
  AND t.tgrelid IN (
    SELECT c.oid FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN (
        'platform_audit_events', 'telegram_notification_outbox',
        'platform_notification_settings', 'login_alert_dedupe', 'academy_branding'
      )
  )
ORDER BY t.tgrelid::regclass::text, t.tgname;

-- 9) Definitions for important functions that may not be SECURITY DEFINER.
SELECT
  n.nspname AS schema_name,
  p.oid::regprocedure AS signature,
  p.prosecdef AS security_definer,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute,
  COALESCE(p.proacl, acldefault('f', p.proowner)) AS acl_array,
  pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = ANY (ARRAY[
  'is_active_admin', 'get_academy_logo', 'set_academy_logo',
  'enqueue_admin_login_notification', 'claim_telegram_notifications'
])
ORDER BY n.nspname, p.proname, p.oid::regprocedure::text;

-- 10) Exact current financial view definitions and output contracts.
SELECT
  n.nspname AS schema_name,
  c.relname AS view_name,
  c.relkind,
  c.reloptions,
  pg_get_userbyid(c.relowner) AS owner,
  pg_get_viewdef(c.oid, true) AS view_definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'enrollment_balances', 'cash_box_balances',
    'course_financial_summary', 'dashboard_metrics'
  )
ORDER BY c.relname;

SELECT
  c.relname AS view_name,
  a.attnum AS ordinal_position,
  a.attname AS column_name,
  format_type(a.atttypid, a.atttypmod) AS exact_type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relname IN (
    'enrollment_balances', 'cash_box_balances',
    'course_financial_summary', 'dashboard_metrics'
  )
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY c.relname, a.attnum;

-- 11) Current migration ledger (read-only).
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;
