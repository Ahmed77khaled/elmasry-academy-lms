# Phase 0 — Shared Engineering Workspace

**Repository:** `Ahmed77khaled/elmasry-academy-lms`  
**Baseline branch:** `phase0/shared-workspace`  
**Production Supabase ref:** `urmkcixqpoqkiosihhal`  
**Staging Supabase ref:** `kxdfconqflveqeozanaw`  
**Status:** OPEN — NOT CLEARED FOR PRODUCTION CHANGES

This directory is the shared source of truth for Phase 0 evidence, remediation candidates, staging validation, and release gates. The current execution state is documented in `docs/phase0/CODEX_HANDOFF.md` and `review/PHASE0_STATUS_AR.md`.

## Contents
- `evidence/`: read-only audit reports, catalog extracts, function source, app RPC usage, and migration inventory.
- `review/`: independent technical review, raw operation log, lifecycle/SQL audit, risk decisions, and staging test plan.
- `migrations-snapshot/`: 20 original local migration files preserved as archival snapshots.
- `drafts/migrations/`: four proposed forward-only remediation SQL files. They are not in the active migration folder.
- `staging/`: schema/reference-seed snapshot for inspection, not a blind replay script.
- `validation/`: read-only audit queries plus a transactional Staging-only ACL probe.

## Current verified execution state

- A separate Staging project exists: `kxdfconqflveqeozanaw`.
- Candidates 1, 2, and 3 were executed on Staging using direct SQL. Test completeness differs by candidate; see `review/SUPABASE_LIFECYCLE_AND_SQL_AUDIT.md`.
- Candidate 1's executed ACL probe was an older reduced version. The current strengthened probe still needs to be run on Staging.
- Candidate 4 (legacy EGP-only financial views) is HOLD and was not applied.
- The captured raw log records 24 SELECT-only Production SQL calls and 71 SQL calls targeting Staging. The one apply_migration attempt was blocked before execution.
- The captured migration evidence contains 20 local migrations and 4 registered ledger rows. Reconciliation remains unresolved.
- The Portfolio Supabase project (`eidlyvsiroyxvccmzlfm`) was intentionally paused to make room for Staging; the owner approved keeping it paused.
- Some non-personal reference/configuration values were read from Production and reproduced on Staging. The logs do not show real student/Auth/financial transaction records copied.

## Hard safety boundaries

- No Production DDL/DML, permission change, migration repair, `supabase db push`, project pause/resume, or deployment is authorized.
- No Staging writes or candidate migrations are authorized by this documentation alone. Get explicit user approval for each new mutating operation.
- Never use `db reset`, blanket `migration repair`, or manual edits to `schema_migrations`.
- The ACL probe creates temporary objects and rolls back; it is not read-only and Staging-only.

## Collaboration

Read `CODEX_HANDOFF.md` and the root `AGENTS.md`. Use the dedicated Codex branch `codex/phase0-next`; submit changes as a PR back to `phase0/shared-workspace`. Never push directly to `main`.
