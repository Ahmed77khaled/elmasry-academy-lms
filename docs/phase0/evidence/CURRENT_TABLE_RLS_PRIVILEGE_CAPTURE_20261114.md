# Current Public-Table RLS and SELECT Privilege Capture — 2026-11-14

**Scope:** Read-only `pg_class`/`pg_namespace` metadata and `has_table_privilege` checks on Production `urmkcixqpoqkiosihhal` and Staging `kxdfconqflveqeozanaw`. Each project ref and active/healthy status was rechecked immediately before its `SELECT`. No application rows were read, no routine was invoked, and no schema or ACL was changed.

**Captured:** 2026-11-14 around 20:04 UTC.

## Results

The query covered every ordinary/partitioned public table and returned `relrowsecurity`, `relforcerowsecurity`, ACLs, and effective `SELECT` for `anon`, `authenticated`, and `service_role`.

| Project | Tables | RLS enabled | RLS forced | anon SELECT | authenticated SELECT | service_role SELECT |
|---|---:|---|---|---|---|---|
| Production | 16 | All 16 | 12 | None | None | All 16 |
| Staging | 16 | 8 core tables | None | None | None | All 16 |

**Production forced-RLS tables:** `admins`, `cash_box_transfers`, `cash_boxes`, `courses`, `enrollments`, `expenses`, `login_alert_dedupe`, `payments`, `platform_audit_events`, `platform_notification_settings`, `students`, and `telegram_notification_outbox`.

**Production RLS-enabled but not forced:** `admin_audit_log`, `admin_role_permissions`, `admin_roles`, and `permission_catalog`.

**Staging RLS-enabled tables:** `admins`, `cash_box_transfers`, `cash_boxes`, `courses`, `enrollments`, `expenses`, `payments`, and `students`. All eight have `relforcerowsecurity=false`.

**Staging RLS-disabled tables:** `admin_audit_log`, `admin_role_permissions`, `admin_roles`, `login_alert_dedupe`, `permission_catalog`, `platform_audit_events`, `platform_notification_settings`, and `telegram_notification_outbox`. All eight have `relforcerowsecurity=false`.

Although RLS is disabled on those eight Staging tables, this same capture found no effective table-level `SELECT` for `anon` or `authenticated` on any of the 16 public tables. The captured Staging ACL arrays list `postgres` and `service_role`; they do not list client roles. Thus the current table grants do not expose these relations through direct client SELECT. The disabled RLS state remains a defense-in-depth gap if grants are introduced later. No remediation is authorized or applied here.

Production's effective SELECT result is the same for the three API roles: no client-role SELECT, with `service_role` SELECT on all 16. Production RLS is enabled on every captured public table.

## Reconciliation use

This capture supports current-state classifications for the exact `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and `... FORCE ROW LEVEL SECURITY` statements. Current catalog state does not prove when those settings were applied or whether a later statement superseded them. The legacy `cash_transfers` relation does not exist in the current relation inventory; the current table is `cash_box_transfers`.
