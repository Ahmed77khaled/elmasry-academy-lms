import { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { FormActions } from '@/components/ui/Form';
import { useLocale } from '@/context/LocaleContext';
import { supabase } from '@/lib/supabase';

type NotificationLanguage = 'ar' | 'en';

export function TelegramNotificationLanguageSettings() {
  const { locale } = useLocale();
  const [language, setLanguage] = useState<NotificationLanguage>('ar');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isArabic = locale === 'ar';

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const { data, error: requestError } = await supabase.rpc('rbac_get_telegram_group_language');
        if (!active) return;

        if (requestError) {
          setError(isArabic
            ? 'تعذر تحميل إعداد لغة تنبيهات المجموعة.'
            : 'Could not load the group notification language setting.');
        } else {
          setLanguage(data === 'en' ? 'en' : 'ar');
        }
      } catch {
        if (active) {
          setError(isArabic
            ? 'تعذر تحميل إعداد لغة تنبيهات المجموعة.'
            : 'Could not load the group notification language setting.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isArabic]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const { data, error: requestError } = await supabase.rpc('rbac_set_telegram_group_language', {
        p_language: language,
      });

      if (requestError) {
        setError(isArabic
          ? 'تعذر حفظ اللغة. تأكد من اتصالك بصفتك مالك المنصة.'
          : 'Could not save the language. Confirm that you are signed in as a platform owner.');
        return;
      }

      setLanguage(data === 'en' ? 'en' : 'ar');
      setSaved(true);
    } catch {
      setError(isArabic
        ? 'تعذر حفظ اللغة. حاول مرة أخرى.'
        : 'Could not save the language. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card-surface p-5 space-y-4" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-azure-brand/10 p-2 text-azure-light">
          <Languages size={20} />
        </div>
        <div>
          <h3 className="text-white font-bold text-base">
            {isArabic ? 'لغة تنبيهات جروب الإدارة' : 'Administrator group notification language'}
          </h3>
          <p className="text-obsidian-300 text-sm mt-1">
            {isArabic
              ? 'اختر لغة موحدة للرسائل التي تصل إلى جروب الإدارة. هذا الإعداد لا يغيّر لغة واجهة المنصة.'
              : 'Choose one language for messages sent to the administrator group. This does not change the app language.'}
          </p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {saved && (
        <Alert variant="success">
          {isArabic ? 'تم حفظ لغة تنبيهات المجموعة.' : 'Group notification language saved.'}
        </Alert>
      )}

      <div className="max-w-sm space-y-2">
        <label htmlFor="telegram-group-language" className="block text-sm text-obsidian-200">
          {isArabic ? 'لغة الرسائل' : 'Message language'}
        </label>
        <select
          id="telegram-group-language"
          value={language}
          onChange={(event) => {
            setLanguage(event.target.value === 'en' ? 'en' : 'ar');
            setSaved(false);
          }}
          disabled={loading || saving}
          className="input-base w-full"
        >
          <option value="ar">العربية</option>
          <option value="en">English</option>
        </select>
      </div>

      <FormActions>
        <button type="button" onClick={() => void handleSave()} disabled={loading || saving} className="btn-primary">
          {saving
            ? (isArabic ? 'جارٍ الحفظ…' : 'Saving…')
            : (isArabic ? 'حفظ اللغة' : 'Save language')}
        </button>
      </FormActions>
    </section>
  );
}
