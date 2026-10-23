import { translate } from '@/lib/translations';
import { translateTemplate } from '@/lib/translations';
import { useState } from 'react';
import { Search, Plus, CreditCard, FileSpreadsheet, MessageCircle } from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/useRouter';
import { Badge } from '@/components/ui/Badge';
import { paymentStatusBadge } from '@/components/ui/badgeStatus';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { QuickEnrollModal } from '@/components/forms/QuickEnrollModal';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { formatEGP, formatDate } from '@/lib/format';
import { exportToCSV } from '@/lib/exportExcel';
import { generatePaymentReminderUrl } from '@/lib/whatsapp';
import { Alert } from '@/components/ui/Alert';
import type { EnrollmentBalance } from '@/types/database';
import { useAuth } from '@/context/useAuth';

export function EnrollmentsPage() {
  const { navigate } = useRouter();
  const { permissions } = useAuth();
  const canReadEnrollmentFinance = permissions.includes('enrollments.financial.read');
  const canReadStudentPhones = permissions.includes('students.read_contact_phone');
  const canExportEnrollments = permissions.includes('enrollments.export') && canReadEnrollmentFinance;
  const canCreateEnrollment = permissions.includes('enrollments.create');
  const canUpdateEnrollmentStatus = permissions.includes('enrollments.update_status');
  const canRecordPayments = permissions.includes('finance.payments.record');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [payFilter, setPayFilter] = useState('');
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [selectedEnrForPay, setSelectedEnrForPay] = useState<string | undefined>();
  const [statusError, setStatusError] = useState<string | null>(null);

  // Phone lookup map for students to power 1-click WhatsApp reminders
  const { data: studentsPhoneMap } = useQuery<Record<string, string>>(async () => {
    if (!canReadStudentPhones) return { data: {}, error: null };
    const { data, error } = await supabase.rpc('rbac_list_students', {
      p_search: null, p_limit: 500, p_offset: 0,
    });
    if (error || !data) return { data: {}, error: error?.message ?? null };
    const map: Record<string, string> = {};
    (data as { student_id: string | null; phone: string | null }[]).forEach((s) => {
      if (s.student_id && s.phone) {
        map[s.student_id] = s.phone;
      }
    });
    return { data: map, error: null };
  }, [canReadStudentPhones]);

  const { data: enrollments, loading, refetch } = useQuery<EnrollmentBalance[]>(async () => {
    const { data, error } = await supabase.rpc('rbac_list_enrollments', {
      p_search: search.trim() || null, p_limit: 500, p_offset: 0,
    });
    if (error) return { data: null, error: error.message };
    const filtered = ((data ?? []) as EnrollmentBalance[]).filter((enrollment) =>
      (!statusFilter || enrollment.enrollment_status === statusFilter)
      && (!canReadEnrollmentFinance || !payFilter || enrollment.payment_status === payFilter));
    return { data: filtered as EnrollmentBalance[], error: null };
  }, [search, statusFilter, payFilter, canReadEnrollmentFinance]);

  const handleUpdateStatus = async (enrId: string, newStatus: string) => {
    if (!canUpdateEnrollmentStatus) return;
    setStatusError(null);
    const { error } = await supabase.rpc('rbac_set_enrollment_status', {
      p_enrollment_id: enrId,
      p_status: newStatus,
    });
    if (error) setStatusError(error.message);
    else refetch();
  };

  const handleRecordPayment = (enrId: string) => {
    if (!canRecordPayments) return;
    setSelectedEnrForPay(enrId);
    setPaymentFormOpen(true);
  };

  // Export to Excel handler
  const handleExportExcel = () => {
    if (!canExportEnrollments || !enrollments || enrollments.length === 0) return;

    const headers = [
      translate("اسم المتدرب"),
      translate("رقم الهاتف"),
      translate("الدورة التدريبية"),
      translate("تاريخ التسجيل"),
      translate("المتفق عليه (ج.م)"),
      translate("المدفوع (ج.م)"),
      translate("المتبقي (ج.م)"),
      translate("حالة السداد"),
      translate("حالة الاشتراك"),
    ];

    const rows = enrollments.map((enr) => {
      const ps = canReadEnrollmentFinance ? paymentStatusBadge(enr.payment_status ?? 'Unpaid') : null;
      return [
        enr.student_name,
        studentsPhoneMap?.[enr.student_id] ?? '',
        enr.course_name,
        enr.enrolled_at?.slice(0, 10) ?? '',
        enr.agreed_cost,
        enr.total_paid,
        enr.remaining_balance,
        ps?.label ?? '',
        enr.enrollment_status === 'Active' ? translate("نشط") : enr.enrollment_status === 'Completed' ? translate("مكتمل") : translate("منسحب"),
      ];
    });

    const dateSuffix = new Date().toISOString().slice(0, 10);
    exportToCSV({
      filename: translateTemplate('تقرير_الاشتراكات_{date}', { date: dateSuffix }),
      headers,
      rows,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-bold text-xl">{translate("جدول الاشتراكات المركزي")}</h2>
          <p className="text-obsidian-300 text-sm mt-1">{translate("كل الاشتراكات ومتابعة الأقساط عبر جميع الكورسات")}</p>
        </div>
        <div className="flex items-center gap-2">
          {canExportEnrollments && <button
            onClick={handleExportExcel}
            className="btn-secondary flex items-center gap-2 text-sm bg-obsidian-700 hover:bg-obsidian-600 text-emerald-light border border-emerald-500/30"
            title={translate("تصدير بيانات الاشتراكات لملف إكسيل")}
          >
            <FileSpreadsheet size={16} />
            {translate("تصدير إكسيل")}</button>}
          {canCreateEnrollment && <button onClick={() => setEnrollModalOpen(true)} className="btn-primary">
            <Plus size={18} />
            {translate("تسجيل طالب في كورس")}</button>}
        </div>
      </div>

      {statusError && <Alert variant="error">{statusError}</Alert>}

      <div className="card-surface p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-obsidian-700 rounded-lg px-3 py-2 border border-obsidian-500/40 flex-1 min-w-[200px]">
            <Search size={16} className="text-obsidian-300 shrink-0" />
            <input
              type="text"
              placeholder={translate("بحث بالطالب أو الكورس...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-obsidian-100 placeholder:text-obsidian-300 outline-none w-full"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base w-auto">
            <option value="">{translate("كل حالات الاشتراك")}</option>
            <option value="Active">{translate("نشط")}</option>
            <option value="Completed">{translate("مكتمل")}</option>
            <option value="Dropped">{translate("منسحب")}</option>
          </select>
          {canReadEnrollmentFinance && <select value={payFilter} onChange={(e) => setPayFilter(e.target.value)} className="input-base w-auto">
            <option value="">{translate("كل حالات الدفع")}</option>
            <option value="Paid">{translate("مدفوع")}</option>
            <option value="Partial">{translate("جزئي")}</option>
            <option value="Unpaid">{translate("غير مدفوع")}</option>
            <option value="Overpaid">{translate("مدفوع زيادة")}</option>
          </select>}
        </div>

        {enrollments && (
          <div className="flex items-center justify-between flex-wrap gap-3 text-xs text-obsidian-300 pt-1">
            <div>
              {translate("عدد الاشتراكات:")}{' '}<span className="font-num text-white font-semibold">{enrollments.length}</span>
            </div>
            {canReadEnrollmentFinance && <div className="flex items-center gap-4">
              <span>
                {translate("إجمالي المحصل:")}{' '}
                <span className="font-num text-emerald-light font-bold">
                  {formatEGP(enrollments.reduce((sum, e) => sum + Number(e.total_paid), 0))}
                </span>
              </span>
              <span>
                {translate("المتبقي المطلوب:")}{' '}
                <span className="font-num text-amber-400 font-bold">
                  {formatEGP(
                    enrollments.reduce((sum, e) => sum + (e.remaining_balance != null && e.remaining_balance > 0 ? Number(e.remaining_balance) : 0), 0)
                  )}
                </span>
              </span>
            </div>}
          </div>
        )}
      </div>

      <div className="card-surface overflow-hidden">
        {loading ? <PageLoader /> : !enrollments || enrollments.length === 0 ? (
          <EmptyState message={translate("لا توجد تسجيلات مطابقة.")} action={canCreateEnrollment ? <button onClick={() => setEnrollModalOpen(true)} className="btn-primary"><Plus size={16} /> {translate("تسجيل طالب")}</button> : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-obsidian-300 text-xs border-b border-obsidian-500/30">
                <th className="text-right font-medium px-4 py-3">{translate("الطالب")}</th>
                <th className="text-right font-medium px-4 py-3">{translate("الدورة التدريبية")}</th>
                <th className="text-right font-medium px-4 py-3">{translate("تاريخ التسجيل")}</th>
                {canReadEnrollmentFinance && <><th className="text-right font-medium px-4 py-3">{translate("المتفق عليه (ج.م)")}</th><th className="text-right font-medium px-4 py-3">{translate("المدفوع (ج.م)")}</th><th className="text-right font-medium px-4 py-3">{translate("المتبقي (ج.م)")}</th><th className="text-right font-medium px-4 py-3">{translate("حالة السداد")}</th></>}
                <th className="text-right font-medium px-4 py-3">{translate("حالة التسجيل")}</th>
                {(canRecordPayments || canReadEnrollmentFinance) && <th className="text-right font-medium px-4 py-3">{translate("إجراءات")}</th>}
              </tr></thead>
              <tbody>{enrollments.map((enr) => {
                const ps = canReadEnrollmentFinance ? paymentStatusBadge(enr.payment_status ?? 'Unpaid') : null;
                const studentPhone = canReadStudentPhones ? studentsPhoneMap?.[enr.student_id] : undefined;
                const reminderUrl = canReadEnrollmentFinance && enr.remaining_balance != null && enr.remaining_balance > 0 && studentPhone
                  ? generatePaymentReminderUrl({ phone: studentPhone, studentName: enr.student_name, courseName: enr.course_name, remainingAmount: enr.remaining_balance })
                  : null;
                return <tr key={enr.enrollment_id} className="border-b border-obsidian-500/20 hover:bg-obsidian-700/30">
                  <td className="px-4 py-3 text-white"><button onClick={() => navigate('student-details', { id: enr.student_id })} className="text-right">{enr.student_name}</button></td>
                  <td className="px-4 py-3 text-obsidian-200"><button onClick={() => navigate('course-details', { id: enr.course_id })} className="text-right">{enr.course_name}</button></td>
                  <td className="px-4 py-3 text-obsidian-300">{formatDate(enr.enrolled_at)}</td>
                  {canReadEnrollmentFinance && <>
                    <td className="px-4 py-3">{enr.agreed_cost == null ? '—' : formatEGP(enr.agreed_cost)}</td>
                    <td className="px-4 py-3">{formatEGP(enr.total_paid ?? 0)}</td>
                    <td className="px-4 py-3">{formatEGP(enr.remaining_balance ?? 0)}</td>
                    <td className="px-4 py-3">{ps && <Badge variant={ps.variant}>{ps.label}</Badge>}</td>
                  </>}
                  <td className="px-4 py-3">{canUpdateEnrollmentStatus ? <select value={enr.enrollment_status} onChange={(e) => void handleUpdateStatus(enr.enrollment_id, e.target.value)} className="bg-obsidian-700 text-xs rounded-lg px-2 py-1"><option value="Active">{translate("نشط")}</option><option value="Completed">{translate("مكتمل")}</option><option value="Dropped">{translate("منسحب")}</option></select> : translate(enr.enrollment_status === 'Active' ? "نشط" : enr.enrollment_status === 'Completed' ? "مكتمل" : "منسحب")}</td>
                  {(canRecordPayments || reminderUrl) && <td className="px-4 py-3"><div className="flex items-center gap-1.5">
                    {canRecordPayments && enr.remaining_balance != null && enr.remaining_balance > 0 && <button onClick={() => handleRecordPayment(enr.enrollment_id)} className="btn-primary text-xs py-1 px-2.5"><CreditCard size={13} /> {translate("تسجيل دفعة")}</button>}
                    {reminderUrl && <a href={reminderUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1 px-2"><MessageCircle size={13} /> {translate("إرسال تذكير واتساب")}</a>}
                  </div></td>}
                </tr>;
              })}</tbody>
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
