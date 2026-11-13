# Financial Views & Dependency Evidence — Elmasry Academy LMS

> **Reconciliation note (2026-11-14):** This retained report contains an unresolved inconsistency and must not be treated as a definitive consumer inventory for Candidate 4. Its §4 says `rbac_course_financial_summary` references `course_financial_summary`; the archived Production function definition in `PHASE0_RPC_SECURITY_DEFINER_SOURCE_EVIDENCE.md` (routine 15) delegates to `rbac_course_financial_summary_v2`, and the 2026-10-30 migration snapshot defines that wrapper the same way. Its §1 and §5 also say the UI calls `rbac_course_financial_summary_v2`, but the checked current application source calls `rbac_course_financial_summary` at `src/pages/CourseDetailsPage.tsx:97`. Do not infer the current deployed function body from either conflicting artifact. Reconcile with same-project captured function/dependency evidence before using Candidate 4.

> **Target Supabase Project:** `urmkcixqpoqkiosihhal` (TrainerPro)  
> **Audited Views:** `enrollment_balances`, `cash_box_balances`, `course_financial_summary`, `dashboard_metrics`  

## 1. Executive Summary
1. **Security Options:** All 4 views have `security_invoker = true`.
2. **Void Filtering:** All 4 views filter `voided_at IS NULL` on payments and expenses.
3. **Aggregation Safety:** Subqueries pre-aggregate totals before joining, preventing Cartesian product duplication.
4. **Multi-Currency Commingling:** All 4 views sum numeric amounts directly without currency discrimination (summing USD and EGP together).
5. **Database Dependencies:** `dashboard_metrics` directly depends on `enrollment_balances`. Only 1 database function (`rbac_course_financial_summary` v1) references any view.
6. **Application Usage:** The checked application codebase (`src/`) has no direct PostgREST reads of these views (`supabase.from(...)`). It uses RPCs. The current Course Details source calls the compatibility-named `rbac_course_financial_summary`; Dashboard uses `rbac_operational_dashboard_metrics` and `rbac_finance_dashboard_metrics`. Whether the deployed compatibility RPC reads `course_financial_summary` is unresolved by the retained evidence above.

## 2. View Column Contracts & PostgreSQL Data Types

| View Name | Column Name | Position | Data Type | UDT Name |
| --- | --- | --- | --- | --- |
| cash_box_balances | cash_box_id | 1 | uuid | uuid |
| cash_box_balances | name | 2 | character varying | varchar |
| cash_box_balances | type | 3 | character varying | varchar |
| cash_box_balances | owner | 4 | character varying | varchar |
| cash_box_balances | is_active | 5 | boolean | bool |
| cash_box_balances | opening_balance | 6 | numeric | numeric |
| cash_box_balances | total_payments_in | 7 | numeric | numeric |
| cash_box_balances | total_expenses_out | 8 | numeric | numeric |
| cash_box_balances | total_transfers_in | 9 | numeric | numeric |
| cash_box_balances | total_transfers_out | 10 | numeric | numeric |
| cash_box_balances | current_balance | 11 | numeric | numeric |
| course_financial_summary | course_id | 1 | uuid | uuid |
| course_financial_summary | course_name | 2 | character varying | varchar |
| course_financial_summary | availability_status | 3 | character varying | varchar |
| course_financial_summary | max_students | 4 | integer | int4 |
| course_financial_summary | default_cost | 5 | numeric | numeric |
| course_financial_summary | active_enrollments | 6 | bigint | int8 |
| course_financial_summary | vacant_places | 7 | bigint | int8 |
| course_financial_summary | total_enrollments | 8 | bigint | int8 |
| course_financial_summary | expected_revenue | 9 | numeric | numeric |
| course_financial_summary | collected_payments | 10 | numeric | numeric |
| course_financial_summary | total_expenses | 11 | numeric | numeric |
| course_financial_summary | net_profit | 12 | numeric | numeric |
| dashboard_metrics | total_students | 1 | bigint | int8 |
| dashboard_metrics | new_students_this_month | 2 | bigint | int8 |
| dashboard_metrics | active_courses | 3 | bigint | int8 |
| dashboard_metrics | active_enrollments | 4 | bigint | int8 |
| dashboard_metrics | revenue_this_month | 5 | numeric | numeric |
| dashboard_metrics | expenses_this_month | 6 | numeric | numeric |
| dashboard_metrics | net_profit_this_month | 7 | numeric | numeric |
| dashboard_metrics | total_revenue_all_time | 8 | numeric | numeric |
| dashboard_metrics | total_expenses_all_time | 9 | numeric | numeric |
| dashboard_metrics | net_profit_all_time | 10 | numeric | numeric |
| dashboard_metrics | total_pending_balance | 11 | numeric | numeric |
| enrollment_balances | enrollment_id | 1 | uuid | uuid |
| enrollment_balances | student_id | 2 | uuid | uuid |
| enrollment_balances | student_name | 3 | character varying | varchar |
| enrollment_balances | course_id | 4 | uuid | uuid |
| enrollment_balances | course_name | 5 | character varying | varchar |
| enrollment_balances | agreed_cost | 6 | numeric | numeric |
| enrollment_balances | enrollment_status | 7 | character varying | varchar |
| enrollment_balances | enrolled_at | 8 | timestamp with time zone | timestamptz |
| enrollment_balances | total_paid | 9 | numeric | numeric |
| enrollment_balances | remaining_balance | 10 | numeric | numeric |
| enrollment_balances | payment_status | 11 | text | text |

## 3. Database Dependency Matrix

| Dependent Schema | Dependent Object | Source Schema | Source Object |
| --- | --- | --- | --- |
| public | cash_box_balances | public | cash_box_transfers |
| public | cash_box_balances | public | cash_boxes |
| public | cash_box_balances | public | expenses |
| public | cash_box_balances | public | payments |
| public | course_financial_summary | public | courses |
| public | course_financial_summary | public | enrollments |
| public | course_financial_summary | public | expenses |
| public | course_financial_summary | public | payments |
| public | dashboard_metrics | public | courses |
| public | dashboard_metrics | public | enrollment_balances |
| public | dashboard_metrics | public | enrollments |
| public | dashboard_metrics | public | expenses |
| public | dashboard_metrics | public | payments |
| public | dashboard_metrics | public | students |
| public | enrollment_balances | public | courses |
| public | enrollment_balances | public | enrollments |
| public | enrollment_balances | public | payments |
| public | enrollment_balances | public | students |

## 4. Functions Referencing Financial Views
| Schema | Function | Arguments | Mentions dashboard_metrics | Mentions course_financial_summary | Mentions cash_box_balances | Mentions enrollment_balances |
| --- | --- | --- | --- | --- | --- | --- |
| public | rbac_course_financial_summary | p_course_id uuid | `false` | `true` | `false` | `false` |

## 5. Application Source Code References to Views
Search across `src/` found 4 references, all of which are comments or in RPC call lines:

| File Path | Line Number | View Name | Code Snippet |
| --- | --- | --- | --- |
| src\pages\CourseDetailsPage.tsx | 97 | course_financial_summary | const { data, error } = await supabase.rpc('rbac_course_financial_summary_v2', { p_course_id: courseId }); |
| src\pages\DashboardPage.tsx | 59 | dashboard_metrics | ? supabase.rpc('rbac_operational_dashboard_metrics') |
| src\pages\DashboardPage.tsx | 61 | dashboard_metrics | canReadFinance ? supabase.rpc('rbac_finance_dashboard_metrics') : Promise.resolve({ data: [], error: null }), |
| src\pages\DashboardPage.tsx | 122 | dashboard_metrics | {/* 7 KPI Cards (Zero client calculation — all from dashboard_metrics view) */} |

## 6. Complete View SQL Definitions (pg_get_viewdef)

### View: `public.cash_box_balances`
> **Options:** `['security_invoker=true']` | **Security Invoker:** `true`

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

---

### View: `public.course_financial_summary`
> **Options:** `['security_invoker=true']` | **Security Invoker:** `true`

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

---

### View: `public.dashboard_metrics`
> **Options:** `['security_invoker=true']` | **Security Invoker:** `true`

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

---

### View: `public.enrollment_balances`
> **Options:** `['security_invoker=true']` | **Security Invoker:** `true`

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

---
