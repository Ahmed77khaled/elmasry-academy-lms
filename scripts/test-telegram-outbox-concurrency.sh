#!/usr/bin/env bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 <<'SQL'
DELETE FROM public.telegram_notification_outbox;
INSERT INTO public.platform_audit_events (event_type, outcome, source)
VALUES ('auth.login_succeeded', 'success', 'edge_function'),
       ('auth.login_succeeded', 'success', 'edge_function');
WITH ordered_events AS (
  SELECT event_id, row_number() OVER (ORDER BY event_id) AS sequence
  FROM public.platform_audit_events
)
INSERT INTO public.telegram_notification_outbox (event_id, created_at, next_attempt_at)
SELECT event_id,
       clock_timestamp() + (sequence - 1) * interval '1 second',
       clock_timestamp() + (sequence - 1) * interval '1 second'
FROM ordered_events;
SQL

locked_id="$(psql -At -v ON_ERROR_STOP=1 -c \
  "SELECT notification_id FROM public.telegram_notification_outbox ORDER BY created_at LIMIT 1")"
[[ -n "$locked_id" ]]

psql -v ON_ERROR_STOP=1 -c \
  "BEGIN; SELECT notification_id FROM public.telegram_notification_outbox WHERE notification_id = '$locked_id' FOR UPDATE; SELECT pg_sleep(4); COMMIT" \
  >/tmp/telegram-outbox-lock.log 2>&1 &
lock_pid=$!
trap 'kill "$lock_pid" 2>/dev/null || true; wait "$lock_pid" 2>/dev/null || true' EXIT
sleep 1

claimed_id="$(psql -Atq -v ON_ERROR_STOP=1 -c \
  "SET ROLE service_role; SELECT notification_id FROM public.claim_telegram_notifications(1, 60); RESET ROLE;")"
if [[ -z "$claimed_id" || "$claimed_id" == "$locked_id" ]]; then
  echo "SKIP LOCKED contract failed: worker did not skip the row held by another transaction." >&2
  exit 1
fi

wait "$lock_pid"
trap - EXIT
printf '%s\n' 'Concurrent claim skipped the locked row in the disposable PostgreSQL fixture.'
