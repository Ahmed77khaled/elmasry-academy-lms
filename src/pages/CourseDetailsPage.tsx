import { translate } from '@/lib/translations';
import { translateTemplate } from '@/lib/translations';
import { useState } from 'react';
import {
  ArrowRight,
  TrendingUp,
  Receipt,
  Wallet,
  Users,
  Plus,
  Pencil,
  Lock,
  MessageCircle,
  ListTodo,
  HardDrive,
  BookMarked,
  CreditCard,
  CheckCircle2,
  Clock,
  Award,
  FileSpreadsheet,
} from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/components/AppShell';
import { Badge, paymentStatusBadge, courseStatusBadge } from '@/components/ui/Badge';
import { PageLoader, EmptyState } from '@/components/ui/Feedback';
import { formatEGP, formatDate } from '@/lib/format';
import { exportToCSV } from '@/lib/exportExcel';
import { generatePaymentReminderUrl } from '@/lib/whatsapp';
import { QuickEnrollModal } from '@/components/forms/QuickEnrollModal';
import { CourseForm } from '@/components/forms/CourseForm';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Course, CourseFinancialSummary, EnrollmentBalance, Student } from '@/types/database';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';

const LEVEL_LABELS: Record<string, string> = {
  Beginner: 'مبتدئ',
  Intermediate: 'متوسط',
  Advanced: 'متقدم',
};

export function CourseDetailsPage({ courseId }: { courseId: string }) {
  const { navigate } = useRouter();
  const { permissions } = useAuth();
  const canReadEnrollments = permissions.includes('enrollments.read');
  const canReadStudentPhones = permissions.includes('students.read_contact_phone');
  const canReadEnrollmentFinance = permissions.includes('enrollments.financial.read');
  const canReadFinancialReports = permissions.includes('finance.reports.read');
  const canCreateEnrollment = permissions.includes('enrollments.create');
  const canUpdateEnrollmentStatus = permissions.includes('enrollments.update_status');
  const canRecordPayments = permissions.includes('finance.payments.record');
  const canExportEnrollments = permissions.includes('enrollments.export') && canReadEnrollmentFinance;
  const canUpdateCourse = permissions.includes('courses.update');
  const canCloseCourse = permissions.includes('courses.close');
  const canReadCoursePricing = permissions.includes('courses.pricing.read');

  // Modals state
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [preselectedEnrollmentId, setPreselectedEnrollmentId] = useState<string | undefined>();
  const [closeTarget, setCloseTarget] = useState<boolean>(false);
  const [closing, setClosing] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Phone lookup map for enrolled students (for WhatsApp reminders & exports)
  const { data: studentsPhoneMap } = useQuery<Record<string, string>>(async () => {
    if (!canReadStudentPhones) return { data: {}, error: null };
    const { data, error } = await supabase.rpc('rbac_list_students', {
      p_search: null, p_limit: 500, p_offset: 0,
    });
    if (error || !data) return { data: {}, error: error?.message ?? null };
    const map: Record<string, string> = {};
    (data as Student[]).forEach((s) => {
      if (s.student_id && s.phone) {
        map[s.student_id] = s.phone;
      }
    });
    return { data: map, error: null };
  }, [canReadStudentPhones]);

  // 1. Fetch Course details
  const { data: course, loading: courseLoading, refetch: refetchCourse } = useQuery<Course>(async () => {
    if (!courseId) return { data: null, error: null };
    const { data, error } = await supabase.rpc('rbac_list_courses', { p_limit: 1, p_offset: 0, p_course_id: courseId });
    return { data: data?.[0] as Course | undefined ?? null, error: error?.message ?? null };
  }, [courseId]);

  // 2. Fetch Course financial summary
  const { data: summary, loading: summaryLoading, refetch: refetchSummary } = useQuery<CourseFinancialSummary>(async () => {
    if (!courseId || !canReadFinancialReports) return { data: null, error: null };
    const { data, error } = await supabase.rpc('rbac_course_financial_summary', { p_course_id: courseId });
    return { data: data?.[0] as CourseFinancialSummary | undefined ?? null, error: error?.message ?? null };
  }, [courseId, canReadFinancialReports]);

  // 3. Fetch Enrolled students
  const { data: enrollments, loading: enrollLoading, refetch: refetchEnrollments } = useQuery<EnrollmentBalance[]>(async () => {
    if (!courseId || !canReadEnrollments) return { data: [], error: null };
    const { data, error } = await supabase.rpc('rbac_list_enrollments', {
      p_search: null, p_limit: 500, p_offset: 0, p_course_id: courseId,
    });
    return { data: data as EnrollmentBalance[] | null, error: error?.message ?? null };
  }, [courseId, canReadEnrollments]);

  const refetchAll = () => {
    refetchCourse();
    refetchSummary();
    refetchEnrollments();
  };

  const handleCloseCourse = async () => {
    if (!canCloseCourse) return;
    setClosing(true);
    const { error } = await supabase.rpc('rbac_close_course', { p_course_id: courseId });
    setClosing(false);
    if (!error) {
      setCloseTarget(false);
      refetchAll();
    }
  };

  const handleUpdateEnrollmentStatus = async (enrollmentId: string, newStatus: string) => {
    if (!canUpdateEnrollmentStatus) return;
    setStatusError(null);
    const { error } = await supabase.rpc('rbac_set_enrollment_status', {
      p_enrollment_id: enrollmentId,
      p_status: newStatus,
    });
    if (error) setStatusError(error.message);
    else refetchAll();
  };

  const handleRecordPaymentForEnrollment = (enrId: string) => {
    if (!canRecordPayments) return;
    setPreselectedEnrollmentId(enrId);
    setPaymentFormOpen(true);
  };

  // Export Course Students to Excel
  const handleExportEnrollmentsExcel = () => {
    if (!canExportEnrollments || !enrollments || enrollments.length === 0) return;

    const headers = [
      translate("اسم المتدرب"),
      translate("رقم الهاتف"),
      translate("تاريخ التسجيل"),
      translate("المتفق عليه (ج.م)"),
      translate("المدفوع (ج.م)"),
      translate("المتبقي (ج.م)"),
      translate("حالة السداد"),
      translate("حالة الاشتراك"),
    ];

    const rows = enrollments.map((enr) => {
      const ps = paymentStatusBadge(enr.payment_status ?? 'Unpaid');
      return [
        enr.student_name,
        studentsPhoneMap?.[enr.student_id] ?? '',
        enr.enrolled_at?.slice(0, 10) ?? '',
        enr.agreed_cost,
        enr.total_paid,
        enr.remaining_balance,
        ps.label,
        enr.enrollment_status === 'Active' ? translate("نشط") : enr.enrollment_status === 'Completed' ? translate("مكتمل") : translate("منسحب"),
      ];
    });

    const dateSuffix = new Date().toISOString().slice(0, 10);
    const sanitizedCourseName = (course?.course_name ?? translate("الكورس")).replace(/[/\\?%*:|"<>]/g, '_');
    exportToCSV({
      filename: translateTemplate('طلاب_{course}_{date}', { course: sanitizedCourseName, date: dateSuffix }),
      headers,
      rows,
    });
  };

  if (courseLoading || (canReadFinancialReports && summaryLoading) || (canReadEnrollments && enrollLoading)) return <PageLoader />;

  if (!course) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('courses')} className="btn-ghost">
          <ArrowRight size={18} /> {translate("العودة للكورسات")}</button>
        <EmptyState message={translate("الكورس غير موجود")} />
      </div>
    );
  }

  const sb = courseStatusBadge(course.availability_status);
  const activeEnrollments = enrollments?.filter((enrollment) => enrollment.enrollment_status === 'Active').length;
  const enrolled = activeEnrollments ?? 0;
  const capacity = course.max_students;
  const fillPct = capacity ? Math.min((enrolled / capacity) * 100, 100) : 0;

  const links = [
    { url: course.link_whatsapp, icon: MessageCircle, label: translate("جروب واتساب"), color: 'hover:text-emerald-400 hover:border-emerald-500/40' },
    { url: course.link_tasks, icon: ListTodo, label: translate("منصة المهام"), color: 'hover:text-azure-brand hover:border-azure-brand/40' },
    { url: course.link_drive, icon: HardDrive, label: translate("جوجل درايف"), color: 'hover:text-amber-400 hover:border-amber-500/40' },
    { url: course.link_sources, icon: BookMarked, label: translate("المصادر والمذكرات"), color: 'hover:text-violet-400 hover:border-violet-500/40' },
  ].filter((l) => l.url);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button onClick={() => navigate('courses')} className="btn-ghost">
          <ArrowRight size={18} /> {translate("العودة لقائمة الكورسات")}</button>
        <div className="flex items-center gap-2 flex-wrap">
          {canCreateEnrollment && <button
            onClick={() => setEnrollModalOpen(true)}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-emerald-brand/20"
          >
            <Plus size={18} />
            {translate("إضافة طالب لهذا الكورس")}</button>}
          {canUpdateCourse && <button onClick={() => setCourseFormOpen(true)} className="btn-secondary flex items-center gap-2">
            <Pencil size={16} />
            {translate("تعديل الكورس")}</button>}
          {canCloseCourse && course.availability_status !== 'Closed' && (
            <button
              onClick={() => setCloseTarget(true)}
              className="btn-ghost text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5"
            >
              <Lock size={16} />
              {translate("إغلاق الكورس")}</button>
          )}
        </div>
      </div>

      {/* Main Course Hero Card */}
      <div className="card-surface p-5 lg:p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-white font-arabic">{course.course_name}</h1>
              <Badge variant={sb.variant}>{sb.label}</Badge>
              <Badge variant="blue">{course.level ? translate(LEVEL_LABELS[course.level] ?? course.level) : translate("عام")}</Badge>
            </div>
            {course.description && (
              <p className="text-obsidian-200 text-sm mt-2 max-w-3xl leading-relaxed">{course.description}</p>
            )}
          </div>
          {canReadCoursePricing && <div className="text-left bg-obsidian-700/60 rounded-xl p-3 border border-obsidian-500/40">
            <p className="text-xs text-obsidian-300">{translate("سعر الاشتراك الافتراضي")}</p>
            {course.default_cost != null && <p className="text-xl font-black text-emerald-light font-num mt-0.5">{formatEGP(course.default_cost)}</p>}
          </div>}
        </div>

        {/* Specifications & Capacity Gauge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-obsidian-500/30">
          <div className="flex items-center gap-3 p-3 bg-obsidian-700/40 rounded-xl">
            <Clock size={20} className="text-azure-brand shrink-0" />
            <div>
              <p className="text-xs text-obsidian-300">{translate("المدة الزمنية")}</p>
              <p className="text-sm font-semibold text-white font-num">{course.duration_weeks ?? 4} {translate("أسابيع")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-obsidian-700/40 rounded-xl">
            <Users size={20} className="text-emerald-light shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-obsidian-300">{translate("المقاعد المشغولة")}</span>
                <span className="font-num text-white">{canReadEnrollments ? enrolled : '—'}{capacity ? ` / ${capacity}` : ''}</span>
              </div>
              {capacity && canReadEnrollments ? (
                <div className="h-2 bg-obsidian-600 rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full rounded-full transition-all ${
                      fillPct >= 100 ? 'bg-rose-500' : fillPct >= 75 ? 'bg-amber-500' : 'bg-emerald-brand'
                    }`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              ) : (
                <p className="text-xs text-emerald-light font-semibold mt-0.5">{translate("سعة غير محدودة")}</p>
              )}
            </div>
          </div>
          {canReadEnrollments && <div className="flex items-center gap-3 p-3 bg-obsidian-700/40 rounded-xl">
            <CheckCircle2 size={20} className="text-amber-400 shrink-0" />
            <div>
              <p className="text-xs text-obsidian-300">{translate("المقاعد المتاحة")}</p>
              <p className="text-sm font-semibold text-white font-num">
                {(summary?.vacant_places ?? (capacity != null ? Math.max(capacity - enrolled, 0) : null)) !== null ? `${summary?.vacant_places ?? Math.max(capacity! - enrolled, 0)} seats available` : "Open enrollment"}
              </p>
            </div>
          </div>}
          {canReadEnrollments && <div className="flex items-center gap-3 p-3 bg-obsidian-700/40 rounded-xl">
            <Award size={20} className="text-violet-400 shrink-0" />
            <div>
              <p className="text-xs text-obsidian-300">{translate("إجمالي المسجلين تاريخياً")}</p>
              <p className="text-sm font-semibold text-white font-num">{enrollments?.length ?? 0}</p>
            </div>
          </div>}
        </div>

        {/* Prerequisites */}
        {course.prerequisite_courses && (
          <div className="p-3 bg-obsidian-700/30 rounded-xl border border-obsidian-500/20 text-xs">
            <span className="text-obsidian-300 font-semibold ml-2">{translate("المتطلبات السابقة للمتدرب:")}</span>
            <span className="text-obsidian-100">{course.prerequisite_courses}</span>
          </div>
        )}

        {/* 4 External Resource Links */}
        {links.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-semibold text-obsidian-300 mb-2">{translate("روابط المواد والمنصات التدريبية:")}</p>
            <div className="flex flex-wrap gap-2.5">
              {links.map((l, i) => {
                const Icon = l.icon;
                return (
                  <a
                    key={i}
                    href={l.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-obsidian-700/80 border border-obsidian-500/40 text-obsidian-200 transition-all ${l.color}`}
                  >
                    <Icon size={16} />
                    <span>{l.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {statusError && <Alert variant="error">{statusError}</Alert>}

      {/* Financial Pulse Overview (Zero JS recalculation — from PostgreSQL view) */}
      {summary && canReadFinancialReports && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-surface p-4 bg-gradient-to-b from-azure-brand/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-azure-brand" />
            <span className="text-obsidian-300 text-xs">{translate("الإيراد المتوقع")}</span>
          </div>
          <p className="font-num font-bold text-lg text-azure-brand">{formatEGP(summary.expected_revenue)}</p>
        </div>
        <div className="card-surface p-4 bg-gradient-to-b from-emerald-brand/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-emerald-light" />
            <span className="text-obsidian-300 text-xs">{translate("الإيراد المحصل")}</span>
          </div>
          <p className="font-num font-bold text-lg text-emerald-light">{formatEGP(summary.collected_payments)}</p>
        </div>
        <div className="card-surface p-4 bg-gradient-to-b from-rose-500/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={16} className="text-rose-400" />
            <span className="text-obsidian-300 text-xs">{translate("مصروفات الكورس")}</span>
          </div>
          <p className="font-num font-bold text-lg text-rose-400">{formatEGP(summary.total_expenses)}</p>
        </div>
        <div className="card-surface p-4 bg-gradient-to-b from-violet-500/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-violet-400" />
            <span className="text-obsidian-300 text-xs">{translate("صافي الأرباح")}</span>
          </div>
          <p className={`font-num font-bold text-lg ${summary.net_profit >= 0 ? 'text-emerald-light' : 'text-rose-400'}`}>
            {formatEGP(summary.net_profit)}
          </p>
        </div>
      </div>}

      {canReadEnrollments && (
        <section className="card-surface overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-obsidian-500/40 flex-wrap gap-3">
            <h3 className="text-white font-bold text-base">{translate("تسجيلات الدورة")}</h3>
            <div className="flex items-center gap-2">
              {canExportEnrollments && <button onClick={handleExportEnrollmentsExcel} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"><FileSpreadsheet size={15} /> {translate("تصدير")}</button>}
              {canCreateEnrollment && <button onClick={() => setEnrollModalOpen(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1" disabled={course.availability_status === 'Closed'}><Plus size={15} /> {translate("تسجيل طالب")}</button>}
            </div>
          </div>
          {enrollLoading ? <PageLoader /> : !enrollments || enrollments.length === 0 ? (
            <EmptyState message={translate("لا يوجد طلاب مسجلون في هذه الدورة بعد.")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-obsidian-300 text-xs border-b border-obsidian-500/30">
                  <th className="text-right font-medium px-4 py-3">{translate("الطالب")}</th>
                  <th className="text-right font-medium px-4 py-3">{translate("تاريخ التسجيل")}</th>
                  {canReadEnrollmentFinance && <><th className="text-right font-medium px-4 py-3">{translate("المتفق عليه (ج.م)")}</th><th className="text-right font-medium px-4 py-3">{translate("المدفوع (ج.م)")}</th><th className="text-right font-medium px-4 py-3">{translate("المتبقي (ج.م)")}</th><th className="text-right font-medium px-4 py-3">{translate("حالة السداد")}</th></>}
                  <th className="text-right font-medium px-4 py-3">{translate("حالة التسجيل")}</th>
                  {(canRecordPayments || canReadEnrollmentFinance) && <th className="text-right font-medium px-4 py-3">{translate("إجراءات")}</th>}
                </tr></thead>
                <tbody>{enrollments.map((enr) => {
                  const ps = canReadEnrollmentFinance ? paymentStatusBadge(enr.payment_status ?? 'Unpaid') : null;
                  const studentPhone = studentsPhoneMap?.[enr.student_id];
                  const reminderUrl = canReadEnrollmentFinance && enr.remaining_balance != null && enr.remaining_balance > 0 && studentPhone
                    ? generatePaymentReminderUrl({ phone: studentPhone, studentName: enr.student_name, courseName: course.course_name, remainingAmount: enr.remaining_balance })
                    : null;
                  return <tr key={enr.enrollment_id} className="border-b border-obsidian-500/20">
                    <td className="px-4 py-3 text-white"><button onClick={() => navigate('student-details', { id: enr.student_id })} className="text-right">{enr.student_name}</button></td>
                    <td className="px-4 py-3 text-obsidian-300">{formatDate(enr.enrolled_at)}</td>
                    {canReadEnrollmentFinance && <>
                      <td className="px-4 py-3">{enr.agreed_cost == null ? '—' : formatEGP(enr.agreed_cost)}</td>
                      <td className="px-4 py-3">{formatEGP(enr.total_paid ?? 0)}</td>
                      <td className="px-4 py-3">{formatEGP(enr.remaining_balance ?? 0)}</td>
                      <td className="px-4 py-3">{ps && <Badge variant={ps.variant}>{ps.label}</Badge>}</td>
                    </>}
                    <td className="px-4 py-3">{canUpdateEnrollmentStatus ? <select value={enr.enrollment_status} onChange={(e) => void handleUpdateEnrollmentStatus(enr.enrollment_id, e.target.value)} className="bg-obsidian-700 text-xs rounded-lg px-2 py-1"><option value="Active">{translate("نشط")}</option><option value="Completed">{translate("مكتمل")}</option><option value="Dropped">{translate("منسحب")}</option></select> : translate(enr.enrollment_status === 'Active' ? "نشط" : enr.enrollment_status === 'Completed' ? "مكتمل" : "منسحب")}</td>
                    {(canRecordPayments || canReadEnrollmentFinance) && <td className="px-4 py-3"><div className="flex items-center gap-1.5">
                      {canRecordPayments && enr.remaining_balance != null && enr.remaining_balance > 0 && <button onClick={() => handleRecordPaymentForEnrollment(enr.enrollment_id)} className="btn-primary text-xs py-1 px-2.5"><CreditCard size={14} /> {translate("تسجيل دفعة")}</button>}
                      {reminderUrl && <a href={reminderUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1 px-2"><MessageCircle size={13} /> {translate("إرسال تذكير واتساب")}</a>}
                    </div></td>}
                  </tr>;
                })}</tbody>
              </table>
            </div>
          )}
        </section>
      )}
      {/* Modals */}
      <QuickEnrollModal
        open={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        onSaved={refetchAll}
        preselectedCourseId={courseId}
      />

      <CourseForm
        open={courseFormOpen}
        onClose={() => setCourseFormOpen(false)}
        onSaved={refetchAll}
        course={course}
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

      <ConfirmDialog
        open={closeTarget}
        onClose={() => setCloseTarget(false)}
        onConfirm={handleCloseCourse}
        title={translate("إغلاق الكورس")}
        message={translate("هل أنت متأكد من رغبتك في إغلاق هذا الكورس؟ لن يتمكن أحد من تسجيل طلاب جدد فيه.")}
        confirmLabel={translate("إغلاق الكورس")}
        loading={closing}
        danger
      />
    </div>
  );
}
