# Production Residual Catalog Capture — 2026-11-14

**Project:** `urmkcixqpoqkiosihhal` (TrainerPro, Production), rechecked as `ACTIVE_HEALTHY` before every query. **Capture window:** approximately 2026-11-14 20:55–21:08 UTC.

The read-only `SELECT` queries inspected only PostgreSQL catalog metadata, current routine definitions/ACLs, table column metadata, `storage.buckets` configuration for two named buckets, and named Storage policies. They did not read application table rows, call routines, or perform writes.

## Current catalog facts

- `private` exists with ACL `postgres=UC/postgres, authenticated=U/postgres`; `authenticated` has schema `USAGE` but not `CREATE`, and `anon` has neither.
- No `academy-branding` or `admin-avatars` row exists in `storage.buckets`. No `storage.objects` policy exists with any of the eight names used by the archived branding/avatar draft.
- `public.payment_receipt_number_seq` exists as a `bigint` sequence owned by `postgres`, owned by `payments.receipt_number`, and has ACL `postgres=rwU/postgres, service_role=rwU/postgres`; `anon` and `authenticated` lack `USAGE`.
- The exact current signatures of `enroll_student(uuid,uuid,numeric)`, `enroll_student(uuid,uuid)`, older `record_payment` overloads (3–6 arguments), older `record_expense` overloads (2–6 arguments), `void_payment(uuid)`, `void_expense(uuid)`, and older `transfer_between_boxes` overloads (4 arguments) are absent. The current longer signatures are separately listed in the routine matrix.
- Current `public.admin_audit_log_action_check` is validated and allows 14 action values, including both `branding_logo_changed` and `telegram_notification_language_changed`.
- Current relation columns were captured for `students`, the four RBAC tables, `login_alert_dedupe`, `platform_audit_events`, `telegram_notification_outbox`, and `platform_notification_settings`. `students` uses `student_id uuid` as its primary key (the oldest snapshot declares `id`); the RBAC columns/defaults match their archived table declarations; the login dedupe table has non-null `session_hash` and `created_at DEFAULT now()`; audit/outbox/settings columns and current checks/FKs are captured in the linked matrix rows. These metadata are used only for their corresponding current-schema comparisons.
- Current `service_role` table ACLs on `platform_audit_events` and `telegram_notification_outbox` include broader privileges than the archived statements' specific `GRANT` lists. This is recorded as a current ACL difference; it does not prove when the broader privilege was introduced.

## Reconciliation boundary

The absent Storage buckets/policies and routine signatures describe current Production state only. They do not prove that the archived SQL never ran or that no later statement removed an effect. Sequence existence/ownership and current columns likewise do not prove historical data updates, sequence values, or migration execution. No repair or change was made.
