import { translate, translateTemplate, formatCountPhrase } from '@/lib/translations';
import { useLocale } from '@/context/useLocale';
import { useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, UserCog, Pencil, Trash2, History, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Alert } from '@/components/ui/Alert';
import { PageLoader } from '@/components/ui/Feedback';
import { useAuth } from '@/context/useAuth';
import { getAuditActionName, getPermissionDescription, getRoleDisplayName } from '@/lib/adminLabels';

interface AdminRow {
  admin_id: string;
  email: string | null;
  role_key: string;
  is_active: boolean;
  is_owner: boolean;
  created_at: string;
}

interface RoleRow {
  role_key: string;
  display_name: string;
  is_system: boolean;
  is_assignable: boolean;
  permission_keys: string[];
}

interface PermissionRow {
  permission_key: string;
  description: string;
}

interface AuditRow {
  audit_id: string;
  actor_auth_user_id: string;
  target_auth_user_id: string | null;
  action: string;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  created_at: string;
}

function getAuditBadgeStyle(action: string): string {
  switch (action) {
    case 'admin_invited':
    case 'admin_enabled':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'admin_deleted':
    case 'admin_disabled':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    case 'owner_added':
    case 'owner_claimed':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'owner_removed':
      return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
    case 'admin_role_changed':
    case 'role_created':
    case 'role_updated':
    case 'role_deleted':
    case 'role_permissions_changed':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    default:
      return 'bg-obsidian-600/30 text-obsidian-300 border-obsidian-500/30';
  }
}

function formatAuditSummary(event: AuditRow): string {
  const afterRole = typeof event.after_state?.role === 'string'
    ? getRoleDisplayName(event.after_state.role)
    : null;
  const beforeRole = typeof event.before_state?.role === 'string'
    ? getRoleDisplayName(event.before_state.role)
    : null;

  switch (event.action) {
    case 'admin_invited':
      return afterRole
        ? translateTemplate('تمت دعوة مدير جديد بنجاح بدور «{role}»', { role: afterRole })
        : translate('تمت دعوة مدير جديد بنجاح');
    case 'admin_deleted':
      return beforeRole
        ? translateTemplate('تم حذف حساب المدير نهائياً (كان يحمل دور: {role})', { role: beforeRole })
        : translate('تم حذف حساب المدير وإلغاء صلاحياته نهائياً');
    case 'admin_disabled':
      return translate('تم إيقاف حساب المدير مؤقتاً وتعطيل دخوله');
    case 'admin_enabled':
      return translate('تمت إعادة تفعيل حساب المدير واستعادة دخوله');
    case 'owner_added':
      return translate('تمت ترقية الحساب إلى صفة مالك المنصة الكاملة');
    case 'owner_removed':
      return translate('تم إلغاء صفة مالك المنصة عن الحساب');
    case 'owner_claimed':
      return translate('تم تثبيت مالك المنصة الأول وتأكيد هويته');
    case 'owner_transferred':
      return translate('تم نقل ملكية المنصة');
    case 'admin_role_changed':
      return afterRole
        ? translateTemplate('تم تغيير دور المدير إلى «{role}»', { role: afterRole })
        : translate('تم تغيير دور وصلاحيات المدير');
    case 'role_created':
      return translate('تم إنشاء دور وظيفي مخصص جديد في النظام');
    case 'role_updated':
      return translate('تم تعديل بيانات الدور الوظيفي');
    case 'role_deleted':
      return translate('تم حذف الدور الوظيفي المخصص');
    case 'role_permissions_changed':
      return translate('تم تحديث قائمة الصلاحيات الممنوحة للدور');
    case 'branding_logo_changed':
      return translate('تم تحديث الشعار الرسمي للأكاديمية');
    case 'telegram_notification_language_changed':
      return translate('تم تحديث لغة إشعارات جروب الإدارة');
    default:
      return getAuditActionName(event.action);
  }
}

const PERMISSION_COUNT_FORMS = {
  ar: { zero: 'صلاحيات', one: 'صلاحية', two: 'صلاحيتان', few: 'صلاحيات', many: 'صلاحية' },
  en: { one: 'Permission', other: 'Permissions' },
};
const AUDIT_EVENT_COUNT_FORMS = {
  ar: { zero: 'أحداث موثّقة', one: 'حدث موثّق', two: 'حدثان موثّقان', few: 'أحداث موثّقة', many: 'حدثاً موثّقاً' },
  en: { one: 'logged event', other: 'logged events' },
};

export function AdminAccessManagement() {
  const { locale } = useLocale();
  const { user, refreshAuthorization } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [canClaimOwner, setCanClaimOwner] = useState(false);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [roleKey, setRoleKey] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);
  const [editingRoleKey, setEditingRoleKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data: authData, error: authError } = await supabase.rpc('get_my_authorization');
    const auth = Array.isArray(authData) ? authData[0] : authData;
    if (authError) {
      setIsOwner(false);
      setCanClaimOwner(false);
      setSetupMessage(translate("تعذر قراءة حالة الصلاحيات. قد تكون ترحيلات RBAC غير مطبقة أو الاتصال غير متاح؛ لم يتم إظهار أدوات الإدارة."));
      setLoading(false);
      return;
    }
    setSetupMessage(null);
    if (auth?.is_owner !== true) {
      setIsOwner(false);
      if (auth?.role_key === 'superadmin') {
        const { data: claimEligibility, error: claimEligibilityError } =
          await supabase.rpc('can_claim_platform_owner');
        if (claimEligibilityError) {
          setCanClaimOwner(false);
          setSetupMessage(translate("ترحيل تعدد المالكين غير مطبق أو تعذر التحقق من أهلية تثبيت المالك. لم يتم إظهار أدوات الإدارة."));
        } else {
          setCanClaimOwner(claimEligibility === true);
        }
      } else {
        setCanClaimOwner(false);
      }
      setLoading(false);
      return;
    }

    const [adminsResult, rolesResult, permissionsResult, auditResult] = await Promise.all([
      supabase.rpc('rbac_list_admins'),
      supabase.rpc('rbac_list_roles'),
      supabase.rpc('rbac_list_delegable_permissions'),
      supabase.rpc('rbac_list_audit_events', { p_limit: 50 }),
    ]);
    const loadError = adminsResult.error ?? rolesResult.error ?? permissionsResult.error ?? auditResult.error;
    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      setIsOwner(true);
      return;
    }

    setAdmins((adminsResult.data ?? []) as AdminRow[]);
    setRoles((rolesResult.data ?? []) as RoleRow[]);
    setPermissions((permissionsResult.data ?? []) as PermissionRow[]);
    setAuditEvents((auditResult.data ?? []) as AuditRow[]);
    setIsOwner(true);
    setCanClaimOwner(false);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const setAdminRole = async (admin: AdminRow, nextRole: string) => {
    if (!nextRole || nextRole === admin.role_key) return;
    setBusyKey(`role:${admin.admin_id}`);
    setError(null);
    setNotice(null);
    const { error: mutationError } = await supabase.rpc('rbac_set_admin_role', {
      p_admin_id: admin.admin_id,
      p_role_key: nextRole,
    });
    if (mutationError) setError(mutationError.message);
    else {
      setNotice(translate("تم تحديث دور المدير وتسجيل التغيير."));
      await load();
    }
    setBusyKey(null);
  };

  const setAdminActive = async (admin: AdminRow, active: boolean) => {
    if (!active && !window.confirm(translateTemplate('تعطيل حساب المدير {email}؟ لن يتمكن من استخدام النظام بعد ذلك.', { email: admin.email ?? '' }))) return;
    setBusyKey(`active:${admin.admin_id}`);
    setError(null);
    setNotice(null);
    const { error: mutationError } = await supabase.rpc('rbac_set_admin_active', {
      p_admin_id: admin.admin_id,
      p_is_active: active,
    });
    if (mutationError) setError(mutationError.message);
    else {
      setNotice(active ? translate("تم تفعيل حساب المدير.") : translate("تم إيقاف حساب المدير."));
      await load();
    }
    setBusyKey(null);
  };

  const setAdminOwner = async (admin: AdminRow, makeOwner: boolean) => {
    const confirmation = makeOwner
      ? translateTemplate('منح {email} صلاحيات مالك المنصة الكاملة؟', { email: admin.email ?? translate('هذا المدير') })
      : translateTemplate('إلغاء صفة مالك المنصة عن {email}؟ يجب أن يبقى مالك نشط آخر.', { email: admin.email ?? translate('هذا المدير') });
    if (!window.confirm(confirmation)) return;
    setBusyKey(`owner:${admin.admin_id}`);
    setError(null);
    setNotice(null);
    const { error: mutationError } = await supabase.rpc('rbac_set_admin_owner', {
      p_admin_id: admin.admin_id,
      p_is_owner: makeOwner,
    });
    if (mutationError) setError(mutationError.message);
    else {
      setNotice(makeOwner ? translate("تمت إضافة مالك للمنصة وتسجيل التغيير.") : translate("تم إلغاء صفة مالك المنصة وتسجيل التغيير."));
      await load();
    }
    setBusyKey(null);
  };

  const deleteAdmin = async (admin: AdminRow) => {
    if (!isOwner) {
      setError(translate("يجب أن تكون مالكاً للمنصة لحذف حساب مدير."));
      return;
    }
    if (isCurrentAdmin(admin)) {
      setError(translate("لا يمكنك حذف حسابك الشخصي"));
      return;
    }
    if (admin.is_owner) {
      const activeOwners = admins.filter((a) => a.is_owner && a.is_active);
      if (activeOwners.length <= 1) {
        setError(translate("يجب أن يتبقى مالك نشط واحد على الأقل للمنصة."));
        return;
      }
    }
    if (
      !window.confirm(
        translateTemplate(
          'هل أنت متأكد من حذف حساب المدير {email} نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.',
          { email: admin.email ?? translate('هذا المدير') }
        )
      )
    ) {
      return;
    }

    setBusyKey(`delete:${admin.admin_id}`);
    setError(null);
    setNotice(null);
    const { error: mutationError } = await supabase.rpc('rbac_delete_admin', {
      p_admin_id: admin.admin_id,
    });
    if (mutationError) {
      setError(mutationError.message);
    } else {
      setNotice(translate("تم حذف حساب المدير بنجاح."));
      await load();
    }
    setBusyKey(null);
  };

  const saveRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setBusyKey('role-create');
    const { error: mutationError } = editingRoleKey
      ? await supabase.rpc('rbac_update_custom_role_permissions', {
        p_role_key: editingRoleKey,
        p_permission_keys: permissionKeys,
      })
      : await supabase.rpc('rbac_create_custom_role', {
        p_role_key: roleKey.trim().toLowerCase(),
        p_display_name: displayName.trim(),
        p_permission_keys: permissionKeys,
      });
    if (mutationError) setError(mutationError.message);
    else {
      setNotice(editingRoleKey ? translate("تم تحديث صلاحيات الدور.") : translate("تم إنشاء الدور المخصص. يمكنك تعيينه لمدير من القائمة أعلاه."));
      setRoleKey('');
      setDisplayName('');
      setPermissionKeys([]);
      setEditingRoleKey(null);
      await load();
    }
    setBusyKey(null);
  };

  const beginRoleEdit = (role: RoleRow) => {
    setEditingRoleKey(role.role_key);
    setRoleKey(role.role_key);
    setDisplayName(role.display_name);
    setPermissionKeys(role.permission_keys ?? []);
    setError(null);
    setNotice(null);
  };

  const deleteRole = async (role: RoleRow) => {
    if (!window.confirm(translateTemplate('حذف الدور المخصص «{role}»؟', { role: role.display_name }))) return;
    setBusyKey(`role-delete:${role.role_key}`);
    setError(null);
    setNotice(null);
    const { error: mutationError } = await supabase.rpc('rbac_delete_custom_role', {
      p_role_key: role.role_key,
    });
    if (mutationError) setError(mutationError.message);
    else {
      setNotice(translate("تم حذف الدور المخصص."));
      if (editingRoleKey === role.role_key) {
        setEditingRoleKey(null);
        setRoleKey('');
        setDisplayName('');
        setPermissionKeys([]);
      }
      await load();
    }
    setBusyKey(null);
  };

  const isCurrentAdmin = (admin: AdminRow) => Boolean(
    user?.email && admin.email
    && user.email.trim().toLowerCase() === admin.email.trim().toLowerCase(),
  );

  const claimOwner = async () => {
    setBusyKey('owner-claim');
    setError(null);
    setNotice(null);
    const { error: claimError } = await supabase.rpc('claim_platform_owner');
    if (claimError) setError(claimError.message);
    else {
      setNotice(translate("تم تعيين حسابك مالكًا للمنصة."));
      await refreshAuthorization();
      await load();
    }
    setBusyKey(null);
  };

  if (loading) return <PageLoader />;
  if (!isOwner && !canClaimOwner) {
    if (!setupMessage) return null;
    return <section className="card-surface p-4 text-sm text-amber-200" dir={locale === 'ar' ? 'rtl' : 'ltr'} role="status">{setupMessage}</section>;
  }

  if (canClaimOwner) return (
    <section className="card-surface p-5 space-y-3" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <h3 className="text-white font-bold flex items-center gap-2"><ShieldCheck size={18} /> {translate("تعيين مالك المنصة")}</h3>
      <p className="text-obsidian-300 text-sm">{translate("لم يُعيّن مالك للمنصة بعد. يمكن للحساب الوحيد النشط بدور مدير النظام تعيين نفسه أولًا، ثم إضافة مالكين آخرين من هذه الصفحة. يسجل النظام كل تغيير ويمنع إلغاء صفة آخر مالك نشط.")}</p>
      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}
      <button type="button" className="btn-primary" onClick={() => void claimOwner()} disabled={busyKey === 'owner-claim'}>
        {busyKey === 'owner-claim' ? translate("جارٍ التعيين…") : translate("تعيين هذا الحساب مالكًا للمنصة")}
      </button>
    </section>
  );

  return (
    <section className="card-surface p-5 space-y-5" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-white font-bold flex items-center gap-2"><UserCog size={18} /> {translate("إدارة المديرين والصلاحيات")}</h3>
          <p className="text-obsidian-300 text-sm mt-1">{translate("تعيين الأدوار وإيقاف الحسابات. تُطبّق الصلاحيات من قاعدة البيانات.")}</p>
        </div>
        <button type="button" onClick={() => void load()} className="btn-secondary flex items-center gap-2" disabled={loading}>
          <RefreshCw size={15} /> {translate("إعادة تحميل")}</button>
      </header>

      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-obsidian-300 border-b border-obsidian-500/30">
            <th className="text-right px-3 py-2">{translate("البريد الإلكتروني")}</th><th className="text-right px-3 py-2">{translate("الدور")}</th>
            <th className="text-right px-3 py-2">{translate("الحالة")}</th><th className="text-right px-3 py-2">{translate("الإجراء")}</th>
          </tr></thead>
          <tbody>{admins.map((admin) => (
            <tr key={admin.admin_id} className="border-b border-obsidian-500/20">
              <td className="px-3 py-3 text-white">{admin.email ?? translate("حساب غير مرتبط ببريد إلكتروني")}</td>
              <td className="px-3 py-3">
                {admin.is_owner ? <span className="inline-flex items-center gap-1 text-emerald-300"><ShieldCheck size={14} /> {translate("مالك المنصة")}</span> : (
                  <select
                    className="input-base py-1"
                    value={admin.role_key}
                    disabled={busyKey === `role:${admin.admin_id}`}
                    onChange={(event) => void setAdminRole(admin, event.target.value)}
                    aria-label={translateTemplate('دور {email}', { email: admin.email ?? translate('المدير') })}
                  >
                    {roles.filter((role) => role.is_assignable).map((role) => (
                      <option key={role.role_key} value={role.role_key}>{getRoleDisplayName(role.role_key, role.display_name)}</option>
                    ))}
                  </select>
                )}
              </td>
              <td className="px-3 py-3">{admin.is_active ? translate("نشط") : translate("معطّل")}</td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="btn-secondary px-3 py-1.5 text-xs"
                    disabled={busyKey === `owner:${admin.admin_id}` || isCurrentAdmin(admin) || (!admin.is_owner && !admin.is_active)}
                    onClick={() => void setAdminOwner(admin, !admin.is_owner)}
                    title={!admin.is_owner && !admin.is_active ? translate("فعّل الحساب قبل ترقيته إلى مالك") : undefined}
                  >
                    {admin.is_owner ? translate("إلغاء صفة مالك المنصة") : translate("تعيينه مالكًا للمنصة")}
                  </button>
                  <button
                    type="button"
                    className={admin.is_active ? 'btn-danger px-3 py-1.5 text-xs' : 'btn-secondary px-3 py-1.5 text-xs'}
                    disabled={busyKey === `active:${admin.admin_id}` || isCurrentAdmin(admin)}
                    onClick={() => void setAdminActive(admin, !admin.is_active)}
                  >{admin.is_active ? translate("تعطيل") : translate("تفعيل")}</button>
                  {isOwner && (
                    <button
                      type="button"
                      className="btn-danger px-2.5 py-1.5 text-xs flex items-center gap-1 bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30 transition-colors"
                      disabled={busyKey === `delete:${admin.admin_id}` || isCurrentAdmin(admin) || (admin.is_owner && admins.filter((a) => a.is_owner && a.is_active).length <= 1)}
                      onClick={() => void deleteAdmin(admin)}
                      title={isCurrentAdmin(admin) ? translate("لا يمكنك حذف حسابك الشخصي") : translate("حذف")}
                    >
                      <Trash2 size={13} />
                      {translate("حذف")}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <form onSubmit={(event) => void saveRole(event)} className="border-t border-obsidian-500/30 pt-5 space-y-4">
        <div>
          <h4 className="text-white font-semibold">{editingRoleKey ? translate("تعديل صلاحيات الدور") : translate("إنشاء دور مخصص")}</h4>
          <p className="text-obsidian-300 text-xs mt-1">{translate("يمكنك اختيار الصلاحيات المتاحة للتفويض. تظل إدارة المنصة حصرية لمالك المنصة.")}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-obsidian-200 text-sm">{translate("معرّف الدور (للاستخدام الداخلي)")}<input dir="ltr" style={{ textAlign: 'left' }} className="input-base mt-1 w-full" value={roleKey} onChange={(event) => setRoleKey(event.target.value)} placeholder="student_coordinator" pattern="[a-z][a-z0-9_]{1,49}" required readOnly={!!editingRoleKey} />
            <span className="mt-1 block text-xs leading-relaxed text-obsidian-300">{translate("هذا معرّف تقني لا يظهر للمستخدمين. استخدم أحرفاً إنجليزية صغيرة وأرقاماً وشرطة سفلية، مثل student_coordinator. الاسم أعلاه هو الاسم الظاهر في النظام.")}</span>
          </label>
          <label className="text-obsidian-200 text-sm">{translate("اسم الدور")}<input className="input-base mt-1 w-full" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={100} required readOnly={!!editingRoleKey} />
          </label>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {permissions.map((permission) => (
            <label key={permission.permission_key} className="flex items-start gap-2 rounded-lg bg-obsidian-700/50 p-2 text-xs text-obsidian-200">
              <input
                type="checkbox"
                checked={permissionKeys.includes(permission.permission_key)}
                onChange={(event) => setPermissionKeys((current) => event.target.checked
                  ? [...current, permission.permission_key]
                  : current.filter((key) => key !== permission.permission_key))}
                className="mt-0.5 accent-emerald-400"
              />
              <span className="text-right"><span className="block font-medium">{getPermissionDescription(permission.permission_key, permission.description)}</span></span>
            </label>
          ))}
        </div>
        <button type="submit" className="btn-primary" disabled={busyKey === 'role-create' || !roleKey.trim() || !displayName.trim()}>
          {busyKey === 'role-create' ? translate("جارٍ الحفظ…") : editingRoleKey ? translate("حفظ الصلاحيات") : translate("إنشاء الدور")}
        </button>
        {editingRoleKey && <button type="button" className="btn-secondary mr-2" onClick={() => { setEditingRoleKey(null); setRoleKey(''); setDisplayName(''); setPermissionKeys([]); }}>{translate("إلغاء التعديل")}</button>}
      </form>

      <div className="border-t border-obsidian-500/30 pt-5 space-y-3">
        <h4 className="text-white font-semibold">{translate("الأدوار الحالية")}</h4>
        {roles.map((role) => (
          <div key={role.role_key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-obsidian-700/40 p-3">
            <div>
              <p className="text-white font-medium">{getRoleDisplayName(role.role_key, role.display_name)}</p>
              <p className="text-obsidian-300 text-xs mt-1">
                {role.role_key === 'superadmin'
                  ? translate("كل الصلاحيات (إدارة كاملة للمنصة)")
                  : formatCountPhrase(role.permission_keys.length, PERMISSION_COUNT_FORMS, locale)}
                {role.is_system ? translate(" — دور أساسي") : translate(" — دور مخصص")}
              </p>
            </div>
            {!role.is_system && <div className="flex gap-2">
              <button type="button" className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1" onClick={() => beginRoleEdit(role)}><Pencil size={13} /> {translate("تعديل الصلاحيات")}</button>
              <button type="button" className="btn-danger px-3 py-1.5 text-xs flex items-center gap-1" disabled={busyKey === `role-delete:${role.role_key}`} onClick={() => void deleteRole(role)}><Trash2 size={13} /> {translate("حذف الدور")}</button>
            </div>}
          </div>
        ))}
      </div>

      <div className="border-t border-obsidian-500/30 pt-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <History size={16} className="text-emerald-light" />
            {translate("سجل تغييرات الصلاحيات")}
          </h4>
          <span className="text-xs text-obsidian-400">
            {formatCountPhrase(auditEvents.length, AUDIT_EVENT_COUNT_FORMS, locale)}
          </span>
        </div>
        <p className="text-xs text-obsidian-300">
          {translate("سجل أمني رسمي يوثّق كافة العمليات الإدارية على الحسابات والأدوار.")}
        </p>

        {auditEvents.length === 0 ? (
          <p className="text-obsidian-300 text-sm py-4 text-center">{translate("لا توجد أحداث مسجلة حتى الآن.")}</p>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {auditEvents.map((event) => (
              <article key={event.audit_id} className="rounded-xl bg-obsidian-700/30 border border-obsidian-600/30 p-3.5 text-sm transition-colors hover:bg-obsidian-700/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAuditBadgeStyle(event.action)}`}>
                      {getAuditActionName(event.action)}
                    </span>
                    <span className="text-white font-medium text-xs sm:text-sm">
                      {formatAuditSummary(event)}
                    </span>
                  </div>
                  <time className="text-obsidian-300 text-xs font-mono" dir="ltr">
                    {new Date(event.created_at).toLocaleString(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
                      timeZone: 'Africa/Cairo',
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </time>
                </div>

                {(event.before_state || event.after_state || event.actor_auth_user_id) && (
                  <details className="mt-2.5 pt-2 border-t border-obsidian-600/20 group">
                    <summary className="text-[11px] text-obsidian-400 hover:text-obsidian-200 cursor-pointer select-none inline-flex items-center gap-1 transition-colors">
                      <ChevronDown size={12} className="transition-transform group-open:rotate-180" />
                      <span>{translate("عرض التفاصيل الفنية")}</span>
                    </summary>
                    <div className="mt-2 p-2.5 rounded-lg bg-obsidian-800/80 border border-obsidian-600/30 text-xs space-y-1.5">
                      <p className="text-obsidian-300 font-mono text-[11px] break-all" dir="ltr">
                        <span className="text-obsidian-400">Actor:</span> {event.actor_auth_user_id}
                        {event.target_auth_user_id && (
                          <>
                            <span className="mx-1 text-obsidian-400">➔ Target:</span> {event.target_auth_user_id}
                          </>
                        )}
                      </p>
                      {(event.before_state || event.after_state) && (
                        <pre className="font-mono text-[11px] text-obsidian-300 bg-obsidian-900/60 p-2 rounded overflow-x-auto whitespace-pre-wrap break-words" dir="ltr">
                          {JSON.stringify({ before: event.before_state, after: event.after_state }, null, 2)}
                        </pre>
                      )}
                    </div>
                  </details>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
