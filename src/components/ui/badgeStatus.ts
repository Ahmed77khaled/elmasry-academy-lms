import { translate } from '@/lib/translations';
import type { BadgeVariant } from '@/components/ui/Badge';

export function paymentStatusBadge(status: string): { variant: BadgeVariant; label: string } {
  switch (status) {
    case 'Paid': return { variant: 'emerald', label: translate("خالص السداد") };
    case 'Partial': return { variant: 'amber', label: translate("سداد جزئي") };
    case 'Unpaid': return { variant: 'rose', label: translate("لم يُسدد بعد") };
    case 'Overpaid': return { variant: 'violet', label: translate("فائض سداد") };
    default: return { variant: 'gray', label: status };
  }
}

export function enrollmentStatusBadge(status: string): { variant: BadgeVariant; label: string } {
  switch (status) {
    case 'Active': return { variant: 'emerald', label: translate("منتظم بالحضور") };
    case 'Completed': return { variant: 'blue', label: translate("أتمّ الكورس") };
    case 'Dropped': return { variant: 'rose', label: translate("منسحب / معتذر") };
    default: return { variant: 'gray', label: status };
  }
}

export function courseStatusBadge(status: string): { variant: BadgeVariant; label: string } {
  switch (status) {
    case 'Active': return { variant: 'emerald', label: translate("شغّال حالياً") };
    case 'Upcoming': return { variant: 'blue', label: translate("قادم قريباً") };
    case 'Closed': return { variant: 'rose', label: translate("مكتمل ومغلق") };
    default: return { variant: 'gray', label: status };
  }
}
