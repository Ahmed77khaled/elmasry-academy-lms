# Codex Handoff — Elmasry Academy LMS / TrainerPro

**Repository:** `Ahmed77khaled/elmasry-academy-lms` (Private)  
**Baseline branch:** `phase0/shared-workspace`  
**Codex work branch:** `codex/phase0-next`  
**Current decision:** Continue repository analysis and code/test work. Production database changes are not approved.

## 1. Purpose

This repository contains the full React/TypeScript application source, Supabase functions/migrations, Phase 0 audit evidence, archived migration snapshots, candidate remediation SQL, staging schema snapshot, validation scripts, and execution evidence. Do not request another ZIP export; use this repository and its current branch as the handoff source.

Start with this file, then read:
1. `docs/phase0/review/PHASE0_STATUS_AR.md`
2. `docs/phase0/review/SUPABASE_LIFECYCLE_AND_SQL_AUDIT.md`
3. `docs/phase0/review/REMEDIATION_CODE_REVIEW.md`
4. `docs/phase0/evidence/MIGRATION_RECONCILIATION.md`
5. `docs/phase0/review/REMAINING_BLOCKERS.md`
6. `docs/phase0/review/STAGING_TEST_PLAN.md`
7. `docs/phase0/review/SUPABASE_MCP_RAW_EXECUTION_LOG.md` (redacted archival evidence; do not replay it)

Older planning files and the original Antigravity report may contain stale statements. The current status page and independent lifecycle/SQL audit supersede older claims.

## 2. Supabase environments and ownership decisions

| Environment | Project ref | Expected role |
|---|---|---|
| Production / TrainerPro | `urmkcixqpoqkiosihhal` | Live database — READ ONLY for this work |
| Staging / trainerpro-phase0-staging | `kxdfconqflveqeozanaw` | Dedicated test environment |
| Ahmed Khaled Portfolio | `eidlyvsiroyxvccmzlfm` | Separate project; owner approved keeping it paused in exchange for using the Staging slot |

The exact recorded pause target was the Portfolio project, not Production. Do not resume it. Do not pause, resume, create, delete, or change Supabase projects.

### Database safety rules

- No SQL writes, DDL, DML, GRANT/REVOKE, migration application, schema changes, project lifecycle actions, or deployment to Production.
- Do not run `supabase db push`, `supabase db reset`, `supabase migration repair`, or manually alter `supabase_migrations.schema_migrations`.
- Do not execute the Staging validation probe on Production.
- Even on Staging, do not execute DDL/DML or candidate migrations unless the user gives explicit authorization for that specific action and the target project ref is independently verified immediately beforehand.
- Treat all direct candidate SQL runs from the captured session as Staging-only historical evidence, not as permission for new DB writes.
- Never use service-role keys or database passwords in frontend code, logs, commits, or chat.

## 3. What the raw session establishes

The raw session log contains 102 recorded Supabase MCP operations, including 95 `execute_sql` calls:
- 24 Production SQL calls; all 24 are SELECT-only.
- 71 Staging SQL calls; writes and tests were targeted at Staging.
- One `apply_migration` attempt targeted Staging and was stopped by the client's safety interceptor before execution.
- The successful candidate changes were run as direct SQL on Staging, not demonstrated as registered migration-ledger entries.
- The Portfolio project was paused to satisfy the free-tier active-project limit; the owner approved leaving it paused.

The report's original "0% Production Data Copied" assertion was too absolute. The raw evidence shows some non-personal application reference/configuration rows (role and permission catalogue/mappings and notification-language setting) were read from Production and reproduced on Staging. It does not show real student/auth/financial transaction records being copied.

## 4. Candidate remediation state

All four SQL candidates remain in `docs/phase0/drafts/migrations/`, not in active `supabase/migrations/`.

| Candidate | Current factual status |
|---|---|
| `20261113190000_harden_postgres_default_privileges.sql` | Executed on Staging. The strengthened rollback-only cross-schema probe passed its assertions on 2026-11-14; all four temporary objects were confirmed removed. |
| `20261113190100_fix_is_admin_active_status.sql` | Executed on Staging. SQL tests support active=true, inactive=false, normal=false. App AuthContext regression still needed. |
| `20261113190200_fix_cash_box_usd_immutability_and_creator_fk.sql` | Executed on Staging. The approved rollback-only behavior suite passed EGP/USD immutability, limits, creator reassignment/deletion, archive RPC, hard-delete, and outbox-only checks. No Production changes. |
| `20261113190300_make_legacy_financial_views_egp_only.sql` | HOLD. Do not apply. It changes a legacy multi-currency output contract; inspect frontend/external consumers and get business confirmation first. |

The initial Antigravity summary overstated Candidate 1 probe coverage, Candidate 3 test completeness, schema parity, and Production-readiness. Use the corrected execution report and raw operation log instead.

## 5. Migration ledger — unresolved

The captured evidence indicates 20 local migration files and 4 recorded remote ledger rows. The old classifications based on object existence were insufficient. Use `docs/phase0/evidence/MIGRATION_RECONCILIATION.md` and `LEDGER_RECONCILIATION_POLICY.md`.

For every migration statement, classify the expected live effect as equivalent, different, absent, or unverifiable. Do not mark a migration fully applied based only on object names. Do not repair the ledger until a complete statement-by-statement matrix and an approved Staging validation/rollback plan exist.

## 6. Priority work for Codex

### P0 — Establish repository baseline
- Confirm branch is `codex/phase0-next`, working tree clean, and no secrets or generated runtime files are tracked.
- Inspect existing CI workflows and run the local checks below.
- Do not change the migration ledger or any Supabase environment.

### P1 — RPC exposure/security inventory (body inventory complete; remediation unresolved)
- The current per-signature inventory is `docs/phase0/evidence/CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md`; Staging body classes, exact routine group membership, findings and recommended caller boundaries are in `docs/phase0/evidence/STAGING_RPC_BODY_REVIEW.md`.
- The 69/70 historical aggregate was Staging and included a broader routine count. After the worker and legacy-write ACL corrections, current Staging has 55 anon / 56 authenticated SECURITY DEFINER endpoints confirmed by Security Advisor.
- Two separately approved Staging-only ACL corrections narrowed the two Telegram service-worker functions and eight legacy write functions to service_role. No other blanket grant change was made.
- Eight legacy mutation RPCs had broad body checks but are now service_role-only on Staging; post-commit SELECT verified `anon=false`, `authenticated=false`, `service_role=true`, and no PUBLIC EXECUTE. All eight `rbac_*` wrappers retain authenticated execution. Approved synthetic-role tests passed academy-manager/finance-manager allow/deny cases; a 24-hour read-only REST-log scan found no direct calls to those legacy paths, but dormant external consumers remain unverified. Details are in `docs/phase0/review/STAGING_LEGACY_RPC_ACL_REMEDIATION.md` and `docs/phase0/review/STAGING_TEST_PLAN.md`.
- Do not blanket-revoke the remaining routines; preserve intentional authenticated app paths and service-role operations. Production remains read-only.

### P2 — Application auth regression review
- Source review is recorded in `docs/phase0/evidence/APPLICATION_AUTHORIZATION_FLOW_REVIEW.md`.
- The request-epoch guard and four unit tests cover stale async auth results. Sign-in request rejection now clears loading and shows a generic retryable message; failed authorization loading remains blocked and offers retry/sign-out.
- No mounted React/Supabase integration tests or live sign-in were run. Add those only with an approved test harness and fresh disposable Staging identities.
- Do not change role semantics without documenting affected routes and RPCs.

### P3 — Cash-box and notification test completeness
- Cash Box cases in `docs/phase0/review/STAGING_TEST_PLAN.md` §B1 and RBAC cases in §E2 were executed against verified Staging after operation-specific approval. All 26 result cases passed; fixture rollback and a separate cleanup SELECT were verified. See `docs/phase0/evidence/STAGING_APPROVED_TEST_RESULTS_20261114.md`.
- The strengthened default-ACL probe in §D1 passed its assertions and all four probe objects were confirmed removed. These tests made no persistent schema/ACL changes. No live notification dispatcher ran.
- Use synthetic identities only. Four disposable Staging Auth accounts (`a0000000-0000-0000-0000-000000000001` through `...0004`, `example.invalid`) were created during the previous tests. Their fixed passwords were redacted from the current raw log, but older Git commits contained those values. Treat their credentials as exposed. Before further interactive Staging login tests, reset or delete/recreate those synthetic accounts on Staging only, after explicit user authorization and fresh target-ref verification. Never touch Production identities.
- Do not run any test that sends live Telegram/email/webhook notifications. Use outbox-only or mocked dispatch paths.

### P4 — Migration and currency reconciliation
- The 641-statement matrix is built from the 20 archived snapshots; 299 rows remain `UNVERIFIABLE` (33 not applicable, 11 absent, 265 equivalent to current captured state, 33 different). Migration 008's Production `NO ACTION` versus declared `SET NULL` is explicitly classified as `DIFFERENT`. Do not repair the migration ledger.
- The former `rbac_course_financial_summary` dependency conflict is resolved by fresh read-only captures: the v1 wrapper delegates to v2 in both projects; v2 and the routine scan do not reference legacy views. External consumers and business currency semantics still require confirmation; Candidate 4 remains HOLD.
- The current database dependency conflict is resolved, but external consumers and the EGP/USD expense/transfer convention remain unconfirmed; Candidate 4 stays HOLD.

## 7. Local code checks

Available package scripts:
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test:telegram`

Run these using the repository's existing lockfile. Report exact pass/fail output. Do not claim checks passed unless executed.

## 8. File guide

- `src/`: application source (React + TypeScript).
- `supabase/functions/`: Edge Functions and tests.
- `supabase/migrations/`: historical active migration chain; do not append the four candidate drafts yet.
- `docs/phase0/migrations-snapshot/`: 20 original migration snapshots, archival source only.
- `docs/phase0/drafts/migrations/`: four remediation candidates.
- `docs/phase0/evidence/`: catalog, RPC, trigger, schema, and migration evidence.
- `docs/phase0/staging/staging_schema_reproduced.sql`: schema/reference-seed snapshot for inspection only. It is not a blind replay script and must never be used on Production.
- `docs/phase0/validation/`: SQL audit and Staging validation scripts. Each file's header and handoff instructions define its safety class.
- `docs/phase0/review/SUPABASE_MCP_RAW_EXECUTION_LOG.md`: redacted historic invocation log, retained for audit, not for replay.

## 9. Git workflow and deliverables

- Work only on `codex/phase0-next` or a narrower branch from it.
- Do not push to `main`.
- Keep database candidates in `docs/phase0/drafts/migrations/` until separately approved.
- Keep secrets, .env files, DB dumps with personal data, actual student records, and credentials out of Git.
- Make small, reviewable commits.
- Open a PR back to `phase0/shared-workspace` for review. Do not merge to main or deploy.

Initial deliverable: a concise evidence-linked security routine inventory, local test results, a ranked list of confirmed vulnerabilities vs false positives, and the next Staging-only verification plan. No Production changes.
