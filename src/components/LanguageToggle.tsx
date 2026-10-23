import { Languages } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, toggleLocale } = useLocale();
  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-obsidian-500/40 bg-obsidian-700 text-obsidian-100 hover:bg-obsidian-600 hover:text-white transition-colors ${compact ? 'min-w-12 px-2 h-10 text-xs font-bold' : 'px-3 h-10 text-sm font-semibold'}`}
      aria-label={locale === 'ar' ? 'Switch language to English' : 'تغيير اللغة إلى العربية'}
      title={locale === 'ar' ? 'English' : 'العربية'}
    >
      <Languages size={17} />
      <span>{locale === 'ar' ? 'EN' : compact ? 'AR' : 'العربية'}</span>
    </button>
  );
}
