/*
# Create Database Views for Financial Calculations

1. New Views
- `enrollment_balances`: Computes total paid and remaining balance per enrollment by summing non-voided payments
- `cash_box_balances`: Computes live cash box balances from opening + payments in - expenses out + transfers in - transfers out
- `course_financial_summary`: Computes expected/collected revenue, expenses, and net profit per course
- `dashboard_metrics`: Aggregates all KPI numbers in one query

2. Important Notes
- All financial math is done server-side. The frontend NEVER uses .reduce() or client-side calculations.
- enrollment_balances shows payment_status as Paid/Partial/Unpaid/Overpaid based on remaining amount
- cash_box_balances includes breakdown of all in/out flows
- dashboard_metrics uses date_trunc('month', now()) for monthly figures
- course_financial_summary uses a CTE for expenses to avoid GROUP BY issues
*/

-- ===== ENROLLMENT_BALANCES VIEW =====
CREATE OR REPLACE VIEW enrollment_balances AS
SELECT
  e.id AS enrollment_id,
  e.student_id,
  s.name AS student_name,
  s.phone AS student_phone,
  e.course_id,
  c.course_name,
  e.agreed_cost,
  COALESCE(SUM(CASE WHEN p.voided = false THEN p.amount ELSE 0 END), 0) AS total_paid,
  e.agreed_cost - COALESCE(SUM(CASE WHEN p.voided = false THEN p.amount ELSE 0 END), 0) AS remaining_balance,
  CASE
    WHEN e.agreed_cost - COALESCE(SUM(CASE WHEN p.voided = false THEN p.amount ELSE 0 END), 0) <= 0
      AND COALESCE(SUM(CASE WHEN p.voided = false THEN p.amount ELSE 0 END), 0) > 0 THEN 'Paid'
    WHEN e.agreed_cost - COALESCE(SUM(CASE WHEN p.voided = false THEN p.amount ELSE 0 END), 0) < 0 THEN 'Overpaid'
    WHEN COALESCE(SUM(CASE WHEN p.voided = false THEN p.amount ELSE 0 END), 0) = 0 THEN 'Unpaid'
    ELSE 'Partial'
  END AS payment_status,
  e.status AS enrollment_status,
  e.attendance_status,
  e.enrolled_on
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN courses c ON c.id = e.course_id
LEFT JOIN payments p ON p.enrollment_id = e.id
GROUP BY e.id, s.name, s.phone, c.course_name;

-- ===== CASH_BOX_BALANCES VIEW =====
CREATE OR REPLACE VIEW cash_box_balances AS
SELECT
  cb.id AS cash_box_id,
  cb.name,
  cb.box_type,
  cb.owner,
  cb.opening_balance,
  cb.archived,
  COALESCE(pay_in.total_in, 0) AS total_payments_in,
  COALESCE(exp_out.total_out, 0) AS total_expenses_out,
  COALESCE(tf_in.total_in, 0) AS total_transfers_in,
  COALESCE(tf_out.total_out, 0) AS total_transfers_out,
  cb.opening_balance
    + COALESCE(pay_in.total_in, 0)
    - COALESCE(exp_out.total_out, 0)
    + COALESCE(tf_in.total_in, 0)
    - COALESCE(tf_out.total_out, 0) AS current_balance
FROM cash_boxes cb
LEFT JOIN (
  SELECT cash_box_id, SUM(amount) AS total_in
  FROM payments WHERE voided = false
  GROUP BY cash_box_id
) pay_in ON pay_in.cash_box_id = cb.id
LEFT JOIN (
  SELECT cash_box_id, SUM(amount) AS total_out
  FROM expenses
  GROUP BY cash_box_id
) exp_out ON exp_out.cash_box_id = cb.id
LEFT JOIN (
  SELECT to_box_id, SUM(amount) AS total_in
  FROM cash_transfers
  GROUP BY to_box_id
) tf_in ON tf_in.to_box_id = cb.id
LEFT JOIN (
  SELECT from_box_id, SUM(amount) AS total_out
  FROM cash_transfers
  GROUP BY from_box_id
) tf_out ON tf_out.from_box_id = cb.id;

-- ===== COURSE_FINANCIAL_SUMMARY VIEW =====
CREATE OR REPLACE VIEW course_financial_summary AS
WITH course_exp AS (
  SELECT course_id, COALESCE(SUM(amount), 0) AS total_expenses
  FROM expenses WHERE course_id IS NOT NULL
  GROUP BY course_id
),
enrollment_pay AS (
  SELECT
    e.course_id,
    COUNT(DISTINCT e.id) AS total_enrollments,
    SUM(e.agreed_cost) AS expected_revenue,
    COALESCE(SUM(CASE WHEN p.voided = false THEN p.amount ELSE 0 END), 0) AS collected_revenue,
    COUNT(CASE WHEN e.status = 'Active' THEN 1 END) AS active_enrollments
  FROM enrollments e
  LEFT JOIN payments p ON p.enrollment_id = e.id
  GROUP BY e.course_id
)
SELECT
  c.id AS course_id,
  c.course_name,
  c.default_cost,
  c.availability_status,
  c.max_students,
  COALESCE(ep.total_enrollments, 0) AS total_enrollments,
  COALESCE(ep.expected_revenue, 0) AS expected_revenue,
  COALESCE(ep.collected_revenue, 0) AS collected_revenue,
  COALESCE(ce.total_expenses, 0) AS course_expenses,
  COALESCE(ep.collected_revenue, 0) - COALESCE(ce.total_expenses, 0) AS net_profit,
  COALESCE(ep.active_enrollments, 0) AS active_enrollments
FROM courses c
LEFT JOIN enrollment_pay ep ON ep.course_id = c.id
LEFT JOIN course_exp ce ON ce.course_id = c.id;

-- ===== DASHBOARD_METRICS VIEW =====
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT
  (SELECT COUNT(*) FROM students) AS total_students,
  (SELECT COUNT(*) FROM students WHERE created_at >= date_trunc('month', now())) AS new_students_this_month,
  (SELECT COUNT(*) FROM courses WHERE availability_status = 'Active') AS active_courses,
  (SELECT COUNT(*) FROM enrollments WHERE status = 'Active') AS active_enrollments,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE voided = false AND date_trunc('month', payment_date) = date_trunc('month', now())) AS revenue_this_month,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE voided = false) AS total_revenue_all_time,
  (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE date_trunc('month', expense_date) = date_trunc('month', now())) AS expenses_this_month,
  (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS total_expenses_all_time,
  (
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE voided = false AND date_trunc('month', payment_date) = date_trunc('month', now()))
    -
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE date_trunc('month', expense_date) = date_trunc('month', now()))
  ) AS net_profit_this_month,
  (
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE voided = false)
    -
    (SELECT COALESCE(SUM(amount), 0) FROM expenses)
  ) AS total_net_profit_all_time,
  (
    SELECT COALESCE(SUM(remaining_balance), 0)
    FROM enrollment_balances
    WHERE enrollment_status = 'Active' AND remaining_balance > 0
  ) AS outstanding_balance;
