-- TrainerPro live-schema audit (read-only).
-- This script does NOT alter/rename tables or columns.
-- The production schema already uses the canonical names documented in the revised reference;
-- run this only to re-check drift before documenting or preparing a migration.

-- 1) Exact column names, PostgreSQL types, nullability, and defaults for the 8 core tables.
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
ORDER BY table_name, ordinal_position
LIMIT 200;

-- 1b) Name-alias preflight for field names used in an older draft of the reference.
-- The expected result on current TrainerPro is CANONICAL_PRESENT for every row.
-- This is diagnostic only: it deliberately does not run ALTER TABLE.
WITH aliases(table_name, old_name, canonical_name) AS (
  VALUES
    ('courses', 'prerequisites', 'prerequisite_courses'),
    ('courses', 'whatsapp_group_url', 'link_whatsapp'),
    ('courses', 'task_platform_url', 'link_tasks'),
    ('courses', 'drive_folder_url', 'link_drive'),
    ('courses', 'sources_url', 'link_sources'),
    ('payments', 'payment_method', 'method'),
    ('expenses', 'created_by', 'added_by')
)
SELECT
  a.table_name,
  a.old_name,
  a.canonical_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = a.table_name
      AND c.column_name = a.old_name
  ) AS old_name_exists,
  EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = a.table_name
      AND c.column_name = a.canonical_name
  ) AS canonical_name_exists,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = a.table_name
        AND c.column_name = a.canonical_name
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = a.table_name
        AND c.column_name = a.old_name
    ) THEN 'CANONICAL_PRESENT'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = a.table_name
        AND c.column_name = a.old_name
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = a.table_name
        AND c.column_name = a.canonical_name
    ) THEN 'LEGACY_ALIAS_ONLY_REVIEW_MIGRATION'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = a.table_name
        AND c.column_name = a.old_name
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = a.table_name
        AND c.column_name = a.canonical_name
    ) THEN 'BOTH_PRESENT_REVIEW_DATA_BEFORE_CHANGE'
    ELSE 'NEITHER_PRESENT_REVIEW_SCHEMA'
  END AS alignment_status
FROM aliases a
ORDER BY a.table_name, a.old_name
LIMIT 20;

-- 2) Primary/foreign/unique/check constraints on the same tables.
SELECT
  c.conrelid::regclass::text AS table_name,
  c.conname AS constraint_name,
  CASE c.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    ELSE c.contype::text
  END AS constraint_type,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint AS c
WHERE c.conrelid IN (
  'public.admins'::regclass,
  'public.students'::regclass,
  'public.courses'::regclass,
  'public.cash_boxes'::regclass,
  'public.enrollments'::regclass,
  'public.payments'::regclass,
  'public.expenses'::regclass,
  'public.cash_box_transfers'::regclass
)
ORDER BY c.conrelid::regclass::text, c.conname
LIMIT 200;

-- 3) Indexes, including unique receipt number and enrollment pair indexes.
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'admins', 'students', 'courses', 'cash_boxes',
    'enrollments', 'payments', 'expenses', 'cash_box_transfers'
  )
ORDER BY tablename, indexname
LIMIT 150;

-- 4) RLS state on core tables and security_invoker options on financial views.
SELECT
  c.relname AS relation_name,
  c.relkind AS relation_kind,
  c.relrowsecurity AS row_level_security_enabled,
  c.relforcerowsecurity AS force_row_level_security,
  c.reloptions AS relation_options
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'admins', 'students', 'courses', 'cash_boxes',
    'enrollments', 'payments', 'expenses', 'cash_box_transfers',
    'enrollment_balances', 'cash_box_balances',
    'course_financial_summary', 'dashboard_metrics'
  )
ORDER BY c.relname
LIMIT 30;
