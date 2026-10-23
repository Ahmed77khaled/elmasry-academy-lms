import { translate } from '@/lib/translations';
import { translateTemplate } from '@/lib/translations';
import { useState } from 'react';
import { Search, Plus, Pencil, Eye, MessageCircle, ListTodo, HardDrive, BookMarked, MoreVertical, Lock } from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/useRouter';
import { Badge } from '@/components/ui/Badge';
import { courseStatusBadge } from '@/components/ui/badgeStatus';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { CourseForm } from '@/components/forms/CourseForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatEGP, formatDate } from '@/lib/format';
import type { Course, EnrollmentBalance } from '@/types/database';
import { useAuth } from '@/context/useAuth';

const LEVEL_LABELS: Record<string, string> = {
  'Beginner': 'مبتدئ', 'Intermediate': 'متوسط', 'Advanced': 'متقدم',
};

export function CoursesPage() {
  const { navigate } = useRouter();
  const { permissions } = useAuth();
  const canCreateCourse = permissions.includes('courses.create');
  const canUpdateCourse = permissions.includes('courses.update');
  const canCloseCourse = permissions.includes('courses.close');
  const canReadCoursePricing = permissions.includes('courses.pricing.read');
  const canReadEnrollments = permissions.includes('enrollments.read');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [closeTarget, setCloseTarget] = useState<Course | null>(null);
  const [closing, setClosing] = useState(false);

  const { data: courses, loading, refetch } = useQuery<Course[]>(async () => {
    const { data, error } = await supabase.rpc('rbac_list_courses', { p_limit: 500, p_offset: 0 });
    if (error) return { data: null, error: error.message };
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const filtered = ((data ?? []) as Course[]).filter((course) =>
      (!normalizedSearch || course.course_name.toLocaleLowerCase().includes(normalizedSearch))
      && (!statusFilter || course.availability_status === statusFilter));
    return { data: filtered as Course[], error: null };
  }, [search, statusFilter]);

  const { data: enrollmentCounts } = useQuery<{ course_id: string; count: number }[]>(async () => {
    if (!canReadEnrollments) return { data: [], error: null };
    const { data, error } = await supabase.rpc('rbac_list_enrollments', {
      p_search: null, p_limit: 500, p_offset: 0,
    });
    if (error) return { data: null, error: error.message };
    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as EnrollmentBalance[]) {
      if (row.enrollment_status === 'Active') counts[row.course_id] = (counts[row.course_id] ?? 0) + 1;
    }
    return { data: Object.entries(counts).map(([course_id, count]) => ({ course_id, count })), error: null };
  }, [canReadEnrollments]);

  const handleEdit = (course: Course) => {
    setEditing(course);
    setMenuOpen(null);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleCloseCourse = async () => {
    if (!closeTarget) return;
    setClosing(true);
    const { error } = await supabase.rpc('rbac_close_course', { p_course_id: closeTarget.course_id });
    setClosing(false);
    if (!error) {
      setCloseTarget(null);
      refetch();
    }
  };

  const getEnrollmentCount = (courseId: string): number => {
    const found = enrollmentCounts?.find((c) => c.course_id === courseId);
    return found?.count ?? 0;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-bold text-xl">{translate("إدارة الكورسات")}</h2>
          <p className="text-obsidian-300 text-sm mt-1">{translate("كل الدورات التدريبية المتاحة بالأكاديمية")}</p>
        </div>
        {canCreateCourse && <button onClick={handleAdd} className="btn-primary">
          <Plus size={18} />
          {translate("إنشاء كورس جديد")}</button>}
      </div>

      {/* Filters */}
      <div className="card-surface p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-obsidian-700 rounded-lg px-3 py-2 border border-obsidian-500/40 flex-1 min-w-[200px]">
          <Search size={16} className="text-obsidian-300 shrink-0" />
          <input
            type="text"
            placeholder={translate("بحث باسم الكورس...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-obsidian-100 placeholder:text-obsidian-300 outline-none w-full"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base w-auto">
          <option value="">{translate("كل الحالات")}</option>
          <option value="Active">{translate("نشط")}</option>
          <option value="Upcoming">{translate("قادم")}</option>
          <option value="Closed">{translate("مغلق")}</option>
        </select>
      </div>

      {/* Course cards */}
      {loading ? (
        <PageLoader />
      ) : !courses || courses.length === 0 ? (
        <div className="card-surface">
          <EmptyState
            message={translate("لا توجد كورسات منشأة — اضغط على زر إنشاء كورس جديد للبدء")}
            action={canCreateCourse ? <button onClick={handleAdd} className="btn-primary"><Plus size={16} /> {translate("إنشاء كورس")}</button> : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => {
            const sb = courseStatusBadge(course.availability_status);
            const enrolled = getEnrollmentCount(course.course_id);
            const capacity = course.max_students;
            const fillPct = capacity ? Math.min((enrolled / capacity) * 100, 100) : 0;
            const links = [
              { url: course.link_whatsapp, icon: MessageCircle, label: translate("واتساب") },
              { url: course.link_tasks, icon: ListTodo, label: translate("المهام") },
              { url: course.link_drive, icon: HardDrive, label: translate("درايف") },
              { url: course.link_sources, icon: BookMarked, label: translate("المصادر") },
            ].filter((l) => l.url);

            return (
              <div key={course.course_id} className="card-surface p-4 hover:border-obsidian-400/50 transition-all flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-base truncate">{course.course_name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant={sb.variant}>{sb.label}</Badge>
                      <Badge variant="gray">{course.level ? translate(LEVEL_LABELS[course.level] ?? course.level) : '—'}</Badge>
                      <span className="text-obsidian-300 text-xs">{course.duration_weeks ?? 0} {translate("أسبوع")}</span>
                    </div>
                    {(course.start_date || course.end_date) && (
                      <p className="text-obsidian-300 text-xs mt-2">
                        {course.start_date && `${translate('\u0627\u0644\u0628\u062f\u0627\u064a\u0629')}: ${formatDate(course.start_date)}`}
                        {course.start_date && course.end_date && ' \u00b7 '}
                        {course.end_date && `${translate('\u0627\u0644\u0646\u0647\u0627\u064a\u0629')}: ${formatDate(course.end_date)}`}
                      </p>
                    )}
                  </div>
                  <div className="relative shrink-0">
                    {(canUpdateCourse || canCloseCourse) && <button onClick={() => setMenuOpen(menuOpen === course.course_id ? null : course.course_id)} className="btn-ghost p-1.5">
                      <MoreVertical size={18} />
                    </button>}
                    {menuOpen === course.course_id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                        <div className="absolute top-full left-0 z-20 bg-obsidian-600 border border-obsidian-500/50 rounded-lg shadow-xl py-1 w-44">
                          <button onClick={() => navigate('course-details', { id: course.course_id })} className="w-full text-right px-3 py-2 text-sm text-obsidian-100 hover:bg-obsidian-500/40 flex items-center gap-2">
                            <Eye size={15} /> {translate("التفاصيل والمالية")}</button>
                          {canUpdateCourse && <button onClick={() => handleEdit(course)} className="w-full text-right px-3 py-2 text-sm text-obsidian-100 hover:bg-obsidian-500/40 flex items-center gap-2">
                            <Pencil size={15} /> {translate("تعديل")}</button>}
                          {canCloseCourse && course.availability_status !== 'Closed' && (
                            <button onClick={() => { setCloseTarget(course); setMenuOpen(null); }} className="w-full text-right px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2">
                              <Lock size={15} /> {translate("إغلاق الكورس")}</button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {canReadEnrollments && (
                  <>
                    {/* Seat gauge */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-obsidian-300">{translate("المقاعد")}</span>
                        <span className="text-obsidian-100 font-num">
                          {enrolled}{capacity ? ` / ${capacity}` : translate(" (غير محدود)")}
                        </span>
                      </div>
                      {capacity && (
                        <div className="h-2 bg-obsidian-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${fillPct >= 100 ? 'bg-rose-500' : fillPct >= 75 ? 'bg-amber-500' : 'bg-emerald-brand'}`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="text-sm mb-3">
                  <span className="text-obsidian-300">{translate("التكلفة:")}{' '}</span>
                  {canReadCoursePricing && course.default_cost != null && <span className="text-emerald-light font-num font-bold">{formatEGP(course.default_cost)}</span>}
                </div>

                {/* Links */}
                {links.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-obsidian-500/20">
                    {links.map((link, i) => {
                      const Icon = link.icon;
                      return (
                        <a
                          key={i}
                          href={link.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-azure-brand hover:text-azure-light bg-azure-brand/10 hover:bg-azure-brand/20 px-2.5 py-1.5 rounded-lg border border-azure-brand/20 transition-all"
                        >
                          <Icon size={14} /> {link.label}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CourseForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={refetch} course={editing} />
      <ConfirmDialog
        open={!!closeTarget}
        onClose={() => setCloseTarget(null)}
        onConfirm={handleCloseCourse}
        title={translate("إغلاق الكورس")}
        message={translateTemplate('هل أنت متأكد من إغلاق كورس "{course}"؟ سيتم منع التسجيل الجديد ولكن لن يتم حذف أي بيانات مالية.', { course: closeTarget?.course_name ?? '' })}
        confirmLabel={translate("إغلاق الكورس")}
        loading={closing}
        danger={false}
      />
    </div>
  );
}
