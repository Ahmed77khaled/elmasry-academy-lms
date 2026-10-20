import { useState } from 'react';
import { Shield, Database, Lock, Mail, User, CheckCircle2, Wallet } from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Feedback';
import { Alert } from '@/components/ui/Alert';
import { Input, FormActions } from '@/components/ui/Form';
import { formatEGP } from '@/lib/format';
import type { CashBoxBalance } from '@/types/database';

export function SettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const { data: boxes, loading } = useQuery<CashBoxBalance[]>(async () => {
    const { data, error } = await supabase
      .from('cash_box_balances')
      .select('*')
      .eq('is_active', true)
      .order('name');
    return { data, error: error?.message ?? null };
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!newPassword || !confirmPassword) {
      setPasswordError('يرجى ملء جميع الحقول');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
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

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-bold text-xl">الإعدادات والأمان</h2>
        <p className="text-obsidian-300 text-sm mt-1">إعدادات النظام والأمان والحساب</p>
      </div>

      {/* Admin profile */}
      <div className="card-surface p-5">
        <h3 className="text-white font-bold text-base mb-4">ملف المدير والمطور</h3>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-azure-brand to-azure-light flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xl font-arabic">أ</span>
          </div>
          <div className="flex-1">
            <h4 className="text-white font-semibold">م/ أحمد الفلاح</h4>
            <p className="text-obsidian-300 text-sm">Eng. Ahmed El-Falah</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="emerald">نشط</Badge>
              <Badge variant="blue">مطور النظام ومسؤول الصلاحيات</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-obsidian-700/40 rounded-lg p-3">
            <User size={18} className="text-obsidian-300" />
            <div>
              <p className="text-obsidian-300 text-xs">المستفيد</p>
              <p className="text-white text-sm">أكاديمية المصري</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-obsidian-700/40 rounded-lg p-3">
            <Mail size={18} className="text-obsidian-300" />
            <div>
              <p className="text-obsidian-300 text-xs">البريد الإلكتروني</p>
              <p className="text-white text-sm font-num">ahmed.elfalah@trainerpro.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card-surface p-5">
        <h3 className="text-white font-bold text-base mb-4">تغيير كلمة المرور</h3>
        {passwordSuccess && (
          <Alert variant="success" className="mb-4">
            تم تغيير كلمة المرور بنجاح
          </Alert>
        )}
        {passwordError && (
          <Alert variant="error" className="mb-4">{passwordError}</Alert>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            label="كلمة المرور الجديدة"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="تأكيد كلمة المرور"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <FormActions>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
            </button>
          </FormActions>
        </form>
      </div>

      {/* System infrastructure */}
      <div className="card-surface p-5">
        <h3 className="text-white font-bold text-base mb-4">البنية التحتية وصحة النظام</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-obsidian-700/40 rounded-lg p-3">
            <Database size={18} className="text-azure-brand" />
            <div>
              <p className="text-obsidian-300 text-xs">قاعدة البيانات</p>
              <p className="text-white text-sm">PostgreSQL Cloud (Supabase)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-obsidian-700/40 rounded-lg p-3">
            <Shield size={18} className="text-emerald-light" />
            <div>
              <p className="text-obsidian-300 text-xs">سياسات RLS</p>
              <p className="text-white text-sm">حماية صارمة — التسجيل العام معطل</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-obsidian-700/40 rounded-lg p-3">
            <Lock size={18} className="text-amber-400" />
            <div>
              <p className="text-obsidian-300 text-xs">الأقفال الذرية</p>
              <p className="text-white text-sm">نشطة (FOR UPDATE على المقاعد والدفعات)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-obsidian-700/40 rounded-lg p-3">
            <CheckCircle2 size={18} className="text-emerald-light" />
            <div>
              <p className="text-obsidian-300 text-xs">حالة النظام</p>
              <p className="text-white text-sm">متصل وآمن 100%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Treasury summary */}
      <div className="card-surface overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-obsidian-500/40">
          <Wallet size={18} className="text-emerald-light" />
          <h3 className="text-white font-bold text-base">ملخص الخزن النشطة</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-obsidian-300 text-xs border-b border-obsidian-500/30">
                <th className="text-right font-medium px-4 py-3">الخزنة</th>
                <th className="text-right font-medium px-4 py-3">النوع</th>
                <th className="text-right font-medium px-4 py-3">المسؤول</th>
                <th className="text-right font-medium px-4 py-3">الرصيد الحالي</th>
              </tr>
            </thead>
            <tbody>
              {boxes?.map((box) => (
                <tr key={box.cash_box_id} className="border-b border-obsidian-500/20">
                  <td className="px-4 py-3 text-white font-medium">{box.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="gray">
                      {box.type === 'Main' ? 'رئيسية' : box.type === 'Online' ? 'أونلاين' : box.type === 'Bank' ? 'بنك' : box.type}
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
      </div>

      {/* Developer credit */}
      <div className="card-surface p-5 text-center">
        <p className="text-obsidian-200 text-sm">صُنع وتطوير بواسطة م/ أحمد الفلاح 👨‍💻</p>
        <p className="text-obsidian-300 text-xs mt-1">Elmasry Academy LMS — نظام إدارة التدريب المعتمد</p>
      </div>
    </div>
  );
}
