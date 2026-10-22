-- Synthetic disposable PostgreSQL fixture for CI only.
-- This is not a copy of any hosted LMS database and must never be used there.

CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;

CREATE SCHEMA private;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

CREATE TABLE public.login_alert_dedupe (
  session_hash text PRIMARY KEY
);

CREATE TABLE public.admin_audit_log (
  audit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor_auth_user_id uuid,
  target_auth_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  payment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voided_at timestamptz,
  voided_by uuid
);

CREATE TABLE public.expenses (
  expense_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voided_at timestamptz,
  voided_by uuid
);

CREATE TABLE public.cash_box_transfers (
  transfer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  added_by uuid
);

CREATE TABLE public.cash_boxes (
  cash_box_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true
);
