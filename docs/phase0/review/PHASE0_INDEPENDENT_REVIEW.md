# PHASE 0 — Independent Technical Review of Evidence Handoff

**Target project:** `urmkcixqpoqkiosihhal` (TrainerPro)  
**Evidence package reviewed:** `PHASE0_EVIDENCE_HANDOFF.zip`  
**Evidence date:** 13 November 2026  
**Review type:** Offline review of supplied SQL, PostgreSQL extracts, and audit reports. No connection to Supabase was made during this review; no SQL was executed against any database.

## 1. Executive decision

**Phase 0 status remains: OPEN / NOT CLEARED FOR PRODUCTION CHANGES.**

The handoff is materially better than the earlier summaries: it contains 20 local migration files, the full source of 70 SECURITY DEFINER functions, four legacy view definitions, selected live table schemas, trigger code, and application RPC references. It also contains several contradictions that make the migration classifications and some production assumptions unsafe to accept as final.

No production SQL should be applied from this package yet. In particular, do not run `supabase db push`, `supabase migration repair`, or any of the three draft remediation SQL files until the gaps below are resolved and a safe test environment exists.

## 2. Findings confirmed from the supplied evidence

### 2.1 SECURITY DEFINER inventory

- The report contains 70 SECURITY DEFINER functions.
- The inventory states all 70 are owned by `postgres`, whose role is `BYPASSRLS` but not superuser.
- All 70 have an explicit fixed `search_path`; the supplied list shows `pg_catalog` alone or a fixed list including `public`, `private`, and/or `auth`.
- The inventory reports no `PUBLIC` or `anon` EXECUTE for these 70 functions. The exposed authenticated endpoints generally have explicit `authenticated` and `service_role` execution grants. The legacy unprefixed mutation functions are reported as non-executable by `authenticated` and `anon`.
- 42 functions directly call `private.has_permission`; other valid patterns include wrappers that delegate to a permission-checked v2 function, owner-only checks, current-user-scoped readers, and trigger-only functions. Absence of a direct `has_permission` call is not on its own proof of a vulnerability.

**Confirmed defect candidate — `public.is_admin()`:** its supplied live definition is:

```sql
SELECT EXISTS (
  SELECT 1 FROM public.admins
  WHERE auth_user_id = auth.uid()
);
```

It does not filter `is_active IS TRUE`, whereas `private.has_permission()`, `private.is_platform_owner()`, and `get_my_authorization()` all do. The application reference report shows `is_admin()` is called from `src/context/AuthContext.tsx` (lines 62, 282, and 298). This means a disabled admin can still receive `true` from the boolean admin check. From the supplied evidence alone, I cannot prove that this bypasses protected RPC data because the RBAC RPCs check the active-aware permission helper; however, it is an authorization-state inconsistency and should be corrected and regression-tested.

**Scope limitation:** the 70-function report covers SECURITY DEFINER functions only. It does not provide a full ACL inventory for every ordinary SECURITY INVOKER function in `public`/`private`, nor complete schema CREATE/USAGE privileges or all live RLS policies. Therefore the wider function/API exposure audit is not yet complete.

### 2.2 Default privileges

The raw `pg_default_acl` evidence confirms that objects created by `postgres` in `public` have future default grants for `anon` and `authenticated` on tables, sequences, and functions. The report also shows separate defaults for `supabase_admin`; no application objects in `public` were reported as owned by `supabase_admin`.

The V3 default-privilege draft correctly avoids trying to alter `supabase_admin` defaults and preserves `service_role` defaults. It also recognizes that revoking a per-schema default does not cancel a global default grant.

**Important scope warning:** the draft's `ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC` is global for functions created by `postgres`, not limited to `public`. That is the PostgreSQL mechanism needed to remove the built-in PUBLIC function-execute default, but it can affect future postgres-created functions in other schemas too. Before production use, inventory the intended function access in all affected schemas and ensure future migrations explicitly grant EXECUTE where required. Existing function ACLs are not changed by this statement.

### 2.3 Financial views and currency treatment

The supplied live definitions show all four legacy financial views aggregate `payments.amount` without currency filters. The application mapping says the frontend uses RPCs rather than selecting these views directly. The currency-aware RPC definitions in the handoff calculate EGP and USD separately.

The V3 view rewrite keeps the same output names and ordering and adds EGP filtering for payments/enrollments. On inspection, its expressions appear designed to retain the four reported output contracts. However, no PostgreSQL parser/staging run or exact live-contract assertion is included in the handoff, so this is a code review, not execution validation.

The source schema shows `expenses` and `cash_box_transfers` have no currency column. The application/RPC design treats them as EGP amounts; their values cannot be retrospectively distinguished as EGP or USD from the columns alone. The EGP-only rewrite therefore depends on that business/data convention being true for historical rows. The absence of a currency column supports the model but does not independently prove how every historical amount was entered.

### 2.4 Cash-box immutability and foreign-key contradiction

The supplied live trigger function checks immutability of `opening_balance` but not `opening_balance_usd`. The V3 trigger draft adds the USD check. This part of the proposed change addresses a real gap.

However, a more important inconsistency appears in the same evidence:

- `CASH_BOX_TRIGGER_EVIDENCE.md` and `RELEVANT_TABLE_SCHEMAS.md` report `cash_boxes_added_by_fkey` with `confdeltype = 'a'`, i.e. `NO ACTION`.
- Migration `202610210008_protect_cash_boxes_opening_balance.sql` says the `added_by` FK is created with `ON DELETE SET NULL`.
- Migration `20261021171218_allow_cash_box_creator_nullification_on_auth_delete.sql` and the live trigger function explicitly assume/allow an FK-driven nullification to NULL.

If the live FK is indeed `NO ACTION`, deleting an Auth user referenced by `cash_boxes.added_by` will not invoke SET NULL and will be blocked by the FK. The trigger's allowance for a NULL transition does not change the FK action. The USD immutability patch does not fix this mismatch.

The trigger metadata table also labelled the archive trigger as `AFTER / STATEMENT` while the supplied `CREATE TRIGGER` definition said `FOR EACH ROW`. Those cannot both be true. **Resolved 2026-11-14:** fresh raw `pg_trigger.tgtype=17` and `pg_get_triggerdef()` queries on Production and Staging confirm `AFTER UPDATE OF is_active ... FOR EACH ROW`; the summary label was wrong.

### 2.5 Migration ledger and source provenance

The package contains 20 local migration files and reports four remote ledger rows. The inventory and reconciliation documents disagree in several important ways:

1. The inventory table marks **three** files as draft: `20261022230000`, `20261023090000`, and `20261023100000`. Its own summary section then says there is only **one** draft (`20261023090000`).
2. `20261022230000_rbac_authorization_cutover.sql` explicitly says `NOT APPLIED`, but its version is present in the live migration ledger. The report also shows important cutover effects (no direct table grants for anon/authenticated and no authenticated EXECUTE on legacy mutation functions). The source file and remote ledger therefore have a provenance conflict.
3. `20261023100000_platform_audit_and_telegram_outbox.sql` explicitly says `LOCAL DRAFT ONLY — do not apply`, is absent from the ledger, yet the report claims its tables have live rows and the SECURITY DEFINER evidence contains three functions whose definitions match this migration. The two other functions in this migration (`enqueue_admin_login_notification`, `claim_telegram_notifications`) and the full live table/trigger/constraint definitions were not included in the evidence handoff.
4. The reconciliation classifies `20261021171218` as fully applied based primarily on the function body, but the reported live FK action conflicts with the prerequisite assumption in that migration's purpose.
5. The report calls 15 migrations “applied but unregistered” based mainly on existence of selected objects. Object existence alone cannot prove every statement in a migration was applied. Several of these files create or replace many functions, constraints, triggers, grants, and policies.

I independently compared the migration source files with the supplied live SECURITY DEFINER function evidence using whitespace-normalized function bodies. The evidence shows exact body matches for all 15 functions in `20261030130000` and all 3 functions in `20261030120000`. It also shows later live replacements for several earlier functions. This is useful evidence, but it still does not establish every non-function statement of those migrations.

### 2.6 No staging environment

The README says there is no staging environment and production is the only database. This is a hard release blocker for these untested database changes. Atomic SQL transactions and rollback scripts do not substitute for validating behavior on a non-production copy, especially for views, grants, RLS, and FK/trigger interactions.

## 3. Revised decision matrix

| Work item | Decision | Reason |
|---|---|---|
| Default ACL hardening draft | **NO-GO for production now; candidate for staging** | Risk is understood, but global PUBLIC function default affects future postgres-created functions across schemas; all ordinary function grants/schema privileges are not yet inventoried; no staging. |
| EGP-only legacy view rewrite | **NO-GO for production now; candidate for staging** | Currency intent is plausible and RPCs are currency-aware, but historical expense/transfer semantics and exact dependency/output contracts need a staged compatibility test. |
| USD opening-balance trigger patch | **NO-GO for production now; candidate after FK/trigger reconciliation** | USD immutability gap is real, but the `added_by` FK action in live evidence contradicts migration assumptions; trigger metadata also contains a row/statement inconsistency. |
| `is_admin()` active-status correction | **Prepare forward-only patch; test before production** | The supplied function returns true for disabled admins. Confirm intended active-admin behavior and app AuthContext flow, then test. |
| Migration ledger repair | **NO-GO** | Source comments, draft flags, ledger rows, FK state, and claimed live objects conflict. No batch `migration repair`. |

## 4. Working migration classification — conservative view

This table separates what the ledger records from what the supplied object evidence proves. It intentionally does not repeat the earlier “fully applied” conclusions where only one object-existence check was given.

| Version | File | Conservative finding from supplied evidence |
|---|---|---|
| 20261015024100 | `_001_create_core_tables` | **UNKNOWN / likely superseded** — live table inventory differs from the original `cash_transfers`/legacy ID schema; later migrations may have transformed it. No exact full-schema comparison. |
| 20261015024134 | `_002_create_database_views` | **OBJECTS PRESENT, ORIGINAL CONTENT SUPERSEDED** — all four named views exist, but live definitions are later currency-unaware/current definitions; exact migration-by-migration state not proved. |
| 20261015024155 | `_003_create_rpc_functions` | **SUPERSEDED / UNKNOWN** — old functions exist in later hardened form; source body differs. |
| 20261015024209 | `_004_fix_constraint_and_seed` | **PARTIALLY CORROBORATED** — `uq_enrollment` and role seed objects are claimed present; exact seed rows and all statements not supplied. |
| 202610210005 | `production_hardening` | **LIKELY APPLIED, LATER REPLACED IN PART** — several live function bodies match; some have subsequent definitions. Full trigger/constraint/policy comparison absent. |
| 202610210006 | `security_and_authorization_hardening` | **LIKELY APPLIED, LATER REPLACED IN PART** — `is_admin` body matches; other functions were later replaced. Full RLS/policy state absent. |
| 202610210007 | `purge_legacy_rls_and_revoke_public` | **UNKNOWN / EFFECTS PARTIALLY CORROBORATED** — table grants appear revoked, but policies, triggers and all statements not fully checked. |
| 202610210008 | `protect_cash_boxes_opening_balance` | **PARTIALLY CORROBORATED / FK SEMANTICS CONFLICT** — `create_cash_box` and trigger behavior exist, but the reported FK is NO ACTION, conflicting with the migration's `ON DELETE SET NULL` intent. |
| 20261021171218 | `allow_cash_box_creator_nullification...` | **FUNCTION BODY PRESENT; END-TO-END OBJECTIVE NOT VERIFIED** — trigger allows NULL transition, but the live FK evidence says NO ACTION. Not in ledger. |
| 20261021214608 | `add_login_alert_dedupe` | **LEDGER-RECORDED; TABLE PRESENT** — strong corroboration, though complete constraints/ACL check not supplied. |
| 20261021223822 | `rbac_catalog_and_authorization_primitives` | **LIKELY APPLIED** — five function bodies match; table/constraint/seed/ACL/policy comparison not complete. |
| 20261021224440 | `rbac_role_aware_data_endpoints` | **LIKELY APPLIED, LATER REPLACED IN PART** — most listed function bodies match; two endpoints differ due later replacement. |
| 20261021224905 | `rbac_permission_checked_write_endpoints` | **LIKELY APPLIED, LATER REPLACED IN PART** — most function bodies match; selected definitions differ later. |
| 20261022225500 | `rbac_multiple_platform_owners` | **LIKELY APPLIED** — all three listed function bodies match and `admins.is_owner` is present. |
| 20261022230000 | `rbac_authorization_cutover` | **LEDGER-RECORDED; EFFECTS CORROBORATED; SOURCE PROVENANCE CONFLICT** — ledger contains the version and key revocations appear in live grants, but the local file itself says NOT APPLIED. |
| 20261023090000 | `branding_and_admin_avatars` | **DRAFT / NOT APPLIED** — source labels draft and `academy_branding` is reported absent. |
| 20261023100000 | `platform_audit_and_telegram_outbox` | **UNKNOWN / OBJECTS AND SOME FUNCTIONS REPORTED PRESENT; SOURCE LABELS DRAFT** — live rows and three function body matches are reported; full schema and two non-SECURITY DEFINER function definitions are missing. Not in ledger. |
| 20261023110000 | `telegram_notification_language` | **LEDGER-RECORDED; TWO FUNCTION BODIES MATCH** — table definition/state and complete ACLs not supplied. |
| 20261030120000 | `student_profile_directory_v2` | **LEDGER-RECORDED; THREE FUNCTION BODIES AND COLUMNS CORROBORATED** — local file is untracked despite a live ledger row. |
| 20261030130000 | `course_enrollment_currency_v2` | **HIGH-CONFIDENCE APPLIED OBJECTS, NOT LEDGER-RECORDED** — all 15 function bodies match the supplied live function evidence and columns/constraints are present; still verify every table constraint, grant, and transaction effect before calling fully applied. |

**Therefore:** the “15 applied-but-unregistered” total is a hypothesis, not an adequate basis for repairing 15 ledger versions in one command.

## 5. Required evidence to close this review

The file `PHASE0_REVIEW_GAPS_READONLY.sql` in this package contains read-only queries for:

- every public/private function, not just SECURITY DEFINER functions, with effective grants and PUBLIC ACL entries;
- CREATE/USAGE privileges on relevant schemas;
- RLS flags and all live policies;
- exact `cash_boxes.added_by` FK action and exact trigger row/statement/status metadata;
- schemas, constraints, indexes and triggers for the platform audit/outbox tables;
- definitions of the non-SECURITY DEFINER functions missing from the 70-function report;
- exact current financial view column signatures and definitions.

Application source files still needed to validate the inactive-admin behavior are `src/context/AuthContext.tsx`, `src/App.tsx`, and any component that uses `is_admin`/`get_my_authorization`. The evidence bundle currently gives a call map, not the complete application source.

## 6. Immediate operational rules

1. Keep production untouched while the evidence gaps remain.
2. Do not run `supabase db push`.
3. Do not run `supabase migration repair` for any version yet.
4. Do not edit historical migration files to make them look reconciled; use forward-only migrations after the live state is fully known.
5. Since the handoff says no staging project exists, create a sanitized staging clone or restore a recent production backup into an isolated project before testing. Do not experiment on production.

---

**Review result:** evidence reviewed; several issues confirmed; remediation package is not yet approved for production application.
