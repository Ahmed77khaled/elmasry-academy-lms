import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatEGP, formatDate } from '@/lib/format';
import type { Expense } from '@/types/database';

const CATEGORY_LABELS: Record<string, string> = {
  'Rent': 'إيجار', 'Salary': 'مرتبات', 'Supplies': 'أدوات', 'Hardware': 'أجهزة',
  'Marketing': 'إعلانات', 'Utilities': 'كهرباء وإنترنت', 'Other': 'أخرى',
};

const CATEGORY_VARIANTS: Record<string, 'blue' | 'amber' | 'rose' | 'violet' | 'emerald' | 'gray'> = {
  'Rent': 'blue', 'Salary': 'amber', 'Supplies': 'emerald', 'Hardware': 'violet',
  'Marketing': 'rose', 'Utilities': 'blue', 'Other': 'gray',
};

interface ExpenseTableRow extends Expense {
  cash_boxes?: { name: string } | null;
  courses?: { course_name: string } | null;
}

export function ExpensesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseTableRow | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        created_at,
        cash_boxes ( name ),
        courses ( course_name )
      `)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);
    return { data: (data ?? []) as unknown as ExpenseTableRow[], error: error?.message ?? null };
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('expenses').delete().eq('expense_id', deleteTarget.expense_id);
    setDeleting(false);
    if (!error) {
      setDeleteTarget(null);
      refetch();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-bold text-xl">إدارة المصروفات</h2>
          <p className="text-obsidian-300 text-sm mt-1">كل المصروفات التشغيلية للأكاديمية</p>
        </div>
        <button onClick={() => setFormOpen(true)} className="btn-primary">
          <Plus size={18} />
          تسجيل مصروف جديد
        </button>
      </div>

      <div className="card-surface overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : !expenses || expenses.length === 0 ? (
          <EmptyState
            message="لا توجد مصروفات مسجلة — اضغط على زر تسجيل مصروف جديد للبدء"
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
                  <th className="text-right font-medium px-4 py-3 hidden md:table-cell">الخزنة</th>
                  <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">كورس مرتبط</th>
                  <th className="text-right font-medium px-4 py-3">المبلغ</th>
                  <th className="text-right font-medium px-4 py-3">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.expense_id} className="border-b border-obsidian-500/20 hover:bg-obsidian-700/30 transition-colors">
                    <td className="px-4 py-3 text-obsidian-300 font-num">{formatDate(exp.expense_date)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={CATEGORY_VARIANTS[exp.category] ?? 'gray'}>
                        {CATEGORY_LABELS[exp.category] ?? exp.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-obsidian-100">{exp.description ?? '—'}</td>
                    <td className="px-4 py-3 text-obsidian-200 hidden md:table-cell">{exp.cash_boxes?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-obsidian-200 hidden lg:table-cell">{exp.courses?.course_name ?? 'عام للسنتر'}</td>
                    <td className="px-4 py-3 font-num font-bold text-rose-400">{formatEGP(exp.amount)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDeleteTarget(exp)} className="btn-danger px-2.5 py-1.5 text-xs">
                        <Trash2 size={14} /> حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExpenseForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={refetch} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف المصروف"
        message={`هل أنت متأكد من حذف هذا المصروف بقيمة ${formatEGP(deleteTarget?.amount ?? 0)}؟ لا يمكن التراجع عن هذا الإجراء`}
        confirmLabel="حذف"
        loading={deleting}
        danger
      />
    </div>
  );
}
