type PermissionCopy = { ar: string; en: string };

const roleNames: Record<string, { ar: string; en: string }> = {
  academy_manager: { ar: "مدير الأكاديمية", en: "Academy Manager" },
  finance_manager: { ar: "مسؤول الشؤون المالية", en: "Finance Manager" },
  secretary: { ar: "سكرتير الأكاديمية", en: "Academy Secretary" },
  academy_secretary: { ar: "سكرتير الأكاديمية", en: "Academy Secretary" },
  student_secretary: { ar: "سكرتير شؤون الطلاب", en: "Student Affairs Secretary" },
  accountant: { ar: "مسؤول الحسابات", en: "Accounts Officer" },
  accounting_manager: { ar: "مدير الحسابات", en: "Accounts Manager" },
};

const permissionNames: Record<string, PermissionCopy> = {
  "dashboard.operational.read": { ar: "عرض مؤشرات الأداء والتشغيل", en: "View operational dashboard metrics" },
  "dashboard.finance.read": { ar: "عرض المؤشرات والملخصات المالية", en: "View financial dashboard metrics" },
  "students.read": { ar: "عرض سجلات الطلاب المسموح بها", en: "View permitted student records" },
  "students.read_contact_phone": { ar: "عرض أرقام هواتف الطلاب للمتابعة", en: "View student phone numbers for follow-up" },
  "students.email.read": { ar: "عرض عناوين البريد الإلكتروني للطلاب", en: "View student email addresses" },
  "students.email.update": { ar: "إضافة عناوين بريد الطلاب أو تحديثها", en: "Add or update student email addresses" },
  "students.create": { ar: "إضافة سجلات طلاب", en: "Create student records" },
  "students.update": { ar: "تعديل بيانات الطلاب المسموح بها", en: "Edit permitted student fields" },
  "students.archive": { ar: "أرشفة سجلات الطلاب", en: "Archive student records" },
  "students.export": { ar: "تصدير بيانات الطلاب المسموح بها", en: "Export permitted student data" },
  "courses.read": { ar: "عرض بيانات الدورات التدريبية", en: "View course records" },
  "courses.create": { ar: "إنشاء دورات تدريبية", en: "Create courses" },
  "courses.update": { ar: "تعديل بيانات الدورات المسموح بها", en: "Edit permitted course fields" },
  "courses.close": { ar: "إغلاق الدورات التدريبية", en: "Close courses" },
  "courses.pricing.read": { ar: "عرض أسعار الدورات", en: "View course prices" },
  "courses.pricing.update": { ar: "إضافة أسعار الدورات أو تعديلها", en: "Add or update course prices" },
  "courses.export": { ar: "تصدير بيانات الدورات المسموح بها", en: "Export permitted course data" },
  "enrollments.read": { ar: "عرض بيانات تسجيل الطلاب في الدورات", en: "View student enrollment records" },
  "enrollments.create": { ar: "تسجيل الطلاب بالسعر الافتراضي للدورة", en: "Enroll students at the course default price" },
  "enrollments.update_status": { ar: "تحديث حالة تسجيل الطالب", en: "Update enrollment status" },
  "enrollments.financial.read": { ar: "عرض الرسوم والمدفوعات والأرصدة وحالة السداد", en: "View fees, payments, balances, and payment status" },
  "enrollments.pricing.override": { ar: "تحديد سعر تسجيل مختلف عن السعر الافتراضي", en: "Set a non-default enrollment price" },
  "enrollments.export": { ar: "تصدير بيانات التسجيل المسموح بها", en: "Export permitted enrollment data" },
  "finance.payments.read": { ar: "عرض سجلات المدفوعات", en: "View payment records" },
  "finance.payments.record": { ar: "تسجيل مدفوعات جديدة", en: "Record payments" },
  "finance.payments.void": { ar: "إلغاء سجلات المدفوعات وفق الإجراء المعتمد", en: "Void payment records" },
  "finance.payments.export": { ar: "تصدير سجلات المدفوعات", en: "Export payment records" },
  "finance.expenses.read": { ar: "عرض سجلات المصروفات", en: "View expense records" },
  "finance.expenses.record": { ar: "تسجيل مصروفات جديدة", en: "Record expenses" },
  "finance.expenses.void": { ar: "إلغاء سجلات المصروفات وفق الإجراء المعتمد", en: "Void expense records" },
  "finance.expenses.export": { ar: "تصدير سجلات المصروفات", en: "Export expense records" },
  "finance.cash_boxes.read": { ar: "عرض الخزائن وأرصدتها", en: "View cash boxes and balances" },
  "finance.cash_boxes.update": { ar: "تعديل بيانات الخزائن المسموح بها", en: "Update approved cash-box details" },
  "finance.cash_boxes.create": { ar: "إنشاء خزائن جديدة", en: "Create cash boxes" },
  "finance.cash_boxes.archive": { ar: "أرشفة الخزائن", en: "Archive cash boxes" },
  "finance.transfers.read": { ar: "عرض التحويلات بين الخزائن", en: "View cash-box transfers" },
  "finance.transfers.create": { ar: "تحويل الأموال بين الخزائن", en: "Transfer funds between cash boxes" },
  "finance.reports.read": { ar: "عرض التقارير المالية", en: "View financial reports" },
  "finance.reports.export": { ar: "تصدير التقارير المالية", en: "Export financial reports" },
  "admins.read": { ar: "عرض حسابات المشرفين", en: "View administrator accounts" },
  "admins.invite": { ar: "إرسال دعوات للمشرفين", en: "Invite administrators" },
  "admins.assign_role": { ar: "تعيين الأدوار للمشرفين", en: "Assign administrator roles" },
  "admins.disable": { ar: "إيقاف حسابات المشرفين أو إعادة تفعيلها", en: "Disable or re-enable administrator accounts" },
  "roles.read": { ar: "عرض الأدوار والصلاحيات", en: "View roles and permissions" },
  "roles.create": { ar: "إنشاء أدوار مخصصة", en: "Create custom roles" },
  "roles.update": { ar: "تعديل صلاحيات الأدوار المخصصة", en: "Update custom role permissions" },
  "roles.delete": { ar: "حذف الأدوار المخصصة", en: "Delete custom roles" },
  "audit.read": { ar: "عرض سجل تغييرات المشرفين والصلاحيات", en: "View administrator and permission audit events" },
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function humanizeRoleKey(roleKey: string): string {
  return roleKey
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function safeSubjectValue(value: string): string {
  const normalized = value.replace(/[\r\n]+/g, " ").trim();
  return Array.from(normalized)
    .filter((character) => {
      const codePoint = character.charCodeAt(0);
      return codePoint >= 0x20 && codePoint !== 0x7f;
    })
    .join("")
    .slice(0, 80);
}

export function buildAdminInviteEmailData(
  roleKey: string,
  displayName: string,
  permissions: Array<{ permission_key: string; description: string }>,
  inviterDisplayName: string,
) {
  const roleName = roleNames[roleKey];
  const customName = displayName.trim() || humanizeRoleKey(roleKey);
  const arabicRoleName = roleName?.ar ?? customName;
  const englishRoleName = roleName?.en ?? (/[\u0600-\u06ff]/.test(customName) ? humanizeRoleKey(roleKey) : customName);
  const safeInviterName = inviterDisplayName.trim();
  const permissionItems = permissions.map(({ permission_key, description }) => {
    const copy = permissionNames[permission_key];
    return {
      ar: escapeHtml(copy?.ar ?? "صلاحية إضافية مخصصة لهذا الدور"),
      en: escapeHtml(copy?.en ?? (description.trim() || "Additional role permission")),
    };
  });

  return {
    invitation_role_name_subject: safeSubjectValue(arabicRoleName),
    invitation_role_name_ar: escapeHtml(arabicRoleName),
    invitation_role_name_en: escapeHtml(englishRoleName),
    invitation_sent_by_name_ar: escapeHtml(safeInviterName || "مالك المنصة"),
    invitation_sent_by_name_en: escapeHtml(safeInviterName || "Platform Owner"),
    invitation_permission_items: permissionItems,
    invitation_permission_count: permissionItems.length,
  };
}
