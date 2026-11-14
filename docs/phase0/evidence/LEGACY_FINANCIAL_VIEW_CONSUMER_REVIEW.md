# Legacy Financial View Consumer Review

**Scope:** local application source and retained Phase 0 evidence for Candidate 4, `20261113190300_make_legacy_financial_views_egp_only.sql`.

**Decision:** Candidate 4 remains **HOLD**. This is a source/evidence review; the fresh read-only catalog observations it relies on are recorded separately. No database mutation or project change is authorized by this review.

## Findings

| Legacy view | Direct application `.from(view)` consumer found in `src/` | Related UI path | Assessment |
| --- | --- | --- | --- |
| `enrollment_balances` | No | Enrollment rows use `rbac_list_enrollments` in `CourseDetailsPage.tsx`, `StudentDetailsPage.tsx`, `EnrollmentsPage.tsx`, `CoursesPage.tsx`, and enrollment/payment forms. | No direct view read found. RPC implementations remain the relevant contract. |
| `cash_box_balances` | No | Cash box screens/forms use `rbac_list_cash_boxes` (`CashBoxesPage.tsx`, `SettingsPage.tsx`, `PaymentForm.tsx`, `ExpenseForm.tsx`, `QuickEnrollModal.tsx`). | No direct view read found. |
| `course_financial_summary` | No | `CourseDetailsPage.tsx:97` calls `rbac_course_financial_summary` (without `_v2`). | Indirect compatibility-RPC path; fresh Production and Staging definitions both delegate to v2, whose body reads base tables and does not reference the legacy views. |
| `dashboard_metrics` | No | `DashboardPage.tsx:57-59` calls `rbac_operational_dashboard_metrics` and `rbac_finance_dashboard_metrics`. | No direct view read found. The nearby JSX comment at line 118 says the KPI data comes from `dashboard_metrics`, but the actual calls are RPCs. |

The search across `src/` and `supabase/functions/` found no `.from()` reads of the four view names. This only establishes the checked repository's direct-client behavior; it does not establish that no external scripts, integrations, or separately deployed clients use the views.

## Conflicting evidence: course summary RPC

The application call at `src/pages/CourseDetailsPage.tsx:97` uses `rbac_course_financial_summary`. The retained evidence has an apparent dependency conflict, which local inspection can explain:

- `docs/phase0/evidence/FINANCIAL_VIEWS_AND_DEPENDENCIES.md`, section 4, labels a text-search result as “Mentions course_financial_summary = true.”
- That same report's sections 1 and 5 incorrectly describe the app call as `rbac_course_financial_summary_v2`; current checked source calls `rbac_course_financial_summary`.
- The retained Production function definition in `docs/phase0/evidence/PHASE0_RPC_SECURITY_DEFINER_SOURCE_EVIDENCE.md` (routine 15) returns rows from `public.rbac_course_financial_summary_v2(p_course_id)`.
- The migration snapshot `docs/phase0/migrations-snapshot/20261030130000_course_enrollment_currency_v2.sql` defines that wrapper in the same way, and the v2 function body calculates results from source tables.
- The substring `course_financial_summary` occurs inside `rbac_course_financial_summary_v2`, so the report's “Mentions” boolean can be true even when the function body does not reference the legacy view. The archived function definition therefore explains the apparent conflict; the retained text-match is not catalog dependency evidence.

The archived Production definition supports that the v1-named wrapper delegates to v2, not directly to the legacy view. Fresh SELECT-only Production and Staging captures on 2026-11-14 now establish that both current wrappers delegate to their corresponding v2 function. Both v2 bodies read base tables and do not reference the legacy views; a text scan of public/private function and procedure bodies and catalog-tracked direct dependencies found no view references. The capture documents that `pg_depend` alone is insufficient for PL/pgSQL bodies. Dynamic SQL and external/non-routine consumers remain outside this evidence. The archived report also misstates the current UI RPC name; the correction is recorded at its top without deleting the original evidence table.

## Candidate 4 review implications

1. The checked client code does not directly select any of the four views.
2. The database RPC dependency conflict is resolved by the fresh same-project captures. External reports, SQL clients, and separately deployed clients still need contract review.
3. `DashboardPage.tsx` has a stale comment naming `dashboard_metrics`; its data is loaded through two RBAC RPCs.
4. The code search cannot establish that third-party/reporting clients do not depend on the existing monetary semantics or column contracts.
5. Candidate 4 changes four view definitions and monetary aggregation behavior. Its staged validation must confirm the current wrapper definition, output column contracts, EGP/USD separation, and external consumer inventory before a sign-off decision.

## Evidence inspected

- `src/pages/DashboardPage.tsx:57-59,118`
- `src/pages/CourseDetailsPage.tsx:97,104`
- Related application RPC call sites in `src/pages/`, `src/components/forms/`, and `src/components/forms/QuickEnrollModal.tsx`
- `docs/phase0/evidence/FINANCIAL_VIEWS_AND_DEPENDENCIES.md`
- `docs/phase0/evidence/PHASE0_RPC_SECURITY_DEFINER_SOURCE_EVIDENCE.md` (Production routine 15)
- `docs/phase0/migrations-snapshot/20261030130000_course_enrollment_currency_v2.sql`
- `docs/phase0/drafts/migrations/20261113190300_make_legacy_financial_views_egp_only.sql`

## Required next evidence before reconsidering HOLD

- Database function definitions and routine-to-view dependency scans have been captured on Production and Staging; see `PHASE0_READONLY_CATALOG_CAPTURE_20261114.md`.
- Inventory any reporting, export, or external client that reads the four views directly.
- Obtain data-owner confirmation that expenses and transfers without currency columns represent EGP and that EGP-only legacy view outputs are the intended contract.
- Keep Candidate 4 in `docs/phase0/drafts/` until the above evidence and the Staging test cases have been reviewed.
