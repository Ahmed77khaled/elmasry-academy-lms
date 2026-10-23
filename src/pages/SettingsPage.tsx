import { translate } from '@/lib/translations';
import { useEffect, useState } from 'react';
import { Shield, Database, Lock, Mail, User, CheckCircle2, Wallet } from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Feedback';
import { Alert } from '@/components/ui/Alert';
import { Input, FormActions } from '@/components/ui/Form';
import { formatEGP } from '@/lib/format';
import type { CashBoxBalance } from '@/types/database';
import { AdminInviteForm } from '@/components/forms/AdminInviteForm';
import { AdminAccessManagement } from '@/components/AdminAccessManagement';
import { useAuth } from '@/context/useAuth';
import { getAdminDisplayName, getRoleDisplayName } from '@/lib/adminLabels';
import { AdminAvatar, AdminAvatarSettings } from '@/components/AdminAvatar';
import { AcademyLogoSettings } from '@/components/AcademyLogoSettings';
import { TelegramNotificationLanguageSettings } from '@/components/TelegramNotificationLanguageSettings';

export function SettingsPage() {
  const { user, permissions, isOwner, roleKey } = useAuth();
  const canReadTreasury = permissions.includes('finance.cash_boxes.read');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [accountName, setAccountName] = useState(getAdminDisplayName(user));
  const [savingAccountName, setSavingAccountName] = useState(false);
  const [accountNameError, setAccountNameError] = useState<string | null>(null);
  const [accountNameSuccess, setAccountNameSuccess] = useState(false);

  useEffect(() => {
    const fullName = user?.user_metadata?.full_name;
    setAccountName(typeof fullName === 'string' ? fullName : '');
  }, [user]);

  const { data: boxes, loading } = useQuery<CashBoxBalance[]>(async () => {
    if (!canReadTreasury) return { data: [], error: null };
    const { data, error } = await supabase.rpc('rbac_list_cash_boxes');
    return { data: (data as CashBoxBalance[] | null)?.filter((box) => box.is_active) ?? null, error: error?.message ?? null };
  }, [canReadTreasury]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!newPassword || !confirmPassword) {
      setPasswordError(translate("يرجى ملء جميع الحقول"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(translate("كلمتا المرور غير متطابقتين"));
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(translate("كلمة المرور يجب أن تكون 6 أحرف على الأقل"));
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleAccountNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountNameError(null);
    setAccountNameSuccess(false);
    if (accountName.trim().length < 2) {
      setAccountNameError(translate("اكتب الاسم الذي تريد ظهوره في النظام، على ألا يقل عن حرفين."));
      return;
    }

    setSavingAccountName(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: accountName.trim() },
    });
    setSavingAccountName(false);
    if (error) setAccountNameError(translate("تعذر حفظ الاسم. حاول مرة أخرى."));
    else setAccountNameSuccess(true);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-bold text-xl">{translate("الإعدادات والأمان")}</h2>
        <p className="text-obsidian-300 text-sm mt-1">{translate("إدارة الحساب وكلمة المرور وصلاحيات الدخول")}</p>
      </div>

      {/* Admin profile */}
      <div className="card-surface p-5">
        <h3 className="text-white font-bold text-base mb-4">{translate("بيانات الحساب")}</h3>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-azure-brand to-azure-light flex items-center justify-center shrink-0">
            <AdminAvatar user={user} className="w-full h-full rounded-2xl object-cover text-white font-bold text-xl font-arabic flex items-center justify-center" />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-semibold">{getAdminDisplayName(user)}</h4>
            <p className="text-obsidian-300 text-sm">{translate("حساب إداري نشط")}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="emerald">{translate("نشط")}</Badge>
              <Badge variant="blue">{isOwner ? translate("مالك المنصة") : getRoleDisplayName(roleKey ?? '')}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-obsidian-700/40 rounded-lg p-3">
            <User size={18} className="text-obsidian-300" />
            <div>
              <p className="text-obsidian-300 text-xs">{translate("اسم الجهة")}</p>
              <p className="text-white text-sm">{translate("أكاديمية المصري")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-obsidian-700/40 rounded-lg p-3">
            <Mail size={18} className="text-obsidian-300" />
            <div>
              <p className="text-obsidian-300 text-xs">{translate("البريد الإلكتروني")}</p>
              <p className="text-white text-sm font-num" dir="ltr">{user?.email ?? '—'}</p>
            </div>
          </div>
        </div>
        <form onSubmit={(event) => void handleAccountNameSave(event)} className="mt-4 border-t border-obsidian-500/30 pt-4">
          <Input
            label={translate("الاسم الظاهر في النظام")}
            value={accountName}
            onChange={(event) => setAccountName(event.target.value)}
            maxLength={100}
            placeholder={translate("اكتب اسمك كما تريد أن يظهر للمديرين")}
          />
          {accountNameError && <Alert variant="error" className="mt-3">{accountNameError}</Alert>}
          {accountNameSuccess && <Alert variant="success" className="mt-3">{translate("تم تحديث الاسم الظاهر في النظام.")}</Alert>}
          <FormActions>
            <button type="submit" disabled={savingAccountName} className="btn-secondary">
              {savingAccountName ? translate("جارٍ حفظ الاسم…") : translate("حفظ الاسم")}
            </button>
          </FormActions>
        </form>
        <AdminAvatarSettings user={user} />
      </div>

      {isOwner && <AcademyLogoSettings />}
      {isOwner && <TelegramNotificationLanguageSettings />}
      <AdminInviteForm />
      <AdminAccessManagement />

      {/* Change password */}
      <div className="card-surface p-5">
        <h3 className="text-white font-bold text-base mb-4">{translate("تغيير كلمة المرور")}</h3>
        {passwordSuccess && (
          <Alert variant="success" className="mb-4">
            {translate("تم تغيير كلمة المرور بنجاح")}</Alert>
        )}
        {passwordError && (
          <Alert variant="error" className="mb-4">{passwordError}</Alert>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            label={translate("كلمة المرور الجديدة")}
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label={translate("تأكيد كلمة المرور")}
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <FormActions>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? translate("جاري التحديث...") : translate("تحديث كلمة المرور")}
            </button>
          </FormActions>
        </form>
      </div>

      {/* System infrastructure */}
      <div className="card-surface p-5">
        <h3 className="text-white font-bold text-base mb-4">{translate("البنية التحتية وصحة النظام")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-obsidian-700/40 rounded-lg p-3">
            <Database size={18} className="text-azure-brand" />
            <div>
              <p className="text-obsidian-300 text-xs">{translate("قاعدة البيانات")}</p>
              <p className="text-white text-sm">{translate("قاعدة بيانات سحابية (Supabase)")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-obsidian-700/40 rounded-lg p-3">
            <Shield size={18} className="text-emerald-light" />
            <div>
              <p className="text-obsidian-300 text-xs">{translate("حماية البيانات")}</p>
              <p className="text-white text-sm">{translate("سياسات حماية الصفوف (RLS) مفعّلة — التسجيل العام متوقف")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-obsidian-700/40 rounded-lg p-3">
            <Lock size={18} className="text-amber-400" />
            <div>
              <p className="text-obsidian-300 text-xs">{translate("سلامة العمليات")}</p>
              <p className="text-white text-sm">{translate("تُستخدم الأقفال أثناء تحديث المقاعد والمدفوعات")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-obsidian-700/40 rounded-lg p-3">
            <CheckCircle2 size={18} className="text-emerald-light" />
            <div>
              <p className="text-obsidian-300 text-xs">{translate("حالة النظام")}</p>
              <p className="text-white text-sm">{translate("متصل بخدمات النظام")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Treasury summary */}
      {canReadTreasury && <div className="card-surface overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-obsidian-500/40">
          <Wallet size={18} className="text-emerald-light" />
          <h3 className="text-white font-bold text-base">{translate("ملخص الخزن النشطة")}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-obsidian-300 text-xs border-b border-obsidian-500/30">
                <th className="text-right font-medium px-4 py-3">{translate("الخزنة")}</th>
                <th className="text-right font-medium px-4 py-3">{translate("النوع")}</th>
                <th className="text-right font-medium px-4 py-3">{translate("مسؤول الخزنة")}</th>
                <th className="text-right font-medium px-4 py-3">{translate("الرصيد الحالي")}</th>
              </tr>
            </thead>
            <tbody>
              {boxes?.map((box) => (
                <tr key={box.cash_box_id} className="border-b border-obsidian-500/20">
                  <td className="px-4 py-3 text-white font-medium">{box.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="gray">
                      {box.type === 'Main' ? translate("رئيسية") : box.type === 'Online' ? translate("أونلاين") : box.type === 'Bank' ? translate("بنك") : box.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-obsidian-200">{box.owner}</td>
                  <td className={`px-4 py-3 font-num font-bold ${box.current_balance < 0 ? 'text-rose-400' : 'text-emerald-light'}`}>
                    {formatEGP(box.current_balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}

      {/* Developer credit */}
      <div className="card-surface p-5 text-center">
        <p className="text-obsidian-200 text-sm">{translate("إدارة أكاديمية المصري")}</p>
        <p className="text-obsidian-300 text-xs mt-1">{translate("أكاديمية المصري — نظام إدارة التدريب والمالية")}</p>
      </div>
    </div>
  );
}
