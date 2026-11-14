# Phase 0 — الوضع الحالي وملخص التسليم إلى Codex

**المستودع:** `Ahmed77khaled/elmasry-academy-lms` (Private)  
**فرع الأدلة:** `phase0/shared-workspace`  
**فرع Codex:** `codex/phase0-next`  
**Production:** `urmkcixqpoqkiosihhal`  
**Staging:** `kxdfconqflveqeozanaw`  
**آخر تحديث:** 14 نوفمبر 2026

## الخلاصة

ملفات المشروع موجودة على GitHub: كود React/TypeScript، Supabase Functions، migrations الحالية، 20 migration snapshots، أدلة Phase 0، ملفات SQL المرشحة، Schema snapshot، validation scripts، وسجل تنفيذ Supabase بعد إزالة كلمات مرور الاختبار.

تم إنشاء فرع مستقل لـCodex حتى يشتغل بعيدًا عن `main` ويحافظ على فرع الأدلة.

**تحديث متابعة Codex (14 نوفمبر):** بعد موافقة محددة، تم تضييق EXECUTE في Staging على دالتي Telegram worker إلى `service_role`، ثم على دوال الكتابة القديمة الثماني إلى `service_role` فقط. تم التحقق بعد كل تغيير. الجرد الحالي يؤكد 55 دالة anon و56 authenticated قابلة لـRPC حسب Security Advisor؛ كانت الأعداد 63/64 قبل التغيير الثاني. لم تتغير Production أو بيانات التطبيق أو migration ledger، ولم تُستدعَ دوال كتابة. أجسام الدوال القديمة ما زالت تعتمد على فحص admin عام، لكن لا يمكن استدعاؤها مباشرة من anon/authenticated الآن؛ اختبارات سلوك RBAC لا تزال غير منفذة. فحص سجلات REST لآخر 24 ساعة لم يجد استدعاءات مباشرة للأسماء الثمانية، لكنه لا ينفي تكاملات خارجية خاملة. التفاصيل في [تقرير مراجعة أجسام RPC](../evidence/STAGING_RPC_BODY_REVIEW.md)، [مصفوفة الصلاحيات](../evidence/CURRENT_CALLABLE_ROUTINE_PRIVILEGE_MATRIX.md)، و[سجل معالجة ACL](STAGING_LEGACY_RPC_ACL_REMEDIATION.md).

**تحديث محلي إضافي:** أُصلح مسار رفض/فشل طلب تسجيل الدخول كي يعود النموذج لحالة قابلة لإعادة المحاولة برسالة عامة، وأُضيفت إعادة محاولة عند تعذر تحميل الصلاحيات مع استمرار حجب المحتوى المحمي. اختبارات `typecheck` و`lint` و`build` و`test` و`test:telegram` نجحت. كما فُصل توثيق `cash_boxes.added_by` حسب البيئة: Production = `NO ACTION`، ونتيجة Staging المحفوظة في العملية 91 = `SET NULL`. لم تُنفذ أي عملية جديدة على Supabase.

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

## ملاحظة أمان تخص حسابات الاختبار

تم إنشاء أربعة حسابات Auth تجريبية على Staging. كلمات مرورها أزيلت من النسخة الحالية من سجل التنفيذ، لكن إصدارات Git السابقة كانت تحتوي عليها؛ لذلك تُعامل كلمات المرور القديمة على أنها مكشوفة. قبل اختبار تسجيل الدخول مرة أخرى، يجب تغيير كلمات المرور أو حذف/إعادة إنشاء الحسابات التجريبية على Staging فقط، بعد موافقة صريحة والتحقق من Project Ref. ممنوع لمس حسابات Production.

## أهم المهام المفتوحة لـCodex

1. استكمال تأكيد عدم وجود مستهلكات خارجية خاملة للدوال الثماني، وتشغيل اختبارات RBAC السلوكية بعد تجهيز هويات اختبار Staging بموافقة منفصلة.
2. اكتملت مراجعة تدفق `AuthContext` وإصلاحات التعافي المحلية؛ اختبارات React/Supabase المتكاملة وتسجيل الدخول الحي ما زالت غير منفذة.
3. حالات Cash Box والـoutbox الناقصة محضّرة في `STAGING_TEST_PLAN.md`، ولم تُشغّل.
4. تشغيل ACL probe المقوّى على Staging بعد موافقة واضحة والتحقق الفوري من ref.
5. مصفوفة statement-level جاهزة لـ641 سطرًا؛ 452 ما زالت `UNVERIFIABLE`، ولا يوجد أي إذن لإصلاح ledger.
6. إبقاء Candidate 4 على HOLD حتى تأكيد الاعتماديات الحية ومعنى EGP/USD للمصروفات والتحويلات.

## ممنوع

- `supabase db push`, `db reset`, `migration repair`, أو تعديل يدوي لـ`schema_migrations`.
- أي DDL/DML/GRANT/REVOKE على Production.
- إضافة المرشحات الأربعة إلى active migrations قبل المراجعة والموافقة.
- نشر Production أو تغيير إعدادات Vercel أو مفاتيح Supabase.

راجع `docs/phase0/CODEX_HANDOFF.md` للحصول على تعليمات Codex الكاملة.
