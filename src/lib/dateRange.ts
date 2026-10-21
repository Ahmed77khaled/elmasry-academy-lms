export type DateRangePreset = 'all' | 'today' | 'this_week' | 'this_month' | 'custom';

export function isDateInRange(
  dateStr: string | null | undefined,
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string
): boolean {
  if (!dateStr || preset === 'all') return true;
  
  // Format of dateStr is typically 'YYYY-MM-DD'
  const dateOnly = dateStr.slice(0, 10);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  if (preset === 'today') {
    return dateOnly === todayStr;
  }

  if (preset === 'this_week') {
    // Week starting Saturday (in Egypt)
    const day = now.getDay(); // 0 is Sunday, 6 is Saturday
    const diffToSaturday = (day + 1) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToSaturday);
    const startStr = `${startOfWeek.getFullYear()}-${pad(startOfWeek.getMonth() + 1)}-${pad(startOfWeek.getDate())}`;
    return dateOnly >= startStr && dateOnly <= todayStr;
  }

  if (preset === 'this_month') {
    const startOfMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    return dateOnly >= startOfMonth;
  }

  if (preset === 'custom') {
    if (customStart && dateOnly < customStart) return false;
    if (customEnd && dateOnly > customEnd) return false;
    return true;
  }

  return true;
}
