# Phase 0 — الوضع الحالي وملخص التسليم إلى Codex

**المستودع:** `Ahmed77khaled/elmasry-academy-lms` (Private)  
**فرع الأدلة:** `phase0/shared-workspace`  
**فرع Codex:** `codex/phase0-next`  
**Production:** `urmkcixqpoqkiosihhal`  
**Staging:** `kxdfconqflveqeozanaw`  
**آخر تحديث:** 13 نوفمبر 2026

## الخلاصة

ملفات المشروع موجودة على GitHub: كود React/TypeScript، Supabase Functions، migrations الحالية، 20 migration snapshots، أدلة Phase 0، ملفات SQL المرشحة، Schema snapshot، validation scripts، وسجل تنفيذ Supabase بعد إزالة كلمات مرور الاختبار.

تم إنشاء فرع مستقل لـCodex حتى يشتغل بعيدًا عن `main` ويحافظ على فرع الأدلة.

## قرارات Supabase

- Production لم يكن هدف استدعاء pause، ولم تسجل جلسة التنفيذ أي كتابة SQL عليه؛ 24 استعلام Production كانت SELECT-only.
- مشروع Ahmed Khaled Portfolio (`eidlyvsiroyxvccmzlfm`) تم إيقافه عمدًا لتوفير slot لـStaging، والمستخدم وافق على إبقائه متوقفًا.
- Staging (`kxdfconqflveqeozanaw`) أُنشئ واستخدم لاختبارات Phase 0.
- لا تنفذ أي تغييرات على Production. ولا تنفذ أي كتابة جديدة على Staging دون موافقة مستقلة وفحص ref قبل التنفيذ.

## الإصلاحات

| المرشح | الحالة |
|---|---|
| Default Privileges | نُفذ على Staging؛ الاختبار المنفذ كان نسخة أقدم مختصرة، ويلزم تشغيل الـProbe الكامل الحالي |
| is_admin active status | نُفذ على Staging؛ اختبار SQL أكد active=true وinactive=false وnormal=false |
| Cash Box USD + creator FK | نُفذ على Staging؛ اختبارات أساسية نجحت، والتغطية ليست كاملة |
| Legacy Financial Views EGP-only | HOLD — لا تطبقه حتى حسم المستهلكين ومعنى العملة |

## أهم المهام المفتوحة لـCodex

1. بناء inventory لكل الدوال العامة القابلة للتنفيذ بواسطة `anon` و`authenticated` (المسجل 69 و70)، ومراجعة السلوك الفعلي قبل اقتراح أي revoke.
2. مراجعة تدفق `AuthContext` واختبارات تسجيل الدخول وتحديث الجلسة والخروج للمسؤول المعطّل.
3. استكمال اختبارات Cash Box عبر RPC المعتمد، واختبارات limits والحذف وتغيير creator وإشعارات outbox دون إرسال خارجي.
4. تشغيل الـACL probe الأحدث على Staging بعد موافقة واضحة.
5. بناء Migration statement-level reconciliation للـ20 ملفًا مقابل 4 ledger rows.
6. إبقاء Candidate 4 على HOLD إلى أن يتفق عقد الواجهة/التقارير على تمثيل EGP وUSD.

## ممنوع

- `supabase db push`, `db reset`, `migration repair`, أو تعديل يدوي لـ`schema_migrations`.
- أي DDL/DML/GRANT/REVOKE على Production.
- إضافة المرشحات الأربعة إلى active migrations قبل المراجعة والموافقة.
- نشر Production أو تغيير إعدادات Vercel أو مفاتيح Supabase.

راجع `docs/phase0/CODEX_HANDOFF.md` للحصول على تعليمات Codex الكاملة.
