# Remaining blockers — Phase 0

## Defects with candidate remediation drafts

- `public.is_admin()` currently does not require `admins.is_active IS TRUE`; candidate migration exists.
- `prevent_cash_box_mutation()` does not prevent modification of `opening_balance_usd`; candidate migration exists.
- The live `cash_boxes_added_by_fkey` evidence reports `NO ACTION`, conflicting with migration 008's `ON DELETE SET NULL` intent and the trigger's nullification allowance; candidate migration exists.
- Legacy financial views aggregate EGP and USD monetary amounts without currency filters; candidate EGP-only migration exists but is on HOLD pending business confirmation.
- Future postgres-created public objects have broad default grants; candidate default-ACL migration exists and needs all-schema staging review because it also removes the global default PUBLIC EXECUTE grant for future postgres-created functions.

## Remaining blockers

1. **No confirmed Staging project.** The supplied handoff states that Production is the only known database. Reconfirm, and provision an isolated restored Staging environment before running any DDL.
2. **Migration ledger drift is unresolved.** The current evidence captures 20 local files and 4 ledger rows. Most files are not registered, but the previous FULLY APPLIED classifications rely heavily on object existence, not statement-level proof. See `evidence/MIGRATION_RECONCILIATION.md`. No blanket `migration repair`.
3. **Remaining function/API inventory.** The handoff fully documents 70 SECURITY DEFINER functions, but complete INVOKER function grants, every effective ACL, schema privileges, and all policies need review from `validation/PHASE0_REMAINING_SECURITY_GAPS_READONLY.sql`.
4. **Telegram archive trigger evidence conflicts.** Summary metadata says AFTER STATEMENT while `pg_get_triggerdef()` says `FOR EACH ROW`. Read the raw `tgtype` bits and trigger definition; this package does not modify this trigger.
5. **Expense/transfer currency semantics.** Neither table has a currency column. Current v2 cash-box RPC treats the amounts as EGP, but that does not independently prove all historical records follow the convention. Data-owner confirmation is mandatory before EGP-only legacy view changes.
6. **Legacy view dependency report needs reconciliation.** The table in `FINANCIAL_VIEWS_AND_DEPENDENCIES.md` says the v1 course-summary routine references the legacy view, while the extracted v1 function body delegates to `rbac_course_financial_summary_v2`. The dependency scan may have matched the v2 routine name as text. Recheck the live function body and avoid treating text substring matches as SQL dependencies.
7. **Application source branch matters.** AuthContext/App/Supabase client sources were retrieved from the GitHub default branch for review. Reconfirm they are identical to the intended release branch before changing application behavior.

## Release blockers

- Establish a separate restored Staging database.
- Complete read-only function/RLS/schema/trigger evidence review.
- Apply candidate SQL only on Staging and pass the test plan.
- Reconcile migration history statement-by-statement, with evidence for every effect.
- Never run `supabase db push` until all local/remote migration drift is fully understood.
