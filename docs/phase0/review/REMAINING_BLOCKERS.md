# Remaining blockers — Phase 0

## Confirmed defects addressed by the draft migrations

- `public.is_admin()` does not require `admins.is_active IS TRUE`.
- `prevent_cash_box_mutation()` does not prevent modification of `opening_balance_usd`; the candidate patch also mirrors the existing RPC upper bound for USD.
- Live `cash_boxes_added_by_fkey` evidence reports `NO ACTION`, conflicting with migration 008's `ON DELETE SET NULL` intent and the trigger's nullification allowance. The candidate patch changes only the FK action and trigger behavior, deliberately preserving the current `added_by` column default.
- Legacy financial views aggregate payment amounts without a currency filter.
- Future postgres-created public objects inherit excessive API-role default privileges. The candidate patch also removes PostgreSQL's implicit PUBLIC EXECUTE default globally for future postgres-created functions; this needs an all-schema staging review.

## Items intentionally not changed

1. **Migration ledger:** 20 local migration files versus 4 remote ledger rows. The source comments, live ledger, and object evidence conflict for several files. Never bulk-repair the 16 unregistered versions using object existence checks.
2. **Function/API inventory:** the handoff fully documents 70 SECURITY DEFINER functions, but it does not contain the complete inventory for ordinary SECURITY INVOKER routines, all effective ACLs, or complete schema privileges/RLS evidence. Run `PHASE0_REMAINING_SECURITY_GAPS_READONLY.sql` and inspect results before declaring the API surface closed.
3. **Telegram archive trigger:** the report's metadata says STATEMENT while `pg_get_triggerdef()` says FOR EACH ROW. The read-only post-apply check prints both `tgtype` and the trigger definition. This package does not modify the Telegram trigger.
4. **Expense/transfer currency semantics:** neither table has a currency column, and the current v2 cash-box RPC treats these movements as EGP. Historical business semantics must still be confirmed with the data owner.
5. **Application files:** actual `AuthContext.tsx`, `App.tsx`, and `supabase.ts` sources were not included in the evidence bundle. No frontend patch can be responsibly authored from a call-reference table alone.
6. **No Staging:** the handoff states Production is the only database. Production execution is therefore not approved.

## Release blockers

- A separate Staging database must exist and be restored from a recent backup.
- The remaining read-only function/RLS/schema/trigger evidence must be reviewed.
- Each draft migration must be applied and functionally tested on Staging.
- Migration history must be reconciled migration-by-migration with full statement-level evidence; no blanket `migration repair`.
- No `supabase db push` until the old migration drift is conclusively resolved.