-- Phase 0 evidence capture: legacy financial view consumers/dependencies.
-- READ ONLY: SELECT statements only. This file has NOT been executed.
-- Do not run against Production or Staging until the user separately authorizes
-- a specific read-only capture and the target project ref is independently
-- verified immediately before execution.
--
-- Capture result sets together with project ref, environment, timestamp, and
-- tool/session metadata. Function text scans are evidence of textual mentions,
-- not a complete proof of runtime dependencies (dynamic SQL and nested calls
-- require interpretation). pg_depend may omit references inside PL/pgSQL bodies.

-- 1) Exact function definitions, language/security attributes, and effective
-- execute privileges for the app's compatibility course-summary RPC and the
-- v2 implementation, plus the other finance dashboard endpoints.
SELECT
  n.nspname AS schema_name,
  p.oid::regprocedure AS signature,
  l.lanname AS language_name,
  pg_get_userbyid(p.proowner) AS owner,
  p.prosecdef AS security_definer,
  p.proconfig AS function_settings,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute,
  COALESCE(p.proacl, acldefault('f', p.proowner)) AS acl_array,
  p.prosrc AS source_body,
  pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public'
  AND p.proname IN (
    'rbac_course_financial_summary',
    'rbac_course_financial_summary_v2',
    'rbac_finance_dashboard_metrics',
    'rbac_operational_dashboard_metrics'
  )
ORDER BY p.proname, p.oid::regprocedure::text;

-- 2) Textual references from all public/private routines to any of the four
-- legacy views. Review full definitions and nested calls, not just booleans.
SELECT
  n.nspname AS schema_name,
  p.oid::regprocedure AS signature,
  l.lanname AS language_name,
  p.prosecdef AS security_definer,
  p.prosrc ~* '(^|[^[:alnum:]_])("?public"?[.])?"?enrollment_balances"?([^[:alnum:]_]|$)' AS mentions_enrollment_balances,
  p.prosrc ~* '(^|[^[:alnum:]_])("?public"?[.])?"?cash_box_balances"?([^[:alnum:]_]|$)' AS mentions_cash_box_balances,
  p.prosrc ~* '(^|[^[:alnum:]_])("?public"?[.])?"?course_financial_summary"?([^[:alnum:]_]|$)' AS mentions_course_financial_summary,
  p.prosrc ~* '(^|[^[:alnum:]_])("?public"?[.])?"?dashboard_metrics"([^[:alnum:]_]|$)' AS mentions_dashboard_metrics,
  pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname IN ('public', 'private')
  AND p.prokind IN ('f', 'p')
  AND (
    p.prosrc ~* '(^|[^[:alnum:]_])("?public"?[.])?"?enrollment_balances"?([^[:alnum:]_]|$)'
    OR p.prosrc ~* '(^|[^[:alnum:]_])("?public"?[.])?"?cash_box_balances"?([^[:alnum:]_]|$)'
    OR p.prosrc ~* '(^|[^[:alnum:]_])("?public"?[.])?"?course_financial_summary"?([^[:alnum:]_]|$)'
    OR p.prosrc ~* '(^|[^[:alnum:]_])("?public"?[.])?"?dashboard_metrics"([^[:alnum:]_]|$)'
  )
ORDER BY n.nspname, p.proname, p.oid::regprocedure::text;

-- 3) Catalog-tracked direct routine-to-relation dependencies. An empty result
-- is not proof of no dependency for PL/pgSQL or dynamically executed SQL.
SELECT
  n.nspname AS routine_schema,
  p.oid::regprocedure AS routine_signature,
  p.prokind AS routine_kind,
  rn.nspname AS relation_schema,
  c.relname AS relation_name,
  c.relkind AS relation_kind,
  d.deptype AS dependency_type
FROM pg_depend d
JOIN pg_proc p ON d.classid = 'pg_proc'::regclass AND d.objid = p.oid
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_class c ON d.refclassid = 'pg_class'::regclass AND d.refobjid = c.oid
JOIN pg_namespace rn ON rn.oid = c.relnamespace
WHERE n.nspname IN ('public', 'private')
  AND p.prokind IN ('f', 'p')
  AND rn.nspname = 'public'
  AND c.relname IN (
    'enrollment_balances', 'cash_box_balances',
    'course_financial_summary', 'dashboard_metrics'
  )
ORDER BY n.nspname, p.oid::regprocedure::text, c.relname;

-- 4) Current legacy view definitions and directly tracked relation/view
-- dependencies, for interpreting any function results above.
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
  AND c.relkind IN ('v', 'm')
  AND c.relname IN (
    'enrollment_balances', 'cash_box_balances',
    'course_financial_summary', 'dashboard_metrics'
  )
ORDER BY c.relname;

SELECT
  dependent.relname AS dependent_view,
  referenced.relname AS referenced_relation,
  referenced.relkind AS referenced_kind,
  d.deptype AS dependency_type
FROM pg_depend d
JOIN pg_rewrite r ON d.classid = 'pg_rewrite'::regclass AND d.objid = r.oid
JOIN pg_class dependent ON dependent.oid = r.ev_class
JOIN pg_class referenced ON d.refclassid = 'pg_class'::regclass AND d.refobjid = referenced.oid
JOIN pg_namespace dn ON dn.oid = dependent.relnamespace
JOIN pg_namespace rn ON rn.oid = referenced.relnamespace
WHERE dn.nspname = 'public'
  AND rn.nspname = 'public'
  AND dependent.relname IN (
    'enrollment_balances', 'cash_box_balances',
    'course_financial_summary', 'dashboard_metrics'
  )
ORDER BY dependent.relname, referenced.relname;
