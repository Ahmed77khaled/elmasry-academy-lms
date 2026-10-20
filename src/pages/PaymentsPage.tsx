import { useState } from 'react';
import { Plus, Ban, Printer, Search } from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ReceiptModal } from '@/components/modals/ReceiptModal';
import { Textarea } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Alert';
import { formatEGP, formatDate } from '@/lib/format';

const METHOD_LABELS: Record<string, string> = {
  'Cash': 'كاش',
  'Bank Transfer': 'تحويل بنكي',
  'Vodafone Cash': 'فودافون كاش',
  'InstaPay': 'إنستاباي',
};

interface RawPaymentRow {
  payment_id: string;
  receipt_number: number;
  enrollment_id: string;
  cash_box_id: string;
  amount: number;
  payment_date: string;
  method: string;
  receipt_ref: string | null;
  notes: string | null;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  created_at: string;
  enrollments?: {
    students?: { name: string; phone?: string | null } | null;
    courses?: { course_name: string } | null;
  } | null;
  cash_boxes?: { name: string } | null;
}

export function PaymentsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<RawPaymentRow | null>(null);
  const [voiding, setVoiding] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Receipt Modal
  const [receiptTarget, setReceiptTarget] = useState<{
    payment_id: string;
    receipt_number: number;
    student_name: string;
    student_phone?: string | null;
    course_name: string;
    amount: number;
    payment_date: string;
    method: string;
    receipt_ref?: string | null;
    cash_box_name?: string | null;
    notes?: string | null;
  } | null>(null);

  const { data: payments, loading, refetch } = useQuery<RawPaymentRow[]>(async () => {
    let query = supabase
      .from('payments')
      .select(`
        payment_id,
        receipt_number,
        enrollment_id,
        cash_box_id,
        amount,
        payment_date,
        method,
        receipt_ref,
        notes,
        voided_at,
        voided_by,
        void_reason,
        created_at,
        enrollments ( students ( name, phone ), courses ( course_name ) ),
        cash_boxes ( name )
      `)
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);

    if (methodFilter) {
      query = query.eq('method', methodFilter);
    }
    const { data, error } = await query;
    return { data: (data ?? []) as unknown as RawPaymentRow[], error: error?.message ?? null };
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
    const { error } = await supabase.rpc('void_payment', {
      p_payment_id: voidTarget.payment_id,
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

  const handleOpenReceipt = (p: RawPaymentRow) => {
    setReceiptTarget({
      payment_id: p.payment_id,
      receipt_number: p.receipt_number,
      student_name: p.enrollments?.students?.name ?? 'طالب بالأكاديمية',
      student_phone: p.enrollments?.students?.phone,
      course_name: p.enrollments?.courses?.course_name ?? 'كورس تدريبي',
      amount: p.amount,
      payment_date: p.payment_date,
      method: p.method,
      receipt_ref: p.receipt_ref,
      cash_box_name: p.cash_boxes?.name,
      notes: p.notes,
    });
  };

  const filteredPayments = (payments ?? []).filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const sName = p.enrollments?.students?.name?.toLowerCase() ?? '';
    const cName = p.enrollments?.courses?.course_name?.toLowerCase() ?? '';
    const ref = p.receipt_ref?.toLowerCase() ?? '';
    const receiptLabel = `REC-${String(p.receipt_number).padStart(8, '0')}`.toLowerCase();
    return sName.includes(q) || cName.includes(q) || ref.includes(q) || receiptLabel.includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-bold text-xl">الدفعات والمقبوضات</h2>
          <p className="text-obsidian-300 text-sm mt-1">كل المعاملات المالية الواردة من الطلاب</p>
        </div>
        <button onClick={() => setFormOpen(true)} className="btn-primary">
          <Plus size={18} />
          تسجيل دفعة جديدة
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="card-surface p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-obsidian-700 rounded-lg px-3 py-2 border border-obsidian-500/40 flex-1 min-w-[200px]">
          <Search size={16} className="text-obsidian-300 shrink-0" />
          <input
            type="text"
            placeholder="بحث بالطالب، الكورس، أو رقم الإيصال..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-obsidian-100 placeholder:text-obsidian-300 outline-none w-full"
          />
        </div>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="input-base w-auto"
        >
          <option value="">كل طرق الدفع</option>
          <option value="Cash">كاش</option>
          <option value="Vodafone Cash">فودافون كاش</option>
          <option value="InstaPay">إنستاباي</option>
          <option value="Bank Transfer">تحويل بنكي</option>
        </select>
      </div>

      <div className="card-surface overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            message="لا توجد دفعات مطابقة — اضغط على زر تسجيل دفعة جديدة للبدء"
            action={<button onClick={() => setFormOpen(true)} className="btn-primary"><Plus size={16} /> تسجيل دفعة</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-obsidian-300 text-xs border-b border-obsidian-500/30">
                  <th className="text-right font-medium px-4 py-3">الطالب</th>
                  <th className="text-right font-medium px-4 py-3">الكورس</th>
                  <th className="text-right font-medium px-4 py-3 hidden sm:table-cell">التاريخ</th>
                  <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">الخزنة</th>
                  <th className="text-right font-medium px-4 py-3">المبلغ</th>
                  <th className="text-right font-medium px-4 py-3 hidden md:table-cell">طريقة الدفع</th>
                  <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">الإيصال</th>
                  <th className="text-right font-medium px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const isVoided = !!p.voided_at;
                  return (
                    <tr key={p.payment_id} className={`border-b border-obsidian-500/20 hover:bg-obsidian-700/30 transition-colors ${isVoided ? 'opacity-40' : ''}`}>
                      <td className="px-4 py-3 text-white font-medium">
                        {p.enrollments?.students?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-obsidian-200">
                        {p.enrollments?.courses?.course_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-obsidian-300 font-num hidden sm:table-cell">
                        {formatDate(p.payment_date)}
                      </td>
                      <td className="px-4 py-3 text-obsidian-200 hidden lg:table-cell">
                        {p.cash_boxes?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-num font-semibold ${isVoided ? 'text-rose-400 line-through' : 'text-emerald-light'}`}>
                          {formatEGP(p.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant="blue">{METHOD_LABELS[p.method] ?? p.method}</Badge>
                      </td>
                      <td className="px-4 py-3 text-obsidian-300 font-num hidden lg:table-cell">
                        REC-{String(p.receipt_number).padStart(8, '0')}
                      </td>
                      <td className="px-4 py-3">
                        {isVoided ? (
                          <span title={p.void_reason ?? 'سبب الإلغاء غير متاح'}>
                            <Badge variant="rose">ملغاة</Badge>
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenReceipt(p)}
                              className="btn-ghost p-1.5 text-obsidian-200 hover:text-emerald-light"
                              title="طباعة إيصال السداد"
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setVoidError(null);
                                setVoidReason('');
                                setVoidTarget(p);
                              }}
                              className="btn-danger px-2 py-1 text-xs"
                              title="إلغاء المعاملة"
                            >
                              <Ban size={13} /> إلغاء
                            </button>
                          </div>
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

      <PaymentForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={refetch} />

      <ConfirmDialog
        open={!!voidTarget}
        onClose={() => {
          if (voiding) return;
          setVoidTarget(null);
          setVoidReason('');
          setVoidError(null);
        }}
        onConfirm={handleVoid}
        title="إلغاء الدفعة"
        message={`سيتم إلغاء الدفعة بقيمة ${formatEGP(voidTarget?.amount ?? 0)} مع الاحتفاظ بسجلها. لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="إلغاء الدفعة"
        loading={voiding}
        confirmDisabled={voidReason.trim().length < 5}
        danger
      >
        <Textarea
          label="سبب الإلغاء (إلزامي)"
          placeholder="مثال: تم إدخال المبلغ أو الطالب بالخطأ"
          rows={3}
          minLength={5}
          maxLength={500}
          value={voidReason}
          onChange={(e) => setVoidReason(e.target.value)}
          required
        />
        {voidError && <Alert variant="error">{voidError}</Alert>}
      </ConfirmDialog>

      <ReceiptModal
        open={!!receiptTarget}
        onClose={() => setReceiptTarget(null)}
        payment={receiptTarget}
      />
    </div>
  );
}
