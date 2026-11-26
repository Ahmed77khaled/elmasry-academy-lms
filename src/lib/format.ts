import { getLocale } from '@/context/localeState';

export function formatEGP(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(abs);
  const locale = getLocale();
  return locale === 'ar' ? `${formatted} جنيه` : `${formatted} EGP`;
}

export function formatCurrency(amount: number, currency: 'EGP' | 'USD' = 'EGP'): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(abs);
  const locale = getLocale();
  if (locale === 'ar') {
    const label = currency === 'USD' ? 'دولار' : 'جنيه';
    return `${formatted} ${label}`;
  }
  return `${formatted} ${currency}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

/**
 * Formats a cash balance without ever rendering a negative figure.
 * Negative balances are reported as a deficit ("عجز"/"Deficit") so the UI
 * stays readable in RTL and the amount itself is always shown as a magnitude.
 */
export function formatBalance(amount: number, currency: 'EGP' | 'USD' = 'EGP'): string {
  const magnitude = formatCurrency(Math.abs(Number.isFinite(amount) ? amount : 0), currency);
  if (Number.isFinite(amount) && amount < 0) {
    return getLocale() === 'ar' ? `عجز ${magnitude}` : `Deficit ${magnitude}`;
  }
  return magnitude;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
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

export function formatStudentCode(studentId?: string | null, customCode?: string | null): string {
  if (customCode && customCode.trim()) return customCode.trim();
  if (!studentId) return 'STD-0000';
  const cleanId = studentId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `STD-${cleanId}`;
}

export function formatReceiptCode(receiptNumber?: number | null, fallbackId?: string | null): string {
  if (receiptNumber != null && Number.isFinite(Number(receiptNumber))) {
    return `REC-${String(receiptNumber).padStart(8, '0')}`;
  }
  if (fallbackId && fallbackId.trim()) {
    return `REC-${fallbackId.slice(0, 8).toUpperCase()}`;
  }
  return '—';
}
