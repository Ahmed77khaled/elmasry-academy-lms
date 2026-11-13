# Phase 0 remediation review — function and application findings

Target: TrainerPro (`urmkcixqpoqkiosihhal`)  
Basis: supplied evidence handoff, full 70-function source extract, financial-view definitions, trigger and ACL extracts.  
Review mode: offline source review only; no database or repository connection was used.

## SECURITY DEFINER review

The handoff contains 70 SECURITY DEFINER functions. The supplied inventory reports all 70 owned by `postgres`, each with an explicit fixed `search_path`, and no effective EXECUTE grant to `anon` or `PUBLIC`. The direct permission-check count is 42. The remaining functions must be interpreted by behavior rather than mechanically marked unsafe:

- `rbac_course_financial_summary(uuid)` delegates to `rbac_course_financial_summary_v2`, where `finance.reports.read` is checked.
- `rbac_enroll_student(uuid, uuid, numeric, text)` delegates to its v2 implementation, where the permission check occurs.
- `rbac_record_payment(...)` delegates to the v2 payment implementation.
- `rbac_record_expense(...)` contains a finance expense permission guard.
- `rbac_set_admin_owner(uuid, boolean)` uses an active-owner check against the current user's admin row.
- Several legacy unprefixed mutators require `is_admin()` but are not executable by `authenticated` or `anon` according to the supplied ACL evidence.
- Trigger-only functions and current-user-scoped readers have different legitimate authorization models.

No second confirmed SECURITY DEFINER privilege bypass was identified in the supplied 70-function source. This is not a closure statement: the evidence package does not yet include every ordinary SECURITY INVOKER routine, all effective schema privileges, and the complete RLS policy review.

## Confirmed fixes prepared

1. `public.is_admin()` now requires `admins.is_active IS TRUE`, while preserving VOLATILE, SECURITY DEFINER, `search_path`, owner, and intended execute grants.
2. `public.prevent_cash_box_mutation()` will guard both EGP and USD opening balances, including the same upper threshold used by `rbac_create_cash_box_v2`.
3. `cash_boxes_added_by_fkey` will be changed from NO ACTION to ON DELETE SET NULL, matching the two source migrations and the trigger's explicit allowance for FK-driven nullification. The column default is preserved.
4. Legacy financial views will expose EGP-only monetary totals while retaining their audited output contracts and `security_invoker=true`; USD remains on v2 RPCs.
5. New postgres-created public tables/sequences/functions will not inherit broad anon/authenticated defaults. The implicit PUBLIC EXECUTE default will also be removed for future postgres-created functions globally, so cross-schema Staging regression checks are mandatory.

## Not safe to change from current evidence

- Migration ledger reconciliation: 20 local files versus 4 live ledger rows, plus conflicting source comments and object-state evidence. No historical migration repair is prepared.
- Telegram archive notification trigger: report metadata and `pg_get_triggerdef` disagree on ROW vs STATEMENT; this patch does not touch it.
- Expense/transfer currency history: the present schema and v2 RPC treat these as EGP, but lack of a currency column is not proof of historic accounting intent. The academy data owner must confirm this before enabling the EGP-only views on Staging.
- Frontend AuthContext code: source file contents were not included in the evidence package, so no source code patch is fabricated.

## Execution status

All SQL files are forward-only candidate migrations. They were reviewed against the supplied extracts but not parsed by a PostgreSQL server, executed on Staging, executed on Production, or committed to the Git repository. Production status remains NO-GO.