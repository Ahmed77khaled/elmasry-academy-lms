import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Locale = 'ar' | 'en';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);
let activeLocale: Locale = 'ar';

export function getLocale(): Locale {
  return activeLocale;
}

export function setActiveLocale(locale: Locale) {
  activeLocale = locale;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const savedLocale: Locale = localStorage.getItem('elmasry-lms-locale') === 'en' ? 'en' : 'ar';
      activeLocale = savedLocale;
      return savedLocale;
    } catch {
      activeLocale = 'ar';
      return 'ar';
    }
  });

  const setLocale = useCallback((nextLocale: Locale) => {
    activeLocale = nextLocale;
    setLocaleState(nextLocale);
    try {
      localStorage.setItem('elmasry-lms-locale', nextLocale);
    } catch {
      // Keep the current session usable when browser storage is unavailable.
    }
  }, []);

  const toggleLocale = useCallback(() => setLocale(locale === 'ar' ? 'en' : 'ar'), [locale, setLocale]);

  useEffect(() => {
    activeLocale = locale;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.title = locale === 'ar'
      ? 'أكاديمية المصري — نظام إدارة التدريب'
      : 'Elmasry Academy — Training Management System';
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, toggleLocale }), [locale, setLocale, toggleLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider.');
  return context;
}
