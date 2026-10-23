export type Locale = 'ar' | 'en';

let activeLocale: Locale = 'ar';

export function getLocale(): Locale {
  return activeLocale;
}

export function setActiveLocale(locale: Locale) {
  activeLocale = locale;
}
