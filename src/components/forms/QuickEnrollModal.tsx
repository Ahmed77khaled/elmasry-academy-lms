import { translate } from '@/lib/translations';
import { translateTemplate } from '@/lib/translations';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, FormActions } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Alert';
import { formatCurrency } from '@/lib/format';
import { UserPlus, UserCheck, CreditCard } from 'lucide-react';
import type { Course, Student, CashBoxBalance, Currency } from '@/types/database';
import { useAuth } from '@/context/useAuth';
import { COUNTRIES, getGovernoratesForCountry } from '@/lib/geoData';

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
  const { permissions } = useAuth();
  const canOverridePrice = permissions.includes('enrollments.pricing.override');
  const canRecordPayment = permissions.includes('finance.payments.record');
  const canManagePhone = permissions.includes('students.read_contact_phone');
  const canManageEmail = permissions.includes('students.email.update');
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [cashBoxes, setCashBoxes] = useState<CashBoxBalance[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Form Mode: 'existing' | 'new'
  const [studentMode, setStudentMode] = useState<'existing' | 'new'>('existing');

  // Fields
  const [courseId, setCourseId] = useState(preselectedCourseId ?? '');
  const [studentId, setStudentId] = useState(preselectedStudentId ?? '');
  const [agreedCost, setAgreedCost] = useState('');
  const [currency, setCurrency] = useState<Currency>('EGP');

  // New Student Fields
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmployment, setNewEmployment] = useState('Student');
  const [newGrad, setNewGrad] = useState('Undergrad');
  const [newCollege, setNewCollege] = useState('');
  const [newCountry, setNewCountry] = useState('مصر');
  const [newGovernorate, setNewGovernorate] = useState('');
  const [newWorkplace, setNewWorkplace] = useState('');
  const [newStudyYear, setNewStudyYear] = useState('');
  const [newNotes] = useState('');

  // Immediate Initial Payment (Optional)
  const [withPayment, setWithPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentBoxId, setPaymentBoxId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [receiptRef, setReceiptRef] = useState('');
  const [pendingEnrollmentId, setPendingEnrollmentId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickGovernorates = useMemo(() => {
    return getGovernoratesForCountry(newCountry || 'مصر');
  }, [newCountry]);

  useEffect(() => {
    if (open) {
      setError(null);
      setSaving(false);
      setPendingEnrollmentId(null);
      setCourseSearch('');
      setStudentSearch('');
      setCurrency('EGP');
      setWithPayment(false);
      setPaymentAmount('');
      setPaymentMethod('Cash');
      setReceiptRef('');
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewEmployment('Student');
      setNewGrad('Undergrad');
      setNewCollege('');
      setNewCountry('مصر');
      setNewGovernorate('');
      setNewWorkplace('');
      setNewStudyYear('');
      setCourseId(preselectedCourseId ?? '');
      if (preselectedStudentId) {
        setStudentId(preselectedStudentId);
        setStudentMode('existing');
      } else {
        setStudentId('');
        setStudentMode('existing');
      }

      Promise.all([
        supabase.rpc('rbac_list_courses_v2', { p_limit: 500, p_offset: 0 }),
        supabase.rpc('rbac_list_students_v2', { p_search: null, p_limit: 500, p_offset: 0 }),
        canRecordPayment ? supabase.rpc('rbac_list_cash_boxes_v2') : Promise.resolve({ data: [], error: null }),
      ]).then(([coursesRes, studentsRes, boxesRes]) => {
        const openCourses = ((coursesRes.data ?? []) as Course[]).filter((course) => course.availability_status !== 'Closed');
        setCourses(openCourses as Course[]);
        setStudents((studentsRes.data ?? []) as Student[]);
        const boxes = (boxesRes.data ?? []) as CashBoxBalance[];
        setCashBoxes(boxes);
        if (boxes.length > 0) setPaymentBoxId(boxes[0].cash_box_id);

        if (preselectedCourseId) {
          const c = openCourses.find((x) => x.course_id === preselectedCourseId);
          if (c) setAgreedCost(c.default_cost == null ? '' : String(c.default_cost));
        }
      });
    }
  }, [open, preselectedCourseId, preselectedStudentId, canRecordPayment]);

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    setCurrency('EGP');
    const c = courses.find((x) => x.course_id === id);
    if (c) setAgreedCost(c.default_cost == null ? '' : String(c.default_cost));
  };

  const handleCurrencyChange = (value: Currency) => {
    setCurrency(value);
    const c = courses.find((x) => x.course_id === courseId);
    const price = value === 'USD' ? c?.default_cost_usd : c?.default_cost;
    setAgreedCost(price == null ? '' : String(price));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId && !pendingEnrollmentId) {
      setError(translate("يرجى اختيار الكورس"));
      return;
    }

    const pAmt = parseFloat(paymentAmount) || 0;
    const activeCourse = courses.find((c) => c.course_id === courseId);
    const defaultPrice = currency === 'USD' ? activeCourse?.default_cost_usd : activeCourse?.default_cost;
    const expectedFee = canOverridePrice && agreedCost.trim() !== ''
      ? parseFloat(agreedCost)
      : (defaultPrice ?? null);

    if (withPayment && canRecordPayment) {
      if (pAmt <= 0) {
        setError(translate("المبلغ يجب أن يكون أكبر من صفر ولا يمكن إدخال مبالغ بالسالب"));
        return;
      }
      if (!paymentBoxId) {
        setError(translate("تعذر تسجيل الطالب: لم يتم اختيار الخزنة لاستلام الدفعة."));
        return;
      }
      if (expectedFee != null && Number.isFinite(expectedFee) && pAmt > expectedFee) {
        setError(translate("مبلغ الدفعة الأولى يتجاوز التكلفة المتفق عليها للدورة."));
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      let targetEnrollmentId = pendingEnrollmentId;

      if (!targetEnrollmentId) {
        let finalStudentId = studentId;

        // 1. If new student, create the student first
        if (studentMode === 'new') {
          if (!newName.trim()) {
            throw new Error(translate("اسم الطالب مطلوب"));
          }
          const { data: newStudent, error: sErr } = await supabase.rpc('rbac_create_student_v2', {
            p_name: newName.trim(),
            p_phone: canManagePhone ? newPhone.trim() || null : null,
            p_email: canManageEmail ? newEmail.trim() || null : null,
            p_employment_status: newEmployment,
            p_grad_status: newGrad,
            p_grad_college: (newGrad === 'Graduate' || newEmployment === 'Student') ? newCollege.trim() || null : null,
            p_previous_courses: null,
            p_notes: newNotes.trim() || null,
            p_country: newCountry.trim() || null,
            p_governorate: newGovernorate.trim() || null,
            p_workplace: newEmployment === 'Employed' || newEmployment === 'Freelancer' ? newWorkplace.trim() || null : null,
            p_study_year: newEmployment === 'Student' ? newStudyYear.trim() || null : null,
          });

          if (sErr) {
            setError(sErr.message || translate("تعذر إضافة بيانات الطالب الجديد"));
            return;
          }
          if (typeof newStudent !== 'string' || !newStudent) {
            setError(translate("تعذر استلام رقم الطالب الجديد"));
            return;
          }
          finalStudentId = newStudent;
        } else if (!finalStudentId) {
          setError(translate("يرجى اختيار الطالب المسجل"));
          return;
        }

        // 2. Enroll student into course via RPC
        const costNum = canOverridePrice && agreedCost ? parseFloat(agreedCost) : null;
        const { data: enrData, error: enrErr } = await supabase.rpc('rbac_enroll_student_v2', {
          p_student_id: finalStudentId,
          p_course_id: courseId,
          p_currency: currency,
          p_agreed_cost: costNum,
        });

        if (enrErr) {
          setError(enrErr.message || translate("حدث خطأ أثناء تسجيل الطالب في الكورس"));
          return;
        }
        const enrollment = Array.isArray(enrData) ? enrData[0] : enrData;
        targetEnrollmentId = enrollment?.enrollment_id ?? null;
      }

      // 3. If immediate payment was checked, record initial payment and never swallow errors
      if (withPayment && canRecordPayment && pAmt > 0 && targetEnrollmentId && paymentBoxId) {
        const { error: payErr } = await supabase.rpc('rbac_record_payment_v2', {
          p_enrollment_id: targetEnrollmentId,
          p_cash_box_id: paymentBoxId,
          p_amount: pAmt,
          p_payment_date: new Date().toISOString().split('T')[0],
          p_method: paymentMethod,
          p_receipt_ref: receiptRef.trim() || null,
          p_notes: translate("دفعة تسجيل أولى فورية"),
        });
        if (payErr) {
          setPendingEnrollmentId(targetEnrollmentId);
          onSaved();
          setError(translateTemplate(
            'تم تسجيل الطالب في الدورة بنجاح، ولكن تعذر تسجيل الدفعة الأولى: {error}. يمكنك إعادة المحاولة أدناه أو إغلاق النافذة وتسجيلها لاحقاً.',
            { error: payErr.message },
          ));
          return;
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : null;
      setError(msg || translate("حدث خطأ أثناء التسجيل"));
    } finally {
      setSaving(false);
    }
  };

  const selectedCourse = courses.find((c) => c.course_id === courseId);
  const filteredCourses = courses.filter((course) => course.course_name.toLocaleLowerCase().includes(courseSearch.trim().toLocaleLowerCase()));
  const filteredStudents = students.filter((student) => student.name.toLocaleLowerCase().includes(studentSearch.trim().toLocaleLowerCase()));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={translate("تسجيل طالب في الكورس")}
      subtitle={selectedCourse ? translateTemplate('إضافة طالب إلى «{course}»', { course: selectedCourse.course_name }) : translate("اختر الكورس والطالب")}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        {!pendingEnrollmentId && (
          <>
            {/* Course selection */}
            {!preselectedCourseId && (
              <div className="space-y-2">
                <Input label={translate("بحث باسم الكورس")} value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} />
                <Select
                  label={translate("الكورس التدريبي")}
                  value={courseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  options={[
                    { value: '', label: translate("-- اختر الكورس --") },
                    ...filteredCourses.map((c) => ({
                    value: c.course_id,
                    label: translateTemplate('{course} ({prices})', {
                      course: c.course_name,
                      prices: [c.default_cost != null && formatCurrency(c.default_cost), c.default_cost_usd != null && formatCurrency(c.default_cost_usd, 'USD')].filter(Boolean).join(' · ') || translate('No default price'),
                    }),
                    })),
                  ]}
                  required
                />
              </div>
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
                  {translate("طالب مسجل بالفعل")}</button>
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
                  {translate("طالب جديد كلياً (إضافة سريعة)")}</button>
              </div>
            )}

            {/* Existing Student Choice */}
            {studentMode === 'existing' && !preselectedStudentId && (
              <div className="space-y-2">
                <Input label={translate("بحث باسم الطالب")} value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                <Select
                  label={translate("اختر الطالب المسجل")}
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  options={[
                    { value: '', label: translate("-- اختر الطالب من القائمة --") },
                    ...filteredStudents.map((s) => ({
                    value: s.student_id,
                    label: `${s.name} ${s.phone ? `(${s.phone})` : ''}`,
                    })),
                  ]}
                  required
                />
              </div>
            )}

            {/* New Student Instant Fields */}
            {studentMode === 'new' && (
              <div className="p-3.5 bg-obsidian-700/40 rounded-xl border border-obsidian-500/30 space-y-3 animate-fade-in">
                <p className="text-xs text-azure-light font-semibold flex items-center gap-1.5">
                  <UserPlus size={14} /> {translate("بيانات الطالب الجديد")}</p>
                <Input
                  label={translate("اسم الطالب الكامل")}
                  placeholder={translate("مثال: أحمد عبد الله")}
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  {canManagePhone && <Input
                    label={translate("رقم الهاتف")}
                    placeholder="01xxxxxxxxx"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />}
                  {canManageEmail && <Input
                    label={translate("البريد الإلكتروني")}
                    type="email"
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label={translate("الدولة")}
                    value={newCountry || 'مصر'}
                    onChange={(e) => {
                      const countryVal = e.target.value;
                      setNewCountry(countryVal);
                      if (countryVal !== 'مصر') setNewGovernorate('');
                    }}
                    options={COUNTRIES.map((c) => ({ value: c.name, label: c.name }))}
                  />
                  {quickGovernorates.length > 0 ? (
                    <Select
                      label={translate("المحافظة")}
                      value={newGovernorate}
                      onChange={(e) => setNewGovernorate(e.target.value)}
                      options={[
                        { value: '', label: translate("-- اختر المحافظة --") },
                        ...quickGovernorates.map((gov) => ({ value: gov, label: gov })),
                      ]}
                    />
                  ) : (
                    <Input
                      label={translate("المحافظة / المدينة (اختياري)")}
                      placeholder={translate("مثال: المدينة أو المنطقة")}
                      value={newGovernorate}
                      onChange={(e) => setNewGovernorate(e.target.value)}
                    />
                  )}
                </div>
                {(newEmployment === 'Employed' || newEmployment === 'Freelancer') && <Input label={translate("جهة العمل أو المسمى الوظيفي")} value={newWorkplace} onChange={(e) => setNewWorkplace(e.target.value)} />}
                {newEmployment === 'Student' && <Input label={translate("السنة الدراسية")} value={newStudyYear} onChange={(e) => setNewStudyYear(e.target.value)} />}
                {(newGrad === 'Graduate' || newEmployment === 'Student') && <Input label={translate("\u0627\u0644\u0643\u0644\u064a\u0629")} value={newCollege} onChange={(e) => setNewCollege(e.target.value)} />}
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label={translate("الحالة الوظيفية")}
                    value={newEmployment}
                    onChange={(e) => setNewEmployment(e.target.value)}
                    options={[
                      { value: 'Student', label: translate("طالب") },
                      { value: 'Employed', label: translate("يعمل") },
                      { value: 'Unemployed', label: translate("لا يعمل") },
                      { value: 'Freelancer', label: translate("مستقل") },
                    ]}
                  />
                  <Select
                    label={translate("حالة التخرج")}
                    value={newGrad}
                    onChange={(e) => setNewGrad(e.target.value)}
                    options={[
                      { value: 'Undergrad', label: translate("جامعي") },
                      { value: 'Graduate', label: translate("خريج") },
                    ]}
                  />
                </div>
              </div>
            )}

            {/* Agreed Cost */}
            <div className="p-3 bg-obsidian-700/30 rounded-xl border border-obsidian-500/20 space-y-3">
              <Select
                label={translate('عملة التسجيل')}
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
                options={[{ value: 'EGP', label: translate('جنيه مصري (EGP)') }, { value: 'USD', label: translate('دولار أمريكي (USD)') }]}
              />
              {canOverridePrice ? <Input
                label={translateTemplate('المبلغ المتفق عليه للكورس ({currency})', { currency })}
                type="number"
                step="0.01"
                min="0"
                placeholder={(currency === 'USD' ? selectedCourse?.default_cost_usd : selectedCourse?.default_cost) == null ? translate("السعر الافتراضي") : String(currency === 'USD' ? selectedCourse?.default_cost_usd : selectedCourse?.default_cost)}
                value={agreedCost}
                onChange={(e) => { const v = e.target.value; if (!v.startsWith("-")) setAgreedCost(v); }}
              /> : <p className="text-sm text-obsidian-200">{translate("سيُحدد السعر من إعدادات الكورس، ولا يمكن تغييره من هذا الحساب.")}</p>}
              {canOverridePrice && <p className="text-xs text-obsidian-300 mt-1.5">{translate("يمكن تعديل السعر وفقاً لأي خصم أو اتفاق خاص مع الطالب")}</p>}
            </div>
          </>
        )}

        {/* Instant Deposit Checkbox */}
        {canRecordPayment && <>
        <div className="p-3 bg-obsidian-700/30 rounded-xl border border-obsidian-500/20 space-y-3">
          <label className="flex items-center gap-2 text-sm text-obsidian-100 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={withPayment}
              onChange={(e) => setWithPayment(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-brand bg-obsidian-600 border-obsidian-400 focus:ring-emerald-brand"
            />
            <CreditCard size={16} className="text-emerald-light" />
            <span>{translate("تحصيل دفعة أولى أو مقدم الآن فور التسجيل")}</span>
          </label>

          {withPayment && (
            <div className="pt-2 border-t border-obsidian-500/20 grid grid-cols-2 gap-3 animate-fade-in">
              <Input
                label={translateTemplate('مبلغ الدفعة الأولى ({currency})', { currency })}
                type="number"
                step="0.01"
                min="0.01"
                placeholder={translate("مثال: 500")}
                value={paymentAmount}
                onChange={(e) => { const v = e.target.value; if (!v.startsWith("-")) setPaymentAmount(v); }}
                required={withPayment}
              />
              <Select
                label={translate("الخزنة المستلمة")}
                value={paymentBoxId}
                onChange={(e) => setPaymentBoxId(e.target.value)}
                options={cashBoxes.map((b) => ({
                  value: b.cash_box_id,
                  label: `${b.name} (${formatCurrency(currency === 'USD' ? (b.current_balance_usd ?? 0) : b.current_balance, currency)})`,
                }))}
                required={withPayment}
              />
              <Select
                label={translate("طريقة الدفع")}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={[
                  { value: 'Cash', label: translate("كاش") },
                  { value: 'Vodafone Cash', label: translate("فودافون كاش") },
                  { value: 'InstaPay', label: translate("إنستاباي") },
                  { value: 'Bank Transfer', label: translate("تحويل بنكي") },
                ]}
              />
              <Input
                label={translate("رقم الإيصال / المرجع (اختياري)")}
                placeholder="REC-001"
                value={receiptRef}
                onChange={(e) => setReceiptRef(e.target.value)}
              />
            </div>
          )}
        </div>
        </>}

        <FormActions>
          <button type="button" onClick={onClose} className="btn-secondary">
            {pendingEnrollmentId ? translate("إغلاق") : translate("إلغاء")}</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving
              ? translate("جاري التسجيل...")
              : pendingEnrollmentId
              ? translate("إعادة محاولة تسجيل الدفعة")
              : translate("تأكيد تسجيل الطالب بالكورس")}
          </button>
        </FormActions>
      </form>
    </Modal>
  );
}
