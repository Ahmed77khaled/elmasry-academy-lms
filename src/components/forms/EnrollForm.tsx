import { translate, translateTemplate } from '@/lib/translations';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Alert';
import { formatEGP } from '@/lib/format';
import type { Course, Student, EnrollmentBalance } from '@/types/database';
import { useAuth } from '@/context/AuthContext';

interface EnrollFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EnrollForm({ open, onClose, onSaved }: EnrollFormProps) {
  const { permissions } = useAuth();
  const canOverridePrice = permissions.includes('enrollments.pricing.override');
  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [existingEnrollments, setExistingEnrollments] = useState<{ student_id: string; course_id: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [agreedCost, setAgreedCost] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedCourse(null);
      setSelectedStudentId('');
      setAgreedCost('');
      setError(null);
      Promise.all([
        supabase.rpc('rbac_list_courses', { p_limit: 500, p_offset: 0 }),
        supabase.rpc('rbac_list_students', { p_search: null, p_limit: 500, p_offset: 0 }),
        supabase.rpc('rbac_list_enrollments', { p_search: null, p_limit: 500, p_offset: 0 }),
      ]).then(([coursesRes, studentsRes, enrollRes]) => {
        const courses = (coursesRes.data ?? []) as Course[];
        setCourses(courses.filter((course) => course.availability_status !== 'Closed'));
        setStudents((studentsRes.data ?? []) as Student[]);
        setExistingEnrollments(((enrollRes.data ?? []) as EnrollmentBalance[]).map(({ student_id, course_id }) => ({ student_id, course_id })));
      });
    }
  }, [open]);

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setAgreedCost(course.default_cost == null ? '' : String(course.default_cost));
    setStep(2);
  };

  const enrolledCount = existingEnrollments.filter((e) => e.course_id === selectedCourse?.course_id).length;
  const remainingSeats = selectedCourse?.max_students
    ? selectedCourse.max_students - enrolledCount
    : null;

  const availableStudents = students.filter(
    (s) => !existingEnrollments.some((e) => e.student_id === s.student_id && e.course_id === selectedCourse?.course_id)
  );

  const handleSubmit = async () => {
    if (!selectedCourse || !selectedStudentId) {
      setError(translate("يرجى اختيار الطالب"));
      return;
    }
    setSaving(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc('rbac_enroll_student', {
      p_student_id: selectedStudentId,
      p_course_id: selectedCourse.course_id,
      p_agreed_cost: canOverridePrice && agreedCost ? parseFloat(agreedCost) : null,
    });

    if (rpcError) {
      setError(rpcError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={translate("تسجيل طالب في كورس")} subtitle={translateTemplate('الخطوة {step} من 3', { step })}>
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        {step === 1 && (
          <div className="space-y-2">
            <p className="text-sm text-obsidian-200 mb-3">{translate("اختر الكورس")}</p>
            {courses.length === 0 ? (
              <Alert variant="info">{translate("لا توجد كورسات متاحة للتسجيل")}</Alert>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {courses.map((course) => {
                  const count = existingEnrollments.filter((e) => e.course_id === course.course_id).length;
                  const seats = course.max_students ? course.max_students - count : null;
                  return (
                    <button
                      key={course.course_id}
                      onClick={() => handleCourseSelect(course)}
                      disabled={seats !== null && seats <= 0}
                      className="w-full text-right p-3 rounded-lg bg-obsidian-700 border border-obsidian-500/40 hover:border-emerald-brand/40 hover:bg-obsidian-600/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-sm">{course.course_name}</span>
                        <span className="text-obsidian-300 text-xs font-num">
                          {seats !== null ? translateTemplate('{seats} مقاعد متاحة', { seats }) : translate("غير محدود")}
                        </span>
                      </div>
                      {course.default_cost != null && <p className="text-obsidian-300 text-xs mt-1 font-num">{formatEGP(course.default_cost)}</p>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 2 && selectedCourse && (
          <div className="space-y-4">
            <div className="bg-obsidian-700/60 rounded-lg p-3 border border-obsidian-500/30">
              <p className="text-obsidian-300 text-xs">{translate("الكورس المختار")}</p>
              <p className="text-white font-medium">{selectedCourse.course_name}</p>
              <p className="text-obsidian-300 text-xs mt-1 font-num">
                {remainingSeats !== null ? translateTemplate('{remainingSeats} مقاعد متاحة', { remainingSeats }) : translate("سعة غير محدودة")}
              </p>
            </div>
            <p className="text-sm text-obsidian-200">{translate("اختر الطالب")}</p>
            {availableStudents.length === 0 ? (
              <Alert variant="info">{translate("لا يوجد طلاب متاحون للتسجيل — جميع الطلاب مسجلون بالفعل")}</Alert>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableStudents.map((student) => (
                  <button
                    key={student.student_id}
                    onClick={() => { setSelectedStudentId(student.student_id); setStep(3); }}
                    className="w-full text-right p-3 rounded-lg bg-obsidian-700 border border-obsidian-500/40 hover:border-emerald-brand/40 hover:bg-obsidian-600/60 transition-all"
                  >
                    <span className="text-white font-medium text-sm">{student.name}</span>
                    {student.phone && <span className="text-obsidian-300 text-xs mr-2 font-num">{student.phone}</span>}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setStep(1)} className="btn-ghost text-xs">{translate("العودة")}</button>
          </div>
        )}

        {step === 3 && selectedCourse && (
          <div className="space-y-4">
            <div className="bg-obsidian-700/60 rounded-lg p-3 border border-obsidian-500/30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-obsidian-300">{translate("الكورس:")}</span>
                <span className="text-white font-medium">{selectedCourse.course_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-obsidian-300">{translate("الطالب:")}</span>
                <span className="text-white font-medium">{students.find((s) => s.student_id === selectedStudentId)?.name}</span>
              </div>
            </div>
            {canOverridePrice ? (
              <Input
                label={translate("المبلغ المتفق عليه (ج.م)")}
                type="number"
                step="0.01"
                value={agreedCost}
                onChange={(e) => setAgreedCost(e.target.value)}
                hint={selectedCourse.default_cost == null ? translate("سيُستخدم السعر الافتراضي إن تركته فارغاً.") : translateTemplate('التكلفة الافتراضية: {amount}', { amount: formatEGP(selectedCourse.default_cost) })}
              />
            ) : <Alert variant="info">{translate("سيُحدد السعر من إعدادات الكورس داخل النظام، ولا يمكنك تغييره من هذا الحساب.")}</Alert>}
            <div className="flex gap-3 justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">{translate("العودة")}</button>
              <button onClick={handleSubmit} disabled={saving} className="btn-primary">
                {saving ? translate("جاري التسجيل...") : translate("تأكيد التسجيل")}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
