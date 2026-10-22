-- Contract checks against the synthetic CI fixture only.
DO $assertions$
DECLARE
  v_function_definition text;
BEGIN
  IF NOT (SELECT relrowsecurity AND relforcerowsecurity
          FROM pg_class WHERE oid = 'public.platform_audit_events'::regclass) THEN
    RAISE EXCEPTION 'platform_audit_events must enable and force RLS';
  END IF;
  IF NOT (SELECT relrowsecurity AND relforcerowsecurity
          FROM pg_class WHERE oid = 'public.telegram_notification_outbox'::regclass) THEN
    RAISE EXCEPTION 'telegram_notification_outbox must enable and force RLS';
  END IF;

  IF has_table_privilege('anon', 'public.platform_audit_events', 'SELECT')
     OR has_table_privilege('authenticated', 'public.telegram_notification_outbox', 'SELECT') THEN
    RAISE EXCEPTION 'client roles unexpectedly have access to private notification records';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.enqueue_admin_login_notification(uuid,text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.enqueue_admin_login_notification(uuid,text)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.claim_telegram_notifications(integer,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'RPC grants do not match the service-role-only contract';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('platform_audit_events', 'telegram_notification_outbox')
      AND column_name IN ('email', 'ip_address', 'message_body', 'bot_token', 'amount', 'student_name')
  ) THEN
    RAISE EXCEPTION 'sensitive payload columns unexpectedly exist in audit or outbox tables';
  END IF;

  SELECT pg_get_functiondef('public.claim_telegram_notifications(integer,integer)'::regprocedure)
    INTO v_function_definition;
  IF position('SKIP LOCKED' IN upper(v_function_definition)) = 0 THEN
    RAISE EXCEPTION 'claim function is missing SKIP LOCKED';
  END IF;

  BEGIN
    INSERT INTO public.platform_audit_events (event_type, outcome, source)
    VALUES ('auth.login_succeeded', 'success', 'edge_function');
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'postgres fixture owner unexpectedly could not insert audit event: %', SQLERRM;
  END;
END
$assertions$;

-- Trigger mapping is intentionally limited to known source actions.
INSERT INTO public.admin_audit_log (action, actor_auth_user_id, target_auth_user_id)
VALUES
  ('admin_invited', gen_random_uuid(), gen_random_uuid()),
  ('unrecognized_action', gen_random_uuid(), gen_random_uuid());

INSERT INTO public.payments (voided_at, voided_by)
VALUES (NULL, NULL)
RETURNING payment_id \gset payment_
UPDATE public.payments
SET voided_at = clock_timestamp(), voided_by = gen_random_uuid()
WHERE payment_id = :'payment_payment_id';

INSERT INTO public.expenses (voided_at, voided_by)
VALUES (NULL, NULL)
RETURNING expense_id \gset expense_
UPDATE public.expenses
SET voided_at = clock_timestamp(), voided_by = gen_random_uuid()
WHERE expense_id = :'expense_expense_id';

INSERT INTO public.cash_box_transfers (added_by) VALUES (gen_random_uuid());

INSERT INTO public.cash_boxes (is_active) VALUES (true)
RETURNING cash_box_id \gset cash_box_
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
UPDATE public.cash_boxes SET is_active = false
WHERE cash_box_id = :'cash_box_cash_box_id';
RESET request.jwt.claim.sub;

DO $assert_event_routing$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM public.platform_audit_events
  WHERE event_type IN (
    'admin.invited', 'finance.payment_voided', 'finance.expense_voided',
    'finance.transfer_created', 'finance.cash_box_archived'
  );
  IF v_count <> 5 THEN
    RAISE EXCEPTION 'expected five allowlisted source events, got %', v_count;
  END IF;
  IF EXISTS (SELECT 1 FROM public.platform_audit_events WHERE event_type = 'admin.unrecognized_action') THEN
    RAISE EXCEPTION 'unrecognized admin audit action was routed';
  END IF;
  IF (SELECT count(*) FROM public.telegram_notification_outbox) <> 5 THEN
    RAISE EXCEPTION 'each allowlisted source event must enqueue exactly one notification';
  END IF;
END
$assert_event_routing$;

-- Only a SHA-256-shaped session fingerprint is accepted; duplicate sessions enqueue once.
SET ROLE service_role;
DO $assert_login_dedupe$
DECLARE
  v_first_event_id uuid;
  v_duplicate_event_id uuid;
BEGIN
  v_first_event_id := public.enqueue_admin_login_notification(
    '00000000-0000-0000-0000-000000000001', repeat('a', 64)
  );
  v_duplicate_event_id := public.enqueue_admin_login_notification(
    '00000000-0000-0000-0000-000000000001', repeat('a', 64)
  );
  IF v_first_event_id IS NULL THEN
    RAISE EXCEPTION 'first login did not enqueue an event';
  END IF;
  IF v_duplicate_event_id IS NOT NULL THEN
    RAISE EXCEPTION 'duplicate session unexpectedly enqueued a second event';
  END IF;
  IF (SELECT count(*) FROM public.telegram_notification_outbox) <> 6 THEN
    RAISE EXCEPTION 'login deduplication created an incorrect outbox count';
  END IF;
  BEGIN
    PERFORM public.enqueue_admin_login_notification(
      '00000000-0000-0000-0000-000000000001', 'not-a-session-hash'
    );
    RAISE EXCEPTION 'invalid session fingerprint unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    NULL;
  END;
END
$assert_login_dedupe$;
RESET ROLE;

-- An expired lease at the attempt ceiling must become terminal, not be retried.
INSERT INTO public.platform_audit_events (event_type, outcome, source)
VALUES ('auth.login_succeeded', 'success', 'edge_function')
RETURNING event_id \gset retry_event_
INSERT INTO public.telegram_notification_outbox (
  event_id, status, attempt_count, lease_until
) VALUES (
  :'retry_event_event_id', 'processing', 8, clock_timestamp() - interval '1 second'
);

-- Audit rows are immutable for ordinary update/delete/truncate operations.
DO $assert_immutable$
BEGIN
  BEGIN
    UPDATE public.platform_audit_events SET outcome = 'denied';
    RAISE EXCEPTION 'audit update unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    DELETE FROM public.platform_audit_events;
    RAISE EXCEPTION 'audit delete unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    TRUNCATE public.platform_audit_events;
    RAISE EXCEPTION 'audit truncate unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END
$assert_immutable$;

-- A worker claim increments attempts, applies a lease, and returns only safe fields.
SET ROLE service_role;
SELECT count(*) AS claimed_count
FROM public.claim_telegram_notifications(1, 60);
RESET ROLE;

DO $assert_claim$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.telegram_notification_outbox
    WHERE status = 'dead_letter' AND attempt_count = 8
      AND lease_until IS NULL AND last_failure_category = 'unknown'
  ) THEN
    RAISE EXCEPTION 'expired final attempt was not moved to dead_letter';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.telegram_notification_outbox
    WHERE status = 'processing' AND attempt_count = 1 AND lease_until > clock_timestamp()
  ) THEN
    RAISE EXCEPTION 'claim did not create an active lease or increment attempt_count';
  END IF;
END
$assert_claim$;
