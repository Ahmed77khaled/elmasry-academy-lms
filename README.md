# أكاديمية المصري — نظام إدارة التدريب (Elmasry Academy LMS)

> **منصة سحابية متكاملة لإدارة المتدربين، الدورات التدريبية، الاشتراكات، والمالية والخزن لأكاديمية م/ محمد المصري.**  
> **System Architecture & Lead Engineering:** Eng. Ahmed El-Falah (م/ أحمد الفلاح)  
> **Supervised by:** Eng. Mohamed Elmasry (م/ محمد المصري)

---

## 🌟 نظرة عامة (Overview)

نظام إدارة تدريب ومحاسبة مصمم خصيصاً لتلبية احتياجات إدارة مراكز التدريب المتخصصة في هندسة النظم والشبكات وتقنية المعلومات. يعتمد النظام مبدأ **قاعدة البيانات كالمصدر الوحيد للحقيقة (Database-Driven Single Source of Truth)** عبر PostgreSQL وSupabase، مع واجهة مستخدم حديثة وسريعة مبنية بـ React + TypeScript + Tailwind CSS تدعم اللغة العربية بالكامل (RTL First).

---

## 🛠️ المكدس التقني (Tech Stack)

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons.
- **Backend & Database:** Supabase Cloud (PostgreSQL 15+).
- **Security & Concurrency:** Row Level Security (RLS), `SECURITY DEFINER` RPC functions with explicit row locking (`FOR UPDATE`), Audit Logging.
- **Direction & Localization:** Full Arabic RTL interface (`dir="rtl"`), Cairo & Inter fonts, Egyptian Pound formatting (`ج.م`).

---

## 🚀 التشغيل المحلي (Local Setup)

```bash
# 1. تثبيت الحزم
npm install

# 2. إعداد المتغيرات البيئية
cp .env.example .env
# قم بملء VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY

# 3. تشغيل سيرفر التطوير
npm run dev
```

---

## 📂 المجلدات والمستندات الرئيسية

- `src/`: الكود المصدري للواجهة والمكونات والصفحات وإدارة الحالة.
- `supabase/migrations/`: ملفات التهيئة البرمجية لقاعدة البيانات (الجداول، الـ Views، الـ RPCs، الـ RLS).
- `المرجع_الشامل_لنظام_أكاديمية_المصري_LMS.md`: المرجع التقني والتشغيلي الشامل للنظام.

## ⚠️ حالة قاعدة البيانات والترحيلات — تحديث 13 نوفمبر 2026

المشروع الحي TrainerPro يستخدم مخططًا أحدث من أول أربع migrations، وسجل الأدلة الحالي يرصد 20 ملف migration محليًا مقابل 4 إصدارات مسجلة في `schema_migrations`. لذلك لا تعتبر سلسلة migrations الحالية قابلة لإعادة الإنشاء من الصفر أو متصالحة تلقائيًا مع Production.

تم إنشاء بيئة Staging منفصلة واستخدامها لتنفيذ أول ثلاثة إصلاحات Phase 0. هذه الإصلاحات لم تُعتمد على Production، وما زالت هناك اختبارات ومراجعة لصلاحيات الدوال وMigration Ledger. الإصلاح الرابع الخاص بالفيوز المالية ما زال HOLD.

**ممنوع حاليًا:** `supabase db push` أو `supabase db reset` أو `supabase migration repair` أو تعديل `schema_migrations` يدويًا أو تنفيذ SQL تغييري على Production.

مصدر الحالة الحالية:
- `docs/phase0/CODEX_HANDOFF.md`
- `docs/phase0/review/PHASE0_STATUS_AR.md`
- `docs/phase0/review/SUPABASE_LIFECYCLE_AND_SQL_AUDIT.md`

## 📜 الترخيص والملكية (License & Ownership)
جميع الحقوق محفوظة © 2026 لأكاديمية م/ محمد المصري وم/ أحمد الفلاح.
