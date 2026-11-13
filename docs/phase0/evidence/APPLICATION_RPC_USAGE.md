# Application RPC Usage Evidence — Elmasry Academy LMS

> **Repository:** `D:\Fel7o Gamal Project\LMS_platform-main\LMS_platform-main`  
> **Total RPC Call References Found in `src/`:** 49 references  

## 1. Summary of Application API Calls
- The client code **exclusively uses `supabase.rpc(...)`** for data operations.
- The client calls `v2` endpoints for all major domain flows (`rbac_list_courses_v2`, `rbac_list_enrollments_v2`, `rbac_list_cash_boxes_v2`, `rbac_list_payments_v2`, `rbac_enroll_student_v2`, `rbac_record_payment_v2`, `rbac_create_cash_box_v2`, `rbac_course_financial_summary_v2`).
- Zero calls were found to the un-prefixed legacy write functions (`record_payment`, `create_cash_box`, etc.) except for comments explaining that direct calls are strictly prohibited.

## 2. Complete Code Reference Mapping

| File Path | Line | RPC Name | Code Snippet |
| --- | --- | --- | --- |
| src\components\AdminAccessManagement.tsx | 66 | get_my_authorization | const { data: authData, error: authError } = await supabase.rpc('get_my_authorization'); |
| src\components\AdminAccessManagement.tsx | 80 | can_claim_platform_owner | await supabase.rpc('can_claim_platform_owner'); |
| src\components\AdminAccessManagement.tsx | 240 | claim_platform_owner | const { error: claimError } = await supabase.rpc('claim_platform_owner'); |
| src\components\AppShell.tsx | 131 | rbac_list_courses_v2 | ? supabase.rpc('rbac_list_courses_v2', { p_limit: 500, p_offset: 0 }) |
| src\components\forms\AdminInviteForm.tsx | 22 | get_my_authorization | await supabase.rpc('get_my_authorization'); |
| src\components\forms\CashBoxForm.tsx | 76 | create_cash_box | // Audited RPC create_cash_box only (strictly no fallback to direct INSERT) |
| src\components\forms\CashBoxForm.tsx | 77 | rbac_create_cash_box_v2 | const { error: rpcErr } = await supabase.rpc('rbac_create_cash_box_v2', { |
| src\components\forms\CashBoxForm.tsx | 177 | rbac_transfer_between_boxes | const { error: rpcError } = await supabase.rpc('rbac_transfer_between_boxes', { |
| src\components\forms\CourseForm.tsx | 41 | get_my_authorization | void supabase.rpc('get_my_authorization').then(({ data, error: authError }) => { |
| src\components\forms\EnrollForm.tsx | 44 | rbac_list_courses_v2 | supabase.rpc('rbac_list_courses_v2', { p_limit: 500, p_offset: 0 }), |
| src\components\forms\EnrollForm.tsx | 46 | rbac_list_enrollments_v2 | supabase.rpc('rbac_list_enrollments_v2', { p_search: null, p_limit: 500, p_offset: 0 }), |
| src\components\forms\EnrollForm.tsx | 89 | rbac_enroll_student_v2 | const { error: rpcError } = await supabase.rpc('rbac_enroll_student_v2', { |
| src\components\forms\ExpenseForm.tsx | 45 | rbac_list_cash_boxes_v2 | supabase.rpc('rbac_list_cash_boxes_v2'), |
| src\components\forms\ExpenseForm.tsx | 46 | rbac_list_courses | supabase.rpc('rbac_list_courses', { p_limit: 500, p_offset: 0 }), |
| src\components\forms\ExpenseForm.tsx | 64 | rbac_record_expense | const { error: rpcError } = await supabase.rpc('rbac_record_expense', { |
| src\components\forms\PaymentForm.tsx | 41 | rbac_list_enrollments_v2 | supabase.rpc('rbac_list_enrollments_v2', { p_search: null, p_limit: 500, p_offset: 0 }), |
| src\components\forms\PaymentForm.tsx | 42 | rbac_list_cash_boxes_v2 | supabase.rpc('rbac_list_cash_boxes_v2'), |
| src\components\forms\PaymentForm.tsx | 67 | rbac_record_payment_v2 | const { error: rpcError } = await supabase.rpc('rbac_record_payment_v2', { |
| src\components\forms\QuickEnrollModal.tsx | 87 | rbac_list_courses_v2 | supabase.rpc('rbac_list_courses_v2', { p_limit: 500, p_offset: 0 }), |
| src\components\forms\QuickEnrollModal.tsx | 89 | rbac_list_cash_boxes_v2 | canRecordPayment ? supabase.rpc('rbac_list_cash_boxes_v2') : Promise.resolve({ data: [], error: null }), |
| src\components\forms\QuickEnrollModal.tsx | 164 | rbac_enroll_student_v2 | const { data: enrData, error: enrErr } = await supabase.rpc('rbac_enroll_student_v2', { |
| src\components\forms\QuickEnrollModal.tsx | 177 | rbac_record_payment_v2 | const { error: payErr } = await supabase.rpc('rbac_record_payment_v2', { |
| src\components\forms\StudentForm.tsx | 39 | get_my_authorization | void supabase.rpc('get_my_authorization').then(({ data, error: authError }) => { |
| src\context\AuthContext.tsx | 62 | is_admin | const { data, error } = await supabase.rpc('is_admin'); |
| src\context\AuthContext.tsx | 71 | get_my_authorization | const { data, error } = await supabase.rpc('get_my_authorization'); |
| src\context\AuthContext.tsx | 282 | is_admin | const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin'); |
| src\context\AuthContext.tsx | 298 | is_admin | const { data: adminStatus, error: adminError } = await supabase.rpc('is_admin'); |
| src\context\AuthContext.tsx | 307 | get_my_authorization | const { data, error } = await supabase.rpc('get_my_authorization'); |
| src\pages\CashBoxesPage.tsx | 36 | rbac_list_cash_boxes_v2 | const { data, error } = await supabase.rpc('rbac_list_cash_boxes_v2'); |
| src\pages\CashBoxesPage.tsx | 45 | rbac_archive_cash_box | const { data, error } = await supabase.rpc('rbac_archive_cash_box', { |
| src\pages\CourseDetailsPage.tsx | 90 | rbac_list_courses_v2 | const { data, error } = await supabase.rpc('rbac_list_courses_v2', { p_limit: 1, p_offset: 0, p_course_id: courseId }); |
| src\pages\CourseDetailsPage.tsx | 97 | rbac_course_financial_summary_v2 | const { data, error } = await supabase.rpc('rbac_course_financial_summary_v2', { p_course_id: courseId }); |
| src\pages\CourseDetailsPage.tsx | 104 | rbac_list_enrollments_v2 | const { data, error } = await supabase.rpc('rbac_list_enrollments_v2', { |
| src\pages\CourseDetailsPage.tsx | 130 | rbac_set_enrollment_status | const { error } = await supabase.rpc('rbac_set_enrollment_status', { |
| src\pages\CoursesPage.tsx | 40 | rbac_list_courses_v2 | const { data, error } = await supabase.rpc('rbac_list_courses_v2', { p_limit: 500, p_offset: 0 }); |
| src\pages\CoursesPage.tsx | 51 | rbac_list_enrollments_v2 | const { data, error } = await supabase.rpc('rbac_list_enrollments_v2', { |
| src\pages\DashboardPage.tsx | 59 | rbac_operational_dashboard_metrics | ? supabase.rpc('rbac_operational_dashboard_metrics') |
| src\pages\DashboardPage.tsx | 61 | rbac_finance_dashboard_metrics | canReadFinance ? supabase.rpc('rbac_finance_dashboard_metrics') : Promise.resolve({ data: [], error: null }), |
| src\pages\DashboardPage.tsx | 62 | rbac_finance_dashboard_usd_v2 | canReadFinance ? supabase.rpc('rbac_finance_dashboard_usd_v2') : Promise.resolve({ data: [], error: null }), |
| src\pages\DashboardPage.tsx | 71 | rbac_list_payments_v2 | const { data, error } = await supabase.rpc('rbac_list_payments_v2', { p_limit: 10, p_offset: 0 }); |
| src\pages\EnrollmentsPage.tsx | 54 | rbac_list_enrollments_v2 | const { data, error } = await supabase.rpc('rbac_list_enrollments_v2', { |
| src\pages\EnrollmentsPage.tsx | 67 | rbac_set_enrollment_status | const { error } = await supabase.rpc('rbac_set_enrollment_status', { |
| src\pages\ExpensesPage.tsx | 63 | rbac_list_expenses | const { data, error } = await supabase.rpc('rbac_list_expenses', { p_limit: 500, p_offset: 0 }); |
| src\pages\ExpensesPage.tsx | 85 | rbac_void_expense | const { error } = await supabase.rpc('rbac_void_expense', { |
| src\pages\PaymentsPage.tsx | 84 | rbac_list_payments_v2 | const { data, error } = await supabase.rpc('rbac_list_payments_v2', { p_limit: 500, p_offset: 0 }); |
| src\pages\PaymentsPage.tsx | 104 | rbac_void_payment | const { error } = await supabase.rpc('rbac_void_payment', { |
| src\pages\SettingsPage.tsx | 40 | rbac_list_cash_boxes_v2 | const { data, error } = await supabase.rpc('rbac_list_cash_boxes_v2'); |
| src\pages\StudentDetailsPage.tsx | 67 | rbac_list_enrollments_v2 | const { data, error } = await supabase.rpc('rbac_list_enrollments_v2', { |
| src\pages\StudentDetailsPage.tsx | 81 | rbac_set_enrollment_status | const { error } = await supabase.rpc('rbac_set_enrollment_status', { |