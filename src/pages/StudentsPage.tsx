import { translate, translateTemplate } from '@/lib/translations';
import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, BookOpen, FileSpreadsheet, MessageCircle, Pencil } from 'lucide-react';
import { useQuery } from '@/lib/useQuery';
import { supabase } from '@/lib/supabase';
import { fetchAllRpcPages } from '@/lib/rpcPagination';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { Alert } from '@/components/ui/Alert';
import { StudentForm } from '@/components/forms/StudentForm';
import { QuickEnrollModal } from '@/components/forms/QuickEnrollModal';
import { exportToCSV } from '@/lib/exportExcel';
import { formatEgyptPhoneForWhatsApp } from '@/lib/whatsapp';
import { formatStudentCode } from '@/lib/format';
import { EGYPT_GOVERNORATES } from '@/lib/geoData';
import type { Student } from '@/types/database';
import { useAuth } from '@/context/useAuth';
import { useRouter } from '@/context/useRouter';
import { PaginationControls } from '@/components/ui/PaginationControls';

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
  const [studyYearFilter, setStudyYearFilter] = useState('');
  const [govFilter, setGovFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [coursesList, setCoursesList] = useState<{ course_id: string; course_name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Fetch courses list for filtering
  useEffect(() => {
    void fetchAllRpcPages((limit, offset) =>
      supabase.rpc('rbac_list_courses_v2', { p_limit: limit, p_offset: offset }),
    ).then(({ data }) => {
      if (Array.isArray(data)) {
        setCoursesList(data.map((c) => ({
          course_id: String((c as Record<string, unknown>).course_id ?? ''),
          course_name: String((c as Record<string, unknown>).course_name ?? ''),
        })));
      }
    });
  }, []);

  // Quick Enroll Modal state
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<string | undefined>();

  const hasClientFilters = Boolean(govFilter || courseFilter);

  const { data: students, loading, error: queryError, refetch } = useQuery<Student[]>(async () => {
    if (!hasClientFilters) {
      const { data, error } = await supabase.rpc('rbac_list_students_v2', {
        p_search: search.trim() || null,
        p_limit: pageSize,
        p_offset: (page - 1) * pageSize,
        p_employment_status: empFilter || null,
        p_study_year: studyYearFilter.trim() || null,
      });
      return { data: (data as Student[] | null) ?? [], error: error?.message ?? null };
    }

    return fetchAllRpcPages<Student>(
      (limit, offset) =>
        supabase.rpc('rbac_list_students_v2', {
          p_search: search.trim() || null,
          p_limit: limit,
          p_offset: offset,
          p_employment_status: empFilter || null,
          p_study_year: studyYearFilter.trim() || null,
        }),
      { pageSize: 100, maxRows: 5000 },
    );
  }, [search, empFilter, studyYearFilter, hasClientFilters, hasClientFilters ? 1 : page, hasClientFilters ? 0 : pageSize]);

  const filteredStudents = useMemo(() => {
    let list = students ?? [];
    if (govFilter) {
      list = list.filter((s) => s.governorate === govFilter);
    }
    if (courseFilter) {
      list = list.filter((s) => s.active_courses?.includes(courseFilter));
    }
    return list;
  }, [students, govFilter, courseFilter]);

  const totalStudents = hasClientFilters
    ? filteredStudents.length
    : (Number(students?.[0]?.total_count) || (students?.length ?? 0));

  const displayedStudents = useMemo(() => {
    if (!hasClientFilters) return filteredStudents;
    return filteredStudents.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredStudents, hasClientFilters, page, pageSize]);

  // A filter/page-size change can leave the current page out of range.
  useEffect(() => {
    if (!loading && page > 1 && displayedStudents.length === 0) {
      setPage(1);
    }
  }, [loading, page, displayedStudents.length]);

  const handleSaved = () => {
    refetch();
  };

  const handleEdit = (student: Student) => {
    setEditing(student);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const { data: exportStudents, error } = await fetchAllRpcPages<Student>(
        (limit, offset) =>
          supabase.rpc('rbac_list_students_v2', {
            p_search: search.trim() || null,
            p_limit: limit,
            p_offset: offset,
            p_employment_status: empFilter || null,
            p_study_year: studyYearFilter.trim() || null,
          }),
        { pageSize: 100, maxRows: 5000 },
      );

      if (error || !exportStudents) {
        setExportError(error ?? translate("تعذر تصدير البيانات"));
        return;
      }

      // Apply client-side filters if active
      let finalExportList = exportStudents;
      if (govFilter) {
        finalExportList = finalExportList.filter((s) => s.governorate === govFilter);
      }
      if (courseFilter) {
        finalExportList = finalExportList.filter((s) => s.active_courses?.includes(courseFilter));
      }

      const headers = [
        translate("كود الطالب"),
        translate("اسم الطالب"),
        translate("رقم الهاتف"),
        translate("البريد الإلكتروني"),
        translate("الحالة الوظيفية"),
        translate("حالة التخرج"),
        translate("الكلية / الجامعة"),
        translate("الدولة"),
        translate("المحافظة"),
        translate("جهة العمل"),
        translate("السنة الدراسية"),
        translate("الدورة التدريبية المسجل بها"),
        translate("الدورات السابقة"),
        translate("ملاحظات"),
      ];

      const rows = finalExportList.map((s) => [
        formatStudentCode(s.student_id, s.student_code),
        s.name,
        canReadStudentPhones ? s.phone ?? '' : '',
        canReadStudentEmail ? s.email ?? '' : '',
        s.employment_status ? translate(EMPLOYMENT_LABELS[s.employment_status] ?? s.employment_status) : '',
        s.grad_status ? translate(GRAD_LABELS[s.grad_status] ?? s.grad_status) : '',
        s.grad_college ?? '',
        s.country ?? '',
        s.governorate ?? '',
        s.workplace ?? '',
        s.study_year ?? '',
        s.active_courses ?? '',
        s.previous_courses ?? '',
        s.notes ?? '',
      ]);

      const dateSuffix = new Date().toISOString().slice(0, 10);
      exportToCSV({
        filename: translateTemplate('دليل_الطلاب_{date}', { date: dateSuffix }),
        headers,
        rows,
      });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : translate("تعذر تصدير بيانات الطلاب."));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-bold text-xl">{translate("إدارة الطلاب")}</h2>
          <p className="text-obsidian-300 text-sm mt-1">{translate("دليل شامل بكل الطلاب والمتدربين المسجلين بالأكاديمية")}</p>
        </div>
        <div className="flex gap-2">
          {canExportStudents && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-secondary"
              title={translate("تصدير الطلاب كملف إكسيل")}
            >
              <FileSpreadsheet size={18} />
              {exporting ? translate("جاري التصدير...") : translate("تصدير إكسيل")}
            </button>
          )}
          {canCreateEnrollment && (
            <button onClick={() => { setSelectedStudentForEnroll(undefined); setEnrollModalOpen(true); }} className="btn-secondary">
              <BookOpen size={18} />
              {translate("تسجيل طالب في دورة تدريبية")}
            </button>
          )}
          {canCreateStudent && (
            <button onClick={handleAdd} className="btn-primary">
              <Plus size={18} />
              {translate("إضافة طالب جديد")}
            </button>
          )}
        </div>
      </div>

      {exportError && <Alert variant="error">{exportError}</Alert>}
      {queryError && <Alert variant="error">{queryError}</Alert>}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-obsidian-300" size={17} />
          <input
            type="text"
            placeholder={translate("بحث بالاسم أو رقم الهاتف...")}
            className="input-base pr-10 text-sm w-full"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          value={empFilter}
          onChange={(e) => { setEmpFilter(e.target.value); setPage(1); }}
          aria-label={translate("كل الحالات الوظيفية")}
          className="input-base text-sm w-auto cursor-pointer"
        >
          <option value="">{translate("كل الحالات الوظيفية")}</option>
          {Object.entries(EMPLOYMENT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{translate(v)}</option>
          ))}
        </select>

        {empFilter === 'Student' && (
          <input
            type="text"
            placeholder={translate("السنة الدراسية")}
            className="input-base text-sm w-auto min-w-[140px]"
            value={studyYearFilter}
            onChange={(e) => { setStudyYearFilter(e.target.value); setPage(1); }}
          />
        )}

        <select
          value={govFilter}
          onChange={(e) => { setGovFilter(e.target.value); setPage(1); }}
          aria-label={translate("كل المحافظات")}
          className="input-base text-sm w-auto cursor-pointer"
        >
          <option value="">{translate("كل المحافظات")}</option>
          {EGYPT_GOVERNORATES.map((gov) => (
            <option key={gov} value={gov}>{gov}</option>
          ))}
        </select>

        {coursesList.length > 0 && (
          <select
            value={courseFilter}
            onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}
            aria-label={translate("كل الدورات")}
            className="input-base text-sm w-auto cursor-pointer"
          >
            <option value="">{translate("كل الدورات")}</option>
            {coursesList.map((c) => (
              <option key={c.course_id} value={c.course_name}>{c.course_name}</option>
            ))}
          </select>
        )}

        {(search || empFilter || studyYearFilter || govFilter || courseFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setEmpFilter('');
              setStudyYearFilter('');
              setGovFilter('');
              setCourseFilter('');
              setPage(1);
            }}
            className="text-xs text-obsidian-300 hover:text-white px-2.5 py-2 rounded-lg bg-obsidian-700 hover:bg-obsidian-600 transition-colors"
          >
            {translate("إعادة ضبط الفلاتر")}
          </button>
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
        ) : displayedStudents.length === 0 ? (
          <EmptyState
            message={translate("لا توجد نتائج تطابق خيارات التصفية المحددة")}
            action={
              <button
                onClick={() => {
                  setGovFilter('');
                  setCourseFilter('');
                  setEmpFilter('');
                  setSearch('');
                }}
                className="btn-secondary"
              >
                {translate("مسح الفلاتر")}
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-obsidian-300 text-xs border-b border-obsidian-500/30">
                  <th className="text-right font-medium px-4 py-3">{translate("الاسم")}</th>
                  <th className="text-right font-medium px-4 py-3 hidden md:table-cell">{translate("الهاتف")}</th>
                  <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">{translate("البريد")}</th>
                  <th className="text-right font-medium px-4 py-3">{translate("الحالة والتفاصيل")}</th>
                  <th className="text-right font-medium px-4 py-3">{translate("الدورة التدريبية المسجل بها")}</th>
                </tr>
              </thead>
              <tbody>
                {displayedStudents.map((s) => {
                  const formattedWa = formatEgyptPhoneForWhatsApp(s.phone);
                  return (
                    <tr key={s.student_id} className="border-b border-obsidian-500/20 hover:bg-obsidian-700/30 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] bg-obsidian-700 border border-obsidian-500/40 text-emerald-light px-1.5 py-0.5 rounded font-num" title={translate("كود الطالب")}>
                            {formatStudentCode(s.student_id, s.student_code)}
                          </span>
                          <button
                            onClick={() => navigate('student-details', { id: s.student_id })}
                            title={translate("عرض ملف الطالب")}
                            className="hover:text-emerald-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 transition-colors text-start cursor-pointer"
                          >
                            {s.name}
                          </button>
                          {canUpdateStudent && (
                            <button
                              type="button"
                              onClick={() => handleEdit(s)}
                              title={translate("تعديل بيانات الطالب")}
                              aria-label={translate("تعديل بيانات الطالب")}
                              className="p-1.5 rounded-lg text-obsidian-300 hover:text-emerald-light hover:bg-obsidian-700/70 transition-colors shrink-0"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                        </div>
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
                        <div className="space-y-1">
                          <Badge variant={s.employment_status === 'Employed' ? 'emerald' : 'gray'}>
                            {s.employment_status ? translate(EMPLOYMENT_LABELS[s.employment_status] ?? s.employment_status) : '—'}
                          </Badge>
                          {s.governorate && (
                            <div className="text-xs text-obsidian-300">
                              📍 {s.governorate}{s.country && s.country !== 'مصر' ? ` (${s.country})` : ''}
                            </div>
                          )}
                          {s.workplace && <div className="text-xs text-obsidian-300">{s.workplace}</div>}
                          {s.employment_status === 'Student' && (s.study_year || s.grad_college) && <div className="text-xs text-obsidian-300">{[s.study_year, s.grad_college].filter(Boolean).join(' · ')}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-obsidian-200">
                        {s.active_course_count ? <span>{s.active_courses}{s.active_course_count > 1 && <Badge variant="blue">+{s.active_course_count - 1}</Badge>}</span> : translate("غير مسجل")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={totalStudents}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />

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
