import React, { useState } from 'react';
import { useAuth } from '@/context/useAuth';
import { Lock, Mail, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { AcademyLogo } from '@/components/AcademyLogo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLocale } from '@/context/useLocale';
import { translate } from '@/lib/translations';

export function LoginPage() {
  const { signIn } = useAuth();
  const { locale } = useLocale();
  const [email, setEmail] = useState('ahmed.elfalah@trainerpro.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(translate("يرجى إدخال البريد الإلكتروني وكلمة المرور"));
      return;
    }

    setLoading(true);
    setError(null);

    const { error: signInError } = await signIn(email.trim(), password);

    if (signInError) {
      setError(translate("بيانات الدخول غير صحيحة، يرجى التحقق من البريد وكلمة المرور"));
      setLoading(false);
    }
  };

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-obsidian-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-3"><LanguageToggle /></div>
        {/* Brand Card */}
        <div className="card-surface p-8 rounded-2xl shadow-2xl border border-obsidian-500/40 relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-brand/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-azure-brand/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo & Header */}
          <div className="text-center mb-8 relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-brand to-emerald-dark flex items-center justify-center shadow-lg shadow-emerald-brand/20">
              <AcademyLogo imageClassName="w-full h-full object-contain p-2" fallbackClassName="text-white font-bold text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{translate("أكاديمية المصري")}</h1>
            <p className="text-obsidian-300 text-sm">{translate("نظام إدارة التدريب المعتمد")}</p>
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-emerald-brand/10 border border-emerald-brand/30 text-emerald-light text-xs font-medium">
              <ShieldCheck size={14} />
              <span>{translate("بوابة الإدارة المركزية الآمنة")}</span>
            </div>
          </div>

          {error && (
            <div className="mb-6">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-obsidian-200 mb-2">
                {translate("البريد الإلكتروني الإداري")}</label>
              <div className="relative">
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@academy.com"
                  required
                  className="w-full bg-obsidian-700 border border-obsidian-500/50 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-obsidian-400 focus:outline-none focus:border-emerald-brand focus:ring-1 focus:ring-emerald-brand transition-all font-num"
                />
                <Mail size={18} className="absolute left-3.5 top-3.5 text-obsidian-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-obsidian-200 mb-2">
                {translate("كلمة المرور")}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-obsidian-700 border border-obsidian-500/50 rounded-xl px-4 py-3 pl-11 pr-11 text-sm text-white placeholder-obsidian-400 focus:outline-none focus:border-emerald-brand focus:ring-1 focus:ring-emerald-brand transition-all font-num"
                />
                <Lock size={18} className="absolute left-3.5 top-3.5 text-obsidian-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-obsidian-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-brand hover:bg-emerald-dark text-obsidian-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-brand/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{translate("جاري تسجيل الدخول...")}</span>
                </>
              ) : (
                <span>{translate("تسجيل الدخول للنظام")}</span>
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] leading-5 text-obsidian-300">
            {translate("لأغراض حماية الحساب، يُسجَّل وقت الدخول وعنوان IP للمديرين المعتمدين ويُرسل تنبيه أمني إلى تيليجرام.")}</p>

          {/* Footer signature */}
          <div className="mt-8 pt-6 border-t border-obsidian-500/40 text-center">
            <p className="text-xs text-obsidian-300">
              {translate("نظام إدارة أكاديمية المصري")}</p>
            <p className="text-xs font-semibold text-emerald-light mt-1">
              {translate("لإدارة التدريب والمالية")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
