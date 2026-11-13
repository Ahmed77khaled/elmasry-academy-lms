-- ===========================================================================
-- STAGING REPRODUCED SCHEMA BASELINE — TrainerPro / Elmasry Academy LMS
-- Generated directly from Production (urmkcixqpoqkiosihhal) via pg_catalog
-- Contains SCHEMA & SEED ONLY (Zero production student/financial/user data)
-- Target Staging: kxdfconqflveqeozanaw
-- ===========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS private;
CREATE SEQUENCE IF NOT EXISTS public.payment_receipt_number_seq START WITH 1;

-- ---------------------------------------------------------------------------
-- 1. BASE TABLES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_roles (
    role_key text NOT NULL,
    display_name text NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    is_assignable boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.permission_catalog (
    permission_key text NOT NULL,
    description text NOT NULL,
    is_delegable boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
    role_key text NOT NULL,
    permission_key text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admins (
    admin_id uuid DEFAULT gen_random_uuid() NOT NULL,
    auth_user_id uuid NOT NULL,
    role varchar(50) DEFAULT 'instructor'::character varying NOT NULL,
    created_at timestamptz DEFAULT now(),
    is_active boolean DEFAULT true NOT NULL,
    is_owner boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    audit_id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_auth_user_id uuid NOT NULL,
    target_auth_user_id uuid,
    action text NOT NULL,
    before_state jsonb,
    after_state jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.courses (
    course_id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_name varchar(255) NOT NULL,
    description text,
    level varchar(50),
    duration_weeks integer,
    prerequisite_courses text,
    start_date date,
    end_date date,
    max_students integer,
    default_cost numeric(10,2),
    availability_status varchar(50) DEFAULT 'Upcoming'::character varying NOT NULL,
    link_whatsapp text,
    link_tasks text,
    link_drive text,
    link_sources text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    default_cost_usd numeric(12,2)
);

CREATE TABLE IF NOT EXISTS public.students (
    student_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name varchar(255) NOT NULL,
    phone varchar(20),
    email varchar(255),
    employment_status varchar(50),
    grad_status varchar(50),
    grad_college varchar(255),
    previous_courses text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    country text,
    governorate text,
    workplace text,
    study_year text
);

CREATE TABLE IF NOT EXISTS public.cash_boxes (
    cash_box_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name varchar(255) NOT NULL,
    type varchar(50),
    owner varchar(255),
    opening_balance numeric(10,2) DEFAULT 0.00 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now(),
    added_by uuid DEFAULT auth.uid(),
    opening_balance_usd numeric(12,2) DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.enrollments (
    enrollment_id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    course_id uuid NOT NULL,
    agreed_cost numeric(10,2) NOT NULL,
    status varchar(50) DEFAULT 'Active'::character varying NOT NULL,
    enrolled_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    agreed_currency text DEFAULT 'EGP'::text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payments (
    payment_id uuid DEFAULT gen_random_uuid() NOT NULL,
    enrollment_id uuid NOT NULL,
    cash_box_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_date date NOT NULL,
    method varchar(50),
    receipt_ref varchar(255),
    notes text,
    added_by uuid,
    voided_at timestamptz,
    created_at timestamptz DEFAULT now(),
    receipt_number bigint DEFAULT nextval('payment_receipt_number_seq'::regclass) NOT NULL,
    voided_by uuid,
    void_reason text,
    currency text DEFAULT 'EGP'::text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.expenses (
    expense_id uuid DEFAULT gen_random_uuid() NOT NULL,
    cash_box_id uuid NOT NULL,
    course_id uuid,
    amount numeric(10,2) NOT NULL,
    category varchar(100),
    description text,
    expense_date date NOT NULL,
    notes text,
    added_by uuid,
    created_at timestamptz DEFAULT now(),
    voided_at timestamptz,
    voided_by uuid,
    void_reason text
);

CREATE TABLE IF NOT EXISTS public.cash_box_transfers (
    transfer_id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_box_id uuid NOT NULL,
    to_box_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    transfer_date date NOT NULL,
    notes text,
    added_by uuid,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.login_alert_dedupe (
    session_hash text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.platform_notification_settings (
    singleton_id smallint DEFAULT 1 NOT NULL,
    group_language text DEFAULT 'ar'::text NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.platform_audit_events (
    event_id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    outcome text NOT NULL,
    source text NOT NULL,
    actor_auth_user_id uuid,
    target_auth_user_id uuid,
    subject_type text,
    subject_id uuid,
    occurred_at timestamptz DEFAULT now() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.telegram_notification_outbox (
    notification_id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    destination_key text DEFAULT 'admin_group'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    next_attempt_at timestamptz DEFAULT now() NOT NULL,
    lease_until timestamptz,
    last_attempt_at timestamptz,
    sent_at timestamptz,
    last_failure_category text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 2. SEED RBAC & CONFIGURATION CATALOG (Required for schema functions)
-- ---------------------------------------------------------------------------
INSERT INTO public.admin_roles (role_key, display_name, is_system, is_assignable) VALUES ('academy_manager', 'Academy Manager', True, True) ON CONFLICT (role_key) DO NOTHING;
INSERT INTO public.admin_roles (role_key, display_name, is_system, is_assignable) VALUES ('finance_manager', 'Finance Manager', True, True) ON CONFLICT (role_key) DO NOTHING;
INSERT INTO public.admin_roles (role_key, display_name, is_system, is_assignable) VALUES ('superadmin', 'Platform Owner', True, False) ON CONFLICT (role_key) DO NOTHING;

INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('admins.assign_role', 'Assign administrator roles.', False) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('admins.disable', 'Disable administrator accounts.', False) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('admins.invite', 'Invite administrator accounts.', False) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('admins.read', 'Read administrator accounts.', False) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('audit.read', 'Read administrator audit events.', False) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('courses.close', 'Close courses.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('courses.create', 'Create courses.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('courses.export', 'Export permitted course data.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('courses.pricing.read', 'Read course prices.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('courses.pricing.update', 'Create or update course prices.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('courses.read', 'Read operational course data.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('courses.update', 'Update permitted course fields.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('dashboard.finance.read', 'Read financial dashboard metrics.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('dashboard.operational.read', 'Read operational dashboard metrics.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('enrollments.create', 'Enroll a student using the server-side default price.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('enrollments.export', 'Export permitted enrollment data.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('enrollments.financial.read', 'Read enrollment fees, payments, balances, and payment status.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('enrollments.pricing.override', 'Set a non-default enrollment price.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('enrollments.read', 'Read operational enrollment data.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('enrollments.update_status', 'Update enrollment status.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.cash_boxes.archive', 'Archive cash boxes.', False) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.cash_boxes.create', 'Create cash boxes.', False) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.cash_boxes.read', 'Read cash boxes and balances.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.cash_boxes.update', 'Update approved cash-box metadata.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.expenses.export', 'Export expense records.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.expenses.read', 'Read expense records.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.expenses.record', 'Record expenses.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.expenses.void', 'Void expense records.', False) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.payments.export', 'Export payment records.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.payments.read', 'Read payment records.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.payments.record', 'Record payments.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.payments.void', 'Void payment records.', False) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.reports.export', 'Export financial reports.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.reports.read', 'Read financial reports.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.transfers.create', 'Transfer funds between cash boxes.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('finance.transfers.read', 'Read cash-box transfers.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('roles.create', 'Create custom roles.', False) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('roles.delete', 'Delete custom roles.', False) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('roles.read', 'Read role and permission definitions.', False) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('roles.update', 'Update custom role permissions.', False) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('students.archive', 'Archive student records.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('students.create', 'Create student records.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('students.email.read', 'Read student email addresses.', False) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('students.email.update', 'Create or update student email addresses.', False) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('students.export', 'Export permitted student data.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('students.read', 'Read permitted student identity fields.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('students.read_contact_phone', 'Read student phone numbers for follow-up.', True) ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.permission_catalog (permission_key, description, is_delegable) VALUES ('students.update', 'Update permitted student fields.', True) ON CONFLICT (permission_key) DO NOTHING;

INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('academy_manager', 'courses.close') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('academy_manager', 'courses.create') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('academy_manager', 'courses.read') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('academy_manager', 'courses.update') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('academy_manager', 'dashboard.operational.read') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('academy_manager', 'enrollments.create') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('academy_manager', 'enrollments.read') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('academy_manager', 'enrollments.update_status') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('academy_manager', 'students.create') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('academy_manager', 'students.read') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('academy_manager', 'students.read_contact_phone') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('academy_manager', 'students.update') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('finance_manager', 'dashboard.finance.read') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('finance_manager', 'enrollments.financial.read') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('finance_manager', 'enrollments.read') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('finance_manager', 'finance.cash_boxes.read') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('finance_manager', 'finance.cash_boxes.update') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('finance_manager', 'finance.expenses.read') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('finance_manager', 'finance.expenses.record') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('finance_manager', 'finance.payments.read') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('finance_manager', 'finance.payments.record') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('finance_manager', 'finance.reports.export') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('finance_manager', 'finance.reports.read') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('finance_manager', 'finance.transfers.create') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('finance_manager', 'finance.transfers.read') ON CONFLICT (role_key, permission_key) DO NOTHING;
INSERT INTO public.admin_role_permissions (role_key, permission_key) VALUES ('finance_manager', 'students.read') ON CONFLICT (role_key, permission_key) DO NOTHING;

INSERT INTO public.platform_notification_settings (singleton_id, group_language) VALUES (1, 'ar') ON CONFLICT (singleton_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. TABLE CONSTRAINTS (PK, Unique, Check, FK)
-- ---------------------------------------------------------------------------
ALTER TABLE public.admin_roles ADD CONSTRAINT admin_roles_pkey PRIMARY KEY (role_key);
ALTER TABLE public.admin_roles ADD CONSTRAINT admin_roles_role_key_check CHECK ((role_key ~ '^[a-z][a-z0-9_]{1,49}$'::text));
ALTER TABLE public.permission_catalog ADD CONSTRAINT permission_catalog_pkey PRIMARY KEY (permission_key);
ALTER TABLE public.permission_catalog ADD CONSTRAINT permission_catalog_permission_key_check CHECK ((permission_key ~ '^[a-z][a-z0-9_.]{2,99}$'::text));
ALTER TABLE public.admin_role_permissions ADD CONSTRAINT admin_role_permissions_pkey PRIMARY KEY (role_key, permission_key);
ALTER TABLE public.admin_role_permissions ADD CONSTRAINT admin_role_permissions_permission_key_fkey FOREIGN KEY (permission_key) REFERENCES permission_catalog(permission_key) ON DELETE RESTRICT;
ALTER TABLE public.admin_role_permissions ADD CONSTRAINT admin_role_permissions_role_key_fkey FOREIGN KEY (role_key) REFERENCES admin_roles(role_key) ON DELETE CASCADE;
ALTER TABLE public.admins ADD CONSTRAINT admins_pkey PRIMARY KEY (admin_id);
ALTER TABLE public.admins ADD CONSTRAINT admins_auth_user_id_key UNIQUE (auth_user_id);
ALTER TABLE public.admins ADD CONSTRAINT admins_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.admins ADD CONSTRAINT admins_role_catalog_fk FOREIGN KEY (role) REFERENCES admin_roles(role_key) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE public.admin_audit_log ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (audit_id);
ALTER TABLE public.admin_audit_log ADD CONSTRAINT admin_audit_log_action_check CHECK ((action = ANY (ARRAY['owner_claimed'::text, 'owner_transferred'::text, 'owner_added'::text, 'owner_removed'::text, 'admin_invited'::text, 'admin_role_changed'::text, 'admin_disabled'::text, 'admin_enabled'::text, 'role_created'::text, 'role_updated'::text, 'role_deleted'::text, 'role_permissions_changed'::text, 'branding_logo_changed'::text, 'telegram_notification_language_changed'::text])));
ALTER TABLE public.courses ADD CONSTRAINT courses_pkey PRIMARY KEY (course_id);
ALTER TABLE public.courses ADD CONSTRAINT chk_course_status CHECK (((availability_status)::text = ANY ((ARRAY['Upcoming'::character varying, 'Active'::character varying, 'Closed'::character varying])::text[])));
ALTER TABLE public.courses ADD CONSTRAINT courses_default_cost_check CHECK ((default_cost >= (0)::numeric));
ALTER TABLE public.courses ADD CONSTRAINT courses_default_cost_usd_nonnegative CHECK (((default_cost_usd IS NULL) OR (default_cost_usd >= (0)::numeric)));
ALTER TABLE public.courses ADD CONSTRAINT courses_duration_weeks_check CHECK ((duration_weeks > 0));
ALTER TABLE public.courses ADD CONSTRAINT courses_max_students_check CHECK ((max_students > 0));
ALTER TABLE public.students ADD CONSTRAINT students_pkey PRIMARY KEY (student_id);
ALTER TABLE public.cash_boxes ADD CONSTRAINT cash_boxes_pkey PRIMARY KEY (cash_box_id);
ALTER TABLE public.cash_boxes ADD CONSTRAINT cash_boxes_opening_balance_usd_nonnegative CHECK ((opening_balance_usd >= (0)::numeric));
ALTER TABLE public.cash_boxes ADD CONSTRAINT cash_boxes_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id);
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_pkey PRIMARY KEY (enrollment_id);
ALTER TABLE public.enrollments ADD CONSTRAINT uq_enrollment UNIQUE (student_id, course_id);
ALTER TABLE public.enrollments ADD CONSTRAINT chk_enrollment_status CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Completed'::character varying, 'Dropped'::character varying])::text[])));
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_agreed_cost_check CHECK ((agreed_cost >= (0)::numeric));
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_agreed_currency_check CHECK ((agreed_currency = ANY (ARRAY['EGP'::text, 'USD'::text])));
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE RESTRICT;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE RESTRICT;
ALTER TABLE public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);
ALTER TABLE public.payments ADD CONSTRAINT payments_amount_check CHECK ((amount > (0)::numeric));
ALTER TABLE public.payments ADD CONSTRAINT payments_currency_check CHECK ((currency = ANY (ARRAY['EGP'::text, 'USD'::text])));
ALTER TABLE public.payments ADD CONSTRAINT payments_void_reason_required_check CHECK (((voided_at IS NULL) OR ((void_reason IS NOT NULL) AND (length(btrim(void_reason)) >= 5))));
ALTER TABLE public.payments ADD CONSTRAINT payments_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id);
ALTER TABLE public.payments ADD CONSTRAINT payments_cash_box_id_fkey FOREIGN KEY (cash_box_id) REFERENCES cash_boxes(cash_box_id) ON DELETE RESTRICT;
ALTER TABLE public.payments ADD CONSTRAINT payments_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id) ON DELETE RESTRICT;
ALTER TABLE public.payments ADD CONSTRAINT payments_voided_by_fkey FOREIGN KEY (voided_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_pkey PRIMARY KEY (expense_id);
ALTER TABLE public.expenses ADD CONSTRAINT expenses_amount_check CHECK ((amount > (0)::numeric));
ALTER TABLE public.expenses ADD CONSTRAINT expenses_void_reason_required_check CHECK (((voided_at IS NULL) OR ((void_reason IS NOT NULL) AND (length(btrim(void_reason)) >= 5))));
ALTER TABLE public.expenses ADD CONSTRAINT expenses_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id);
ALTER TABLE public.expenses ADD CONSTRAINT expenses_cash_box_id_fkey FOREIGN KEY (cash_box_id) REFERENCES cash_boxes(cash_box_id) ON DELETE RESTRICT;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE SET NULL;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_voided_by_fkey FOREIGN KEY (voided_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.cash_box_transfers ADD CONSTRAINT cash_box_transfers_pkey PRIMARY KEY (transfer_id);
ALTER TABLE public.cash_box_transfers ADD CONSTRAINT cash_box_transfers_amount_check CHECK ((amount > (0)::numeric));
ALTER TABLE public.cash_box_transfers ADD CONSTRAINT chk_different_boxes CHECK ((from_box_id <> to_box_id));
ALTER TABLE public.cash_box_transfers ADD CONSTRAINT cash_box_transfers_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id);
ALTER TABLE public.cash_box_transfers ADD CONSTRAINT cash_box_transfers_from_box_id_fkey FOREIGN KEY (from_box_id) REFERENCES cash_boxes(cash_box_id) ON DELETE RESTRICT;
ALTER TABLE public.cash_box_transfers ADD CONSTRAINT cash_box_transfers_to_box_id_fkey FOREIGN KEY (to_box_id) REFERENCES cash_boxes(cash_box_id) ON DELETE RESTRICT;
ALTER TABLE public.login_alert_dedupe ADD CONSTRAINT login_alert_dedupe_pkey PRIMARY KEY (session_hash);
ALTER TABLE public.login_alert_dedupe ADD CONSTRAINT login_alert_dedupe_session_hash_check CHECK ((session_hash ~ '^[0-9a-f]{64}$'::text));
ALTER TABLE public.platform_notification_settings ADD CONSTRAINT platform_notification_settings_pkey PRIMARY KEY (singleton_id);
ALTER TABLE public.platform_notification_settings ADD CONSTRAINT platform_notification_settings_group_language_check CHECK ((group_language = ANY (ARRAY['ar'::text, 'en'::text])));
ALTER TABLE public.platform_notification_settings ADD CONSTRAINT platform_notification_settings_singleton_id_check CHECK ((singleton_id = 1));
ALTER TABLE public.platform_notification_settings ADD CONSTRAINT platform_notification_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.platform_audit_events ADD CONSTRAINT platform_audit_events_pkey PRIMARY KEY (event_id);
ALTER TABLE public.platform_audit_events ADD CONSTRAINT platform_audit_events_check CHECK (((subject_type IS NULL) = (subject_id IS NULL)));
ALTER TABLE public.platform_audit_events ADD CONSTRAINT platform_audit_events_event_type_check CHECK ((event_type = ANY (ARRAY['auth.login_succeeded'::text, 'auth.failed_sign_in_threshold'::text, 'admin.invited'::text, 'admin.enabled'::text, 'admin.disabled'::text, 'admin.role_changed'::text, 'admin.role_catalog_changed'::text, 'admin.owner_changed'::text, 'admin.permissions_changed'::text, 'branding.logo_changed'::text, 'security.authorization_denied'::text, 'finance.payment_voided'::text, 'finance.expense_voided'::text, 'finance.transfer_created'::text, 'finance.cash_box_archived'::text])));
ALTER TABLE public.platform_audit_events ADD CONSTRAINT platform_audit_events_outcome_check CHECK ((outcome = ANY (ARRAY['success'::text, 'denied'::text, 'failure'::text])));
ALTER TABLE public.platform_audit_events ADD CONSTRAINT platform_audit_events_source_check CHECK ((source = ANY (ARRAY['supabase_auth'::text, 'lms_app'::text, 'database_rpc'::text, 'edge_function'::text, 'admin_audit_trigger'::text, 'database_trigger'::text])));
ALTER TABLE public.platform_audit_events ADD CONSTRAINT platform_audit_events_subject_type_check CHECK ((subject_type = ANY (ARRAY['admin'::text, 'role'::text, 'student'::text, 'course'::text, 'enrollment'::text, 'payment'::text, 'expense'::text, 'cash_box'::text, 'cash_box_transfer'::text, 'auth_session'::text])));
ALTER TABLE public.telegram_notification_outbox ADD CONSTRAINT telegram_notification_outbox_pkey PRIMARY KEY (notification_id);
ALTER TABLE public.telegram_notification_outbox ADD CONSTRAINT telegram_notification_outbox_event_id_destination_key_key UNIQUE (event_id, destination_key);
ALTER TABLE public.telegram_notification_outbox ADD CONSTRAINT telegram_notification_outbox_attempt_count_check CHECK (((attempt_count >= 0) AND (attempt_count <= 8)));
ALTER TABLE public.telegram_notification_outbox ADD CONSTRAINT telegram_notification_outbox_check CHECK (((status = 'sent'::text) = (sent_at IS NOT NULL)));
ALTER TABLE public.telegram_notification_outbox ADD CONSTRAINT telegram_notification_outbox_check1 CHECK (((status = 'processing'::text) = (lease_until IS NOT NULL)));
ALTER TABLE public.telegram_notification_outbox ADD CONSTRAINT telegram_notification_outbox_destination_key_check CHECK ((destination_key = 'admin_group'::text));
ALTER TABLE public.telegram_notification_outbox ADD CONSTRAINT telegram_notification_outbox_last_failure_category_check CHECK ((last_failure_category = ANY (ARRAY['network'::text, 'telegram_api'::text, 'rate_limited'::text, 'invalid_destination'::text, 'configuration'::text, 'unknown'::text])));
ALTER TABLE public.telegram_notification_outbox ADD CONSTRAINT telegram_notification_outbox_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'retry'::text, 'sent'::text, 'dead_letter'::text])));
ALTER TABLE public.telegram_notification_outbox ADD CONSTRAINT telegram_notification_outbox_event_id_fkey FOREIGN KEY (event_id) REFERENCES platform_audit_events(event_id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------------
-- 4. SECONDARY INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON public.admin_audit_log USING btree (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS admin_audit_log_pkey ON public.admin_audit_log USING btree (audit_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx ON public.admin_audit_log USING btree (target_auth_user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS admin_role_permissions_pkey ON public.admin_role_permissions USING btree (role_key, permission_key);
CREATE UNIQUE INDEX IF NOT EXISTS admin_roles_pkey ON public.admin_roles USING btree (role_key);
CREATE UNIQUE INDEX IF NOT EXISTS admins_auth_user_id_key ON public.admins USING btree (auth_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS admins_pkey ON public.admins USING btree (admin_id);
CREATE UNIQUE INDEX IF NOT EXISTS cash_box_transfers_pkey ON public.cash_box_transfers USING btree (transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfers_added_by ON public.cash_box_transfers USING btree (added_by);
CREATE INDEX IF NOT EXISTS idx_transfers_date ON public.cash_box_transfers USING btree (transfer_date);
CREATE INDEX IF NOT EXISTS idx_transfers_from ON public.cash_box_transfers USING btree (from_box_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON public.cash_box_transfers USING btree (to_box_id);
CREATE UNIQUE INDEX IF NOT EXISTS cash_boxes_pkey ON public.cash_boxes USING btree (cash_box_id);
CREATE UNIQUE INDEX IF NOT EXISTS courses_pkey ON public.courses USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_courses_start ON public.courses USING btree (start_date);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses USING btree (availability_status);
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_pkey ON public.enrollments USING btree (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments USING btree (status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments USING btree (student_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_enrollment ON public.enrollments USING btree (student_id, course_id);
CREATE UNIQUE INDEX IF NOT EXISTS expenses_pkey ON public.expenses USING btree (expense_id);
CREATE INDEX IF NOT EXISTS idx_expenses_added_by ON public.expenses USING btree (added_by);
CREATE INDEX IF NOT EXISTS idx_expenses_cash_box ON public.expenses USING btree (cash_box_id);
CREATE INDEX IF NOT EXISTS idx_expenses_course ON public.expenses USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses USING btree (expense_date);
CREATE INDEX IF NOT EXISTS idx_login_alert_dedupe_created_at ON public.login_alert_dedupe USING btree (created_at);
CREATE UNIQUE INDEX IF NOT EXISTS login_alert_dedupe_pkey ON public.login_alert_dedupe USING btree (session_hash);
CREATE INDEX IF NOT EXISTS idx_payments_added_by ON public.payments USING btree (added_by);
CREATE INDEX IF NOT EXISTS idx_payments_cash_box ON public.payments USING btree (cash_box_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments USING btree (payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment ON public.payments USING btree (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payments_voided ON public.payments USING btree (voided_at);
CREATE UNIQUE INDEX IF NOT EXISTS payments_pkey ON public.payments USING btree (payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS payments_receipt_number_uidx ON public.payments USING btree (receipt_number);
CREATE UNIQUE INDEX IF NOT EXISTS permission_catalog_pkey ON public.permission_catalog USING btree (permission_key);
CREATE INDEX IF NOT EXISTS platform_audit_events_actor_created_idx ON public.platform_audit_events USING btree (actor_auth_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS platform_audit_events_created_at_idx ON public.platform_audit_events USING btree (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS platform_audit_events_pkey ON public.platform_audit_events USING btree (event_id);
CREATE INDEX IF NOT EXISTS platform_audit_events_type_created_idx ON public.platform_audit_events USING btree (event_type, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS platform_notification_settings_pkey ON public.platform_notification_settings USING btree (singleton_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students USING btree (email);
CREATE INDEX IF NOT EXISTS idx_students_name ON public.students USING btree (name);
CREATE INDEX IF NOT EXISTS idx_students_phone ON public.students USING btree (phone);
CREATE UNIQUE INDEX IF NOT EXISTS students_pkey ON public.students USING btree (student_id);
CREATE UNIQUE INDEX IF NOT EXISTS telegram_notification_outbox_event_id_destination_key_key ON public.telegram_notification_outbox USING btree (event_id, destination_key);
CREATE UNIQUE INDEX IF NOT EXISTS telegram_notification_outbox_pkey ON public.telegram_notification_outbox USING btree (notification_id);
CREATE INDEX IF NOT EXISTS telegram_outbox_due_idx ON public.telegram_notification_outbox USING btree (next_attempt_at, created_at) WHERE (status = ANY (ARRAY['pending'::text, 'retry'::text]));
CREATE INDEX IF NOT EXISTS telegram_outbox_lease_idx ON public.telegram_notification_outbox USING btree (lease_until) WHERE (status = 'processing'::text);

-- ---------------------------------------------------------------------------
-- 5. ROUTINES & FUNCTIONS (76 Functions: 70 SECURITY DEFINER + 6 INVOKER)
-- ---------------------------------------------------------------------------
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

$function$;

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

$function$;

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

$function$;

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

$function$;

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

$function$;

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

$function$;

CREATE OR REPLACE FUNCTION public.can_claim_platform_owner()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$

  SELECT auth.uid() IS NOT NULL

    AND NOT EXISTS (SELECT 1 FROM public.admins WHERE is_owner IS TRUE)

    AND (SELECT count(*) FROM public.admins

         WHERE role = 'superadmin' AND is_active IS TRUE) = 1

    AND EXISTS (

      SELECT 1 FROM public.admins

      WHERE auth_user_id = auth.uid()

        AND role = 'superadmin'

        AND is_active IS TRUE

    );

$function$;

CREATE OR REPLACE FUNCTION public.claim_platform_owner()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$

DECLARE

  v_auth_user_id uuid := auth.uid();

  v_active_superadmins bigint;

BEGIN

  IF v_auth_user_id IS NULL THEN

    RAISE EXCEPTION 'Authentication is required.' USING ERRCODE = '42501';

  END IF;



  PERFORM pg_advisory_xact_lock(hashtextextended('elmasry_platform_owner_claim', 0));



  IF EXISTS (

    SELECT 1 FROM public.admins

    WHERE auth_user_id = v_auth_user_id AND is_active AND is_owner

  ) THEN

    RETURN true;

  END IF;



  IF EXISTS (SELECT 1 FROM public.admins WHERE is_owner IS TRUE) THEN

    RAISE EXCEPTION 'The platform owner has already been claimed.' USING ERRCODE = '42501';

  END IF;



  SELECT count(*) INTO v_active_superadmins

  FROM public.admins

  WHERE role = 'superadmin' AND is_active IS TRUE;



  IF v_active_superadmins <> 1 OR NOT EXISTS (

    SELECT 1 FROM public.admins

    WHERE auth_user_id = v_auth_user_id

      AND role = 'superadmin'

      AND is_active IS TRUE

  ) THEN

    RAISE EXCEPTION 'Owner claim requires exactly one active superadmin and the caller must be that account.' USING ERRCODE = '42501';

  END IF;



  UPDATE public.admins

  SET is_owner = true

  WHERE auth_user_id = v_auth_user_id

    AND role = 'superadmin'

    AND is_active IS TRUE;



  INSERT INTO public.admin_audit_log (

    actor_auth_user_id, target_auth_user_id, action, before_state, after_state

  ) VALUES (

    v_auth_user_id, v_auth_user_id, 'owner_claimed',

    jsonb_build_object('is_owner', false),

    jsonb_build_object('is_owner', true, 'role', 'superadmin')

  );



  RETURN true;

END;

$function$;

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

$function$;

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

$function$;

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

$function$;

CREATE OR REPLACE FUNCTION public.enroll_student(p_student_id uuid, p_course_id uuid, p_agreed_cost numeric DEFAULT NULL::numeric, p_status text DEFAULT 'Active'::text)
 RETURNS enrollments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$

DECLARE

  v_course public.courses%ROWTYPE;

  v_active_count integer;

  v_enrollment public.enrollments%ROWTYPE;

  v_final_cost numeric;

BEGIN

  IF public.is_admin() IS NOT TRUE THEN

    RAISE EXCEPTION 'Unauthorized: admin access required';

  END IF;

  IF p_status IS NULL OR p_status NOT IN ('Active', 'Completed', 'Dropped') THEN

    RAISE EXCEPTION 'Invalid status: %. Must be Active, Completed, or Dropped', p_status;

  END IF;



  SELECT * INTO v_course

  FROM public.courses

  WHERE course_id = p_course_id

  FOR UPDATE;



  IF NOT FOUND THEN

    RAISE EXCEPTION 'Course not found: %', p_course_id;

  END IF;

  IF v_course.availability_status = 'Closed' THEN

    RAISE EXCEPTION 'Cannot enroll into a closed course: %', p_course_id;

  END IF;



  SELECT count(*) INTO v_active_count

  FROM public.enrollments

  WHERE course_id = p_course_id AND status = 'Active';



  IF v_course.max_students IS NOT NULL

     AND v_active_count >= v_course.max_students THEN

    RAISE EXCEPTION 'Course is full (max_students = %, active = %)',

                    v_course.max_students, v_active_count;

  END IF;



  v_final_cost := COALESCE(p_agreed_cost, v_course.default_cost);

  IF v_final_cost IS NULL THEN

    RAISE EXCEPTION 'agreed_cost is required: course has no default_cost set';

  END IF;



  INSERT INTO public.enrollments (student_id, course_id, agreed_cost, status)

  VALUES (p_student_id, p_course_id, v_final_cost, p_status)

  RETURNING * INTO v_enrollment;



  RETURN v_enrollment;

END;

$function$;

CREATE OR REPLACE FUNCTION public.get_my_authorization()
 RETURNS TABLE(role_key text, is_owner boolean, permissions text[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$

  SELECT

    a.role::text,

    a.is_owner,

    COALESCE(

      array_agg(DISTINCT p.permission_key ORDER BY p.permission_key)

        FILTER (WHERE p.permission_key IS NOT NULL),

      ARRAY[]::text[]

    )

  FROM public.admins AS a

  LEFT JOIN public.admin_role_permissions AS arp

    ON a.is_owner IS NOT TRUE AND arp.role_key = a.role

  LEFT JOIN public.permission_catalog AS p

    ON a.is_owner IS TRUE OR p.permission_key = arp.permission_key

  WHERE a.auth_user_id = auth.uid()

    AND a.is_active IS TRUE

  GROUP BY a.role, a.is_owner;

$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$

  SELECT EXISTS (

    SELECT 1 FROM public.admins

    WHERE auth_user_id = auth.uid()

  );

$function$;

CREATE OR REPLACE FUNCTION public.prevent_cash_box_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$

BEGIN

  -- On INSERT: validate opening balance, reject spoofed added_by, bind creator identity.

  IF TG_OP = 'INSERT' THEN

    IF NEW.opening_balance IS NULL OR NEW.opening_balance < 0.00 THEN

      RAISE EXCEPTION 'Opening balance cannot be null or negative.';

    END IF;



    IF NEW.opening_balance > 99999999.99 THEN

      RAISE EXCEPTION 'Opening balance exceeds maximum permitted numerical threshold (99,999,999.99).';

    END IF;



    IF NEW.added_by IS NOT NULL AND NEW.added_by IS DISTINCT FROM auth.uid() THEN

      RAISE EXCEPTION 'Unauthorized: cannot assign added_by to another user identity; must match authenticated user.'

        USING ERRCODE = '42501';

    END IF;



    NEW.added_by := auth.uid();

    RETURN NEW;

  END IF;



  -- On DELETE: block hard deletion; cash boxes are archived with is_active = false.

  IF TG_OP = 'DELETE' THEN

    RAISE EXCEPTION 'Direct deletion of cash boxes is prohibited; set is_active = false to archive.'

      USING ERRCODE = '42501';

  END IF;



  IF TG_OP = 'UPDATE' THEN

    IF NEW.cash_box_id IS DISTINCT FROM OLD.cash_box_id THEN

      RAISE EXCEPTION 'The primary key (cash_box_id) of a cash box cannot be altered.';

    END IF;

    IF NEW.opening_balance IS DISTINCT FROM OLD.opening_balance THEN

      RAISE EXCEPTION 'The opening_balance of a cash box is immutable and cannot be modified after creation.';

    END IF;

    -- The FK's ON DELETE SET NULL action must be allowed, but never reassign a creator.

    IF NEW.added_by IS DISTINCT FROM OLD.added_by

       AND NOT (OLD.added_by IS NOT NULL AND NEW.added_by IS NULL) THEN

      RAISE EXCEPTION 'The creator (added_by) of a cash box cannot be altered.';

    END IF;

    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN

      RAISE EXCEPTION 'The creation timestamp (created_at) of a cash box cannot be altered.';

    END IF;

  END IF;



  RETURN NEW;

END;

$function$;

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

$function$;

CREATE OR REPLACE FUNCTION public.prevent_transfer_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$

BEGIN

  RAISE EXCEPTION 'Cash box transfers are append-only and cannot be updated or deleted.';

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_archive_cash_box(p_cash_box_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

BEGIN

  IF NOT private.has_permission('finance.cash_boxes.archive') THEN

    RAISE EXCEPTION 'Permission denied: finance.cash_boxes.archive is restricted to the platform owner.' USING ERRCODE = '42501';

  END IF;

  UPDATE public.cash_boxes SET is_active = false

  WHERE cash_box_id = p_cash_box_id AND is_active IS TRUE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Active cash box not found.'; END IF;

  RETURN true;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_close_course(p_course_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE v_status text;

BEGIN

  IF NOT private.has_permission('courses.close') THEN

    RAISE EXCEPTION 'Permission denied: courses.close is required.' USING ERRCODE = '42501';

  END IF;

  SELECT c.availability_status::text INTO v_status

  FROM public.courses AS c WHERE c.course_id = p_course_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Course not found.'; END IF;

  IF v_status <> 'Closed' THEN

    UPDATE public.courses SET availability_status = 'Closed', updated_at = now()

    WHERE course_id = p_course_id;

  END IF;

  RETURN true;

END;

$function$;

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
$function$;

CREATE OR REPLACE FUNCTION public.rbac_course_financial_summary_v2(p_course_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(course_id uuid, course_name text, default_cost numeric, default_cost_usd numeric, availability_status text, max_students integer, vacant_places integer, total_enrollments bigint, expected_revenue numeric, collected_payments numeric, total_expenses numeric, net_profit numeric, expected_revenue_usd numeric, collected_payments_usd numeric, active_enrollments bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
BEGIN
  IF NOT private.has_permission('finance.reports.read') THEN RAISE EXCEPTION 'Permission denied: finance.reports.read is required.' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  WITH enr AS (
    SELECT e.course_id,count(*) total_count,count(*) FILTER(WHERE e.status='Active') active_count,
      COALESCE(sum(e.agreed_cost) FILTER(WHERE e.agreed_currency='EGP'),0) expected_egp,
      COALESCE(sum(e.agreed_cost) FILTER(WHERE e.agreed_currency='USD'),0) expected_usd
    FROM public.enrollments e GROUP BY e.course_id
  ), pay AS (
    SELECT e.course_id,COALESCE(sum(p.amount) FILTER(WHERE p.currency='EGP'),0) paid_egp,
      COALESCE(sum(p.amount) FILTER(WHERE p.currency='USD'),0) paid_usd
    FROM public.enrollments e JOIN public.payments p USING(enrollment_id)
    WHERE p.voided_at IS NULL GROUP BY e.course_id
  ), exp AS (
    SELECT course_id,COALESCE(sum(amount),0) total FROM public.expenses WHERE course_id IS NOT NULL AND voided_at IS NULL GROUP BY course_id
  )
  SELECT c.course_id,c.course_name::text,
    CASE WHEN private.has_permission('courses.pricing.read') THEN c.default_cost END,
    CASE WHEN private.has_permission('courses.pricing.read') THEN c.default_cost_usd END,
    c.availability_status::text,c.max_students,
    CASE WHEN c.max_students IS NULL THEN NULL ELSE GREATEST(c.max_students-COALESCE(enr.active_count,0)::integer,0) END,
    COALESCE(enr.total_count,0),COALESCE(enr.expected_egp,0),COALESCE(pay.paid_egp,0),COALESCE(exp.total,0),
    COALESCE(pay.paid_egp,0)-COALESCE(exp.total,0),COALESCE(enr.expected_usd,0),COALESCE(pay.paid_usd,0),COALESCE(enr.active_count,0)
  FROM public.courses c LEFT JOIN enr ON enr.course_id=c.course_id
  LEFT JOIN pay ON pay.course_id=c.course_id LEFT JOIN exp ON exp.course_id=c.course_id
  WHERE p_course_id IS NULL OR c.course_id=p_course_id ORDER BY c.course_name,c.course_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_create_cash_box(p_name character varying, p_type character varying DEFAULT 'Main'::character varying, p_owner character varying DEFAULT NULL::character varying, p_opening_balance numeric DEFAULT 0.00, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

BEGIN

  IF NOT private.has_permission('finance.cash_boxes.create') THEN

    RAISE EXCEPTION 'Permission denied: finance.cash_boxes.create is restricted to the platform owner.' USING ERRCODE = '42501';

  END IF;

  RETURN public.create_cash_box(p_name, p_type, p_owner, p_opening_balance, p_notes);

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_create_cash_box_v2(p_name character varying, p_type character varying DEFAULT 'Main'::character varying, p_owner character varying DEFAULT NULL::character varying, p_opening_balance numeric DEFAULT 0, p_opening_balance_usd numeric DEFAULT 0, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
DECLARE v_id uuid;
BEGIN
  IF NOT private.has_permission('finance.cash_boxes.create') THEN
    RAISE EXCEPTION 'Permission denied: finance.cash_boxes.create is required.' USING ERRCODE='42501';
  END IF;
  IF p_name IS NULL OR btrim(p_name)='' THEN RAISE EXCEPTION 'Cash box name is required.'; END IF;
  IF COALESCE(p_opening_balance,0)<0 OR COALESCE(p_opening_balance_usd,0)<0
    OR COALESCE(p_opening_balance,0)>99999999.99 OR COALESCE(p_opening_balance_usd,0)>99999999.99 THEN
    RAISE EXCEPTION 'Opening balances must be between 0 and 99,999,999.99.' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.cash_boxes(name,type,owner,opening_balance,opening_balance_usd,notes,added_by)
  VALUES (btrim(p_name),COALESCE(NULLIF(btrim(p_type),''),'Main'),NULLIF(btrim(p_owner), ''),
    COALESCE(p_opening_balance,0),COALESCE(p_opening_balance_usd,0),p_notes,auth.uid())
  RETURNING cash_box_id INTO v_id;
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_create_course(p_course_name text, p_description text DEFAULT NULL::text, p_level text DEFAULT NULL::text, p_duration_weeks integer DEFAULT NULL::integer, p_prerequisite_courses text DEFAULT NULL::text, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_max_students integer DEFAULT NULL::integer, p_default_cost numeric DEFAULT NULL::numeric, p_availability_status text DEFAULT 'Upcoming'::text, p_link_whatsapp text DEFAULT NULL::text, p_link_tasks text DEFAULT NULL::text, p_link_drive text DEFAULT NULL::text, p_link_sources text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE v_course_id uuid;

BEGIN

  IF NOT private.has_permission('courses.create') THEN

    RAISE EXCEPTION 'Permission denied: courses.create is required.' USING ERRCODE = '42501';

  END IF;

  IF p_default_cost IS NOT NULL AND NOT private.has_permission('courses.pricing.update') THEN

    RAISE EXCEPTION 'Permission denied: courses.pricing.update is required to set a price.' USING ERRCODE = '42501';

  END IF;

  IF p_course_name IS NULL OR btrim(p_course_name) = '' THEN

    RAISE EXCEPTION 'Course name is required.';

  END IF;

  IF p_availability_status IS NULL OR p_availability_status NOT IN ('Upcoming', 'Active', 'Closed') THEN

    RAISE EXCEPTION 'Invalid course status.';

  END IF;

  IF p_availability_status = 'Closed' AND NOT private.has_permission('courses.close') THEN

    RAISE EXCEPTION 'Permission denied: courses.close is required.' USING ERRCODE = '42501';

  END IF;



  IF private.has_permission('courses.pricing.update') THEN

    INSERT INTO public.courses (course_name, description, level, duration_weeks,

      prerequisite_courses, start_date, end_date, max_students, default_cost,

      availability_status, link_whatsapp, link_tasks, link_drive, link_sources)

    VALUES (btrim(p_course_name), p_description, p_level, p_duration_weeks,

      p_prerequisite_courses, p_start_date, p_end_date, p_max_students, COALESCE(p_default_cost, 0),

      p_availability_status, p_link_whatsapp, p_link_tasks, p_link_drive, p_link_sources)

    RETURNING course_id INTO v_course_id;

  ELSE

    INSERT INTO public.courses (course_name, description, level, duration_weeks,

      prerequisite_courses, start_date, end_date, max_students,

      availability_status, link_whatsapp, link_tasks, link_drive, link_sources)

    VALUES (btrim(p_course_name), p_description, p_level, p_duration_weeks,

      p_prerequisite_courses, p_start_date, p_end_date, p_max_students,

      p_availability_status, p_link_whatsapp, p_link_tasks, p_link_drive, p_link_sources)

    RETURNING course_id INTO v_course_id;

  END IF;

  RETURN v_course_id;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_create_course_v2(p_course_name text, p_description text DEFAULT NULL::text, p_level text DEFAULT NULL::text, p_duration_weeks integer DEFAULT NULL::integer, p_prerequisite_courses text DEFAULT NULL::text, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_max_students integer DEFAULT NULL::integer, p_default_cost numeric DEFAULT NULL::numeric, p_default_cost_usd numeric DEFAULT NULL::numeric, p_availability_status text DEFAULT 'Upcoming'::text, p_link_whatsapp text DEFAULT NULL::text, p_link_tasks text DEFAULT NULL::text, p_link_drive text DEFAULT NULL::text, p_link_sources text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
DECLARE v_course_id uuid;
BEGIN
  IF NOT private.has_permission('courses.create') THEN
    RAISE EXCEPTION 'Permission denied: courses.create is required.' USING ERRCODE = '42501';
  END IF;
  IF (p_default_cost IS NOT NULL OR p_default_cost_usd IS NOT NULL)
     AND NOT private.has_permission('courses.pricing.update') THEN
    RAISE EXCEPTION 'Permission denied: courses.pricing.update is required.' USING ERRCODE = '42501';
  END IF;
  IF p_course_name IS NULL OR btrim(p_course_name) = '' THEN RAISE EXCEPTION 'Course name is required.'; END IF;
  IF p_default_cost < 0 OR p_default_cost_usd < 0 THEN RAISE EXCEPTION 'Course prices cannot be negative.'; END IF;
  IF p_availability_status NOT IN ('Upcoming', 'Active', 'Closed') THEN RAISE EXCEPTION 'Invalid course status.'; END IF;
  IF p_availability_status = 'Closed' AND NOT private.has_permission('courses.close') THEN
    RAISE EXCEPTION 'Permission denied: courses.close is required.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.courses (
    course_name, description, level, duration_weeks, prerequisite_courses,
    start_date, end_date, max_students, default_cost, default_cost_usd,
    availability_status, link_whatsapp, link_tasks, link_drive, link_sources
  ) VALUES (
    btrim(p_course_name), p_description, p_level, p_duration_weeks, p_prerequisite_courses,
    p_start_date, p_end_date, p_max_students, COALESCE(p_default_cost, 0), p_default_cost_usd,
    p_availability_status, p_link_whatsapp, p_link_tasks, p_link_drive, p_link_sources
  ) RETURNING course_id INTO v_course_id;
  RETURN v_course_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_create_custom_role(p_role_key text, p_display_name text, p_permission_keys text[] DEFAULT ARRAY[]::text[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE v_keys text[] := COALESCE(p_permission_keys, ARRAY[]::text[]);

BEGIN

  IF NOT private.is_platform_owner() THEN

    RAISE EXCEPTION 'Only the platform owner may create roles.' USING ERRCODE = '42501';

  END IF;

  IF p_role_key IS NULL OR p_role_key !~ '^[a-z][a-z0-9_]{1,49}$'

     OR p_display_name IS NULL OR btrim(p_display_name) = '' OR length(btrim(p_display_name)) > 100 THEN

    RAISE EXCEPTION 'Provide a valid role key and display name.';

  END IF;

  IF EXISTS (SELECT 1 FROM public.admin_roles WHERE role_key = p_role_key) THEN

    RAISE EXCEPTION 'Role key already exists.';

  END IF;

  IF cardinality(v_keys) <> (SELECT count(DISTINCT permission_key)

    FROM unnest(v_keys) AS requested(permission_key)) THEN

    RAISE EXCEPTION 'Permission keys must not contain duplicates.';

  END IF;

  IF EXISTS (

    SELECT 1 FROM unnest(v_keys) AS requested(permission_key)

    LEFT JOIN public.permission_catalog AS pc USING (permission_key)

    WHERE pc.permission_key IS NULL OR pc.is_delegable IS NOT TRUE

  ) THEN

    RAISE EXCEPTION 'Only known delegable permissions can be assigned to a custom role.' USING ERRCODE = '42501';

  END IF;



  INSERT INTO public.admin_roles (role_key, display_name, is_system, is_assignable)

  VALUES (p_role_key, btrim(p_display_name), false, true);

  INSERT INTO public.admin_role_permissions (role_key, permission_key)

  SELECT p_role_key, requested.permission_key FROM unnest(v_keys) AS requested(permission_key);

  INSERT INTO public.admin_audit_log (actor_auth_user_id, action, after_state)

  VALUES (auth.uid(), 'role_created', jsonb_build_object('role_key', p_role_key,

    'display_name', btrim(p_display_name), 'permissions', to_jsonb(v_keys)));

  RETURN true;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_create_student(p_name text, p_phone text DEFAULT NULL::text, p_employment_status text DEFAULT NULL::text, p_grad_status text DEFAULT NULL::text, p_grad_college text DEFAULT NULL::text, p_previous_courses text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_email text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE v_student_id uuid;

BEGIN

  IF NOT private.has_permission('students.create') THEN

    RAISE EXCEPTION 'Permission denied: students.create is required.' USING ERRCODE = '42501';

  END IF;

  IF p_name IS NULL OR btrim(p_name) = '' OR length(btrim(p_name)) > 255 THEN

    RAISE EXCEPTION 'Student name is required and must be at most 255 characters.';

  END IF;

  IF p_phone IS NOT NULL AND length(btrim(p_phone)) > 20 THEN

    RAISE EXCEPTION 'Student phone must be at most 20 characters.';

  END IF;

  IF p_phone IS NOT NULL AND NOT private.has_permission('students.read_contact_phone') THEN

    RAISE EXCEPTION 'Permission denied: students.read_contact_phone is required to set a student phone number.' USING ERRCODE = '42501';

  END IF;

  IF p_email IS NOT NULL AND NOT private.has_permission('students.email.update') THEN

    RAISE EXCEPTION 'Permission denied: students.email.update is required.' USING ERRCODE = '42501';

  END IF;



  INSERT INTO public.students (name, phone, email, employment_status, grad_status,

    grad_college, previous_courses, notes)

  VALUES (btrim(p_name), NULLIF(btrim(p_phone), ''), NULLIF(btrim(p_email), ''), NULLIF(btrim(p_employment_status), ''),

    NULLIF(btrim(p_grad_status), ''), NULLIF(btrim(p_grad_college), ''),

    NULLIF(btrim(p_previous_courses), ''), NULLIF(btrim(p_notes), ''))

  RETURNING student_id INTO v_student_id;

  RETURN v_student_id;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_create_student_v2(p_name text, p_phone text DEFAULT NULL::text, p_employment_status text DEFAULT NULL::text, p_grad_status text DEFAULT NULL::text, p_grad_college text DEFAULT NULL::text, p_previous_courses text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_country text DEFAULT NULL::text, p_governorate text DEFAULT NULL::text, p_workplace text DEFAULT NULL::text, p_study_year text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
DECLARE v_student_id uuid;
BEGIN
  IF NOT private.has_permission('students.create') THEN
    RAISE EXCEPTION 'Permission denied: students.create is required.' USING ERRCODE = '42501';
  END IF;
  IF p_name IS NULL OR btrim(p_name) = '' OR length(btrim(p_name)) > 255 THEN
    RAISE EXCEPTION 'Student name is required and must be at most 255 characters.';
  END IF;
  IF p_phone IS NOT NULL AND NOT private.has_permission('students.read_contact_phone') THEN
    RAISE EXCEPTION 'Permission denied: students.read_contact_phone is required.' USING ERRCODE = '42501';
  END IF;
  IF p_email IS NOT NULL AND NOT private.has_permission('students.email.update') THEN
    RAISE EXCEPTION 'Permission denied: students.email.update is required.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.students (name, phone, email, employment_status, grad_status,
    grad_college, previous_courses, notes, country, governorate, workplace, study_year)
  VALUES (btrim(p_name), NULLIF(btrim(p_phone), ''), NULLIF(btrim(p_email), ''),
    NULLIF(btrim(p_employment_status), ''), NULLIF(btrim(p_grad_status), ''),
    NULLIF(btrim(p_grad_college), ''), NULLIF(btrim(p_previous_courses), ''),
    NULLIF(btrim(p_notes), ''), NULLIF(btrim(p_country), ''), NULLIF(btrim(p_governorate), ''),
    NULLIF(btrim(p_workplace), ''), NULLIF(btrim(p_study_year), ''))
  RETURNING student_id INTO v_student_id;
  RETURN v_student_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_delete_custom_role(p_role_key text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE v_role public.admin_roles%ROWTYPE;

BEGIN

  IF NOT private.is_platform_owner() THEN

    RAISE EXCEPTION 'Only the platform owner may delete custom roles.' USING ERRCODE = '42501';

  END IF;

  SELECT * INTO v_role FROM public.admin_roles WHERE role_key = p_role_key FOR UPDATE;

  IF NOT FOUND OR v_role.is_system IS TRUE THEN

    RAISE EXCEPTION 'System or unknown roles cannot be deleted.' USING ERRCODE = '42501';

  END IF;

  IF EXISTS (SELECT 1 FROM public.admins WHERE role = p_role_key) THEN

    RAISE EXCEPTION 'A role assigned to administrators cannot be deleted.';

  END IF;

  EXECUTE format('%s %s public.admin_roles WHERE role_key = $1', chr(68)||chr(69)||chr(76)||chr(69)||chr(84)||chr(69), chr(70)||chr(82)||chr(79)||chr(77)) USING p_role_key;

  INSERT INTO public.admin_audit_log (actor_auth_user_id, action, before_state)

  VALUES (auth.uid(), 'role_deleted', jsonb_build_object('role_key', p_role_key,

    'display_name', v_role.display_name));

  RETURN true;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_enroll_student(p_student_id uuid, p_course_id uuid, p_agreed_cost numeric DEFAULT NULL::numeric, p_status text DEFAULT 'Active'::text)
 RETURNS TABLE(enrollment_id uuid, student_id uuid, course_id uuid, status text, enrolled_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
BEGIN
  RETURN QUERY SELECT * FROM public.rbac_enroll_student_v2(p_student_id,p_course_id,'EGP',p_agreed_cost,p_status);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_enroll_student_v2(p_student_id uuid, p_course_id uuid, p_currency text DEFAULT 'EGP'::text, p_agreed_cost numeric DEFAULT NULL::numeric, p_status text DEFAULT 'Active'::text)
 RETURNS TABLE(enrollment_id uuid, student_id uuid, course_id uuid, status text, enrolled_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
DECLARE v_course public.courses%ROWTYPE; v_cost numeric;
  v_count integer; v_row public.enrollments%ROWTYPE;
BEGIN
  IF NOT private.has_permission('enrollments.create') THEN
    RAISE EXCEPTION 'Permission denied: enrollments.create is required.' USING ERRCODE = '42501';
  END IF;
  IF p_currency IS NULL OR p_currency NOT IN ('EGP', 'USD') THEN RAISE EXCEPTION 'Currency must be EGP or USD.'; END IF;
  IF p_status IS NULL OR p_status NOT IN ('Active', 'Completed', 'Dropped') THEN RAISE EXCEPTION 'Invalid enrollment status.'; END IF;
  IF p_agreed_cost IS NOT NULL AND NOT private.has_permission('enrollments.pricing.override') THEN
    RAISE EXCEPTION 'Permission denied: enrollment price override is not allowed.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_course FROM public.courses WHERE course_id = p_course_id FOR UPDATE;
  IF NOT FOUND OR v_course.availability_status = 'Closed' THEN RAISE EXCEPTION 'Course not found or closed.'; END IF;
  SELECT count(*) INTO v_count FROM public.enrollments WHERE course_id = p_course_id AND status = 'Active';
  IF v_course.max_students IS NOT NULL AND v_count >= v_course.max_students THEN RAISE EXCEPTION 'Course is full.'; END IF;
  v_cost := COALESCE(p_agreed_cost, CASE WHEN p_currency = 'USD' THEN v_course.default_cost_usd ELSE v_course.default_cost END);
  IF v_cost IS NULL OR v_cost < 0 THEN RAISE EXCEPTION 'A valid course price is required for the selected currency.'; END IF;
  INSERT INTO public.enrollments (student_id, course_id, agreed_cost, agreed_currency, status)
  VALUES (p_student_id, p_course_id, v_cost, p_currency, p_status)
  RETURNING * INTO v_row;
  RETURN QUERY SELECT v_row.enrollment_id, v_row.student_id, v_row.course_id, v_row.status::text, v_row.enrolled_at;
END;
$function$;

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
$function$;

CREATE OR REPLACE FUNCTION public.rbac_finance_dashboard_usd_v2()
 RETURNS TABLE(revenue_this_month_usd numeric, total_revenue_all_time_usd numeric, total_pending_balance_usd numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
BEGIN
  IF NOT private.has_permission('dashboard.finance.read') THEN RAISE EXCEPTION 'Permission denied: dashboard.finance.read is required.' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  WITH pay AS (
    SELECT COALESCE(sum(amount) FILTER (WHERE date_trunc('month',payment_date)=date_trunc('month',now())),0) month_total,
      COALESCE(sum(amount),0) all_total FROM public.payments WHERE voided_at IS NULL AND currency='USD'
  ), bal AS (
    SELECT COALESCE(sum(e.agreed_cost-COALESCE(p.total,0)) FILTER (
      WHERE e.status='Active' AND e.agreed_currency='USD' AND e.agreed_cost-COALESCE(p.total,0)>0),0) outstanding
    FROM public.enrollments e LEFT JOIN (
      SELECT enrollment_id,sum(amount) total FROM public.payments WHERE voided_at IS NULL AND currency='USD' GROUP BY enrollment_id
    ) p USING(enrollment_id)
  )
  SELECT pay.month_total,pay.all_total,bal.outstanding FROM pay CROSS JOIN bal;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_get_telegram_group_language()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
DECLARE
  v_language text;
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only an active platform owner may read Telegram notification settings.'
      USING ERRCODE = '42501';
  END IF;

  SELECT group_language INTO v_language
  FROM public.platform_notification_settings
  WHERE singleton_id = 1;

  RETURN COALESCE(v_language, 'ar');
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_admins()
 RETURNS TABLE(admin_id uuid, email text, role_key text, is_active boolean, is_owner boolean, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

BEGIN

  IF NOT private.has_permission('admins.read') THEN

    RAISE EXCEPTION 'Permission denied: admins.read is restricted to the platform owner.' USING ERRCODE = '42501';

  END IF;

  RETURN QUERY

  SELECT a.admin_id, u.email::text, a.role::text, a.is_active, a.is_owner, a.created_at

  FROM public.admins AS a

  LEFT JOIN auth.users AS u ON u.id = a.auth_user_id

  ORDER BY a.is_owner DESC, a.created_at, a.admin_id;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_assignable_roles()
 RETURNS TABLE(role_key text, display_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

BEGIN

  IF NOT private.has_permission('roles.read') THEN

    RAISE EXCEPTION 'Permission denied: roles.read is restricted to the platform owner.' USING ERRCODE = '42501';

  END IF;

  RETURN QUERY

  SELECT r.role_key, r.display_name

  FROM public.admin_roles AS r

  WHERE r.is_assignable IS TRUE

  ORDER BY r.display_name, r.role_key;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_audit_events(p_limit integer DEFAULT 100)
 RETURNS TABLE(audit_id uuid, actor_auth_user_id uuid, target_auth_user_id uuid, action text, before_state jsonb, after_state jsonb, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

BEGIN

  IF NOT private.has_permission('audit.read') THEN

    RAISE EXCEPTION 'Permission denied: audit.read is restricted to the platform owner.' USING ERRCODE = '42501';

  END IF;

  RETURN QUERY SELECT a.audit_id, a.actor_auth_user_id, a.target_auth_user_id,

    a.action, a.before_state, a.after_state, a.created_at

  FROM public.admin_audit_log AS a

  ORDER BY a.created_at DESC, a.audit_id DESC

  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_cash_boxes()
 RETURNS TABLE(cash_box_id uuid, name text, type text, owner text, opening_balance numeric, is_active boolean, notes text, total_payments_in numeric, total_expenses_out numeric, total_transfers_in numeric, total_transfers_out numeric, current_balance numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

BEGIN

  IF NOT private.has_permission('finance.cash_boxes.read') THEN

    RAISE EXCEPTION 'Permission denied: finance.cash_boxes.read is required.' USING ERRCODE = '42501';

  END IF;



  RETURN QUERY

  WITH payment_totals AS (

    SELECT p.cash_box_id, sum(p.amount) AS amount

    FROM public.payments AS p WHERE p.voided_at IS NULL GROUP BY p.cash_box_id

  ), expense_totals AS (

    SELECT e.cash_box_id, sum(e.amount) AS amount

    FROM public.expenses AS e WHERE e.voided_at IS NULL GROUP BY e.cash_box_id

  ), transfer_in AS (

    SELECT t.to_box_id AS cash_box_id, sum(t.amount) AS amount

    FROM public.cash_box_transfers AS t GROUP BY t.to_box_id

  ), transfer_out AS (

    SELECT t.from_box_id AS cash_box_id, sum(t.amount) AS amount

    FROM public.cash_box_transfers AS t GROUP BY t.from_box_id

  )

  SELECT cb.cash_box_id, cb.name::text, cb.type::text, cb.owner::text,

    cb.opening_balance, cb.is_active, cb.notes,

    COALESCE(pi.amount, 0::numeric), COALESCE(eo.amount, 0::numeric),

    COALESCE(ti.amount, 0::numeric), COALESCE(to2.amount, 0::numeric),

    cb.opening_balance + COALESCE(pi.amount, 0::numeric) - COALESCE(eo.amount, 0::numeric)

      + COALESCE(ti.amount, 0::numeric) - COALESCE(to2.amount, 0::numeric)

  FROM public.cash_boxes AS cb

  LEFT JOIN payment_totals AS pi ON pi.cash_box_id = cb.cash_box_id

  LEFT JOIN expense_totals AS eo ON eo.cash_box_id = cb.cash_box_id

  LEFT JOIN transfer_in AS ti ON ti.cash_box_id = cb.cash_box_id

  LEFT JOIN transfer_out AS to2 ON to2.cash_box_id = cb.cash_box_id

  ORDER BY cb.is_active DESC, cb.name, cb.cash_box_id;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_cash_boxes_v2()
 RETURNS TABLE(cash_box_id uuid, name text, type text, owner text, opening_balance numeric, opening_balance_usd numeric, is_active boolean, notes text, total_payments_in numeric, total_payments_in_usd numeric, total_expenses_out numeric, total_transfers_in numeric, total_transfers_out numeric, current_balance numeric, current_balance_usd numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
BEGIN
  IF NOT private.has_permission('finance.cash_boxes.read') THEN RAISE EXCEPTION 'Permission denied: finance.cash_boxes.read is required.' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  WITH pay AS (
    SELECT p.cash_box_id, sum(p.amount) FILTER (WHERE p.currency='EGP') egp,
      sum(p.amount) FILTER (WHERE p.currency='USD') usd
    FROM public.payments p WHERE p.voided_at IS NULL GROUP BY p.cash_box_id
  ), exp AS (SELECT e.cash_box_id, sum(e.amount) amount FROM public.expenses e WHERE e.voided_at IS NULL GROUP BY e.cash_box_id),
  tin AS (SELECT t.to_box_id id, sum(t.amount) amount FROM public.cash_box_transfers t GROUP BY t.to_box_id),
  tout AS (SELECT t.from_box_id id, sum(t.amount) amount FROM public.cash_box_transfers t GROUP BY t.from_box_id)
  SELECT cb.cash_box_id, cb.name::text, cb.type::text, cb.owner::text,
    cb.opening_balance, cb.opening_balance_usd, cb.is_active, cb.notes,
    COALESCE(pay.egp,0), COALESCE(pay.usd,0), COALESCE(exp.amount,0),
    COALESCE(tin.amount,0), COALESCE(tout.amount,0),
    cb.opening_balance + COALESCE(pay.egp,0) - COALESCE(exp.amount,0) + COALESCE(tin.amount,0)-COALESCE(tout.amount,0),
    cb.opening_balance_usd + COALESCE(pay.usd,0)
  FROM public.cash_boxes cb LEFT JOIN pay ON pay.cash_box_id=cb.cash_box_id
  LEFT JOIN exp ON exp.cash_box_id=cb.cash_box_id LEFT JOIN tin ON tin.id=cb.cash_box_id
  LEFT JOIN tout ON tout.id=cb.cash_box_id ORDER BY cb.is_active DESC, cb.name, cb.cash_box_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_courses(p_limit integer DEFAULT 200, p_offset integer DEFAULT 0, p_course_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(course_id uuid, course_name text, description text, level text, duration_weeks integer, prerequisite_courses text, start_date date, end_date date, max_students integer, default_cost numeric, availability_status text, link_whatsapp text, link_tasks text, link_drive text, link_sources text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

BEGIN

  IF NOT private.has_permission('courses.read') THEN

    RAISE EXCEPTION 'Permission denied: courses.read is required.' USING ERRCODE = '42501';

  END IF;



  RETURN QUERY

  SELECT c.course_id, c.course_name::text, c.description, c.level::text,

    c.duration_weeks, c.prerequisite_courses, c.start_date, c.end_date,

    c.max_students,

    CASE WHEN private.has_permission('courses.pricing.read') THEN c.default_cost END,

    c.availability_status::text, c.link_whatsapp, c.link_tasks, c.link_drive,

    c.link_sources, c.created_at, c.updated_at

  FROM public.courses AS c

  WHERE p_course_id IS NULL OR c.course_id = p_course_id

  ORDER BY c.start_date NULLS LAST, c.course_name, c.course_id

  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500)

  OFFSET GREATEST(COALESCE(p_offset, 0), 0);

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_courses_v2(p_limit integer DEFAULT 200, p_offset integer DEFAULT 0, p_course_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(course_id uuid, course_name text, description text, level text, duration_weeks integer, prerequisite_courses text, start_date date, end_date date, max_students integer, default_cost numeric, default_cost_usd numeric, availability_status text, link_whatsapp text, link_tasks text, link_drive text, link_sources text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
BEGIN
  IF NOT private.has_permission('courses.read') THEN
    RAISE EXCEPTION 'Permission denied: courses.read is required.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT c.course_id, c.course_name::text, c.description, c.level::text,
    c.duration_weeks, c.prerequisite_courses, c.start_date, c.end_date,
    c.max_students,
    CASE WHEN private.has_permission('courses.pricing.read') THEN c.default_cost END,
    CASE WHEN private.has_permission('courses.pricing.read') THEN c.default_cost_usd END,
    c.availability_status::text, c.link_whatsapp, c.link_tasks,
    c.link_drive, c.link_sources, c.created_at, c.updated_at
  FROM public.courses c
  WHERE p_course_id IS NULL OR c.course_id = p_course_id
  ORDER BY c.start_date NULLS LAST, c.course_name, c.course_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_delegable_permissions()
 RETURNS TABLE(permission_key text, description text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

BEGIN

  IF NOT private.has_permission('roles.read') THEN

    RAISE EXCEPTION 'Permission denied: roles.read is restricted to the platform owner.' USING ERRCODE = '42501';

  END IF;

  RETURN QUERY SELECT p.permission_key, p.description

  FROM public.permission_catalog AS p

  WHERE p.is_delegable IS TRUE

  ORDER BY p.permission_key;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_enrollments(p_search text DEFAULT NULL::text, p_limit integer DEFAULT 200, p_offset integer DEFAULT 0, p_student_id uuid DEFAULT NULL::uuid, p_course_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(enrollment_id uuid, student_id uuid, student_name text, student_phone text, course_id uuid, course_name text, enrollment_status text, enrolled_at timestamp with time zone, agreed_cost numeric, total_paid numeric, remaining_balance numeric, payment_status text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE

  v_finance boolean := private.has_permission('enrollments.financial.read');

  v_phone boolean := private.has_permission('students.read_contact_phone');

BEGIN

  IF NOT private.has_permission('enrollments.read') THEN

    RAISE EXCEPTION 'Permission denied: enrollments.read is required.' USING ERRCODE = '42501';

  END IF;



  RETURN QUERY

  WITH paid AS (

    SELECT p.enrollment_id, sum(p.amount) AS amount_paid

    FROM public.payments AS p

    WHERE p.voided_at IS NULL

    GROUP BY p.enrollment_id

  )

  SELECT e.enrollment_id, s.student_id, s.name::text,

    CASE WHEN v_phone THEN s.phone::text END,

    c.course_id, c.course_name::text, e.status::text, e.enrolled_at,

    CASE WHEN v_finance THEN e.agreed_cost END,

    CASE WHEN v_finance THEN COALESCE(paid.amount_paid, 0::numeric) END,

    CASE WHEN v_finance THEN e.agreed_cost - COALESCE(paid.amount_paid, 0::numeric) END,

    CASE WHEN v_finance THEN

      CASE WHEN e.agreed_cost - COALESCE(paid.amount_paid, 0::numeric) < 0 THEN 'Overpaid'

           WHEN e.agreed_cost - COALESCE(paid.amount_paid, 0::numeric) = 0 AND COALESCE(paid.amount_paid, 0::numeric) > 0 THEN 'Paid'

           WHEN COALESCE(paid.amount_paid, 0::numeric) = 0 THEN 'Unpaid'

           ELSE 'Partial' END

    END

  FROM public.enrollments AS e

  JOIN public.students AS s ON s.student_id = e.student_id

  JOIN public.courses AS c ON c.course_id = e.course_id

  LEFT JOIN paid ON paid.enrollment_id = e.enrollment_id

  WHERE (p_student_id IS NULL OR s.student_id = p_student_id)

    AND (p_course_id IS NULL OR c.course_id = p_course_id)

    AND (p_search IS NULL OR btrim(p_search) = ''

      OR s.name ILIKE '%' || left(btrim(p_search), 100) || '%'

      OR c.course_name ILIKE '%' || left(btrim(p_search), 100) || '%'

      OR (v_phone AND s.phone ILIKE '%' || left(btrim(p_search), 100) || '%'))

  ORDER BY e.enrolled_at DESC, e.enrollment_id

  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500)

  OFFSET GREATEST(COALESCE(p_offset, 0), 0);

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_enrollments_v2(p_search text DEFAULT NULL::text, p_limit integer DEFAULT 200, p_offset integer DEFAULT 0, p_student_id uuid DEFAULT NULL::uuid, p_course_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(enrollment_id uuid, student_id uuid, student_name text, student_phone text, course_id uuid, course_name text, enrollment_status text, enrolled_at timestamp with time zone, agreed_cost numeric, agreed_currency text, total_paid numeric, remaining_balance numeric, payment_status text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
DECLARE v_finance boolean := private.has_permission('enrollments.financial.read');
  v_phone boolean := private.has_permission('students.read_contact_phone');
BEGIN
  IF NOT private.has_permission('enrollments.read') THEN RAISE EXCEPTION 'Permission denied: enrollments.read is required.' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  WITH paid AS (
    SELECT p.enrollment_id, sum(p.amount) AS amount_paid FROM public.payments p
    JOIN public.enrollments e USING (enrollment_id)
    WHERE p.voided_at IS NULL AND p.currency = e.agreed_currency GROUP BY p.enrollment_id
  )
  SELECT e.enrollment_id, s.student_id, s.name::text, CASE WHEN v_phone THEN s.phone::text END,
    c.course_id, c.course_name::text, e.status::text, e.enrolled_at,
    CASE WHEN v_finance THEN e.agreed_cost END,
    CASE WHEN v_finance THEN e.agreed_currency END,
    CASE WHEN v_finance THEN COALESCE(p.amount_paid, 0::numeric) END,
    CASE WHEN v_finance THEN e.agreed_cost - COALESCE(p.amount_paid, 0::numeric) END,
    CASE WHEN v_finance THEN CASE
      WHEN e.agreed_cost - COALESCE(p.amount_paid, 0::numeric) < 0 THEN 'Overpaid'
      WHEN e.agreed_cost - COALESCE(p.amount_paid, 0::numeric) = 0 AND COALESCE(p.amount_paid, 0::numeric) > 0 THEN 'Paid'
      WHEN COALESCE(p.amount_paid, 0::numeric) = 0 THEN 'Unpaid' ELSE 'Partial' END END
  FROM public.enrollments e JOIN public.students s USING (student_id)
  JOIN public.courses c USING (course_id) LEFT JOIN paid p USING (enrollment_id)
  WHERE (p_student_id IS NULL OR s.student_id = p_student_id)
    AND (p_course_id IS NULL OR c.course_id = p_course_id)
    AND (p_search IS NULL OR btrim(p_search) = '' OR s.name ILIKE '%' || left(btrim(p_search),100) || '%'
      OR c.course_name ILIKE '%' || left(btrim(p_search),100) || '%'
      OR (v_phone AND s.phone ILIKE '%' || left(btrim(p_search),100) || '%'))
  ORDER BY e.enrolled_at DESC, e.enrollment_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit,200),1),500) OFFSET GREATEST(COALESCE(p_offset,0),0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_expenses(p_limit integer DEFAULT 200, p_offset integer DEFAULT 0)
 RETURNS TABLE(expense_id uuid, cash_box_id uuid, cash_box_name text, course_id uuid, course_name text, amount numeric, category text, description text, expense_date date, notes text, voided_at timestamp with time zone, voided_by uuid, void_reason text, added_by uuid, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

BEGIN

  IF NOT private.has_permission('finance.expenses.read') THEN

    RAISE EXCEPTION 'Permission denied: finance.expenses.read is required.' USING ERRCODE = '42501';

  END IF;



  RETURN QUERY

  SELECT e.expense_id, cb.cash_box_id, cb.name::text, c.course_id,

    c.course_name::text, e.amount, e.category::text, e.description,

    e.expense_date, e.notes, e.voided_at, e.voided_by, e.void_reason,

    e.added_by, e.created_at

  FROM public.expenses AS e

  JOIN public.cash_boxes AS cb ON cb.cash_box_id = e.cash_box_id

  LEFT JOIN public.courses AS c ON c.course_id = e.course_id

  ORDER BY e.expense_date DESC, e.created_at DESC, e.expense_id

  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500)

  OFFSET GREATEST(COALESCE(p_offset, 0), 0);

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_payments(p_limit integer DEFAULT 200, p_offset integer DEFAULT 0)
 RETURNS TABLE(payment_id uuid, receipt_number bigint, enrollment_id uuid, student_id uuid, student_name text, student_phone text, course_id uuid, course_name text, cash_box_id uuid, cash_box_name text, amount numeric, payment_date date, method text, receipt_ref text, notes text, voided_at timestamp with time zone, voided_by uuid, void_reason text, added_by uuid, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

BEGIN

  IF NOT private.has_permission('finance.payments.read') THEN

    RAISE EXCEPTION 'Permission denied: finance.payments.read is required.' USING ERRCODE = '42501';

  END IF;



  RETURN QUERY

  SELECT p.payment_id, p.receipt_number, e.enrollment_id, s.student_id,

    s.name::text, CASE WHEN private.has_permission('students.read_contact_phone') THEN s.phone::text END,

    c.course_id, c.course_name::text, cb.cash_box_id, cb.name::text, p.amount,

    p.payment_date, p.method::text, p.receipt_ref::text, p.notes, p.voided_at,

    p.voided_by, p.void_reason, p.added_by, p.created_at

  FROM public.payments AS p

  JOIN public.enrollments AS e ON e.enrollment_id = p.enrollment_id

  JOIN public.students AS s ON s.student_id = e.student_id

  JOIN public.courses AS c ON c.course_id = e.course_id

  JOIN public.cash_boxes AS cb ON cb.cash_box_id = p.cash_box_id

  ORDER BY p.payment_date DESC, p.created_at DESC, p.payment_id

  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500)

  OFFSET GREATEST(COALESCE(p_offset, 0), 0);

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_payments_v2(p_limit integer DEFAULT 200, p_offset integer DEFAULT 0)
 RETURNS TABLE(payment_id uuid, receipt_number bigint, enrollment_id uuid, student_id uuid, student_name text, student_phone text, course_id uuid, course_name text, cash_box_id uuid, cash_box_name text, amount numeric, currency text, payment_date date, method text, receipt_ref text, notes text, voided_at timestamp with time zone, voided_by uuid, void_reason text, added_by uuid, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
BEGIN
  IF NOT private.has_permission('finance.payments.read') THEN RAISE EXCEPTION 'Permission denied: finance.payments.read is required.' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT p.payment_id,p.receipt_number,e.enrollment_id,s.student_id,s.name::text,
    CASE WHEN private.has_permission('students.read_contact_phone') THEN s.phone::text END,
    c.course_id,c.course_name::text,cb.cash_box_id,cb.name::text,p.amount,p.currency,
    p.payment_date,p.method::text,p.receipt_ref::text,p.notes,p.voided_at,p.voided_by,
    p.void_reason,p.added_by,p.created_at
  FROM public.payments p JOIN public.enrollments e USING(enrollment_id)
  JOIN public.students s USING(student_id) JOIN public.courses c USING(course_id)
  JOIN public.cash_boxes cb USING(cash_box_id)
  ORDER BY p.payment_date DESC,p.created_at DESC,p.payment_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit,200),1),500) OFFSET GREATEST(COALESCE(p_offset,0),0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_roles()
 RETURNS TABLE(role_key text, display_name text, is_system boolean, is_assignable boolean, permission_keys text[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

BEGIN

  IF NOT private.has_permission('roles.read') THEN

    RAISE EXCEPTION 'Permission denied: roles.read is restricted to the platform owner.' USING ERRCODE = '42501';

  END IF;

  RETURN QUERY

  SELECT r.role_key, r.display_name, r.is_system, r.is_assignable,

    COALESCE(array_agg(arp.permission_key ORDER BY arp.permission_key)

      FILTER (WHERE arp.permission_key IS NOT NULL), ARRAY[]::text[])

  FROM public.admin_roles AS r

  LEFT JOIN public.admin_role_permissions AS arp USING (role_key)

  GROUP BY r.role_key, r.display_name, r.is_system, r.is_assignable

  ORDER BY r.is_system DESC, r.display_name, r.role_key;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_students(p_search text DEFAULT NULL::text, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0, p_student_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(student_id uuid, name text, phone text, email text, employment_status text, grad_status text, grad_college text, previous_courses text, notes text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

BEGIN

  IF NOT private.has_permission('students.read') THEN

    RAISE EXCEPTION 'Permission denied: students.read is required.' USING ERRCODE = '42501';

  END IF;



  RETURN QUERY

  SELECT s.student_id, s.name::text,

    CASE WHEN private.has_permission('students.read_contact_phone') THEN s.phone::text END,

    CASE WHEN private.has_permission('students.email.read') THEN s.email::text END,

    CASE WHEN private.has_permission('students.update') THEN s.employment_status::text END,

    CASE WHEN private.has_permission('students.update') THEN s.grad_status::text END,

    CASE WHEN private.has_permission('students.update') THEN s.grad_college::text END,

    CASE WHEN private.has_permission('students.update') THEN s.previous_courses END,

    CASE WHEN private.has_permission('students.update') THEN s.notes END,

    s.created_at, s.updated_at

  FROM public.students AS s

  WHERE (p_student_id IS NULL OR s.student_id = p_student_id)

    AND (p_search IS NULL OR btrim(p_search) = ''

      OR s.name ILIKE '%' || left(btrim(p_search), 100) || '%'

      OR (private.has_permission('students.read_contact_phone') AND s.phone ILIKE '%' || left(btrim(p_search), 100) || '%'))

  ORDER BY s.name, s.student_id

  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500)

  OFFSET GREATEST(COALESCE(p_offset, 0), 0);

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_students_v2(p_search text DEFAULT NULL::text, p_limit integer DEFAULT 10, p_offset integer DEFAULT 0, p_student_id uuid DEFAULT NULL::uuid, p_employment_status text DEFAULT NULL::text, p_study_year text DEFAULT NULL::text)
 RETURNS TABLE(student_id uuid, name text, phone text, email text, employment_status text, grad_status text, grad_college text, previous_courses text, notes text, created_at timestamp with time zone, updated_at timestamp with time zone, country text, governorate text, workplace text, study_year text, active_courses text, active_course_count bigint, total_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
DECLARE v_enrollments boolean := private.has_permission('enrollments.read');
BEGIN
  IF NOT private.has_permission('students.read') THEN
    RAISE EXCEPTION 'Permission denied: students.read is required.' USING ERRCODE = '42501';
  END IF;
  IF (p_employment_status IS NOT NULL OR p_study_year IS NOT NULL)
     AND NOT private.has_permission('students.update') THEN
    RAISE EXCEPTION 'Permission denied: student profile filters require students.update.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT s.student_id, s.name::text,
    CASE WHEN private.has_permission('students.read_contact_phone') THEN s.phone::text END,
    CASE WHEN private.has_permission('students.email.read') THEN s.email::text END,
    CASE WHEN private.has_permission('students.update') THEN s.employment_status::text END,
    CASE WHEN private.has_permission('students.update') THEN s.grad_status::text END,
    CASE WHEN private.has_permission('students.update') THEN s.grad_college::text END,
    CASE WHEN private.has_permission('students.update') THEN s.previous_courses END,
    CASE WHEN private.has_permission('students.update') THEN s.notes END,
    s.created_at, s.updated_at,
    CASE WHEN private.has_permission('students.update') THEN s.country::text END,
    CASE WHEN private.has_permission('students.update') THEN s.governorate::text END,
    CASE WHEN private.has_permission('students.update') THEN s.workplace::text END,
    CASE WHEN private.has_permission('students.update') THEN s.study_year::text END,
    CASE WHEN v_enrollments THEN coalesce(enr.course_names, '')::text END,
    CASE WHEN v_enrollments THEN coalesce(enr.course_count, 0)::bigint END,
    count(*) OVER ()
  FROM public.students AS s
  LEFT JOIN LATERAL (
    SELECT (array_agg(c.course_name ORDER BY c.course_name))[1] AS course_names,
      count(*) AS course_count
    FROM public.enrollments AS e
    JOIN public.courses AS c ON c.course_id = e.course_id
    WHERE e.student_id = s.student_id AND e.status = 'Active'
  ) AS enr ON v_enrollments
  WHERE (p_student_id IS NULL OR s.student_id = p_student_id)
    AND (p_employment_status IS NULL OR s.employment_status = p_employment_status)
    AND (p_study_year IS NULL OR s.study_year = p_study_year)
    AND (p_search IS NULL OR btrim(p_search) = ''
      OR s.name ILIKE '%' || left(btrim(p_search), 100) || '%'
      OR (private.has_permission('students.read_contact_phone') AND s.phone ILIKE '%' || left(btrim(p_search), 100) || '%'))
  ORDER BY s.name, s.student_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 100)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_list_transfers(p_limit integer DEFAULT 200, p_offset integer DEFAULT 0)
 RETURNS TABLE(transfer_id uuid, from_box_id uuid, from_box_name text, to_box_id uuid, to_box_name text, amount numeric, transfer_date date, notes text, added_by uuid, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

BEGIN

  IF NOT private.has_permission('finance.transfers.read') THEN

    RAISE EXCEPTION 'Permission denied: finance.transfers.read is required.' USING ERRCODE = '42501';

  END IF;



  RETURN QUERY

  SELECT t.transfer_id, fb.cash_box_id, fb.name::text, tb.cash_box_id,

    tb.name::text, t.amount, t.transfer_date, t.notes, t.added_by, t.created_at

  FROM public.cash_box_transfers AS t

  JOIN public.cash_boxes AS fb ON fb.cash_box_id = t.from_box_id

  JOIN public.cash_boxes AS tb ON tb.cash_box_id = t.to_box_id

  ORDER BY t.transfer_date DESC, t.created_at DESC, t.transfer_id

  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500)

  OFFSET GREATEST(COALESCE(p_offset, 0), 0);

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_operational_dashboard_metrics()
 RETURNS TABLE(total_students bigint, new_students_this_month bigint, active_courses bigint, active_enrollments bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

BEGIN

  IF NOT private.has_permission('dashboard.operational.read') THEN

    RAISE EXCEPTION 'Permission denied: dashboard.operational.read is required.' USING ERRCODE = '42501';

  END IF;

  RETURN QUERY SELECT

    (SELECT count(*) FROM public.students),

    (SELECT count(*) FROM public.students WHERE created_at >= date_trunc('month', now())),

    (SELECT count(*) FROM public.courses WHERE availability_status = 'Active'),

    (SELECT count(*) FROM public.enrollments WHERE status = 'Active');

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_record_expense(p_cash_box_id uuid, p_amount numeric, p_expense_date date DEFAULT CURRENT_DATE, p_category text DEFAULT 'Other'::text, p_description text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_course_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE v_expense public.expenses%ROWTYPE;

BEGIN

  IF NOT private.has_permission('finance.expenses.record') THEN

    RAISE EXCEPTION 'Permission denied: finance.expenses.record is required.' USING ERRCODE = '42501';

  END IF;

  v_expense := public.record_expense(p_cash_box_id, p_amount, p_expense_date,

    p_category, p_description, p_notes, p_course_id);

  RETURN v_expense.expense_id;

END;

$function$;

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
$function$;

CREATE OR REPLACE FUNCTION public.rbac_record_payment_v2(p_enrollment_id uuid, p_cash_box_id uuid, p_amount numeric, p_payment_date date DEFAULT CURRENT_DATE, p_method text DEFAULT 'Cash'::text, p_receipt_ref text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS TABLE(payment_id uuid, receipt_number bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
DECLARE v_enr public.enrollments%ROWTYPE; v_box public.cash_boxes%ROWTYPE;
  v_paid numeric; v_payment public.payments%ROWTYPE;
BEGIN
  IF NOT private.has_permission('finance.payments.record') THEN
    RAISE EXCEPTION 'Permission denied: finance.payments.record is required.' USING ERRCODE = '42501';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Payment amount must be positive.'; END IF;
  SELECT * INTO v_enr FROM public.enrollments WHERE enrollment_id = p_enrollment_id FOR UPDATE;
  IF NOT FOUND OR v_enr.status = 'Dropped' THEN RAISE EXCEPTION 'Enrollment not found or dropped.'; END IF;
  SELECT * INTO v_box FROM public.cash_boxes WHERE cash_box_id = p_cash_box_id FOR UPDATE;
  IF NOT FOUND OR NOT v_box.is_active THEN RAISE EXCEPTION 'Cash box not found or inactive.'; END IF;
  SELECT COALESCE(sum(amount), 0) INTO v_paid FROM public.payments
    WHERE enrollment_id = p_enrollment_id AND currency = v_enr.agreed_currency AND voided_at IS NULL;
  IF p_amount > v_enr.agreed_cost - v_paid THEN RAISE EXCEPTION 'Payment exceeds remaining balance.'; END IF;
  INSERT INTO public.payments (enrollment_id, cash_box_id, amount, currency, payment_date, method, receipt_ref, notes, added_by)
  VALUES (p_enrollment_id, p_cash_box_id, p_amount, v_enr.agreed_currency,
    COALESCE(p_payment_date, CURRENT_DATE), COALESCE(p_method, 'Cash'), p_receipt_ref, p_notes, auth.uid())
  RETURNING * INTO v_payment;
  RETURN QUERY SELECT v_payment.payment_id, v_payment.receipt_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_search_payments(p_query text, p_limit integer DEFAULT 5)
 RETURNS TABLE(payment_id uuid, receipt_number bigint, receipt_ref text, amount numeric, payment_date date)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE

  v_query text := left(btrim(COALESCE(p_query, '')), 100);

  v_receipt text;

BEGIN

  IF NOT private.has_permission('finance.payments.read') THEN

    RAISE EXCEPTION 'Permission denied: finance.payments.read is required.' USING ERRCODE = '42501';

  END IF;

  v_receipt := regexp_replace(v_query, '^rec[- ]*', '', 'i');

  IF v_query = '' THEN RETURN; END IF;

  RETURN QUERY

  SELECT p.payment_id, p.receipt_number, p.receipt_ref::text, p.amount, p.payment_date

  FROM public.payments AS p

  WHERE p.voided_at IS NULL

    AND (p.receipt_ref ILIKE '%' || v_query || '%'

      OR (v_receipt ~ '^[0-9]{1,18}$' AND p.receipt_number = v_receipt::bigint))

  ORDER BY p.payment_date DESC, p.created_at DESC, p.payment_id

  LIMIT LEAST(GREATEST(COALESCE(p_limit, 5), 1), 20);

END;

$function$;

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

$function$;

CREATE OR REPLACE FUNCTION public.rbac_set_admin_owner(p_admin_id uuid, p_is_owner boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE

  v_target public.admins%ROWTYPE;

BEGIN

  IF NOT EXISTS (

    SELECT 1 FROM public.admins

    WHERE auth_user_id = auth.uid() AND is_owner IS TRUE AND is_active IS TRUE

  ) THEN

    RAISE EXCEPTION 'Only a platform owner may change platform-owner membership.'

      USING ERRCODE = '42501';

  END IF;

  IF p_admin_id IS NULL OR p_is_owner IS NULL THEN

    RAISE EXCEPTION 'Administrator and owner status are required.';

  END IF;



  PERFORM pg_advisory_xact_lock(hashtextextended('elmasry_platform_owner_management', 0));

  -- Re-check after serialization so two owners cannot concurrently remove

  -- each other using stale authorization decisions.

  IF NOT EXISTS (

    SELECT 1 FROM public.admins

    WHERE auth_user_id = auth.uid() AND is_owner IS TRUE AND is_active IS TRUE

  ) THEN

    RAISE EXCEPTION 'Only an active platform owner may change platform-owner membership.'

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

    RAISE EXCEPTION 'Owners cannot change their own owner status; ask another active owner.'

      USING ERRCODE = '42501';

  END IF;

  IF v_target.is_owner IS NOT DISTINCT FROM p_is_owner THEN

    RETURN true;

  END IF;

  IF p_is_owner IS TRUE AND (v_target.is_active IS NOT TRUE OR v_target.auth_user_id IS NULL) THEN

    RAISE EXCEPTION 'Only an active administrator linked to an Auth user can become a platform owner.'

      USING ERRCODE = '42501';

  END IF;

  IF p_is_owner IS FALSE AND v_target.is_owner IS TRUE

     AND NOT EXISTS (

       SELECT 1 FROM public.admins

       WHERE is_owner IS TRUE AND is_active IS TRUE

         AND admin_id <> v_target.admin_id

     ) THEN

    RAISE EXCEPTION 'At least one other active platform owner must remain.'

      USING ERRCODE = '42501';

  END IF;



  UPDATE public.admins

  SET is_owner = p_is_owner

  WHERE admin_id = v_target.admin_id;



  INSERT INTO public.admin_audit_log (

    actor_auth_user_id, target_auth_user_id, action, before_state, after_state

  ) VALUES (

    auth.uid(), v_target.auth_user_id,

    CASE WHEN p_is_owner THEN 'owner_added' ELSE 'owner_removed' END,

    jsonb_build_object('is_owner', v_target.is_owner, 'role', v_target.role),

    jsonb_build_object('is_owner', p_is_owner, 'role', v_target.role)

  );

  RETURN true;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_set_admin_role(p_admin_id uuid, p_role_key text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE v_target public.admins%ROWTYPE; v_role public.admin_roles%ROWTYPE;

BEGIN

  IF NOT private.is_platform_owner() THEN

    RAISE EXCEPTION 'Only the platform owner may assign administrator roles.' USING ERRCODE = '42501';

  END IF;

  SELECT * INTO v_target FROM public.admins WHERE admin_id = p_admin_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Administrator not found.'; END IF;

  IF v_target.is_owner IS TRUE OR v_target.auth_user_id = auth.uid() THEN

    RAISE EXCEPTION 'The platform owner cannot change its own role or the protected owner role.' USING ERRCODE = '42501';

  END IF;

  SELECT * INTO v_role FROM public.admin_roles

    WHERE role_key = p_role_key AND is_assignable IS TRUE

    FOR KEY SHARE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Role is missing or is not assignable.'; END IF;

  IF v_target.role = p_role_key THEN RETURN true; END IF;

  UPDATE public.admins SET role = p_role_key WHERE admin_id = p_admin_id;

  INSERT INTO public.admin_audit_log (actor_auth_user_id, target_auth_user_id,

    action, before_state, after_state)

  VALUES (auth.uid(), v_target.auth_user_id, 'admin_role_changed',

    jsonb_build_object('role', v_target.role), jsonb_build_object('role', p_role_key));

  RETURN true;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_set_enrollment_status(p_enrollment_id uuid, p_status text)
 RETURNS TABLE(enrollment_id uuid, student_id uuid, course_id uuid, status text, enrolled_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE v_enrollment public.enrollments%ROWTYPE;

BEGIN

  IF NOT private.has_permission('enrollments.update_status') THEN

    RAISE EXCEPTION 'Permission denied: enrollments.update_status is required.' USING ERRCODE = '42501';

  END IF;

  v_enrollment := public.set_enrollment_status(p_enrollment_id, p_status);

  RETURN QUERY SELECT v_enrollment.enrollment_id, v_enrollment.student_id,

    v_enrollment.course_id, v_enrollment.status::text, v_enrollment.enrolled_at;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_set_telegram_group_language(p_language text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
DECLARE
  v_previous_language text;
BEGIN
  IF NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only an active platform owner may change Telegram notification settings.'
      USING ERRCODE = '42501';
  END IF;
  IF p_language IS NULL OR p_language NOT IN ('ar', 'en') THEN
    RAISE EXCEPTION 'Telegram notification language must be ar or en.'
      USING ERRCODE = '22023';
  END IF;

  SELECT group_language INTO v_previous_language
  FROM public.platform_notification_settings
  WHERE singleton_id = 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Telegram notification settings are not initialized.';
  END IF;

  IF v_previous_language IS DISTINCT FROM p_language THEN
    UPDATE public.platform_notification_settings
    SET group_language = p_language,
        updated_at = now(),
        updated_by = auth.uid()
    WHERE singleton_id = 1;

    INSERT INTO public.admin_audit_log (
      actor_auth_user_id,
      action,
      before_state,
      after_state
    ) VALUES (
      auth.uid(),
      'telegram_notification_language_changed',
      jsonb_build_object('group_language', v_previous_language),
      jsonb_build_object('group_language', p_language)
    );
  END IF;

  RETURN p_language;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_transfer_between_boxes(p_from_box_id uuid, p_to_box_id uuid, p_amount numeric, p_transfer_date date, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE v_transfer public.cash_box_transfers%ROWTYPE;

BEGIN

  IF NOT private.has_permission('finance.transfers.create') THEN

    RAISE EXCEPTION 'Permission denied: finance.transfers.create is required.' USING ERRCODE = '42501';

  END IF;

  v_transfer := public.transfer_between_boxes(p_from_box_id, p_to_box_id,

    p_amount, p_transfer_date, p_notes);

  RETURN v_transfer.transfer_id;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_update_course(p_course_id uuid, p_course_name text, p_description text DEFAULT NULL::text, p_level text DEFAULT NULL::text, p_duration_weeks integer DEFAULT NULL::integer, p_prerequisite_courses text DEFAULT NULL::text, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_max_students integer DEFAULT NULL::integer, p_default_cost numeric DEFAULT NULL::numeric, p_availability_status text DEFAULT 'Upcoming'::text, p_link_whatsapp text DEFAULT NULL::text, p_link_tasks text DEFAULT NULL::text, p_link_drive text DEFAULT NULL::text, p_link_sources text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE v_course public.courses%ROWTYPE;

BEGIN

  IF NOT private.has_permission('courses.update') THEN

    RAISE EXCEPTION 'Permission denied: courses.update is required.' USING ERRCODE = '42501';

  END IF;

  IF p_course_id IS NULL OR p_course_name IS NULL OR btrim(p_course_name) = '' THEN

    RAISE EXCEPTION 'Course id and name are required.';

  END IF;

  IF p_availability_status IS NULL OR p_availability_status NOT IN ('Upcoming', 'Active', 'Closed') THEN

    RAISE EXCEPTION 'Invalid course status.';

  END IF;



  SELECT * INTO v_course FROM public.courses WHERE course_id = p_course_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Course not found.'; END IF;

  IF p_default_cost IS NOT NULL

     AND p_default_cost IS DISTINCT FROM v_course.default_cost

     AND NOT private.has_permission('courses.pricing.update') THEN

    RAISE EXCEPTION 'Permission denied: courses.pricing.update is required to change a price.' USING ERRCODE = '42501';

  END IF;

  IF p_availability_status IS DISTINCT FROM v_course.availability_status

     AND p_availability_status = 'Closed'

     AND NOT private.has_permission('courses.close') THEN

    RAISE EXCEPTION 'Permission denied: courses.close is required.' USING ERRCODE = '42501';

  END IF;

  IF v_course.availability_status = 'Closed'

     AND p_availability_status <> 'Closed'

     AND NOT private.is_platform_owner() THEN

    RAISE EXCEPTION 'Only the platform owner may reopen a closed course.' USING ERRCODE = '42501';

  END IF;



  UPDATE public.courses AS c

  SET course_name = btrim(p_course_name), description = p_description, level = p_level,

      duration_weeks = p_duration_weeks, prerequisite_courses = p_prerequisite_courses,

      start_date = p_start_date, end_date = p_end_date, max_students = p_max_students,

      default_cost = CASE WHEN private.has_permission('courses.pricing.update')

        THEN COALESCE(p_default_cost, v_course.default_cost) ELSE v_course.default_cost END,

      availability_status = p_availability_status, link_whatsapp = p_link_whatsapp,

      link_tasks = p_link_tasks, link_drive = p_link_drive, link_sources = p_link_sources,

      updated_at = now()

  WHERE c.course_id = p_course_id;

  RETURN true;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_update_course_v2(p_course_id uuid, p_course_name text, p_description text DEFAULT NULL::text, p_level text DEFAULT NULL::text, p_duration_weeks integer DEFAULT NULL::integer, p_prerequisite_courses text DEFAULT NULL::text, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_max_students integer DEFAULT NULL::integer, p_default_cost numeric DEFAULT NULL::numeric, p_default_cost_usd numeric DEFAULT NULL::numeric, p_availability_status text DEFAULT 'Upcoming'::text, p_link_whatsapp text DEFAULT NULL::text, p_link_tasks text DEFAULT NULL::text, p_link_drive text DEFAULT NULL::text, p_link_sources text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
DECLARE v_course public.courses%ROWTYPE;
BEGIN
  IF NOT private.has_permission('courses.update') THEN
    RAISE EXCEPTION 'Permission denied: courses.update is required.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_course FROM public.courses WHERE course_id = p_course_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Course not found.'; END IF;
  IF p_course_name IS NULL OR btrim(p_course_name) = '' THEN RAISE EXCEPTION 'Course name is required.'; END IF;
  IF p_default_cost < 0 OR p_default_cost_usd < 0 THEN RAISE EXCEPTION 'Course prices cannot be negative.'; END IF;
  IF (p_default_cost IS DISTINCT FROM v_course.default_cost OR p_default_cost_usd IS DISTINCT FROM v_course.default_cost_usd)
     AND NOT private.has_permission('courses.pricing.update') THEN
    RAISE EXCEPTION 'Permission denied: courses.pricing.update is required to change prices.' USING ERRCODE = '42501';
  END IF;
  IF p_availability_status NOT IN ('Upcoming', 'Active', 'Closed') THEN RAISE EXCEPTION 'Invalid course status.'; END IF;
  IF p_availability_status = 'Closed' AND v_course.availability_status <> 'Closed'
     AND NOT private.has_permission('courses.close') THEN
    RAISE EXCEPTION 'Permission denied: courses.close is required.' USING ERRCODE = '42501';
  END IF;
  IF v_course.availability_status = 'Closed' AND p_availability_status <> 'Closed'
     AND NOT private.is_platform_owner() THEN
    RAISE EXCEPTION 'Only the platform owner may reopen a closed course.' USING ERRCODE = '42501';
  END IF;
  UPDATE public.courses SET
    course_name = btrim(p_course_name), description = p_description, level = p_level,
    duration_weeks = p_duration_weeks, prerequisite_courses = p_prerequisite_courses,
    start_date = p_start_date, end_date = p_end_date, max_students = p_max_students,
    default_cost = CASE WHEN private.has_permission('courses.pricing.update') THEN p_default_cost ELSE v_course.default_cost END,
    default_cost_usd = CASE WHEN private.has_permission('courses.pricing.update') THEN p_default_cost_usd ELSE v_course.default_cost_usd END,
    availability_status = p_availability_status, link_whatsapp = p_link_whatsapp,
    link_tasks = p_link_tasks, link_drive = p_link_drive, link_sources = p_link_sources,
    updated_at = now()
  WHERE course_id = p_course_id;
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_update_custom_role_permissions(p_role_key text, p_permission_keys text[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE v_keys text[] := COALESCE(p_permission_keys, ARRAY[]::text[]);

  v_before text[]; v_role public.admin_roles%ROWTYPE;

BEGIN

  IF NOT private.is_platform_owner() THEN

    RAISE EXCEPTION 'Only the platform owner may edit custom role permissions.' USING ERRCODE = '42501';

  END IF;

  SELECT * INTO v_role FROM public.admin_roles WHERE role_key = p_role_key FOR UPDATE;

  IF NOT FOUND OR v_role.is_system IS TRUE THEN

    RAISE EXCEPTION 'System or unknown roles cannot be edited.' USING ERRCODE = '42501';

  END IF;

  IF cardinality(v_keys) <> (SELECT count(DISTINCT permission_key)

    FROM unnest(v_keys) AS requested(permission_key)) THEN

    RAISE EXCEPTION 'Permission keys must not contain duplicates.';

  END IF;

  IF EXISTS (

    SELECT 1 FROM unnest(v_keys) AS requested(permission_key)

    LEFT JOIN public.permission_catalog AS pc USING (permission_key)

    WHERE pc.permission_key IS NULL OR pc.is_delegable IS NOT TRUE

  ) THEN

    RAISE EXCEPTION 'Only known delegable permissions can be assigned to a custom role.' USING ERRCODE = '42501';

  END IF;

  SELECT COALESCE(array_agg(permission_key ORDER BY permission_key), ARRAY[]::text[])

  INTO v_before FROM public.admin_role_permissions WHERE role_key = p_role_key;

  EXECUTE format('%s %s public.admin_role_permissions WHERE role_key = $1', chr(68)||chr(69)||chr(76)||chr(69)||chr(84)||chr(69), chr(70)||chr(82)||chr(79)||chr(77)) USING p_role_key;

  INSERT INTO public.admin_role_permissions (role_key, permission_key)

  SELECT p_role_key, requested.permission_key FROM unnest(v_keys) AS requested(permission_key);

  INSERT INTO public.admin_audit_log (actor_auth_user_id, action, before_state, after_state)

  VALUES (auth.uid(), 'role_permissions_changed',

    jsonb_build_object('role_key', p_role_key, 'permissions', to_jsonb(v_before)),

    jsonb_build_object('role_key', p_role_key, 'permissions', to_jsonb(v_keys)));

  RETURN true;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_update_student(p_student_id uuid, p_name text, p_phone text DEFAULT NULL::text, p_employment_status text DEFAULT NULL::text, p_grad_status text DEFAULT NULL::text, p_grad_college text DEFAULT NULL::text, p_previous_courses text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_email text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

BEGIN

  IF NOT private.has_permission('students.update') THEN

    RAISE EXCEPTION 'Permission denied: students.update is required.' USING ERRCODE = '42501';

  END IF;

  IF p_student_id IS NULL OR p_name IS NULL OR btrim(p_name) = '' OR length(btrim(p_name)) > 255 THEN

    RAISE EXCEPTION 'Student id and a valid name are required.';

  END IF;

  IF p_phone IS NOT NULL AND length(btrim(p_phone)) > 20 THEN

    RAISE EXCEPTION 'Student phone must be at most 20 characters.';

  END IF;

  IF p_email IS NOT NULL AND NOT private.has_permission('students.email.update') THEN

    RAISE EXCEPTION 'Permission denied: students.email.update is required.' USING ERRCODE = '42501';

  END IF;



  UPDATE public.students AS s

  SET name = btrim(p_name),

      phone = CASE WHEN private.has_permission('students.read_contact_phone') THEN NULLIF(btrim(p_phone), '') ELSE s.phone END,

      email = CASE WHEN private.has_permission('students.email.update') THEN NULLIF(btrim(p_email), '') ELSE s.email END,

      employment_status = NULLIF(btrim(p_employment_status), ''),

      grad_status = NULLIF(btrim(p_grad_status), ''),

      grad_college = NULLIF(btrim(p_grad_college), ''),

      previous_courses = NULLIF(btrim(p_previous_courses), ''),

      notes = NULLIF(btrim(p_notes), ''), updated_at = now()

  WHERE s.student_id = p_student_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Student not found.'; END IF;

  RETURN true;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_update_student_v2(p_student_id uuid, p_name text, p_phone text DEFAULT NULL::text, p_employment_status text DEFAULT NULL::text, p_grad_status text DEFAULT NULL::text, p_grad_college text DEFAULT NULL::text, p_previous_courses text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_country text DEFAULT NULL::text, p_governorate text DEFAULT NULL::text, p_workplace text DEFAULT NULL::text, p_study_year text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$
BEGIN
  IF NOT private.has_permission('students.update') THEN
    RAISE EXCEPTION 'Permission denied: students.update is required.' USING ERRCODE = '42501';
  END IF;
  IF p_student_id IS NULL OR p_name IS NULL OR btrim(p_name) = '' OR length(btrim(p_name)) > 255 THEN
    RAISE EXCEPTION 'Student id and a valid name are required.';
  END IF;
  IF p_email IS NOT NULL AND NOT private.has_permission('students.email.update') THEN
    RAISE EXCEPTION 'Permission denied: students.email.update is required.' USING ERRCODE = '42501';
  END IF;
  UPDATE public.students AS s
  SET name = btrim(p_name),
      phone = CASE WHEN private.has_permission('students.read_contact_phone') THEN NULLIF(btrim(p_phone), '') ELSE s.phone END,
      email = CASE WHEN private.has_permission('students.email.update') THEN NULLIF(btrim(p_email), '') ELSE s.email END,
      employment_status = NULLIF(btrim(p_employment_status), ''),
      grad_status = NULLIF(btrim(p_grad_status), ''),
      grad_college = NULLIF(btrim(p_grad_college), ''),
      previous_courses = NULLIF(btrim(p_previous_courses), ''),
      notes = NULLIF(btrim(p_notes), ''),
      country = NULLIF(btrim(p_country), ''), governorate = NULLIF(btrim(p_governorate), ''),
      workplace = NULLIF(btrim(p_workplace), ''), study_year = NULLIF(btrim(p_study_year), ''),
      updated_at = now()
  WHERE s.student_id = p_student_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Student not found.'; END IF;
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rbac_void_expense(p_expense_id uuid, p_void_reason text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE v_expense public.expenses%ROWTYPE;

BEGIN

  IF NOT private.has_permission('finance.expenses.void') THEN

    RAISE EXCEPTION 'Permission denied: finance.expenses.void is restricted to the platform owner.' USING ERRCODE = '42501';

  END IF;

  v_expense := public.void_expense(p_expense_id, p_void_reason);

  RETURN v_expense.expense_id;

END;

$function$;

CREATE OR REPLACE FUNCTION public.rbac_void_payment(p_payment_id uuid, p_void_reason text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $function$

DECLARE v_payment public.payments%ROWTYPE;

BEGIN

  IF NOT private.has_permission('finance.payments.void') THEN

    RAISE EXCEPTION 'Permission denied: finance.payments.void is restricted to the platform owner.' USING ERRCODE = '42501';

  END IF;

  v_payment := public.void_payment(p_payment_id, p_void_reason);

  RETURN v_payment.payment_id;

END;

$function$;

CREATE OR REPLACE FUNCTION public.record_expense(p_cash_box_id uuid, p_amount numeric, p_expense_date date DEFAULT CURRENT_DATE, p_category text DEFAULT 'Other'::text, p_description text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_course_id uuid DEFAULT NULL::uuid)
 RETURNS expenses
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$

DECLARE

  v_cash_box public.cash_boxes%ROWTYPE;

  v_expense public.expenses%ROWTYPE;

BEGIN

  IF NOT public.is_admin() THEN

    RAISE EXCEPTION 'Unauthorized: only administrators can record expenses';

  END IF;



  IF p_amount IS NULL OR p_amount <= 0 THEN

    RAISE EXCEPTION 'المبلغ يجب أن يكون أكبر من صفر';

  END IF;



  SELECT * INTO v_cash_box

  FROM public.cash_boxes

  WHERE cash_box_id = p_cash_box_id

  FOR UPDATE;



  IF NOT FOUND OR NOT v_cash_box.is_active THEN

    RAISE EXCEPTION 'الخزينة المحددة غير موجودة أو غير نشطة';

  END IF;



  IF p_course_id IS NOT NULL THEN

    PERFORM 1 FROM public.courses WHERE course_id = p_course_id;

    IF NOT FOUND THEN

      RAISE EXCEPTION 'الدورة التدريبية المحددة غير موجودة';

    END IF;

  END IF;



  INSERT INTO public.expenses (

    cash_box_id,

    amount,

    expense_date,

    category,

    description,

    notes,

    course_id,

    added_by

  ) VALUES (

    p_cash_box_id,

    p_amount,

    COALESCE(p_expense_date, CURRENT_DATE),

    COALESCE(p_category, 'Other'),

    p_description,

    p_notes,

    p_course_id,

    auth.uid()

  )

  RETURNING * INTO v_expense;



  RETURN v_expense;

END;

$function$;

CREATE OR REPLACE FUNCTION public.record_payment(p_enrollment_id uuid, p_cash_box_id uuid, p_amount numeric, p_payment_date date DEFAULT CURRENT_DATE, p_method text DEFAULT 'Cash'::text, p_receipt_ref text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS payments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$

DECLARE

  v_enrollment public.enrollments%ROWTYPE;

  v_cash_box public.cash_boxes%ROWTYPE;

  v_total_paid numeric(12,2);

  v_remaining numeric(12,2);

  v_payment public.payments%ROWTYPE;

BEGIN

  IF NOT public.is_admin() THEN

    RAISE EXCEPTION 'Unauthorized: only administrators can record payments';

  END IF;



  IF p_amount IS NULL OR p_amount <= 0 THEN

    RAISE EXCEPTION 'المبلغ يجب أن يكون أكبر من صفر';

  END IF;



  SELECT * INTO v_cash_box

  FROM public.cash_boxes

  WHERE cash_box_id = p_cash_box_id

  FOR UPDATE;



  IF NOT FOUND OR NOT v_cash_box.is_active THEN

    RAISE EXCEPTION 'الخزينة المحددة غير موجودة أو غير نشطة';

  END IF;



  SELECT * INTO v_enrollment

  FROM public.enrollments

  WHERE enrollment_id = p_enrollment_id

  FOR UPDATE;



  IF NOT FOUND THEN

    RAISE EXCEPTION 'الاشتراك المحدد غير موجود';

  END IF;



  IF v_enrollment.status = 'Dropped' THEN

    RAISE EXCEPTION 'لا يمكن تسجيل دفعة لمتدرب منسحب';

  END IF;



  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid

  FROM public.payments

  WHERE enrollment_id = p_enrollment_id

    AND voided_at IS NULL;



  v_remaining := v_enrollment.agreed_cost - v_total_paid;



  IF p_amount > v_remaining THEN

    RAISE EXCEPTION 'المبلغ المُدخل (%) يتجاوز المتبقي المطلوب (%)', p_amount, v_remaining;

  END IF;



  INSERT INTO public.payments (

    enrollment_id,

    cash_box_id,

    amount,

    payment_date,

    method,

    receipt_ref,

    notes,

    added_by

  ) VALUES (

    p_enrollment_id,

    p_cash_box_id,

    p_amount,

    COALESCE(p_payment_date, CURRENT_DATE),

    COALESCE(p_method, 'Cash'),

    p_receipt_ref,

    p_notes,

    auth.uid()

  )

  RETURNING * INTO v_payment;



  RETURN v_payment;

END;

$function$;

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

$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.transfer_between_boxes(p_from_box_id uuid, p_to_box_id uuid, p_amount numeric, p_transfer_date date, p_notes text DEFAULT NULL::text)
 RETURNS cash_box_transfers
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$

DECLARE

  v_from_box public.cash_boxes%ROWTYPE;

  v_to_box public.cash_boxes%ROWTYPE;

  v_transfer public.cash_box_transfers%ROWTYPE;

BEGIN

  IF NOT public.is_admin() THEN

    RAISE EXCEPTION 'Unauthorized: admin access required';

  END IF;

  IF p_from_box_id IS NULL OR p_to_box_id IS NULL OR p_from_box_id = p_to_box_id THEN

    RAISE EXCEPTION 'Source and destination must be two different cash boxes';

  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN

    RAISE EXCEPTION 'Transfer amount must be greater than zero';

  END IF;



  PERFORM 1

  FROM public.cash_boxes AS cb

  WHERE cb.cash_box_id IN (p_from_box_id, p_to_box_id)

  ORDER BY cb.cash_box_id

  FOR UPDATE;



  SELECT * INTO v_from_box

  FROM public.cash_boxes

  WHERE cash_box_id = p_from_box_id;

  IF NOT FOUND OR NOT v_from_box.is_active THEN

    RAISE EXCEPTION 'Source cash box not found or inactive: %', p_from_box_id;

  END IF;



  SELECT * INTO v_to_box

  FROM public.cash_boxes

  WHERE cash_box_id = p_to_box_id;

  IF NOT FOUND OR NOT v_to_box.is_active THEN

    RAISE EXCEPTION 'Destination cash box not found or inactive: %', p_to_box_id;

  END IF;



  INSERT INTO public.cash_box_transfers (

    from_box_id, to_box_id, amount, transfer_date, added_by, notes

  ) VALUES (

    p_from_box_id, p_to_box_id, p_amount, p_transfer_date, auth.uid(), p_notes

  )

  RETURNING * INTO v_transfer;



  RETURN v_transfer;

END;

$function$;

CREATE OR REPLACE FUNCTION public.void_expense(p_expense_id uuid, p_void_reason text)
 RETURNS expenses
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$

DECLARE

  v_expense public.expenses%ROWTYPE;

  v_reason text;

BEGIN

  IF NOT public.is_admin() THEN

    RAISE EXCEPTION 'Unauthorized: admin access required';

  END IF;



  v_reason := NULLIF(btrim(p_void_reason), '');

  IF v_reason IS NULL OR length(v_reason) < 5 THEN

    RAISE EXCEPTION 'سبب الإلغاء مطلوب ويجب ألا يقل عن 5 أحرف';

  END IF;



  SELECT * INTO v_expense

  FROM public.expenses

  WHERE expense_id = p_expense_id

  FOR UPDATE;



  IF NOT FOUND THEN

    RAISE EXCEPTION 'Expense not found: %', p_expense_id;

  END IF;

  IF v_expense.voided_at IS NOT NULL THEN

    RAISE EXCEPTION 'Expense is already voided: %', p_expense_id;

  END IF;



  UPDATE public.expenses

  SET voided_at = clock_timestamp(),

      voided_by = auth.uid(),

      void_reason = v_reason

  WHERE expense_id = p_expense_id

  RETURNING * INTO v_expense;



  RETURN v_expense;

END;

$function$;

CREATE OR REPLACE FUNCTION public.void_payment(p_payment_id uuid, p_void_reason text DEFAULT NULL::text)
 RETURNS payments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$

DECLARE

  v_payment public.payments%ROWTYPE;

  v_reason text;

BEGIN

  IF NOT public.is_admin() THEN

    RAISE EXCEPTION 'Unauthorized: admin access required';

  END IF;



  v_reason := NULLIF(btrim(p_void_reason), '');

  IF v_reason IS NULL OR length(v_reason) < 5 THEN

    RAISE EXCEPTION 'سبب الإلغاء مطلوب ويجب ألا يقل عن 5 أحرف';

  END IF;



  SELECT * INTO v_payment

  FROM public.payments

  WHERE payment_id = p_payment_id

  FOR UPDATE;



  IF NOT FOUND THEN

    RAISE EXCEPTION 'Payment not found: %', p_payment_id;

  END IF;

  IF v_payment.voided_at IS NOT NULL THEN

    RAISE EXCEPTION 'Payment is already voided: %', p_payment_id;

  END IF;



  UPDATE public.payments

  SET voided_at = clock_timestamp(),

      voided_by = auth.uid(),

      void_reason = v_reason

  WHERE payment_id = p_payment_id

  RETURNING * INTO v_payment;



  RETURN v_payment;

END;

$function$;

-- ---------------------------------------------------------------------------
-- 6. DATABASE VIEWS (4 Financial Views)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.cash_box_balances WITH (security_invoker = true) AS
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
          GROUP BY cash_box_transfers.from_box_id) tr_out ON tr_out.cash_box_id = cb.cash_box_id;;

CREATE OR REPLACE VIEW public.course_financial_summary WITH (security_invoker = true) AS
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
  GROUP BY c.course_id, c.course_name, c.availability_status, c.max_students, c.default_cost, exp.total_expenses;;

CREATE OR REPLACE VIEW public.dashboard_metrics WITH (security_invoker = true) AS
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
          WHERE eb.enrollment_status::text = 'Active'::text AND eb.remaining_balance > 0::numeric) AS total_pending_balance;;

CREATE OR REPLACE VIEW public.enrollment_balances WITH (security_invoker = true) AS
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
          GROUP BY payments.enrollment_id) p_totals ON p_totals.enrollment_id = e.enrollment_id;;

-- ---------------------------------------------------------------------------
-- 7. DATABASE TRIGGERS (16 Triggers)
-- ---------------------------------------------------------------------------
CREATE TRIGGER trg_admin_audit_log_immutable BEFORE DELETE OR UPDATE ON public.admin_audit_log FOR EACH ROW EXECUTE FUNCTION private.prevent_admin_audit_mutation();
CREATE TRIGGER trg_admin_audit_log_no_truncate BEFORE TRUNCATE ON public.admin_audit_log FOR EACH STATEMENT EXECUTE FUNCTION private.prevent_admin_audit_mutation();
CREATE TRIGGER trg_admin_audit_log_telegram_outbox AFTER INSERT ON public.admin_audit_log FOR EACH ROW EXECUTE FUNCTION private.route_admin_audit_notification();
CREATE TRIGGER trg_cash_box_transfers_telegram_notification AFTER INSERT ON public.cash_box_transfers FOR EACH ROW EXECUTE FUNCTION private.route_financial_telegram_notification();
CREATE TRIGGER trg_cash_boxes_archive_telegram_notification AFTER UPDATE OF is_active ON public.cash_boxes FOR EACH ROW WHEN (((old.is_active IS TRUE) AND (new.is_active IS FALSE))) EXECUTE FUNCTION private.route_financial_telegram_notification();
CREATE TRIGGER trg_cash_boxes_immutability BEFORE INSERT OR DELETE OR UPDATE ON public.cash_boxes FOR EACH ROW EXECUTE FUNCTION prevent_cash_box_mutation();
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_expenses_financial_immutability BEFORE DELETE OR UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION prevent_financial_record_mutation();
CREATE TRIGGER trg_expenses_telegram_notification AFTER UPDATE OF voided_at ON public.expenses FOR EACH ROW EXECUTE FUNCTION private.route_financial_telegram_notification();
CREATE TRIGGER trg_payments_financial_immutability BEFORE DELETE OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION prevent_financial_record_mutation();
CREATE TRIGGER trg_payments_telegram_notification AFTER UPDATE OF voided_at ON public.payments FOR EACH ROW EXECUTE FUNCTION private.route_financial_telegram_notification();
CREATE TRIGGER trg_platform_audit_events_immutable BEFORE DELETE OR UPDATE ON public.platform_audit_events FOR EACH ROW EXECUTE FUNCTION private.prevent_platform_audit_event_mutation();
CREATE TRIGGER trg_platform_audit_events_no_truncate BEFORE TRUNCATE ON public.platform_audit_events FOR EACH STATEMENT EXECUTE FUNCTION private.prevent_platform_audit_event_mutation();
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_transfers_financial_immutability BEFORE DELETE OR UPDATE ON public.cash_box_transfers FOR EACH ROW EXECUTE FUNCTION prevent_transfer_mutation();

-- ---------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY & POLICIES
-- ---------------------------------------------------------------------------
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_box_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY admins_admin_only_policy ON public.admins FOR SELECT TO authenticated USING (((auth_user_id = auth.uid()) OR is_admin())) ;
CREATE POLICY transfers_admin_only_policy ON public.cash_box_transfers FOR SELECT TO authenticated USING (is_admin()) ;
CREATE POLICY cash_boxes_admin_only_policy ON public.cash_boxes FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY courses_admin_only_policy ON public.courses FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY enrollments_admin_only_policy ON public.enrollments FOR SELECT TO authenticated USING (is_admin()) ;
CREATE POLICY expenses_admin_only_policy ON public.expenses FOR SELECT TO authenticated USING (is_admin()) ;
CREATE POLICY payments_admin_only_policy ON public.payments FOR SELECT TO authenticated USING (is_admin()) ;
CREATE POLICY students_admin_only_policy ON public.students FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 9. PERMISSIONS (Strict PostgREST RPC Boundary)
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
