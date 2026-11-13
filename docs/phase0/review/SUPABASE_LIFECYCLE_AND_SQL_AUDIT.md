# Final Audit — Supabase Lifecycle & SQL Execution (Phase 0)

**Audit date:** 2026-11-13  
**Source of truth used:** `docs/phase0/review/SUPABASE_MCP_RAW_EXECUTION_LOG.md` — 102 recorded Supabase MCP operations, including 95 `execute_sql` records, plus the uploaded Antigravity activity excerpt.  
**Disposition:** Production was not the target of the pause call and received no SQL writes in the captured session. A separate personal project was paused and was not resumed in the captured session.

## 1. Project pause — exact target established

The project lifecycle records show:

| Event | Project ref | Timestamp (UTC) | Result |
|---|---|---:|---|
| `get_project` before pause | `eidlyvsiroyxvccmzlfm` | 2026-11-13 19:07:34 | `ACTIVE_HEALTHY` |
| `pause_project` | `eidlyvsiroyxvccmzlfm` | 2026-11-13 19:09:47 | `success: true` |
| `get_project` after pause | `eidlyvsiroyxvccmzlfm` | 2026-11-13 19:10:10 | `PAUSING` |
| `get_project` Staging | `kxdfconqflveqeozanaw` | 2026-11-13 19:10:33 | `ACTIVE_HEALTHY` |

Paused project details:
- Name: `Ahmed77khaled's Project`
- Ref: `eidlyvsiroyxvccmzlfm`
- Region: `eu-west-3`
- It is **not** Production (`urmkcixqpoqkiosihhal`) and **not** the new Staging project (`kxdfconqflveqeozanaw`).

The first attempt to create Staging failed because the organization had reached the 2-active-free-project limit. The personal project was then paused; the second create request succeeded and created the Staging project.

The recorded session contains **zero** `resume_project` or `restore_project` calls. The last observed status for the personal project is `PAUSING`; the log does not establish its current status after that check. Do not assume it has been restored.

**Conclusion:** Antigravity did pause a separate personal Supabase project to free a project slot. The captured records do not show a pause of TrainerPro Production. The personal project may still be paused and needs an owner decision before resuming because the free-project quota was already reached.

## 2. Production SQL audit — 24 calls, all read-only

The raw operation inventory contains 95 `execute_sql` calls:
- **24 calls** targeted Production ref `urmkcixqpoqkiosihhal`.
- **71 calls** targeted Staging ref `kxdfconqflveqeozanaw`.

All 24 Production SQL payloads were SELECT-only queries (catalog inspection, schema/function/trigger/constraint/index definitions, reference-role catalog reads, and object counts). None contained DDL or DML verbs such as CREATE, ALTER, DROP, INSERT, UPDATE, DELETE, TRUNCATE, GRANT, or REVOKE.

Production also remained query-responsive during the recorded execution window; the last recorded Production query completed at 19:52:09Z.

No `apply_migration` call targeted Production. The one recorded `apply_migration` attempt targeted Staging and was cancelled by the client safety interceptor before execution.

**Conclusion:** Based on all captured operation arguments and results, the execution session did not issue SQL writes or a pause operation against Production. This is stronger evidence than the earlier partial activity summary. It is still a review of the recorded session, not a fresh live health probe at the time of this audit.

## 3. What was read from Production and reproduced in Staging

The claim in the initial execution report that “0% Production Data Copied” is too broad.

The captured Production reads included application reference/configuration material, notably:
- system role definitions from `admin_roles`;
- permission definitions from `permission_catalog`;
- role-to-permission mappings from `admin_role_permissions`;
- the notification-language setting (`group_language`).

Staging then received matching static reference rows for the RBAC role/permission catalogue. The captured session does **not** show a transfer of real students, real Auth users, real enrollments, real payments, expenses, or other live financial transactions. Synthetic Staging fixtures were inserted separately.

Use this corrected statement: **No personal or operational transaction records were copied from Production; some non-personal application reference/configuration values were read and reproduced in Staging.**

## 4. Staging migrations and execution paths

The recorded write operations targeted the new Staging ref only.

| Candidate | Staging execution evidence | Audit status |
|---|---|---|
| Candidate 1 — default privileges | Applied through a transactional `execute_sql` call (Step 8165) | Applied; full validation incomplete |
| Candidate 2 — active-admin `is_admin()` | Applied through transactional `execute_sql` (Step 8185) | Applied; SQL behavior verified |
| Candidate 3 — cash-box USD immutability + creator FK | Applied through transactional `execute_sql` (Step 8197) | Applied; core invariants partly verified |
| Candidate 4 — EGP-only legacy views | Not applied | HOLD |

The separate `apply_migration` call (Step 8075) targeted Staging but was cancelled by the client before execution. It does not demonstrate that a migration ran. The three candidate changes above were executed as SQL on Staging; do not infer that they were registered in `supabase_migrations.schema_migrations`.

No `supabase db push`, `migration repair`, or manual migration-ledger DML is evidenced in the captured session.

## 5. Independent review of test coverage

### Candidate 1 — default privileges

The candidate was executed on Staging. The executed probe (Step 8167, 3,171-character SQL payload) created a probe table, sequence and function in a transaction and rolled back. It checked selected privileges for anon/authenticated/service_role and PUBLIC EXECUTE on the function.

However, this was **not** the strengthened current probe now committed on the shared branch. The executed version checks only a subset of PostgreSQL 17's eight table privileges and three sequence privileges; it does not establish the full current probe's coverage. The migration itself includes a preflight/postflight and a global default-function ACL change, but the all-schema behavior of that global change still needs dedicated verification.

**Decision:** Applied on Staging; provisional pass only. Re-run the current strengthened probe (blob `29f906fa03c941affc008cf967d95abd3bdf154c`) on Staging and inspect relevant non-public schemas before any Production consideration.

### Candidate 2 — active-admin check

The session includes a pre-patch inactive-admin test, a successful candidate migration on Staging, and a post-patch result of:
- active admin = true;
- inactive admin = false;
- normal user = false.

This supports the core SQL behavior on Staging. The test did not exercise the actual frontend AuthContext sign-in, refresh, logout, and route-gating flows.

**Decision:** Staging SQL behavior passed; application-level regression remains untested.

### Candidate 3 — USD immutability and creator FK

The raw Staging log provides this sequence:
- Before Candidate 3, an attempted update to `opening_balance_usd` succeeded within a transaction, was observed as 999, then rolled back. This reproduces the USD mutability gap.
- After Candidate 3, attempts to change USD and EGP opening balances were rejected by the trigger with SQLSTATE `P0001`.
- A cash-box metadata/archive-style direct UPDATE to set `is_active=false` was allowed inside a transaction and then rolled back.
- A temporary Auth user deletion was tested inside a transaction; the returned cash-box row showed `added_by=NULL` and preserved opening balances, then the transaction was rolled back.

Important limits:
- The archive test used direct `UPDATE`, not the approved `rbac_archive_cash_box` RPC.
- The deletion test was rolled back; it did not permanently delete the synthetic Auth user.
- The detailed raw log checks cash box ID ending `0001`; a separate generated narrative summary refers to ID `0002`. Prefer the detailed query/response record and rerun the test to eliminate the report discrepancy.
- Negative/over-limit insertions, hard-delete rejection, arbitrary `added_by` reassignment, and the Telegram/outbox side-effect behavior were not all evidenced as tested.

**Decision:** Staging patch applied and the core post-patch immutability/FK checks are supported. Full candidate validation is not complete.

## 6. Remaining blockers

1. **Personal project lifecycle:** ref `eidlyvsiroyxvccmzlfm` was paused and no resume call appears in the session. Its current status must be checked in Supabase Dashboard. Do not resume blindly while the free-project quota is at the limit; resuming may require a plan change or a different project-slot decision.
2. **Existing callable routines:** the Staging audit reports 69 public routines executable by `anon` and 70 by `authenticated`. Candidate 1 affects future objects; it does not revoke old grants across the existing API surface. Perform function-by-function authorization review before Production release.
3. **Default ACL full probe:** run the current strengthened probe, not the reduced probe in the captured session.
4. **Application regression:** test real Staging frontend login/refresh/logout and authorization-gated routes.
5. **Cash-box test completeness:** test the approved archive RPC, limit validation, added_by reassignment rejection, hard-delete rejection, and outbox side effects.
6. **Legacy financial views:** keep Candidate 4 on HOLD; the test sample confirms raw EGP/USD sums are mixed, but an EGP-only patch can break existing consumers.
7. **Migration ledger:** still unresolved. No db push or repair until statement-level reconciliation is finished.

## 7. Sensitive test artifacts

The raw log contains a fixed synthetic Staging password in the SQL used to create disposable `example.invalid` test Auth accounts. It is not a Production credential, but it is a reusable test credential visible to collaborators with repository access. Rotate or delete the synthetic Staging accounts after testing and redact this value from future shared logs. Do not reuse it anywhere else.

## 8. Final determination

| Question | Result |
|---|---|
| Was Production the target of `pause_project`? | **No** |
| Which project was paused? | `eidlyvsiroyxvccmzlfm` — Ahmed77khaled's personal project |
| Was that project resumed in the captured session? | **No resume call recorded** |
| Did captured Production SQL calls modify the database? | **No — all 24 are SELECT-only** |
| Did recorded SQL writes target Staging? | **Yes — all 71 recorded SQL calls targeting the Staging ref** |
| Did an `apply_migration` execute? | **No — the one attempt was cancelled before execution** |
| Were Candidates 1–3 executed on Staging? | **Yes, via execute_sql; test completeness varies** |
| Was Candidate 4 applied? | **No — HOLD** |
| Is Production approved for release? | **NO-GO** |

No new Supabase lifecycle operation or SQL write was performed during this independent audit.
