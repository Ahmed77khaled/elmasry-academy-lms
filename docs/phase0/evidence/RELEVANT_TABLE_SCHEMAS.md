# Schemas, Constraints & Indexes for Core Tables — Elmasry Academy LMS

> **Target Supabase Project:** `urmkcixqpoqkiosihhal` (TrainerPro)  
> **Tables Covered:** `payments`, `enrollments`, `expenses`, `cash_box_transfers`, `cash_boxes`, `courses`  

## 1. Currency Model Verification
- `courses`: contains `default_cost` (numeric, EGP) and `default_cost_usd` (numeric, USD, check >= 0).
- `cash_boxes`: contains `opening_balance` (numeric, default 0.00, EGP) and `opening_balance_usd` (numeric, default 0, USD).
- `enrollments`: contains `agreed_cost` (numeric) and `agreed_currency` (text, check IN ('EGP', 'USD'), default 'EGP').
- `payments`: contains `amount` (numeric) and `currency` (text, check IN ('EGP', 'USD'), default 'EGP').
- `expenses`: **NO currency column exists**. Purely single-currency (implicitly EGP).
- `cash_box_transfers`: **NO currency column exists**. Purely single-currency (implicitly EGP).

## 2. Table Column Definitions

| Table | Column | Pos | Data Type | Nullable? | Default |
| --- | --- | --- | --- | --- | --- |
| cash_box_transfers | transfer_id | 1 | uuid | NO | gen_random_uuid() |
| cash_box_transfers | from_box_id | 2 | uuid | NO | `NULL` |
| cash_box_transfers | to_box_id | 3 | uuid | NO | `NULL` |
| cash_box_transfers | amount | 4 | numeric | NO | `NULL` |
| cash_box_transfers | transfer_date | 5 | date | NO | `NULL` |
| cash_box_transfers | notes | 6 | text | YES | `NULL` |
| cash_box_transfers | added_by | 7 | uuid | YES | `NULL` |
| cash_box_transfers | created_at | 8 | timestamp with time zone | YES | now() |
| cash_boxes | cash_box_id | 1 | uuid | NO | gen_random_uuid() |
| cash_boxes | name | 2 | character varying | NO | `NULL` |
| cash_boxes | type | 3 | character varying | YES | `NULL` |
| cash_boxes | owner | 4 | character varying | YES | `NULL` |
| cash_boxes | opening_balance | 5 | numeric | NO | 0.00 |
| cash_boxes | is_active | 6 | boolean | NO | true |
| cash_boxes | notes | 7 | text | YES | `NULL` |
| cash_boxes | created_at | 8 | timestamp with time zone | YES | now() |
| cash_boxes | added_by | 9 | uuid | YES | auth.uid() |
| cash_boxes | opening_balance_usd | 10 | numeric | NO | 0 |
| courses | course_id | 1 | uuid | NO | gen_random_uuid() |
| courses | course_name | 2 | character varying | NO | `NULL` |
| courses | description | 3 | text | YES | `NULL` |
| courses | level | 4 | character varying | YES | `NULL` |
| courses | duration_weeks | 5 | integer | YES | `NULL` |
| courses | prerequisite_courses | 6 | text | YES | `NULL` |
| courses | start_date | 7 | date | YES | `NULL` |
| courses | end_date | 8 | date | YES | `NULL` |
| courses | max_students | 9 | integer | YES | `NULL` |
| courses | default_cost | 10 | numeric | YES | `NULL` |
| courses | availability_status | 11 | character varying | NO | 'Upcoming'::character varying |
| courses | link_whatsapp | 12 | text | YES | `NULL` |
| courses | link_tasks | 13 | text | YES | `NULL` |
| courses | link_drive | 14 | text | YES | `NULL` |
| courses | link_sources | 15 | text | YES | `NULL` |
| courses | created_at | 16 | timestamp with time zone | YES | now() |
| courses | updated_at | 17 | timestamp with time zone | YES | now() |
| courses | default_cost_usd | 18 | numeric | YES | `NULL` |
| enrollments | enrollment_id | 1 | uuid | NO | gen_random_uuid() |
| enrollments | student_id | 2 | uuid | NO | `NULL` |
| enrollments | course_id | 3 | uuid | NO | `NULL` |
| enrollments | agreed_cost | 4 | numeric | NO | `NULL` |
| enrollments | status | 5 | character varying | NO | 'Active'::character varying |
| enrollments | enrolled_at | 6 | timestamp with time zone | YES | now() |
| enrollments | updated_at | 7 | timestamp with time zone | YES | now() |
| enrollments | agreed_currency | 8 | text | NO | 'EGP'::text |
| expenses | expense_id | 1 | uuid | NO | gen_random_uuid() |
| expenses | cash_box_id | 2 | uuid | NO | `NULL` |
| expenses | course_id | 3 | uuid | YES | `NULL` |
| expenses | amount | 4 | numeric | NO | `NULL` |
| expenses | category | 5 | character varying | YES | `NULL` |
| expenses | description | 6 | text | YES | `NULL` |
| expenses | expense_date | 7 | date | NO | `NULL` |
| expenses | notes | 8 | text | YES | `NULL` |
| expenses | added_by | 9 | uuid | YES | `NULL` |
| expenses | created_at | 10 | timestamp with time zone | YES | now() |
| expenses | voided_at | 11 | timestamp with time zone | YES | `NULL` |
| expenses | voided_by | 12 | uuid | YES | `NULL` |
| expenses | void_reason | 13 | text | YES | `NULL` |
| payments | payment_id | 1 | uuid | NO | gen_random_uuid() |
| payments | enrollment_id | 2 | uuid | NO | `NULL` |
| payments | cash_box_id | 3 | uuid | NO | `NULL` |
| payments | amount | 4 | numeric | NO | `NULL` |
| payments | payment_date | 5 | date | NO | `NULL` |
| payments | method | 6 | character varying | YES | `NULL` |
| payments | receipt_ref | 7 | character varying | YES | `NULL` |
| payments | notes | 8 | text | YES | `NULL` |
| payments | added_by | 9 | uuid | YES | `NULL` |
| payments | voided_at | 10 | timestamp with time zone | YES | `NULL` |
| payments | created_at | 11 | timestamp with time zone | YES | now() |
| payments | receipt_number | 12 | bigint | NO | nextval('payment_receipt_number_seq'::regclass) |
| payments | voided_by | 13 | uuid | YES | `NULL` |
| payments | void_reason | 14 | text | YES | `NULL` |
| payments | currency | 15 | text | NO | 'EGP'::text |

## 3. Database Constraints (PK, FK, Unique, Check)

| Table | Constraint Name | Type | Definition |
| --- | --- | --- | --- |
| cash_box_transfers | cash_box_transfers_added_by_fkey | FOREIGN KEY | FOREIGN KEY (added_by) REFERENCES auth.users(id) |
| cash_box_transfers | cash_box_transfers_amount_check | CHECK | CHECK (amount > 0::numeric) |
| cash_box_transfers | cash_box_transfers_from_box_id_fkey | FOREIGN KEY | FOREIGN KEY (from_box_id) REFERENCES cash_boxes(cash_box_id) ON DELETE RESTRICT |
| cash_box_transfers | cash_box_transfers_pkey | PRIMARY KEY | PRIMARY KEY (transfer_id) |
| cash_box_transfers | cash_box_transfers_to_box_id_fkey | FOREIGN KEY | FOREIGN KEY (to_box_id) REFERENCES cash_boxes(cash_box_id) ON DELETE RESTRICT |
| cash_box_transfers | chk_different_boxes | CHECK | CHECK (from_box_id <> to_box_id) |
| cash_boxes | cash_boxes_added_by_fkey | FOREIGN KEY | FOREIGN KEY (added_by) REFERENCES auth.users(id) |
| cash_boxes | cash_boxes_opening_balance_usd_nonnegative | CHECK | CHECK (opening_balance_usd >= 0::numeric) |
| cash_boxes | cash_boxes_pkey | PRIMARY KEY | PRIMARY KEY (cash_box_id) |
| courses | chk_course_status | CHECK | CHECK (availability_status::text = ANY (ARRAY['Upcoming'::character varying, 'Active'::character varying, 'Closed'::character varying]::text[])) |
| courses | courses_default_cost_check | CHECK | CHECK (default_cost >= 0::numeric) |
| courses | courses_default_cost_usd_nonnegative | CHECK | CHECK (default_cost_usd IS NULL OR default_cost_usd >= 0::numeric) |
| courses | courses_duration_weeks_check | CHECK | CHECK (duration_weeks > 0) |
| courses | courses_max_students_check | CHECK | CHECK (max_students > 0) |
| courses | courses_pkey | PRIMARY KEY | PRIMARY KEY (course_id) |
| enrollments | chk_enrollment_status | CHECK | CHECK (status::text = ANY (ARRAY['Active'::character varying, 'Completed'::character varying, 'Dropped'::character varying]::text[])) |
| enrollments | enrollments_agreed_cost_check | CHECK | CHECK (agreed_cost >= 0::numeric) |
| enrollments | enrollments_agreed_currency_check | CHECK | CHECK (agreed_currency = ANY (ARRAY['EGP'::text, 'USD'::text])) |
| enrollments | enrollments_course_id_fkey | FOREIGN KEY | FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE RESTRICT |
| enrollments | enrollments_pkey | PRIMARY KEY | PRIMARY KEY (enrollment_id) |
| enrollments | enrollments_student_id_fkey | FOREIGN KEY | FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE RESTRICT |
| enrollments | uq_enrollment | UNIQUE | UNIQUE (student_id, course_id) |
| expenses | expenses_added_by_fkey | FOREIGN KEY | FOREIGN KEY (added_by) REFERENCES auth.users(id) |
| expenses | expenses_amount_check | CHECK | CHECK (amount > 0::numeric) |
| expenses | expenses_cash_box_id_fkey | FOREIGN KEY | FOREIGN KEY (cash_box_id) REFERENCES cash_boxes(cash_box_id) ON DELETE RESTRICT |
| expenses | expenses_course_id_fkey | FOREIGN KEY | FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE SET NULL |
| expenses | expenses_pkey | PRIMARY KEY | PRIMARY KEY (expense_id) |
| expenses | expenses_void_reason_required_check | CHECK | CHECK (voided_at IS NULL OR void_reason IS NOT NULL AND length(btrim(void_reason)) >= 5) |
| expenses | expenses_voided_by_fkey | FOREIGN KEY | FOREIGN KEY (voided_by) REFERENCES auth.users(id) ON DELETE RESTRICT |
| payments | payments_added_by_fkey | FOREIGN KEY | FOREIGN KEY (added_by) REFERENCES auth.users(id) |
| payments | payments_amount_check | CHECK | CHECK (amount > 0::numeric) |
| payments | payments_cash_box_id_fkey | FOREIGN KEY | FOREIGN KEY (cash_box_id) REFERENCES cash_boxes(cash_box_id) ON DELETE RESTRICT |
| payments | payments_currency_check | CHECK | CHECK (currency = ANY (ARRAY['EGP'::text, 'USD'::text])) |
| payments | payments_enrollment_id_fkey | FOREIGN KEY | FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id) ON DELETE RESTRICT |
| payments | payments_pkey | PRIMARY KEY | PRIMARY KEY (payment_id) |
| payments | payments_void_reason_required_check | CHECK | CHECK (voided_at IS NULL OR void_reason IS NOT NULL AND length(btrim(void_reason)) >= 5) |
| payments | payments_voided_by_fkey | FOREIGN KEY | FOREIGN KEY (voided_by) REFERENCES auth.users(id) ON DELETE RESTRICT |

## 4. Table Indexes

| Table | Index Name | Unique? | Index Definition |
| --- | --- | --- | --- |
| cash_box_transfers | cash_box_transfers_pkey | `true` | CREATE UNIQUE INDEX cash_box_transfers_pkey ON public.cash_box_transfers USING btree (transfer_id) |
| cash_box_transfers | idx_transfers_added_by | `false` | CREATE INDEX idx_transfers_added_by ON public.cash_box_transfers USING btree (added_by) |
| cash_box_transfers | idx_transfers_date | `false` | CREATE INDEX idx_transfers_date ON public.cash_box_transfers USING btree (transfer_date) |
| cash_box_transfers | idx_transfers_from | `false` | CREATE INDEX idx_transfers_from ON public.cash_box_transfers USING btree (from_box_id) |
| cash_box_transfers | idx_transfers_to | `false` | CREATE INDEX idx_transfers_to ON public.cash_box_transfers USING btree (to_box_id) |
| cash_boxes | cash_boxes_pkey | `true` | CREATE UNIQUE INDEX cash_boxes_pkey ON public.cash_boxes USING btree (cash_box_id) |
| courses | courses_pkey | `true` | CREATE UNIQUE INDEX courses_pkey ON public.courses USING btree (course_id) |
| courses | idx_courses_start | `false` | CREATE INDEX idx_courses_start ON public.courses USING btree (start_date) |
| courses | idx_courses_status | `false` | CREATE INDEX idx_courses_status ON public.courses USING btree (availability_status) |
| enrollments | enrollments_pkey | `true` | CREATE UNIQUE INDEX enrollments_pkey ON public.enrollments USING btree (enrollment_id) |
| enrollments | idx_enrollments_course | `false` | CREATE INDEX idx_enrollments_course ON public.enrollments USING btree (course_id) |
| enrollments | idx_enrollments_status | `false` | CREATE INDEX idx_enrollments_status ON public.enrollments USING btree (status) |
| enrollments | idx_enrollments_student | `false` | CREATE INDEX idx_enrollments_student ON public.enrollments USING btree (student_id) |
| enrollments | uq_enrollment | `true` | CREATE UNIQUE INDEX uq_enrollment ON public.enrollments USING btree (student_id, course_id) |
| expenses | expenses_pkey | `true` | CREATE UNIQUE INDEX expenses_pkey ON public.expenses USING btree (expense_id) |
| expenses | idx_expenses_added_by | `false` | CREATE INDEX idx_expenses_added_by ON public.expenses USING btree (added_by) |
| expenses | idx_expenses_cash_box | `false` | CREATE INDEX idx_expenses_cash_box ON public.expenses USING btree (cash_box_id) |
| expenses | idx_expenses_course | `false` | CREATE INDEX idx_expenses_course ON public.expenses USING btree (course_id) |
| expenses | idx_expenses_date | `false` | CREATE INDEX idx_expenses_date ON public.expenses USING btree (expense_date) |
| payments | idx_payments_added_by | `false` | CREATE INDEX idx_payments_added_by ON public.payments USING btree (added_by) |
| payments | idx_payments_cash_box | `false` | CREATE INDEX idx_payments_cash_box ON public.payments USING btree (cash_box_id) |
| payments | idx_payments_date | `false` | CREATE INDEX idx_payments_date ON public.payments USING btree (payment_date) |
| payments | idx_payments_enrollment | `false` | CREATE INDEX idx_payments_enrollment ON public.payments USING btree (enrollment_id) |
| payments | idx_payments_voided | `false` | CREATE INDEX idx_payments_voided ON public.payments USING btree (voided_at) |
| payments | payments_pkey | `true` | CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (payment_id) |
| payments | payments_receipt_number_uidx | `true` | CREATE UNIQUE INDEX payments_receipt_number_uidx ON public.payments USING btree (receipt_number) |