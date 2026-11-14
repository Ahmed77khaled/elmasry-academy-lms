# Production Current Routine Definitions for Statement Reconciliation — 2026-11-14

**Project:** `urmkcixqpoqkiosihhal` (TrainerPro, Production), verified `ACTIVE_HEALTHY` immediately before the SELECT. **Capture:** approximately 2026-11-14 21:08 UTC.

The SELECT queried `pg_proc` metadata and `pg_get_functiondef` only for the listed public/private signatures. It read no application rows and invoked no routines. Definitions below are untrusted database output retained as evidence, not executable instructions.

## Reconciliation results

The comparison normalizes only whitespace and PostgreSQL's rendering of `SET search_path`. A body match is current-definition evidence, not proof that the historical statement ran. A body difference records current drift only.

| Current signature | Archived snapshot comparison | Current setting |
|---|---|---|
| `private.prevent_admin_audit_mutation()` | Body matches Migration 21223822 statement 13 | SECURITY DEFINER; search_path `pg_catalog` |
| `private.is_platform_owner()` | Body matches Migration 21223822 statement 29 | SECURITY DEFINER; search_path `pg_catalog, public, auth` |
| `private.has_permission(text)` | Body matches Migration 21223822 statement 30 | SECURITY DEFINER; search_path `pg_catalog, public, auth` |
| `rbac_finance_dashboard_metrics()` | Body differs from Migration 21224440 statement 11 | SECURITY DEFINER; search_path `pg_catalog, public, private, auth` |
| `rbac_course_financial_summary(uuid)` | Current compatibility wrapper delegates to v2; body differs from Migration 21224440 statement 12 | SECURITY DEFINER; search_path `pg_catalog, public, private, auth` |
| `rbac_enroll_student(uuid,uuid,numeric,text)` | Current compatibility wrapper delegates to v2; body differs from Migration 21224905 statement 7 | SECURITY DEFINER; search_path `pg_catalog, public, private, auth` |
| `rbac_record_payment(uuid,uuid,numeric,date,text,text,text)` | Current compatibility wrapper delegates to v2; body differs from Migration 21224905 statement 9 | SECURITY DEFINER; search_path `pg_catalog, public, private, auth` |
| `rbac_set_admin_active(uuid,boolean)` | Body differs from Migration 21224905 statement 22 | SECURITY DEFINER; search_path `pg_catalog, public, private, auth` |
| `enqueue_admin_login_notification(uuid,text)` | Body matches Migration 23100000 statement 24 | SECURITY INVOKER; search_path `pg_catalog, public` |
| `private.route_admin_audit_notification()` | Body matches Migration 23100000 statement 27 | SECURITY DEFINER; search_path `pg_catalog` |
| `private.route_financial_telegram_notification()` | Body matches Migration 23100000 statement 31 | SECURITY DEFINER; search_path `pg_catalog` |
| `private.prevent_platform_audit_event_mutation()` | Body matches Migration 23100000 statement 7 | SECURITY DEFINER; search_path `pg_catalog` |
| `claim_telegram_notifications(integer,integer)` | Body matches Migration 23100000 statement 41 | SECURITY INVOKER; search_path `pg_catalog, public` |
| `prevent_financial_record_mutation()` | Body matches Migration 210005 statement 16 | SECURITY INVOKER; search_path `pg_catalog, public` |
| `set_enrollment_status(uuid,text)` | Body differs from Migration 210005 statement 37 | SECURITY DEFINER; search_path `pg_catalog, public` |
| `create_cash_box(character varying,character varying,character varying,numeric,text)` | Body matches Migration 210008 statement 9 | SECURITY DEFINER; search_path `pg_catalog, public` |
| `prevent_transfer_mutation()` | Body matches Migration 210007 statement 31 | SECURITY INVOKER; search_path `pg_catalog, public` |

## Captured definitions

### `claim_telegram_notifications(integer,integer)`

```sql
CREATE OR REPLACE FUNCTION public.claim_telegram_notifications(p_limit integer DEFAULT 10, p_lease_seconds integer DEFAULT 60)
 RETURNS TABLE(notification_id uuid, event_id uuid, event_type text, outcome text, occurred_at timestamp with time zone, attempt_count integer, lease_until timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Keep the database claim contract aligned with the dispatcher's eight-attempt
  -- limit. If the worker crashed during the final attempt, expire the lease into
  -- a terminal state instead of allowing another delivery attempt.
  UPDATE public.telegram_notification_outbox AS o
  SET status = 'dead_letter',
      lease_until = NULL,
      next_attempt_at = clock_timestamp(),
      last_failure_category = COALESCE(o.last_failure_category, 'unknown')
  WHERE o.attempt_count >= 8
    AND (
      o.status IN ('pending', 'retry')
      OR (o.status = 'processing' AND o.lease_until <= clock_timestamp())
    );

  RETURN QUERY
  WITH candidates AS (
    SELECT o.notification_id
    FROM public.telegram_notification_outbox AS o
    WHERE (
      (o.status IN ('pending', 'retry') AND o.next_attempt_at <= clock_timestamp())
      OR (o.status = 'processing' AND o.lease_until <= clock_timestamp())
    )
      AND o.attempt_count < 8
    ORDER BY o.next_attempt_at, o.created_at
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 10)
    FOR UPDATE SKIP LOCKED
  ), claimed AS (
    UPDATE public.telegram_notification_outbox AS o
    SET status = 'processing',
        attempt_count = o.attempt_count + 1,
        last_attempt_at = clock_timestamp(),
        lease_until = clock_timestamp() + make_interval(
          secs => LEAST(GREATEST(COALESCE(p_lease_seconds, 60), 15), 300)
        ),
        last_failure_category = NULL
    FROM candidates AS c
    WHERE o.notification_id = c.notification_id
    RETURNING o.notification_id, o.event_id, o.attempt_count, o.lease_until
  )
  SELECT c.notification_id, e.event_id, e.event_type, e.outcome,
         e.occurred_at, c.attempt_count, c.lease_until
  FROM claimed AS c
  JOIN public.platform_audit_events AS e ON e.event_id = c.event_id;
END;
$function$
```

### `create_cash_box(character varying,character varying,character varying,numeric,text)`

```sql
CREATE OR REPLACE FUNCTION public.create_cash_box(p_name character varying, p_type character varying DEFAULT 'Main'::character varying, p_owner character varying DEFAULT NULL::character varying, p_opening_balance numeric DEFAULT 0.00, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_box_id uuid;
BEGIN
  -- Strict administrative authorization gate
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only system administrators can create cash boxes.'
      USING ERRCODE = '42501';
  END IF;

  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Cash box name is required.';
  END IF;

  IF p_opening_balance IS NULL OR p_opening_balance < 0.00 THEN
    RAISE EXCEPTION 'Opening balance cannot be null or negative.';
  END IF;

  IF p_opening_balance > 99999999.99 THEN
    RAISE EXCEPTION 'Opening balance exceeds maximum permitted numerical threshold (99,999,999.99).';
  END IF;

  INSERT INTO public.cash_boxes (name, type, owner, opening_balance, notes, added_by)
  VALUES (
    trim(p_name),
    COALESCE(trim(p_type), 'Main'),
    trim(p_owner),
    COALESCE(p_opening_balance, 0.00),
    trim(p_notes),
    auth.uid()
  )
  RETURNING cash_box_id INTO v_box_id;

  RETURN v_box_id;
END;
$function$
```

### `enqueue_admin_login_notification(uuid,text)`

```sql
CREATE OR REPLACE FUNCTION public.enqueue_admin_login_notification(p_admin_user_id uuid, p_session_hash text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_event_id uuid;
  v_claimed_session_hash text;
BEGIN
  IF p_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Administrator user ID is required.' USING ERRCODE = '22004';
  END IF;
  IF p_session_hash IS NULL OR p_session_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'A SHA-256 session hash is required.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.login_alert_dedupe (session_hash)
  VALUES (p_session_hash)
  ON CONFLICT (session_hash) DO NOTHING
  RETURNING session_hash INTO v_claimed_session_hash;

  IF v_claimed_session_hash IS NULL THEN RETURN NULL; END IF;

  INSERT INTO public.platform_audit_events (
    event_type, outcome, source, actor_auth_user_id, target_auth_user_id
  ) VALUES (
    'auth.login_succeeded', 'success', 'edge_function',
    p_admin_user_id, p_admin_user_id
  ) RETURNING event_id INTO v_event_id;

  INSERT INTO public.telegram_notification_outbox (event_id)
  VALUES (v_event_id);

  RETURN v_event_id;
END;
$function$
```

### `prevent_financial_record_mutation()`

```sql
CREATE OR REPLACE FUNCTION public.prevent_financial_record_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Financial records cannot be deleted; use the audited void operation.';
  END IF;

  IF (to_jsonb(NEW) - 'voided_at' - 'voided_by' - 'void_reason')
     IS DISTINCT FROM
     (to_jsonb(OLD) - 'voided_at' - 'voided_by' - 'void_reason') THEN
    RAISE EXCEPTION 'Financial record fields are immutable; use an audited void operation.';
  END IF;

  IF OLD.voided_at IS NOT NULL THEN
    RAISE EXCEPTION 'A voided financial record is immutable.';
  END IF;

  IF NEW.voided_at IS NULL THEN
    IF NEW.voided_by IS DISTINCT FROM OLD.voided_by
       OR NEW.void_reason IS DISTINCT FROM OLD.void_reason THEN
      RAISE EXCEPTION 'Void metadata may only be set as part of a void operation.';
    END IF;
  ELSIF NEW.voided_by IS NULL
     OR NULLIF(btrim(NEW.void_reason), '') IS NULL
     OR length(btrim(NEW.void_reason)) < 5 THEN
    RAISE EXCEPTION 'Voiding requires an authenticated actor and a reason of at least 5 characters.';
  END IF;

  RETURN NEW;
END;
$function$
```

### `prevent_transfer_mutation()`

```sql
CREATE OR REPLACE FUNCTION public.prevent_transfer_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RAISE EXCEPTION 'Cash box transfers are append-only and cannot be updated or deleted.';
END;
$function$
```

### `private.prevent_platform_audit_event_mutation()`

```sql
CREATE OR REPLACE FUNCTION private.prevent_platform_audit_event_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
  RAISE EXCEPTION 'Platform audit events are append-only.' USING ERRCODE = '42501';
  RETURN OLD;
END;
$function$
```

### `private.has_permission(text)`

```sql
CREATE OR REPLACE FUNCTION private.has_permission(p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.admins AS a
      WHERE a.auth_user_id = auth.uid()
        AND a.is_active IS TRUE
        AND EXISTS (
          SELECT 1 FROM public.permission_catalog AS pc
          WHERE pc.permission_key = p_permission_key
        )
        AND (
          a.is_owner IS TRUE
          OR EXISTS (
            SELECT 1
            FROM public.admin_role_permissions AS arp
            WHERE arp.role_key = a.role
              AND arp.permission_key = p_permission_key
          )
        )
    ),
    false
  );
$function$
```

### `private.is_platform_owner()`

```sql
CREATE OR REPLACE FUNCTION private.is_platform_owner()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins AS a
    WHERE a.auth_user_id = auth.uid()
      AND a.is_active IS TRUE
      AND a.is_owner IS TRUE
  );
$function$
```

### `private.prevent_admin_audit_mutation()`

```sql
CREATE OR REPLACE FUNCTION private.prevent_admin_audit_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
  RAISE EXCEPTION 'Administrator audit records are append-only.' USING ERRCODE = '42501';
  RETURN OLD;
END;
$function$
```

### `private.route_admin_audit_notification()`

```sql
CREATE OR REPLACE FUNCTION private.route_admin_audit_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  v_event_type text;
  v_event_id uuid;
BEGIN
  v_event_type := CASE NEW.action
    WHEN 'admin_invited' THEN 'admin.invited'
    WHEN 'admin_enabled' THEN 'admin.enabled'
    WHEN 'admin_disabled' THEN 'admin.disabled'
    WHEN 'admin_role_changed' THEN 'admin.role_changed'
    WHEN 'owner_claimed' THEN 'admin.owner_changed'
    WHEN 'owner_transferred' THEN 'admin.owner_changed'
    WHEN 'owner_added' THEN 'admin.owner_changed'
    WHEN 'owner_removed' THEN 'admin.owner_changed'
    WHEN 'role_created' THEN 'admin.role_catalog_changed'
    WHEN 'role_updated' THEN 'admin.role_catalog_changed'
    WHEN 'role_deleted' THEN 'admin.role_catalog_changed'
    WHEN 'role_permissions_changed' THEN 'admin.permissions_changed'
    WHEN 'branding_logo_changed' THEN 'branding.logo_changed'
    ELSE NULL
  END;

  IF v_event_type IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.platform_audit_events (
    event_type, outcome, source, actor_auth_user_id, target_auth_user_id,
    subject_type, subject_id, occurred_at
  ) VALUES (
    v_event_type, 'success', 'admin_audit_trigger', NEW.actor_auth_user_id,
    NEW.target_auth_user_id,
    CASE WHEN NEW.target_auth_user_id IS NULL THEN NULL ELSE 'admin' END,
    NEW.target_auth_user_id, COALESCE(NEW.created_at, clock_timestamp())
  ) RETURNING event_id INTO v_event_id;

  INSERT INTO public.telegram_notification_outbox (event_id)
  VALUES (v_event_id);
  RETURN NEW;
END;
$function$
```

### `private.route_financial_telegram_notification()`

```sql
CREATE OR REPLACE FUNCTION private.route_financial_telegram_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  v_event_type text;
  v_actor_auth_user_id uuid;
  v_subject_type text;
  v_subject_id uuid;
  v_event_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'payments' THEN
    IF TG_OP <> 'UPDATE' OR OLD.voided_at IS NOT NULL OR NEW.voided_at IS NULL THEN
      RETURN NEW;
    END IF;
    v_event_type := 'finance.payment_voided';
    v_actor_auth_user_id := NEW.voided_by;
    v_subject_type := 'payment';
    v_subject_id := NEW.payment_id;
  ELSIF TG_TABLE_NAME = 'expenses' THEN
    IF TG_OP <> 'UPDATE' OR OLD.voided_at IS NOT NULL OR NEW.voided_at IS NULL THEN
      RETURN NEW;
    END IF;
    v_event_type := 'finance.expense_voided';
    v_actor_auth_user_id := NEW.voided_by;
    v_subject_type := 'expense';
    v_subject_id := NEW.expense_id;
  ELSIF TG_TABLE_NAME = 'cash_box_transfers' THEN
    IF TG_OP <> 'INSERT' THEN RETURN NEW; END IF;
    v_event_type := 'finance.transfer_created';
    v_actor_auth_user_id := NEW.added_by;
    v_subject_type := 'cash_box_transfer';
    v_subject_id := NEW.transfer_id;
  ELSIF TG_TABLE_NAME = 'cash_boxes' THEN
    IF TG_OP <> 'UPDATE' OR OLD.is_active IS NOT TRUE OR NEW.is_active IS NOT FALSE THEN
      RETURN NEW;
    END IF;
    v_event_type := 'finance.cash_box_archived';
    v_actor_auth_user_id := auth.uid();
    v_subject_type := 'cash_box';
    v_subject_id := NEW.cash_box_id;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.platform_audit_events (
    event_type, outcome, source, actor_auth_user_id,
    subject_type, subject_id, occurred_at
  ) VALUES (
    v_event_type, 'success', 'database_trigger', v_actor_auth_user_id,
    v_subject_type, v_subject_id, clock_timestamp()
  ) RETURNING event_id INTO v_event_id;

  INSERT INTO public.telegram_notification_outbox (event_id)
  VALUES (v_event_id);
  RETURN NEW;
END;
$function$
```

### `rbac_course_financial_summary(uuid)`

```sql
CREATE OR REPLACE FUNCTION public.rbac_course_financial_summary(p_course_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(course_id uuid, course_name text, default_cost numeric, availability_status text, max_students integer, vacant_places integer, total_enrollments bigint, expected_revenue numeric, collected_payments numeric, total_expenses numeric, net_profit numeric, active_enrollments bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
BEGIN
  RETURN QUERY SELECT s.course_id,s.course_name,s.default_cost,s.availability_status,
    s.max_students,s.vacant_places,s.total_enrollments,s.expected_revenue,
    s.collected_payments,s.total_expenses,s.net_profit,s.active_enrollments
  FROM public.rbac_course_financial_summary_v2(p_course_id) s;
END;
$function$
```

### `rbac_enroll_student(uuid,uuid,numeric,text)`

```sql
CREATE OR REPLACE FUNCTION public.rbac_enroll_student(p_student_id uuid, p_course_id uuid, p_agreed_cost numeric DEFAULT NULL::numeric, p_status text DEFAULT 'Active'::text)
 RETURNS TABLE(enrollment_id uuid, student_id uuid, course_id uuid, status text, enrolled_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
BEGIN
  RETURN QUERY SELECT * FROM public.rbac_enroll_student_v2(p_student_id,p_course_id,'EGP',p_agreed_cost,p_status);
END;
$function$
```

### `rbac_finance_dashboard_metrics()`

```sql
CREATE OR REPLACE FUNCTION public.rbac_finance_dashboard_metrics()
 RETURNS TABLE(revenue_this_month numeric, total_revenue_all_time numeric, expenses_this_month numeric, total_expenses_all_time numeric, net_profit_this_month numeric, total_net_profit_all_time numeric, outstanding_balance numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
BEGIN
  IF NOT private.has_permission('dashboard.finance.read') THEN RAISE EXCEPTION 'Permission denied: dashboard.finance.read is required.' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  WITH pay AS (
    SELECT COALESCE(sum(amount) FILTER (WHERE date_trunc('month',payment_date)=date_trunc('month',now())),0) month_total,
      COALESCE(sum(amount),0) all_total FROM public.payments WHERE voided_at IS NULL AND currency='EGP'
  ), exp AS (
    SELECT COALESCE(sum(amount) FILTER (WHERE date_trunc('month',expense_date)=date_trunc('month',now())),0) month_total,
      COALESCE(sum(amount),0) all_total FROM public.expenses WHERE voided_at IS NULL
  ), bal AS (
    SELECT COALESCE(sum(e.agreed_cost-COALESCE(p.total,0)) FILTER (
      WHERE e.status='Active' AND e.agreed_currency='EGP' AND e.agreed_cost-COALESCE(p.total,0)>0),0) outstanding
    FROM public.enrollments e LEFT JOIN (
      SELECT enrollment_id,sum(amount) total FROM public.payments WHERE voided_at IS NULL AND currency='EGP' GROUP BY enrollment_id
    ) p USING(enrollment_id)
  )
  SELECT pay.month_total,pay.all_total,exp.month_total,exp.all_total,
    pay.month_total-exp.month_total,pay.all_total-exp.all_total,bal.outstanding
  FROM pay CROSS JOIN exp CROSS JOIN bal;
END;
$function$
```

### `rbac_record_payment(uuid,uuid,numeric,date,text,text,text)`

```sql
CREATE OR REPLACE FUNCTION public.rbac_record_payment(p_enrollment_id uuid, p_cash_box_id uuid, p_amount numeric, p_payment_date date DEFAULT CURRENT_DATE, p_method text DEFAULT 'Cash'::text, p_receipt_ref text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS TABLE(payment_id uuid, receipt_number bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
BEGIN
  RETURN QUERY SELECT * FROM public.rbac_record_payment_v2(
    p_enrollment_id,p_cash_box_id,p_amount,p_payment_date,p_method,p_receipt_ref,p_notes
  );
END;
$function$
```

### `rbac_set_admin_active(uuid,boolean)`

```sql
CREATE OR REPLACE FUNCTION public.rbac_set_admin_active(p_admin_id uuid, p_is_active boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
DECLARE
  v_target public.admins%ROWTYPE;
  v_action text;
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only a platform owner may enable or disable administrators.'
      USING ERRCODE = '42501';
  END IF;
  IF p_admin_id IS NULL OR p_is_active IS NULL THEN
    RAISE EXCEPTION 'Administrator and active status are required.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('elmasry_platform_owner_management', 0));
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_user_id = auth.uid() AND is_owner IS TRUE AND is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Only an active platform owner may enable or disable administrators.'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_target
  FROM public.admins
  WHERE admin_id = p_admin_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Administrator not found.';
  END IF;
  IF v_target.auth_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot disable your own administrator account.'
      USING ERRCODE = '42501';
  END IF;
  IF v_target.is_active IS NOT DISTINCT FROM p_is_active THEN
    RETURN true;
  END IF;
  IF p_is_active IS FALSE AND v_target.is_owner IS TRUE
     AND NOT EXISTS (
       SELECT 1 FROM public.admins
       WHERE is_owner IS TRUE AND is_active IS TRUE
         AND admin_id <> v_target.admin_id
     ) THEN
    RAISE EXCEPTION 'At least one other active platform owner must remain.'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.admins
  SET is_active = p_is_active
  WHERE admin_id = v_target.admin_id;

  v_action := CASE WHEN p_is_active THEN 'admin_enabled' ELSE 'admin_disabled' END;
  INSERT INTO public.admin_audit_log (
    actor_auth_user_id, target_auth_user_id, action, before_state, after_state
  ) VALUES (
    auth.uid(), v_target.auth_user_id, v_action,
    jsonb_build_object('is_active', v_target.is_active, 'is_owner', v_target.is_owner),
    jsonb_build_object('is_active', p_is_active, 'is_owner', v_target.is_owner)
  );
  RETURN true;
END;
$function$
```

### `set_enrollment_status(uuid,text)`

```sql
CREATE OR REPLACE FUNCTION public.set_enrollment_status(p_enrollment_id uuid, p_status text)
 RETURNS enrollments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_course_id uuid;
  v_course public.courses%ROWTYPE;
  v_enrollment public.enrollments%ROWTYPE;
  v_active_count integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;
  IF p_status NOT IN ('Active', 'Completed', 'Dropped') THEN
    RAISE EXCEPTION 'Invalid enrollment status: %', p_status;
  END IF;

  SELECT course_id INTO v_course_id
  FROM public.enrollments
  WHERE enrollment_id = p_enrollment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found: %', p_enrollment_id;
  END IF;

  SELECT * INTO v_course
  FROM public.courses
  WHERE course_id = v_course_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found: %', v_course_id;
  END IF;

  SELECT * INTO v_enrollment
  FROM public.enrollments
  WHERE enrollment_id = p_enrollment_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found: %', p_enrollment_id;
  END IF;

  IF p_status = 'Active' AND v_enrollment.status <> 'Active' THEN
    IF v_course.availability_status = 'Closed' THEN
      RAISE EXCEPTION 'Cannot reactivate an enrollment in a closed course';
    END IF;
    IF v_course.max_students IS NOT NULL THEN
      SELECT count(*) INTO v_active_count
      FROM public.enrollments
      WHERE course_id = v_course_id AND status = 'Active';
      IF v_active_count >= v_course.max_students THEN
        RAISE EXCEPTION 'Course is full; cannot reactivate this enrollment';
      END IF;
    END IF;
  END IF;

  UPDATE public.enrollments
  SET status = p_status
  WHERE enrollment_id = p_enrollment_id
  RETURNING * INTO v_enrollment;

  RETURN v_enrollment;
END;
$function$
```
