import { useState } from 'react';
import { Search, Plus, Pencil, Eye, BookOpen } from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/components/AppShell';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { StudentForm } from '@/components/forms/StudentForm';
import { QuickEnrollModal } from '@/components/forms/QuickEnrollModal';
import type { Student } from '@/types/database';

const EMPLOYMENT_LABELS: Record<string, string> = {
  Employed: 'يعمل',
  Unemployed: 'لا يعمل',
  Student: 'طالب',
  Freelancer: 'مستقل',
};

const GRAD_LABELS: Record<string, string> = {
  Graduate: 'خريج',
  Undergrad: 'جامعي',
};

export function StudentsPage() {
  const { navigate } = useRouter();
  const [search, setSearch] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  const [gradFilter, setGradFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  // Quick Enroll Modal state
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<string | undefined>();

  const { data: students, loading, refetch } = useQuery<Student[]>(async () => {
    let query = supabase.from('students').select('*').order('created_at', { ascending: false });
    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (empFilter) query = query.eq('employment_status', empFilter);
    if (gradFilter) query = query.eq('grad_status', gradFilter);
    const { data, error } = await query;
    return { data, error: error?.message ?? null };
  });

  const handleEdit = (student: Student) => {
    setEditing(student);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleQuickEnroll = (studentId: string) => {
    setSelectedStudentForEnroll(studentId);
    setEnrollModalOpen(true);
  };

  const handleSaved = () => {
    refetch();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-bold text-xl">إدارة الطلاب</h2>
          <p className="text-obsidian-300 text-sm mt-1">دليل شامل بكل الطلاب المسجلين بالأكاديمية</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setSelectedStudentForEnroll(undefined); setEnrollModalOpen(true); }} className="btn-secondary">
            <BookOpen size={17} />
            تسجيل طالب في كورس
          </button>
          <button onClick={handleAdd} className="btn-primary">
            <Plus size={18} />
            إضافة طالب جديد
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-surface p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-obsidian-700 rounded-lg px-3 py-2 border border-obsidian-500/40 flex-1 min-w-[200px]">
          <Search size={16} className="text-obsidian-300 shrink-0" />
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-obsidian-100 placeholder:text-obsidian-300 outline-none w-full"
          />
        </div>
        <select
          value={empFilter}
          onChange={(e) => setEmpFilter(e.target.value)}
          className="input-base w-auto"
        >
          <option value="">كل الحالات الوظيفية</option>
          <option value="Employed">يعمل</option>
          <option value="Unemployed">لا يعمل</option>
          <option value="Student">طالب</option>
          <option value="Freelancer">مستقل</option>
        </select>
        <select
          value={gradFilter}
          onChange={(e) => setGradFilter(e.target.value)}
          className="input-base w-auto"
        >
          <option value="">كل حالات التخرج</option>
          <option value="Graduate">خريج</option>
          <option value="Undergrad">جامعي</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : !students || students.length === 0 ? (
          <EmptyState
            message="لا يوجد طلاب مسجلين — اضغط على زر إضافة طالب جديد للبدء"
            action={<button onClick={handleAdd} className="btn-primary"><Plus size={16} /> إضافة طالب</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-obsidian-300 text-xs border-b border-obsidian-500/30">
                  <th className="text-right font-medium px-4 py-3">الاسم</th>
                  <th className="text-right font-medium px-4 py-3 hidden md:table-cell">الهاتف</th>
                  <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">البريد</th>
                  <th className="text-right font-medium px-4 py-3">وظيفي</th>
                  <th className="text-right font-medium px-4 py-3 hidden sm:table-cell">تخرج</th>
                  <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">الكلية</th>
                  <th className="text-right font-medium px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.student_id} className="border-b border-obsidian-500/20 hover:bg-obsidian-700/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      <button
                        onClick={() => navigate('student-details', { id: s.student_id })}
                        className="hover:text-emerald-light transition-colors text-right"
                      >
                        {s.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-obsidian-200 font-num hidden md:table-cell">{s.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-obsidian-200 hidden lg:table-cell">{s.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.employment_status === 'Employed' ? 'emerald' : 'gray'}>
                        {s.employment_status ? EMPLOYMENT_LABELS[s.employment_status] : '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant={s.grad_status === 'Graduate' ? 'blue' : 'gray'}>
                        {s.grad_status ? GRAD_LABELS[s.grad_status] : '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-obsidian-200 hidden lg:table-cell">{s.grad_college ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickEnroll(s.student_id)}
                          className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
                          title="تسجيل في كورس"
                        >
                          <BookOpen size={13} />
                          تسجيل بكورس
                        </button>
                        <button onClick={() => handleEdit(s)} className="btn-ghost p-1.5" title="تعديل">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => navigate('student-details', { id: s.student_id })} className="btn-ghost p-1.5" title="عرض الملف">
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StudentForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSaved} student={editing} />

      <QuickEnrollModal
        open={enrollModalOpen}
        onClose={() => {
          setEnrollModalOpen(false);
          setSelectedStudentForEnroll(undefined);
        }}
        onSaved={handleSaved}
        preselectedStudentId={selectedStudentForEnroll}
      />
    </div>
  );
}
