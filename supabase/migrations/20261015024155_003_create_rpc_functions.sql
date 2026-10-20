/*
# Create Atomic RPC Functions for Safe Financial Mutations

1. New Functions
- `enroll_student(p_student_id, p_course_id, p_agreed_cost)`: Atomically creates an enrollment with seat availability check (FOR UPDATE lock on course row). Returns the enrollment record or raises an error.
- `record_payment(p_enrollment_id, p_cash_box_id, p_amount, p_payment_date, p_payment_method, p_receipt_ref, p_notes)`: Records a payment, rejecting overpayments and payments on dropped enrollments. Returns the payment record or raises an error.
- `void_payment(p_payment_id)`: Marks a payment as voided (sets voided=true, voided_at=now()). Never deletes. Returns the voided payment record.
- `record_expense(p_cash_box_id, p_amount, p_expense_date, p_category, p_course_id, p_description, p_notes)`: Records an expense. Does NOT block negative balances (UI warns), but stores the expense.
- `transfer_between_boxes(p_from_box_id, p_to_box_id, p_amount, p_transfer_date, p_notes)`: Creates a transfer record between two different cash boxes. Returns the transfer record.

2. Important Notes
- All functions use SECURITY DEFINER to bypass RLS for internal operations
- enroll_student locks the course row with FOR UPDATE to prevent race conditions on seat counts
- record_payment checks enrollment status and remaining balance before inserting
- void_payment uses a soft-delete pattern (voided flag) to preserve financial history
- All functions return the created/modified record as JSON
- Errors are raised with RAISE EXCEPTION for the frontend to catch
*/

-- ===== ENROLL_STUDENT =====
CREATE OR REPLACE FUNCTION enroll_student(
  p_student_id uuid,
  p_course_id uuid,
  p_agreed_cost numeric DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course RECORD;
  v_enrollment enrollments;
  v_existing_count int;
  v_cost numeric(12,2);
BEGIN
  -- Lock the course row to prevent concurrent seat races
  SELECT * INTO v_course FROM courses WHERE id = p_course_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الكورس غير موجود';
  END IF;

  IF v_course.availability_status = 'Closed' THEN
    RAISE EXCEPTION 'هذا الكورس مغلق ولا يمكن التسجيل فيه';
  END IF;

  -- Check if already enrolled
  SELECT COUNT(*) INTO v_existing_count
  FROM enrollments WHERE student_id = p_student_id AND course_id = p_course_id;

  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'هذا الطالب مسجل بالفعل في هذا الكورس';
  END IF;

  -- Check seat capacity if max_students is set
  IF v_course.max_students IS NOT NULL THEN
    SELECT COUNT(*) INTO v_existing_count
    FROM enrollments WHERE course_id = p_course_id AND status = 'Active';

    IF v_existing_count >= v_course.max_students THEN
      RAISE EXCEPTION 'لا توجد مقاعد متاحة في هذا الكورس (ممتلئ)';
    END IF;
  END IF;

  -- Use provided cost or fall back to course default
  v_cost := COALESCE(p_agreed_cost, v_course.default_cost, 0);

  INSERT INTO enrollments (student_id, course_id, agreed_cost, status)
  VALUES (p_student_id, p_course_id, v_cost, 'Active')
  RETURNING * INTO v_enrollment;

  RETURN json_build_object(
    'success', true,
    'enrollment', row_to_json(v_enrollment)
  );
END;
$$;

-- ===== RECORD_PAYMENT =====
CREATE OR REPLACE FUNCTION record_payment(
  p_enrollment_id uuid,
  p_cash_box_id uuid,
  p_amount numeric,
  p_payment_date date DEFAULT CURRENT_DATE,
  p_payment_method text DEFAULT 'Cash',
  p_receipt_ref text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment RECORD;
  v_total_paid numeric(12,2);
  v_remaining numeric(12,2);
  v_payment payments;
BEGIN
  -- Lock the enrollment row
  SELECT * INTO v_enrollment FROM enrollments WHERE id = p_enrollment_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الاشتراك غير موجود';
  END IF;

  IF v_enrollment.status = 'Dropped' THEN
    RAISE EXCEPTION 'لا يمكن تسجيل دفعة لطالب منسحب';
  END IF;

  -- Calculate current paid amount (non-voided)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payments WHERE enrollment_id = p_enrollment_id AND voided = false;

  v_remaining := v_enrollment.agreed_cost - v_total_paid;

  IF p_amount > v_remaining THEN
    RAISE EXCEPTION 'المبلغ المُدخل (%) يتجاوز المتبقي (%)', p_amount, v_remaining;
  END IF;

  INSERT INTO payments (enrollment_id, cash_box_id, amount, payment_date, payment_method, receipt_ref, notes)
  VALUES (p_enrollment_id, p_cash_box_id, p_amount, p_payment_date, p_payment_method, p_receipt_ref, p_notes)
  RETURNING * INTO v_payment;

  RETURN json_build_object(
    'success', true,
    'payment', row_to_json(v_payment)
  );
END;
$$;

-- ===== VOID_PAYMENT =====
CREATE OR REPLACE FUNCTION void_payment(p_payment_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
BEGIN
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الدفعة غير موجودة';
  END IF;

  IF v_payment.voided = true THEN
    RAISE EXCEPTION 'هذه الدفعة ملغاة بالفعل';
  END IF;

  UPDATE payments SET voided = true, voided_at = now()
  WHERE id = p_payment_id
  RETURNING * INTO v_payment;

  RETURN json_build_object(
    'success', true,
    'payment', row_to_json(v_payment)
  );
END;
$$;

-- ===== RECORD_EXPENSE =====
CREATE OR REPLACE FUNCTION record_expense(
  p_cash_box_id uuid,
  p_amount numeric,
  p_expense_date date DEFAULT CURRENT_DATE,
  p_category text DEFAULT 'Other',
  p_course_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expense expenses;
BEGIN
  INSERT INTO expenses (cash_box_id, amount, expense_date, category, course_id, description, notes)
  VALUES (p_cash_box_id, p_amount, p_expense_date, p_category, p_course_id, p_description, p_notes)
  RETURNING * INTO v_expense;

  RETURN json_build_object(
    'success', true,
    'expense', row_to_json(v_expense)
  );
END;
$$;

-- ===== TRANSFER_BETWEEN_BOXES =====
CREATE OR REPLACE FUNCTION transfer_between_boxes(
  p_from_box_id uuid,
  p_to_box_id uuid,
  p_amount numeric,
  p_transfer_date date DEFAULT CURRENT_DATE,
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer cash_transfers;
BEGIN
  IF p_from_box_id = p_to_box_id THEN
    RAISE EXCEPTION 'لا يمكن التحويل بين نفس الخزنة';
  END IF;

  INSERT INTO cash_transfers (from_box_id, to_box_id, amount, transfer_date, notes)
  VALUES (p_from_box_id, p_to_box_id, p_amount, p_transfer_date, p_notes)
  RETURNING * INTO v_transfer;

  RETURN json_build_object(
    'success', true,
    'transfer', row_to_json(v_transfer)
  );
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION enroll_student TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_payment TO anon, authenticated;
GRANT EXECUTE ON FUNCTION void_payment TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_expense TO anon, authenticated;
GRANT EXECUTE ON FUNCTION transfer_between_boxes TO anon, authenticated;
