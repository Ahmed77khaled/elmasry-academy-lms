# Remaining blockers — Phase 0

## Defects with candidate remediation drafts

- Production `public.is_admin()` does not require `admins.is_active IS TRUE`; the candidate was applied and SQL-checked on Staging, but the Production finding remains.
- Production `prevent_cash_box_mutation()` does not prevent modification of `opening_balance_usd`; the candidate was applied on Staging, where core EGP/USD immutability checks passed, but full Cash Box behavior coverage remains.
- Production `cash_boxes_added_by_fkey` is validated `NO ACTION`, conflicting with Migration 008's `ON DELETE SET NULL` intent and the trigger's nullification allowance. Staging currently reports `SET NULL`; no Production change is authorized.
- Legacy financial views aggregate EGP and USD monetary amounts without currency filters; candidate EGP-only migration exists but is on HOLD pending business confirmation.
- Production `postgres` defaults in `public` include anon/authenticated for tables, sequences, and functions; Staging defaults are hardened. The candidate was applied on Staging, but the strengthened rollback-only cross-schema probe remains unrun and Production is unchanged.

## Remaining blockers

1. **Further Staging changes require operation-specific approval.** The two Telegram worker ACLs and eight legacy write RPC ACLs are corrected and verified under separate approvals. Any different Staging operation still requires its own authorization and immediate independent verification of ref `kxdfconqflveqeozanaw`. No additional SQL change is authorized by this blocker update.
2. **Migration ledger drift is unresolved.** The current evidence captures 20 local files and 4 Production ledger rows; Staging has no `supabase_migrations` schema or ledger relation. The 641-row matrix now records 410 `UNVERIFIABLE`; current object existence/ACLs do not prove full historical file execution. See `evidence/MIGRATION_RECONCILIATION.md` and `evidence/MIGRATION_STATEMENT_MATRIX.md`. No blanket `migration repair`.
3. **Resolved on Staging — direct legacy RPC reachability.** The eight legacy write functions now have service_role-only EXECUTE; post-commit SELECT verified anon/authenticated/PUBLIC are blocked and the RBAC wrappers retain authenticated EXECUTE. No write RPC was invoked. A 24-hour REST-log scan found no direct calls, but dormant external consumers have not been ruled out. Restricted-role behavior tests and any external-consumer confirmation remain open. See [the Staging remediation record](STAGING_LEGACY_RPC_ACL_REMEDIATION.md). Other schema/RLS policy review remains separate.
4. **Resolved: archive trigger level.** Fresh read-only Production and Staging `pg_trigger` checks report `tgtype=17` (row-level) and `pg_get_triggerdef()` says `FOR EACH ROW`; the former `STATEMENT` summary label was wrong. See `evidence/CASH_BOX_TRIGGER_EVIDENCE.md`. No trigger or data was changed.
5. **Expense/transfer currency semantics.** Neither table has a currency column. Current v2 cash-box RPC treats the amounts as EGP, but that does not independently prove all historical records follow the convention. Data-owner confirmation is mandatory before EGP-only legacy view changes.
6. **Resolved — database routine dependency conflict for Candidate 4.** Fresh SELECT-only captures in both projects confirm `rbac_course_financial_summary(uuid)` delegates to `rbac_course_financial_summary_v2(uuid)`. The v2 body reads base tables and does not reference the four legacy financial views; text scans of all routine bodies and direct `pg_depend` queries found no references. See `evidence/PHASE0_READONLY_CATALOG_CAPTURE_20261114.md`. This does not rule out dynamic SQL or external/non-routine consumers.
7. **Candidate 4 business contract and external consumers remain open.** The data owner must confirm EGP-only semantics for legacy monetary views, especially expenses/transfers that have no currency column. Inventory external reports, SQL clients, and third-party consumers before any view contract change. Candidate 4 remains HOLD.
8. **Application source branch matters.** AuthContext/App/Supabase client sources were retrieved from the GitHub default branch for review. Reconfirm they are identical to the intended release branch before changing application behavior.

## Release blockers

- Confirm the existing Staging project is an isolated, restorable test baseline; do not create or alter projects as part of this work.
- Complete read-only function/RLS/schema/trigger evidence review.
- Apply candidate SQL only on Staging and pass the test plan.
- Reconcile migration history statement-by-statement, with evidence for every effect.
- Never run `supabase db push` until all local/remote migration drift is fully understood.
