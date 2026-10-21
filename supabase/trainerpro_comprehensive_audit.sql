-- ============================================================================
-- 🏛️ TrainerPro Production Live Database Forensic Audit Script (v2.2)
-- Elmasry Academy LMS — Comprehensive Security, RLS & Authorization Verification
-- Lead Architect: Eng. Ahmed El-Falah (م/ أحمد الفلاح)
-- ============================================================================
-- NOTE: This script consists purely of read-only diagnostic SELECT queries.
-- It does not alter, lock, or modify any permanent or session database objects (No DDL/DML).
-- Run this in the Supabase SQL Editor to audit and verify live production state.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. RLS POLICIES AUDIT: Check for any permissive leaks or legacy policies
-- ----------------------------------------------------------------------------
-- CRITICAL CHECK:
-- In PostgreSQL, permissive policies combine via OR logic.
-- If ANY legacy permissive policy exists (e.g. anon_select_*, Allow authenticated read),
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
-- 3. TABLE PRIVILEGES VIA TABLE_PRIVILEGES AND ACLEXPLODE (INCLUDING PUBLIC)
-- ----------------------------------------------------------------------------
-- In PostgreSQL, role_table_grants does NOT show PUBLIC grants.
-- We use information_schema.table_privileges AND direct catalog aclexplode.
-- Verify that neither 'anon' nor 'PUBLIC' has SELECT, INSERT, UPDATE, or DELETE!
SELECT
  table_name,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN (
    'admins', 'students', 'courses', 'cash_boxes',
    'enrollments', 'payments', 'expenses', 'cash_box_transfers'
  )
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
ORDER BY table_name, grantee, privilege_type;

-- Direct catalog ACL audit (a.grantee = 0 indicates PUBLIC):
SELECT
  c.relname AS table_name,
  COALESCE(r.rolname, 'PUBLIC') AS grantee_role,
  a.privilege_type,
  a.is_grantable
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
LEFT JOIN pg_roles r ON r.oid = a.grantee
WHERE n.nspname = 'public'
  AND c.relname IN (
    'admins', 'students', 'courses', 'cash_boxes',
    'enrollments', 'payments', 'expenses', 'cash_box_transfers'
  )
  AND (r.rolname IN ('anon', 'authenticated') OR a.grantee = 0)
ORDER BY c.relname, grantee_role, a.privilege_type;


-- ----------------------------------------------------------------------------
-- 4. RPC FUNCTIONS: AUDIT ATTRIBUTES, GUARDS & OWNER BYPASS RLS
-- ----------------------------------------------------------------------------
-- Audits all 8 core functions:
-- Notes for Manual Forensic Review:
-- a) prosecdef = true (SECURITY DEFINER)
-- b) runtime_search_path includes pg_catalog, public
-- c) owner_bypasses_rls: crucial for understanding how is_admin() queries public.admins
--    when FORCE ROW LEVEL SECURITY is active. If owner has rolbypassrls, it can read admins table directly.
-- d) checks_is_admin: true for functions enforcing admin authentication.
-- e) uses_row_lock_when_mutating: expected ONLY on mutating operations (payments, expenses, transfers, enrollments).
--    NOT expected on read-only helper functions like is_admin().
SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS is_security_definer,
  p.proconfig AS runtime_search_path,
  r.rolname AS function_owner,
  r.rolbypassrls AS owner_bypasses_rls,
  (pg_get_functiondef(p.oid) ILIKE '%is_admin%') AS checks_is_admin,
  (pg_get_functiondef(p.oid) ILIKE '%auth.uid()%') AS references_auth_uid,
  CASE
    WHEN p.proname IN ('record_payment', 'record_expense', 'transfer_between_boxes', 'enroll_student', 'set_enrollment_status')
      THEN (pg_get_functiondef(p.oid) ILIKE '%FOR UPDATE%')
    ELSE NULL -- Not applicable for read-only functions (e.g. is_admin)
  END AS uses_row_lock_when_mutating
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_roles r ON r.oid = p.proowner
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_admin', 'record_payment', 'record_expense',
    'transfer_between_boxes', 'void_payment', 'void_expense',
    'enroll_student', 'set_enrollment_status'
  )
ORDER BY p.proname, arguments;


-- ----------------------------------------------------------------------------
-- 4b. FULL RPC FUNCTION DEFINITIONS (VERIFY COMPLETE CODE OF SENSITIVE RPCS)
-- ----------------------------------------------------------------------------
SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  pg_get_functiondef(p.oid) AS full_function_code
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'record_payment', 'record_expense', 'transfer_between_boxes',
    'void_payment', 'void_expense', 'enroll_student', 'set_enrollment_status'
  )
ORDER BY p.proname;


-- ----------------------------------------------------------------------------
-- 5. RPC EXECUTION PRIVILEGES: VERIFY PUBLIC & ANON HAVE NO EXECUTION ACCESS
-- ----------------------------------------------------------------------------
SELECT
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN (
    'is_admin', 'record_payment', 'record_expense',
    'transfer_between_boxes', 'void_payment', 'void_expense',
    'enroll_student', 'set_enrollment_status'
  )
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
ORDER BY routine_name, grantee;

-- Direct catalog ACL audit for routines:
SELECT
  p.proname AS function_name,
  COALESCE(r.rolname, 'PUBLIC') AS grantee_role,
  a.privilege_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
LEFT JOIN pg_roles r ON r.oid = a.grantee
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_admin', 'record_payment', 'record_expense',
    'transfer_between_boxes', 'void_payment', 'void_expense',
    'enroll_student', 'set_enrollment_status'
  )
  AND (r.rolname IN ('anon', 'authenticated') OR a.grantee = 0)
ORDER BY p.proname, grantee_role;


-- ----------------------------------------------------------------------------
-- 6. VIEWS AUDIT: security_invoker flag & voided_at IS NULL implementation
-- ----------------------------------------------------------------------------
-- Verifies the 4 canonical views:
-- a) security_invoker = true
-- b) excludes_voided_payments = true (contains voided_at IS NULL)
SELECT
  c.relname AS view_name,
  c.reloptions AS view_options,
  CASE
    WHEN 'security_invoker=true' = ANY(c.reloptions) THEN true
    ELSE false
  END AS has_security_invoker,
  (v.definition ILIKE '%voided_at IS NULL%') AS excludes_voided_payments,
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
-- 9. SUPABASE MIGRATION HISTORY (Read-Only Tracking Table Inspection)
-- ----------------------------------------------------------------------------
-- 9a) Check if the Supabase CLI schema_migrations table exists:
SELECT
  table_schema,
  table_name,
  CASE
    WHEN table_name IS NOT NULL THEN 'CLI_MIGRATIONS_TABLE_EXISTS'
    ELSE 'MANUAL_SQL_EDITOR_WORKFLOW (CLI tracking table does not exist)'
  END AS migration_tracking_status
FROM (SELECT 1) _
LEFT JOIN information_schema.tables
  ON table_schema = 'supabase_migrations' AND table_name = 'schema_migrations';

-- 9b) Inspect the exact columns of schema_migrations (if present):
SELECT
  column_name,
  data_type,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'supabase_migrations'
  AND table_name = 'schema_migrations'
ORDER BY ordinal_position;

-- 9c) Optional: If 9a returns CLI_MIGRATIONS_TABLE_EXISTS, inspect applied migrations.
-- Note: Supabase CLI canonical schema stores (version, name, statements).
-- Run separately if applicable:
-- SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version DESC;


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
