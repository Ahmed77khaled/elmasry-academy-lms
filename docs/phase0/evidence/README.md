# Phase 0 Remediation Evidence Package — Handoff Documentation

**Target Supabase Project:** `urmkcixqpoqkiosihhal` (TrainerPro — eu-central-1)  
**Repository:** `D:\Fel7o Gamal Project\LMS_platform-main\LMS_platform-main` (Branch: `feat/lms-v2-phases`)  
**Inspection Mode:** Archived source package plus fresh Production/Staging catalog captures (14 November 2026), and one approved Staging-only EXECUTE ACL correction for two service-worker routines. No application table data or Production state was changed.
**Date:** 14 November 2026

> **Status note:** This README preserves an earlier evidence package. Its historic takeaways below include stale claims (for example, no Staging environment and no live current routine inventory). For current execution state, candidate status, and authorization boundaries, use `../README.md`, `../CODEX_HANDOFF.md`, `../review/PHASE0_STATUS_AR.md`, and the fresh [callable routine privilege matrix](CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md). The 70-row Production SECURITY DEFINER source remains an archived subset, not the full current callable inventory.

## Package Contents Directory
1. `README.md` — This master index and handoff guide.
2. `PHASE0_PRECHECK_AND_RECONCILIATION_RESULTS.md` — Complete precheck results (all 8 precheck queries) and reconciliation summary.
3. `PHASE0_RPC_SECURITY_DEFINER_SOURCE_EVIDENCE.md` — Complete untruncated source code and privileges for all 70 SECURITY DEFINER functions.
4. `LOCAL_MIGRATIONS/` — Directory containing exact copies of all 20 local migration SQL files.
5. `MIGRATION_INVENTORY.md` — Inventory table with SHA-256 hashes, Git tracking status, Draft flags, and full SQL texts.
6. `ALL_70_SECURITY_DEFINER_FUNCTIONS.md` — Forensic database audit of all 70 functions with signatures, return types, language, volatility, search_path, ACLs, and pg_get_functiondef source.
7. `FINANCIAL_VIEWS_AND_DEPENDENCIES.md` — Complete definitions, ordered column types, dependency tree, and application references for the 4 financial views.
8. `RELEVANT_TABLE_SCHEMAS.md` — Schemas, constraints, check constraints, and indexes for `payments`, `enrollments`, `expenses`, `cash_box_transfers`, `cash_boxes`, `courses`.
9. `CASH_BOX_TRIGGER_EVIDENCE.md` — Analysis of `prevent_cash_box_mutation()`, triggers on `cash_boxes`, and the `opening_balance_usd` loophole.
10. `DEFAULT_PRIVILEGES_EVIDENCE.md` — Audit of `pg_default_acl` and proof of future object inheritance risks in `public`.
11. `MIGRATION_RECONCILIATION.md` — Complete file-by-file database evidence classification (Fully Applied, Draft, etc.) for all 20 local migrations.
12. `APPLICATION_RPC_USAGE.md` — Code search across `src/` mapping all RPC and view references with line numbers and snippets.
13. `CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md` — Fresh read-only per-signature routine EXECUTE/schema-usage capture for Production and Staging; explicitly separates database privileges from conditional Data API RPC exposure.
14. `STAGING_RPC_BODY_REVIEW.md` — Post-correction review of the current 55 anon / 56 authenticated SECURITY DEFINER endpoints in Staging, with evidence for the eight legacy-write ACL correction.
15. `PHASE0_READONLY_CATALOG_CAPTURE_20261114.md` — Fresh 2026-11-14 SELECT-only cross-project evidence for routines, schema USAGE, relation/column ACLs, views, Cash Box FK/comments, default ACLs, and migration-ledger state.

## Key Engineering Takeaways for Reviewer
1. **Direct relation privileges:** Fresh Production and Staging captures show no direct `anon`/`authenticated` SELECT/INSERT/UPDATE/DELETE on the 16 public tables or four views. The app's data access is RPC-mediated.
2. **Default ACLs:** Fresh Production `postgres` defaults in `public` still include `anon`/`authenticated` for tables, sequences, and functions. Staging `postgres` defaults are hardened to owner and `service_role`. Both projects separately retain broad `storage` defaults; no change is authorized or evidenced here.
3. **RPC exposure:** The complete fresh inventory covers all 76 public/private routines per project and accounts for schema USAGE. Staging has 55 anon / 56 authenticated public non-trigger RPC candidates; the separate archived Production 70-row matrix is a SECURITY DEFINER subset, not the complete callable inventory.
4. **Cash Box creator FK:** Production `cash_boxes.added_by` is `ON DELETE NO ACTION`, while Staging is `ON DELETE SET NULL`; Migration 008 requests `SET NULL`. Candidate 4 remains HOLD pending approved remediation and verification.
5. **Migration ledger:** Production contains four recorded versions. Staging has no `supabase_migrations` schema or ledger relation. Current catalog evidence does not prove historical file execution; no ledger repair or `db push` is authorized.
6. **Staging availability:** A Staging project exists (`kxdfconqflveqeozanaw`). The approved synthetic behavior tests (26 cases) and rollback-only default-ACL probe passed; see [test results](STAGING_APPROVED_TEST_RESULTS_20261114.md). The catalog capture itself is read-only.
7. **Migration statement evidence:** A supplemental Production `pg_proc` SELECT capture records explicit routine ACL arrays, effective API-role EXECUTE, and comments for 76 routines. The 641-row matrix now has 230 `UNVERIFIABLE` rows after matching current Production routine ACL/comments and current policy state to exact candidate statements; current state does not prove historical execution; see [the capture](PRODUCTION_ROUTINE_ACL_COMMENT_CAPTURE_20261114.md) and [matrix](MIGRATION_STATEMENT_MATRIX.md).
