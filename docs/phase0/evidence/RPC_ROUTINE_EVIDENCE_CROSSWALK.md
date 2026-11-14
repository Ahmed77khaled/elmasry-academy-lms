# RPC Routine Evidence Crosswalk

**Review scope:** Repository source, archived migrations, application call sites, redacted historical operations, and fresh read-only catalog captures from Production and Staging on 2026-11-14. The live privilege capture is documented in [CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md](CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md).

## What the retained evidence enumerates

| Evidence set | Environment / scope | Rows or names | What it establishes | What it does not establish |
|---|---|---:|---|---|
| [`PRODUCTION_SECURITY_DEFINER_70_ROUTINE_MATRIX.md`](PRODUCTION_SECURITY_DEFINER_70_ROUTINE_MATRIX.md) and `ALL_70_SECURITY_DEFINER_FUNCTIONS.md` | Archived Production SECURITY DEFINER extraction | 70 exact signatures | Archived owner, fixed search path, definer mode, and effective EXECUTE for anon/authenticated/service_role/PUBLIC; function bodies are in the source evidence | Non-SECURITY DEFINER routines or a complete set of everything currently callable |
| [Fresh current callable-routine capture](CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md) | Production and Staging; `public` + `private`; functions + procedures | 76 routines in each project; all effective role/schema privileges recorded | Current identity signatures, owner, definer flag, settings, schema USAGE, effective anon/authenticated/service_role EXECUTE | Whether each public function is actually exposed by the Data API schema configuration; full authorization correctness of every body |
| Raw log operations 101–102 | Staging, `public` schema | Aggregate 69 anon / 70 authenticated | The captured aggregate from the historical Staging query | The row output from operation 101 is missing; operation 102 has no `prokind` filter; cannot identify the 69/70 routines or infer Production privileges |
| Repository migrations | Historical active snapshots and drafts | 78 distinct CREATE FUNCTION names found by source scan | Additional known local routine definitions and intended ACL statements | Proof a migration ran or current live existence/grants |
| `src/` `.rpc(...)` call sites | Current application source | 43 distinct RPC names | Client call intent and locations | Live routine existence/ACL or server authorization correctness |
| Edge Function source and setup docs | Current repository | 2 service RPC names | `enqueue_admin_login_notification` and `claim_telegram_notifications` are called server-side with service-role credentials by their documented workflow | Live ACL/body or existence on either project |
| Captured trigger metadata | Historical database output | Trigger-attached routine names | Database triggers call the listed trigger functions | Direct EXECUTE grants; trigger invocation is not a client RPC call |

The archived 70 SECURITY DEFINER rows plus the 8 distinct migration-defined names absent from that matrix were not a complete database catalog. The fresh capture now fills that inventory gap for the two named projects. `public.set_updated_at()` remains a trigger helper, not a direct RPC candidate.

## Application RPC reconciliation

There are 43 unique names passed to `supabase.rpc(...)` under `src/`. By name, 41 appear in the archived 70-row SECURITY DEFINER matrix. The remaining two are the branding calls below. This is a name-level comparison; the app call arguments still need exact signature matching when complete live output is available.

| Routine | Application use | Local source / intended boundary | Archived live status |
|---|---|---|---|
| `public.get_academy_logo()` | `src/context/BrandingContext.tsx`; `src/components/AcademyLogoSettings.tsx` | Snapshot `20261023090000_branding_and_admin_avatars.sql` intends anon + authenticated EXECUTE; the output is academy branding | Snapshot is marked Draft Only; the audit reports `academy_branding` absent. Live existence/grant unverified. This is a possible broken application path requiring read-only verification before any fix. |
| `public.set_academy_logo(text)` | `src/components/AcademyLogoSettings.tsx` | Snapshot intends authenticated only; body checks `private.is_active_admin()` | Same Draft Only conflict; live existence/grant unverified. |

## Additional routines outside the 70-row SECURITY DEFINER matrix

`Local ACL` below describes statements in repository SQL only. It is not a verified live ACL.

| Routine identity | Type / role in system | Local ACL or application evidence | Live EXECUTE finding |
|---|---|---|---|
| `private.is_active_admin()` | Helper used in branding RLS policies; not called by the frontend | Draft snapshot revokes PUBLIC/anon and grants authenticated | Not proved live; snapshot is Draft Only |
| `public.claim_telegram_notifications(integer, integer)` | Edge Function worker claims outbox rows | Migration snapshot revokes PUBLIC/anon/authenticated and grants service_role; called by `telegram-group-dispatch` | Not proved live by per-routine ACL output |
| `public.enqueue_admin_login_notification(uuid, text)` | Edge Function enqueues fixed login alert event | Migration snapshot revokes PUBLIC/anon/authenticated and grants service_role; called by `login-alert` | Definition appears in historical SQL evidence; effective live grants are not in retained per-routine matrix |
| `public.prevent_cash_box_mutation()` | Trigger-only cash-box invariant guard | Captured trigger metadata ties it to `trg_cash_boxes_immutability`; no direct app RPC call | Do not classify trigger use as client callability; direct EXECUTE ACL not independently enumerated |
| `public.prevent_financial_record_mutation()` | Trigger-only append/void guard | Captured trigger metadata ties it to expense/payment immutability triggers | Direct EXECUTE ACL not independently enumerated |
| `public.prevent_transfer_mutation()` | Trigger-only transfer immutability guard | Captured trigger metadata ties it to transfer immutability trigger | Direct EXECUTE ACL not independently enumerated |
| `public.set_updated_at()` | Trigger-only timestamp helper | Captured trigger metadata shows usage on courses/enrollments/students; snapshot adjusts function ownership/security | Original definition and direct EXECUTE ACL not in the routine matrix |

## Fresh privilege results

- **Production (`urmkcixqpoqkiosihhal`):** 76 routines across `public` and `private`; 4 are database-callable by anon (all trigger helpers), 62 by authenticated. Excluding procedures and trigger-returning functions leaves 0 public function RPC candidates for anon and 56 for authenticated.
- **Staging (`kxdfconqflveqeozanaw`):** 76 routines; 69 are database-callable by anon and 76 by authenticated. Excluding procedures and trigger-returning functions leaves 65 public function RPC candidates for anon and 66 for authenticated. This reconciles the historical 69/70 public-routine aggregate: the 6 private routines account for the authenticated total of 76.
- The Staging source review found 60 candidates with recognizable caller/admin/permission guards, 3 compatibility wrappers delegating to guarded v2 functions, and 2 service-worker routines (`claim_telegram_notifications`, `enqueue_admin_login_notification`) lacking caller-identity checks. Both are SECURITY INVOKER and anon has no table privileges on their target outbox/audit tables, so no unauthorized write was demonstrated. They have broader EXECUTE grants than intended; see the matrix for the exact, unexecuted remedial plan.
- “RPC candidate” is conditional because the Supabase Data API exposed-schema configuration was not returned by the project metadata or database setting. EXECUTE does not by itself prove a routine is reachable over HTTP or that its body permits an operation.

## Reconciliation outcome

1. The Production SECURITY DEFINER inventory is individually reviewable and remains explicitly scoped to those 70 rows.
2. Fresh per-routine read-only evidence is now available for both projects. The old Staging aggregate is corroborated at the database privilege level but is not itself a routine-level matrix and must not be presented as Production evidence.
3. Application RPC call sites identify two logo routines outside the 70-row table whose local migration is Draft Only and whose live status is unverified. Mark those paths for read-only catalog verification; do not infer they are deployed or change grants.
4. Trigger-only routines and service-role worker RPCs have different intended callers. Do not revoke them based solely on “callable” counts.
5. The current per-signature privilege matrix includes schema, `prokind`, identity signature, owner, `prosecdef`, `proconfig`, and effective privileges. Function behavior still requires body-by-body review; no grants were changed and no candidate function was invoked.
