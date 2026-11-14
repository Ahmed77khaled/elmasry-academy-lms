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

**تحديث أدلة القراءة فقط (14 نوفمبر):** جردت القراءة الحديثة 76 routine بكل مشروع مع احتساب `USAGE` للـschema، وأكدت عدم وجود صلاحيات مباشرة لـ`anon`/`authenticated` على 16 جدولًا و4 views. Production لديه 4 إصدارات في سجل migrations؛ Staging لا يحتوي schema أو جدول السجل. مصفوفة الـ641 statement أصبحت: 243 `UNVERIFIABLE`، و33 `NOT APPLICABLE`، و39 `ABSENT`، و293 `EQUIVALENT` للحالة الحالية، و33 `DIFFERENT`. وفي Candidate 4، ثبت من تعريفات الدوال في المشروعين أن wrapper الملخص يستدعي v2، وأن v2 لا يقرأ الـviews القديمة؛ يظل تأكيد معنى العملة والمستهلكين الخارجيين مطلوبًا. التفاصيل في [التقاط الكتالوج](../evidence/PHASE0_READONLY_CATALOG_CAPTURE_20261114.md).

**تحديث اختبارات Staging بعد موافقة محددة (14 نوفمبر):** على Staging فقط (`kxdfconqflveqeozanaw`)، نجحت 26 حالة Cash Box وRBAC و`is_admin` داخل fixtures متراجعة، مع تأكيد عدم إرسال إشعار وبقاء outbox غير مرسل. نجح أيضًا probe الامتيازات المقوّى عبر assertions ثم أظهر فحص التنظيف إزالة الجدول والتسلسل والدالتين. فحص SELECT مستقل أكد بقاء حسابات الاختبار الأربعة وعدم بقاء fixture rows أو أحداث/outbox مرتبطة بها. لا تغييرات دائمة على schema أو ACL، ولا أي عملية Production. النتائج التفصيلية في [خطة اختبارات Staging](STAGING_TEST_PLAN.md) و[تقرير النتائج](../evidence/STAGING_APPROVED_TEST_RESULTS_20261114.md).

**حالة المرحلة:** اختبارات السلوك وprobe الامتيازات المصرّح بهما نجحا، لكن Phase 0 لم تُغلق بعد: 410 من 641 statement ما زالت `UNVERIFIABLE`، وCandidate 4 على HOLD بانتظار اعتماد معنى العملة ومراجعة المستهلكين الخارجيين، واختبارات React/Supabase الحية لتدفق AuthContext غير منفذة. لا يوجد تصريح بتغييرات Production أو إصلاح migration ledger.

## قرارات Supabase

- Production لم يكن هدف استدعاء pause، ولم تسجل جلسة التنفيذ أي كتابة SQL عليه؛ 24 استعلام Production كانت SELECT-only.
- مشروع Ahmed Khaled Portfolio (`eidlyvsiroyxvccmzlfm`) تم إيقافه عمدًا لتوفير slot لـStaging، والمستخدم وافق على إبقائه متوقفًا.
- Staging (`kxdfconqflveqeozanaw`) أُنشئ واستخدم لاختبارات Phase 0.
- لا تنفذ أي تغييرات على Production. ولا تنفذ أي كتابة جديدة على Staging دون موافقة مستقلة وفحص ref قبل التنفيذ.

## الإصلاحات

| المرشح | الحالة |
|---|---|
| Default Privileges | نجحت assertions في الـprobe المقوّى على Staging؛ تم التراجع عن كل probe objects وتأكيد إزالتها |
| is_admin active status | نُفذ على Staging؛ اختبار SQL أكد active=true وinactive=false وnormal=false |
| Cash Box USD + creator FK | نجحت حالات السلوك المعتمدة على Staging، بما فيها EGP/USD والـcreator FK والأرشفة/outbox؛ لم تختبر واجهة metadata في التطبيق |
| Legacy Financial Views EGP-only | HOLD — لا تطبقه حتى حسم المستهلكين ومعنى العملة |

## ملاحظة أمان تخص حسابات الاختبار

تم إنشاء أربعة حسابات Auth تجريبية على Staging. كلمات مرورها أزيلت من النسخة الحالية من سجل التنفيذ، لكن إصدارات Git السابقة كانت تحتوي عليها؛ لذلك تُعامل كلمات المرور القديمة على أنها مكشوفة. قبل اختبار تسجيل الدخول مرة أخرى، يجب تغيير كلمات المرور أو حذف/إعادة إنشاء الحسابات التجريبية على Staging فقط، بعد موافقة صريحة والتحقق من Project Ref. ممنوع لمس حسابات Production.

## أهم المهام المفتوحة لـCodex

1. تأكيد عدم وجود مستهلكات خارجية خاملة للدوال الثماني؛ اختبارات RBAC السلوكية بالهويات الاصطناعية نجحت على Staging، لكن سجلات 24 ساعة لا تنفي التكاملات النائمة.
2. اكتملت مراجعة تدفق `AuthContext` وإصلاحات التعافي المحلية؛ اختبارات React/Supabase المتكاملة وتسجيل الدخول الحي ما زالت غير منفذة.
3. نجحت حالات Cash Box والـoutbox المعتمدة، وتأكد rollback وعدم إرسال dispatcher. تحقق تفاصيلها في `STAGING_TEST_PLAN.md`.
4. نجح ACL probe المقوّى على Staging وتأكدت إزالة عناصر الاختبار الأربعة.
5. مصفوفة statement-level جاهزة لـ641 سطرًا؛ 410 ما زالت `UNVERIFIABLE`. Production لديه 4 ledger rows وStaging ليس لديه schema/جدول ledger؛ لا يوجد أي إذن لإصلاح السجل.
6. Candidate 4: تعارض اعتماد الـRPC حُسم بالقراءة الحديثة، لكن تأكيد معنى EGP/USD للمصروفات والتحويلات ومراجعة المستهلكين الخارجيين ما زالا مطلوبين؛ يظل HOLD.

## ممنوع

- `supabase db push`, `db reset`, `migration repair`, أو تعديل يدوي لـ`schema_migrations`.
- أي DDL/DML/GRANT/REVOKE على Production.
- إضافة المرشحات الأربعة إلى active migrations قبل المراجعة والموافقة.
- نشر Production أو تغيير إعدادات Vercel أو مفاتيح Supabase.

راجع `docs/phase0/CODEX_HANDOFF.md` للحصول على تعليمات Codex الكاملة.
