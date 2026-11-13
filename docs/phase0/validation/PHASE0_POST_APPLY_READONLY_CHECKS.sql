-- READ-ONLY verification queries for the Phase 0 forward-only fixes.
-- Run against a dedicated STAGING clone after applying the four migrations.
-- Every statement is SELECT-only; no database changes are performed.

-- 1) Execution identity and PostgreSQL version.
SELECT current_user AS current_role,
       current_database() AS database_name,
       current_setting('server_version') AS postgres_version;

-- 2) Default privileges for postgres-created public objects and global defaults.
SELECT
  pg_get_userbyid(d.defaclrole) AS creator,
  COALESCE(n.nspname, '<GLOBAL>') AS schema_name,
  d.defaclobjtype AS object_type_code,
  CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS grantee,
  a.privilege_type,
  a.is_grantable
FROM pg_default_acl d
LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
CROSS JOIN LATERAL aclexplode(d.defaclacl) a
WHERE d.defaclrole = 'postgres'::regrole
  AND (d.defaclnamespace = 0 OR n.nspname = 'public')
ORDER BY schema_name, object_type_code, grantee, a.privilege_type;

-- Expected: public TABLE/SEQUENCE/FUNCTION defaults contain no anon,
-- authenticated or PUBLIC grants. service_role's explicit public defaults remain.

-- 3) is_admin source, security attributes, owner and effective execution rights.
SELECT p.oid::regprocedure AS signature,
       pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef AS security_definer,
       p.proconfig AS function_settings,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
       has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute,
       pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'is_admin'
  AND p.pronargs = 0;

-- Expected predicate: public.admins.is_active IS TRUE. anon/PUBLIC EXECUTE false.

-- 4) Cash-box added_by FK action, validation, nullability and default.
SELECT c.conname,
       c.convalidated,
       c.confdeltype,
       CASE c.confdeltype
         WHEN 'a' THEN 'NO ACTION'
         WHEN 'r' THEN 'RESTRICT'
         WHEN 'c' THEN 'CASCADE'
         WHEN 'n' THEN 'SET NULL'
         WHEN 'd' THEN 'SET DEFAULT'
         ELSE 'UNKNOWN'
       END AS on_delete_action,
       pg_get_constraintdef(c.oid, true) AS definition,
       col.is_nullable,
       col.column_default
FROM pg_constraint c
JOIN information_schema.columns col
  ON col.table_schema = 'public'
 AND col.table_name = 'cash_boxes'
 AND col.column_name = 'added_by'
WHERE c.conrelid = 'public.cash_boxes'::regclass
  AND c.conname = 'cash_boxes_added_by_fkey';

-- Expected: confdeltype='n' (SET NULL), validated=true, nullable=YES.
-- The existing added_by default is intentionally preserved by this patch.

-- 5) Exact cash-box trigger metadata, including true ROW/STATEMENT bits.
SELECT t.tgname,
       t.tgenabled,
       t.tgtype,
       CASE WHEN (t.tgtype & 1) = 1 THEN 'ROW' ELSE 'STATEMENT' END AS trigger_level,
       CASE WHEN (t.tgtype & 2) = 2 THEN 'BEFORE' ELSE 'AFTER/INSTEAD' END AS timing,
       pg_get_triggerdef(t.oid, true) AS trigger_definition,
       p.oid::regprocedure AS trigger_function,
       pg_get_functiondef(p.oid) AS trigger_function_definition
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'public.cash_boxes'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- Expected: trg_cash_boxes_immutability is enabled BEFORE ROW and its function
-- rejects updates to opening_balance and opening_balance_usd.
-- Inspect the archive notification trigger's tgtype alongside pg_get_triggerdef;
-- this resolves the contradictory STATEMENT/ROW label in the original report.

-- 6) Exact financial view output signatures and security options.
SELECT c.relname AS view_name,
       a.attnum AS ordinal_position,
       a.attname AS column_name,
       format_type(a.atttypid, a.atttypmod) AS output_type,
       c.reloptions,
       pg_get_viewdef(c.oid, true) AS view_definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
  AND c.relname IN (
    'enrollment_balances', 'cash_box_balances',
    'course_financial_summary', 'dashboard_metrics'
  )
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY c.relname, a.attnum;

-- 6b) Exact contract diff. This query should return ZERO rows after staging apply.
WITH expected(view_name, ordinal_position, column_name, type_oid) AS (
  VALUES
    ('cash_box_balances', 1, 'cash_box_id', 'uuid'::regtype),
    ('cash_box_balances', 2, 'name', 'character varying'::regtype),
    ('cash_box_balances', 3, 'type', 'character varying'::regtype),
    ('cash_box_balances', 4, 'owner', 'character varying'::regtype),
    ('cash_box_balances', 5, 'is_active', 'boolean'::regtype),
    ('cash_box_balances', 6, 'opening_balance', 'numeric'::regtype),
    ('cash_box_balances', 7, 'total_payments_in', 'numeric'::regtype),
    ('cash_box_balances', 8, 'total_expenses_out', 'numeric'::regtype),
    ('cash_box_balances', 9, 'total_transfers_in', 'numeric'::regtype),
    ('cash_box_balances', 10, 'total_transfers_out', 'numeric'::regtype),
    ('cash_box_balances', 11, 'current_balance', 'numeric'::regtype),
    ('course_financial_summary', 1, 'course_id', 'uuid'::regtype),
    ('course_financial_summary', 2, 'course_name', 'character varying'::regtype),
    ('course_financial_summary', 3, 'availability_status', 'character varying'::regtype),
    ('course_financial_summary', 4, 'max_students', 'integer'::regtype),
    ('course_financial_summary', 5, 'default_cost', 'numeric'::regtype),
    ('course_financial_summary', 6, 'active_enrollments', 'bigint'::regtype),
    ('course_financial_summary', 7, 'vacant_places', 'bigint'::regtype),
    ('course_financial_summary', 8, 'total_enrollments', 'bigint'::regtype),
    ('course_financial_summary', 9, 'expected_revenue', 'numeric'::regtype),
    ('course_financial_summary', 10, 'collected_payments', 'numeric'::regtype),
    ('course_financial_summary', 11, 'total_expenses', 'numeric'::regtype),
    ('course_financial_summary', 12, 'net_profit', 'numeric'::regtype),
    ('dashboard_metrics', 1, 'total_students', 'bigint'::regtype),
    ('dashboard_metrics', 2, 'new_students_this_month', 'bigint'::regtype),
    ('dashboard_metrics', 3, 'active_courses', 'bigint'::regtype),
    ('dashboard_metrics', 4, 'active_enrollments', 'bigint'::regtype),
    ('dashboard_metrics', 5, 'revenue_this_month', 'numeric'::regtype),
    ('dashboard_metrics', 6, 'expenses_this_month', 'numeric'::regtype),
    ('dashboard_metrics', 7, 'net_profit_this_month', 'numeric'::regtype),
    ('dashboard_metrics', 8, 'total_revenue_all_time', 'numeric'::regtype),
    ('dashboard_metrics', 9, 'total_expenses_all_time', 'numeric'::regtype),
    ('dashboard_metrics', 10, 'net_profit_all_time', 'numeric'::regtype),
    ('dashboard_metrics', 11, 'total_pending_balance', 'numeric'::regtype),
    ('enrollment_balances', 1, 'enrollment_id', 'uuid'::regtype),
    ('enrollment_balances', 2, 'student_id', 'uuid'::regtype),
    ('enrollment_balances', 3, 'student_name', 'character varying'::regtype),
    ('enrollment_balances', 4, 'course_id', 'uuid'::regtype),
    ('enrollment_balances', 5, 'course_name', 'character varying'::regtype),
    ('enrollment_balances', 6, 'agreed_cost', 'numeric'::regtype),
    ('enrollment_balances', 7, 'enrollment_status', 'character varying'::regtype),
    ('enrollment_balances', 8, 'enrolled_at', 'timestamp with time zone'::regtype),
    ('enrollment_balances', 9, 'total_paid', 'numeric'::regtype),
    ('enrollment_balances', 10, 'remaining_balance', 'numeric'::regtype),
    ('enrollment_balances', 11, 'payment_status', 'text'::regtype)
), actual AS (
  SELECT c.relname AS view_name,
         a.attnum AS ordinal_position,
         a.attname AS column_name,
         a.atttypid AS type_oid
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid
  WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND c.relname IN (
      'cash_box_balances', 'course_financial_summary',
      'dashboard_metrics', 'enrollment_balances'
    )
    AND a.attnum > 0
    AND NOT a.attisdropped
)
SELECT COALESCE(e.view_name, a.view_name) AS view_name,
       COALESCE(e.ordinal_position, a.ordinal_position) AS ordinal_position,
       e.column_name AS expected_column,
       a.column_name AS actual_column,
       e.type_oid::text AS expected_type,
       a.type_oid::regtype::text AS actual_type
FROM expected e
FULL JOIN actual a
  ON a.view_name = e.view_name
 AND a.ordinal_position = e.ordinal_position
WHERE e.view_name IS NULL
   OR a.view_name IS NULL
   OR e.column_name IS DISTINCT FROM a.column_name
   OR e.type_oid IS DISTINCT FROM a.type_oid
ORDER BY 1, 2;

-- 7) Currency consistency and whether EGP-only legacy views accidentally
-- include USD enrollments/payments.
SELECT p.currency AS payment_currency,
       e.agreed_currency AS enrollment_currency,
       COUNT(*) AS mismatched_rows
FROM public.payments p
JOIN public.enrollments e ON e.enrollment_id = p.enrollment_id
WHERE p.currency IS DISTINCT FROM e.agreed_currency
GROUP BY p.currency, e.agreed_currency
ORDER BY p.currency, e.agreed_currency;

SELECT COUNT(*) AS non_egp_enrollments_exposed_by_legacy_view
FROM public.enrollment_balances eb
JOIN public.enrollments e ON e.enrollment_id = eb.enrollment_id
WHERE e.agreed_currency IS DISTINCT FROM 'EGP';

SELECT
  (SELECT COALESCE(SUM(amount), 0::numeric)
   FROM public.payments WHERE voided_at IS NULL AND currency = 'EGP') AS source_egp_payments,
  (SELECT COALESCE(SUM(total_payments_in), 0::numeric)
   FROM public.cash_box_balances) AS view_egp_payments;

-- 8) Complete current function exposure inventory remains required for Phase 0
-- closure. This includes INVOKER and DEFINER routines, not only the 70 audited
-- SECURITY DEFINER functions.
SELECT n.nspname AS schema_name,
       p.oid::regprocedure AS signature,
       p.prosecdef AS security_definer,
       pg_get_userbyid(p.proowner) AS owner,
       p.proconfig AS function_settings,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
       has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute,
       COALESCE(p.proacl, acldefault('f', p.proowner)) AS acl_array,
       pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'private')
  AND p.prokind IN ('f', 'p')
ORDER BY n.nspname, p.proname, p.oid::regprocedure::text;

-- 9) All live RLS policies and relevant table flags.
SELECT n.nspname AS schema_name,
       c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced,
       pg_get_userbyid(c.relowner) AS owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'private')
  AND c.relkind IN ('r', 'p')
ORDER BY n.nspname, c.relname;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname IN ('public', 'private')
ORDER BY schemaname, tablename, policyname;
