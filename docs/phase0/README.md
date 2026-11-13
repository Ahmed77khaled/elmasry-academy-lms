# Phase 0 — Shared Engineering Workspace

**Repository:** `Ahmed77khaled/elmasry-academy-lms`  
**Supabase project:** `urmkcixqpoqkiosihhal` (TrainerPro)  
**Workspace branch:** `phase0/shared-workspace`  
**Status:** OPEN — NOT CLEARED FOR PRODUCTION CHANGES

This directory is the shared source of truth for Phase 0 audit evidence, review notes, and proposed remediation drafts.

## Contents

- `evidence/`: read-only audit reports, catalog extracts, function source, application RPC usage, and migration inventory.
- `review/`: independent technical review, risk decisions, blockers, and staging plan.
- `drafts/migrations/`: proposed forward-only SQL changes. These are **not active Supabase migrations** and have not been applied.
- `local-migrations/`: reserved for the exact local migration snapshot once synchronized from the developer's working tree. Do not invent or reconstruct migration files from summaries.

## Safety status

- The supplied audit and review work was read-only.
- No SQL from `drafts/migrations/` has been applied to the live database.
- No production DDL/DML, permission change, migration repair, `supabase db push`, or deployment is authorized by these files.
- The supplied evidence reports no separate staging Supabase project. This must be rechecked before any database change.
- The four draft migrations need further reconciliation and PostgreSQL/staging validation before approval.
- Migration ledger reconciliation remains blocked; do not run blanket `migration repair`.

## Collaboration

Use this branch for Phase 0 evidence and review updates. Keep draft SQL outside `supabase/migrations/`. For application changes, create a dedicated feature branch and open a pull request; do not push directly to `main`.

Every update should record what evidence changed, the commit SHA, and whether any database operation was executed.
