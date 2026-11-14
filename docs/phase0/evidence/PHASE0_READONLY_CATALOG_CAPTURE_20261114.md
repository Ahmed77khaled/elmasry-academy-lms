# Phase 0 Approved Read-only Catalog Capture — 2026-11-14

**Scope:** SQL `SELECT` catalog/migration-ledger reads authorized by the user for Production `urmkcixqpoqkiosihhal` and Staging `kxdfconqflveqeozanaw`. Each query was preceded by a project metadata check for the exact ref. No DDL, DML, RPC, account creation, or project operation was run. No application-row data was selected.

## Routine inventory and effective callability

The raw routine EXECUTE privilege and schema USAGE must be read together. `has_function_privilege` alone reports EXECUTE through PUBLIC even when the caller cannot use the containing schema.

| Environment | Capture (UTC) | Total public/private routines | Raw EXECUTE: anon / authenticated / service_role | Database-callable after schema USAGE: anon / authenticated | Public non-trigger RPC candidates: anon / authenticated |
|---|---|---:|---:|---:|---:|
| Production | 2026-11-14T17:07:43.357Z | 76 | 4 / 62 / 70 | 4 / 62 | 0 / 56 |
| Staging | 2026-11-14T17:09:24.610Z | 76 | 65 / 66 / 76 | 59 / 66 | 55 / 56 |

Production schema USAGE capture: anon and authenticated have USAGE on `public`; anon has no USAGE on `private`, while authenticated does. Staging schema USAGE capture: anon has USAGE on `public` and no USAGE on `private`; authenticated has USAGE on both. Staging's six private routines have raw PUBLIC EXECUTE, but anon cannot resolve them because private-schema USAGE is false. The current callable counts therefore remain 59/66; the public non-trigger candidates remain 55/56.

Staging Security Advisor independently reported **55 anon / 56 authenticated SECURITY DEFINER RPC endpoints** at `2026-11-14T17:12:39.577Z`. Leaked-password protection remains disabled. The advisor endpoints are in the public schema; Data API exposed-schema settings were not independently returned.

The eight legacy write routines on both projects have ACL `{postgres=X/postgres,service_role=X/postgres}`: anon=false, authenticated=false, service_role=true. The eight Staging RBAC wrappers retain authenticated execution; they remain among the public endpoints reviewed for body-level permission checks.

## Direct table/view privileges

A read-only privilege query covered all **20 public relations** in each project (16 tables and 4 views). Neither anon nor authenticated has direct SELECT/INSERT/UPDATE/DELETE on any of them. service_role has SELECT on all 20. This matches the app's RPC-mediated data access; it does not prove any migration history.

The four finance views have matching definitions, output columns, and `security_invoker=true` in both projects. Their current ACLs are `{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`; anon/authenticated SELECT is false, service_role SELECT is true. This is current-state evidence: the explicit historical `GRANT SELECT ... TO authenticated` statements in snapshots 202610210005, 202610210006, and 202610210007 do not match the current ACL state.


### `public.cash_box_balances`

- `security_invoker=true`; 11 output columns: `cash_box_id` (uuid), `name` (character varying(255)), `type` (character varying(50)), `owner` (character varying(255)), `is_active` (boolean), `opening_balance` (numeric(10,2)), `total_payments_in` (numeric), `total_expenses_out` (numeric), `total_transfers_in` (numeric), `total_transfers_out` (numeric), `current_balance` (numeric).
- The captured `pg_get_viewdef` text and ordered output columns matched Production and Staging byte-for-byte in the read-only comparison.

```sql
SELECT cb.cash_box_id,
    cb.name,
    cb.type,
    cb.owner,
    cb.is_active,
    cb.opening_balance,
    COALESCE(pay_in.total, 0::numeric) AS total_payments_in,
    COALESCE(exp_out.total, 0::numeric) AS total_expenses_out,
    COALESCE(tr_in.total, 0::numeric) AS total_transfers_in,
    COALESCE(tr_out.total, 0::numeric) AS total_transfers_out,
    cb.opening_balance + COALESCE(pay_in.total, 0::numeric) + COALESCE(tr_in.total, 0::numeric) - COALESCE(exp_out.total, 0::numeric) - COALESCE(tr_out.total, 0::numeric) AS current_balance
   FROM cash_boxes cb
     LEFT JOIN ( SELECT payments.cash_box_id,
            sum(payments.amount) AS total
           FROM payments
          WHERE payments.voided_at IS NULL
          GROUP BY payments.cash_box_id) pay_in ON pay_in.cash_box_id = cb.cash_box_id
     LEFT JOIN ( SELECT expenses.cash_box_id,
            sum(expenses.amount) AS total
           FROM expenses
          WHERE expenses.voided_at IS NULL
          GROUP BY expenses.cash_box_id) exp_out ON exp_out.cash_box_id = cb.cash_box_id
     LEFT JOIN ( SELECT cash_box_transfers.to_box_id AS cash_box_id,
            sum(cash_box_transfers.amount) AS total
           FROM cash_box_transfers
          GROUP BY cash_box_transfers.to_box_id) tr_in ON tr_in.cash_box_id = cb.cash_box_id
     LEFT JOIN ( SELECT cash_box_transfers.from_box_id AS cash_box_id,
            sum(cash_box_transfers.amount) AS total
           FROM cash_box_transfers
          GROUP BY cash_box_transfers.from_box_id) tr_out ON tr_out.cash_box_id = cb.cash_box_id;
```


### `public.course_financial_summary`

- `security_invoker=true`; 12 output columns: `course_id` (uuid), `course_name` (character varying(255)), `availability_status` (character varying(50)), `max_students` (integer), `default_cost` (numeric(10,2)), `active_enrollments` (bigint), `vacant_places` (bigint), `total_enrollments` (bigint), `expected_revenue` (numeric), `collected_payments` (numeric), `total_expenses` (numeric), `net_profit` (numeric).
- The captured `pg_get_viewdef` text and ordered output columns matched Production and Staging byte-for-byte in the read-only comparison.

```sql
SELECT c.course_id,
    c.course_name,
    c.availability_status,
    c.max_students,
    c.default_cost,
    count(e.enrollment_id) FILTER (WHERE e.status::text = 'Active'::text) AS active_enrollments,
        CASE
            WHEN c.max_students IS NULL THEN NULL::bigint
            ELSE c.max_students - count(e.enrollment_id) FILTER (WHERE e.status::text = 'Active'::text)
        END AS vacant_places,
    count(e.enrollment_id) AS total_enrollments,
    COALESCE(sum(e.agreed_cost) FILTER (WHERE e.status::text <> 'Dropped'::text), 0::numeric) AS expected_revenue,
    COALESCE(sum(p_totals.paid), 0::numeric) AS collected_payments,
    COALESCE(exp.total_expenses, 0::numeric) AS total_expenses,
    COALESCE(sum(p_totals.paid), 0::numeric) - COALESCE(exp.total_expenses, 0::numeric) AS net_profit
   FROM courses c
     LEFT JOIN enrollments e ON e.course_id = c.course_id
     LEFT JOIN ( SELECT p.enrollment_id,
            sum(p.amount) AS paid
           FROM payments p
          WHERE p.voided_at IS NULL
          GROUP BY p.enrollment_id) p_totals ON p_totals.enrollment_id = e.enrollment_id
     LEFT JOIN ( SELECT expenses.course_id,
            sum(expenses.amount) AS total_expenses
           FROM expenses
          WHERE expenses.course_id IS NOT NULL AND expenses.voided_at IS NULL
          GROUP BY expenses.course_id) exp ON exp.course_id = c.course_id
  GROUP BY c.course_id, c.course_name, c.availability_status, c.max_students, c.default_cost, exp.total_expenses;
```


### `public.dashboard_metrics`

- `security_invoker=true`; 11 output columns: `total_students` (bigint), `new_students_this_month` (bigint), `active_courses` (bigint), `active_enrollments` (bigint), `revenue_this_month` (numeric), `expenses_this_month` (numeric), `net_profit_this_month` (numeric), `total_revenue_all_time` (numeric), `total_expenses_all_time` (numeric), `net_profit_all_time` (numeric), `total_pending_balance` (numeric).
- The captured `pg_get_viewdef` text and ordered output columns matched Production and Staging byte-for-byte in the read-only comparison.

```sql
SELECT ( SELECT count(*) AS count
           FROM students) AS total_students,
    ( SELECT count(*) AS count
           FROM students
          WHERE students.created_at >= date_trunc('month'::text, now())) AS new_students_this_month,
    ( SELECT count(*) AS count
           FROM courses
          WHERE courses.availability_status::text = 'Active'::text) AS active_courses,
    ( SELECT count(*) AS count
           FROM enrollments
          WHERE enrollments.status::text = 'Active'::text) AS active_enrollments,
    ( SELECT COALESCE(sum(payments.amount), 0::numeric) AS "coalesce"
           FROM payments
          WHERE payments.voided_at IS NULL AND payments.payment_date >= date_trunc('month'::text, now())) AS revenue_this_month,
    ( SELECT COALESCE(sum(expenses.amount), 0::numeric) AS "coalesce"
           FROM expenses
          WHERE expenses.voided_at IS NULL AND expenses.expense_date >= date_trunc('month'::text, now())) AS expenses_this_month,
    (( SELECT COALESCE(sum(payments.amount), 0::numeric) AS "coalesce"
           FROM payments
          WHERE payments.voided_at IS NULL AND payments.payment_date >= date_trunc('month'::text, now()))) - (( SELECT COALESCE(sum(expenses.amount), 0::numeric) AS "coalesce"
           FROM expenses
          WHERE expenses.voided_at IS NULL AND expenses.expense_date >= date_trunc('month'::text, now()))) AS net_profit_this_month,
    ( SELECT COALESCE(sum(payments.amount), 0::numeric) AS "coalesce"
           FROM payments
          WHERE payments.voided_at IS NULL) AS total_revenue_all_time,
    ( SELECT COALESCE(sum(expenses.amount), 0::numeric) AS "coalesce"
           FROM expenses
          WHERE expenses.voided_at IS NULL) AS total_expenses_all_time,
    (( SELECT COALESCE(sum(payments.amount), 0::numeric) AS "coalesce"
           FROM payments
          WHERE payments.voided_at IS NULL)) - (( SELECT COALESCE(sum(expenses.amount), 0::numeric) AS "coalesce"
           FROM expenses
          WHERE expenses.voided_at IS NULL)) AS net_profit_all_time,
    ( SELECT COALESCE(sum(eb.remaining_balance), 0::numeric) AS "coalesce"
           FROM enrollment_balances eb
          WHERE eb.enrollment_status::text = 'Active'::text AND eb.remaining_balance > 0::numeric) AS total_pending_balance;
```


### `public.enrollment_balances`

- `security_invoker=true`; 11 output columns: `enrollment_id` (uuid), `student_id` (uuid), `student_name` (character varying(255)), `course_id` (uuid), `course_name` (character varying(255)), `agreed_cost` (numeric(10,2)), `enrollment_status` (character varying(50)), `enrolled_at` (timestamp with time zone), `total_paid` (numeric), `remaining_balance` (numeric), `payment_status` (text).
- The captured `pg_get_viewdef` text and ordered output columns matched Production and Staging byte-for-byte in the read-only comparison.

```sql
SELECT e.enrollment_id,
    e.student_id,
    s.name AS student_name,
    e.course_id,
    c.course_name,
    e.agreed_cost,
    e.status AS enrollment_status,
    e.enrolled_at,
    COALESCE(p_totals.total_paid, 0::numeric) AS total_paid,
    e.agreed_cost - COALESCE(p_totals.total_paid, 0::numeric) AS remaining_balance,
        CASE
            WHEN (e.agreed_cost - COALESCE(p_totals.total_paid, 0::numeric)) = 0::numeric AND COALESCE(p_totals.total_paid, 0::numeric) > 0::numeric THEN 'Paid'::text
            WHEN (e.agreed_cost - COALESCE(p_totals.total_paid, 0::numeric)) < 0::numeric THEN 'Overpaid'::text
            WHEN COALESCE(p_totals.total_paid, 0::numeric) = 0::numeric THEN 'Unpaid'::text
            ELSE 'Partial'::text
        END AS payment_status
   FROM enrollments e
     JOIN students s ON s.student_id = e.student_id
     JOIN courses c ON c.course_id = e.course_id
     LEFT JOIN ( SELECT payments.enrollment_id,
            sum(payments.amount) AS total_paid
           FROM payments
          WHERE payments.voided_at IS NULL
          GROUP BY payments.enrollment_id) p_totals ON p_totals.enrollment_id = e.enrollment_id;
```

## Cash-box creator FK and comments

Read-only constraint/column capture:

| Project | `cash_boxes.added_by` | Validated FK delete action | Constraint definition |
|---|---|---|---|
| Production `urmkcixqpoqkiosihhal` | nullable uuid, default `auth.uid()` | **NO ACTION** (`confdeltype='a'`) | `FOREIGN KEY (added_by) REFERENCES auth.users(id)` |
| Staging `kxdfconqflveqeozanaw` | nullable uuid, default `auth.uid()` | **SET NULL** (`confdeltype='n'`) | `FOREIGN KEY (added_by) REFERENCES auth.users(id) ON DELETE SET NULL` |

Production's `added_by` column comment exactly matches Migration 008. The current `prevent_cash_box_mutation()` comment is the later 20261021171218 text (“permits ON DELETE SET NULL…”), not Migration 008's earlier comment. Current `create_cash_box(varchar,varchar,varchar,numeric,text)` comment exactly matches Migration 008; its current ACL is service_role-only.

## Default privileges

A read-only `pg_default_acl` capture for objects created by `postgres` at `2026-11-14T17:15:31.472Z` found:

| Project | Public table defaults | Public sequence defaults | Public function defaults | Global function defaults | Storage defaults |
|---|---|---|---|---|---|
| Production | anon, authenticated, service_role | anon, authenticated, service_role | anon, authenticated, service_role | postgres only | anon, authenticated, service_role |
| Staging | service_role only | service_role only | service_role only | postgres only | anon, authenticated, service_role |

Staging public defaults remain hardened. Both projects retain separate broad `storage` defaults; no storage privilege was changed or included in the application probe.

## Migration ledger

Production `supabase_migrations.schema_migrations` contains exactly four rows:

- `20261021214608` — `add_login_alert_dedupe`
- `20261022230000` — `rbac_authorization_cutover`
- `20261023110000` — `telegram_notification_language`
- `20261030120000` — `student_profile_directory_v2`

On Staging, `to_regnamespace('supabase_migrations')` and `to_regclass('supabase_migrations.schema_migrations')` both returned NULL; the schema/table are absent. This is consistent with the existing Supabase migration-list result of zero Staging migrations. Absence of a ledger is not evidence that no direct SQL changes exist.

## Interpretation boundary

Current definitions and ACLs can classify current effects, but cannot prove when a statement ran, whether a later statement superseded it, or whether a whole migration file completed. Keep ledger repair and `db push` prohibited. Candidate 4 remains HOLD. Behavior tests, default-ACL object probe, and any further database writes were not run.

