-- Stores only a one-way hash of Supabase session IDs to prevent duplicate
-- Telegram alerts. No email address or IP address is persisted in this table.
BEGIN;

CREATE TABLE IF NOT EXISTS public.login_alert_dedupe (
  session_hash TEXT PRIMARY KEY
    CHECK (session_hash ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_alert_dedupe_created_at
  ON public.login_alert_dedupe (created_at);

ALTER TABLE public.login_alert_dedupe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_alert_dedupe FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.login_alert_dedupe FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.login_alert_dedupe TO service_role;

COMMIT;
