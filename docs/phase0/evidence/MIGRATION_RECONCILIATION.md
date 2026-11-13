# Migration Reconciliation & Drift Evidence — Elmasry Academy LMS

> **Target Supabase Project:** `urmkcixqpoqkiosihhal` (TrainerPro)  
> **Local Migrations:** 20 files | **Remote Ledger:** 4 files  

## 1. Exact Database Evidence & Classifications

| Version | Filename | Classification | In Ledger? | Exact Database Evidence |
| --- | --- | --- | --- | --- |
| 20261015024100 | 20261015024100_001_create_core_tables.sql | FULLY APPLIED | NO | All 12 core tables (admins, students, courses, etc.) exist with primary keys and constraints. |
| 20261015024134 | 20261015024134_002_create_database_views.sql | FULLY APPLIED | NO | All 4 financial views exist on live DB with security_invoker. |
| 20261015024155 | 20261015024155_003_create_rpc_functions.sql | FULLY APPLIED | NO | All 8 initial RPCs exist in pg_proc. |
| 20261015024209 | 20261015024209_004_fix_constraint_and_seed.sql | FULLY APPLIED | NO | uq_enrollment constraint exists and initial seed roles exist in admin_roles. |
| 202610210005 | 202610210005_production_hardening.sql | FULLY APPLIED | NO | Immutability triggers and check constraints exist on payments/expenses. |
| 202610210006 | 202610210006_security_and_authorization_hardening.sql | FULLY APPLIED | NO | is_admin() exists with search_path=pg_catalog, public. |
| 202610210007 | 202610210007_purge_legacy_rls_and_revoke_public.sql | FULLY APPLIED | NO | has_table_privilege for anon/authenticated is false across all tables. |
| 202610210008 | 202610210008_protect_cash_boxes_opening_balance.sql | FULLY APPLIED | NO | prevent_cash_box_mutation exists on cash_boxes. |
| 20261021171218 | 20261021171218_allow_cash_box_creator_nullification_on_auth_delete.sql | FULLY APPLIED | NO | Function prevent_cash_box_mutation contains the creator nullification check logic. |
| 20261021214608 | 20261021214608_add_login_alert_dedupe.sql | FULLY APPLIED | YES | login_alert_dedupe table exists; registered in schema_migrations. |
| 20261021223822 | 20261021223822_rbac_catalog_and_authorization_primitives.sql | FULLY APPLIED | NO | schema private exists; private.has_permission, is_platform_owner exist. |
| 20261021224440 | 20261021224440_rbac_role_aware_data_endpoints.sql | FULLY APPLIED | NO | rbac_list_* functions exist in pg_proc. |
| 20261021224905 | 20261021224905_rbac_permission_checked_write_endpoints.sql | FULLY APPLIED | NO | rbac_record_payment, rbac_record_expense, etc. exist in pg_proc. |
| 20261022225500 | 20261022225500_rbac_multiple_platform_owners.sql | FULLY APPLIED | NO | admins.is_owner column exists on live DB. |
| 20261022230000 | 20261022230000_rbac_authorization_cutover.sql | FULLY APPLIED | YES | Legacy functions revoked; registered in schema_migrations. |
| 20261023090000 | 20261023090000_branding_and_admin_avatars.sql | DRAFT (NOT APPLIED) | NO | academy_branding table DOES NOT EXIST on DB; file explicitly labeled 'Draft only'. |
| 20261023100000 | 20261023100000_platform_audit_and_telegram_outbox.sql | FULLY APPLIED | NO | platform_audit_events and telegram_notification_outbox tables exist and have live rows. |
| 20261023110000 | 20261023110000_telegram_notification_language.sql | FULLY APPLIED | YES | rbac_set_telegram_group_language exists; registered in schema_migrations. |
| 20261030120000 | 20261030120000_student_profile_directory_v2.sql | FULLY APPLIED | YES | students.country/workplace/study_year columns exist; registered in schema_migrations. |
| 20261030130000 | 20261030130000_course_enrollment_currency_v2.sql | FULLY APPLIED | NO | courses.default_cost_usd, enrollments.agreed_currency, payments.currency, cash_boxes.opening_balance_usd exist; NOT in ledger. |

## 2. Risk & Impact Analysis
- **The Danger of `supabase db push`:** Running `supabase db push` will attempt to apply all 16 unregistered migrations from scratch. It will fail with `relation already exists` errors or corrupt schema state.
- **Recommended Approach:** Use `supabase migration repair --status applied <version>` for the 15 applied-but-unregistered migrations, while excluding `20261023090000_branding_and_admin_avatars.sql` (which remains an unapplied draft).