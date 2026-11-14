# Production Column, Comment, and Constraint Capture — 2026-11-14

**Project:** `urmkcixqpoqkiosihhal` (TrainerPro, Production), verified `ACTIVE_HEALTHY` immediately before the query. **Captured:** approximately `2026-11-14 20:04 UTC`.

One read-only `SELECT` queried `information_schema.columns`, `pg_constraint`, `pg_class`, `pg_namespace`, `pg_description`, and `pg_attribute`. It returned metadata only; no application rows were read, no routine was invoked, and no writes were made.

## Current columns

| Table | Column(s) | Current definition |
|---|---|---|
| `admins` | `is_active` | `boolean NOT NULL DEFAULT true` |
| `admins` | `is_owner` | `boolean NOT NULL DEFAULT false` |
| `students` | `country`, `governorate`, `workplace`, `study_year` | Each `text NULL`, no default |
| `courses` | `default_cost_usd` | `numeric(12,2) NULL`, no default |
| `cash_boxes` | `opening_balance_usd` | `numeric(12,2) NOT NULL DEFAULT 0` |

The same query confirmed the already documented `payments.receipt_number` type/default/nullability and the payment/expense void metadata columns.

## Current constraint validation

| Table | Constraint | Current definition | Validated |
|---|---|---|---:|
| `cash_boxes` | `cash_boxes_opening_balance_usd_nonnegative` | `CHECK (opening_balance_usd >= 0)` | Yes |
| `courses` | `courses_default_cost_usd_nonnegative` | `CHECK (default_cost_usd IS NULL OR default_cost_usd >= 0)` | Yes |
| `enrollments` | `enrollments_agreed_currency_check` | `CHECK (agreed_currency IN ('EGP', 'USD'))` | Yes |
| `payments` | `payments_currency_check` | `CHECK (currency IN ('EGP', 'USD'))` | Yes |

These are current catalog states. Validation state does not prove which migration executed the validation.

## Current comments

| Object | Current comment |
|---|---|
| `admin_roles` | RBAC role catalog. Direct client access is revoked; use reviewed owner-authorized operations. |
| `permission_catalog` | Stable application permission keys. Direct client access is revoked. |
| `admin_role_permissions` | Role-to-permission mapping. Direct client access is revoked. |
| `admin_audit_log` | Append-only audit trail for administrator and role changes. Direct client access is revoked. |
| `admins.is_owner` | Protected platform owner marker; unique across admins and not assignable through normal role changes. |
| `admins.is_active` | Database-enforced administrator enablement state for future RBAC cutover. |
| `platform_audit_events` | Append-only allowlisted platform events. Store identifiers and event metadata only; never passwords, tokens, IP addresses, message bodies, or arbitrary client metadata. |
| `telegram_notification_outbox` | Server-side retryable delivery state for the single administrator Telegram group. Never store bot tokens, Telegram response bodies, or rendered message text. |
| `platform_notification_settings` | Owner-controlled settings for shared platform notifications; group language defaults to Arabic. |

These comments and definitions support only their corresponding current-state statement comparisons; they do not establish historical migration execution.
