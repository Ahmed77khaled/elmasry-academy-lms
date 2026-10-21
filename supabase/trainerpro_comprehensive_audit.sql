-- ============================================================================
-- 🏛️ TrainerPro Production Live Database Comprehensive Audit Script
-- Elmasry Academy LMS — Forensic Verification & Security Assurance
-- Lead Architect: Eng. Ahmed El-Falah (م/ أحمد الفلاح)
-- ============================================================================
-- NOTE: This script is 100% READ-ONLY. It does not alter or modify any data.
-- Run this in the Supabase SQL Editor to audit and verify live production state.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RLS POLICIES AUDIT: Check for any permissive leaks or legacy policies
-- ----------------------------------------------------------------------------
-- CRITICAL CHECK:
-- In PostgreSQL, permissive policies combine via OR logic.
-- If ANY legacy policy (e.g. anon_select_*, Allow authenticated read) exists,
-- it can bypass admin-only restrictions. Verify that ONLY admin policies exist!
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'admins', 'students', 'courses', 'cash_boxes',
    'enrollments', 'payments', 'expenses', 'cash_box_transfers'
  )
ORDER BY tablename, policyname;


-- ----------------------------------------------------------------------------
-- 2. TABLE-LEVEL RLS AND FORCE RLS ENFORCEMENT
-- ----------------------------------------------------------------------------
-- Verify that rowsecurity = true AND forcerowsecurity = true on all 8 tables.
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'admins', 'students', 'courses', 'cash_boxes',
    'enrollments', 'payments', 'expenses', 'cash_box_transfers'
  )
ORDER BY c.relname;


-- ----------------------------------------------------------------------------
-- 3. TABLE PRIVILEGES: Verify anon and PUBLIC have NO table access
-- ----------------------------------------------------------------------------
-- Anonymous (anon) and PUBLIC users must NOT have SELECT/INSERT/UPDATE/DELETE.
SELECT
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'admins', 'students', 'courses', 'cash_boxes',
    'enrollments', 'payments', 'expenses', 'cash_box_transfers'
  )
  AND grantee IN ('anon', 'authenticated', 'PUBLIC', 'service_role')
ORDER BY table_name, grantee, privilege_type;


-- ----------------------------------------------------------------------------
-- 4. RPC FUNCTIONS: SECURITY DEFINER, search_path & Guard Checks
-- ----------------------------------------------------------------------------
-- Ensure financial and admin RPC functions have security_definer and safe search_path.
SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS is_security_definer,
  p.proconfig AS runtime_search_path,
  r.rolname AS function_owner
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_roles r ON r.oid = p.proowner
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_admin', 'record_payment', 'record_expense',
    'transfer_between_boxes', 'void_payment', 'void_expense',
    'get_dashboard_summary', 'prevent_financial_record_mutation'
  )
ORDER BY p.proname, arguments;


-- ----------------------------------------------------------------------------
-- 5. RPC EXECUTION PRIVILEGES: Ensure anon/PUBLIC cannot execute sensitive RPCs
-- ----------------------------------------------------------------------------
SELECT
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN (
    'is_admin', 'record_payment', 'record_expense',
    'transfer_between_boxes', 'void_payment', 'void_expense'
  )
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
ORDER BY routine_name, grantee;


-- ----------------------------------------------------------------------------
-- 6. VIEWS AUDIT: security_invoker flag & voided_at IS NULL implementation
-- ----------------------------------------------------------------------------
SELECT
  c.relname AS view_name,
  c.reloptions AS view_options,
  CASE
    WHEN 'security_invoker=true' = ANY(c.reloptions) THEN true
    ELSE false
  END AS has_security_invoker,
  v.definition AS view_definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_views v ON v.schemaname = n.nspname AND v.viewname = c.relname
WHERE n.nspname = 'public'
  AND c.relname IN (
    'enrollment_balances', 'cash_box_balances',
    'course_financial_summary', 'dashboard_metrics'
  )
ORDER BY c.relname;


-- ----------------------------------------------------------------------------
-- 7. FINANCIAL LEDGER MUTATION TRIGGERS
-- ----------------------------------------------------------------------------
-- Verify that triggers exist on payments, expenses, and transfers to prevent
-- unauthorized direct updates or deletes (append-only ledger enforcement).
SELECT
  c.relname AS table_name,
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND c.relname IN ('payments', 'expenses', 'cash_box_transfers')
ORDER BY c.relname, t.tgname;


-- ----------------------------------------------------------------------------
-- 8. SEQUENCES AND INDEXES (e.g. Receipt Number Sequence & Uniqueness)
-- ----------------------------------------------------------------------------
SELECT
  sequence_schema,
  sequence_name,
  data_type,
  start_value,
  minimum_value,
  maximum_value
FROM information_schema.sequences
WHERE sequence_schema = 'public'
  AND sequence_name LIKE '%receipt%';

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'admins', 'students', 'courses', 'cash_boxes',
    'enrollments', 'payments', 'expenses', 'cash_box_transfers'
  )
ORDER BY tablename, indexname;


-- ----------------------------------------------------------------------------
-- 9. SUPABASE MIGRATION HISTORY (Check CLI migration tracking table)
-- ----------------------------------------------------------------------------
SELECT
  CASE
    WHEN to_regclass('supabase_migrations.schema_migrations') IS NOT NULL THEN 'EXISTS (CLI Migrations Tracking)'
    ELSE 'NOT FOUND (Manual SQL Editor Workflow)'
  END AS migration_table_status;

-- If supabase_migrations.schema_migrations exists, uncomment and inspect:
-- SELECT version, inserted_at FROM supabase_migrations.schema_migrations ORDER BY version;


-- ----------------------------------------------------------------------------
-- 10. EXACT CANONICAL COLUMNS FOR THE 8 CORE TABLES
-- ----------------------------------------------------------------------------
SELECT
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'admins', 'students', 'courses', 'cash_boxes',
    'enrollments', 'payments', 'expenses', 'cash_box_transfers'
  )
ORDER BY table_name, ordinal_position;
