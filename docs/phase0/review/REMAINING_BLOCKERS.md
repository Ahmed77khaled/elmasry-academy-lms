# Remaining blockers — Phase 0

## Defects with candidate remediation drafts

- `public.is_admin()` currently does not require `admins.is_active IS TRUE`; candidate migration exists.
- `prevent_cash_box_mutation()` does not prevent modification of `opening_balance_usd`; candidate migration exists.
- The live `cash_boxes_added_by_fkey` evidence reports `NO ACTION`, conflicting with migration 008's `ON DELETE SET NULL` intent and the trigger's nullification allowance; candidate migration exists.
- Legacy financial views aggregate EGP and USD monetary amounts without currency filters; candidate EGP-only migration exists but is on HOLD pending business confirmation.
- Future postgres-created public objects have broad default grants; candidate default-ACL migration exists and needs all-schema staging review because it also removes the global default PUBLIC EXECUTE grant for future postgres-created functions.

## Remaining blockers

1. **Further Staging changes require operation-specific approval.** The two Telegram worker ACLs and eight legacy write RPC ACLs are corrected and verified under separate approvals. Any different Staging operation still requires its own authorization and immediate independent verification of ref `kxdfconqflveqeozanaw`. No additional SQL change is authorized by this blocker update.
2. **Migration ledger drift is unresolved.** The current evidence captures 20 local files and 4 ledger rows. Most files are not registered, but the previous FULLY APPLIED classifications rely heavily on object existence, not statement-level proof. See `evidence/MIGRATION_RECONCILIATION.md`. No blanket `migration repair`.
3. **Resolved on Staging — direct legacy RPC reachability.** The eight legacy write functions now have service_role-only EXECUTE; post-commit SELECT verified anon/authenticated/PUBLIC are blocked and the RBAC wrappers retain authenticated EXECUTE. No write RPC was invoked. A 24-hour REST-log scan found no direct calls, but dormant external consumers have not been ruled out. Restricted-role behavior tests and any external-consumer confirmation remain open. See [the Staging remediation record](STAGING_LEGACY_RPC_ACL_REMEDIATION.md). Other schema/RLS policy review remains separate.
4. **Resolved: archive trigger level.** Fresh read-only Production and Staging `pg_trigger` checks report `tgtype=17` (row-level) and `pg_get_triggerdef()` says `FOR EACH ROW`; the former `STATEMENT` summary label was wrong. See `evidence/CASH_BOX_TRIGGER_EVIDENCE.md`. No trigger or data was changed.
5. **Expense/transfer currency semantics.** Neither table has a currency column. Current v2 cash-box RPC treats the amounts as EGP, but that does not independently prove all historical records follow the convention. Data-owner confirmation is mandatory before EGP-only legacy view changes.
6. **Legacy view dependency needs same-project confirmation.** The archived Production function definition and migration snapshot show the v1-named course-summary wrapper delegating to `rbac_course_financial_summary_v2`. The older “Mentions” result can match that function name as a substring and is not catalog dependency evidence. Confirm the current Staging body/dependencies before Candidate 4 sign-off; a prepared SELECT-only capture exists and has not been run.
7. **Application source branch matters.** AuthContext/App/Supabase client sources were retrieved from the GitHub default branch for review. Reconfirm they are identical to the intended release branch before changing application behavior.

## Release blockers

- Establish a separate restored Staging database.
- Complete read-only function/RLS/schema/trigger evidence review.
- Apply candidate SQL only on Staging and pass the test plan.
- Reconcile migration history statement-by-statement, with evidence for every effect.
- Never run `supabase db push` until all local/remote migration drift is fully understood.
