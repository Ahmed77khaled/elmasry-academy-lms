-- Read-only verification after applying 20261023100000_platform_audit_and_telegram_outbox.sql.
-- Reads PostgreSQL catalog metadata only. No application rows, writes, or network calls.

WITH checks AS (
  SELECT
    'event and outbox tables exist'::text AS check_name,
    to_regclass('public.platform_audit_events') IS NOT NULL
      AND to_regclass('public.telegram_notification_outbox') IS NOT NULL AS passed,
    'Both expected tables are present.'::text AS details

  UNION ALL
  SELECT
    'RLS enabled and forced on both tables',
    (SELECT c.relrowsecurity AND c.relforcerowsecurity
     FROM pg_class c WHERE c.oid = to_regclass('public.platform_audit_events'))
    AND
    (SELECT c.relrowsecurity AND c.relforcerowsecurity
     FROM pg_class c WHERE c.oid = to_regclass('public.telegram_notification_outbox')),
    'Both row-security catalog flags must be true.'

  UNION ALL
  SELECT
    'service_role table privileges are present',
    has_table_privilege('service_role', 'public.platform_audit_events', 'SELECT')
      AND has_table_privilege('service_role', 'public.platform_audit_events', 'INSERT')
      AND has_table_privilege('service_role', 'public.telegram_notification_outbox', 'SELECT')
      AND has_table_privilege('service_role', 'public.telegram_notification_outbox', 'INSERT')
      AND has_table_privilege('service_role', 'public.telegram_notification_outbox', 'UPDATE'),
    'service_role needs read/write access used by the enqueue and dispatch flow.'

  UNION ALL
  SELECT
    'client roles have no table access',
    NOT (
      has_table_privilege('anon', 'public.platform_audit_events', 'SELECT')
      OR has_table_privilege('anon', 'public.platform_audit_events', 'INSERT')
      OR has_table_privilege('anon', 'public.platform_audit_events', 'UPDATE')
      OR has_table_privilege('anon', 'public.platform_audit_events', 'DELETE')
      OR has_table_privilege('authenticated', 'public.platform_audit_events', 'SELECT')
      OR has_table_privilege('authenticated', 'public.platform_audit_events', 'INSERT')
      OR has_table_privilege('authenticated', 'public.platform_audit_events', 'UPDATE')
      OR has_table_privilege('authenticated', 'public.platform_audit_events', 'DELETE')
      OR has_table_privilege('anon', 'public.telegram_notification_outbox', 'SELECT')
      OR has_table_privilege('anon', 'public.telegram_notification_outbox', 'INSERT')
      OR has_table_privilege('anon', 'public.telegram_notification_outbox', 'UPDATE')
      OR has_table_privilege('anon', 'public.telegram_notification_outbox', 'DELETE')
      OR has_table_privilege('authenticated', 'public.telegram_notification_outbox', 'SELECT')
      OR has_table_privilege('authenticated', 'public.telegram_notification_outbox', 'INSERT')
      OR has_table_privilege('authenticated', 'public.telegram_notification_outbox', 'UPDATE')
      OR has_table_privilege('authenticated', 'public.telegram_notification_outbox', 'DELETE')
    ),
    'anon and authenticated should not access either internal table.'

  UNION ALL
  SELECT
    'RPC functions exist with expected security mode',
    EXISTS (
      SELECT 1 FROM pg_proc p
      WHERE p.oid = to_regprocedure('public.enqueue_admin_login_notification(uuid,text)')
        AND NOT p.prosecdef
    )
    AND EXISTS (
      SELECT 1 FROM pg_proc p
      WHERE p.oid = to_regprocedure('public.claim_telegram_notifications(integer,integer)')
        AND NOT p.prosecdef
    ),
    'Both RPCs should exist as SECURITY INVOKER functions.'

  UNION ALL
  SELECT
    'service_role can execute RPCs and clients cannot',
    has_function_privilege('service_role', 'public.enqueue_admin_login_notification(uuid,text)', 'EXECUTE')
      AND has_function_privilege('service_role', 'public.claim_telegram_notifications(integer,integer)', 'EXECUTE')
      AND NOT has_function_privilege('anon', 'public.enqueue_admin_login_notification(uuid,text)', 'EXECUTE')
      AND NOT has_function_privilege('authenticated', 'public.enqueue_admin_login_notification(uuid,text)', 'EXECUTE')
      AND NOT has_function_privilege('anon', 'public.claim_telegram_notifications(integer,integer)', 'EXECUTE')
      AND NOT has_function_privilege('authenticated', 'public.claim_telegram_notifications(integer,integer)', 'EXECUTE'),
    'Only the server-side service_role should execute these RPCs.'

  UNION ALL
  SELECT
    'trigger functions owned by an RLS-bypassing role',
    NOT EXISTS (
      SELECT 1
      FROM pg_proc p
      JOIN pg_roles r ON r.oid = p.proowner
      WHERE p.oid IN (
        to_regprocedure('private.prevent_platform_audit_event_mutation()'),
        to_regprocedure('private.route_admin_audit_notification()'),
        to_regprocedure('private.route_financial_telegram_notification()')
      )
        AND NOT r.rolbypassrls
    )
    AND (
      SELECT count(*) = 3
      FROM pg_proc p
      WHERE p.oid IN (
        to_regprocedure('private.prevent_platform_audit_event_mutation()'),
        to_regprocedure('private.route_admin_audit_notification()'),
        to_regprocedure('private.route_financial_telegram_notification()')
      )
    ),
    'SECURITY DEFINER trigger functions must be owned by a role that bypasses forced RLS.'

  UNION ALL
  SELECT
    'notification triggers are enabled',
    (
      SELECT count(*) = 5
      FROM pg_trigger t
      WHERE NOT t.tgisinternal
        AND t.tgenabled = 'O'
        AND (
          (t.tgrelid = to_regclass('public.admin_audit_log') AND t.tgname = 'trg_admin_audit_log_telegram_outbox')
          OR (t.tgrelid = to_regclass('public.payments') AND t.tgname = 'trg_payments_telegram_notification')
          OR (t.tgrelid = to_regclass('public.expenses') AND t.tgname = 'trg_expenses_telegram_notification')
          OR (t.tgrelid = to_regclass('public.cash_box_transfers') AND t.tgname = 'trg_cash_box_transfers_telegram_notification')
          OR (t.tgrelid = to_regclass('public.cash_boxes') AND t.tgname = 'trg_cash_boxes_archive_telegram_notification')
        )
    ),
    'Five event-routing triggers should be enabled on their source tables.'

  UNION ALL
  SELECT
    'append-only audit guards are enabled',
    (
      SELECT count(*) = 2
      FROM pg_trigger t
      WHERE NOT t.tgisinternal
        AND t.tgenabled = 'O'
        AND t.tgrelid = to_regclass('public.platform_audit_events')
        AND t.tgname IN ('trg_platform_audit_events_immutable', 'trg_platform_audit_events_no_truncate')
    ),
    'UPDATE/DELETE and TRUNCATE guards should both be enabled.'
)
SELECT check_name, passed, details
FROM checks
ORDER BY check_name;
