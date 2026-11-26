import { translate, formatCountPhrase } from '@/lib/translations';
import { useLocale } from '@/context/useLocale';
import { useState, useMemo } from 'react';
import {
  ArrowRight,
  Phone,
  Mail,
  GraduationCap,
  Plus,
  Pencil,
  CreditCard,
  Eye,
  MessageCircle,
  Receipt,
  Printer,
} from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/useRouter';
import { Badge } from '@/components/ui/Badge';
import { paymentStatusBadge } from '@/components/ui/badgeStatus';
import { PageLoader, EmptyState } from '@/components/ui/Feedback';
import { Alert } from '@/components/ui/Alert';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { formatCurrency, formatDate, formatReceiptCode, formatStudentCode } from '@/lib/format';
import { formatEgyptPhoneForWhatsApp, generatePaymentReminderUrl } from '@/lib/whatsapp';
import { QuickEnrollModal } from '@/components/forms/QuickEnrollModal';
import { StudentForm } from '@/components/forms/StudentForm';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { ReceiptModal } from '@/components/modals/ReceiptModal';
import type { Student, EnrollmentBalance } from '@/types/database';
import { useAuth } from '@/context/useAuth';

const EMPLOYMENT_LABELS: Record<string, string> = {
  Employed: 'يعمل',
  Unemployed: 'لا يعمل',
  Student: 'طالب',
  Freelancer: 'مستقل',
};

const METHOD_LABELS: Record<string, string> = {
  'Cash': 'كاش',
  'Bank Transfer': 'تحويل بنكي',
  'Vodafone Cash': 'فودافون كاش',
  'InstaPay': 'إنستاباي',
};

interface StudentPaymentRow {
  payment_id: string;
  amount: number;
  currency: 'EGP' | 'USD';
  payment_date: string;
  method: string;
  receipt_number?: number | null;
  receipt_ref?: string | null;
  cash_box_name?: string | null;
  course_name?: string | null;
  student_name?: string | null;
  student_phone?: string | null;
  notes?: string | null;
  voided_at?: string | null;
  created_at: string;
}

const RECORDED_PAYMENT_COUNT_FORMS = {
  ar: { zero: 'دفعات مسجلة', one: 'دفعة مسجلة', two: 'دفعتان مسجلتان', few: 'دفعات مسجلة', many: 'دفعة مسجلة' },
  en: { one: 'recorded payment', other: 'recorded payments' },
};

export function StudentDetailsPage({ studentId }: { studentId: string }) {
  const { locale } = useLocale();
  const { navigate } = useRouter();
  const { permissions } = useAuth();
  const canReadEnrollments = permissions.includes('enrollments.read');
  const canReadEnrollmentFinance = permissions.includes('enrollments.financial.read');
  // The payments-history endpoint is gated by finance.payments.read on the server.
  const canReadPayments = permissions.includes('finance.payments.read');
  const canReadStudentEmail = permissions.includes('students.email.read');
  const canCreateEnrollment = permissions.includes('enrollments.create');
  const canUpdateStudent = permissions.includes('students.update');
  const canUpdateEnrollmentStatus = permissions.includes('enrollments.update_status');
  const canRecordPayments = permissions.includes('finance.payments.record');

  // Modals state
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [preselectedEnrollmentId, setPreselectedEnrollmentId] = useState<string | undefined>();
  const [statusError, setStatusError] = useState<string | null>(null);

  // Receipt Modal state
  const [receiptTarget, setReceiptTarget] = useState<{
    payment_id: string;
    receipt_number?: number | null;
    student_code?: string | null;
    student_name: string;
    student_phone?: string | null;
    course_name: string;
    amount: number;
    currency: 'EGP' | 'USD';
    payment_date: string;
    method: string;
    receipt_ref?: string | null;
    cash_box_name?: string | null;
    notes?: string | null;
  } | null>(null);

  // Pagination for payments table
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 1. Fetch Student profile
  const { data: student, loading: studentLoading, refetch: refetchStudent } = useQuery<Student>(async () => {
    if (!studentId) return { data: null, error: null };
    const { data, error } = await supabase.rpc('rbac_list_students_v2', {
      p_search: null,
      p_limit: 1,
      p_offset: 0,
      p_student_id: studentId,
    });
    return { data: data?.[0] as Student | undefined ?? null, error: error?.message ?? null };
  }, [studentId]);

  // 2. Fetch Student enrollments
  const { data: enrollments, loading: enrollLoading, refetch: refetchEnrollments } = useQuery<EnrollmentBalance[]>(async () => {
    if (!studentId || !canReadEnrollments) return { data: [], error: null };
    const { data, error } = await supabase.rpc('rbac_list_enrollments_v2', {
      p_search: null, p_limit: 500, p_offset: 0, p_student_id: studentId,
    });
    return { data: data as EnrollmentBalance[] | null, error: error?.message ?? null };
  }, [studentId, canReadEnrollments]);

  // 3. Fetch Student payments history (تاريخ تسجيل الدفعات بالكامل: القيمة، التاريخ، الخزنة، الكورس)
  const { data: payments, loading: paymentsLoading, error: paymentsError, refetch: refetchPayments } = useQuery<StudentPaymentRow[]>(async () => {
    if (!studentId || !canReadPayments) return { data: [], error: null };
    const { data, error } = await supabase.rpc('rbac_list_payments_v2', {
      p_limit: 500,
      p_offset: 0,
      p_student_id: studentId,
      p_enrollment_id: null,
    });
    if (error) return { data: null, error: error.message };
    return { data: ((data ?? []) as StudentPaymentRow[]), error: null };
  }, [studentId, canReadPayments]);

  const totalPayments = payments?.length ?? 0;
  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (payments ?? []).slice(start, start + pageSize);
  }, [payments, page, pageSize]);

  const refetchAll = () => {
    refetchStudent();
    refetchEnrollments();
    refetchPayments();
  };

  const handleUpdateStatus = async (enrId: string, newStatus: string) => {
    if (!canUpdateEnrollmentStatus) return;
    setStatusError(null);
    const { error } = await supabase.rpc('rbac_set_enrollment_status', {
      p_enrollment_id: enrId,
      p_status: newStatus,
    });
    if (error) setStatusError(error.message);
    else refetchEnrollments();
  };

  const handleRecordPayment = (enrId: string) => {
    if (!canRecordPayments) return;
    setPreselectedEnrollmentId(enrId);
    setPaymentFormOpen(true);
  };

  if (studentLoading) return <PageLoader />;

  if (!student) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('students')} className="btn-ghost">
          <ArrowRight size={18} /> {translate("العودة للطلاب")}</button>
        <EmptyState message={translate("الطالب غير موجود")} />
      </div>
    );
  }

  const formattedWa = formatEgyptPhoneForWhatsApp(student.phone);

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button onClick={() => navigate('students')} className="btn-ghost">
          <ArrowRight size={18} /> {translate("العودة لقائمة الطلاب")}</button>
        <div className="flex items-center gap-2 flex-wrap">
          {canCreateEnrollment && <button
            onClick={() => setEnrollModalOpen(true)}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-emerald-brand/20"
          >
            <Plus size={18} />
            {translate("تسجيل الطالب في كورس جديد")}</button>}
          {canUpdateStudent && <button onClick={() => setStudentFormOpen(true)} className="btn-secondary flex items-center gap-2">
            <Pencil size={16} />
            {translate("تعديل بيانات الطالب")}</button>}
        </div>
      </div>

      {/* Student Profile Card */}
      <div className="card-surface p-5 lg:p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-azure-brand to-azure-dark flex items-center justify-center shrink-0 shadow-lg shadow-azure-brand/20">
              <span className="text-white font-bold text-2xl font-arabic">{student.name.charAt(0)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-white font-arabic">{student.name}</h2>
                <span className="font-num text-xs bg-obsidian-700 border border-obsidian-500/40 text-emerald-light px-2 py-0.5 rounded-md font-mono font-bold" title={translate("كود الطالب التسلسلي")}>
                  {formatStudentCode(student.student_id, student.student_code)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={student.employment_status === 'Employed' ? 'emerald' : 'gray'}>
                  {student.employment_status ? translate(EMPLOYMENT_LABELS[student.employment_status] ?? student.employment_status) : '—'}
                </Badge>
                <Badge variant={student.grad_status === 'Graduate' ? 'blue' : 'gray'}>
                  {student.grad_status === 'Graduate' ? translate("خريج") : translate("جامعي")}
                </Badge>
                {student.grad_college && (
                  <span className="text-xs text-obsidian-300 font-medium">{student.grad_college}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t border-obsidian-500/30">
          {student.phone ? (
            <div className="flex items-center justify-between gap-2.5 text-sm p-2.5 bg-obsidian-700/40 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-emerald-light shrink-0" />
                <div>
                  <p className="text-[11px] text-obsidian-300">{translate("رقم الهاتف")}</p>
                  <p className="text-obsidian-100 font-num font-semibold">{student.phone}</p>
                </div>
              </div>
              {formattedWa && (
                <a
                  href={`https://wa.me/${formattedWa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                  title={translate("محادثة واتساب مباشرة مع المتدرب")}
                >
                  <MessageCircle size={16} />
                </a>
              )}
            </div>
          ) : null}

          {canReadStudentEmail && student.email ? (
            <div className="flex items-center gap-2.5 text-sm p-2.5 bg-obsidian-700/40 rounded-xl">
              <Mail size={16} className="text-azure-light shrink-0" />
              <div>
                <p className="text-[11px] text-obsidian-300">{translate("البريد الإلكتروني")}</p>
                <p className="text-obsidian-100 font-medium">{student.email}</p>
              </div>
            </div>
          ) : null}

          {student.grad_college ? (
            <div className="flex items-center gap-2.5 text-sm p-2.5 bg-obsidian-700/40 rounded-xl">
              <GraduationCap size={16} className="text-violet-400 shrink-0" />
              <div>
                <p className="text-[11px] text-obsidian-300">{translate("الكلية / الجامعة")}</p>
                <p className="text-obsidian-100 font-medium">{student.grad_college}</p>
              </div>
            </div>
          ) : null}
          {student.country ? (
            <div className="flex items-center gap-2.5 text-sm p-2.5 bg-obsidian-700/40 rounded-xl">
              <div><p className="text-[11px] text-obsidian-300">{translate("الدولة")}</p><p className="text-obsidian-100 font-medium">{student.country}</p></div>
            </div>
          ) : null}
          {student.governorate ? (
            <div className="flex items-center gap-2.5 text-sm p-2.5 bg-obsidian-700/40 rounded-xl">
              <div><p className="text-[11px] text-obsidian-300">{translate("المحافظة")}</p><p className="text-obsidian-100 font-medium">{student.governorate}</p></div>
            </div>
          ) : null}
          {student.workplace ? (
            <div className="flex items-center gap-2.5 text-sm p-2.5 bg-obsidian-700/40 rounded-xl">
              <div><p className="text-[11px] text-obsidian-300">{translate("جهة العمل")}</p><p className="text-obsidian-100 font-medium">{student.workplace}</p></div>
            </div>
          ) : null}
          {student.study_year ? (
            <div className="flex items-center gap-2.5 text-sm p-2.5 bg-obsidian-700/40 rounded-xl">
              <div><p className="text-[11px] text-obsidian-300">{translate("السنة الدراسية")}</p><p className="text-obsidian-100 font-medium">{student.study_year}</p></div>
            </div>
          ) : null}
        </div>

        {/* Previous Courses */}
        {student.previous_courses && (
          <div className="p-3 bg-obsidian-700/30 rounded-xl border border-obsidian-500/20 text-xs">
            <span className="text-obsidian-300 font-semibold ml-2">{translate("الكورسات السابقة:")}</span>
            <span className="text-obsidian-100">{student.previous_courses}</span>
          </div>
        )}

        {/* Notes */}
        {student.notes && (
          <div className="p-3 bg-obsidian-700/30 rounded-xl border border-obsidian-500/20 text-xs">
            <span className="text-obsidian-300 font-semibold ml-2">{translate("ملاحظات إضافية:")}</span>
            <span className="text-obsidian-100">{student.notes}</span>
          </div>
        )}
      </div>

      {statusError && <Alert variant="error">{statusError}</Alert>}

      {/* Student Enrollments */}
      {canReadEnrollments && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">{translate("تسجيلات الطالب")}</h3>
            {canCreateEnrollment && (
              <button onClick={() => setEnrollModalOpen(true)} className="btn-primary text-xs py-1.5 px-3">
                <Plus size={15} /> {translate("إضافة دورة")}
              </button>
            )}
          </div>
          {enrollLoading ? (
            <PageLoader />
          ) : !enrollments || enrollments.length === 0 ? (
            <div className="card-surface">
              <EmptyState message={translate("لا توجد تسجيلات لهذا الطالب بعد.")} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrollments.map((enr) => {
                const ps = canReadEnrollmentFinance ? paymentStatusBadge(enr.payment_status ?? 'Unpaid') : null;
                const reminderUrl = canReadEnrollmentFinance && student.phone && enr.remaining_balance != null && enr.remaining_balance > 0
                  ? generatePaymentReminderUrl({ phone: student.phone, studentName: student.name, courseName: enr.course_name, remainingAmount: enr.remaining_balance, currency: enr.agreed_currency ?? 'EGP' })
                  : null;
                return (
                  <div key={enr.enrollment_id} className="card-surface p-4 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h4 className="text-white font-bold text-base">{enr.course_name}</h4>
                        {ps && <Badge variant={ps.variant}>{ps.label}</Badge>}
                      </div>
                      {canReadEnrollmentFinance && (
                        <div className="grid grid-cols-2 gap-3 text-xs bg-obsidian-700/40 p-3 rounded-xl">
                          <div>
                            <p className="text-obsidian-300">{translate("المبلغ المتفق عليه")}</p>
                            <p className="text-white font-num font-bold">
                              {enr.agreed_cost == null ? '—' : formatCurrency(enr.agreed_cost, enr.agreed_currency ?? 'EGP')}
                            </p>
                          </div>
                          <div>
                            <p className="text-obsidian-300">{translate("المدفوع")}</p>
                            <p className="text-emerald-light font-num font-bold">
                              {formatCurrency(enr.total_paid ?? 0, enr.agreed_currency ?? 'EGP')}
                            </p>
                          </div>
                          <div>
                            <p className="text-obsidian-300">{translate("المتبقي")}</p>
                            <p className="text-amber-400 font-num font-bold">
                              {formatCurrency(Math.max(0, enr.remaining_balance ?? 0), enr.agreed_currency ?? 'EGP')}
                            </p>
                          </div>
                          <div>
                            <p className="text-obsidian-300">{translate("تاريخ التسجيل")}</p>
                            <p className="text-obsidian-100 font-num">{formatDate(enr.enrolled_at)}</p>
                          </div>
                        </div>
                      )}
                      {!canReadEnrollmentFinance && (
                        <p className="text-xs text-obsidian-300">
                          {translate("مسجل بتاريخ")} {formatDate(enr.enrolled_at)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-obsidian-500/30 flex-wrap">
                      {canUpdateEnrollmentStatus ? (
                        <select
                          value={enr.enrollment_status}
                          onChange={(e) => handleUpdateStatus(enr.enrollment_id, e.target.value)}
                          className="bg-obsidian-700 text-xs text-obsidian-100 rounded-lg px-2 py-1 border border-obsidian-500/30 outline-none"
                        >
                          <option value="Active">{translate("نشط")}</option>
                          <option value="Completed">{translate("مكتمل")}</option>
                          <option value="Dropped">{translate("منسحب")}</option>
                        </select>
                      ) : (
                        <span className="text-xs text-obsidian-300">
                          {translate(enr.enrollment_status === 'Active' ? "نشط" : enr.enrollment_status === 'Completed' ? "مكتمل" : "منسحب")}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        {canRecordPayments && enr.remaining_balance != null && enr.remaining_balance > 0 && (
                          <button
                            onClick={() => handleRecordPayment(enr.enrollment_id)}
                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                          >
                            <CreditCard size={14} /> {translate("تسجيل دفعة")}
                          </button>
                        )}
                        {reminderUrl && (
                          <a
                            href={reminderUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5"
                          >
                            <MessageCircle size={14} /> {translate("إرسال تذكير واتساب")}
                          </a>
                        )}
                        <button
                          onClick={() => navigate('course-details', { id: enr.course_id })}
                          className="btn-ghost p-1.5"
                          title={translate("تفاصيل الدورة")}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Student Payments History (تاريخ تسجيل الدفعات بالكامل: القيمة، التاريخ، الخزنة، الكورس) */}
      {canReadPayments && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Receipt size={20} className="text-emerald-light" />
                {translate("سجل دفعات الطالب")}
              </h3>
              <p className="text-obsidian-300 text-xs mt-0.5">
                {translate("تاريخ تسجيل الدفعات بالكامل (القيمة، التاريخ، الخزنة، والدورة التدريبية)")}
              </p>
            </div>
            <span className="text-obsidian-300 text-xs font-num">{formatCountPhrase(totalPayments, RECORDED_PAYMENT_COUNT_FORMS, locale)}</span>
          </div>

          <div className="card-surface overflow-hidden">
            {paymentsLoading ? (
              <PageLoader />
            ) : paymentsError ? (
              <div className="p-4">
                <Alert variant="error">{paymentsError}</Alert>
              </div>
            ) : totalPayments === 0 ? (
              <EmptyState message={translate("لا توجد دفعات مسجلة لهذا الطالب بعد")} />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-obsidian-300 text-xs border-b border-obsidian-500/30 bg-obsidian-700/20">
                        <th className="text-right font-medium px-4 py-3">{translate("القيمة")}</th>
                        <th className="text-right font-medium px-4 py-3">{translate("التاريخ")}</th>
                        <th className="text-right font-medium px-4 py-3">{translate("الخزنة")}</th>
                        <th className="text-right font-medium px-4 py-3">{translate("الكورس")}</th>
                        <th className="text-right font-medium px-4 py-3 hidden sm:table-cell">{translate("طريقة الدفع")}</th>
                        <th className="text-right font-medium px-4 py-3 hidden md:table-cell">{translate("رقم الإيصال")}</th>
                        <th className="text-right font-medium px-4 py-3">{translate("إيصال")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-obsidian-500/20">
                      {paginatedPayments.map((p) => (
                        <tr
                          key={p.payment_id}
                          className={`hover:bg-obsidian-700/30 transition-colors ${
                            p.voided_at ? 'opacity-40 line-through' : ''
                          }`}
                        >
                          {/* 1. القيمة */}
                          <td className="px-4 py-3 font-num font-bold text-emerald-light whitespace-nowrap">
                            {formatCurrency(Math.abs(p.amount), p.currency ?? 'EGP')}
                          </td>

                          {/* 2. التاريخ */}
                          <td className="px-4 py-3 text-obsidian-300 font-num text-xs whitespace-nowrap">
                            {formatDate(p.payment_date)}
                          </td>

                          {/* 3. الخزنة */}
                          <td className="px-4 py-3 text-obsidian-200 text-xs whitespace-nowrap">
                            <span className="bg-obsidian-700/50 px-2 py-0.5 rounded text-obsidian-100 font-medium">
                              {p.cash_box_name || '—'}
                            </span>
                          </td>

                          {/* 4. الكورس */}
                          <td className="px-4 py-3 text-white text-xs font-medium">
                            {p.course_name || '—'}
                          </td>

                          {/* 5. طريقة الدفع */}
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <Badge variant="blue">{translate(METHOD_LABELS[p.method] ?? p.method)}</Badge>
                          </td>

                          {/* 6. رقم الإيصال */}
                          <td className="px-4 py-3 hidden md:table-cell text-obsidian-300 font-num text-xs">
                            {p.receipt_number != null ? formatReceiptCode(p.receipt_number, p.payment_id) : (p.receipt_ref || '—')}
                          </td>

                          {/* 7. إيصال */}
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                setReceiptTarget({
                                  payment_id: p.payment_id,
                                  receipt_number: p.receipt_number,
                                  student_code: student.student_code,
                                  student_name: student.name,
                                  student_phone: student.phone,
                                  course_name: p.course_name || translate("كورس تدريبي"),
                                  amount: p.amount,
                                  currency: p.currency,
                                  payment_date: p.payment_date,
                                  method: p.method,
                                  receipt_ref: p.receipt_ref,
                                  cash_box_name: p.cash_box_name,
                                  notes: p.notes,
                                })
                              }
                              className="btn-ghost p-1.5 text-obsidian-200 hover:text-emerald-light"
                              title={translate("عرض وطباعة إيصال السداد")}
                            >
                              <Printer size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <PaginationControls
                  page={page}
                  pageSize={pageSize}
                  total={totalPayments}
                  onPageChange={setPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPage(1);
                  }}
                />
              </>
            )}
          </div>
        </section>
      )}

      {/* Modals */}
      <QuickEnrollModal
        open={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        onSaved={refetchAll}
        preselectedStudentId={studentId}
      />

      <StudentForm
        open={studentFormOpen}
        onClose={() => setStudentFormOpen(false)}
        onSaved={refetchAll}
        student={student}
      />

      <PaymentForm
        open={paymentFormOpen}
        onClose={() => {
          setPaymentFormOpen(false);
          setPreselectedEnrollmentId(undefined);
        }}
        onSaved={refetchAll}
        preselectedEnrollmentId={preselectedEnrollmentId}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        open={!!receiptTarget}
        onClose={() => setReceiptTarget(null)}
        payment={receiptTarget}
      />
    </div>
  );
}
