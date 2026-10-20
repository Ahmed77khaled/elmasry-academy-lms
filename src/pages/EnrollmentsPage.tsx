import { useState } from 'react';
import { Search, Plus, CreditCard, Eye } from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/components/AppShell';
import { Badge, paymentStatusBadge, enrollmentStatusBadge } from '@/components/ui/Badge';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { QuickEnrollModal } from '@/components/forms/QuickEnrollModal';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { formatEGP, formatDate } from '@/lib/format';
import type { EnrollmentBalance } from '@/types/database';

export function EnrollmentsPage() {
  const { navigate } = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [payFilter, setPayFilter] = useState('');
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [selectedEnrForPay, setSelectedEnrForPay] = useState<string | undefined>();

  const { data: enrollments, loading, refetch } = useQuery<EnrollmentBalance[]>(async () => {
    let query = supabase.from('enrollment_balances').select('*').order('enrolled_at', { ascending: false });
    if (search.trim()) {
      query = query.or(`student_name.ilike.%${search}%,course_name.ilike.%${search}%`);
    }
    if (statusFilter) query = query.eq('enrollment_status', statusFilter);
    if (payFilter) query = query.eq('payment_status', payFilter);
    const { data, error } = await query;
    return { data, error: error?.message ?? null };
  });

  const handleUpdateStatus = async (enrId: string, newStatus: string) => {
    await supabase.from('enrollments').update({ status: newStatus }).eq('enrollment_id', enrId);
    refetch();
  };

  const handleRecordPayment = (enrId: string) => {
    setSelectedEnrForPay(enrId);
    setPaymentFormOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-bold text-xl">جدول الاشتراكات المركزي</h2>
          <p className="text-obsidian-300 text-sm mt-1">كل الاشتراكات عبر جميع الكورسات</p>
        </div>
        <button onClick={() => setEnrollModalOpen(true)} className="btn-primary">
          <Plus size={18} />
          تسجيل طالب في كورس
        </button>
      </div>

      <div className="card-surface p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-obsidian-700 rounded-lg px-3 py-2 border border-obsidian-500/40 flex-1 min-w-[200px]">
          <Search size={16} className="text-obsidian-300 shrink-0" />
          <input
            type="text"
            placeholder="بحث بالطالب أو الكورس..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-obsidian-100 placeholder:text-obsidian-300 outline-none w-full"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base w-auto">
          <option value="">كل حالات الاشتراك</option>
          <option value="Active">نشط</option>
          <option value="Completed">مكتمل</option>
          <option value="Dropped">منسحب</option>
        </select>
        <select value={payFilter} onChange={(e) => setPayFilter(e.target.value)} className="input-base w-auto">
          <option value="">كل حالات الدفع</option>
          <option value="Paid">مدفوع</option>
          <option value="Partial">جزئي</option>
          <option value="Unpaid">غير مدفوع</option>
          <option value="Overpaid">مدفوع زيادة</option>
        </select>
      </div>

      <div className="card-surface overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : !enrollments || enrollments.length === 0 ? (
          <EmptyState
            message="لا توجد اشتراكات مسجلة — اضغط على زر تسجيل طالب في كورس للبدء"
            action={<button onClick={() => setEnrollModalOpen(true)} className="btn-primary"><Plus size={16} /> تسجيل طالب</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-obsidian-300 text-xs border-b border-obsidian-500/30">
                  <th className="text-right font-medium px-4 py-3">الطالب</th>
                  <th className="text-right font-medium px-4 py-3">الكورس</th>
                  <th className="text-right font-medium px-4 py-3 hidden sm:table-cell">تاريخ التسجيل</th>
                  <th className="text-right font-medium px-4 py-3">المتفق عليه</th>
                  <th className="text-right font-medium px-4 py-3">المدفوع</th>
                  <th className="text-right font-medium px-4 py-3">المتبقي</th>
                  <th className="text-right font-medium px-4 py-3">حالة السداد</th>
                  <th className="text-right font-medium px-4 py-3">حالة الاشتراك</th>
                  <th className="text-right font-medium px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enr) => {
                  const ps = paymentStatusBadge(enr.payment_status);
                  return (
                    <tr key={enr.enrollment_id} className="border-b border-obsidian-500/20 hover:bg-obsidian-700/30 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">
                        <button
                          onClick={() => navigate('student-details', { id: enr.student_id })}
                          className="hover:text-emerald-light transition-colors text-right"
                        >
                          {enr.student_name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-obsidian-200">
                        <button
                          onClick={() => navigate('course-details', { id: enr.course_id })}
                          className="hover:text-azure-brand transition-colors text-right"
                        >
                          {enr.course_name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-obsidian-300 font-num hidden sm:table-cell">{formatDate(enr.enrolled_at)}</td>
                      <td className="px-4 py-3 font-num text-obsidian-100">{formatEGP(enr.agreed_cost)}</td>
                      <td className="px-4 py-3 font-num text-emerald-light font-bold">{formatEGP(enr.total_paid)}</td>
                      <td className={`px-4 py-3 font-num font-semibold ${enr.remaining_balance < 0 ? 'text-violet-400' : enr.remaining_balance > 0 ? 'text-amber-400' : 'text-emerald-light'}`}>
                        {formatEGP(enr.remaining_balance)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ps.variant}>{ps.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={enr.enrollment_status}
                          onChange={(e) => handleUpdateStatus(enr.enrollment_id, e.target.value)}
                          className="bg-obsidian-700 text-xs text-obsidian-100 rounded-lg px-2 py-1 border border-obsidian-500/30 outline-none"
                        >
                          <option value="Active">نشط</option>
                          <option value="Completed">مكتمل</option>
                          <option value="Dropped">منسحب</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {enr.remaining_balance > 0 && (
                            <button
                              onClick={() => handleRecordPayment(enr.enrollment_id)}
                              className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
                              title="تسجيل دفعة لهذا الطالب"
                            >
                              <CreditCard size={13} />
                              دفع قسط
                            </button>
                          )}
                          <button
                            onClick={() => navigate('student-details', { id: enr.student_id })}
                            className="btn-ghost p-1.5"
                            title="عرض ملف الطالب"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <QuickEnrollModal
        open={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        onSaved={refetch}
      />

      <PaymentForm
        open={paymentFormOpen}
        onClose={() => {
          setPaymentFormOpen(false);
          setSelectedEnrForPay(undefined);
        }}
        onSaved={refetch}
        preselectedEnrollmentId={selectedEnrForPay}
      />
    </div>
  );
}
