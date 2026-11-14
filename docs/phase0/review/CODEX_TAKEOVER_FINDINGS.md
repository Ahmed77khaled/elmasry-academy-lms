# Phase 0 Codex Takeover Findings

**Branch:** `codex/phase0-next`
**Review date:** 2026-11-14
**Database access this task:** Read-only catalog captures on Production (`urmkcixqpoqkiosihhal`) and Staging (`kxdfconqflveqeozanaw`), plus one explicitly approved, narrowly scoped Staging EXECUTE ACL transaction for two service-worker functions. No Production permissions/data, application data, migrations, or migration ledger were changed.

## Repository baseline

The checkout contains the React/TypeScript application (`src/`), Supabase Edge Functions and tests (`supabase/functions/`), the active migration chain (`supabase/migrations/`), 20 migration snapshots (`docs/phase0/migrations-snapshot/`), four draft candidates (`docs/phase0/drafts/migrations/`), evidence, read-only validation SQL and Phase 0 reports. `git status` was clean at the start. Candidate 4 remains **HOLD** and all candidates remain in drafts.

## Local checks

| Command | Result |
|---|---|
| `npm run typecheck` | PASS (`tsc --noEmit -p tsconfig.app.json`) |
| `npm run lint` | PASS (`eslint .`) |
| `npm run build` | PASS (Vite 8.3.5; 1,661 modules) |
| `npm run test` | PASS: 16 tests (4 request-epoch tests + 12 existing Edge Function tests) |
| `npm run test:telegram` | PASS: 12 tests, 0 failures; uses mocked delivery and no live Telegram call |

Dependencies were installed from the existing lockfile with `npm ci`; it reported 7 moderate audit findings. No package or lockfile edits were made.

## RPC exposure and security findings

### Evidence reconciliation

The headline count of **69 anon / 70 authenticated** is from Staging, not Production. Raw operations 101–102 target ref `kxdfconqflveqeozanaw`; operation 102 counts every `pg_proc` object in `public` without restricting `prokind` or routine category. The row-level output for operation 101 was not retained. A fresh read-only capture now lists all current routines in `public` and `private` on both projects in [CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md](../evidence/CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md).

The archived 70-entry SECURITY DEFINER source inventory describes Production but is not the full callable-routine inventory. Fresh Production data shows 76 routines total across `public` and `private`, 4 database-callable anon routines (all trigger helpers), 62 database-callable authenticated routines, and no anon-executable public non-trigger function candidate. In Staging, before the approved ACL corrections, the capture showed 76 total, 69 database-callable anon, 76 authenticated, and 65 anon/66 authenticated public non-trigger function candidates. After the worker change counts were 67/74 and 63/64; after the legacy-write change they are 59/66 and 55/56. Supabase Security Advisor independently reports the current 55 anon / 56 authenticated SECURITY DEFINER RPC endpoints reachable through `/rest/v1/rpc/`. EXECUTE and endpoint reachability do not alone prove unauthorized data access; review each function body and intended caller.

The read-only audit SQL (`validation/PHASE0_REMAINING_SECURITY_GAPS_READONLY.sql`, query 1) captures per-routine identity, owner, security mode, settings, effective role privileges, ACLs, and definitions. The archived 70 Production SECURITY DEFINER rows remain explicitly scoped in [PRODUCTION_SECURITY_DEFINER_70_ROUTINE_MATRIX.md](../evidence/PRODUCTION_SECURITY_DEFINER_70_ROUTINE_MATRIX.md). Current privileges for all `public`/`private` functions and procedures in both environments are in [CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md](../evidence/CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md), while [RPC_ROUTINE_EVIDENCE_CROSSWALK.md](../evidence/RPC_ROUTINE_EVIDENCE_CROSSWALK.md) connects that evidence to app calls and intended boundaries. Staging body review and exact routine group membership are in [STAGING_RPC_BODY_REVIEW.md](../evidence/STAGING_RPC_BODY_REVIEW.md). Security Advisor confirms HTTP reachability for its reported Staging SECURITY DEFINER endpoints; the full Data API schema setting was not separately captured.

### Routine classes and disposition

| Class (evidence) | Authorization/data boundary | Minimum intended caller | Finding |
|---|---|---|---|
| `private.prevent_*` and `private.route_*` trigger functions | Trigger-only: immutable audit guards and outbox routing; no direct API caller | No API role; trigger execution context | Keep direct EXECUTE unavailable. `private` schema USAGE is false for anon and true for authenticated in recorded audit output; schema visibility alone does not establish direct function access. |
| `private.has_permission(text)`, `private.is_platform_owner()` | Authenticated identity and active admin / owner predicates | `authenticated` for nested RPC checks; anon denied | Not a data API. Keep fixed `search_path`; maintain narrow grants. |
| `public.is_admin()`, `get_my_authorization()`, `can_claim_platform_owner()`, `claim_platform_owner()` | Self identity through `auth.uid()`; active-admin/claim predicates | `authenticated` (service role only where operationally needed) | Client calls `is_admin` and `get_my_authorization`; `claim_platform_owner` is used in setup UI. Validate function body and owner-claim single-use invariant. |
| `public.rbac_*` readers and writers | `private.has_permission(...)` and, for owner-management, `private.is_platform_owner()`; row/field projection by permissions | `authenticated` | Application uses these RPCs for operational and financial views and mutations. Retain authenticated access only after body-by-body authorization checks; no anon call site. |
| Unprefixed legacy writes (`create_cash_box`, `enroll_student`, `record_*`, `void_*`, `transfer_between_boxes`, `set_enrollment_status`) | `is_admin()` body check requires active admin but not operation-specific RBAC permission | Production and current Staging: service_role-only; Staging post-commit SELECT confirms anon/authenticated/PUBLIC blocked | Frontend uses the RBAC versions. Staging's former direct-call boundary is corrected. No restricted-role behavior test was run; see `STAGING_RPC_BODY_REVIEW.md` and `STAGING_LEGACY_RPC_ACL_REMEDIATION.md`. |
| Non-SECURITY DEFINER public routines | Enumerated in the fresh current matrix | Mixed: trigger helpers plus two service-worker routines that previously had broad grants; those two now have service_role-only EXECUTE on Staging | Review exact body and grants; invoker routines also require table privileges/RLS. No routine was invoked. |

**Production finding:** no anon-executable public function RPC candidate in the fresh capture; no grants were changed. **Staging worker correction:** following explicit operation-specific approval, EXECUTE on `claim_telegram_notifications(integer,integer)` and `enqueue_admin_login_notification(uuid,text)` was revoked from PUBLIC, anon, and authenticated and retained for service_role only. **Staging legacy-write correction:** following separate explicit approval, the same exact boundary was applied to the eight legacy write RPCs. Post-commit SELECT verified all eight ACLs and confirmed the eight RBAC wrappers retained authenticated execution. No business function was invoked, no application/outbox/ledger data changed, and no blanket ACL change was made. Security Advisor now reports 55 anon / 56 authenticated SECURITY DEFINER endpoints; body review continues for those remaining paths. The leaked-password-protection warning remains and no Auth settings changed.

### Application authorization review

`src/context/AuthContext.tsx` fetches current session on mount, asks `is_admin()`, and loads `get_my_authorization()`; auth-state events load authorization only after a positive admin check. It clears permissions when no session or non-admin is seen. `AppShell.tsx` gates page navigation and render on permissions; sensitive CRUD and read flows call `rbac_*` RPCs rather than direct table writes. `AdminAccessManagement.tsx` uses role/owner RPCs; login invokes a best-effort alert after sign-in. The detailed flow, page-permission map, server-boundary evidence and regression cases are in [APPLICATION_AUTHORIZATION_FLOW_REVIEW.md](../evidence/APPLICATION_AUTHORIZATION_FLOW_REVIEW.md).

Implemented in this follow-up:

1. Added a shared request epoch checked after async session/admin/authorization operations and invalidated on auth events, sign-out, and provider cleanup. Removed the unused `userId` parameter; server identity still comes from `auth.uid()`.
2. Initial session loading now fetches authorization only after a positive admin check, matching the auth-event path.
3. Explicit refresh starts a new request epoch, blocks app content while loading, and ignores stale results.
4. Added four Node tests for current-request selection, invalidation, next request, and ignoring late responses. Added an `npm test` script that runs these and the existing 12 Edge Function tests.

Remaining: tests cover the epoch helper but do not mount `AuthProvider` or mock the Supabase client. Add integration cases for sign-in, token refresh, account switch, sign-out rejection, inactive admin, normal user, and expired session when the project has a React testing environment. A transient `get_my_authorization()` failure intentionally keeps `authorizationReady=false`; `isAdmin` can remain true until a successful recheck, while protected route content stays blocked. Route gating remains a UX layer; server-side `has_permission` / `is_admin` checks are the enforcement boundary.

## Missing Staging cases prepared (not executed)

The missing Cash Box cases are documented in `review/STAGING_TEST_PLAN.md`. Run them only after explicit operation-specific Staging approval, fresh verification of ref `kxdfconqflveqeozanaw`, and clean disposable identities/fixtures. Use transactions and rollback wherever supported; never dispatch external notifications.

### Cash Boxes

| Case | Setup/action | Expected | Capture |
|---|---|---|---|
| Approved archive RPC | Active synthetic box; call `rbac_archive_cash_box(id)` as role with `finance.cash_boxes.update` | `true`; active→inactive once; second archive is idempotent or documented error | RPC result and before/after row |
| Negative opening balances | Call `rbac_create_cash_box_v2` with EGP `<0`, then USD `<0` separately | Each rejected; no row remains | SQLSTATE/message and row count |
| Upper-bound opening balances | Test exact max and max+smallest precision for EGP and USD independently | Max accepted (if contract says inclusive), over-limit rejected; verify no rounding bypass | Returned row and rejection |
| Hard delete | Direct `DELETE` of synthetic box inside rollback transaction under authenticated test identity | Trigger/policy rejects, row remains | SQLSTATE and row snapshot |
| Creator reassignment | Attempt update `added_by` from current creator to second synthetic auth UUID; separately attempt null as authenticated | Arbitrary reassignment rejected; only FK-driven auth deletion may null creator | SQLSTATE / row snapshot |
| Auth deletion FK | Create two disposable synthetic Auth users with reset credentials; assign one as creator through supported setup, delete that Auth user in Staging | `added_by` becomes NULL, both opening balances unchanged | Auth deletion result and cash box before/after |
| Archive outbox exactly once | Snapshot outbox count; archive through approved RPC; then change unrelated metadata on another box | One event for active→inactive transition; no event for metadata-only change; no external delivery/worker invocation | Outbox rows, trigger definition and worker state |

Never use a real admin identity. Existing four test passwords are exposed historically; reset or recreate those accounts before interactive auth tests after the required approval.

### Default privileges

Run the strengthened `validation/PHASE0_STAGING_DEFAULT_ACL_PROBE.sql` only on Staging. It checks the public table/sequence/function defaults and a private-schema function for global PUBLIC EXECUTE; it asserts role privileges, captures exploded ACL entries, rolls the transaction back, then checks all four objects were removed. This probe remains unexecuted pending operation-specific approval.

## Migration ledger reconciliation

Source set: 20 files under `migrations-snapshot/`; captured ledger: four versions (`20261021214608`, `20261022230000`, `20261023110000`, `20261030120000`). The [statement inventory](../evidence/MIGRATION_STATEMENT_MATRIX.md) parses the snapshots into 641 executable statements and records an evidence disposition for each: 31 `UNVERIFIABLE`, 34 `NOT APPLICABLE`, 61 `ABSENT`, 455 `EQUIVALENT` to current captured state, and 60 `DIFFERENT`. Current-state matches do not establish migration execution; differences include Production `cash_boxes.added_by` `ON DELETE NO ACTION` versus the Migration 008 declaration `ON DELETE SET NULL`. See the statement matrix for the supporting row-level evidence and [reconciliation report](../evidence/MIGRATION_RECONCILIATION.md) for the unresolved evidence classes. The ledger has no per-statement provenance or applied SQL hashes. Consequently, statements without retained exact live definition/data/ACL evidence remain **unverifiable**, even if a similarly named object exists. No repair or ledger edit is authorized.

| Version | Ledger | Statement-by-statement disposition from retained evidence | Migration disposition |
|---|---:|---|---|
| 20261015024100 | No | Each CREATE/ALTER/policy/index statement is unverified; archived snapshot contains broad anon/auth policies; later hardening reports removal but does not prove every effect | Unknown; statement diff required |
| 20261015024134 | No | Four view definitions reported by object name only; exact column order/types/security options and definitions not fully matched | Unknown |
| 20261015024155 | No | Function bodies and five explicit anon/auth grants are historical SQL; current legacy functions appear service_role-only, but exact per-statement trace/provenance absent | Partial drift strongly indicated; no full application proof |
| 20261015024209 | No | Constraint and seed effects reported by names/rows; exact seed values and all statements not matched | Unknown |
| 202610210005 | No | Objects/triggers reported present; each DDL/constraint/policy statement lacks exact live comparison | Unknown |
| 202610210006 | No | `is_admin()` exists but body differs from desired active-admin semantics; replacement objects need exact diff | Different/unknown; partial drift |
| 202610210007 | No | Table grants reportedly revoked; full column ACL, PUBLIC grants and RLS statement results not captured statement-wise | Unknown |
| 202610210008 | No | `added_by` FK action recorded as NO ACTION vs intended `ON DELETE SET NULL`; explicit confirmed difference; remaining trigger statements not all reconciled | Partial; drift confirmed |
| 20261021171218 | No | Trigger body includes creator nullification, but no ledger row; full statement set unverified | Object effect present; migration application unproven |
| 20261021214608 | Yes | Ledger row/table present; row alone does not prove body/index/constraint statements match snapshot | Ledger-recorded; effects unverifiable |
| 20261021223822 | No | RBAC objects reported present; catalog seeds, helper bodies, ACL and policies individually unverified | Unknown |
| 20261021224440 | No | Some list RPCs reported present; signature/body/grant statement checks incomplete | Unknown |
| 20261021224905 | No | Some write RPCs reported present; signature/body/grant statement checks incomplete | Unknown |
| 20261022225500 | No | `is_owner` reported present while local file contains Draft Only marker; no provenance of DDL | Unknown/conflict |
| 20261022230000 | Yes | Ledger row plus Draft Only marker; historical content/individual cutover effects not hash-verified | Ledger-recorded; conflict to resolve |
| 20261023090000 | No | Local Draft Only and reported absent `academy_branding`; confirm each statement absent before any future classification | Draft/not applied supported |
| 20261023100000 | No | Outbox/audit objects reported present while local file says Draft Only; each table/index/policy/trigger/seed statement and provenance unclear | Unknown/conflict |
| 20261023110000 | Yes | Ledger row/language RPC reported present; exact function, setting row and ACL not compared in full | Ledger-recorded; effects unverifiable |
| 20261030120000 | Yes | Ledger row and profile columns present; exact types/defaults/constraints/function/ACL statements unverified | Ledger-recorded; effects unverifiable |
| 20261030130000 | No | Currency columns/functions/constraints reported present; file has multiple statements and no exact full-definition comparison | Objects reported present; full application unproven |

**Completion gate:** the local statement inventory and all comparisons supported by the approved current-catalog evidence are complete. Thirty-one rows remain explicitly unresolved because six require historical application-row/sequence evidence, 24 describe intermediate DROP/purge effects that later DDL masks, and one is a transient `NOTIFY`. The present ledger has no statement-level provenance or applied SQL hashes. Resolving those gaps requires new, narrowly scoped authorization and/or trustworthy historical execution logs; current catalog reads cannot close them. Therefore the migration ledger reconciliation remains **incomplete / NO-GO** and no migration repair is proposed.

## Prioritized implementation plan

1. **Resolved on Staging — direct access to legacy writes:** eight exact functions are now service_role-only, matching Production. A 24-hour REST-log scan found no direct calls, but dormant external consumers remain unverified. Restricted-role RBAC behavior tests are still open and require separately approved synthetic identities/fixtures.
2. **P1 — reduce remaining anonymous grants:** 55 anon-callable Staging SECURITY DEFINER functions still have both PUBLIC and explicit anon EXECUTE. Review the exact remaining 55 before proposing any further ACL change; preserve authenticated app paths and do not blanket-revoke.
3. **P1 — finish Staging validation:** execute only specifically approved Cash Box and strengthened Default ACL probes against verified Staging; synthetic identities only; outbox-only assertions.
4. **P1 — AuthContext integration coverage:** the request epoch guard and unit tests are implemented; add mocked Supabase/React integration cases before treating sign-in, token refresh, account switch, sign-out rejection, inactive admin, normal user, and expired-session flows as verified.
5. **P2 — migration statement reconciliation:** retain the 31 unresolved rows in [MIGRATION_STATEMENT_MATRIX.md](../evidence/MIGRATION_STATEMENT_MATRIX.md) as open evidence gaps. Six would require a separately approved, privacy-bounded historical data check; 24 require trustworthy historical execution evidence because later DDL masks their intermediate effects; one `NOTIFY` cannot be proved from current catalog state. Keep the ledger untouched.
6. **P2 — currency consumer review:** inventory internal UI and external consumers; keep Candidate 4 **HOLD** until EGP/USD business contract is approved.
7. **P3 — PR review:** commit documentation/test-plan-only updates on `codex/phase0-next`, update PR #1 to `phase0/shared-workspace`; do not merge or deploy.

## Safety disposition

Read-only catalog and migration-list captures were obtained from both projects. One approved ACL-only transaction changed the two named Staging worker functions; it did not invoke them or modify table data. Production was untouched. No migration application/repair, project lifecycle action, push/deployment, ledger edit, or Candidate 4 application occurred. Candidate 4 remains **HOLD**.
