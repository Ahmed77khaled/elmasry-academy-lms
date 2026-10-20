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

## ⚠️ حالة ترحيلات قاعدة البيانات

تمت مطابقة المشروع الحي `TrainerPro` في 21 أكتوبر 2026 مع الكود. مخطط قاعدة الإنتاج يستخدم مفاتيح مثل `payment_id` و`cash_box_transfers`، بينما ملفات `001`–`004` الموجودة في هذا المستودع تمثل مخططًا أوليًا أقدم (`id` و`cash_transfers`) ولا تطابق قاعدة الإنتاج. كما أن سجل migrations في المشروع الحي كان فارغًا وقت الفحص.

لذلك أُضيفت migration التقوية `202610210005_production_hardening.sql` لاستهداف **المخطط الحي الحالي فقط**، وبها فحص مسبق يرفض التنفيذ إذا لم يجد البنية المتوقعة. لا تستخدم `supabase db reset` أو `supabase db push` على قاعدة الإنتاج، ولا تعتبر السلسلة الحالية قابلة لإعادة الإنشاء من الصفر، قبل تسوية خط الأساس وسجل migrations. هذه migration مقترحة ولم تُطبّق على قاعدة البيانات؛ طبّقها بعد مراجعتها وبالتنسيق مع نشر الواجهة المتوافقة معها.

---

## 📜 الترخيص والملكية (License & Ownership)
جميع الحقوق محفوظة © 2026 لأكاديمية م/ محمد المصري وم/ أحمد الفلاح.
