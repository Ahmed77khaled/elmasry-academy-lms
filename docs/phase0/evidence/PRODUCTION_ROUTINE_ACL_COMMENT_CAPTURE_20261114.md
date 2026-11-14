# Production routine ACL and comment capture — 2026-11-14

**Project:** `urmkcixqpoqkiosihhal` (Production / TrainerPro). **Captured:** `2026-11-14 18:22:16.281752+00` UTC.

Read-only `pg_proc` catalog capture. The exact project ref and active status were checked immediately before this SELECT. No routine was invoked and no application rows were read.

| Schema | Signature | ACL | anon EXECUTE | authenticated EXECUTE | service_role EXECUTE | Comment |
|---|---|---|---:|---:|---:|---|
| private | `private.has_permission(text)` | `{postgres=X/postgres,authenticated=X/postgres}` | false | true | false |  |
| private | `private.is_platform_owner()` | `{postgres=X/postgres,authenticated=X/postgres}` | false | true | false |  |
| private | `private.prevent_admin_audit_mutation()` | `{postgres=X/postgres}` | false | false | false |  |
| private | `private.prevent_platform_audit_event_mutation()` | `{postgres=X/postgres}` | false | false | false |  |
| private | `private.route_admin_audit_notification()` | `{postgres=X/postgres}` | false | false | false |  |
| private | `private.route_financial_telegram_notification()` | `{postgres=X/postgres}` | false | false | false |  |
| public | `can_claim_platform_owner()` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `claim_platform_owner()` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `claim_telegram_notifications(integer,integer)` | `{postgres=X/postgres,service_role=X/postgres}` | false | false | true | Atomically leases due Telegram outbox rows for the service-role dispatcher; uses SKIP LOCKED and caps processing at eight attempts. |
| public | `create_cash_box(character varying,character varying,character varying,numeric,text)` | `{postgres=X/postgres,service_role=X/postgres}` | false | false | true | Audited administrative RPC for creating cash boxes with atomic validation and creator tracking via auth.uid(). |
| public | `enqueue_admin_login_notification(uuid,text)` | `{postgres=X/postgres,service_role=X/postgres}` | false | false | true | Atomically deduplicates a session hash and records a successful LMS administrator login plus its group notification; callable only by service_role. |
| public | `enroll_student(uuid,uuid,numeric,text)` | `{postgres=X/postgres,service_role=X/postgres}` | false | false | true |  |
| public | `get_my_authorization()` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `is_admin()` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `prevent_cash_box_mutation()` | `{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | true | true | true | Guards cash_boxes against deletion, invalid opening balances, creator reassignment, and changes to immutable fields; permits ON DELETE SET NULL for the creator foreign key. |
| public | `prevent_financial_record_mutation()` | `{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | true | true | true |  |
| public | `prevent_transfer_mutation()` | `{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | true | true | true |  |
| public | `rbac_archive_cash_box(uuid)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_close_course(uuid)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_course_financial_summary(uuid)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true | RBAC draft endpoint. Course-level financial metrics require finance.reports.read. |
| public | `rbac_course_financial_summary_v2(uuid)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_create_cash_box(character varying,character varying,character varying,numeric,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_create_cash_box_v2(character varying,character varying,character varying,numeric,numeric,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_create_course(text,text,text,integer,text,date,date,integer,numeric,text,text,text,text,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_create_course_v2(text,text,text,integer,text,date,date,integer,numeric,numeric,text,text,text,text,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_create_custom_role(text,text,text[])` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_create_student(text,text,text,text,text,text,text,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_create_student_v2(text,text,text,text,text,text,text,text,text,text,text,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_delete_custom_role(text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_enroll_student(uuid,uuid,numeric,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_enroll_student_v2(uuid,uuid,text,numeric,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_finance_dashboard_metrics()` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true | RBAC draft endpoint. Financial metrics only; requires dashboard.finance.read. |
| public | `rbac_finance_dashboard_usd_v2()` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_get_telegram_group_language()` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_list_admins()` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_list_assignable_roles()` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_list_audit_events(integer)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_list_cash_boxes()` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true | RBAC draft endpoint. Requires finance.cash_boxes.read; legacy view grants remain until coordinated cutover. |
| public | `rbac_list_cash_boxes_v2()` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_list_courses(integer,integer,uuid)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true | RBAC draft endpoint. Course price is NULL unless courses.pricing.read is granted. Does not replace legacy table grants until coordinated cutover. |
| public | `rbac_list_courses_v2(integer,integer,uuid)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_list_delegable_permissions()` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_list_enrollments(text,integer,integer,uuid,uuid)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true | RBAC draft endpoint. Financial enrollment fields are NULL unless enrollments.financial.read is granted. Does not replace legacy mixed-view grants until coordinated cutover. |
| public | `rbac_list_enrollments_v2(text,integer,integer,uuid,uuid)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_list_expenses(integer,integer)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true | RBAC draft endpoint. Requires finance.expenses.read. |
| public | `rbac_list_payments(integer,integer)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true | RBAC draft endpoint. Requires finance.payments.read. |
| public | `rbac_list_payments_v2(integer,integer)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_list_roles()` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_list_students(text,integer,integer,uuid)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true | RBAC draft endpoint. Explicit student projection; email is owner-only and phone requires students.read_contact_phone. Does not replace legacy table grants until coordinated cutover. |
| public | `rbac_list_students_v2(text,integer,integer,uuid,text,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true | Paginated student directory with permission-filtered profile fields and active course summary. |
| public | `rbac_list_transfers(integer,integer)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true | RBAC draft endpoint. Requires finance.transfers.read. |
| public | `rbac_operational_dashboard_metrics()` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true | RBAC draft endpoint. Operational metrics only; requires dashboard.operational.read. |
| public | `rbac_record_expense(uuid,numeric,date,text,text,text,uuid)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_record_payment(uuid,uuid,numeric,date,text,text,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_record_payment_v2(uuid,uuid,numeric,date,text,text,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_search_payments(text,integer)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_set_admin_active(uuid,boolean)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_set_admin_owner(uuid,boolean)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_set_admin_role(uuid,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_set_enrollment_status(uuid,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_set_telegram_group_language(text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_transfer_between_boxes(uuid,uuid,numeric,date,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_update_course(uuid,text,text,text,integer,text,date,date,integer,numeric,text,text,text,text,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_update_course_v2(uuid,text,text,text,integer,text,date,date,integer,numeric,numeric,text,text,text,text,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_update_custom_role_permissions(text,text[])` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_update_student(uuid,text,text,text,text,text,text,text,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_update_student_v2(uuid,text,text,text,text,text,text,text,text,text,text,text,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_void_expense(uuid,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `rbac_void_payment(uuid,text)` | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | false | true | true |  |
| public | `record_expense(uuid,numeric,date,text,text,text,uuid)` | `{postgres=X/postgres,service_role=X/postgres}` | false | false | true |  |
| public | `record_payment(uuid,uuid,numeric,date,text,text,text)` | `{postgres=X/postgres,service_role=X/postgres}` | false | false | true |  |
| public | `set_enrollment_status(uuid,text)` | `{postgres=X/postgres,service_role=X/postgres}` | false | false | true |  |
| public | `set_updated_at()` | `{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}` | true | true | true |  |
| public | `transfer_between_boxes(uuid,uuid,numeric,date,text)` | `{postgres=X/postgres,service_role=X/postgres}` | false | false | true |  |
| public | `void_expense(uuid,text)` | `{postgres=X/postgres,service_role=X/postgres}` | false | false | true |  |
| public | `void_payment(uuid,text)` | `{postgres=X/postgres,service_role=X/postgres}` | false | false | true |  |

## Limits

This records current ACL/comment state only. It does not establish when a migration statement ran or whether a later migration superseded it. Effective role privileges include privileges inherited from PUBLIC; the ACL column preserves explicit grantees. No Production changes were made.
