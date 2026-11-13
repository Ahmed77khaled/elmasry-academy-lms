# Phase 0 — الحالة بعد المراجعة المستقلة

**المستودع:** `Ahmed77khaled/elmasry-academy-lms`  
**الفرع:** `phase0/shared-workspace`  
**Supabase:** `urmkcixqpoqkiosihhal`  
**آخر تحديث:** 13 نوفمبر 2026

## ما أنجزه ChatGPT

- راجع ملفات Migration الأصلية ذات الصلة، ومسودات الإصلاح الأربعة.
- راجع أدلة Default ACL، ودوال SECURITY DEFINER، والجداول، والفيوز، والتريجرز.
- راجع استخدام `is_admin()` داخل AuthContext وApp.
- راجع منطق `rbac_create_cash_box_v2` وحدّ الرصيد الافتتاحي.
- قارن محاولة ضبط FK في Migration 008 وتحديث trigger في Migration 21171218 مع حالة FK الحية.

## قرارات المراجعة

| المسودة | القرار |
|---|---|
| Default Privileges | مرشحة لاختبار Staging بشرط فحص أثر تعديل PUBLIC EXECUTE العام على كل الـSchemas |
| is_admin active status | مرشحة لاختبار Staging |
| Cash box USD + creator FK | مرشحة لاختبار Staging واختبار حذف مستخدم Auth تجريبي |
| Legacy financial views EGP-only | موقوفة لحين تأكيد مالك البيانات أن المصروفات والتحويلات التاريخية كلها بالجنيه، وحسم تعارض أدلة اعتماد الدوال |

تفاصيل المراجعة في `REMEDIATION_CODE_REVIEW.md`.

## الممنوع حاليًا

- لا تطبيق على Production.
- لا `supabase db push`.
- لا `supabase migration repair`.
- لا تعديل يدوي لـ `schema_migrations`.
- لا تشغيل `PHASE0_STAGING_DEFAULT_ACL_PROBE.sql` على Production.
- لا اعتبار أي مسودة Migration معتمدة لمجرد وجودها في GitHub.

## الحالة الفعلية

- التعديلات على Supabase: **لا يوجد**.
- اختبارات PostgreSQL/Staging: **لم تُنفذ**.
- Migration Ledger: **ما زال غير محسوم**.
- Production approval: **NO-GO**.
