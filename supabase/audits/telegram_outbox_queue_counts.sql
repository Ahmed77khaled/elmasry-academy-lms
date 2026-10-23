-- Read-only aggregate count of queued notification states.
-- Does not expose event identifiers, actors, subjects, or message content.

WITH expected_statuses(status) AS (
  VALUES ('pending'), ('processing'), ('retry'), ('sent'), ('dead_letter')
)
SELECT
  s.status,
  count(o.notification_id)::bigint AS notification_count
FROM expected_statuses s
LEFT JOIN public.telegram_notification_outbox o
  ON o.status = s.status
GROUP BY s.status
ORDER BY s.status;
