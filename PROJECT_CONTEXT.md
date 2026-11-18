# Password recovery link flow (2026-10-23)
- The previously invited academy-manager account is already active in TrainerPro, so a duplicate invite is not appropriate. The login screen now offers bilingual password-recovery email requests, and the existing password setup page recognizes Supabase `recovery` links as well as `invite` links. The request uses the deployed app origin as its redirect and shows a generic success message to avoid account enumeration.
- `npm run typecheck` and `npm run build` passed. Deployed to the Cloudflare Pages Preview branch on 23 October 2026 (`https://preview.elmasry-academy-lms.pages.dev`, immutable deployment `https://e35a6cff.elmasry-academy-lms.pages.dev`). The Preview returned HTTP 200; its served login bundle contains the recovery request action and the password setup bundle includes recovery copy. A recovery email request for the existing active academy-manager account returned Supabase Auth `unexpected_failure`; delivery is unconfirmed. Do not repeat the request until the Auth/SMTP failure is investigated. No password was changed.

# Live Supabase authorization cutover (2026-10-23)
- Applied `supabase/migrations/20261022230000_rbac_authorization_cutover.sql` to the linked, healthy TrainerPro project (`urmkcixqpoqkiosihhal`) using `supabase db query --linked --file`; recorded only this migration version as applied with `supabase migration repair`. The migration's SHA-256 before application was `F0CD46CA95EC75C54A176594A9E3BA01A1B2DB61A5C013C90FF517E9CE0ED68A`.
- Preflight immediately before application confirmed all 41 exact required function signatures exist, are SECURITY DEFINER owned by a BYPASSRLS/superuser role, `private` exists, and one active platform owner exists. The complete migration also passed execution on a synthetic PGlite fixture before applying to TrainerPro.
- Postflight passed all five checks: authenticated/anon direct access was removed from the protected tables and financial views (including PostgreSQL 17 MAINTAIN/TRUNCATE/REFERENCES/TRIGGER privileges); execution of all eight legacy write RPCs was revoked; RBAC RPCs remain SECURITY DEFINER with safe owners and are executable by authenticated but not anon; receipt sequence access is revoked; service_role SELECT/INSERT access remains.
- Static scan of 79 frontend `.rpc()` calls found no calls to the eight legacy write RPCs. A post-cutover authenticated, read-only browser smoke test using the existing platform-owner session then loaded Dashboard, Students, Courses, Enrollments, Payments, Expenses, Cash Boxes, and Settings; each showed the permission-verified state. No data was modified. A restricted-role account and write flows have not yet been tested.
- The remote migration ledger now records three versions, including `20261022230000`; 15 of the 18 local migration files remain absent remotely. Do not run `supabase db push`, reset the database, or replay the local migration chain; the broader historical mismatch still needs a reviewed baseline plan.
- This change modified database privileges and one migration-history entry only. No row data was changed, no project was reset, and no function, frontend, SMTP setting, invitation, commit, or push was performed.
- The read-only postflight query is saved at `supabase/verification/rbac_authorization_cutover_postflight.sql` for future verification.

# Current delivery status (2026-10-23)
- Admin invitation email: a branded bilingual template is prepared locally and personalizes the subject/body from the selected role and current RBAC permission catalog. The user reports completing Resend SMTP setup in Supabase, but the shared screenshot showed Authentication → Emails → Templates, not SMTP Settings, so the SMTP values/domain verification have not been independently verified. The hosted Invite User template has not been confirmed updated, and the modified local `admin-invite` function/template have not been deployed. Never store or request the Resend API key in chat or project files. The previously proposed recipient already has an active admin account; do not send a duplicate invite.
- Supabase email configuration decision: use Supabase Auth templates to control message content, and a custom SMTP service (Resend or another provider) to deliver messages to users. The built-in Supabase SMTP is for limited testing and is restricted to project-team addresses with a low rate limit; it is not a production substitute. The Emails page's “Magic link or OTP” is a passwordless sign-in method (one-time password/link), not an email provider. The “Invite user” template is the relevant template for administrator invitations; security notification toggles are separate and optional.
- Resend SMTP values (no credentials recorded): host `smtp.resend.com`, port `465`, username `resend`, password is a private Resend API key, and sender address must use a verified domain. Recommended static sender name: `Elmasry Academy`. The local invitation template now also includes the inviter's display name in the body, sourced from the authenticated user's `full_name` metadata and HTML-escaped, with Arabic/English platform-owner fallbacks when absent. This is local-only until deployed and pasted into the hosted Invite User template.
- Invitation password setup: added a bilingual first-password screen for a verified Supabase invite session (`src/pages/SetPasswordPage.tsx`) and invite-link detection in `src/lib/supabase.ts`. `typecheck`, `lint`, and `build` passed. Deployed to the Cloudflare Pages Preview branch on 23 October 2026; a live invite acceptance still needs a fresh, valid invitation link. The normal sign-in page continues to accept an existing password, so invitees should open their invitation link to set one through the new flow.
- Remaining invite-email rollout: independently verify that custom SMTP is enabled and the sender domain is verified; update the hosted Supabase Invite User template from `supabase/templates/admin-invite.html`; deploy the updated `admin-invite` Edge Function; then verify with a new, eligible test recipient (not the already-active admin). Role permissions in the email are a snapshot, not proof that least-privilege database enforcement is complete. The RBAC cutover migration is now applied and recorded as version `20261022230000`; its postflight passed on TrainerPro. No exact clone was available, so it was also tested on a synthetic PGlite fixture before application.
- Preview/RBAC preflight (23 October): local application data calls use the permission-checked `rbac_*` RPC endpoints; direct Supabase `.from()` calls in `src` are Storage operations. Review of `20261022230000_rbac_authorization_cutover.sql` confirms it revokes direct table/view/sequence privileges and legacy RPCs after checking required endpoints. It was executed successfully against a synthetic PostgreSQL-compatible PGlite fixture. Read-only checks against live TrainerPro confirmed all 41 exact required function signatures and secure owners, but this is not a clone of the live schema. Supabase CLI works through `npx`; `psql` and Docker Engine are unavailable. The migration is applied; keep the successful postflight as the baseline and do not reconcile the remaining migration history with `db push`.
- Local checks on 23 October passed: `npm run typecheck`, `npm run lint`, `npm run build`, and `deno check supabase/functions/admin-invite/index.ts` (run via temporary npm-exec Deno). The cutover migration was executed successfully against a synthetic PGlite fixture and applied to TrainerPro; its live postflight passed. No other hosted migration, function deployment, SMTP change, invitation, commit, push, or frontend deployment was performed in this review.

- Repository branch `main` is kept synchronized with `origin/main` after each verified closure update. Optional course start and end dates were added to the create/edit form and the course list/details views in commit `1df8514`; the database RPCs already accepted these fields, so no SQL or migration was needed. End dates cannot precede start dates.
- The Vite frontend is automatically deployed from `main` to the Cloudflare Pages Preview branch at https://preview.elmasry-academy-lms.pages.dev/. The latest deployment for optional course dates completed successfully; the preview returns HTTP 200 and its deployed lazy-loaded course form, list, and details bundles contain the date support. No production domain or production deployment was configured in this work.
- The frontend build toolchain is Vite 8 and Tailwind CSS 4. `npm audit` reports zero vulnerabilities. `typecheck`, clean `lint` (zero warnings), `build`, and the 12-test offline Telegram suite pass. Application pages are lazy-loaded; the largest generated JavaScript chunk is about 180 kB, with no oversized-chunk warning.
- GitHub workflows use `actions/checkout@v7` and the preview deploy workflow is pinned to `ubuntu-24.04`; its Node setup action is `actions/setup-node@v7` with Node.js 22 for the Vite build.
- Supabase Auth Site URL is set to the Cloudflare Preview origin, and that origin was already present in allowed Redirect URLs. An authenticated, read-only Preview smoke test confirmed the Dashboard, Students, Courses, Enrollments, Payments, Expenses, Cash Boxes, and Settings pages load in the existing platform-owner session. Arabic/English UI switching was checked on Enrollments and Settings. The admin list showed the proposed invitation recipient as an active academy manager; no duplicate invitation was sent. No financial mutation was performed.
- Supabase functions were read-only inventoried after deploying only `login-alert`: `login-alert` v12 ACTIVE, `telegram-group-dispatch` v6 ACTIVE, and `admin-invite` v1 ACTIVE. JWT gateway verification remains disabled for all three; handlers perform their own checks.
- The RBAC cutover was applied on 2026-10-23 and recorded in the remote migration ledger. The broader migration bootstrap mismatch remains unresolved; do not use `db push` until a reviewed baseline plan exists.
- The post-cutover authenticated Preview smoke test covered owner read-only navigation only; a restricted-role session is still needed to verify allowed/denied access. Invitation delivery, fresh sign-in, manual create/edit display of course dates, and create/update/delete financial flows remain unverified. Do not send another invitation to the already active admin account without confirming the intended change. Do not share credentials. The earlier token exposure note still applies: revoke any Cloudflare token pasted into chat and keep only its rotated replacement in GitHub secrets.

## Completion estimate and remaining release gates (2026-10-23)

This is a practical estimate from the work recorded here, not a measured code-coverage percentage: the application is approximately **75% complete for a usable release**. The core app and Cloudflare Preview are in place, and the live RBAC privilege cutover is applied and passed its catalog postflight. The remaining quarter is mostly release verification and production setup; the application must not be described as production-ready yet.

Before calling the release ready, complete these gates:
- [x] Deploy the bilingual invitation password setup page to Cloudflare Pages Preview; verify the page returns HTTP 200 and the served bundle contains the password update flow.
- [ ] Complete one end-to-end invitation acceptance with a fresh, valid invite: the invited administrator opens the email link, sets and confirms their password on Preview, then signs in. If the old link has expired, send a new invitation only to an eligible test recipient who does not already have an Auth account.
- [ ] Run an authenticated Preview smoke test after the RBAC cutover: verify owner access, a restricted-role account's allowed and denied pages/actions, and critical student/course/enrollment/financial flows. Use safe test records and avoid financial mutations in live data.
- [ ] Finish invitation email setup: independently verify custom SMTP and sender-domain status, update the hosted Supabase Invite User template, deploy the reviewed role-aware `admin-invite` function/template, and verify delivery with an eligible test recipient.
- [ ] Decide the production hostname and configure the Cloudflare production deployment plus matching Supabase Auth Site URL and redirect allow-list. The current verified deployment is Preview only.
- [ ] Resolve the historical migration-ledger mismatch with a reviewed baseline/reconciliation plan. Until then, do not run `supabase db push`, reset, or replay migrations.
- [ ] Confirm production operations before launch: database backup/restore procedure, error monitoring, and a rollback path for frontend and Edge Function releases.

The current known deployment and email constraints are detailed in `docs/ADMIN_INVITATION_DEPLOYMENT_CHECKLIST.md`; the RBAC migration postflight is in `supabase/verification/rbac_authorization_cutover_postflight.sql`.

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

### Supabase Auth security email alerts (23 October 2026)

Enabled and saved all seven project-level security notification emails for TrainerPro in Authentication → Emails → Security: password changed, email address changed, phone number changed, sign-in method linked, sign-in method removed, MFA method added, and MFA method removed. Supabase displayed “Successfully updated settings” after saving. These alerts are sent when the matching account change occurs; enabling them does not send a test email or change the authentication templates or SMTP configuration. Supabase documents these as project-level opt-in security notifications: https://supabase.com/docs/guides/auth/auth-email-templates.

### Invitation password setup Preview deployment (23 October 2026)

Deployed the bilingual first-password setup flow to the Cloudflare Pages Preview branch only. `https://preview.elmasry-academy-lms.pages.dev/` returned HTTP 200, and the deployed JavaScript bundle contained both the Supabase password-update call and invitation setup copy. The immutable deployment URL is `https://5d4ba6b8.elmasry-academy-lms.pages.dev`. This is not a Production deployment. A live end-to-end check still requires opening a fresh, valid Supabase invitation link; do not share the link or its token in chat.
## Student directory and platform roadmap (30 October 2026)

- Phase 1 is implemented locally: optional country/governorate, workplace, and study-year fields; conditional fields in both standard and quick-add student forms; an RBAC-protected paginated student directory with employment/year filters and active-course summary; double-click student name to open edit modal; removed row-level preview/edit/action buttons; student detail page shows new fields; Excel export excludes creation date and includes the new fields/course summary.
- Both enrollment dialogs now have independent course-name and student-name search inputs. Student CSV export now fetches every matching row in bounded server pages (up to a guarded 50,000-row export) instead of only the visible page. Course resource links use explicit HTTP(S) URLs, include a copy-link action, and report clipboard failures accessibly. Enrollment status already includes `Dropped`; that path updates enrollment status and keeps the student and payment ledger intact.
- Applied `supabase/migrations/20261030120000_student_profile_directory_v2.sql` to TrainerPro on 30 October 2026 in one transaction, then recorded version `20261030120000` in `supabase_migrations.schema_migrations`. Postflight confirmed the four optional student columns, all three RPC signatures, and EXECUTE grants only for `authenticated` (not `anon` or `PUBLIC`). The existing student counts and records were not updated by this additive migration. Frontend Preview deployment is still pending; the remaining roadmap phases must be implemented before full acceptance.
- Local checks for this batch: `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` passed. No PostgreSQL server/PGlite is available in the current workspace, so SQL has not had runtime execution validation.
- Follow-up phases from the approved roadmap remain: dual-currency course pricing with enrollment/payment/cashbox-safe currency accounting; searchable student/course enrollment selectors and soft withdrawal; pagination for all core tables; dashboard and full transaction history; treasury review/activation; final bilingual/security review and Preview acceptance. Keep currency totals separated; never aggregate EGP and USD as one balance. No additional remote SQL, hosted settings, Production deployment, commit, or push was performed in this follow-up.


### Student profile migration applied (30 October 2026)

- TrainerPro migration `20261030120000` was applied transactionally using the linked Supabase CLI database query path to avoid replaying unrecorded legacy migrations. The migration ledger now contains `20261030120000`; the existing migration-history mismatch remains documented and `db push` is still unsafe until reconciled.
- Postflight verified the optional columns and RPCs, with authenticated-only function execution. No student rows were inserted or modified.
- This does not mean the application rollout is complete. The frontend now depends on these RPCs, and Preview deployment plus role-aware runtime checks remain pending alongside roadmap phases 2?5.

### Phase 2 — dual-currency pricing (local implementation, 30 October 2026)

- Added the local migration draft `supabase/migrations/20261030130000_course_enrollment_currency_v2.sql`. It adds optional USD course pricing; snapshots EGP/USD currency on enrollments and payments; adds USD opening balances for cash boxes; creates permission-checked v2 RPCs; keeps old aggregate reports scoped to EGP; adds separate USD dashboard and per-course figures; and revokes direct authenticated access to `public.record_payment` so payment writes use the RBAC endpoint.
- Updated course pricing, enrollment, quick enrollment, payment, receipt, cash box, dashboard, course detail, and enrollment detail views to show currency-specific amounts. EGP and USD totals are displayed separately. Existing records default to EGP; no currency conversion or historical value changes are performed.
- Enrollment selectors now submit the chosen currency; server-side enrollment creation snapshots that currency and the current default price. Payment creation derives the currency from the locked enrollment, checks overpayment in that currency, and cash-box balances separate USD inflows from EGP expenses/transfers.
- Local checks passed after the UI changes: `npm run typecheck`, `npm run lint`, `npm run build`. SQL has not been executed against TrainerPro; no Preview deployment, Production deployment, commit, or push was made. The migration-history mismatch remains; do not use `supabase db push`.
- Before this migration can be applied, validate it against a disposable PostgreSQL/Supabase database, review the exact production preflight and backup/rollback plan, then apply only the approved migration without replaying legacy files. Until then, the dual-currency UI is not deployable to the current hosted database.
