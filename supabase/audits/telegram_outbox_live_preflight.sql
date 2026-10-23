-- Read-only preflight for 20261023100000_platform_audit_and_telegram_outbox.sql.
-- Run in the intended Supabase SQL Editor before considering the draft migration.
-- This script reads catalog metadata only; it does not inspect application rows,
-- mutate the database, or contact Telegram.

WITH
required_roles(role_name) AS (
  VALUES ('anon'), ('authenticated'), ('service_role')
),
required_columns(table_name, column_name, expected_udt_name) AS (
  VALUES
    ('admin_audit_log', 'action', 'text'),
    ('admin_audit_log', 'actor_auth_user_id', 'uuid'),
    ('admin_audit_log', 'target_auth_user_id', 'uuid'),
    ('admin_audit_log', 'created_at', 'timestamptz'),
    ('payments', 'payment_id', 'uuid'),
    ('payments', 'voided_at', 'timestamptz'),
    ('payments', 'voided_by', 'uuid'),
    ('expenses', 'expense_id', 'uuid'),
    ('expenses', 'voided_at', 'timestamptz'),
    ('expenses', 'voided_by', 'uuid'),
    ('cash_box_transfers', 'transfer_id', 'uuid'),
    ('cash_box_transfers', 'added_by', 'uuid'),
    ('cash_boxes', 'cash_box_id', 'uuid'),
    ('cash_boxes', 'is_active', 'bool'),
    ('login_alert_dedupe', 'session_hash', 'text')
),
required_objects(object_name) AS (
  VALUES
    ('platform_audit_events'),
    ('telegram_notification_outbox')
),
required_function_signatures(signature) AS (
  VALUES
    ('public.enqueue_admin_login_notification(uuid,text)'),
    ('public.claim_telegram_notifications(integer,integer)')
),
required_trigger_names(table_name, trigger_name) AS (
  VALUES
    ('admin_audit_log', 'trg_admin_audit_log_telegram_outbox'),
    ('payments', 'trg_payments_telegram_notification'),
    ('expenses', 'trg_expenses_telegram_notification'),
    ('cash_box_transfers', 'trg_cash_box_transfers_telegram_notification'),
    ('cash_boxes', 'trg_cash_boxes_archive_telegram_notification')
),
checks AS (
  SELECT
    'private schema exists'::text AS check_name,
    EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') AS passed,
    'Required by private trigger functions in the draft migration.'::text AS details

  UNION ALL
  SELECT
    'Supabase roles exist',
    NOT EXISTS (
      SELECT 1 FROM required_roles rr
      WHERE NOT EXISTS (SELECT 1 FROM pg_roles r WHERE r.rolname = rr.role_name)
    ),
    'Checks only the presence of anon, authenticated, and service_role.'

  UNION ALL
  SELECT
    'required source columns and types',
    NOT EXISTS (
      SELECT 1
      FROM required_columns rc
      LEFT JOIN information_schema.columns c
        ON c.table_schema = 'public'
       AND c.table_name = rc.table_name
       AND c.column_name = rc.column_name
      WHERE c.column_name IS NULL OR c.udt_name <> rc.expected_udt_name
    ),
    COALESCE((
      SELECT string_agg(
        rc.table_name || '.' || rc.column_name ||
        ' expected ' || rc.expected_udt_name ||
        ', found ' || COALESCE(c.udt_name, 'MISSING'),
        '; ' ORDER BY rc.table_name, rc.column_name
      )
      FROM required_columns rc
      LEFT JOIN information_schema.columns c
        ON c.table_schema = 'public'
       AND c.table_name = rc.table_name
       AND c.column_name = rc.column_name
      WHERE c.column_name IS NULL OR c.udt_name <> rc.expected_udt_name
    ), 'All required columns exist with expected PostgreSQL types.')

  UNION ALL
  SELECT
    'login_alert_dedupe service_role privileges',
    CASE
      WHEN to_regclass('public.login_alert_dedupe') IS NULL
        OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role')
      THEN false
      ELSE has_table_privilege('service_role', 'public.login_alert_dedupe', 'SELECT')
        AND has_table_privilege('service_role', 'public.login_alert_dedupe', 'INSERT')
    END,
    'The migration preflight requires service_role SELECT and INSERT on this table.'

  UNION ALL
  SELECT
    'login_alert_dedupe RLS enabled and forced',
    COALESCE((
      SELECT c.relrowsecurity AND c.relforcerowsecurity
      FROM pg_class c WHERE c.oid = to_regclass('public.login_alert_dedupe')
    ), false),
    'Checks catalog flags only; does not inspect rows or policy expressions.'

  UNION ALL
  SELECT
    'new target tables are absent',
    NOT EXISTS (
      SELECT 1 FROM required_objects o
      WHERE to_regclass('public.' || o.object_name) IS NOT NULL
    ),
    COALESCE((
      SELECT string_agg(o.object_name, ', ' ORDER BY o.object_name)
      FROM required_objects o
      WHERE to_regclass('public.' || o.object_name) IS NOT NULL
    ), 'Neither target table currently exists in the public schema.')

  UNION ALL
  SELECT
    'RPC signatures do not already exist',
    NOT EXISTS (
      SELECT 1 FROM required_function_signatures f
      WHERE to_regprocedure(f.signature) IS NOT NULL
    ),
    COALESCE((
      SELECT string_agg(f.signature, ', ' ORDER BY f.signature)
      FROM required_function_signatures f
      WHERE to_regprocedure(f.signature) IS NOT NULL
    ), 'Neither migration RPC signature currently exists.')

  UNION ALL
  SELECT
    'notification trigger names are unused',
    NOT EXISTS (
      SELECT 1
      FROM required_trigger_names rt
      JOIN pg_trigger t
        ON t.tgrelid = to_regclass('public.' || rt.table_name)
       AND t.tgname = rt.trigger_name
       AND NOT t.tgisinternal
    ),
    COALESCE((
      SELECT string_agg(rt.table_name || '.' || rt.trigger_name, ', ' ORDER BY rt.table_name)
      FROM required_trigger_names rt
      JOIN pg_trigger t
        ON t.tgrelid = to_regclass('public.' || rt.table_name)
       AND t.tgname = rt.trigger_name
       AND NOT t.tgisinternal
    ), 'No conflicting trigger names found on source tables.')
)
SELECT check_name, passed, details
FROM checks
ORDER BY check_name;
