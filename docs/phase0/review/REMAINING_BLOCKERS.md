# Remaining blockers — Phase 0

## Defects with candidate remediation drafts

- Production `public.is_admin()` does not require `admins.is_active IS TRUE`; the candidate was applied and SQL-checked on Staging, but the Production finding remains.
- Production `prevent_cash_box_mutation()` does not prevent modification of `opening_balance_usd`; the candidate was applied on Staging and the approved rollback-only behavior suite passed all tested EGP/USD and creator invariants. Production remains unchanged.
- Production `cash_boxes_added_by_fkey` is validated `NO ACTION`, conflicting with Migration 008's `ON DELETE SET NULL` intent and the trigger's nullification allowance. Staging currently reports `SET NULL`; no Production change is authorized.
- Legacy financial views aggregate EGP and USD monetary amounts without currency filters; candidate EGP-only migration exists but is on HOLD pending business confirmation.
- Production `postgres` defaults in `public` include anon/authenticated for tables, sequences, and functions; Staging defaults are hardened. The strengthened rollback-only cross-schema probe passed its assertions on Staging; Production is unchanged.

## Remaining blockers

1. **Further Staging changes require operation-specific approval.** The approved Cash Box/RBAC behavior suite and default-ACL probe ran against verified ref `kxdfconqflveqeozanaw` using rollback-only fixtures. All 26 behavior cases passed; the ACL probe's assertions passed and all four probe objects were removed. Any different Staging operation still requires its own authorization and immediate independent verification of the ref. No persistent ACL/schema changes were made by these tests. See `STAGING_TEST_PLAN.md` and `../evidence/STAGING_APPROVED_TEST_RESULTS_20261114.md`.
2. **Migration ledger drift is unresolved.** The current evidence captures 20 local files and 4 Production ledger rows; Staging has no `supabase_migrations` schema or ledger relation. The 641-row matrix now records 299 `UNVERIFIABLE`; current object existence/ACLs do not prove full historical file execution. See `evidence/MIGRATION_RECONCILIATION.md` and `evidence/MIGRATION_STATEMENT_MATRIX.md`. No blanket `migration repair`.
3. **Resolved on Staging — direct legacy RPC reachability and tested RBAC boundaries.** The eight legacy write functions now have service_role-only EXECUTE; post-commit SELECT verified anon/authenticated/PUBLIC are blocked and RBAC wrappers retain authenticated EXECUTE. The approved synthetic-role tests passed for academy-manager and finance-manager allow/deny cases. A 24-hour REST-log scan found no direct calls, but dormant external consumers have not been ruled out. See [the Staging remediation record](STAGING_LEGACY_RPC_ACL_REMEDIATION.md) and [the executed Staging test plan](STAGING_TEST_PLAN.md). Other schema/RLS policy review remains separate.
4. **Resolved: archive trigger level.** Fresh read-only Production and Staging `pg_trigger` checks report `tgtype=17` (row-level) and `pg_get_triggerdef()` says `FOR EACH ROW`; the former `STATEMENT` summary label was wrong. See `evidence/CASH_BOX_TRIGGER_EVIDENCE.md`. No trigger or data was changed.
5. **Expense/transfer currency semantics.** Neither table has a currency column. Current v2 cash-box RPC treats the amounts as EGP, but that does not independently prove all historical records follow the convention. Data-owner confirmation is mandatory before EGP-only legacy view changes.
6. **Resolved — database routine dependency conflict for Candidate 4.** Fresh SELECT-only captures in both projects confirm `rbac_course_financial_summary(uuid)` delegates to `rbac_course_financial_summary_v2(uuid)`. The v2 body reads base tables and does not reference the four legacy financial views; text scans of all routine bodies and direct `pg_depend` queries found no references. See `evidence/PHASE0_READONLY_CATALOG_CAPTURE_20261114.md`. This does not rule out dynamic SQL or external/non-routine consumers.
7. **Candidate 4 business contract and external consumers remain open.** The data owner must confirm EGP-only semantics for legacy monetary views, especially expenses/transfers that have no currency column. Inventory external reports, SQL clients, and third-party consumers before any view contract change. Candidate 4 remains HOLD.
8. **Resolved — AuthContext source branch provenance.** The `phase0/shared-workspace` PR base was fetched read-only and compared with `codex/phase0-next`; the PR head explicitly includes the AuthContext request-epoch guard and its four unit tests. The code is therefore part of the reviewed branch diff. Mounted React/Supabase integration coverage and live sign-in remain untested.

## Release blockers

- Confirm the existing Staging project is an isolated, restorable test baseline; do not create or alter projects as part of this work.
- Complete read-only function/RLS/schema/trigger evidence review.
- Record the passed Staging behavior and ACL probes; no additional candidate SQL application is implied.
- Reconcile migration history statement-by-statement, with evidence for every effect.
- Never run `supabase db push` until all local/remote migration drift is fully understood.
