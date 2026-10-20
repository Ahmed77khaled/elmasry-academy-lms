import { useState } from 'react';
import { Search, Plus, Pencil, Eye, MessageCircle, ListTodo, HardDrive, BookMarked, MoreVertical, Lock } from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/components/AppShell';
import { Badge, courseStatusBadge } from '@/components/ui/Badge';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { CourseForm } from '@/components/forms/CourseForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatEGP } from '@/lib/format';
import type { Course } from '@/types/database';

const LEVEL_LABELS: Record<string, string> = {
  'Beginner': 'مبتدئ', 'Intermediate': 'متوسط', 'Advanced': 'متقدم',
};

export function CoursesPage() {
  const { navigate } = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [closeTarget, setCloseTarget] = useState<Course | null>(null);
  const [closing, setClosing] = useState(false);

  const { data: courses, loading, refetch } = useQuery<Course[]>(async () => {
    let query = supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (search.trim()) {
      query = query.ilike('course_name', `%${search}%`);
    }
    if (statusFilter) query = query.eq('availability_status', statusFilter);
    const { data, error } = await query;
    return { data, error: error?.message ?? null };
  });

  const { data: enrollmentCounts } = useQuery<{ course_id: string; count: number }[]>(async () => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('status', 'Active');
    if (error) return { data: null, error: error.message };
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.course_id] = (counts[row.course_id] ?? 0) + 1;
    }
    return { data: Object.entries(counts).map(([course_id, count]) => ({ course_id, count })), error: null };
  });

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
    const { error } = await supabase.from('courses').update({ availability_status: 'Closed' }).eq('course_id', closeTarget.course_id);
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
          <h2 className="text-white font-bold text-xl">إدارة الكورسات</h2>
          <p className="text-obsidian-300 text-sm mt-1">كل الدورات التدريبية المتاحة بالأكاديمية</p>
        </div>
        <button onClick={handleAdd} className="btn-primary">
          <Plus size={18} />
          إنشاء كورس جديد
        </button>
      </div>

      {/* Filters */}
      <div className="card-surface p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-obsidian-700 rounded-lg px-3 py-2 border border-obsidian-500/40 flex-1 min-w-[200px]">
          <Search size={16} className="text-obsidian-300 shrink-0" />
          <input
            type="text"
            placeholder="بحث باسم الكورس..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-obsidian-100 placeholder:text-obsidian-300 outline-none w-full"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base w-auto">
          <option value="">كل الحالات</option>
          <option value="Active">نشط</option>
          <option value="Upcoming">قادم</option>
          <option value="Closed">مغلق</option>
        </select>
      </div>

      {/* Course cards */}
      {loading ? (
        <PageLoader />
      ) : !courses || courses.length === 0 ? (
        <div className="card-surface">
          <EmptyState
            message="لا توجد كورسات منشأة — اضغط على زر إنشاء كورس جديد للبدء"
            action={<button onClick={handleAdd} className="btn-primary"><Plus size={16} /> إنشاء كورس</button>}
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
              { url: course.link_whatsapp, icon: MessageCircle, label: 'واتساب' },
              { url: course.link_tasks, icon: ListTodo, label: 'المهام' },
              { url: course.link_drive, icon: HardDrive, label: 'درايف' },
              { url: course.link_sources, icon: BookMarked, label: 'المصادر' },
            ].filter((l) => l.url);

            return (
              <div key={course.course_id} className="card-surface p-4 hover:border-obsidian-400/50 transition-all flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-base truncate">{course.course_name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant={sb.variant}>{sb.label}</Badge>
                      <Badge variant="gray">{course.level ? LEVEL_LABELS[course.level] : '—'}</Badge>
                      <span className="text-obsidian-300 text-xs">{course.duration_weeks ?? 0} أسبوع</span>
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    <button onClick={() => setMenuOpen(menuOpen === course.course_id ? null : course.course_id)} className="btn-ghost p-1.5">
                      <MoreVertical size={18} />
                    </button>
                    {menuOpen === course.course_id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                        <div className="absolute top-full left-0 z-20 bg-obsidian-600 border border-obsidian-500/50 rounded-lg shadow-xl py-1 w-44">
                          <button onClick={() => navigate('course-details', { id: course.course_id })} className="w-full text-right px-3 py-2 text-sm text-obsidian-100 hover:bg-obsidian-500/40 flex items-center gap-2">
                            <Eye size={15} /> التفاصيل والمالية
                          </button>
                          <button onClick={() => handleEdit(course)} className="w-full text-right px-3 py-2 text-sm text-obsidian-100 hover:bg-obsidian-500/40 flex items-center gap-2">
                            <Pencil size={15} /> تعديل
                          </button>
                          {course.availability_status !== 'Closed' && (
                            <button onClick={() => { setCloseTarget(course); setMenuOpen(null); }} className="w-full text-right px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2">
                              <Lock size={15} /> إغلاق الكورس
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Seat gauge */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-obsidian-300">المقاعد</span>
                    <span className="text-obsidian-100 font-num">
                      {enrolled}{capacity ? ` / ${capacity}` : ' (غير محدود)'}
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

                <div className="text-sm mb-3">
                  <span className="text-obsidian-300">التكلفة: </span>
                  <span className="text-emerald-light font-num font-bold">{formatEGP(course.default_cost)}</span>
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
        title="إغلاق الكورس"
        message={`هل أنت متأكد من إغلاق كورس "${closeTarget?.course_name}"؟ سيتم منع التسجيل الجديد ولكن لن يتم حذف أي بيانات مالية.`}
        confirmLabel="إغلاق الكورس"
        loading={closing}
        danger={false}
      />
    </div>
  );
}
