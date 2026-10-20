import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, FormActions } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Alert';
import { formatEGP } from '@/lib/format';
import { UserPlus, UserCheck, CreditCard } from 'lucide-react';
import type { Course, Student, CashBoxBalance } from '@/types/database';

interface QuickEnrollModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  preselectedCourseId?: string;
  preselectedStudentId?: string;
}

export function QuickEnrollModal({
  open,
  onClose,
  onSaved,
  preselectedCourseId,
  preselectedStudentId,
}: QuickEnrollModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [cashBoxes, setCashBoxes] = useState<CashBoxBalance[]>([]);

  // Form Mode: 'existing' | 'new'
  const [studentMode, setStudentMode] = useState<'existing' | 'new'>('existing');

  // Fields
  const [courseId, setCourseId] = useState(preselectedCourseId ?? '');
  const [studentId, setStudentId] = useState(preselectedStudentId ?? '');
  const [agreedCost, setAgreedCost] = useState('');

  // New Student Fields
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmployment, setNewEmployment] = useState('Student');
  const [newGrad, setNewGrad] = useState('Undergrad');
  const [newNotes] = useState('');

  // Immediate Initial Payment (Optional)
  const [withPayment, setWithPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentBoxId, setPaymentBoxId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [receiptRef, setReceiptRef] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setSaving(false);
      setWithPayment(false);
      setPaymentAmount('');
      setReceiptRef('');
      if (preselectedCourseId) setCourseId(preselectedCourseId);
      if (preselectedStudentId) {
        setStudentId(preselectedStudentId);
        setStudentMode('existing');
      }

      Promise.all([
        supabase.from('courses').select('*').neq('availability_status', 'Closed').order('course_name'),
        supabase.from('students').select('*').order('name'),
        supabase.from('cash_box_balances').select('*').eq('is_active', true),
      ]).then(([coursesRes, studentsRes, boxesRes]) => {
        setCourses(coursesRes.data ?? []);
        setStudents(studentsRes.data ?? []);
        const boxes = (boxesRes.data ?? []) as unknown as CashBoxBalance[];
        setCashBoxes(boxes);
        if (boxes.length > 0) setPaymentBoxId(boxes[0].cash_box_id);

        if (preselectedCourseId) {
          const c = coursesRes.data?.find((x) => x.course_id === preselectedCourseId);
          if (c) setAgreedCost(String(c.default_cost));
        }
      });
    }
  }, [open, preselectedCourseId, preselectedStudentId]);

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    const c = courses.find((x) => x.course_id === id);
    if (c) setAgreedCost(String(c.default_cost));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      setError('يرجى اختيار الكورس');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let finalStudentId = studentId;

      // 1. If new student, create the student first
      if (studentMode === 'new') {
        if (!newName.trim()) {
          throw new Error('اسم الطالب مطلوب');
        }
        const { data: newStudent, error: sErr } = await supabase
          .from('students')
          .insert({
            name: newName.trim(),
            phone: newPhone.trim() || null,
            email: newEmail.trim() || null,
            employment_status: newEmployment,
            grad_status: newGrad,
            notes: newNotes.trim() || null,
          })
          .select()
          .single();

        if (sErr) throw sErr;
        finalStudentId = newStudent.student_id;
      } else {
        if (!finalStudentId) {
          throw new Error('يرجى اختيار الطالب المسجل');
        }
      }

      // 2. Enroll student into course via RPC
      const costNum = agreedCost ? parseFloat(agreedCost) : null;
      const { data: enrData, error: enrErr } = await supabase.rpc('enroll_student', {
        p_student_id: finalStudentId,
        p_course_id: courseId,
        p_agreed_cost: costNum,
      });

      if (enrErr) throw enrErr;

      // 3. If immediate payment was checked, record initial payment
      const pAmt = parseFloat(paymentAmount) || 0;
      if (withPayment && pAmt > 0 && enrData?.enrollment_id && paymentBoxId) {
        const { error: payErr } = await supabase.rpc('record_payment', {
          p_enrollment_id: enrData.enrollment_id,
          p_cash_box_id: paymentBoxId,
          p_amount: pAmt,
          p_payment_date: new Date().toISOString().split('T')[0],
          p_method: paymentMethod,
          p_receipt_ref: receiptRef.trim() || null,
          p_notes: 'دفعة تسجيل أولى فورية',
        });
        if (payErr) {
          console.warn('Enrollment succeeded but initial payment failed:', payErr.message);
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التسجيل');
    } finally {
      setSaving(false);
    }
  };

  const selectedCourse = courses.find((c) => c.course_id === courseId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تسجيل طالب في الكورس"
      subtitle={selectedCourse ? `إضافة طالب إلى «${selectedCourse.course_name}»` : 'اختر الكورس والطالب'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        {/* Course selection */}
        {!preselectedCourseId && (
          <Select
            label="الكورس التدريبي"
            value={courseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            options={[
              { value: '', label: '-- اختر الكورس --' },
              ...courses.map((c) => ({
                value: c.course_id,
                label: `${c.course_name} (التكلفة: ${formatEGP(c.default_cost)})`,
              })),
            ]}
            required
          />
        )}

        {/* Student Mode Selector (Toggle between Existing vs New) */}
        {!preselectedStudentId && (
          <div className="bg-obsidian-700/60 p-1.5 rounded-xl border border-obsidian-500/40 flex gap-1">
            <button
              type="button"
              onClick={() => setStudentMode('existing')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                studentMode === 'existing'
                  ? 'bg-emerald-brand text-white shadow-md'
                  : 'text-obsidian-200 hover:text-white'
              }`}
            >
              <UserCheck size={16} />
              طالب مسجل بالفعل
            </button>
            <button
              type="button"
              onClick={() => setStudentMode('new')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                studentMode === 'new'
                  ? 'bg-azure-brand text-white shadow-md'
                  : 'text-obsidian-200 hover:text-white'
              }`}
            >
              <UserPlus size={16} />
              طالب جديد كلياً (إضافة سريعة)
            </button>
          </div>
        )}

        {/* Existing Student Choice */}
        {studentMode === 'existing' && !preselectedStudentId && (
          <Select
            label="اختر الطالب المسجل"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            options={[
              { value: '', label: '-- اختر الطالب من القائمة --' },
              ...students.map((s) => ({
                value: s.student_id,
                label: `${s.name} ${s.phone ? `(${s.phone})` : ''}`,
              })),
            ]}
            required
          />
        )}

        {/* New Student Instant Fields */}
        {studentMode === 'new' && (
          <div className="p-3.5 bg-obsidian-700/40 rounded-xl border border-obsidian-500/30 space-y-3 animate-fade-in">
            <p className="text-xs text-azure-brand font-semibold flex items-center gap-1.5">
              <UserPlus size={14} /> بيانات الطالب الجديد
            </p>
            <Input
              label="اسم الطالب الكامل"
              placeholder="مثال: أحمد عبد الله"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="رقم الهاتف"
                placeholder="01xxxxxxxxx"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
              <Input
                label="البريد الإلكتروني"
                type="email"
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="الحالة الوظيفية"
                value={newEmployment}
                onChange={(e) => setNewEmployment(e.target.value)}
                options={[
                  { value: 'Student', label: 'طالب' },
                  { value: 'Employed', label: 'يعمل' },
                  { value: 'Unemployed', label: 'لا يعمل' },
                  { value: 'Freelancer', label: 'مستقل' },
                ]}
              />
              <Select
                label="حالة التخرج"
                value={newGrad}
                onChange={(e) => setNewGrad(e.target.value)}
                options={[
                  { value: 'Undergrad', label: 'جامعي' },
                  { value: 'Graduate', label: 'خريج' },
                ]}
              />
            </div>
          </div>
        )}

        {/* Agreed Cost */}
        <div className="p-3 bg-obsidian-700/30 rounded-xl border border-obsidian-500/20">
          <Input
            label="المبلغ المتفق عليه للكورس (ج.م)"
            type="number"
            step="0.01"
            placeholder={selectedCourse ? String(selectedCourse.default_cost) : '0.00'}
            value={agreedCost}
            onChange={(e) => setAgreedCost(e.target.value)}
          />
          <p className="text-xs text-obsidian-300 mt-1.5">يمكن تعديل السعر وفقاً لأي خصم أو اتفاق خاص مع الطالب</p>
        </div>

        {/* Instant Deposit Checkbox */}
        <div className="p-3 bg-obsidian-700/30 rounded-xl border border-obsidian-500/20 space-y-3">
          <label className="flex items-center gap-2 text-sm text-obsidian-100 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={withPayment}
              onChange={(e) => setWithPayment(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-brand bg-obsidian-600 border-obsidian-400 focus:ring-emerald-brand"
            />
            <CreditCard size={16} className="text-emerald-light" />
            <span>تحصيل دفعة أولى أو مقدم الآن فور التسجيل</span>
          </label>

          {withPayment && (
            <div className="pt-2 border-t border-obsidian-500/20 grid grid-cols-2 gap-3 animate-fade-in">
              <Input
                label="مبلغ الدفعة الأولى (ج.م)"
                type="number"
                step="0.01"
                placeholder="مثال: 500"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required={withPayment}
              />
              <Select
                label="الخزنة المستلمة"
                value={paymentBoxId}
                onChange={(e) => setPaymentBoxId(e.target.value)}
                options={cashBoxes.map((b) => ({
                  value: b.cash_box_id,
                  label: `${b.name} (${formatEGP(b.current_balance)})`,
                }))}
                required={withPayment}
              />
              <Select
                label="طريقة الدفع"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={[
                  { value: 'Cash', label: 'كاش' },
                  { value: 'Vodafone Cash', label: 'فودافون كاش' },
                  { value: 'InstaPay', label: 'إنستاباي' },
                  { value: 'Bank Transfer', label: 'تحويل بنكي' },
                ]}
              />
              <Input
                label="رقم الإيصال / المرجع (اختياري)"
                placeholder="REC-001"
                value={receiptRef}
                onChange={(e) => setReceiptRef(e.target.value)}
              />
            </div>
          )}
        </div>

        <FormActions>
          <button type="button" onClick={onClose} className="btn-secondary">
            إلغاء
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'جاري التسجيل...' : 'تأكيد تسجيل الطالب بالكورس'}
          </button>
        </FormActions>
      </form>
    </Modal>
  );
}
