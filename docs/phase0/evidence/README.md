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

## Key Engineering Takeaways for Reviewer
1. **Zero Direct Table Access:** The frontend never queries tables directly via PostgREST; all operations go through `v2` RPCs.
2. **Default ACLs:** `postgres` default privileges in `public` still grant `ALL` on future tables and `EXECUTE` on future functions to `anon`/`authenticated`. Remediation migration 1 is validated and required.
3. **Multi-Currency Commingling:** Legacy financial views sum USD and EGP indiscriminately. Modifying views to filter EGP-only is safe because 0 v2 RPCs depend on them.
4. **Cash Box USD Opening Balance Loophole:** `prevent_cash_box_mutation()` lacks protection for `opening_balance_usd`, permitting mutation. Remediation migration 3 is validated.
5. **Migration Drift:** 20 local files vs 4 remote ledger entries. 15 applied-unregistered, 1 unapplied draft, 4 registered. Running `supabase db push` will crash.
6. **Staging Availability:** There is NO staging environment. Production is the single source of truth; all remediations must be atomic and reversible.
