# Staging test plan — required before any production release

This is a test plan, not evidence that tests have passed. Use a dedicated restored Staging project with disposable test accounts and cash boxes only.

## A. Admin activation

1. Identify one active admin and one disabled admin in Staging.
2. Set the request JWT subject to the active admin's `auth_user_id`; call `public.is_admin()` and expect `true`.
3. Set the request JWT subject to the disabled admin's `auth_user_id`; call `public.is_admin()` and expect `false`.
4. Test a regular authenticated user; expect `false`.
5. Verify AuthContext shows the disabled admin as non-admin after fresh sign-in and token refresh.
6. Verify an inactive admin cannot use the legacy functions guarded by `public.is_admin()` and cannot pass any RBAC checks.

## B. Cash-box invariants

1. Create a disposable cash box through `rbac_create_cash_box_v2` with EGP and USD opening balances.
2. Attempt to update only `opening_balance`; expect a permission/immutability error and unchanged value.
3. Attempt to update only `opening_balance_usd`; expect the same behavior.
4. Update normal metadata (`name`, `type`, `owner`, `notes`) and archive through the approved RPC; verify it still succeeds.
5. Verify hard DELETE from `cash_boxes` remains blocked.
6. Create a disposable Auth user, link it as `added_by` to a disposable cash box in the supported test setup, delete that test Auth user, and verify `added_by` becomes NULL while both opening balances remain unchanged. Do not use a real administrator account for this test.
7. Verify the archive notification trigger still fires exactly once for an active-to-inactive transition and not for unrelated metadata updates.

### B1. Missing candidate-3 cases (prepared, not executed)

Run only after explicit approval for the specific Staging operation and independently verify ref `kxdfconqflveqeozanaw` immediately before execution. Use synthetic fixtures; wrap reversible database checks in a transaction and roll back. Never call a live Telegram/email/webhook dispatcher.

| Case | Action | Expected result | Evidence to retain |
|---|---|---|---|
| Approved archive RPC | Call `rbac_archive_cash_box(p_cash_box_id)` on an active disposable box using an identity with `finance.cash_boxes.update` | Active→inactive succeeds once; notification trigger queues one outbox item | RPC result, before/after row, outbox event IDs/count |
| Negative EGP opening balance | Call `rbac_create_cash_box_v2` with `p_opening_balance < 0` | Rejected; no cash box persists | SQLSTATE/message and post-check row count |
| Negative USD opening balance | Call the same RPC with nonnegative EGP and `p_opening_balance_usd < 0` | Rejected; no cash box persists | SQLSTATE/message and post-check row count |
| EGP upper bound | Test the documented inclusive maximum and maximum plus one precision unit | At maximum accepted if contract is inclusive; over-limit rejected | Returned value or SQLSTATE/message |
| USD upper bound | Repeat upper-bound test for USD independently | Same documented bound behavior as EGP | Returned value or SQLSTATE/message |
| Hard-delete rejection | Attempt direct `DELETE` of a disposable cash box under the authenticated test role | Rejected by policy/trigger; box remains | SQLSTATE/message and row snapshot |
| Arbitrary creator reassignment | Change `added_by` from creator UUID to a different synthetic Auth UUID | Rejected; original creator remains | SQLSTATE/message and row snapshot |
| Auth user deletion | Create a fresh synthetic Auth user, bind as creator through supported setup, delete that user in Staging | FK sets `added_by` to NULL and preserves both balances | Auth deletion result and before/after balance/creator values |
| Outbox transition scope | Snapshot outbox, archive via RPC, then update unrelated metadata on another box | Exactly one archive event; no event for metadata-only update; do not invoke dispatcher | Outbox rows, trigger definition and worker/dispatch exclusion |

Use fresh synthetic Auth accounts. Historical credentials for four existing disposable accounts are considered exposed; reset or recreate those accounts before any interactive login test. Do not use real administrator identities.

## C. Financial view correctness

1. Compare `enrollment_balances.total_paid` with non-voided EGP payments for EGP enrollments only.
2. Verify USD enrollments never appear in `enrollment_balances`.
3. Compare `cash_box_balances.total_payments_in` with non-voided EGP payments per cash box.
4. Compare `course_financial_summary.expected_revenue` and `collected_payments` with EGP-only source aggregates.
5. Confirm dashboard revenue, net profit, and pending balances agree with EGP source calculations.
6. Confirm operational count fields remain intentionally cross-currency.
7. Compare the exact output column count, order, names, types, and `security_invoker=true` against the supplied audit contract.
8. Verify `rbac_course_financial_summary` v1 remains compatible and the v2 RPC outputs have not changed.

## D. Default privileges

Run `validation/PHASE0_STAGING_DEFAULT_ACL_PROBE.sql` on Staging only. It creates uniquely named probe objects inside a transaction and ends with ROLLBACK. Confirm:

- `anon` and `authenticated` have no direct privileges on the new table/sequence/function.
- `PUBLIC` has no EXECUTE on the newly created function.
- `service_role` retains the documented public-schema defaults.
- Future `postgres`-created functions in other relevant schemas also receive no PUBLIC EXECUTE by default; explicitly grant EXECUTE to intended callers after creation.

### D1. Strengthened cross-schema coverage (prepared, not executed)

Use the current strengthened probe, not the reduced historical probe. In the same rollback-only session, create a uniquely named function in each relevant schema (at minimum `public` and `private`; include other application schemas exposed to PostgREST if any) as `postgres`. Before rollback capture effective EXECUTE for `PUBLIC`, `anon`, `authenticated`, and `service_role`, the function owner, `proconfig` search path and exploded `pg_default_acl` entries. Confirm all expected denials and documented service-role privileges, then verify all probe objects are absent after rollback. This validates schema-wide defaults independently of table/sequence checks.

Do not run this probe in Production.

## E. Security/RLS/API

1. Review the complete output of `PHASE0_REMAINING_SECURITY_GAPS_READONLY.sql`.
2. Ensure no unintended `anon`/`PUBLIC` EXECUTE on public/private routines.
3. Review all schema CREATE/USAGE privileges and every RLS policy against intended roles.
4. Confirm every exposed SECURITY DEFINER endpoint enforces the correct permission or ownership boundary.
5. Run the complete app test suite, then `npm run typecheck`, `npm run lint`, and `npm run build` against the same source branch that will be released.

### E1. Staging service-worker RPC grants (executed and verified)

Fresh evidence found PUBLIC/anon/authenticated EXECUTE on two SECURITY INVOKER service-worker routines in Staging: `public.claim_telegram_notifications(integer,integer)` and `public.enqueue_admin_login_notification(uuid,text)`. Their intended caller is `service_role`. Anon had no table privileges on the routines' outbox/audit targets, so an unauthorized write was not demonstrated. With explicit operation-specific approval, the exact ACL correction below was executed on Staging and verified after commit. Neither worker function was invoked.

Target: `kxdfconqflveqeozanaw` (`trainerpro-phase0-staging`). Transaction committed at `2026-11-14T14:00:21Z`; independent post-commit SELECT verification completed at `2026-11-14T14:01:09.742690Z`. For both exact signatures, effective EXECUTE is false for anon/authenticated and true for service_role; PUBLIC EXECUTE is absent. ACLs are `{postgres=X/postgres,service_role=X/postgres}`. No rows or migration ledger entries changed. The SQL below documents the executed transaction and is not pending work.

```sql
BEGIN;
REVOKE EXECUTE ON FUNCTION public.claim_telegram_notifications(integer, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_admin_login_notification(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_telegram_notifications(integer, integer)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_admin_login_notification(uuid, text)
  TO service_role;
SELECT
  has_function_privilege('anon', 'public.claim_telegram_notifications(integer,integer)', 'EXECUTE') AS anon_claim,
  has_function_privilege('authenticated', 'public.claim_telegram_notifications(integer,integer)', 'EXECUTE') AS auth_claim,
  has_function_privilege('service_role', 'public.claim_telegram_notifications(integer,integer)', 'EXECUTE') AS service_claim,
  has_function_privilege('anon', 'public.enqueue_admin_login_notification(uuid,text)', 'EXECUTE') AS anon_enqueue,
  has_function_privilege('authenticated', 'public.enqueue_admin_login_notification(uuid,text)', 'EXECUTE') AS auth_enqueue,
  has_function_privilege('service_role', 'public.enqueue_admin_login_notification(uuid,text)', 'EXECUTE') AS service_enqueue;
SELECT p.oid::regprocedure AS signature,
       COALESCE(bool_or(a.grantee = 0 AND a.privilege_type = 'EXECUTE'), false) AS public_execute
FROM pg_proc p
CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) AS a
WHERE p.oid IN (
  'public.claim_telegram_notifications(integer,integer)'::regprocedure,
  'public.enqueue_admin_login_notification(uuid,text)'::regprocedure
)
GROUP BY p.oid;
-- Commit only after the exact expected result is reviewed; otherwise ROLLBACK.
```

Verified results: anon/authenticated are false for both; service_role is true for both; `public_execute` is false for both. The following is a recovery reference only; it would restore the former broad ACL and must not be run absent a separate incident-specific decision:

```sql
GRANT EXECUTE ON FUNCTION public.claim_telegram_notifications(integer, integer)
  TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_admin_login_notification(uuid, text)
  TO PUBLIC, anon, authenticated;
```

Keep service_role grants. Production had no anon-executable public non-trigger function candidate in the fresh capture; no Production change was made.

## Approval rule

Any unexpected result is NO-GO. Do not use Production to experiment or to compensate for missing Staging.
