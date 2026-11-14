# Phase 0 Codex Takeover Findings

**Branch:** `codex/phase0-next`
**Review date:** 2026-11-13
**Database access this task:** None. No Supabase SQL or project lifecycle operations were run.

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

The headline count of **69 anon / 70 authenticated** is from Staging, not Production. Raw execution log operations 101–102 target ref `kxdfconqflveqeozanaw`; operation 102 runs `COUNT(*)` across every `pg_proc` object in `public` without restricting `prokind`, function category, or SECURITY DEFINER. The row-level output for operation 101 was not retained in the log (it points to an inaccessible external output file). Therefore this is not a routine-by-routine Production inventory, and it cannot support blanket revokes.

The 70-entry SECURITY DEFINER source inventory describes Production and reports `anon=false` for every listed routine, including six private helpers/triggers, authenticated access for most RBAC and self-scoped endpoints, and no caller access for legacy write endpoints. These results conflict with the Staging aggregate because they are different environments and scopes. The safe interpretation is **Production anon exposure remains unverified by retained exhaustive per-routine output**. Re-run only the documented SELECT-only audit against each environment when separately approved; do not execute any grant change.

The read-only audit SQL (`validation/PHASE0_REMAINING_SECURITY_GAPS_READONLY.sql`, query 1) is the appropriate source for per-routine signature, owner, definer bit, search path, effective `anon` / `authenticated` / `service_role` EXECUTE, ACL and function body. The archived per-routine rows retained for Production enumerate 70 SECURITY DEFINER functions and have been transcribed into [PRODUCTION_SECURITY_DEFINER_70_ROUTINE_MATRIX.md](../evidence/PRODUCTION_SECURITY_DEFINER_70_ROUTINE_MATRIX.md). The supplemental [RPC routine crosswalk](../evidence/RPC_ROUTINE_EVIDENCE_CROSSWALK.md) reconciles that set to application RPC call sites and additional locally defined trigger/service/branding routines, while keeping unverified live existence/grants explicit. Neither document proves the Staging aggregate or constitutes a complete current database catalog. The archived output remains incomplete for a reconciled 69/70 matrix. The 70-function source file (`evidence/PHASE0_RPC_SECURITY_DEFINER_SOURCE_EVIDENCE.md`, table 1) must not be presented as proof of that aggregate count.

### Routine classes and disposition

| Class (evidence) | Authorization/data boundary | Minimum intended caller | Finding |
|---|---|---|---|
| `private.prevent_*` and `private.route_*` trigger functions | Trigger-only: immutable audit guards and outbox routing; no direct API caller | No API role; trigger execution context | Keep direct EXECUTE unavailable. `private` schema USAGE is false for anon and true for authenticated in recorded audit output; schema visibility alone does not establish direct function access. |
| `private.has_permission(text)`, `private.is_platform_owner()` | Authenticated identity and active admin / owner predicates | `authenticated` for nested RPC checks; anon denied | Not a data API. Keep fixed `search_path`; maintain narrow grants. |
| `public.is_admin()`, `get_my_authorization()`, `can_claim_platform_owner()`, `claim_platform_owner()` | Self identity through `auth.uid()`; active-admin/claim predicates | `authenticated` (service role only where operationally needed) | Client calls `is_admin` and `get_my_authorization`; `claim_platform_owner` is used in setup UI. Validate function body and owner-claim single-use invariant. |
| `public.rbac_*` readers and writers | `private.has_permission(...)` and, for owner-management, `private.is_platform_owner()`; row/field projection by permissions | `authenticated` | Application uses these RPCs for operational and financial views and mutations. Retain authenticated access only after body-by-body authorization checks; no anon call site. |
| Unprefixed legacy writes (`create_cash_box`, `enroll_student`, `record_*`, `void_*`, `transfer_between_boxes`, `set_enrollment_status`) | `is_admin()` body checks, but legacy broad admin semantics | `service_role` only according to recorded Production ACL; authenticated/anon denied | Not called by app as mutations (RPC usage map); no evidence warrants restoring client grants. |
| Non-SECURITY DEFINER public routines | Not enumerated individually in the retained complete output | Unresolved | The 69/70 count may include routines outside the 70 SECURITY DEFINER set. Exact signatures, ACL and body review remains outstanding. |

**Confirmed critical exposure from this evidence set:** none conclusively established for Production. **Confirmed audit defect:** an environment/scope mismatch was used to state an RPC exposure count; current evidence does not substantiate a complete Production anon/authenticated matrix. **Potential exposure:** broad default ACLs for postgres-created public objects are reported by historical Production precheck (`evidence/PHASE0_PRECHECK_AND_RECONCILIATION_RESULTS.md`, section 2); Candidate 1 was only applied on Staging and the current complete probe was not run. Existing objects need individual ACL inspection.

### Application authorization review

`src/context/AuthContext.tsx` fetches current session on mount, asks `is_admin()`, and loads `get_my_authorization()`; auth-state events load authorization only after a positive admin check. It clears permissions when no session or non-admin is seen. `AppShell.tsx` gates page navigation and render on permissions; sensitive CRUD and read flows call `rbac_*` RPCs rather than direct table writes. `AdminAccessManagement.tsx` uses role/owner RPCs; login invokes a best-effort alert after sign-in. The detailed flow, page-permission map, server-boundary evidence and regression cases are in [APPLICATION_AUTHORIZATION_FLOW_REVIEW.md](../evidence/APPLICATION_AUTHORIZATION_FLOW_REVIEW.md).

Implemented in this follow-up:

1. Added a shared request epoch checked after async session/admin/authorization operations and invalidated on auth events, sign-out, and provider cleanup. Removed the unused `userId` parameter; server identity still comes from `auth.uid()`.
2. Initial session loading now fetches authorization only after a positive admin check, matching the auth-event path.
3. Explicit refresh starts a new request epoch, blocks app content while loading, and ignores stale results.
4. Added four Node tests for current-request selection, invalidation, next request, and ignoring late responses. Added an `npm test` script that runs these and the existing 12 Edge Function tests.

Remaining: tests cover the epoch helper but do not mount `AuthProvider` or mock the Supabase client. Add integration cases for sign-in, token refresh, account switch, sign-out rejection, inactive admin, normal user, and expired session when the project has a React testing environment. A transient `get_my_authorization()` failure intentionally keeps `authorizationReady=false`; `isAdmin` can remain true until a successful recheck, while protected route content stays blocked. Route gating remains a UX layer; server-side `has_permission` / `is_admin` checks are the enforcement boundary.

## Missing Staging cases prepared (not executed)

Append these to `review/STAGING_TEST_PLAN.md` and run only after explicit operation-specific Staging approval, fresh verification of ref `kxdfconqflveqeozanaw`, and clean disposable identities/fixtures. Use transactions and rollback wherever supported; never dispatch external notifications.

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

Run the current `validation/PHASE0_STAGING_DEFAULT_ACL_PROBE.sql` only on Staging. Confirm the transaction rolls back and all eight table, three sequence, PUBLIC function and service-role expectations. Add a second probe under each relevant schema (`public`, `private`, plus any API-exposed application schema) for a future postgres-created function to establish whether the global function ACL change actually applies across schemas. Query each created object with `has_table_privilege`, `has_sequence_privilege`, `has_function_privilege`, and the exploded default ACL rows before rollback. Record creator role, schema, object signature and full privilege vector.

## Migration ledger reconciliation

Source set: 20 files under `migrations-snapshot/`; captured ledger: four versions (`20261021214608`, `20261022230000`, `20261023110000`, `20261030120000`). The [statement inventory](../evidence/MIGRATION_STATEMENT_MATRIX.md) parses the snapshots into 641 executable statements and records an evidence disposition for each: 452 `UNVERIFIABLE`, 33 `NOT APPLICABLE` (transaction-control and read-only preflight blocks), 5 `ABSENT` (Draft Only branding table statements), 143 `EQUIVALENT` (retained seed data, currency columns/constraints, function bodies, indexes, triggers, and policies matching live definitions), and 8 `DIFFERENT` (including the `added_by` FK action where captured Production metadata confirms `ON DELETE NO ACTION` while the migration declared `ON DELETE SET NULL`, the creator-nullification trigger drift, legacy payment index target drift, and five policy command-scope differences). The ledger has no per-statement provenance or applied SQL hashes. Consequently, statements without retained exact live definition/data/ACL evidence remain **unverifiable**, even if a similarly named object exists. No repair or ledger edit is authorized.

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

**Completion gate:** the local statement inventory is complete, but the reconciliation is not: obtain read-only evidence for each statement, then replace UNVERIFIABLE with equivalent/different/absent where proved. Current captured output cannot establish that granularity. Thus the ledger reconciliation remains **incomplete / NO-GO** and no migration repair is proposed.

## Prioritized implementation plan

1. **P0 — close evidence mismatch:** retrieve complete retained results for Production and Staging routine query, or execute SELECT-only inventory per environment under approved read-only access; export all signatures/effective ACL/body; count only `prokind IN ('f','p')` and label environment.
2. **P1 — finalize authorization map:** for every callable signature identify definer mode, owner, search path, authorization predicate, data scope, app call site and minimum grant; distinguish trigger-only, self-scoped, RBAC, legacy and unreachable routines. Add call-site map links to each row.
3. **P1 — AuthContext integration coverage:** the request epoch guard and unit tests are implemented; add mocked Supabase/React integration cases before treating sign-in, token refresh, account switch, sign-out rejection, inactive admin, normal user, and expired-session flows as verified.
4. **P1 — Stage validation:** execute only approved Cash Box and strengthened Default ACL probes against verified Staging; synthetic identities only; outbox-only assertions.
5. **P2 — migration statement reconciliation:** populate evidence columns in [MIGRATION_STATEMENT_MATRIX.md](../evidence/MIGRATION_STATEMENT_MATRIX.md) from read-only catalog/data outputs. Keep ledger untouched until every relevant statement and rollback plan are reviewed.
6. **P2 — currency consumer review:** inventory internal UI and external consumers; keep Candidate 4 **HOLD** until EGP/USD business contract is approved.
7. **P3 — PR review:** commit documentation/test-plan-only updates on `codex/phase0-next`, open PR to `phase0/shared-workspace`; do not merge or deploy.

## Safety disposition

Production was not accessed in this takeover. No Staging SQL was run. No Supabase project lifecycle action, migration command, push, deployment, ledger repair, or Candidate 4 application occurred.
