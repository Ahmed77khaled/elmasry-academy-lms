# Staging RPC Body Review

**Target:** Staging `kxdfconqflveqeozanaw` (`trainerpro-phase0-staging`)
**Evidence date:** 2026-11-14
**Method:** Read-only catalog queries of effective EXECUTE, exact routine definitions (`pg_get_functiondef`), and Supabase Security Advisor results. No RPC was invoked during this review.

This is a Staging body/authorization review. It does not describe Production. The complete per-signature privilege inventory is in [CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md](CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md); this document classifies the currently reachable SECURITY DEFINER function bodies and their intended caller boundary.

## Counts and interpretation

After the approved worker ACL correction, the Security Advisor reports 63 anon-callable and 64 authenticated-callable SECURITY DEFINER RPC endpoints. All 63 anon-callable functions and the additional authenticated-only `public.is_admin()` have effective `authenticated` EXECUTE. The two SECURITY INVOKER service-worker functions formerly reachable by anon/authenticated are now restricted to `service_role` and are excluded from these SECURITY DEFINER counts.

Expanded ACLs show that all 63 Staging anon-callable functions have both PUBLIC EXECUTE and an explicit `anon` EXECUTE grant. All 64 authenticated-callable functions have an explicit `authenticated` EXECUTE grant; `is_admin()` is the only one without PUBLIC/anon EXECUTE. Production's corresponding public non-trigger functions have 0 PUBLIC / 0 anon / 56 authenticated EXECUTE. Revoking PUBLIC alone would not block anon because the explicit anon grants remain; a least-privilege change would need to revoke both PUBLIC and anon on the 63 endpoints while preserving authenticated grants where intended. No such bulk ACL change has been approved or made.

| Body class | Count in anon/authenticated union | Guard and scope | Recommended minimum caller |
|---|---:|---|---|
| RBAC permission-gated | 41 | Calls `private.has_permission(permission_key)`, which joins `admins.auth_user_id` to `auth.uid()`, requires `is_active`, and requires the named permission unless the caller is owner | `authenticated`; remove effective anon/PUBLIC access |
| Platform-owner-gated | 8 | Calls `private.is_platform_owner()` or checks that `auth.uid()` belongs to the active owner; role and owner-management actions are additionally audited and protect the last active owner | `authenticated`; remove effective anon/PUBLIC access |
| Legacy active-admin-only | 8 | Mutating legacy routines call `public.is_admin()`, which checks active-admin identity but does not check a per-operation RBAC permission | `service_role` unless an external consumer is identified; otherwise replace the body check with the matching permission before retaining authenticated access |
| Guarded compatibility wrappers | 3 | Delegates to the corresponding guarded v2 routine: course financial summary, enrollment, or payment | `authenticated`; remove effective anon/PUBLIC access |
| Self-scoped authorization reader | 1 | `get_my_authorization()` filters to `auth.uid()` and active admin; anon receives no row because `auth.uid()` is NULL | `authenticated`; remove effective anon/PUBLIC access |
| Owner-claim pair | 2 | `can_claim_platform_owner()` is identity- and invariant-scoped; `claim_platform_owner()` rejects NULL identity, serializes claims, and requires the sole eligible active superadmin | `authenticated`; remove effective anon/PUBLIC access |
| Active-admin status helper | 1 | `is_admin()` checks only whether `auth.uid()` belongs to an active admin; it has no mutation and is not executable by anon | `authenticated`; needed by legacy callers pending deprecation |

The six rows other than the active-admin status helper total 63 anon-callable functions; all seven rows total 64 unique authenticated-callable SECURITY DEFINER functions. The 63 anon EXECUTE findings are therefore a real overbroad grant surface, but body review did not find an anon path past the identity/permission guards in those functions. This does not substitute for negative runtime tests with an anonymous JWT.

## Routine membership

The names below are exact routines from the current Staging catalog; pair them with the full signatures and privileges in the [current matrix](CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md).

**RBAC permission-gated (41):**

`rbac_archive_cash_box`, `rbac_close_course`, `rbac_course_financial_summary_v2`, `rbac_create_cash_box`, `rbac_create_cash_box_v2`, `rbac_create_course`, `rbac_create_course_v2`, `rbac_create_student`, `rbac_create_student_v2`, `rbac_enroll_student_v2`, `rbac_finance_dashboard_metrics`, `rbac_finance_dashboard_usd_v2`, `rbac_list_admins`, `rbac_list_assignable_roles`, `rbac_list_audit_events`, `rbac_list_cash_boxes`, `rbac_list_cash_boxes_v2`, `rbac_list_courses`, `rbac_list_courses_v2`, `rbac_list_delegable_permissions`, `rbac_list_enrollments`, `rbac_list_enrollments_v2`, `rbac_list_expenses`, `rbac_list_payments`, `rbac_list_payments_v2`, `rbac_list_roles`, `rbac_list_students`, `rbac_list_students_v2`, `rbac_list_transfers`, `rbac_operational_dashboard_metrics`, `rbac_record_expense`, `rbac_record_payment_v2`, `rbac_search_payments`, `rbac_set_enrollment_status`, `rbac_transfer_between_boxes`, `rbac_update_course`, `rbac_update_course_v2`, `rbac_update_student`, `rbac_update_student_v2`, `rbac_void_expense`, `rbac_void_payment`.

**Platform-owner-gated (8):** `rbac_create_custom_role`, `rbac_delete_custom_role`, `rbac_get_telegram_group_language`, `rbac_set_admin_active`, `rbac_set_admin_owner`, `rbac_set_admin_role`, `rbac_set_telegram_group_language`, `rbac_update_custom_role_permissions`.

**Legacy active-admin-only (8 mutations):** `create_cash_box`, `enroll_student`, `record_expense`, `record_payment`, `set_enrollment_status`, `transfer_between_boxes`, `void_expense`, `void_payment`. **Authenticated-only status helper:** `is_admin()`.

**Guarded wrappers (3):** `rbac_course_financial_summary`, `rbac_enroll_student`, `rbac_record_payment`.

**Self-scoped reader:** `get_my_authorization`. **Owner-claim pair:** `can_claim_platform_owner`, `claim_platform_owner`.

## Findings and priority

### P1 — Legacy write RPCs bypass per-permission RBAC checks

The eight legacy write functions above are `SECURITY DEFINER`, currently have effective EXECUTE for `authenticated` on Staging, and only ask `public.is_admin()` whether the caller is an active administrator. The body does not check the operation-specific permission keys used by their RBAC replacements. The application call-site scan finds the frontend calling the `rbac_*` replacements, not these eight legacy names. Thus an active administrator with a restricted role could use the legacy RPCs to bypass granular permissions if such an identity is enabled and has a valid authenticated session.

The Staging aggregate read found one active platform owner and one inactive `superadmin`; it found no active restricted administrator. The assignable `academy_manager` role has 12 permissions and omits finance write permissions; the assignable `finance_manager` role has 14 permissions and omits student/course creation. Both roles are present in `admin_roles` and `is_assignable=true`. The legacy functions do not check these permission lists, so they would let an active user in either restricted role call operations outside that role's permission set. This is a confirmed authorization-boundary mismatch and a latent privilege escalation if a restricted account is activated; no unauthorized mutation was demonstrated and no test RPC was invoked. Do not test by invoking a write RPC against live data.

**Recommendation:** verify external consumers and intended compatibility, then either remove `authenticated`/PUBLIC EXECUTE from these eight exact signatures (retain `service_role` where operationally required) or update the functions to enforce their matching granular permissions. Any Staging ACL/body change requires separate operation-specific approval. Production remains read-only.

### P2 — Anonymous EXECUTE remains broader than the application contract

The 63 anon-callable SECURITY DEFINER functions all have identified identity or permission guards, self-scope, or guarded delegation. No unauthenticated read/write path was demonstrated. The frontend call sites use authenticated sessions and do not establish a need for anon EXECUTE on these routines. Revoke effective anon access, including inherited PUBLIC EXECUTE, after confirming there is no external anonymous client. Preserve authenticated grants where the application uses the endpoint and the body checks the permission boundary.

### P2 — Auth leaked-password protection is disabled

Staging Security Advisor reports `auth_leaked_password_protection`. This is an Auth configuration warning, separate from RPC authorization. No Auth setting was changed.

## Test status and limits

- No function was invoked; body review is static evidence from the current Staging definitions.
- Anonymous negative calls and restricted-admin negative calls remain untested. Do not use an existing or real admin account; the historical synthetic account credentials are considered exposed.
- Do not blanket-revoke the 63 SECURITY DEFINER functions. First preserve app call-site grants, review any non-frontend consumers, and agree on the exact Staging-only operation.
- Supabase Security Advisor directly confirms REST RPC reachability for its 63/64 warnings. The full Data API schema setting was not separately captured.
