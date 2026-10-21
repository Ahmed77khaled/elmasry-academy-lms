import { useState } from 'react';
import { Plus, Ban, Search, FileSpreadsheet, Calendar } from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Textarea } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Alert';
import { formatEGP, formatDate } from '@/lib/format';
import { exportToCSV } from '@/lib/exportExcel';
import { isDateInRange, DateRangePreset } from '@/lib/dateRange';
import type { Expense } from '@/types/database';

const CATEGORY_LABELS: Record<string, string> = {
  'Rent': 'إيجار',
  'Salary': 'مرتبات',
  'Supplies': 'أدوات',
  'Hardware': 'أجهزة',
  'Marketing': 'إعلانات',
  'Utilities': 'كهرباء وإنترنت',
  'Other': 'أخرى',
};

const CATEGORY_VARIANTS: Record<string, 'blue' | 'amber' | 'rose' | 'violet' | 'emerald' | 'gray'> = {
  'Rent': 'blue',
  'Salary': 'amber',
  'Supplies': 'emerald',
  'Hardware': 'violet',
  'Marketing': 'rose',
  'Utilities': 'blue',
  'Other': 'gray',
};

interface ExpenseTableRow extends Expense {
  cash_boxes?: { name: string } | null;
  courses?: { course_name: string } | null;
}

export function ExpensesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<ExpenseTableRow | null>(null);
  const [voiding, setVoiding] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { data: expenses, loading, refetch } = useQuery<ExpenseTableRow[]>(async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        expense_id,
        cash_box_id,
        course_id,
        amount,
        category,
        description,
        expense_date,
        notes,
        voided_at,
        voided_by,
        void_reason,
        created_at,
        cash_boxes ( name ),
        courses ( course_name )
      `)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200);
    return { data: (data ?? []) as unknown as ExpenseTableRow[], error: error?.message ?? null };
  });

  const handleVoid = async () => {
    if (!voidTarget) return;
    const reason = voidReason.trim();
    if (reason.length < 5) {
      setVoidError('اكتب سبب الإلغاء (5 أحرف على الأقل).');
      return;
    }
    setVoiding(true);
    setVoidError(null);
    const { error } = await supabase.rpc('void_expense', {
      p_expense_id: voidTarget.expense_id,
      p_void_reason: reason,
    });
    setVoiding(false);
    if (error) {
      setVoidError(error.message);
    } else {
      setVoidTarget(null);
      setVoidReason('');
      refetch();
    }
  };

  // Filter expenses by search, category, and date range
  const filteredExpenses = (expenses ?? []).filter((exp) => {
    // 1. Date Range
    if (!isDateInRange(exp.expense_date, datePreset, customStart, customEnd)) {
      return false;
    }

    // 2. Category Filter
    if (categoryFilter && exp.category !== categoryFilter) {
      return false;
    }

    // 3. Search Query
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const desc = exp.description?.toLowerCase() ?? '';
    const notes = exp.notes?.toLowerCase() ?? '';
    const cat = (CATEGORY_LABELS[exp.category] ?? exp.category).toLowerCase();
    const box = exp.cash_boxes?.name?.toLowerCase() ?? '';
    const course = exp.courses?.course_name?.toLowerCase() ?? '';
    return desc.includes(q) || notes.includes(q) || cat.includes(q) || box.includes(q) || course.includes(q);
  });

  // Calculate totals of filtered active expenses
  const activeFilteredTotal = filteredExpenses
    .filter((exp) => !exp.voided_at)
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  // Export to Excel handler
  const handleExportExcel = () => {
    const headers = [
      'تاريخ الصرف',
      'التصنيف',
      'الوصف',
      'الخزينة',
      'الدورة التدريبية',
      'المبلغ (ج.م)',
      'حالة السند',
      'سبب الإلغاء',
      'ملاحظات',
    ];

    const rows = filteredExpenses.map((exp) => [
      exp.expense_date,
      CATEGORY_LABELS[exp.category] ?? exp.category,
      exp.description ?? '—',
      exp.cash_boxes?.name ?? '—',
      exp.courses?.course_name ?? 'عام للأكاديمية',
      exp.amount,
      exp.voided_at ? 'ملغى' : 'معتمد',
      exp.void_reason ?? '',
      exp.notes ?? '',
    ]);

    const dateSuffix = new Date().toISOString().slice(0, 10);
    exportToCSV({
      filename: `تقرير_المصروفات_${dateSuffix}`,
      headers,
      rows,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-bold text-xl">إدارة المصروفات</h2>
          <p className="text-obsidian-300 text-sm mt-1">كل المصروفات التشغيلية وسندات الصرف للأكاديمية</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="btn-secondary flex items-center gap-2 text-sm bg-obsidian-700 hover:bg-obsidian-600 text-emerald-light border border-emerald-500/30"
            title="تصدير السجلات المعروضة لملف إكسيل"
          >
            <FileSpreadsheet size={16} />
            تصدير إكسيل
          </button>
          <button onClick={() => setFormOpen(true)} className="btn-primary">
            <Plus size={18} />
            تسجيل مصروف جديد
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card-surface p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="flex items-center gap-2 bg-obsidian-700 rounded-lg px-3 py-2 border border-obsidian-500/40 flex-1 min-w-[220px]">
            <Search size={16} className="text-obsidian-300 shrink-0" />
            <input
              type="text"
              placeholder="بحث بالوصف، التصنيف، الخزينة، أو الملاحظات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-obsidian-100 placeholder:text-obsidian-300 outline-none w-full"
            />
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-base w-auto text-sm"
          >
            <option value="">كل التصنيفات</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Date Range Preset Selector */}
          <div className="flex items-center gap-1.5 bg-obsidian-700 rounded-lg px-2 py-1 border border-obsidian-500/40">
            <Calendar size={15} className="text-obsidian-300 mr-1" />
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DateRangePreset)}
              className="bg-transparent text-sm text-obsidian-100 outline-none py-1 cursor-pointer"
            >
              <option value="all" className="bg-obsidian-800 text-white">كل الفترات</option>
              <option value="today" className="bg-obsidian-800 text-white">اليوم</option>
              <option value="this_week" className="bg-obsidian-800 text-white">هذا الأسبوع</option>
              <option value="this_month" className="bg-obsidian-800 text-white">هذا الشهر</option>
              <option value="custom" className="bg-obsidian-800 text-white">فترة مخصصة...</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-obsidian-500/20 text-xs">
            <span className="text-obsidian-300 font-medium">من تاريخ:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="input-base w-auto py-1 px-2 text-xs"
            />
            <span className="text-obsidian-300 font-medium">إلى تاريخ:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="input-base w-auto py-1 px-2 text-xs"
            />
          </div>
        )}

        {/* Filter Summary Bar */}
        <div className="flex items-center justify-between text-xs text-obsidian-300 pt-1">
          <div>
            عدد السندات المعروضة: <span className="font-num text-white font-semibold">{filteredExpenses.length}</span>
          </div>
          <div>
            إجمالي المصروفات المعتمدة: <span className="font-num text-rose-400 font-bold text-sm">{formatEGP(activeFilteredTotal)}</span>
          </div>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : filteredExpenses.length === 0 ? (
          <EmptyState
            message="لا توجد مصروفات مطابقة للبحث أو الفترة المحددة — اضغط على زر تسجيل مصروف جديد للبدء"
            action={<button onClick={() => setFormOpen(true)} className="btn-primary"><Plus size={16} /> تسجيل مصروف</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-obsidian-300 text-xs border-b border-obsidian-500/30">
                  <th className="text-right font-medium px-4 py-3">التاريخ</th>
                  <th className="text-right font-medium px-4 py-3">التصنيف</th>
                  <th className="text-right font-medium px-4 py-3">الوصف</th>
                  <th className="text-right font-medium px-4 py-3 hidden md:table-cell">الخزينة</th>
                  <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">كورس مرتبط</th>
                  <th className="text-right font-medium px-4 py-3">المبلغ</th>
                  <th className="text-right font-medium px-4 py-3">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => {
                  const isVoided = Boolean(exp.voided_at);
                  return (
                    <tr
                      key={exp.expense_id}
                      className={`border-b border-obsidian-500/20 hover:bg-obsidian-700/30 transition-colors ${
                        isVoided ? 'opacity-40' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-obsidian-300 font-num text-xs">{formatDate(exp.expense_date)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={CATEGORY_VARIANTS[exp.category] ?? 'gray'}>
                          {CATEGORY_LABELS[exp.category] ?? exp.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-obsidian-100">{exp.description ?? '—'}</td>
                      <td className="px-4 py-3 text-obsidian-200 hidden md:table-cell">{exp.cash_boxes?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-obsidian-200 hidden lg:table-cell">{exp.courses?.course_name ?? 'عام للسنتر'}</td>
                      <td className={`px-4 py-3 font-num font-bold text-rose-400 ${isVoided ? 'line-through' : ''}`}>
                        {formatEGP(exp.amount)}
                      </td>
                      <td className="px-4 py-3">
                        {isVoided ? (
                          <span title={exp.void_reason ?? 'مصروف ملغى'} className="text-xs text-rose-300">
                            ملغى
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setVoidError(null);
                              setVoidReason('');
                              setVoidTarget(exp);
                            }}
                            className="btn-danger px-2.5 py-1.5 text-xs flex items-center gap-1"
                          >
                            <Ban size={14} /> إلغاء
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExpenseForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={refetch} />
      <ConfirmDialog
        open={!!voidTarget}
        onClose={() => {
          if (voiding) return;
          setVoidTarget(null);
          setVoidReason('');
          setVoidError(null);
        }}
        onConfirm={handleVoid}
        title="إلغاء المصروف"
        message={`سيتم إلغاء المصروف بقيمة ${formatEGP(voidTarget?.amount ?? 0)} مع الاحتفاظ بسجله، واستبعاده من الأرصدة والتقارير.`}
        confirmLabel="إلغاء المصروف"
        loading={voiding}
        confirmDisabled={voidReason.trim().length < 5}
        danger
      >
        <Textarea
          label="سبب الإلغاء (إلزامي)"
          placeholder="اذكر سبب إلغاء المصروف"
          rows={3}
          minLength={5}
          maxLength={500}
          value={voidReason}
          onChange={(e) => setVoidReason(e.target.value)}
          required
        />
        {voidError && <Alert variant="error">{voidError}</Alert>}
      </ConfirmDialog>
    </div>
  );
}
