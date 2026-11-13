# Legacy Financial View Consumer Review

**Scope:** local application source and retained Phase 0 evidence for Candidate 4, `20261113190300_make_legacy_financial_views_egp_only.sql`.

**Decision:** Candidate 4 remains **HOLD**. This review is source/evidence analysis only. No Supabase SQL was executed and no project was changed.

## Findings

| Legacy view | Direct application `.from(view)` consumer found in `src/` | Related UI path | Assessment |
| --- | --- | --- | --- |
| `enrollment_balances` | No | Enrollment rows use `rbac_list_enrollments` in `CourseDetailsPage.tsx`, `StudentDetailsPage.tsx`, `EnrollmentsPage.tsx`, `CoursesPage.tsx`, and enrollment/payment forms. | No direct view read found. RPC implementations remain the relevant contract. |
| `cash_box_balances` | No | Cash box screens/forms use `rbac_list_cash_boxes` (`CashBoxesPage.tsx`, `SettingsPage.tsx`, `PaymentForm.tsx`, `ExpenseForm.tsx`, `QuickEnrollModal.tsx`). | No direct view read found. |
| `course_financial_summary` | No | `CourseDetailsPage.tsx:97` calls `rbac_course_financial_summary` (without `_v2`). | Indirect compatibility-RPC path; retained sources conflict on whether this routine reads the legacy view. |
| `dashboard_metrics` | No | `DashboardPage.tsx:57-59` calls `rbac_operational_dashboard_metrics` and `rbac_finance_dashboard_metrics`. | No direct view read found. The nearby JSX comment at line 118 says the KPI data comes from `dashboard_metrics`, but the actual calls are RPCs. |

The search across `src/` and `supabase/functions/` found no `.from()` reads of the four view names. This only establishes the checked repository's direct-client behavior; it does not establish that no external scripts, integrations, or separately deployed clients use the views.

## Conflicting evidence: course summary RPC

The application call at `src/pages/CourseDetailsPage.tsx:97` uses `rbac_course_financial_summary`. Two retained artifacts disagree about its dependency:

- `docs/phase0/evidence/FINANCIAL_VIEWS_AND_DEPENDENCIES.md`, sections 1 and 4, says this routine references `course_financial_summary`.
- That same report's sections 1 and 5 incorrectly describe the app call as `rbac_course_financial_summary_v2`; current checked source calls `rbac_course_financial_summary`.
- The retained Production function definition in `docs/phase0/evidence/PHASE0_RPC_SECURITY_DEFINER_SOURCE_EVIDENCE.md` (routine 15) returns rows from `public.rbac_course_financial_summary_v2(p_course_id)`.
- The migration snapshot `docs/phase0/migrations-snapshot/20261030130000_course_enrollment_currency_v2.sql` defines that wrapper in the same way, and the v2 function body calculates results from source tables.
- Candidate 4's header comments claim that the application RPC is backed by the legacy view. That claim is not supported by the retained Production function definition above.

The source evidence and the view dependency report therefore cannot both describe the same routine definition. Until this is reconciled against a captured, same-project function definition and dependency result, do not treat the v1-named application call as proof either that the view is used or that it is unused. The archived dependency report also misstates the current UI RPC name; this correction is recorded at the top of that report without deleting its original evidence tables.

## Candidate 4 review implications

1. The checked client code does not directly select any of the four views.
2. Existing RPCs and non-application consumers still need contract review; the `course_financial_summary` evidence conflict blocks a clean dependency conclusion.
3. `DashboardPage.tsx` has a stale comment naming `dashboard_metrics`; its data is loaded through two RBAC RPCs.
4. The code search cannot establish that third-party/reporting clients do not depend on the existing monetary semantics or column contracts.
5. Candidate 4 changes four view definitions and monetary aggregation behavior. Its staged validation must cover the RPC dependency discrepancy, output column contracts, EGP/USD separation, and external consumer inventory before a sign-off decision.

## Evidence inspected

- `src/pages/DashboardPage.tsx:57-59,118`
- `src/pages/CourseDetailsPage.tsx:97,104`
- Related application RPC call sites in `src/pages/`, `src/components/forms/`, and `src/components/forms/QuickEnrollModal.tsx`
- `docs/phase0/evidence/FINANCIAL_VIEWS_AND_DEPENDENCIES.md`
- `docs/phase0/evidence/PHASE0_RPC_SECURITY_DEFINER_SOURCE_EVIDENCE.md` (Production routine 15)
- `docs/phase0/migrations-snapshot/20261030130000_course_enrollment_currency_v2.sql`
- `docs/phase0/drafts/migrations/20261113190300_make_legacy_financial_views_egp_only.sql`

## Required next evidence before reconsidering HOLD

- Use the prepared, SELECT-only capture in `docs/phase0/validation/PHASE0_FINANCIAL_VIEW_DEPENDENCY_READONLY.sql` to reconcile same-project function definitions and dependency evidence for all four views, only after separate authorization and fresh target-ref verification.
- Confirm whether the production and staging function definitions are identical to the archived evidence.
- Inventory any reporting, export, or external client that reads the four views directly.
- Keep Candidate 4 in `docs/phase0/drafts/` until the above evidence and the Staging test cases have been reviewed.
