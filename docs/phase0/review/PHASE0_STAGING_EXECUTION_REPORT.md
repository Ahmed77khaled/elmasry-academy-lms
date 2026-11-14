# Phase 0 — Corrected Staging Execution Record

**Execution date:** 13 November 2026  
**Repository:** `Ahmed77khaled/elmasry-academy-lms`  
**Evidence source:** `SUPABASE_MCP_RAW_EXECUTION_LOG.md` (raw operation arguments and responses)  
**Independent audit:** `SUPABASE_LIFECYCLE_AND_SQL_AUDIT.md`

> This file replaces the earlier optimistic Antigravity summary as the current concise execution report. The original narrative is preserved at `PHASE0_STAGING_EXECUTION_REPORT_HISTORICAL_UNVERIFIED.md` for provenance only. In case of conflict, the raw operation log and independent audit take precedence.

## Environments

| Environment | Project ref | Role |
|---|---|---|
| Production / TrainerPro | `urmkcixqpoqkiosihhal` | Existing live project; read-only during the captured execution |
| Staging / trainerpro-phase0-staging | `kxdfconqflveqeozanaw` | Isolated test project |
| Ahmed Khaled Portfolio | `eidlyvsiroyxvccmzlfm` | Separate personal project, intentionally paused with owner approval to free the free-tier project slot |

The captured lifecycle log records the personal Portfolio project moving from `ACTIVE_HEALTHY` to `PAUSING`. There is no resume call in that session. The owner has explicitly approved keeping it paused. Production was not the pause target.

## Production impact

The raw log contains 95 `execute_sql` calls:
- 24 targeted Production; every captured Production query is SELECT-only.
- 71 targeted Staging; these included schema setup, seed fixtures, candidate SQL, and behavioral tests.

The single `apply_migration` attempt targeted Staging and was blocked by the client safety interceptor before execution. There is no evidence in the captured log of SQL writes, migration repair, `db push`, or project pause against Production.

Some non-personal application reference/configuration values (role, permission, role-mapping, and notification-language settings) were read from Production and reproduced on Staging. No real student, Auth, enrollment, payment, expense, or transaction records were copied according to the raw operation evidence. Do not claim "zero Production data" without this qualification.

## Candidate status

| Candidate | Actual Staging execution | Verification status |
|---|---|---|
| 1. Harden PostgreSQL default privileges | Executed through `execute_sql` | Applied; the executed probe was an older, reduced probe. Run the current strengthened probe and cross-schema checks before calling it fully validated. |
| 2. Require active admin in `public.is_admin()` | Executed through `execute_sql` | SQL behavior verified: active admin=true, inactive admin=false, normal user=false. A later 2026-11-15 local mocked React test suite covers AuthProvider active-admin and normal-user behavior; live Staging sign-in remains untested (see `../evidence/APPLICATION_AUTHORIZATION_FLOW_REVIEW.md`). |
| 3. USD immutability + creator FK | Executed through `execute_sql` | Core immutability and SET NULL tests evidenced. Full plan incomplete: approved archive RPC, validation limits, hard-delete/creator reassignment rejection, and notification side effects need evidence. |
| 4. EGP-only legacy views | Not applied | HOLD pending consumer-contract and business-semantics review. |

All three Staging candidate SQL operations were direct `execute_sql` calls; do not infer they were recorded in the Supabase migration ledger. The candidates remain drafts under `docs/phase0/drafts/migrations/`, outside active `supabase/migrations/`.

## Remaining release blockers

1. Review the existing public routine grants and authorization behavior. The captured audit reports 69 routines callable by `anon` and 70 by `authenticated`; assess each routine rather than applying blanket revokes.
2. Run the current full `PHASE0_STAGING_DEFAULT_ACL_PROBE.sql` (including all PostgreSQL 17 table/sequence privilege dimensions and PUBLIC ACL assertions) on Staging only.
3. Complete the Cash Box edge-case tests and frontend AuthContext sign-in/refresh/logout regression.
4. Reconcile the 20 local migrations against the captured 4 migration-ledger rows statement-by-statement. No `db push`, `migration repair`, or manual ledger DML.
5. Keep Candidate 4 on HOLD until the multi-currency legacy view contract is agreed and external consumers are inventoried.

## Final status

- Staging exists and was used for candidate testing.
- Candidate 1–3 were executed on Staging; not all tests are complete.
- Candidate 4 remains unapplied.
- Migration ledger remains unresolved.
- Production release remains **NO-GO**.
