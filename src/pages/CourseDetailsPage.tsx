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
  Eye,
  CreditCard,
  CheckCircle2,
  Calendar,
  Clock,
  Award,
} from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/components/AppShell';
import { Badge, paymentStatusBadge, enrollmentStatusBadge, courseStatusBadge } from '@/components/ui/Badge';
import { PageLoader, EmptyState } from '@/components/ui/Feedback';
import { formatEGP, formatDate } from '@/lib/format';
import { QuickEnrollModal } from '@/components/forms/QuickEnrollModal';
import { CourseForm } from '@/components/forms/CourseForm';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Course, CourseFinancialSummary, EnrollmentBalance } from '@/types/database';

const LEVEL_LABELS: Record<string, string> = {
  Beginner: 'مبتدئ',
  Intermediate: 'متوسط',
  Advanced: 'متقدم',
};

export function CourseDetailsPage({ courseId }: { courseId: string }) {
  const { navigate } = useRouter();

  // Modals state
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [preselectedEnrollmentId, setPreselectedEnrollmentId] = useState<string | undefined>();
  const [closeTarget, setCloseTarget] = useState<boolean>(false);
  const [closing, setClosing] = useState(false);

  // 1. Fetch Course details
  const { data: course, loading: courseLoading, refetch: refetchCourse } = useQuery<Course>(async () => {
    if (!courseId) return { data: null, error: null };
    const { data, error } = await supabase.from('courses').select('*').eq('course_id', courseId).maybeSingle();
    return { data, error: error?.message ?? null };
  }, [courseId]);

  // 2. Fetch Course financial summary
  const { data: summary, loading: summaryLoading, refetch: refetchSummary } = useQuery<CourseFinancialSummary>(async () => {
    if (!courseId) return { data: null, error: null };
    const { data, error } = await supabase
      .from('course_financial_summary')
      .select('*')
      .eq('course_id', courseId)
      .maybeSingle();
    return { data, error: error?.message ?? null };
  }, [courseId]);

  // 3. Fetch Enrolled students
  const { data: enrollments, loading: enrollLoading, refetch: refetchEnrollments } = useQuery<EnrollmentBalance[]>(async () => {
    if (!courseId) return { data: [], error: null };
    const { data, error } = await supabase
      .from('enrollment_balances')
      .select('*')
      .eq('course_id', courseId)
      .order('enrolled_at', { ascending: false });
    return { data, error: error?.message ?? null };
  }, [courseId]);

  const refetchAll = () => {
    refetchCourse();
    refetchSummary();
    refetchEnrollments();
  };

  const handleCloseCourse = async () => {
    setClosing(true);
    const { error } = await supabase
      .from('courses')
      .update({ availability_status: 'Closed' })
      .eq('course_id', courseId);
    setClosing(false);
    if (!error) {
      setCloseTarget(false);
      refetchAll();
    }
  };

  const handleUpdateEnrollmentStatus = async (enrollmentId: string, newStatus: string) => {
    await supabase.from('enrollments').update({ status: newStatus }).eq('enrollment_id', enrollmentId);
    refetchAll();
  };

  const handleRecordPaymentForEnrollment = (enrId: string) => {
    setPreselectedEnrollmentId(enrId);
    setPaymentFormOpen(true);
  };

  if (courseLoading || summaryLoading) return <PageLoader />;

  if (!course || !summary) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('courses')} className="btn-ghost">
          <ArrowRight size={18} /> العودة للكورسات
        </button>
        <EmptyState message="الكورس غير موجود" />
      </div>
    );
  }

  const sb = courseStatusBadge(course.availability_status);
  const enrolled = summary.active_enrollments;
  const capacity = course.max_students;
  const fillPct = capacity ? Math.min((enrolled / capacity) * 100, 100) : 0;

  const links = [
    { url: course.link_whatsapp, icon: MessageCircle, label: 'جروب واتساب', color: 'hover:text-emerald-400 hover:border-emerald-500/40' },
    { url: course.link_tasks, icon: ListTodo, label: 'منصة المهام', color: 'hover:text-azure-brand hover:border-azure-brand/40' },
    { url: course.link_drive, icon: HardDrive, label: 'جوجل درايف', color: 'hover:text-amber-400 hover:border-amber-500/40' },
    { url: course.link_sources, icon: BookMarked, label: 'المصادر والمذكرات', color: 'hover:text-violet-400 hover:border-violet-500/40' },
  ].filter((l) => l.url);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button onClick={() => navigate('courses')} className="btn-ghost">
          <ArrowRight size={18} /> العودة لقائمة الكورسات
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setEnrollModalOpen(true)}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-emerald-brand/20"
          >
            <Plus size={18} />
            إضافة طالب لهذا الكورس
          </button>
          <button onClick={() => setCourseFormOpen(true)} className="btn-secondary flex items-center gap-2">
            <Pencil size={16} />
            تعديل الكورس
          </button>
          {course.availability_status !== 'Closed' && (
            <button
              onClick={() => setCloseTarget(true)}
              className="btn-ghost text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5"
            >
              <Lock size={16} />
              إغلاق الكورس
            </button>
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
              <Badge variant="blue">{course.level ? LEVEL_LABELS[course.level] : 'عام'}</Badge>
            </div>
            {course.description && (
              <p className="text-obsidian-200 text-sm mt-2 max-w-3xl leading-relaxed">{course.description}</p>
            )}
          </div>
          <div className="text-left bg-obsidian-700/60 rounded-xl p-3 border border-obsidian-500/40">
            <p className="text-xs text-obsidian-300">سعر الاشتراك الافتراضي</p>
            <p className="text-xl font-black text-emerald-light font-num mt-0.5">{formatEGP(course.default_cost)}</p>
          </div>
        </div>

        {/* Specifications & Capacity Gauge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-obsidian-500/30">
          <div className="flex items-center gap-3 p-3 bg-obsidian-700/40 rounded-xl">
            <Clock size={20} className="text-azure-brand shrink-0" />
            <div>
              <p className="text-xs text-obsidian-300">المدة الزمنية</p>
              <p className="text-sm font-semibold text-white font-num">{course.duration_weeks ?? 4} أسابيع</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-obsidian-700/40 rounded-xl">
            <Users size={20} className="text-emerald-light shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-obsidian-300">المقاعد المشغولة</span>
                <span className="font-num text-white">{enrolled}{capacity ? ` / ${capacity}` : ''}</span>
              </div>
              {capacity ? (
                <div className="h-2 bg-obsidian-600 rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full rounded-full transition-all ${
                      fillPct >= 100 ? 'bg-rose-500' : fillPct >= 75 ? 'bg-amber-500' : 'bg-emerald-brand'
                    }`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              ) : (
                <p className="text-xs text-emerald-light font-semibold mt-0.5">سعة غير محدودة</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-obsidian-700/40 rounded-xl">
            <CheckCircle2 size={20} className="text-amber-400 shrink-0" />
            <div>
              <p className="text-xs text-obsidian-300">المقاعد المتاحة</p>
              <p className="text-sm font-semibold text-white font-num">
                {summary.vacant_places !== null ? `${summary.vacant_places} مقعد متاح` : 'مفتوح للتسجيل'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-obsidian-700/40 rounded-xl">
            <Award size={20} className="text-violet-400 shrink-0" />
            <div>
              <p className="text-xs text-obsidian-300">إجمالي المسجلين تاريخياً</p>
              <p className="text-sm font-semibold text-white font-num">{summary.total_enrollments} طالب</p>
            </div>
          </div>
        </div>

        {/* Prerequisites */}
        {course.prerequisite_courses && (
          <div className="p-3 bg-obsidian-700/30 rounded-xl border border-obsidian-500/20 text-xs">
            <span className="text-obsidian-300 font-semibold ml-2">المتطلبات السابقة للمتدرب:</span>
            <span className="text-obsidian-100">{course.prerequisite_courses}</span>
          </div>
        )}

        {/* 4 External Resource Links */}
        {links.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-semibold text-obsidian-300 mb-2">روابط المواد والمنصات التدريبية:</p>
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

      {/* Financial Pulse Overview (Zero JS recalculation — from PostgreSQL view) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-surface p-4 bg-gradient-to-b from-azure-brand/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-azure-brand" />
            <span className="text-obsidian-300 text-xs">الإيراد المتوقع</span>
          </div>
          <p className="font-num font-bold text-lg text-azure-brand">{formatEGP(summary.expected_revenue)}</p>
        </div>
        <div className="card-surface p-4 bg-gradient-to-b from-emerald-brand/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-emerald-light" />
            <span className="text-obsidian-300 text-xs">الإيراد المحصل</span>
          </div>
          <p className="font-num font-bold text-lg text-emerald-light">{formatEGP(summary.collected_payments)}</p>
        </div>
        <div className="card-surface p-4 bg-gradient-to-b from-rose-500/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={16} className="text-rose-400" />
            <span className="text-obsidian-300 text-xs">مصروفات الكورس</span>
          </div>
          <p className="font-num font-bold text-lg text-rose-400">{formatEGP(summary.total_expenses)}</p>
        </div>
        <div className="card-surface p-4 bg-gradient-to-b from-violet-500/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-violet-400" />
            <span className="text-obsidian-300 text-xs">صافي الأرباح</span>
          </div>
          <p className={`font-num font-bold text-lg ${summary.net_profit >= 0 ? 'text-emerald-light' : 'text-rose-400'}`}>
            {formatEGP(summary.net_profit)}
          </p>
        </div>
      </div>

      {/* Enrolled Students Table with Action Buttons */}
      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-obsidian-500/40">
          <div>
            <h3 className="text-white font-bold text-base">الطلبة المسجلون بهذا الكورس</h3>
            <p className="text-xs text-obsidian-300 mt-0.5">متابعة نسب السداد والتحصيل لكل طالب</p>
          </div>
          <button onClick={() => setEnrollModalOpen(true)} className="btn-primary text-xs py-1.5 px-3">
            <Plus size={15} /> تسجيل طالب بالكورس
          </button>
        </div>

        {enrollLoading ? (
          <PageLoader />
        ) : !enrollments || enrollments.length === 0 ? (
          <EmptyState
            message="لا يوجد طلاب مسجلون في هذا الكورس بعد"
            action={
              <button onClick={() => setEnrollModalOpen(true)} className="btn-primary">
                <Plus size={16} /> إضافة أول طالب
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-obsidian-300 text-xs border-b border-obsidian-500/30">
                  <th className="text-right font-medium px-4 py-3">الطالب</th>
                  <th className="text-right font-medium px-4 py-3 hidden sm:table-cell">تاريخ التسجيل</th>
                  <th className="text-right font-medium px-4 py-3">المتفق عليه</th>
                  <th className="text-right font-medium px-4 py-3">المدفوع</th>
                  <th className="text-right font-medium px-4 py-3">المتبقي</th>
                  <th className="text-right font-medium px-4 py-3">حالة السداد</th>
                  <th className="text-right font-medium px-4 py-3">حالة الاشتراك</th>
                  <th className="text-right font-medium px-4 py-3">إجراءات سريعة</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enr) => {
                  const ps = paymentStatusBadge(enr.payment_status);
                  const es = enrollmentStatusBadge(enr.enrollment_status);
                  return (
                    <tr
                      key={enr.enrollment_id}
                      className="border-b border-obsidian-500/20 hover:bg-obsidian-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-white font-medium">
                        <button
                          onClick={() => navigate('student-details', { id: enr.student_id })}
                          className="hover:text-emerald-light transition-colors text-right font-semibold"
                        >
                          {enr.student_name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-obsidian-300 font-num hidden sm:table-cell">
                        {formatDate(enr.enrolled_at)}
                      </td>
                      <td className="px-4 py-3 font-num text-obsidian-100">{formatEGP(enr.agreed_cost)}</td>
                      <td className="px-4 py-3 font-num text-emerald-light font-bold">
                        {formatEGP(enr.total_paid)}
                      </td>
                      <td
                        className={`px-4 py-3 font-num font-semibold ${
                          enr.remaining_balance < 0
                            ? 'text-violet-400'
                            : enr.remaining_balance > 0
                            ? 'text-amber-400'
                            : 'text-emerald-light'
                        }`}
                      >
                        {formatEGP(enr.remaining_balance)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ps.variant}>{ps.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={enr.enrollment_status}
                          onChange={(e) => handleUpdateEnrollmentStatus(enr.enrollment_id, e.target.value)}
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
                              onClick={() => handleRecordPaymentForEnrollment(enr.enrollment_id)}
                              className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
                              title="تسجيل دفعة لهذا الطالب"
                            >
                              <CreditCard size={14} />
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
        title="إغلاق الكورس"
        message="هل أنت متأكد من رغبتك في إغلاق هذا الكورس؟ لن يتمكن أحد من تسجيل طلاب جدد فيه."
        confirmLabel="إغلاق الكورس"
        loading={closing}
        danger
      />
    </div>
  );
}
