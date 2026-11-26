import React, { useState } from 'react';
import { useAuth } from '@/context/useAuth';
import { Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { AcademyLogo } from '@/components/AcademyLogo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLocale } from '@/context/useLocale';
import { translate } from '@/lib/translations';
import { supabase } from '@/lib/supabase';

const signInErrorMessage = "تعذر تسجيل الدخول. تأكد من البريد وكلمة المرور وحاول مرة أخرى.";

export function LoginPage() {
  const { signIn } = useAuth();
  const { locale } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(signInErrorMessage);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await signIn(email.trim(), password).catch(() => null);

    if (!result || result.error) {
      setError(signInErrorMessage);
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError(locale === 'ar' ? 'اكتب البريد الإلكتروني أولاً.' : 'Enter your email address first.');
      return;
    }

    setResettingPassword(true);
    setError(null);
    setResetMessage(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: window.location.origin,
    });
    setResettingPassword(false);

    if (resetError) {
      setError(locale === 'ar'
        ? 'تعذر إرسال الرابط. حاول مرة أخرى بعد قليل.'
        : 'Could not send the reset link. Please try again shortly.');
      return;
    }

    setResetMessage(locale === 'ar'
      ? 'إذا كان هذا البريد مسجلاً، فسيصل إليه رابط آمن لإعادة تعيين كلمة المرور.'
      : 'If this email is registered, a secure password reset link will arrive shortly.');
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
            <p className="text-obsidian-200 text-sm">{translate("نظام إدارة التدريب المعتمد")}</p>
          </div>

          <div role="alert">
            {error && <Alert variant="error" className="mb-6">{translate(error, locale)}</Alert>}
          </div>
          {resetMessage && <div className="mb-5"><Alert variant="success">{resetMessage}</Alert></div>}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-obsidian-200 mb-2">
                {translate("البريد الإلكتروني الإداري")}
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-obsidian-700 border border-obsidian-300 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder:text-obsidian-200 focus:outline-none focus:border-emerald-brand focus:ring-1 focus:ring-emerald-brand transition-all font-num"
                />
                <Mail size={18} className="absolute left-3.5 top-3.5 text-obsidian-200" />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-medium text-obsidian-200 mb-2">
                {translate("كلمة المرور")}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-obsidian-700 border border-obsidian-300 rounded-xl px-4 py-3 pl-11 pr-11 text-sm text-white placeholder:text-obsidian-200 focus:outline-none focus:border-emerald-brand focus:ring-1 focus:ring-emerald-brand transition-all font-num"
                />
                <Lock size={18} className="absolute left-3.5 top-3.5 text-obsidian-200" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={translate(showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور", locale)}
                  className="absolute right-3.5 top-3.5 text-obsidian-200 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-brand hover:bg-emerald-dark text-obsidian-900 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-brand/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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

          <button
            type="button"
            onClick={() => void handlePasswordReset()}
            disabled={resettingPassword}
            className="mt-4 w-full text-center text-sm text-emerald-light underline-offset-4 hover:underline disabled:opacity-60"
          >
            {resettingPassword
              ? (locale === 'ar' ? 'جارٍ إرسال الرابط...' : 'Sending reset link...')
              : (locale === 'ar' ? 'نسيت كلمة المرور؟ إرسال رابط جديد' : 'Forgot password? Send a reset link')}
          </button>

          <p className="mt-3 text-center text-sm text-obsidian-200">
            {translate("هل تواجه مشكلة في تسجيل الدخول؟ تواصل مع إدارة الأكاديمية.", locale)}
          </p>

          {/* Footer signature */}
          <div className="mt-8 pt-6 border-t border-obsidian-500/40 text-center">
            <p className="text-xs text-obsidian-200">
              {translate("نظام إدارة أكاديمية المصري")}</p>
            <p className="text-xs font-semibold text-emerald-light mt-1">
              {translate("لإدارة التدريب والمالية")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
