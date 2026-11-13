# Phase 0 — الحالة بعد بدء المراجعة المستقلة

**المستودع:** `Ahmed77khaled/elmasry-academy-lms`  
**الفرع:** `phase0/shared-workspace`  
**Supabase:** `urmkcixqpoqkiosihhal`  
**آخر تحديث:** 13 نوفمبر 2026

## ما أنجزه ChatGPT

- راجع مسودات الإصلاح الأربعة مقابل الأدلة المتاحة وملفات الـMigration الأصلية ذات الصلة.
- راجع تعريفات `SECURITY DEFINER` والـACLs والفيوز والتريجرز.
- راجع `AuthContext.tsx` و`App.tsx` و`supabase.ts` على فرع GitHub الافتراضي لفهم أثر `is_admin()`.
- راجع `rbac_create_cash_box_v2` وحد الرصيد الافتتاحي بالدولار.
- أثبت من سجل الـMigration أن تعديل `added_by` إلى `ON DELETE SET NULL` لم يكتمل في الحالة الحية الموثقة.
- أعاد تصنيف Migration Ledger بشكل محافظ؛ وجود object لا يثبت تطبيق جميع statements.
- قوّى اختبار Default ACL الخاص بـStaging ليختبر كل صلاحيات الجداول الثمانية وصلاحيات sequences الثلاثة وEXECUTE وPUBLIC، ويحافظ على صلاحيات service_role كاملة.
- أضاف سياسة موثقة تمنع إصلاح Migration Ledger بالجملة.

## قرارات المراجعة

| المسودة | القرار |
|---|---|
| Default Privileges | مرشحة لاختبار Staging بعد مراجعة أثر سحب PUBLIC EXECUTE العام عبر كل الـSchemas |
| is_admin active status | مرشحة لاختبار Staging |
| Cash box USD + creator FK | مرشحة لاختبار Staging مع اختبار حذف مستخدم Auth تجريبي |
| Legacy financial views EGP-only | HOLD لحين تأكيد أن المصروفات والتحويلات التاريخية كلها بالجنيه وحسم تعارض dependency evidence |

التفاصيل في `REMEDIATION_CODE_REVIEW.md`.

## الخطوات المانعة للاعتماد

1. توفير Staging منفصلة ومستعادة من نسخة حديثة من Production.
2. تشغيل `PHASE0_REMAINING_SECURITY_GAPS_READONLY.sql` على البيئة المقصودة للحصول على inventory الدوال العادية وRLS وSchema privileges الكامل.
3. تنفيذ اختبارات Staging فقط، بدءًا من Default ACL و`is_admin()` وCash Box.
4. مراجعة مصدر بيانات المصروفات والتحويلات وتأكيد convention العملة قبل تعديل الفيوز.
5. مطابقة كل statement في كل Migration مع live catalog/data evidence قبل أي ledger repair.

## ممنوع حاليًا

- لا تطبيق على Production.
- لا `supabase db push`.
- لا `supabase migration repair`.
- لا تعديل يدوي لـ`schema_migrations`.
- لا تشغيل `PHASE0_STAGING_DEFAULT_ACL_PROBE.sql` على Production.

## الحالة الفعلية

- تغييرات Supabase: **لا يوجد**.
- SQL execution / PostgreSQL parser test: **لم يتم**.
- Staging tests: **لم تُنفذ**.
- Migration Ledger: **غير محسوم**.
- Production approval: **NO-GO**.
