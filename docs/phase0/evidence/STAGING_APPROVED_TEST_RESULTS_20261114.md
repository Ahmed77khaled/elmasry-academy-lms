# Approved Staging test results — 2026-11-14

**Target:** Staging, project ref `kxdfconqflveqeozanaw`, name `trainerpro-phase0-staging`, status `ACTIVE_HEALTHY` at verification immediately before each SQL execution.

**Authorization:** The user explicitly approved the Staging-only behavior test bundle, including temporary synthetic test fixtures and rollback, outbox inspection without dispatch, and the default-privileges probe. No Production SQL, migration application, persistent ACL/schema change, project lifecycle action, or external notification was performed.

## Cash Box and RBAC behavior suite

Script: [`PHASE0_STAGING_APPROVED_BEHAVIOR_TESTS.sql`](../validation/PHASE0_STAGING_APPROVED_BEHAVIOR_TESTS.sql)

The script returned 26 result cases; all 26 had `passed: true`:

| Group | Cases | Result |
|---|---:|---|
| `is_admin` active owner, inactive user, regular user, temporary academy manager, temporary finance manager | 5 | All passed: true, false, false, true, true |
| Cash Box create with EGP/USD, negative EGP/USD, inclusive maximum EGP/USD, over-maximum EGP/USD | 7 | All passed; invalid values returned SQLSTATE `22023` |
| Permission boundaries: finance manager denied student/course create; academy manager denied expense record | 3 | All passed with SQLSTATE `42501` |
| Positive RBAC controls: academy manager student/course create; finance manager expense record | 3 | All passed; each inserted row was observed inside a rollback-only subtransaction |
| Cash Box trigger checks: EGP/USD opening balances immutable; creator reassignment rejected; metadata update does not archive; hard delete rejected | 5 | All passed |
| Archive RPC and outbox | 1 | All passed: box became inactive, exactly one archive event and one unsent outbox row were observed |
| Auth user deletion / creator FK | 1 | All passed: `added_by` became NULL and EGP/USD opening balances remained unchanged |
| Fixture rollback | 1 | Passed: temporary admin rows, cash boxes, student/course/expense records, Auth deletion, audit event, and outbox row were rolled back |
| **Total** | **26** | **All passed** |

The RPC calls were executed under PostgreSQL role `authenticated` with synthetic JWT subject claims. Direct table trigger checks ran as the database owner because the API roles do not have direct table update/delete grants; those checks do not establish that a client metadata-update endpoint exists. No credentials or interactive logins were used. The archive transition only inserted an unsent outbox item; no dispatcher was called.

An independent SELECT-only cleanup check after execution returned:

| Check | Remaining |
|---|---:|
| Four synthetic Auth users | 4 (expected; no account was removed) |
| Temporary admin rows for synthetic users 3/4 | 0 |
| Observed cash-box, student, course, expense fixture IDs | 0 each |
| Audit events and outbox rows for observed test cash box | 0 each |
| Default-ACL probe relations/functions | 0 each |

## Strengthened default-privileges probe

Script: [`PHASE0_STAGING_DEFAULT_ACL_PROBE.sql`](../validation/PHASE0_STAGING_DEFAULT_ACL_PROBE.sql)

The probe ran on the same verified Staging project with user approval. Its assertion block completed without error. Therefore, for newly created disposable objects in `public` and a disposable function in `private`, the script's checks passed: `anon`/`authenticated`/`PUBLIC` had no direct privileges; `service_role` retained the expected public table, sequence, and public-function privileges; and the private function had no unintended global PUBLIC EXECUTE. After `ROLLBACK`, the final SELECT returned `true` for removal of the probe table, sequence, public function, and private function.

The SQL tool returned only the final SELECT result set, not the intermediate ACL matrices; passing assertions are the recorded pass/fail evidence. No object or ACL change persisted. Separate `storage` defaults were not tested or changed.

## Limits

- These tests validate current Staging behavior, not Production behavior or migration execution history.
- `AuthContext` mounted React/Supabase behavior, live sign-in, and refresh semantics were not tested.
- Legacy `service_role`-only RPCs were not invoked; external consumers beyond the read-only REST log window remain unverified.
- The test suite does not resolve the 204 `UNVERIFIABLE` migration statements or Candidate 4's business currency contract. Candidate 4 remains HOLD.
