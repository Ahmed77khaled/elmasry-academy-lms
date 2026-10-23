import { getLocale } from '@/context/LocaleContext';

export function formatEGP(amount: number): string {
  const locale = getLocale();
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  const sign = amount < 0 ? '-' : '';
  return locale === 'ar' ? `${sign}${formatted} ج.م` : `${sign}EGP ${formatted}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat(getLocale() === 'ar' ? 'ar-EG' : 'en-GB').format(n);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(getLocale() === 'ar' ? 'ar-EG' : 'en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(getLocale() === 'ar' ? 'ar-EG' : 'en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
