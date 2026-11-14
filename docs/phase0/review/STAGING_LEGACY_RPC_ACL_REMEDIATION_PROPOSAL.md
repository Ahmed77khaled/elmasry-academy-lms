# Staging Legacy Write RPC ACL Remediation Proposal

**Status:** prepared for review only; not executed and not an active migration.
**Target if separately approved:** Staging `kxdfconqflveqeozanaw`.
**Production:** read-only; no Production operation is proposed.

## Finding and evidence

The current Staging catalog matrix records all eight routines below as `anon=yes / authenticated=yes / service_role=yes`; Production records `no / no / yes`. The Staging ACL expansion also finds PUBLIC EXECUTE and explicit anon EXECUTE on these public routines. Static body review finds each legacy write function checks `public.is_admin()` (active-admin identity) without checking the operation-specific permission enforced by the RBAC endpoint.

The application source calls the corresponding `rbac_*` routines; a repository search found no direct `supabase.rpc()` calls to these eight legacy names in `src/` or `supabase/functions/`. External consumers outside this repository have not been ruled out. The permission-checked wrappers are `SECURITY DEFINER` owned by `postgres` and invoke the legacy implementations after their permission checks, so restricting direct API EXECUTE should preserve those wrapper calls under the audited ownership model. Reconfirm owner and wrapper definitions in a fresh read-only Staging capture before any grant change.

Evidence: [current callable routine matrix](../evidence/CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md), [Staging function body review](../evidence/STAGING_RPC_BODY_REVIEW.md), and archived [RBAC write endpoint source](../migrations-snapshot/20261021224905_rbac_permission_checked_write_endpoints.sql).

## Exact proposed scope

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

The exact GRANT/REVOKE sequence should be generated only after a read-only preflight confirms all eight signatures, owners, current ACLs, RBAC wrapper definitions/owners, and Data API exposure. If any signature or owner differs from this evidence, stop and revise the proposal. Do not use a blanket revoke or alter default privileges.

## Required gates before Staging execution

1. Identify and contact owners of any external integration that could call the legacy RPCs directly. Absence of frontend call sites is not proof there are no external consumers.
2. Obtain operation-specific approval for the exact eight-function ACL change on Staging. This document is not that approval.
3. Immediately before execution, independently verify the project ref is `kxdfconqflveqeozanaw`.
4. Apply the exact transaction on Staging only; inspect the verification query before commit and roll back on any unexpected result.

## Verification plan

Before and after the proposed change, capture direct ACL entries and effective privileges for `PUBLIC`, `anon`, `authenticated`, and `service_role` on all eight legacy routines and all eight RBAC wrappers. Expected legacy result after change: `false / false / false / true`. Expected wrapper result: unchanged from the preflight, with authenticated access retained where the app uses the wrapper.

After grant verification, test with disposable Staging identities only: prove a restricted role cannot use unauthorized operations through the RBAC wrappers, and prove a permitted role can use its authorized wrapper against disposable fixtures inside a rollback transaction. Do not invoke a legacy write RPC as an authenticated restricted user before the ACL change. Do not call live notification dispatchers; inspect outbox rows only. Synthetic Auth account password reset/recreation requires its own explicit approval before any interactive login.

## Decision boundary

This proposal does not authorize a database operation, migration repair, migration-ledger edit, project lifecycle action, deployment, or Production change. Keep Candidate 4 on HOLD and keep all candidate SQL outside `supabase/migrations/`.
