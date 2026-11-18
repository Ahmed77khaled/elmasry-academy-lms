import { useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { useLocale } from '@/context/useLocale';
import { supabase, clearContinuationMarker } from '@/lib/supabase';
import { AcademyLogo } from '@/components/AcademyLogo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Alert } from '@/components/ui/Alert';

interface SetPasswordPageProps {
  mode: 'invite' | 'recovery';
  verified?: boolean;
  linkVerified?: boolean;
  expectedUserId?: string | null;
  expectedSessionId?: string | null;
  email?: string;
  errorMessage?: string | null;
  onComplete: () => void;
  onExit: () => void;
}

export function SetPasswordPage({
  mode,
  verified,
  linkVerified,
  expectedUserId,
  expectedSessionId,
  email,
  errorMessage,
  onComplete,
  onExit,
}: SetPasswordPageProps) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';
  const isVerified = verified ?? linkVerified ?? false;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // 1. Reject submission unless current flow is verified and bound to expected user ID
    if (!isVerified || !expectedUserId) {
      setError(
        isArabic
          ? 'تعذر التحقق من صلاحية الرابط أو انتهت صلاحيته. اطلب رابطاً جديداً.'
          : 'Flow is not verified or has expired. Please request a new link.'
      );
      return;
    }

    if (password.length < 8) {
      setError(
        isArabic
          ? 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.'
          : 'Your password must be at least 8 characters long.'
      );
      return;
    }
    if (password !== confirmPassword) {
      setError(isArabic ? 'كلمتا المرور غير متطابقتين.' : 'The passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      // 2. Immediately before password update, verify the current session claims
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
      if (claimsError || !claimsData?.claims) {
        setError(
          isArabic
            ? 'انتهت صلاحية الجلسة أو تعذر التحقق الأمني منها.'
            : 'Session expired or security verification failed.'
        );
        return;
      }

      // 3. Require matching sub and session_id
      const claims = claimsData.claims;
      const currentSub = claims.sub;
      const currentSessionId = String(claims.session_id || '');

      if (
        currentSub !== expectedUserId ||
        (expectedSessionId && currentSessionId && currentSessionId !== expectedSessionId)
      ) {
        setError(
          isArabic
            ? 'هوية الحساب النشط لا تطابق صاحب الرابط المعتمد.'
            : 'Active account identity does not match this verified link.'
        );
        return;
      }

      // 4. Only then call supabase.auth.updateUser({ password })
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(
          isArabic
            ? isRecovery
              ? 'تعذر حفظ كلمة المرور. أعد فتح رابط الاستعادة وحاول مرة أخرى.'
              : 'تعذر حفظ كلمة المرور. أعد فتح رابط الدعوة وحاول مرة أخرى.'
            : isRecovery
            ? 'Could not save the password. Reopen the reset link and try again.'
            : 'Could not save the password. Reopen the invitation link and try again.'
        );
        return;
      }

      // 5. Clear continuation marker after successful completion
      clearContinuationMarker();
      setSaved(true);
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError(
        isArabic
          ? 'تعذر الاتصال بخدمة الحساب. حاول مرة أخرى.'
          : 'Could not reach the account service. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const isRecovery = mode === 'recovery';
  const title = isArabic
    ? isRecovery
      ? 'إعادة تعيين كلمة المرور'
      : 'تفعيل حساب مدير الأكاديمية'
    : isRecovery
    ? 'Reset your password'
    : 'Set up your academy account';

  const handleExitClick = () => {
    clearContinuationMarker();
    onExit();
  };

  const handleCompleteClick = () => {
    clearContinuationMarker();
    onComplete();
  };

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-obsidian-900 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-3">
          <LanguageToggle />
        </div>
        <section className="card-surface relative overflow-hidden rounded-2xl border border-obsidian-500/40 p-8 shadow-2xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-emerald-brand/10 blur-3xl" />
          <div className="relative mb-7 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-brand to-emerald-dark shadow-lg shadow-emerald-brand/20">
              <AcademyLogo
                imageClassName="h-full w-full object-contain p-2"
                fallbackClassName="text-3xl font-bold text-white"
              />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white">{title}</h1>
            <p className="text-sm leading-relaxed text-obsidian-300">
              {isArabic
                ? isRecovery
                  ? 'أدخل كلمة مرور جديدة لحسابك.'
                  : 'أكمل قبول الدعوة بتعيين كلمة مرور لحسابك.'
                : isRecovery
                ? 'Choose a new password for your account.'
                : 'Finish accepting your invitation by creating a password for your account.'}
            </p>
            {email && (
              <p className="mt-3 break-all text-sm font-medium text-emerald-light" dir="ltr">
                {email}
              </p>
            )}
          </div>

          {!isVerified ? (
            <>
              <Alert variant="warning" className="mb-5">
                {errorMessage ||
                  (isArabic
                    ? isRecovery
                      ? 'لم يتم التحقق من رابط الاستعادة أو انتهت صلاحيته. اطلب رابط استعادة جديد.'
                      : 'لم يتم التحقق من رابط الدعوة أو انتهت صلاحيته. اطلب من مالك المنصة إرسال دعوة جديدة.'
                    : isRecovery
                    ? 'The password reset link could not be verified or has expired. Request a new reset link.'
                    : 'The invitation link could not be verified or has expired. Ask the platform owner to send a new invitation.')}
              </Alert>
              <button type="button" onClick={handleExitClick} className="btn-secondary w-full">
                {isArabic ? 'العودة إلى تسجيل الدخول' : 'Return to sign in'}
              </button>
            </>
          ) : saved ? (
            <>
              <Alert variant="success" className="mb-5">
                {isArabic
                  ? 'تم تعيين كلمة المرور. يمكنك الآن الدخول إلى المنصة.'
                  : 'Your password is set. You can now use the platform.'}
              </Alert>
              <button
                type="button"
                onClick={handleCompleteClick}
                className="w-full rounded-xl bg-emerald-brand px-4 py-3 font-bold text-obsidian-950 transition-colors hover:bg-emerald-dark"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} />
                  {isArabic ? 'متابعة إلى المنصة' : 'Continue to the platform'}
                </span>
              </button>
            </>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              {error && <Alert variant="error">{error}</Alert>}
              <label className="block text-sm font-medium text-obsidian-100">
                {isArabic ? 'كلمة المرور الجديدة' : 'New password'}
                <span className="relative mt-2 block">
                  <KeyRound
                    size={17}
                    className={`absolute top-3.5 text-obsidian-400 ${
                      isArabic ? 'right-3.5' : 'left-3.5'
                    }`}
                  />
                  <input
                    type="password"
                    dir="ltr"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`w-full rounded-xl border border-obsidian-500/50 bg-obsidian-700 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-brand focus:ring-1 focus:ring-emerald-brand ${
                      isArabic ? 'pr-11' : 'pl-11'
                    }`}
                  />
                </span>
              </label>
              <label className="block text-sm font-medium text-obsidian-100">
                {isArabic ? 'تأكيد كلمة المرور' : 'Confirm password'}
                <input
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="input-base mt-2"
                />
              </label>
              <p className="text-xs text-obsidian-300">
                {isArabic
                  ? 'استخدم 8 أحرف على الأقل، ثم أعد كتابتها للتأكيد.'
                  : 'Use at least 8 characters, then enter it again to confirm.'}
              </p>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-emerald-brand px-4 py-3 font-bold text-obsidian-950 transition-colors hover:bg-emerald-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  {saving
                    ? isArabic
                      ? 'جارٍ حفظ كلمة المرور...'
                      : 'Saving password...'
                    : isArabic
                    ? 'حفظ كلمة المرور'
                    : 'Set password'}
                </span>
              </button>
            </form>
          )}

          <div className="mt-7 flex items-center justify-center gap-2 border-t border-obsidian-500/40 pt-5 text-xs text-obsidian-300">
            <ShieldCheck size={15} className="text-emerald-light" />
            <span>
              {isArabic
                ? isRecovery
                  ? 'استعادة آمنة لحسابك'
                  : 'دعوة آمنة ومخصصة لحسابك'
                : isRecovery
                ? 'Secure password recovery'
                : 'Secure invitation for your account'}
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
