# Phase 0 — Independent Review of the Four Proposed Fixes

**Target:** Supabase project `urmkcixqpoqkiosihhal` (TrainerPro)  
**Reviewed branch:** `phase0/shared-workspace`  
**Review basis:** The 20 exact local migration snapshots, the four proposed SQL files, audit reports, function-source evidence, schema evidence, and application source committed to this branch.  
**Review result:** The four drafts are materially aligned with the identified findings, but none is approved for Production. No SQL was executed as part of this review.

## Executive decision

| Draft migration | Finding addressed | Review decision | Production |
|---|---|---|---|
| `20261113190000_harden_postgres_default_privileges.sql` | Future postgres-created public objects inherit broad grants | **STAGING CANDIDATE — CONDITIONAL GO** | **NO-GO** |
| `20261113190100_fix_is_admin_active_status.sql` | Disabled administrator still passes legacy `is_admin()` | **STAGING CANDIDATE — GO** | **NO-GO** |
| `20261113190200_fix_cash_box_usd_immutability_and_creator_fk.sql` | USD opening balance mutable; creator FK is NO ACTION | **STAGING CANDIDATE — GO WITH TESTS** | **NO-GO** |
| `20261113190300_make_legacy_financial_views_egp_only.sql` | EGP and USD are summed together in legacy views | **HOLD — BUSINESS SEMANTICS + DEPENDENCY RECONCILIATION REQUIRED** | **NO-GO** |

“GO” above means suitable to proceed to isolated Staging validation only; it does not mean PostgreSQL execution or application tests have passed.

## 1. Default privileges — `20261113190000`

### What is confirmed

The supplied live catalog evidence shows that objects created by `postgres` in `public` receive broad schema-specific defaults:
- Tables: all table privileges to `anon`, `authenticated`, `postgres`, and `service_role`.
- Sequences: `SELECT, UPDATE, USAGE` to the same roles.
- Functions: `EXECUTE` to the same roles.

The evidence also shows equivalent defaults for `supabase_admin`. The earlier audit reports no public objects currently owned by `supabase_admin`; however, the defaults are still present.

### Review of the draft

The draft correctly scopes schema-specific changes to objects created by `postgres` in `public`. It does not try to alter `supabase_admin`. It preserves the explicit `service_role` defaults and does not modify privileges on existing objects.

The global command:

```sql
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
```

is broader than the public-schema changes: it changes the global default for future functions created by `postgres` in every schema. That is technically necessary if the intention is to remove PostgreSQL's global default `PUBLIC EXECUTE`; a schema-specific REVOKE cannot cancel a global default grant. Schema-specific defaults are additive to global defaults. This behavior is documented by PostgreSQL 17: https://www.postgresql.org/docs/17/sql-alterdefaultprivileges.html

The draft's comments correctly call out this global effect. The staging probe currently tests newly created objects in `public`; before approving this migration, inspect every schema with `postgres`-owned default ACL entries and decide whether schema-specific grants (for example `storage`) are intentionally retained. Do not assume that a public-only probe proves the global change harmless to all schemas.

### Decision

**Conditional GO for Staging.** Before staging execution:
1. Capture a before/after full default-ACL matrix for all schemas and all object types.
2. Confirm service_role grants on new public tables, sequences, and functions remain exactly as intended.
3. Confirm `anon`, `authenticated`, and `PUBLIC` do not receive the prohibited privileges on new public objects.
4. Inspect non-public schemas with postgres-created defaults, particularly `storage`, because the global function-default change applies database-wide.
5. Keep `supabase_admin` defaults explicitly documented as an unchangeable remaining boundary.

## 2. Active-admin check — `20261113190100`

### What is confirmed

The live function source in the evidence bundle shows that `public.is_admin()` currently checks only whether `auth.uid()` appears in `public.admins.auth_user_id`; it does not check `admins.is_active`.

By contrast, `private.has_permission(text)` and `private.is_platform_owner()` require `is_active IS TRUE`.

The application calls `supabase.rpc('is_admin')` from `src/context/AuthContext.tsx` during initial authentication, auth-state changes, and authorization refresh. `src/App.tsx` uses that result as the top-level UI access guard. Therefore, an inactive admin can continue to pass the legacy application guard even though RBAC permission helpers reject the account.

### Review of the draft

The proposed predicate:

```sql
a.auth_user_id = auth.uid()
AND a.is_active IS TRUE
```

aligns the legacy guard with the active-admin rule already used by RBAC. The draft verifies the current signature, owner, SECURITY DEFINER mode, and effective execution rights, then restates the expected grants for authenticated and service_role while revoking PUBLIC/anon.

The patch is intentionally narrow: it does not change role/permission assignment and does not replace per-operation RBAC checks.

### Decision

**GO for isolated Staging validation.** Required tests:
- Active admin: `is_admin() = true`.
- Inactive admin: `is_admin() = false`.
- Non-admin authenticated user: `false`.
- Anonymous caller: cannot execute the function.
- service_role retains the required execution grant.
- Existing login, refresh, logout, and authorization loading behavior remains intact.

## 3. Cash-box opening balances and creator FK — `20261113190200`

### What is confirmed

The live evidence shows:
- `prevent_cash_box_mutation()` protects `opening_balance` but does not compare `opening_balance_usd` on UPDATE.
- `opening_balance_usd` is numeric, NOT NULL, default 0, with a nonnegative check constraint.
- `cash_boxes.added_by` is nullable UUID with an `auth.uid()` default in the captured live schema.
- The live `cash_boxes_added_by_fkey` has `confdeltype = 'a'` (NO ACTION).
- The trigger source already permits the transition from a non-null `added_by` to NULL, specifically to allow a referential-action update.

The local migration history explains the inconsistency:
- `202610210008_protect_cash_boxes_opening_balance.sql` attempted to add `added_by` using `ADD COLUMN IF NOT EXISTS ... REFERENCES auth.users(id) ON DELETE SET NULL`. If the column already existed, the statement would not rewrite its existing FK action.
- `20261021171218_allow_cash_box_creator_nullification_on_auth_delete.sql` updates the trigger to allow nullification but does not alter the FK constraint itself.

Thus the trigger's nullification allowance and the live FK action are inconsistent. The new FK repair addresses that missing step.

The USD balance cap in the draft is consistent with the local `rbac_create_cash_box_v2` implementation, which accepts both EGP and USD opening balances and limits each to 99,999,999.99.

PostgreSQL documents that foreign-key referential actions such as `ON DELETE SET NULL` are ordinary updates to the referencing table and fire relevant triggers there. The proposed trigger explicitly allows only the FK-driven non-null-to-NULL creator transition. References: https://www.postgresql.org/docs/17/trigger-definition.html and https://www.postgresql.org/docs/17/sql-createtrigger.html

### Review of the draft

The draft:
- Adds validation for both opening balances on INSERT.
- Rejects subsequent changes to either opening balance.
- Preserves archive-by-`is_active` behavior and hard-delete prevention.
- Preserves the existing `added_by` column default.
- Replaces the FK action with `ON DELETE SET NULL` and validates it.
- Uses preflight checks for the expected table, columns, function mode/owner, FK identity, and BEFORE ROW trigger wiring.

No direct data rewrite is included.

### Decision

**GO for isolated Staging validation.** Required tests:
1. Create a cash box with EGP and USD opening balances at zero and at the permitted maximum.
2. Reject negative EGP and negative USD opening balances.
3. Reject values above 99,999,999.99 for either balance.
4. Reject UPDATE attempts changing either opening balance, including direct SQL as authenticated.
5. Confirm `rbac_archive_cash_box` can still set `is_active = false`.
6. Delete a dedicated test Auth user who created a test cash box; verify `added_by` becomes NULL and the cash-box row remains.
7. Verify arbitrary creator reassignment and hard deletion remain rejected.
8. Confirm all existing cash-box triggers remain enabled and the archive Telegram notification still fires once per qualifying row.

The trigger-level audit report has a metadata inconsistency: the archive trigger summary calls it AFTER STATEMENT, while its own `pg_get_triggerdef` text says `FOR EACH ROW`. The raw trigger catalog query must settle this before staging sign-off. The proposed migration does not alter that archive trigger.

## 4. Legacy financial views — `20261113190300`

### What is confirmed

The four live legacy views currently aggregate numeric monetary values without currency predicates. The live schema separates:
- `payments.currency` as EGP/USD.
- `enrollments.agreed_currency` as EGP/USD.
- `cash_boxes.opening_balance` (EGP) and `opening_balance_usd` (USD).

The live schema does not have a `currency` column on `expenses` or `cash_box_transfers`. The v2 cash-box endpoint in the local migration snapshot likewise reports EGP cash flows from expenses/transfers separately from USD opening balances and USD payments.

The captured database evidence reports zero payment/enrollment currency mismatches.

The application evidence shows financial screens call v2 RPCs rather than querying these four views directly from PostgREST. The versioned finance/course RPCs calculate EGP and USD figures separately.

### Review of the draft

The proposed view definitions:
- Make all legacy monetary output fields EGP-only.
- Filter payments by `currency = 'EGP'`.
- Filter enrollment balances by `agreed_currency = 'EGP'`.
- Keep operational counts across currencies.
- Keep expenses and transfers in legacy calculations under the current schema's implicit EGP convention.
- Restore `security_invoker = true`.
- Preserve the captured output column names, order, and PostgreSQL types for all four views.

PostgreSQL 17 requires `CREATE OR REPLACE VIEW` to produce the existing columns with the same names, order, and data types (additional columns may only be appended). The captured contracts appear to match the draft, but this must be run against a staging clone; the read-only output-contract query in `validation/PHASE0_POST_APPLY_READONLY_CHECKS.sql` is useful after application. Reference: https://www.postgresql.org/docs/17/sql-createview.html

### Blockers

1. **Business semantics are not fully proven by schema absence.** The absence of a currency column suggests expenses and transfers are single-currency, but it does not prove every historical expense/transfer amount was entered as EGP. The data owner must confirm that convention before the legacy views are relabeled EGP-only.
2. **Conflicting dependency evidence.** `FINANCIAL_VIEWS_AND_DEPENDENCIES.md` says `public.rbac_course_financial_summary` references a legacy view, while the full function-source report shows that function delegating to `public.rbac_course_financial_summary_v2`. Re-extract the current live function body and dependency information from the target database before applying the view patch. Do not rely on the summary alone.
3. **Unknown external consumers.** Application source search found no direct PostgREST use of these views, but external reports, SQL clients, or third-party integrations were not ruled out.

### Decision

**HOLD.** Do not apply this draft even to Staging until the EGP-only accounting convention is confirmed by the data owner and the conflicting function-dependency evidence is reconciled. After that, compare the exact four view contracts and run financial test cases with known EGP and USD data.

## 5. Other important observations

- The migration ledger remains unresolved. The evidence shows 20 local files versus 4 registered versions. Some local files are marked Draft while related objects or versions appear in the live database. Do not run blanket `supabase migration repair` or `supabase db push`.
- The live audit reported no separate Staging Supabase project. Reconfirm this. If no isolated Staging environment exists, create/authorize one before running any DDL or the transactional default-ACL probe.
- `PHASE0_STAGING_DEFAULT_ACL_PROBE.sql` is **not read-only while it executes**. It creates disposable table/sequence/function objects in a transaction and rolls back. It must run only on isolated Staging.
- The three scripts in `docs/phase0/validation/` are evidence/validation aids; only `PHASE0_REMAINING_SECURITY_GAPS_READONLY.sql` and `PHASE0_POST_APPLY_READONLY_CHECKS.sql` are SELECT-only.
- No migration in `docs/phase0/drafts/migrations/` has been applied or approved for Production by this review.

## 6. Review evidence and references in this repository

- `evidence/DEFAULT_PRIVILEGES_EVIDENCE.md`
- `evidence/PHASE0_RPC_SECURITY_DEFINER_SOURCE_EVIDENCE.md`
- `evidence/CASH_BOX_TRIGGER_EVIDENCE.md`
- `evidence/FINANCIAL_VIEWS_AND_DEPENDENCIES.md`
- `evidence/RELEVANT_TABLE_SCHEMAS.md`
- `evidence/APPLICATION_RPC_USAGE.md`
- `migrations-snapshot/202610210008_protect_cash_boxes_opening_balance.sql`
- `migrations-snapshot/20261021171218_allow_cash_box_creator_nullification_on_auth_delete.sql`
- `migrations-snapshot/20261030130000_course_enrollment_currency_v2.sql`
- `validation/PHASE0_REMAINING_SECURITY_GAPS_READONLY.sql`
- `validation/PHASE0_STAGING_DEFAULT_ACL_PROBE.sql`
- `validation/PHASE0_POST_APPLY_READONLY_CHECKS.sql`

## 7. Execution status

- SQL parser / live PostgreSQL test: **NOT RUN**.
- Staging application: **NOT RUN**.
- Production application: **NOT RUN**.
- Migration ledger repair: **NOT RUN**.
- Git main branch: **UNCHANGED**.
- This report is a code/evidence review, not a deployment approval.


## 8. Follow-up review work (13 November 2026)

After the initial review, the migration reconciliation assessment was rewritten conservatively. The previous table's FULLY APPLIED labels for unregistered versions were not supported by statement-level proof. The new `evidence/MIGRATION_RECONCILIATION.md` marks most of those versions UNKNOWN or PARTIAL until every statement is reconciled, and explicitly prohibits blanket migration repair.

The Staging default-ACL probe was also strengthened. It now checks all eight PostgreSQL 17 table privileges (`SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN`), all three sequence privileges (`USAGE, SELECT, UPDATE`), function EXECUTE, explicit PUBLIC ACL entries, and preservation of every captured service_role privilege. It remains transactional and ends with ROLLBACK; it is **not read-only while running** and is Staging-only.

These follow-up changes are committed on `phase0/shared-workspace`. They do not change the approval status: Staging has not been run, Production remains NO-GO, and migration ledger reconciliation remains blocked.
