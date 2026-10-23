import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { setActiveLocale } from '@/context/localeState';
import type { Locale } from '@/context/localeState';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const savedLocale: Locale = localStorage.getItem('elmasry-lms-locale') === 'en' ? 'en' : 'ar';
      setActiveLocale(savedLocale);
      return savedLocale;
    } catch {
      setActiveLocale('ar');
      return 'ar';
    }
  });

  const setLocale = useCallback((nextLocale: Locale) => {
    setActiveLocale(nextLocale);
    setLocaleState(nextLocale);
    try {
      localStorage.setItem('elmasry-lms-locale', nextLocale);
    } catch {
      // Keep the current session usable when browser storage is unavailable.
    }
  }, []);

  const toggleLocale = useCallback(() => setLocale(locale === 'ar' ? 'en' : 'ar'), [locale, setLocale]);

  useEffect(() => {
    setActiveLocale(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.title = locale === 'ar'
      ? 'أكاديمية المصري — نظام إدارة التدريب'
      : 'Elmasry Academy — Training Management System';
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, toggleLocale }), [locale, setLocale, toggleLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
