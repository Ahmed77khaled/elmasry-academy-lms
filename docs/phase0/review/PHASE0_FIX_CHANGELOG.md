# Phase 0 Fix Package V2 — Change Log

Compared with the first draft package, V2 includes these corrections and guardrails:

1. **Cash-box defaults:** removed the unnecessary plan to drop the live `cash_boxes.added_by` default. The migration now preserves the current column default and changes only the confirmed FK/trigger defects.
2. **USD upper bound:** added the same `99,999,999.99` upper limit used by `rbac_create_cash_box_v2` to `opening_balance_usd` validation.
3. **FK identity checks:** the cash-box migration now verifies that the FK is specifically `cash_boxes(added_by) -> auth.users(id)`, with NO ACTION on update, MATCH SIMPLE, and non-deferrable semantics before replacing only its ON DELETE behavior. It also requires the original immutability trigger to be enabled for normal-origin execution (or ALWAYS), and confirms the function's owner, SECURITY INVOKER mode, and search_path afterward.
4. **Admin helper attributes:** made `VOLATILE` explicit to preserve the audited `public.is_admin()` volatility.
5. **Financial currency preflight:** now explicitly rejects NULL payment/enrollment currency values as well as unsupported currency values.
6. **Default ACL probe:** added a disposable Staging-only probe transaction that asserts anon/authenticated receive no new table/sequence/function privileges, service_role defaults remain, and PUBLIC has no EXECUTE on a new postgres-created function. The transaction ends with ROLLBACK.
7. **Evidence notes:** added a concise review of the 70 SECURITY DEFINER function sources and an explicit list of unresolved non-production blockers.

These improvements are static source edits only. They do not mean PostgreSQL parsed, executed, or tested the migrations.