# UI terminology and localization standard

The Arabic interface uses concise Modern Standard Arabic. The English interface uses clear, neutral product English. Both languages must use the same concept consistently across navigation, forms, tables, alerts, receipts, exports, and permission screens.

| Concept | Arabic | English |
| --- | --- | --- |
| Academy | أكاديمية المصري | Elmasry Academy |
| Training course | الدورة التدريبية | Training course |
| Student | الطالب | Student |
| Enrollment in a course | تسجيل الطالب في دورة تدريبية | Course enrollment |
| Payment | الدفعة | Payment |
| Payment receipt | سند السداد | Payment receipt |
| Expense | المصروف | Expense |
| Cash box | الخزنة; plural: الخزائن | Cash box; plural: cash boxes |
| Platform owner | مالك المنصة | Platform owner |
| System administrator | مدير النظام | System administrator |
| Internal role identifier | معرّف الدور (للاستخدام الداخلي) | Internal role ID |
| Permission | الصلاحية | Permission |
| Permission history | سجل تغييرات الصلاحيات | Permission change log |
| Archive | أرشفة | Archive |
| Void a financial record | إلغاء السند | Void a receipt |
| Outstanding balance | المبلغ المتبقي | Balance due |
| Opening balance | الرصيد الافتتاحي | Opening balance |
| Profile photo | الصورة الشخصية | Profile photo |
| Academy logo | شعار الأكاديمية | Academy logo |

## Writing rules

- Use «الدورة التدريبية» instead of «الكورس» and «الدورات التدريبية» instead of «الكورسات».
- Use «تسجيل» for enrollment actions and «تسجيلات الدورات» for the enrollment register. Avoid using «اشتراك» for this workflow.
- Use «الخزنة / الخزائن» consistently. Avoid «الخزن» and «صناديق المال» in labels where the financial meaning is already clear.
- Use «نقدًا» for the cash payment method. Keep product names such as «فودافون كاش» and «إنستاباي» unchanged.
- Avoid colloquial words such as «أونلاين» in labels; use a precise phrase such as «محفظة إلكترونية» where appropriate.
- Write actions as verbs, keep field labels short, and make error messages say what failed and what the user can do next.
- Keep user-entered names, course names, and role names as entered; localization applies to interface copy, not user data.

## Language behavior

- The language choice is saved in this browser and applies to the active interface without clearing open form state.
- Arabic uses right-to-left direction and Arabic date/number formatting. English uses left-to-right direction and English date/number formatting.
- File exports and WhatsApp payment confirmations follow the selected language. Personal names and academy data remain unchanged.
