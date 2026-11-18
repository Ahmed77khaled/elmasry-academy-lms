import { ChevronLeft, ChevronRight } from 'lucide-react';
import { translate } from '@/lib/translations';

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function PaginationControls({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationControlsProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-obsidian-500/25 px-4 py-3 text-xs text-obsidian-300">
      <div className="flex items-center gap-2">
        <span>{translate("عدد الصفوف في الصفحة")}</span>
        <select aria-label={translate("عدد الصفوف في الصفحة")} value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} className="input-base w-auto py-1.5 text-xs">
          {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
        <span>{first}–{last} {translate("من")} {total}</span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label={translate("الصفحة السابقة")} className="btn-ghost p-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <span>{translate("صفحة")} {page} {translate("من")} {pages}</span>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= pages} aria-label={translate("الصفحة التالية")} className="btn-ghost p-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
