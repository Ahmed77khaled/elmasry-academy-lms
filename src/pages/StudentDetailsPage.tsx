import { useState } from 'react';
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
} from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/components/AppShell';
import { Badge, paymentStatusBadge } from '@/components/ui/Badge';
import { PageLoader, EmptyState } from '@/components/ui/Feedback';
import { formatEGP, formatDate } from '@/lib/format';
import { formatEgyptPhoneForWhatsApp, generatePaymentReminderUrl } from '@/lib/whatsapp';
import { QuickEnrollModal } from '@/components/forms/QuickEnrollModal';
import { StudentForm } from '@/components/forms/StudentForm';
import { PaymentForm } from '@/components/forms/PaymentForm';
import type { Student, EnrollmentBalance } from '@/types/database';
import { Alert } from '@/components/ui/Alert';

const EMPLOYMENT_LABELS: Record<string, string> = {
  Employed: 'يعمل',
  Unemployed: 'لا يعمل',
  Student: 'طالب',
  Freelancer: 'مستقل',
};

export function StudentDetailsPage({ studentId }: { studentId: string }) {
  const { navigate } = useRouter();

  // Modals state
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [preselectedEnrollmentId, setPreselectedEnrollmentId] = useState<string | undefined>();
  const [statusError, setStatusError] = useState<string | null>(null);

  const { data: student, loading: studentLoading, refetch: refetchStudent } = useQuery<Student>(async () => {
    if (!studentId) return { data: null, error: null };
    const { data, error } = await supabase.from('students').select('*').eq('student_id', studentId).maybeSingle();
    return { data, error: error?.message ?? null };
  }, [studentId]);

  const { data: enrollments, loading: enrollLoading, refetch: refetchEnrollments } = useQuery<EnrollmentBalance[]>(async () => {
    if (!studentId) return { data: [], error: null };
    const { data, error } = await supabase
      .from('enrollment_balances')
      .select('*')
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false });
    return { data, error: error?.message ?? null };
  }, [studentId]);

  const refetchAll = () => {
    refetchStudent();
    refetchEnrollments();
  };

  const handleUpdateStatus = async (enrId: string, newStatus: string) => {
    setStatusError(null);
    const { error } = await supabase.rpc('set_enrollment_status', {
      p_enrollment_id: enrId,
      p_status: newStatus,
    });
    if (error) setStatusError(error.message);
    else refetchEnrollments();
  };

  const handleRecordPayment = (enrId: string) => {
    setPreselectedEnrollmentId(enrId);
    setPaymentFormOpen(true);
  };

  if (studentLoading) return <PageLoader />;

  if (!student) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('students')} className="btn-ghost">
          <ArrowRight size={18} /> العودة للطلاب
        </button>
        <EmptyState message="الطالب غير موجود" />
      </div>
    );
  }

  const formattedWa = formatEgyptPhoneForWhatsApp(student.phone);

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button onClick={() => navigate('students')} className="btn-ghost">
          <ArrowRight size={18} /> العودة لقائمة الطلاب
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setEnrollModalOpen(true)}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-emerald-brand/20"
          >
            <Plus size={18} />
            تسجيل الطالب في كورس جديد
          </button>
          <button onClick={() => setStudentFormOpen(true)} className="btn-secondary flex items-center gap-2">
            <Pencil size={16} />
            تعديل بيانات الطالب
          </button>
        </div>
      </div>

      {/* Student Profile Card */}
      <div className="card-surface p-5 lg:p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-azure-brand to-azure-light flex items-center justify-center shrink-0 shadow-lg shadow-azure-brand/20">
              <span className="text-white font-bold text-2xl font-arabic">{student.name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-arabic">{student.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={student.employment_status === 'Employed' ? 'emerald' : 'gray'}>
                  {student.employment_status ? EMPLOYMENT_LABELS[student.employment_status] : '—'}
                </Badge>
                <Badge variant={student.grad_status === 'Graduate' ? 'blue' : 'gray'}>
                  {student.grad_status === 'Graduate' ? 'خريج' : 'جامعي'}
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
                  <p className="text-[11px] text-obsidian-300">رقم الهاتف</p>
                  <p className="text-obsidian-100 font-num font-semibold">{student.phone}</p>
                </div>
              </div>
              {formattedWa && (
                <a
                  href={`https://wa.me/${formattedWa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                  title="محادثة واتساب مباشرة مع المتدرب"
                >
                  <MessageCircle size={16} />
                </a>
              )}
            </div>
          ) : null}

          {student.email ? (
            <div className="flex items-center gap-2.5 text-sm p-2.5 bg-obsidian-700/40 rounded-xl">
              <Mail size={16} className="text-azure-brand shrink-0" />
              <div>
                <p className="text-[11px] text-obsidian-300">البريد الإلكتروني</p>
                <p className="text-obsidian-100 font-medium">{student.email}</p>
              </div>
            </div>
          ) : null}

          {student.grad_college ? (
            <div className="flex items-center gap-2.5 text-sm p-2.5 bg-obsidian-700/40 rounded-xl">
              <GraduationCap size={16} className="text-violet-400 shrink-0" />
              <div>
                <p className="text-[11px] text-obsidian-300">الكلية / الجامعة</p>
                <p className="text-obsidian-100 font-medium">{student.grad_college}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Previous Courses */}
        {student.previous_courses && (
          <div className="p-3 bg-obsidian-700/30 rounded-xl border border-obsidian-500/20 text-xs">
            <span className="text-obsidian-300 font-semibold ml-2">الكورسات السابقة:</span>
            <span className="text-obsidian-100">{student.previous_courses}</span>
          </div>
        )}

        {/* Notes */}
        {student.notes && (
          <div className="p-3 bg-obsidian-700/30 rounded-xl border border-obsidian-500/20 text-xs">
            <span className="text-obsidian-300 font-semibold ml-2">ملاحظات إضافية:</span>
            <span className="text-obsidian-100">{student.notes}</span>
          </div>
        )}
      </div>

      {statusError && <Alert variant="error">{statusError}</Alert>}

      {/* Enrolled Courses Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">سجل الكورسات والاشتراكات</h3>
          <button onClick={() => setEnrollModalOpen(true)} className="btn-primary text-xs py-1.5 px-3">
            <Plus size={15} /> إضافة كورس للطالب
          </button>
        </div>

        {enrollLoading ? (
          <PageLoader />
        ) : !enrollments || enrollments.length === 0 ? (
          <div className="card-surface">
            <EmptyState
              message="الطالب غير مسجل في أي كورس بعد"
              action={
                <button onClick={() => setEnrollModalOpen(true)} className="btn-primary">
                  <Plus size={16} /> تسجيل في أول كورس
                </button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrollments.map((enr) => {
              const ps = paymentStatusBadge(enr.payment_status);
              const reminderUrl =
                student.phone && enr.remaining_balance > 0
                  ? generatePaymentReminderUrl({
                      phone: student.phone,
                      studentName: student.name,
                      courseName: enr.course_name,
                      remainingAmount: enr.remaining_balance,
                    })
                  : null;

              return (
                <div key={enr.enrollment_id} className="card-surface p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h4 className="text-white font-bold text-base">{enr.course_name}</h4>
                      <Badge variant={ps.variant}>{ps.label}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs bg-obsidian-700/40 p-3 rounded-xl mb-4">
                      <div>
                        <p className="text-obsidian-300">المبلغ المتفق عليه</p>
                        <p className="text-white font-num font-bold text-sm mt-0.5">{formatEGP(enr.agreed_cost)}</p>
                      </div>
                      <div>
                        <p className="text-obsidian-300">إجمالي المدفوع</p>
                        <p className="text-emerald-light font-num font-bold text-sm mt-0.5">{formatEGP(enr.total_paid)}</p>
                      </div>
                      <div>
                        <p className="text-obsidian-300">المتبقي المطلوب</p>
                        <p
                          className={`font-num font-bold text-sm mt-0.5 ${
                            enr.remaining_balance < 0
                              ? 'text-violet-400'
                              : enr.remaining_balance > 0
                              ? 'text-amber-400'
                              : 'text-emerald-light'
                          }`}
                        >
                          {formatEGP(enr.remaining_balance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-obsidian-300">تاريخ التسجيل</p>
                        <p className="text-obsidian-100 font-num font-semibold mt-0.5">{formatDate(enr.enrolled_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-obsidian-500/30 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-obsidian-300">الحالة:</span>
                      <select
                        value={enr.enrollment_status}
                        onChange={(e) => handleUpdateStatus(enr.enrollment_id, e.target.value)}
                        className="bg-obsidian-700 text-xs text-obsidian-100 rounded-lg px-2 py-1 border border-obsidian-500/30 outline-none"
                      >
                        <option value="Active">نشط</option>
                        <option value="Completed">مكتمل</option>
                        <option value="Dropped">منسحب</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {enr.remaining_balance > 0 && (
                        <button
                          onClick={() => handleRecordPayment(enr.enrollment_id)}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
                        >
                          <CreditCard size={14} />
                          دفع قسط
                        </button>
                      )}
                      {reminderUrl && (
                        <a
                          href={reminderUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-light border border-emerald-500/30"
                          title="تذكير المتدرب بالقسط المتبقي عبر واتساب"
                        >
                          <MessageCircle size={14} />
                          تذكير واتساب
                        </a>
                      )}
                      <button
                        onClick={() => navigate('course-details', { id: enr.course_id })}
                        className="btn-ghost p-1.5"
                        title="تفاصيل الكورس"
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
      </div>

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
    </div>
  );
}
