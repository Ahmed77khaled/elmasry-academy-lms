# Phase 0 Remediation Package — Current Status

**Current status:** Candidates 1–3 were executed on the dedicated Staging project; Candidate 4 remains HOLD. This file supersedes the earlier pre-Staging package note.

## Authoritative current records
- `../CODEX_HANDOFF.md`
- `PHASE0_STATUS_AR.md`
- `SUPABASE_LIFECYCLE_AND_SQL_AUDIT.md`
- `REMEDIATION_CODE_REVIEW.md`
- `STAGING_TEST_PLAN.md`
- `SUPABASE_MCP_RAW_EXECUTION_LOG.md` (credentials redacted)

## Candidate decisions

1. **Default privileges** — executed on Staging. The captured execution used an earlier reduced probe; the current strengthened probe and cross-schema global default implications still require verification.
2. **Active-admin `is_admin()`** — executed on Staging; SQL behavior tests support active=true, inactive=false, non-admin=false. Frontend AuthContext regression is still not evidenced.
3. **Cash-box USD immutability + creator FK** — executed on Staging; core invariants passed. Archive RPC, negative/over-limit validation, hard-delete/reassignment rejection, and notification-side-effect coverage remain incomplete.
4. **Legacy financial views EGP-only** — HOLD. Do not apply before UI/external consumer inventory, a confirmed expense/transfer currency convention, and approved multi-currency contract.

## Migration status

The four candidate files remain in `drafts/migrations/`, not in `supabase/migrations/`. Direct SQL execution on Staging does not establish migration-ledger registration. The captured evidence reports 20 local migration versions and 4 ledger rows; reconcile statement-by-statement.

## Safety

Production (`urmkcixqpoqkiosihhal`) remains NO-GO for all changes. Do not run `supabase db push`, `migration repair`, `db reset`, direct ledger edits, or candidate SQL against Production. Even Staging mutation requires explicit user approval and a fresh target-ref check.
