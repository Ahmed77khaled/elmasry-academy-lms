const roleNames: Record<string, string> = {
  superadmin: 'مدير النظام',
  academy_manager: 'مدير الأكاديمية',
  finance_manager: 'مسؤول الشؤون المالية',
};

const permissionDescriptions: Record<string, string> = {
  'dashboard.operational.read': 'عرض مؤشرات الأداء والتشغيل.',
  'dashboard.finance.read': 'عرض المؤشرات والملخصات المالية.',
  'students.read': 'عرض البيانات الأساسية للطلاب.',
  'students.read_contact_phone': 'عرض أرقام هواتف الطلاب للتواصل معهم.',
  'students.email.read': 'عرض عناوين البريد الإلكتروني للطلاب.',
  'students.email.update': 'إضافة عناوين البريد الإلكتروني للطلاب أو تحديثها.',
  'students.create': 'إضافة سجلات للطلاب.',
  'students.update': 'تعديل البيانات المسموح بها للطلاب.',
  'students.archive': 'أرشفة سجلات الطلاب.',
  'students.export': 'تصدير بيانات الطلاب المسموح بعرضها.',
  'courses.read': 'عرض بيانات الدورات.',
  'courses.create': 'إضافة دورات جديدة.',
  'courses.update': 'تعديل البيانات المسموح بها للدورات.',
  'courses.close': 'إغلاق الدورات.',
  'courses.pricing.read': 'عرض أسعار الدورات.',
  'courses.pricing.update': 'إضافة أسعار الدورات أو تعديلها.',
  'courses.export': 'تصدير بيانات الدورات المسموح بعرضها.',
  'enrollments.read': 'عرض بيانات تسجيل الطلاب في الدورات.',
  'enrollments.create': 'تسجيل الطلاب بالسعر المحدد للدورة.',
  'enrollments.update_status': 'تعديل حالة تسجيل الطالب.',
  'enrollments.financial.read': 'عرض الرسوم والمدفوعات والأرصدة وحالة السداد.',
  'enrollments.pricing.override': 'تحديد سعر تسجيل مختلف عن السعر الافتراضي.',
  'enrollments.export': 'تصدير بيانات التسجيل المسموح بعرضها.',
  'finance.payments.read': 'عرض سجلات المدفوعات.',
  'finance.payments.record': 'تسجيل مدفوعات جديدة.',
  'finance.payments.void': 'إلغاء سندات المدفوعات.',
  'finance.payments.export': 'تصدير سجلات المدفوعات.',
  'finance.expenses.read': 'عرض سجلات المصروفات.',
  'finance.expenses.record': 'تسجيل مصروفات جديدة.',
  'finance.expenses.void': 'إلغاء سندات المصروفات.',
  'finance.expenses.export': 'تصدير سجلات المصروفات.',
  'finance.cash_boxes.read': 'عرض الخزن وأرصدتها.',
  'finance.cash_boxes.update': 'تعديل بيانات الخزن المسموح بتعديلها.',
  'finance.cash_boxes.create': 'إنشاء خزن جديدة.',
  'finance.cash_boxes.archive': 'أرشفة الخزن.',
  'finance.transfers.read': 'عرض سجلات التحويل بين الخزن.',
  'finance.transfers.create': 'تحويل الأموال بين الخزن.',
  'finance.reports.read': 'عرض التقارير المالية.',
  'finance.reports.export': 'تصدير التقارير المالية.',
  'admins.read': 'عرض حسابات المديرين.',
  'admins.invite': 'إرسال دعوات للمديرين.',
  'admins.assign_role': 'تعيين الأدوار للمديرين.',
  'admins.disable': 'إيقاف حسابات المديرين أو إعادة تفعيلها.',
  'roles.read': 'عرض الأدوار والصلاحيات.',
  'roles.create': 'إنشاء أدوار مخصصة.',
  'roles.update': 'تعديل صلاحيات الأدوار المخصصة.',
  'roles.delete': 'حذف الأدوار المخصصة.',
  'audit.read': 'عرض سجل تغييرات المديرين والصلاحيات.',
};

const auditActionNames: Record<string, string> = {
  owner_claimed: 'تعيين مالك المنصة',
  owner_transferred: 'نقل ملكية المنصة',
  owner_added: 'إضافة مالك للمنصة',
  owner_removed: 'إلغاء صفة مالك المنصة',
  admin_invited: 'دعوة مدير',
  admin_role_changed: 'تغيير دور مدير',
  admin_disabled: 'إيقاف حساب مدير',
  admin_enabled: 'إعادة تفعيل حساب مدير',
  role_created: 'إنشاء دور',
  role_updated: 'تعديل دور',
  role_deleted: 'حذف دور',
  role_permissions_changed: 'تعديل صلاحيات دور',
};

export function getRoleDisplayName(roleKey: string, fallback?: string | null): string {
  return translate(roleNames[roleKey] ?? fallback ?? 'مدير بصلاحيات مخصصة');
}

export function getAdminDisplayName(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
} | null | undefined): string {
  const fullName = user?.user_metadata?.full_name;
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();
  return user?.email?.trim() || translate('مدير');
}

export function getPermissionDescription(permissionKey: string, fallback: string): string {
  return translate(permissionDescriptions[permissionKey] ?? fallback);
}

export function getAuditActionName(action: string): string {
  return translate(auditActionNames[action] ?? action);
}
import { translate } from '@/lib/translations';

