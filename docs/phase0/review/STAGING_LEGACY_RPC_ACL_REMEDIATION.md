# Staging Legacy Write RPC ACL Remediation Record

**Status:** executed and independently verified on Staging 2026-11-14 after explicit operation-specific approval.
**Target:** Staging `kxdfconqflveqeozanaw` (`trainerpro-phase0-staging`).
**Production:** read-only; no Production operation is proposed.

## Finding and evidence

Before the change, Staging catalog evidence recorded all eight routines below as `anon=yes / authenticated=yes / service_role=yes`; Production records `no / no / yes`. The Staging ACL expansion also found PUBLIC EXECUTE and explicit anon EXECUTE on these public routines. Static body review found each legacy write function checks `public.is_admin()` (active-admin identity) without checking the operation-specific permission enforced by the RBAC endpoint.

The application source calls the corresponding `rbac_*` routines; a repository search found no direct `supabase.rpc()` calls to these eight legacy names in `src/` or `supabase/functions/`. External consumers outside this repository have not been ruled out. The permission-checked wrappers are `SECURITY DEFINER` owned by `postgres` and invoke the legacy implementations after their permission checks, so restricting direct API EXECUTE preserves those wrapper calls under the audited ownership model. The preflight immediately before execution reconfirmed the owners, wrapper definitions, and grants.

Evidence: [current callable routine matrix](../evidence/CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md), [Staging function body review](../evidence/STAGING_RPC_BODY_REVIEW.md), and archived [RBAC write endpoint source](../migrations-snapshot/20261021224905_rbac_permission_checked_write_endpoints.sql).

## Applied ACL scope

Revoke direct EXECUTE from `PUBLIC`, `anon`, and `authenticated`, then retain `service_role` for each exact legacy signature. This matches the current Production ACL boundary and leaves the RBAC wrapper grants unchanged.

| Legacy signature | RBAC wrapper / required permission |
|---|---|
| `public.create_cash_box(character varying,character varying,character varying,numeric,text)` | `rbac_create_cash_box` / `finance.cash_boxes.create` |
| `public.enroll_student(uuid,uuid,numeric,text)` | `rbac_enroll_student` / `enrollments.create` |
| `public.record_expense(uuid,numeric,date,text,text,text,uuid)` | `rbac_record_expense` / `finance.expenses.record` |
| `public.record_payment(uuid,uuid,numeric,date,text,text,text)` | `rbac_record_payment` / `finance.payments.record` |
| `public.set_enrollment_status(uuid,text)` | `rbac_set_enrollment_status` / `enrollments.update_status` |
| `public.transfer_between_boxes(uuid,uuid,numeric,date,text)` | `rbac_transfer_between_boxes` / `finance.transfers.create` |
| `public.void_expense(uuid,text)` | `rbac_void_expense` / `finance.expenses.void` |
| `public.void_payment(uuid,text)` | `rbac_void_payment` / `finance.payments.void` |

The exact GRANT/REVOKE sequence was applied only after a read-only preflight confirmed all eight signatures, owners, current ACLs, and RBAC wrapper definitions/owners. The current Data API configuration was not separately captured. Do not use a blanket revoke or alter default privileges.

## Preflight and bounded consumer check

1. Repository searches found no direct frontend or Edge Function calls to the legacy routine names. External integrations outside the repository could not be exhaustively identified.
2. A read-only REST-log query for the 24 hours ending `2026-11-14T16:46:13Z` returned no requests to the eight exact RPC paths. This bounded result cannot rule out dormant external consumers.
3. Immediately before execution, project metadata confirmed ref `kxdfconqflveqeozanaw`, name `trainerpro-phase0-staging`, status `ACTIVE_HEALTHY`, PostgreSQL 17.11.
4. Explicit approval was received for this exact eight-function Staging ACL correction. The transaction's in-database assertions passed and it committed. No unexpected result occurred.

## Verification plan and results

The preflight and post-commit checks captured direct ACL entries and effective privileges for `PUBLIC`, `anon`, `authenticated`, and `service_role` on all eight legacy routines and all eight RBAC wrappers. Expected legacy result after change: `false / false / false / true`. Expected wrapper result: unchanged from the preflight, with authenticated access retained where the app uses the wrapper.

Post-commit SELECT verification returned the same result for all eight legacy routines: ACL `{postgres=X/postgres,service_role=X/postgres}`; effective `anon=false`, `authenticated=false`, `service_role=true`, and `PUBLIC EXECUTE=false`. All eight RBAC wrappers remained executable by authenticated and service_role. The transaction asserted those wrapper grants before commit. No routine was invoked; no application rows, outbox rows, or migration-ledger rows changed.

Fresh catalog aggregation found 76 total public/private routines, 59 database-callable by anon, 66 by authenticated, and 76 by service_role. Public non-trigger SECURITY DEFINER RPC candidates are now 55 anon / 56 authenticated. Supabase Security Advisor independently confirmed 55 / 56 at `2026-11-14T16:49:24.597Z`.

Behavior tests remain unrun. After separately approved synthetic identity setup, test that restricted roles cannot perform unauthorized operations through the RBAC wrappers and that a permitted role can use its authorized wrapper against disposable fixtures in a rollback transaction. Do not invoke live notification dispatchers; inspect outbox rows only. Historical synthetic account credentials remain considered exposed.

## Decision boundary

This record documents only the approved Staging ACL operation. It does not authorize any additional database operation, migration repair, migration-ledger edit, project lifecycle action, deployment, or Production change. Keep Candidate 4 on HOLD and keep all candidate SQL outside `supabase/migrations/`.
