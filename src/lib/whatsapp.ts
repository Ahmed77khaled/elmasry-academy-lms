/**
 * WhatsApp Helper for Elmasry Academy
 * Generates direct wa.me URLs for trainee payment reminders and communications.
 * No external API or bots needed — 100% free and safe.
 */

export function formatEgyptPhoneForWhatsApp(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  
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

  const message = `مرحباً أستاذ ${studentName}،\nنود تذكيركم من أكاديمية م/ محمد المصري بمتبقي قسط دورة (${courseName}) وقدره ${remainingAmount.toLocaleString('ar-EG')} ج.م.\n\nنتمنى لكم دوام التوفيق والتميز! 🎓`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
