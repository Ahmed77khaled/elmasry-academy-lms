/**
 * WhatsApp Helper for Elmasry Academy
 * Generates direct wa.me URLs for trainee payment reminders and communications.
 * No external API or bots needed — 100% free and safe.
 */
import { getLocale } from '@/context/localeState';
import { translateTemplate } from '@/lib/translations';

export function formatEgyptPhoneForWhatsApp(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s()+-]/g, '');
  
  // If starts with 01, convert to 201
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    return '20' + cleaned.substring(1);
  }
  // If already starts with 201
  if (cleaned.startsWith('201') && cleaned.length === 12) {
    return cleaned;
  }
  // If starts with 1 and length 10
  if (cleaned.startsWith('1') && cleaned.length === 10) {
    return '20' + cleaned;
  }
  
  return cleaned;
}

export function generatePaymentReminderUrl({
  phone,
  studentName,
  courseName,
  remainingAmount,
}: {
  phone: string | null | undefined;
  studentName: string;
  courseName: string;
  remainingAmount: number;
}): string | null {
  const formattedPhone = formatEgyptPhoneForWhatsApp(phone);
  if (!formattedPhone) return null;

  const locale = getLocale();
  const amount = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(remainingAmount);
  const currencyAmount = locale === 'ar' ? `${amount} ج.م` : `EGP ${amount}`;
  const message = translateTemplate(
    'مرحباً أستاذ {student}،\nنود تذكيركم من أكاديمية المصري بمتبقي قسط الدورة التدريبية «{course}» وقدره {amount}.\n\nنتمنى لكم دوام التوفيق والتميز! 🎓',
    { student: studentName, course: courseName, amount: currencyAmount },
    locale,
  );

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
