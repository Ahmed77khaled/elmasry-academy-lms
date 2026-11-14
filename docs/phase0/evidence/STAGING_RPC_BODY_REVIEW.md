# Staging RPC Body Review

**Target:** Staging `kxdfconqflveqeozanaw` (`trainerpro-phase0-staging`)
**Evidence date:** 2026-11-14
**Method:** Read-only catalog queries of effective EXECUTE, exact routine definitions (`pg_get_functiondef`), and Supabase Security Advisor results. No RPC was invoked during this review.

This is a Staging body/authorization review. It does not describe Production. The complete per-signature privilege inventory is in [CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md](CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md); this document classifies the currently reachable SECURITY DEFINER function bodies and their intended caller boundary.

## Counts and interpretation

After the approved worker and legacy-write ACL corrections, the Security Advisor reports 55 anon-callable and 56 authenticated-callable SECURITY DEFINER RPC endpoints (observed `2026-11-14T16:49:24.597Z`). All 55 anon-callable functions and the additional authenticated-only `public.is_admin()` have effective `authenticated` EXECUTE. The two SECURITY INVOKER service-worker functions and eight legacy write routines formerly reachable by anon/authenticated are now restricted to `service_role` and excluded from these SECURITY DEFINER endpoint counts.

The current Staging catalog has 55 remaining anon-callable functions with both PUBLIC EXECUTE and explicit `anon` EXECUTE. All 56 authenticated-callable functions have explicit `authenticated` EXECUTE; `is_admin()` is the only one without PUBLIC/anon EXECUTE. Production's corresponding public non-trigger functions have 0 PUBLIC / 0 anon / 56 authenticated EXECUTE. Removing PUBLIC alone would not block anon on the remaining 55 because the explicit anon grants remain. No bulk ACL change was made.

| Body class | Count in pre-correction anon/authenticated union | Guard and scope | Recommended minimum caller |
|---|---:|---|---|
| RBAC permission-gated | 41 | Calls `private.has_permission(permission_key)`, which joins `admins.auth_user_id` to `auth.uid()`, requires `is_active`, and requires the named permission unless the caller is owner | `authenticated`; remove effective anon/PUBLIC access |
| Platform-owner-gated | 8 | Calls `private.is_platform_owner()` or checks that `auth.uid()` belongs to the active owner; role and owner-management actions are additionally audited and protect the last active owner | `authenticated`; remove effective anon/PUBLIC access |
| Legacy active-admin-only | 8 | Mutating legacy routines call `public.is_admin()`, which checks active-admin identity but does not check a per-operation RBAC permission | `service_role` unless an external consumer is identified; otherwise replace the body check with the matching permission before retaining authenticated access |
| Guarded compatibility wrappers | 3 | Delegates to the corresponding guarded v2 routine: course financial summary, enrollment, or payment | `authenticated`; remove effective anon/PUBLIC access |
| Self-scoped authorization reader | 1 | `get_my_authorization()` filters to `auth.uid()` and active admin; anon receives no row because `auth.uid()` is NULL | `authenticated`; remove effective anon/PUBLIC access |
| Owner-claim pair | 2 | `can_claim_platform_owner()` is identity- and invariant-scoped; `claim_platform_owner()` rejects NULL identity, serializes claims, and requires the sole eligible active superadmin | `authenticated`; remove effective anon/PUBLIC access |
| Active-admin status helper | 1 | `is_admin()` checks only whether `auth.uid()` belongs to an active admin; it has no mutation and is not executable by anon | `authenticated`; needed by legacy callers pending deprecation |

The body-class table describes the state before the legacy ACL correction: the six anon-capable classes total 63, and all seven authenticated classes total 64. The eight legacy active-admin-only routines have since lost direct `PUBLIC`, `anon`, and `authenticated` EXECUTE. The remaining 55 anon EXECUTE findings are still broader than the application's authenticated caller contract. Static body review found identity/permission checks in those routines, but it does not substitute for negative runtime tests with an anonymous JWT.

## Routine membership

The names below are exact routines from the current Staging catalog; pair them with the full signatures and privileges in the [current matrix](CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md).

**RBAC permission-gated (41):**

`rbac_archive_cash_box`, `rbac_close_course`, `rbac_course_financial_summary_v2`, `rbac_create_cash_box`, `rbac_create_cash_box_v2`, `rbac_create_course`, `rbac_create_course_v2`, `rbac_create_student`, `rbac_create_student_v2`, `rbac_enroll_student_v2`, `rbac_finance_dashboard_metrics`, `rbac_finance_dashboard_usd_v2`, `rbac_list_admins`, `rbac_list_assignable_roles`, `rbac_list_audit_events`, `rbac_list_cash_boxes`, `rbac_list_cash_boxes_v2`, `rbac_list_courses`, `rbac_list_courses_v2`, `rbac_list_delegable_permissions`, `rbac_list_enrollments`, `rbac_list_enrollments_v2`, `rbac_list_expenses`, `rbac_list_payments`, `rbac_list_payments_v2`, `rbac_list_roles`, `rbac_list_students`, `rbac_list_students_v2`, `rbac_list_transfers`, `rbac_operational_dashboard_metrics`, `rbac_record_expense`, `rbac_record_payment_v2`, `rbac_search_payments`, `rbac_set_enrollment_status`, `rbac_transfer_between_boxes`, `rbac_update_course`, `rbac_update_course_v2`, `rbac_update_student`, `rbac_update_student_v2`, `rbac_void_expense`, `rbac_void_payment`.

**Platform-owner-gated (8):** `rbac_create_custom_role`, `rbac_delete_custom_role`, `rbac_get_telegram_group_language`, `rbac_set_admin_active`, `rbac_set_admin_owner`, `rbac_set_admin_role`, `rbac_set_telegram_group_language`, `rbac_update_custom_role_permissions`.

**Legacy active-admin-only (8 mutations):** `create_cash_box`, `enroll_student`, `record_expense`, `record_payment`, `set_enrollment_status`, `transfer_between_boxes`, `void_expense`, `void_payment`. **Authenticated-only status helper:** `is_admin()`.

**Guarded wrappers (3):** `rbac_course_financial_summary`, `rbac_enroll_student`, `rbac_record_payment`.

**Self-scoped reader:** `get_my_authorization`. **Owner-claim pair:** `can_claim_platform_owner`, `claim_platform_owner`.

## Staging legacy RPC ACL correction (executed and verified 2026-11-14)

After the explicit approval, the exact eight signatures in the [privilege matrix](CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md) were changed on Staging only. `PUBLIC`, `anon`, and `authenticated` EXECUTE were revoked; `service_role` EXECUTE was retained. No routine was invoked, no application row or outbox row was changed, and no migration-ledger entry was written.

The transaction's in-database assertions checked every legacy signature and all eight corresponding RBAC wrappers before commit. Independent post-commit SELECT verification returned the same ACL for every legacy function: `{postgres=X/postgres,service_role=X/postgres}`. Effective privileges for each were `anon=false`, `authenticated=false`, `service_role=true`, and `PUBLIC EXECUTE=false`. All eight wrappers retained `authenticated=true` and `service_role=true`.

Fresh Staging catalog capture found 76 total public/private routines, 59 database-callable by anon, 66 by authenticated, and 76 by service_role. The public non-trigger SECURITY DEFINER RPC candidate counts are 55 anon and 56 authenticated. Supabase Security Advisor independently reports the same 55/56 endpoint counts at `2026-11-14T16:49:24.597Z`. The leaked-password-protection warning remains. A bounded read-only REST log query for the preceding 24 hours returned no calls to these eight legacy RPC paths; this cannot rule out dormant or external consumers.

The six directly delegating RBAC wrappers still call the legacy implementation as their `postgres` definer owner after checking their permission key. The two compatibility wrappers `rbac_enroll_student` and `rbac_record_payment` now delegate to their respective v2 permission-checked functions; those current Staging bodies were read and confirmed to check `enrollments.create` and `finance.payments.record`. No wrapper grant changed.

Behavior tests for restricted-role denial and allowed-role success remain unrun. No authenticated restricted identity was created, no legacy or RBAC write RPC was invoked, and no real administrator identity was used.

## Findings and priority

### P1 — Legacy write RPC ACL boundary corrected; body-level guard remains broad

The eight legacy write functions above are `SECURITY DEFINER` and their bodies only ask `public.is_admin()` whether the caller is an active administrator; they do not check operation-specific permission keys. The application call-site scan finds the frontend calling the `rbac_*` replacements, not these eight legacy names. Before the targeted ACL correction, an active restricted administrator could therefore have bypassed granular permissions by calling a legacy RPC directly. That direct anon/authenticated path is now blocked by the Staging ACLs described below; the broad body check remains relevant only to privileged service-role/owner-level callers and any external code running with such authority.

The Staging aggregate read found one active platform owner and one inactive `superadmin`; it found no active restricted administrator. The assignable `academy_manager` role has 12 permissions and omits finance write permissions; the assignable `finance_manager` role has 14 permissions and omits student/course creation. Both roles are present in `admin_roles` and `is_assignable=true`. The legacy functions do not check these permission lists, so they would let an active user in either restricted role call operations outside that role's permission set. This is a confirmed authorization-boundary mismatch and a latent privilege escalation if a restricted account is activated; no unauthorized mutation was demonstrated and no test RPC was invoked. Do not test by invoking a write RPC against live data.

**Disposition:** Staging now matches the Production caller boundary for these eight signatures: `PUBLIC`, `anon`, and `authenticated` cannot execute them; `service_role` can. A read-only 24-hour REST-log query found no direct requests to the eight paths, but that limited window does not establish that no dormant external consumer exists. Do not broaden grants again. Production remains read-only.

### P2 — Anonymous EXECUTE remains broader than the application contract

The 55 remaining anon-callable SECURITY DEFINER functions have identified identity or permission guards, self-scope, or guarded delegation. No unauthenticated read/write path was demonstrated. The frontend call sites use authenticated sessions and do not establish a need for anon EXECUTE on these routines. A further least-privilege change would need to revoke both inherited PUBLIC and explicit anon EXECUTE after confirming there is no external anonymous client. Preserve authenticated grants where the application uses the endpoint and the body checks the permission boundary.

### P2 — Auth leaked-password protection is disabled

Staging Security Advisor reports `auth_leaked_password_protection`. This is an Auth configuration warning, separate from RPC authorization. No Auth setting was changed.

## Test status and limits

- No function was invoked; body review is static evidence from the current Staging definitions.
- Anonymous negative calls and restricted-admin negative calls remain untested. Do not use an existing or real admin account; the historical synthetic account credentials are considered exposed.
- Do not blanket-revoke the remaining 55 SECURITY DEFINER functions. First preserve app call-site grants, review any non-frontend consumers, and agree on the exact Staging-only operation.
- Supabase Security Advisor directly confirms REST RPC reachability for its 55/56 warnings. The full Data API schema setting was not separately captured.
