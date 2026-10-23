import { translate } from '@/lib/translations';
import { translateTemplate } from '@/lib/translations';
import { useState } from 'react';
import { Search, Plus, Pencil, Eye, BookOpen, FileSpreadsheet, MessageCircle } from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/useRouter';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { StudentForm } from '@/components/forms/StudentForm';
import { QuickEnrollModal } from '@/components/forms/QuickEnrollModal';
import { exportToCSV } from '@/lib/exportExcel';
import { formatEgyptPhoneForWhatsApp } from '@/lib/whatsapp';
import type { Student } from '@/types/database';
import { useAuth } from '@/context/useAuth';

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
  const { permissions } = useAuth();
  const canCreateStudent = permissions.includes('students.create');
  const canUpdateStudent = permissions.includes('students.update');
  const canCreateEnrollment = permissions.includes('enrollments.create');
  const canExportStudents = permissions.includes('students.export');
  const canReadStudentPhones = permissions.includes('students.read_contact_phone');
  const canReadStudentEmail = permissions.includes('students.email.read');
  const [search, setSearch] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  const [gradFilter, setGradFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  // Quick Enroll Modal state
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<string | undefined>();

  const { data: students, loading, refetch } = useQuery<Student[]>(async () => {
    const { data, error } = await supabase.rpc('rbac_list_students', {
      p_search: search.trim() || null,
      p_limit: 500,
      p_offset: 0,
    });
    if (error) return { data: null, error: error.message };
    const filtered = ((data ?? []) as Student[]).filter((student) =>
      (!empFilter || student.employment_status === empFilter)
      && (!gradFilter || student.grad_status === gradFilter));
    return { data: filtered as Student[], error: null };
  }, [search, empFilter, gradFilter]);

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

  // Export to Excel handler
  const handleExportExcel = () => {
    if (!canExportStudents || !students || students.length === 0) return;

    const headers = [
      translate("اسم الطالب"),
      translate("رقم الهاتف"),
      translate("البريد الإلكتروني"),
      translate("الحالة الوظيفية"),
      translate("حالة التخرج"),
      translate("الكلية / الجامعة"),
      translate("الدورات السابقة"),
      translate("تاريخ الإضافة"),
      translate("ملاحظات"),
    ];

    const rows = students.map((s) => [
      s.name,
      canReadStudentPhones ? s.phone ?? '' : '',
      canReadStudentEmail ? s.email ?? '' : '',
      s.employment_status ? translate(EMPLOYMENT_LABELS[s.employment_status] ?? s.employment_status) : '',
      s.grad_status ? translate(GRAD_LABELS[s.grad_status] ?? s.grad_status) : '',
      s.grad_college ?? '',
      s.previous_courses ?? '',
      s.created_at?.slice(0, 10) ?? '',
      s.notes ?? '',
    ]);

    const dateSuffix = new Date().toISOString().slice(0, 10);
    exportToCSV({
      filename: translateTemplate('دليل_الطلاب_{date}', { date: dateSuffix }),
      headers,
      rows,
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-bold text-xl">{translate("إدارة الطلاب")}</h2>
          <p className="text-obsidian-300 text-sm mt-1">{translate("دليل شامل بكل الطلاب والمتدربين المسجلين بالأكاديمية")}</p>
        </div>
        <div className="flex items-center gap-2">
          {canExportStudents && <button
            onClick={handleExportExcel}
            className="btn-secondary flex items-center gap-2 text-sm bg-obsidian-700 hover:bg-obsidian-600 text-emerald-light border border-emerald-500/30"
            title={translate("تصدير بيانات الطلاب المعروضين لملف إكسيل")}
          >
            <FileSpreadsheet size={16} />
            {translate("تصدير إكسيل")}</button>}
          {canCreateEnrollment && <button onClick={() => { setSelectedStudentForEnroll(undefined); setEnrollModalOpen(true); }} className="btn-secondary">
            <BookOpen size={17} />
            {translate("تسجيل طالب في كورس")}</button>}
          {canCreateStudent && <button onClick={handleAdd} className="btn-primary">
            <Plus size={18} />
            {translate("إضافة طالب جديد")}</button>}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="card-surface p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-obsidian-700 rounded-lg px-3 py-2 border border-obsidian-500/40 flex-1 min-w-[200px]">
            <Search size={16} className="text-obsidian-300 shrink-0" />
            <input
              type="text"
              placeholder={translate("بحث بالاسم أو رقم الهاتف...")}
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
            <option value="">{translate("كل الحالات الوظيفية")}</option>
            <option value="Employed">{translate("يعمل")}</option>
            <option value="Unemployed">{translate("لا يعمل")}</option>
            <option value="Student">{translate("طالب")}</option>
            <option value="Freelancer">{translate("مستقل")}</option>
          </select>
          <select
            value={gradFilter}
            onChange={(e) => setGradFilter(e.target.value)}
            className="input-base w-auto"
          >
            <option value="">{translate("كل حالات التخرج")}</option>
            <option value="Graduate">{translate("خريج")}</option>
            <option value="Undergrad">{translate("جامعي")}</option>
          </select>
        </div>

        {students && (
          <div className="text-xs text-obsidian-300 pt-1">
            {translate("إجمالي الطلاب المعروضين:")}{' '}<span className="font-num text-white font-semibold">{students.length}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : !students || students.length === 0 ? (
          <EmptyState
            message={translate("لا يوجد طلاب مسجلين — اضغط على زر إضافة طالب جديد للبدء")}
            action={<button onClick={handleAdd} className="btn-primary"><Plus size={16} /> {translate("إضافة طالب")}</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-obsidian-300 text-xs border-b border-obsidian-500/30">
                  <th className="text-right font-medium px-4 py-3">{translate("الاسم")}</th>
                  <th className="text-right font-medium px-4 py-3 hidden md:table-cell">{translate("الهاتف")}</th>
                  <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">{translate("البريد")}</th>
                  <th className="text-right font-medium px-4 py-3">{translate("وظيفي")}</th>
                  <th className="text-right font-medium px-4 py-3 hidden sm:table-cell">{translate("تخرج")}</th>
                  <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">{translate("الكلية")}</th>
                  <th className="text-right font-medium px-4 py-3">{translate("إجراءات")}</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const formattedWa = formatEgyptPhoneForWhatsApp(s.phone);
                  return (
                    <tr key={s.student_id} className="border-b border-obsidian-500/20 hover:bg-obsidian-700/30 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">
                        <button
                          onClick={() => navigate('student-details', { id: s.student_id })}
                          className="hover:text-emerald-light transition-colors text-right"
                        >
                          {s.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-obsidian-200 font-num hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span>{canReadStudentPhones ? s.phone ?? '—' : '—'}</span>
                          {canReadStudentPhones && formattedWa && (
                            <a
                              href={`https://wa.me/${formattedWa}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 p-0.5"
                              title={translate("محادثة واتساب مباشرة مع المتدرب")}
                            >
                              <MessageCircle size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-obsidian-200 hidden lg:table-cell">{canReadStudentEmail ? s.email ?? '—' : '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.employment_status === 'Employed' ? 'emerald' : 'gray'}>
                          {s.employment_status ? translate(EMPLOYMENT_LABELS[s.employment_status] ?? s.employment_status) : '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={s.grad_status === 'Graduate' ? 'blue' : 'gray'}>
                          {s.grad_status ? translate(GRAD_LABELS[s.grad_status] ?? s.grad_status) : '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-obsidian-200 hidden lg:table-cell">{s.grad_college ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {canCreateEnrollment && <button
                            onClick={() => handleQuickEnroll(s.student_id)}
                            className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
                            title={translate("تسجيل في كورس")}
                          >
                            <BookOpen size={13} />
                            {translate("تسجيل بكورس")}</button>}
                          {canUpdateStudent && <button onClick={() => handleEdit(s)} className="btn-ghost p-1.5" title={translate("تعديل")}>
                            <Pencil size={15} />
                          </button>}
                          <button onClick={() => navigate('student-details', { id: s.student_id })} className="btn-ghost p-1.5" title={translate("عرض الملف")}>
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
