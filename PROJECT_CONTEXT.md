# Current delivery status (2026-10-23)

- Repository branch `main` is kept synchronized with `origin/main` after each verified closure update.
- The Vite frontend is automatically deployed from `main` to the Cloudflare Pages Preview branch at https://preview.elmasry-academy-lms.pages.dev/. The latest deployment completed successfully; the preview, bundled JavaScript, stylesheet, and custom favicon return HTTP 200. No production domain or production deployment was configured in this work.
- The frontend build toolchain is Vite 8 and Tailwind CSS 4. `npm audit` reports zero vulnerabilities. `typecheck`, clean `lint` (zero warnings), `build`, and the 12-test offline Telegram suite pass. Application pages are lazy-loaded; the largest generated JavaScript chunk is about 180 kB, with no oversized-chunk warning.
- GitHub workflows use `actions/checkout@v7` and the preview deploy workflow is pinned to `ubuntu-24.04`; its Node setup action is `actions/setup-node@v7` with Node.js 22 for the Vite build.
- Supabase Auth Site URL is set to the Cloudflare Preview origin, and that origin was already present in allowed Redirect URLs. An authenticated, read-only Preview smoke test confirmed the Dashboard, Students, Courses, Enrollments, Payments, Expenses, Cash Boxes, and Settings pages load in the existing platform-owner session. Arabic/English UI switching was checked on Enrollments and Settings. No new sign-in, invitation submission, or financial mutation was performed.
- Supabase functions were read-only inventoried after deploying only `login-alert`: `login-alert` v12 ACTIVE, `telegram-group-dispatch` v6 ACTIVE, and `admin-invite` v1 ACTIVE. JWT gateway verification remains disabled for all three; handlers perform their own checks.
- No SQL or migration was applied during the 2026-10-23 closure work. The historical migration bootstrap mismatch described below remains unresolved and requires a reviewed baseline plan before any database-history reconciliation or fresh-project bootstrap.
- The authenticated Preview smoke test covered read-only navigation only. Invitation delivery, fresh sign-in, and create/update/delete financial flows remain unverified. Do not share credentials. The earlier token exposure note still applies: revoke any Cloudflare token pasted into chat and keep only its rotated replacement in GitHub secrets.
- Older status notes below are historical records. Use this section and the repository state for current hosting/function versions.

# سياق مشروع أكاديمية المصري — TrainerPro LMS
## وثيقة الربط والمزامنة بين Antigravity و OpenCode (DeepSeek V4.1)

> **تاريخ التحديث:** 22 أكتوبر 2026 (حالة الإنتاج موثقة فقط للبنود التي لها نتائج SQL Editor مذكورة أدناه؛ التغييرات المحلية اللاحقة ليست مطبقة تلقائياً)
> **المهندس المشرف:** م/ أحمد الفلاح  
> **المسار الأساسي للمشروع (المستودع):** `D:\Fel7o Gamal Project\LMS_platform-main\LMS_platform-main`  
> **المسار الأب الشامل (Workspace Root):** `D:\Fel7o Gamal Project`  
> **الموديل المعتمد للسيشن:** `opencode/deepseek-v4.1-flash-free`  

---

### 🏛️ 1. هوية المشروع والتقنيات (Tech Stack)
* **واجهة المستخدم (Frontend):** React 18 + TypeScript + Vite + Tailwind CSS + Lucide React.
* **قاعدة البيانات والباك إند (Backend):** Supabase (PostgreSQL 17) مع تأمين RLS كامل وتريجرات دفاتر الأستاذ غير القابلة للتعديل ودوال RPC المخزنة.
* **العملة المعتمدة:** الجنيه المصري (ج.م) مع محاذاة RTL كاملة لكافة الشاشات والجداول.

---

### 🔍 2. حقيقة مصدر المخطط وتعارض الميجريشن (Schema Origin & Bootstrap Analysis)
1. **موقع ملف المخطط الأصيل (Canonical Schema):**
   * الملف الأصيل الذي يطابق قاعدة البيانات الحية والواجهة والأنواع هو:  
     `D:\Fel7o Gamal Project\docs\migrations\001_tables.sql`  
   * **تنبيه معماري هام:** هذا الملف يقع في مجلد التوثيق العام للمشروع في المسار الأب `D:\Fel7o Gamal Project\docs`، وهو **خارج** مستودع الكود الداخلي (`LMS_platform-main\LMS_platform-main`).
2. **سلسلة ميجريشن المستودع وإعادة البناء من الصفر (Fresh DB Bootstrap):**
   * ملفات `supabase/migrations/001` إلى `004` داخل المستودع تمثل قالباً أولياً مبسطاً (Starter Schema) تستخدم `id` و `box_type` و `archived` وتفتقر لجدول `admins`.
   * ميجريشن `005_production_hardening.sql` وما بعدها بُنيت على المخطط الأصيل وتفحص وجود `cash_boxes.cash_box_id` و `admins`.
   * **النتيجة القاطعة:** سلسلة الترحيلات الحالية في المستودع **لا تستطيع** بناء قاعدة بيانات جديدة فارغة من الصفر بالتتابع، لأنها ستفشل عند ميجريشن 005. يتطلب إطلاق بيئة جديدة اعتماد سكريبت Baseline موحد من `docs/migrations/001_tables.sql` دون تعديل الميجريشن القديمة المطبقة.

---

### 🛡️ 3. حالة قاعدة البيانات المؤكدة والمطبقة ميدانياً (Verified Ledger Architecture)
1. **صلاحيات الجداول (Grants):**
   * جداول القيود المالية والعمليات (`enrollments`, `payments`, `expenses`, `cash_box_transfers`) وجدول `admins` ممنوح لها فقط صلاحية القراءة `SELECT` للمستخدم الموثق `authenticated`.
   * جداول البيانات التعريفية (`students`, `courses`) متاح لها CRUD مع خضوعها للسياسات والتريجرات.
   * جدول الخزن (`cash_boxes`) متاح له حصرياً صلاحية `SELECT` وتحديث الأعمدة التشغيلية الخمسة (`name`, `type`, `owner`, `is_active`, `notes`) بموجب ميجريشن 008، ومحظور تماماً من `INSERT` و `DELETE` و `TRUNCATE` وتعديل الأعمدة المحمية.
2. **تريجرات الحصانة المالية (Ledger Immutability Triggers):**
   * تريجر `trg_payments_financial_immutability` يمنع منعاً باتاً تعديل أو حذف أي قيد دفع.
   * تريجر `trg_expenses_financial_immutability` يمنع تعديل أو حذف أي سند صرف.
   * تريجر `trg_transfers_financial_immutability` يمنع تعديل أو حذف أي تحويل بين الخزن.
   * الإلغاء يتم فقط عبر قيود عكسية تدقيقية (Voiding).
3. **حصر الدوال المخزنة وأدوارها المعمارية (RPC Inventory — 9 Functions Total):**
   تعتمد المنصة على 9 دوال مركزية في قاعدة البيانات مع تمييز صريح لأدوارها:
   * **دوال العمليات والتحركات السبع (7 Operational RPCs):** لتنفيذ الحركات المالية والاشتراكات تحت أقفال التزامن الذرية وفحص الصلاحية الإدارية (`record_payment`, `record_expense`, `transfer_between_boxes`, `void_payment`, `void_expense`, `enroll_student`, `set_enrollment_status`).
   * **دالة إنشاء الخزن المستقلة (`create_cash_box`):** أُضيفت بميجريشن 008 لإنشاء الخزن حصراً لدور `authenticated` تحت حراسة إدارية وتثبيت الرصيد الافتتاحي وتوثيق المنشئ.
   * **دالة الفحص الأمني المركزي (`is_admin()`):** الفاحص المستقل (Gatekeeper Predicate) للتحقق من العضوية في جدول `admins` دون تنفيذ عمليات أو أقفال.
4. **ميجرشن 008 (مطبقة ومثبتة بنتائج التدقيق الميداني على قاعدة الإنتاج بتاريخ 21 أكتوبر 2026):**
   * ملف الميجرشن: `supabase/migrations/202610210008_protect_cash_boxes_opening_balance.sql`.
   * طبقها المشغل بنجاح عبر Supabase SQL Editor، وأبلغ عن نجاح التنفيذ (Success. No rows returned).
   * **نتائج استعلام التدقيق الميداني المنفذ والمبلغ عبر SQL Editor:**
     * `table_select = true` (بقاء صلاحية القراءة لدور authenticated).
     * `table_update = false` (سحب الـ UPDATE على مستوى جدول الخزن بالكامل).
     * `table_insert = false`, `table_delete = false`, `table_truncate = false`.
     * الأعمدة التشغيلية الخمسة المسموح بتعديلها (`name`, `type`, `owner`, `is_active`, `notes`) = `true`.
     * الأعمدة المحمية الأربعة الممنوع تعديلها (`cash_box_id`, `opening_balance`, `added_by`, `created_at`) = `false`.
   * تم تحصين الرصيد الافتتاحي `opening_balance` بخطين دفاع:
     1. خط دفاع الـ ACL على مستوى المحرك (يرفض التعديل قبل الـ RLS والتريجر بالخطأ 42501).
     2. خط دفاع التريجر `trg_cash_boxes_immutability` (يرفض التعديل ويمنع الـ DELETE الصلب).
   * الإنشاء لدور `authenticated` محصور حصراً عبر دالة `create_cash_box` RPC ومفحوص بالـ `is_admin()`.
   * تم تحديث `src/components/forms/CashBoxForm.tsx` لاستدعاء الدالة حصراً دون أي Fallback للإدراج المباشر.

5. **تصحيح تابع بعد Migration 008 — حالة Migration 009 المُبلّغة:**
   * الملف: `supabase/migrations/20261021171218_allow_cash_box_creator_nullification_on_auth_delete.sql`.
   * السبب الهندسي: Migration 008 يعرّف `cash_boxes.added_by` بمفتاح أجنبي `ON DELETE SET NULL`، بينما تريجر `prevent_cash_box_mutation()` كان يمنع أي تغيير لـ `added_by`. وظيفة وسلوك هذا الترحيل هي السماح بتحويل القيمة من UUID موجود إلى `NULL` حصراً لتمكين سلوك المفتاح الأجنبي عند حذف مستخدم Auth، مع استمرار منع تزوير المنشئ أو إعادة تعيينه إلى UUID آخر وتجميد الرصيد الافتتاحي.
   * **الحالة والتوثيق الدقيق:** أُبلغ فقط عن تشغيل السكريبت في Supabase SQL Editor على مشروع «TrainerPro» بتاريخ 21 أكتوبر 2026 وظهور عبارة (`Success. No rows returned`)؛ ولم يتم التحقق المستقل من معرف المشروع المختار أو اختباره تشغيلياً. وبالتالي يُوثق فقط كإجراء مُبلّغ عن تنفيذه في محرّر الاستعلامات، دون إثبات هوية المشروع أو سلوك التشغيل الفعلي عند حذف المستخدم.

6. **بيئة التشغيل والتحقق من الإعدادات المحلية (Local Environment & UI Testing Restrictions):**
   * **فحص الإعدادات المحلية:** تم التحقق مؤخراً من أن ملف الإعدادات المحلي `.env` يستهدف مشروع Supabase الإنتاجي الفعلي (مع الالتزام الصارم بعدم طباعة أو كشف أي قيم أو مفاتيح سرية في المحادثة أو السجلات).
   * **حالة خادم التطوير المحلي:** يعمل خادم التطوير المحلي (Vite) على `http://127.0.0.1:5173/`، ولكن نظراً لأن التكوين المحلي الفعلي يستهدف مشروع الإنتاج، **لا يجوز وصف الخادم المحلي بأنه متصل بأمان ببيئة اختبار منفصلة (Staging)**.
   * **حظر اختبارات الواجهة الحية (UI Smoke Tests Withheld):** يُمنع منعاً باتاً تفويض أو إجراء أي اختبارات تفاعلية حية أو إرسال نماذج (إنشاء، تعديل، أرشفة خزن) عبر الواجهة ضد الإعدادات المحلية الحالية منعاً لأي تعديل على بيانات الإنتاج، ويظل اختبار الواجهة مؤجلاً حتى يتم توفير وتأكيد بيئة Staging منفصلة تماماً بإعدادات تحقق مستقلة.
   * **الحماية من الانهيار العشوائي:** أزيل العنوان الاحتياطي للإنتاج من `src/lib/supabase.ts`؛ وفي حال غياب متغيرات البيئة المطلوبة يتوقف العميل فوراً برسالة خطأ صريحة (Fail-Closed).

---

### 🚫 4. القواعد الصارمة الدائمة (Strict Directives)
1. **حظر الرفع والكوميت:** يُمنع منعاً باتاً تنفيذ `git push` أو `git commit` تحت أي ظرف.
2. **صيغة الملفات:** ملفات التوثيق بصيغة Markdown فقط (`.md`)، وحظر إنشاء ملفات `.docx`.
3. **العمليات المالية:** حظر إجراء أي حسابات أو تعديلات مالية من الكلاينت؛ كل الحسابات تأتي من الـ Views وكل الإدخالات عبر الـ RPCs.

---

### 👤 5. دعوات المديرين وتنبيهات تسجيل الدخول — الحالة المحلية (22 أكتوبر 2026)
* **دعوة مسؤول أعلى:** أضيف نموذج محلي في صفحة الإعدادات لإرسال دعوة بريدية لمدير جديد؛ يظهر النموذج فقط لمن لديه `admins.role = 'superadmin'`. دالة Edge Function `admin-invite` تتحقق من جلسة Supabase ومن دور الداعي على الخادم، وتضيف المستخدم المدعو إلى `admins` بدور `admin`. المدعو يختار كلمة مروره من رابط البريد، ويمكنه تغييرها لاحقاً من إعدادات الحساب.
* **حدود الصلاحية:** `role = 'admin'` لا يمنح حالياً صلاحيات محدودة؛ كل عضو في `admins` يملك كامل صلاحيات النظام الحالية عبر `is_admin()`. التحقق من `superadmin` هنا يقيد إرسال الدعوات فقط.
* **تنبيه Telegram الخاص السابق:** بعد تسجيل دخول ناجح من واجهة LMS، يتحقق التطبيق من عضوية المدير ويستدعي `login-alert` بشكل غير متزامن كي لا يمنع إكمال الدخول عند تعطل التنبيه. الدالة تتحقق مجدداً من الجلسة، وتمنع تكرار الرسالة لكل جلسة عبر SHA-256 لمعرف الجلسة، وكان قالب التنبيه الخاص يتضمن البريد وعنوان IP المتاح ووقت القاهرة. هذا مسار منفصل عن تنبيهات مجموعة الإدارة، التي تستخدم قالباً أقل بيانات ولا ينبغي أن يتضمن البريد أو IP.
* **الخصوصية والنطاق:** لا يخزن جدول `login_alert_dedupe` البريد أو IP؛ يخزن بصمة الجلسة ووقت إنشائها، وتحذف السجلات الأقدم من 90 يوماً عند استدعاء الدالة. تنبيه Telegram لا يغطي محاولات الدخول الفاشلة ولا الدخول من عميل خارجي؛ استخدم سجلات Supabase Auth للأحداث الأوسع. الإشعار ليس MFA.
* **حالة التفعيل في TrainerPro (22 أكتوبر 2026):** طُبقت ميجريشن `20261021214608_add_login_alert_dedupe.sql` عبر Supabase MCP وسُجلت بالإصدار `20261021214608`. تحقق استعلام للقراءة فقط من تفعيل RLS وFORCE RLS ومن صلاحيات `service_role` وعدم منح `anon` أو `authenticated` صلاحية SELECT. نُشرت `login-alert` بالإصدار 2. أظهرت سجلات محاولة دخول محلية أن الدالة وصلت لمرحلة إرسال Telegram لكن الإرسال فشل؛ الإصدار 2 يسجل تصنيفاً آمناً للسبب دون كشف أسرار أو محتوى الرسالة. اسما السرّين موجودان في لوحة TrainerPro، لكن لم تُقرأ قيمهما. استدعاء الواجهة موجود محلياً ولم يُنشر إلى الموقع. دالة `admin-invite` لم تُنشر، وإعداد SMTP وروابط Auth لم يُختبر. لا تضع أسرار Telegram في Vite أو Git أو المحادثة.
* **مرجع التفاصيل:** راجع القسم 15 من `المرجع_الشامل_لنظام_أكاديمية_المصري_LMS.md` ودليل `supabase/functions/SETUP.md` للتدفق والإعداد خطوة بخطوة.

### 🔐 6. الصلاحيات الدقيقة ورصد محاولات الدخول — حالة RBAC المحلية
* الصفحات الحالية تشمل لوحة المعلومات والطلاب والكورسات والاشتراكات والدفعات والمصروفات والخزن والإعدادات. لا توجد وحدة مخزون للكابلات والسيرفرات حالياً.
* **حالة قاعدة البيانات وفق تقارير المشغّل (22 أكتوبر 2026):** أُبلغ عن نجاح تشغيل ميجريشن كتالوج RBAC (`20261021223822`)، وواجهات القراءة (`20261021224440`)، وواجهات الكتابة وإدارة المديرين (`20261021224905`) في SQL Editor. وأظهرت نتيجة استعلام قراءة لاحق وجود جداول الكتالوج والدوال الأساسية و35 دالة باسم `rbac_%`، مع `owner_count = 0` و`active_superadmin_count = 1`. هذه نتائج أرسلها المشغّل ولم أتحقق منها مستقلاً على قاعدة البيانات؛ ولا يوجد جدول تتبع CLI.
* **حدود المرحلة الحالية:** الترحيلات الثلاثة إضافية ولا تسحب المنح أو سياسات الوصول القديمة. لذلك وجود دوال RBAC لا يعني أن حماية الأدوار أصبحت حدّاً أمنياً على المشروع الحي. الواجهة الجديدة وتغييراتها ما زالت محلية وغير منشورة، ولم يُثبّت أي مالك أعلى بعد.
* جرى محلياً تحويل صفحات وواجهات التطبيق والنماذج والبحث والتصدير إلى RPCs الجديدة وإخفاء الحقول والإجراءات بحسب صلاحيات الجلسة. هذا تحسين للواجهة وتوافق للكود، وليس حدّاً أمنياً في قاعدة البيانات قبل تطبيق الميجريشنات والتحقق منها.
* ميجريشن دعم تعدد المالكين `20261022225500` ومسودة القطع `20261022230000` محليتان وغير مطبقتين على Supabase. الأولى تزيل قيد المالك الواحد، وتضيف RPC لتعيين مالكين متعددين مع سجل تدقيق وحماية آخر مالك نشط، وتحدّث أهلية التثبيت الأولي. الثانية تسحب الوصول المباشر من أدوار العميل للجداول التشغيلية والمالية والفيوهات المالية المختلطة، وتسحب صلاحية تحديث أعمدة بيانات الخزن المتبقية من ميجريشن 008، وتمنع استدعاء RPCs القديمة غير المقيدة. لا تشغّلهما قبل مراجعة المخطط وإصدار الواجهة وخطة تحقق الأدوار.
* الأدوار المبدئية في الكتالوج: مالك منصة واحد أو أكثر بصلاحيات كاملة، و`academy_manager` للعمليات الأكاديمية دون الماليات، و`finance_manager` للمهام المالية المحددة، مع أدوار مخصصة من الأذونات القابلة للتفويض فقط. أظهرت نتيجة المشغّل مديراً أعلى نشطاً واحداً ولا مالك مثبتاً؛ لم يتم استدعاء إجراء المطالبة.
* تنبيه كل محاولات الدخول يظل تصميمًا مقترحًا منفصلًا: مصدر الحقيقة هو Supabase Auth Audit Logs؛ استدعاء الواجهة بعد فشل كلمة المرور غير موثوق ويمكن تزويره. ربط السجلات بـ Telegram يحتاج Log Drain إلى endpoint آمن أو تكامل معتمد آخر، والتحقق من التكلفة والخطة قبل التفعيل.
* قاعدة الثلاث محاولات يجب أن تكون حظرًا مؤقتاً مع استرداد آمن لتقليل خطر قفل حساب المالك عمداً. Password Verification Attempt Hook متاح وفق وثائق Supabase لخُطتي Teams وEnterprise فقط، والوثائق تحذر من استغلاله لحبس المستخدمين. لا توجد ميجريشن أو كود لهذا التصميم المقترح.
* ملفات التصميم والعقد: `D:\Fel7o Gamal Project\docs\AUTHORIZATION_RBAC_PLAN.md` و`D:\Fel7o Gamal Project\docs\RBAC_API_CONTRACT.md`.

### 🖼️ 7. شعار الأكاديمية والصور الشخصية — مسودة محلية
* أضيفت `supabase/migrations/20261023090000_branding_and_admin_avatars.sql` محلياً فقط، ولم تُطبّق على أي قاعدة بيانات. تنشئ جدولاً مفرداً لإعداد الشعار، وتتيح قراءته للعامة عبر RPC، بينما يقتصر تغييره على مالك المنصة مع تسجيل العملية في سجل التدقيق.
* يتيح المخزن العام `academy-branding` عرض شعار الأكاديمية في شاشة الدخول ورأس التطبيق والقائمة الجانبية. لا يظهر خيار تغيير الشعار في الإعدادات إلا لمالك المنصة. الصيغ المقبولة PNG وJPG وWebP وبحجم أقصى 2 ميجابايت، والرمز «م» هو البديل عند غياب الشعار أو تعذر تحميله.
* تحفظ الصور الشخصية في مخزن خاص `admin-avatars`. يرفع كل مدير صورته إلى مجلد مرتبط بمعرف حسابه، ويُحفظ مسار الصورة في بيانات الحساب الوصفية. سياسات التخزين تقصر إنشاء روابط العرض الموقعة والرفع والحذف على صاحب الحساب؛ رابط العرض نفسه مؤقت ويمكن لمن يحصل عليه استخدامه حتى انتهاء صلاحيته. يمكن للمدير إضافة صورته أو تغييرها أو إزالتها من «الإعدادات والأمان».
* **حالة التنفيذ:** تغييرات الواجهة والميجريشن مسودات محلية غير ملتزمة، ولا يوجد تحقق حي أو اختبار واجهة لهذه الميزة. يلزم مراجعة الميجريشن ثم تطبيقها على المشروع المقصود قبل استخدام رفع الصور أو تغيير الشعار؛ لا تختبر ذلك على الإنتاج قبل اعتماد التطبيق.

### 👥 8. تنبيهات مجموعة Telegram المشتركة — حالة الإعداد (22 أكتوبر 2026)
* **المعمارية:** تُحفظ الأحداث المؤهلة في `telegram_notification_outbox`، ثم تستدعي مهمة مجدولة دالة `telegram-group-dispatch`؛ تستخدم الدالة أسرار Telegram الموجودة على الخادم وترسل قالب المجموعة المختصر. لا يوضع توكن البوت في SQL أو في إعداد Cron.
* **الدالة:** نُشرت `telegram-group-dispatch` إلى TrainerPro عبر Supabase CLI باستخدام `--use-api`، وأظهرت قائمة الدوال أنها نشطة. تتحقق الدالة من مفتاح Supabase السري ومن ترويسة `x-telegram-dispatch-secret` قبل معالجة الطابور. لم يُرسل اختبار Telegram فعلي في هذه الخطوة.
* **أسرار Edge Function:** أسماء `TELEGRAM_BOT_TOKEN` و`TELEGRAM_ADMIN_GROUP_CHAT_ID` و`TELEGRAM_DISPATCH_SECRET` موجودة وفق فحص أسماء الأسرار؛ لم تُقرأ القيم أو تُعرض.
* **Vault وCron:** أفاد المشغّل بإضافة أسرار Vault المسماة `project_url` و`supabase_secret_api_key` و`telegram_dispatch_secret`، وبإنشاء مهمة `telegram-group-dispatch-every-minute` بجدول `* * * * *`. بعد تفعيل `pg_net` أظهرت اللوحة نجاح استعلام Cron. ثم أفاد المشغّل بتحديث مفتاح Vault إلى Secret API key وتدوير السر المشترك `TELEGRAM_DISPATCH_SECRET` و`telegram_dispatch_secret` إلى قيمة موحدة جديدة. أظهر استدعاء Cron دوري لاحق استجابة HTTP 200 من الدالة مع `processed: 0` و`sent: 0`؛ هذا دليل مُبلّغ عنه على اجتياز المصادقة في ذلك الاستدعاء، لكنه لا يثبت إرسال رسالة إلى Telegram. لم تُفحص الأسرار أو تُعرض قيمها، ولم يُجر تحقق مستقل من لوحة المشروع في هذه الخطوة.
* **اختبار الدخول الفعلي (22 أكتوبر 2026):** بعد تصحيح وجهة الجروب، استعلام قراءة فقط مستقل على TrainerPro أظهر إشعارَي `auth.login_succeeded` بحالة `sent`، محاولة واحدة لكل منهما، ووقت `sent_at` مسجّل. هذا يؤكد نجاح تسجيل الإرسال إلى Telegram في قاعدة البيانات، لكن لم تُفحص واجهة الجروب بصرياً في هذه الخطوة. لا حاجة لإنشاء تسجيل دخول اختباري إضافي.
* **Telegram notification language (historical note from 22 October; superseded by the current delivery status above):** The shared group template supports Arabic and English, with Arabic as the default. Migration `20261023110000_telegram_notification_language.sql` was applied only to TrainerPro through Supabase CLI and recorded as applied. A read-only postflight confirmed the singleton setting row, `group_language = ar`, RLS enabled and forced, and the migration history entry. At that time, `telegram-group-dispatch` was version 6, the language selector was local, and the only Vercel project found was configured as Next.js. Do not expose secrets in chat.
