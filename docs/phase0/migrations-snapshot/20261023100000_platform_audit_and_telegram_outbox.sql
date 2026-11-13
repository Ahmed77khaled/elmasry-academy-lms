-- LOCAL DRAFT ONLY — do not apply to any Supabase project yet.
-- Adds a generic append-only platform event ledger and a retryable Telegram
-- group-delivery outbox. This migration does not emit events or send messages.
--
-- Preconditions to verify against the intended database before application:
--   * the RBAC foundation has created schema private;
--   * Supabase roles anon, authenticated, and service_role exist;
--   * the canonical public.admins/auth schema and existing migrations are known.
-- Review and adapt this draft after the live schema and migration history are
-- independently verified. Never apply it to production as part of this stage.

BEGIN;

DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    RAISE EXCEPTION 'Preflight failed: expected private schema from the RBAC foundation.';
  END IF;

  IF EXISTS (
    SELECT required_role.role_name
    FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS required_role(role_name)
    WHERE NOT EXISTS (
      SELECT 1 FROM pg_roles AS actual_role
      WHERE actual_role.rolname = required_role.role_name
    )
  ) THEN
    RAISE EXCEPTION 'Preflight failed: expected Supabase roles anon, authenticated, and service_role.';
  END IF;

  IF to_regclass('public.admin_audit_log') IS NULL
     OR to_regclass('public.payments') IS NULL
     OR to_regclass('public.expenses') IS NULL
     OR to_regclass('public.cash_box_transfers') IS NULL
     OR to_regclass('public.cash_boxes') IS NULL
     OR to_regclass('public.login_alert_dedupe') IS NULL
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_audit_log' AND column_name='action')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_audit_log' AND column_name='actor_auth_user_id')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_audit_log' AND column_name='target_auth_user_id')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='payment_id')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='voided_at')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='voided_by')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='expense_id')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='voided_at')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='voided_by')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cash_box_transfers' AND column_name='transfer_id')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cash_box_transfers' AND column_name='added_by')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cash_boxes' AND column_name='cash_box_id')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cash_boxes' AND column_name='is_active') THEN
    RAISE EXCEPTION 'Preflight failed: the canonical RBAC and financial audit source tables/columns were not found.';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.login_alert_dedupe', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.login_alert_dedupe', 'INSERT') THEN
    RAISE EXCEPTION 'Preflight failed: service_role must be able to read and insert login session fingerprints.';
  END IF;
END
$preflight$;

CREATE TABLE IF NOT EXISTS public.platform_audit_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN (
    'auth.login_succeeded',
    'auth.failed_sign_in_threshold',
    'admin.invited',
    'admin.enabled',
    'admin.disabled',
  'admin.role_changed',
    'admin.role_catalog_changed',
    'admin.owner_changed',
    'admin.permissions_changed',
    'branding.logo_changed',
    'security.authorization_denied',
    'finance.payment_voided',
    'finance.expense_voided',
    'finance.transfer_created',
    'finance.cash_box_archived'
  )),
  outcome text NOT NULL CHECK (outcome IN ('success', 'denied', 'failure')),
  source text NOT NULL CHECK (source IN (
    'supabase_auth', 'lms_app', 'database_rpc', 'edge_function',
    'admin_audit_trigger', 'database_trigger'
  )),
  actor_auth_user_id uuid,
  target_auth_user_id uuid,
  subject_type text CHECK (subject_type IN (
    'admin', 'role', 'student', 'course', 'enrollment', 'payment',
    'expense', 'cash_box', 'cash_box_transfer', 'auth_session'
  )),
  subject_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((subject_type IS NULL) = (subject_id IS NULL))
);

CREATE INDEX IF NOT EXISTS platform_audit_events_created_at_idx
  ON public.platform_audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS platform_audit_events_type_created_idx
  ON public.platform_audit_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS platform_audit_events_actor_created_idx
  ON public.platform_audit_events (actor_auth_user_id, created_at DESC);

CREATE OR REPLACE FUNCTION private.prevent_platform_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
BEGIN
  RAISE EXCEPTION 'Platform audit events are append-only.' USING ERRCODE = '42501';
  RETURN OLD;
END;
$function$;

REVOKE ALL ON FUNCTION private.prevent_platform_audit_event_mutation()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_platform_audit_events_immutable
  ON public.platform_audit_events;
CREATE TRIGGER trg_platform_audit_events_immutable
  BEFORE UPDATE OR DELETE ON public.platform_audit_events
  FOR EACH ROW EXECUTE FUNCTION private.prevent_platform_audit_event_mutation();

DROP TRIGGER IF EXISTS trg_platform_audit_events_no_truncate
  ON public.platform_audit_events;
CREATE TRIGGER trg_platform_audit_events_no_truncate
  BEFORE TRUNCATE ON public.platform_audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION private.prevent_platform_audit_event_mutation();

ALTER TABLE public.platform_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.platform_audit_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.platform_audit_events TO service_role;

CREATE TABLE IF NOT EXISTS public.telegram_notification_outbox (
  notification_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.platform_audit_events(event_id)
    ON DELETE RESTRICT,
  destination_key text NOT NULL DEFAULT 'admin_group'
    CHECK (destination_key = 'admin_group'),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'retry', 'sent', 'dead_letter')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 8),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  last_failure_category text CHECK (last_failure_category IN (
    'network', 'telegram_api', 'rate_limited', 'invalid_destination',
    'configuration', 'unknown'
  )),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, destination_key),
  CHECK ((status = 'sent') = (sent_at IS NOT NULL)),
  CHECK ((status = 'processing') = (lease_until IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS telegram_outbox_due_idx
  ON public.telegram_notification_outbox (next_attempt_at, created_at)
  WHERE status IN ('pending', 'retry');
CREATE INDEX IF NOT EXISTS telegram_outbox_lease_idx
  ON public.telegram_notification_outbox (lease_until)
  WHERE status = 'processing';

ALTER TABLE public.telegram_notification_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_notification_outbox FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.telegram_notification_outbox
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.telegram_notification_outbox
  TO service_role;

-- Login alert requests enqueue one fixed event atomically. This narrow
-- SECURITY INVOKER RPC cannot accept a client-controlled event type or payload.
CREATE OR REPLACE FUNCTION public.enqueue_admin_login_notification(
  p_admin_user_id uuid,
  p_session_hash text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_event_id uuid;
  v_claimed_session_hash text;
BEGIN
  IF p_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Administrator user ID is required.' USING ERRCODE = '22004';
  END IF;
  IF p_session_hash IS NULL OR p_session_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'A SHA-256 session hash is required.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.login_alert_dedupe (session_hash)
  VALUES (p_session_hash)
  ON CONFLICT (session_hash) DO NOTHING
  RETURNING session_hash INTO v_claimed_session_hash;

  IF v_claimed_session_hash IS NULL THEN RETURN NULL; END IF;

  INSERT INTO public.platform_audit_events (
    event_type, outcome, source, actor_auth_user_id, target_auth_user_id
  ) VALUES (
    'auth.login_succeeded', 'success', 'edge_function',
    p_admin_user_id, p_admin_user_id
  ) RETURNING event_id INTO v_event_id;

  INSERT INTO public.telegram_notification_outbox (event_id)
  VALUES (v_event_id);

  RETURN v_event_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.enqueue_admin_login_notification(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_admin_login_notification(uuid, text)
  TO service_role;

-- Trigger functions are SECURITY DEFINER so they can append to forced-RLS
-- tables in the same transaction as their source event. They accept no caller
-- input and map only fixed, reviewed source columns/actions.
CREATE OR REPLACE FUNCTION private.route_admin_audit_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_event_type text;
  v_event_id uuid;
BEGIN
  v_event_type := CASE NEW.action
    WHEN 'admin_invited' THEN 'admin.invited'
    WHEN 'admin_enabled' THEN 'admin.enabled'
    WHEN 'admin_disabled' THEN 'admin.disabled'
    WHEN 'admin_role_changed' THEN 'admin.role_changed'
    WHEN 'owner_claimed' THEN 'admin.owner_changed'
    WHEN 'owner_transferred' THEN 'admin.owner_changed'
    WHEN 'owner_added' THEN 'admin.owner_changed'
    WHEN 'owner_removed' THEN 'admin.owner_changed'
    WHEN 'role_created' THEN 'admin.role_catalog_changed'
    WHEN 'role_updated' THEN 'admin.role_catalog_changed'
    WHEN 'role_deleted' THEN 'admin.role_catalog_changed'
    WHEN 'role_permissions_changed' THEN 'admin.permissions_changed'
    WHEN 'branding_logo_changed' THEN 'branding.logo_changed'
    ELSE NULL
  END;

  IF v_event_type IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.platform_audit_events (
    event_type, outcome, source, actor_auth_user_id, target_auth_user_id,
    subject_type, subject_id, occurred_at
  ) VALUES (
    v_event_type, 'success', 'admin_audit_trigger', NEW.actor_auth_user_id,
    NEW.target_auth_user_id,
    CASE WHEN NEW.target_auth_user_id IS NULL THEN NULL ELSE 'admin' END,
    NEW.target_auth_user_id, COALESCE(NEW.created_at, clock_timestamp())
  ) RETURNING event_id INTO v_event_id;

  INSERT INTO public.telegram_notification_outbox (event_id)
  VALUES (v_event_id);
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.route_admin_audit_notification()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS trg_admin_audit_log_telegram_outbox
  ON public.admin_audit_log;
CREATE TRIGGER trg_admin_audit_log_telegram_outbox
  AFTER INSERT ON public.admin_audit_log
  FOR EACH ROW EXECUTE FUNCTION private.route_admin_audit_notification();

CREATE OR REPLACE FUNCTION private.route_financial_telegram_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_event_type text;
  v_actor_auth_user_id uuid;
  v_subject_type text;
  v_subject_id uuid;
  v_event_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'payments' THEN
    IF TG_OP <> 'UPDATE' OR OLD.voided_at IS NOT NULL OR NEW.voided_at IS NULL THEN
      RETURN NEW;
    END IF;
    v_event_type := 'finance.payment_voided';
    v_actor_auth_user_id := NEW.voided_by;
    v_subject_type := 'payment';
    v_subject_id := NEW.payment_id;
  ELSIF TG_TABLE_NAME = 'expenses' THEN
    IF TG_OP <> 'UPDATE' OR OLD.voided_at IS NOT NULL OR NEW.voided_at IS NULL THEN
      RETURN NEW;
    END IF;
    v_event_type := 'finance.expense_voided';
    v_actor_auth_user_id := NEW.voided_by;
    v_subject_type := 'expense';
    v_subject_id := NEW.expense_id;
  ELSIF TG_TABLE_NAME = 'cash_box_transfers' THEN
    IF TG_OP <> 'INSERT' THEN RETURN NEW; END IF;
    v_event_type := 'finance.transfer_created';
    v_actor_auth_user_id := NEW.added_by;
    v_subject_type := 'cash_box_transfer';
    v_subject_id := NEW.transfer_id;
  ELSIF TG_TABLE_NAME = 'cash_boxes' THEN
    IF TG_OP <> 'UPDATE' OR OLD.is_active IS NOT TRUE OR NEW.is_active IS NOT FALSE THEN
      RETURN NEW;
    END IF;
    v_event_type := 'finance.cash_box_archived';
    v_actor_auth_user_id := auth.uid();
    v_subject_type := 'cash_box';
    v_subject_id := NEW.cash_box_id;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.platform_audit_events (
    event_type, outcome, source, actor_auth_user_id,
    subject_type, subject_id, occurred_at
  ) VALUES (
    v_event_type, 'success', 'database_trigger', v_actor_auth_user_id,
    v_subject_type, v_subject_id, clock_timestamp()
  ) RETURNING event_id INTO v_event_id;

  INSERT INTO public.telegram_notification_outbox (event_id)
  VALUES (v_event_id);
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.route_financial_telegram_notification()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS trg_payments_telegram_notification ON public.payments;
CREATE TRIGGER trg_payments_telegram_notification
  AFTER UPDATE OF voided_at ON public.payments
  FOR EACH ROW EXECUTE FUNCTION private.route_financial_telegram_notification();

DROP TRIGGER IF EXISTS trg_expenses_telegram_notification ON public.expenses;
CREATE TRIGGER trg_expenses_telegram_notification
  AFTER UPDATE OF voided_at ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION private.route_financial_telegram_notification();

DROP TRIGGER IF EXISTS trg_cash_box_transfers_telegram_notification
  ON public.cash_box_transfers;
CREATE TRIGGER trg_cash_box_transfers_telegram_notification
  AFTER INSERT ON public.cash_box_transfers
  FOR EACH ROW EXECUTE FUNCTION private.route_financial_telegram_notification();

DROP TRIGGER IF EXISTS trg_cash_boxes_archive_telegram_notification
  ON public.cash_boxes;
CREATE TRIGGER trg_cash_boxes_archive_telegram_notification
  AFTER UPDATE OF is_active ON public.cash_boxes
  FOR EACH ROW WHEN (OLD.is_active IS TRUE AND NEW.is_active IS FALSE)
  EXECUTE FUNCTION private.route_financial_telegram_notification();

-- Atomic worker claim: concurrent invocations skip rows already leased by
-- another worker. Expired leases can be reclaimed after a crash, up to eight
-- attempts; an expired final attempt is moved to dead_letter.
CREATE OR REPLACE FUNCTION public.claim_telegram_notifications(
  p_limit integer DEFAULT 10,
  p_lease_seconds integer DEFAULT 60
)
RETURNS TABLE (
  notification_id uuid,
  event_id uuid,
  event_type text,
  outcome text,
  occurred_at timestamptz,
  attempt_count integer,
  lease_until timestamptz
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  -- Keep the database claim contract aligned with the dispatcher's eight-attempt
  -- limit. If the worker crashed during the final attempt, expire the lease into
  -- a terminal state instead of allowing another delivery attempt.
  UPDATE public.telegram_notification_outbox AS o
  SET status = 'dead_letter',
      lease_until = NULL,
      next_attempt_at = clock_timestamp(),
      last_failure_category = COALESCE(o.last_failure_category, 'unknown')
  WHERE o.attempt_count >= 8
    AND (
      o.status IN ('pending', 'retry')
      OR (o.status = 'processing' AND o.lease_until <= clock_timestamp())
    );

  RETURN QUERY
  WITH candidates AS (
    SELECT o.notification_id
    FROM public.telegram_notification_outbox AS o
    WHERE (
      (o.status IN ('pending', 'retry') AND o.next_attempt_at <= clock_timestamp())
      OR (o.status = 'processing' AND o.lease_until <= clock_timestamp())
    )
      AND o.attempt_count < 8
    ORDER BY o.next_attempt_at, o.created_at
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 10)
    FOR UPDATE SKIP LOCKED
  ), claimed AS (
    UPDATE public.telegram_notification_outbox AS o
    SET status = 'processing',
        attempt_count = o.attempt_count + 1,
        last_attempt_at = clock_timestamp(),
        lease_until = clock_timestamp() + make_interval(
          secs => LEAST(GREATEST(COALESCE(p_lease_seconds, 60), 15), 300)
        ),
        last_failure_category = NULL
    FROM candidates AS c
    WHERE o.notification_id = c.notification_id
    RETURNING o.notification_id, o.event_id, o.attempt_count, o.lease_until
  )
  SELECT c.notification_id, e.event_id, e.event_type, e.outcome,
         e.occurred_at, c.attempt_count, c.lease_until
  FROM claimed AS c
  JOIN public.platform_audit_events AS e ON e.event_id = c.event_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_telegram_notifications(integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_telegram_notifications(integer, integer)
  TO service_role;

COMMENT ON TABLE public.platform_audit_events IS
  'Append-only allowlisted platform events. Store identifiers and event metadata only; never passwords, tokens, IP addresses, message bodies, or arbitrary client metadata.';
COMMENT ON TABLE public.telegram_notification_outbox IS
  'Server-side retryable delivery state for the single administrator Telegram group. Never store bot tokens, Telegram response bodies, or rendered message text.';
COMMENT ON FUNCTION public.claim_telegram_notifications(integer, integer) IS
  'Atomically leases due Telegram outbox rows for the service-role dispatcher; uses SKIP LOCKED and caps processing at eight attempts.';
COMMENT ON FUNCTION public.enqueue_admin_login_notification(uuid, text) IS
  'Atomically deduplicates a session hash and records a successful LMS administrator login plus its group notification; callable only by service_role.';

COMMIT;
