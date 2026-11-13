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

Do not run this probe in Production.

## E. Security/RLS/API

1. Review the complete output of `PHASE0_REMAINING_SECURITY_GAPS_READONLY.sql`.
2. Ensure no unintended `anon`/`PUBLIC` EXECUTE on public/private routines.
3. Review all schema CREATE/USAGE privileges and every RLS policy against intended roles.
4. Confirm every exposed SECURITY DEFINER endpoint enforces the correct permission or ownership boundary.
5. Run the complete app test suite, then `npm run typecheck`, `npm run lint`, and `npm run build` against the same source branch that will be released.

## Approval rule

Any unexpected result is NO-GO. Do not use Production to experiment or to compensate for missing Staging.