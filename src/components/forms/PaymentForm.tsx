import { translate, translateTemplate } from '@/lib/translations';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea, FormActions } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Alert';
import { formatCurrency, formatBalance, todayISO } from '@/lib/format';
import type { EnrollmentBalance, CashBoxBalance } from '@/types/database';

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  preselectedEnrollmentId?: string;
}

export function PaymentForm({ open, onClose, onSaved, preselectedEnrollmentId }: PaymentFormProps) {
  const [enrollments, setEnrollments] = useState<EnrollmentBalance[]>([]);
  const [cashBoxes, setCashBoxes] = useState<CashBoxBalance[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState(preselectedEnrollmentId ?? '');
  const [cashBoxId, setCashBoxId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [method, setMethod] = useState('Cash');
  const [receiptRef, setReceiptRef] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setAmount('');
      setReceiptRef('');
      setNotes('');
      const initialEnrId = preselectedEnrollmentId ?? '';
      setSelectedEnrollment(initialEnrId);
      setStudentSearch('');
      setCourseSearch('');
      setPaymentDate(todayISO());
      setMethod('Cash');

      Promise.all([
        supabase.rpc('rbac_list_enrollments_v2', { p_search: null, p_limit: 500, p_offset: 0 }),
        supabase.rpc('rbac_list_cash_boxes_v2'),
      ]).then(([enrRes, boxRes]) => {
        const enrollmentRows = ((enrRes.data ?? []) as EnrollmentBalance[]).filter(
          (enrollment) => enrollment.enrollment_status !== 'Dropped'
        );
        setEnrollments(enrollmentRows);

        if (initialEnrId) {
          const pre = enrollmentRows.find((e) => e.enrollment_id === initialEnrId);
          if (pre) setSelectedStudentId(pre.student_id);
        } else {
          setSelectedStudentId('');
        }

        const activeBoxes = ((boxRes.data ?? []) as CashBoxBalance[]).filter((box) => box.is_active);
        setCashBoxes(activeBoxes);
        if (activeBoxes.length > 0) {
          setCashBoxId(activeBoxes[0].cash_box_id);
        }
      });
    }
  }, [open, preselectedEnrollmentId]);

  // Unique students from active enrollments
  const studentsList = Array.from(
    new Map(
      enrollments.map((e) => [
        e.student_id,
        { student_id: e.student_id, student_name: e.student_name },
      ])
    ).values()
  ).sort((a, b) => a.student_name.localeCompare(b.student_name, 'ar'));

  const filteredStudents = studentSearch.trim()
    ? studentsList.filter((s) =>
        s.student_name.toLowerCase().includes(studentSearch.trim().toLowerCase())
      )
    : studentsList;

  // Enrollments specific to the selected student
  const studentEnrollments = selectedStudentId
    ? enrollments.filter((e) => e.student_id === selectedStudentId)
    : [];

  const filteredStudentEnrollments = courseSearch.trim()
    ? studentEnrollments.filter((e) =>
        e.course_name.toLowerCase().includes(courseSearch.trim().toLowerCase())
      )
    : studentEnrollments;

  const selectedEnr = enrollments.find((e) => e.enrollment_id === selectedEnrollment);
  const remaining = selectedEnr?.remaining_balance ?? 0;

  const handleStudentChange = (newStudentId: string) => {
    setSelectedStudentId(newStudentId);
    setCourseSearch('');
    if (!newStudentId) {
      setSelectedEnrollment('');
      return;
    }
    const studentEnrs = enrollments.filter((e) => e.student_id === newStudentId);
    if (studentEnrs.length === 1) {
      setSelectedEnrollment(studentEnrs[0].enrollment_id);
    } else if (!studentEnrs.some((e) => e.enrollment_id === selectedEnrollment)) {
      setSelectedEnrollment('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) { setError(translate("يرجى اختيار الطالب")); return; }
    if (!selectedEnrollment) { setError(translate("يرجى اختيار الدورة التدريبية")); return; }
    if (!cashBoxId) { setError(translate("يرجى اختيار الخزنة")); return; }
    if (!amount || parseFloat(amount) <= 0) { setError(translate("المبلغ يجب أن يكون أكبر من صفر ولا يمكن إدخال مبالغ بالسالب")); return; }

    setSaving(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc('rbac_record_payment_v2', {
      p_enrollment_id: selectedEnrollment,
      p_cash_box_id: cashBoxId,
      p_amount: parseFloat(amount),
      p_payment_date: paymentDate,
      p_method: method,
      p_receipt_ref: receiptRef.trim() || null,
      p_notes: notes.trim() || null,
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
    <Modal open={open} onClose={onClose} title={translate("تسجيل دفعة جديدة")} subtitle={translate("أدخل تفاصيل الدفعة")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        {/* 2-Step Enrollment Selection: Student + Course */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-obsidian-700/40 p-3 rounded-xl border border-obsidian-500/30">
          {/* 1. Student Selection with Search */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-obsidian-100">
                {translate("1. اسم الطالب")} <span className="text-rose-400">*</span>
              </label>
              {studentsList.length > 0 && (
                <span className="text-[11px] text-obsidian-400">
                  {studentsList.length} {translate("طالب متاح")}
                </span>
              )}
            </div>

            <div className="relative">
              <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-obsidian-400 pointer-events-none" />
              <input
                type="text"
                placeholder={translate("بحث سريع بالاسم...")}
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full bg-obsidian-800/90 border border-obsidian-500/40 rounded-lg pr-8 pl-2.5 py-1.5 text-xs text-white placeholder-obsidian-400 focus:outline-none focus:border-azure-brand transition-colors"
              />
            </div>

            <Select
              value={selectedStudentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              options={[
                { value: '', label: translate("-- اختر الطالب --") },
                ...filteredStudents.map((s) => ({
                  value: s.student_id,
                  label: s.student_name,
                })),
              ]}
              required
            />
          </div>

          {/* 2. Course Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-obsidian-100">
                {translate("2. الدورة التدريبية")} <span className="text-rose-400">*</span>
              </label>
              {selectedStudentId && studentEnrollments.length > 0 && (
                <span className="text-[11px] text-azure-brand font-medium">
                  {studentEnrollments.length} {translate("دورة مسجلة")}
                </span>
              )}
            </div>

            {studentEnrollments.length > 2 && (
              <div className="relative">
                <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-obsidian-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={translate("بحث في دورات الطالب...")}
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full bg-obsidian-800/90 border border-obsidian-500/40 rounded-lg pr-8 pl-2.5 py-1.5 text-xs text-white placeholder-obsidian-400 focus:outline-none focus:border-azure-brand transition-colors"
                />
              </div>
            )}

            <Select
              value={selectedEnrollment}
              onChange={(e) => setSelectedEnrollment(e.target.value)}
              disabled={!selectedStudentId || studentEnrollments.length === 0}
              options={[
                {
                  value: '',
                  label: !selectedStudentId
                    ? translate("-- اختر الطالب أولاً --")
                    : studentEnrollments.length === 0
                    ? translate("لا توجد دورات نشطة لهذا الطالب")
                    : translate("-- اختر الدورة التدريبية --"),
                },
                ...filteredStudentEnrollments.map((e) => ({
                  value: e.enrollment_id,
                  label: translateTemplate('{course} (المتبقي: {amount})', {
                    course: e.course_name,
                    amount: formatCurrency(e.remaining_balance ?? 0, e.agreed_currency ?? 'EGP'),
                  }),
                })),
              ]}
              required
            />
          </div>
        </div>

        {selectedEnr && (
          <div className="bg-obsidian-700/60 rounded-lg p-3 border border-obsidian-500/30 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-obsidian-300">{translate("المبلغ المتفق عليه:")}</span>
              <span className="text-white font-num font-semibold">{formatCurrency(selectedEnr.agreed_cost ?? 0, selectedEnr.agreed_currency ?? 'EGP')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-obsidian-300">{translate("إجمالي المدفوع سابقاً:")}</span>
              <span className="text-emerald-light font-num font-semibold">{formatCurrency(selectedEnr.total_paid ?? 0, selectedEnr.agreed_currency ?? 'EGP')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-obsidian-300">{translate("المتبقي المطلوب:")}</span>
              <span className="text-amber-400 font-num font-semibold">{formatCurrency(selectedEnr.remaining_balance ?? 0, selectedEnr.agreed_currency ?? 'EGP')}</span>
            </div>
          </div>
        )}

        <Select
          label={translate("الخزنة المستلمة")}
          value={cashBoxId}
          onChange={(e) => setCashBoxId(e.target.value)}
          options={cashBoxes.map((b) => ({
            value: b.cash_box_id,
            label: translateTemplate('{name} (الرصيد: {amount})', { name: b.name, amount: formatBalance(selectedEnr?.agreed_currency === 'USD' ? (b.current_balance_usd ?? 0) : b.current_balance, selectedEnr?.agreed_currency ?? 'EGP') }),
          }))}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={translateTemplate('المبلغ ({currency})', { currency: selectedEnr?.agreed_currency ?? 'EGP' })}
            type="number"
            step="0.01"
            min="0.01"
            max={remaining > 0 ? remaining : undefined}
            placeholder="0.00"
            value={amount}
            onChange={(e) => { const v = e.target.value; if (!v.startsWith("-")) setAmount(v); }}
            required
            hint={selectedEnr ? translateTemplate('الحد الأقصى: {amount}', { amount: formatCurrency(remaining, selectedEnr.agreed_currency ?? 'EGP') }) : undefined}
          />
          <Input
            label={translate("تاريخ الدفع")}
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label={translate("طريقة الدفع")}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            options={[
              { value: 'Cash', label: translate("كاش") },
              { value: 'Bank Transfer', label: translate("تحويل بنكي") },
              { value: 'Vodafone Cash', label: translate("فودافون كاش") },
              { value: 'InstaPay', label: translate("إنستاباي") },
            ]}
          />
          <Input
            label={translate("مرجع التحويل الخارجي (اختياري)")}
            placeholder={translate("رقم عملية البنك أو المحفظة")}
            value={receiptRef}
            onChange={(e) => setReceiptRef(e.target.value)}
          />
        </div>

        <Textarea
          label={translate("ملاحظات")}
          rows={2}
          placeholder={translate("أي تفاصيل إضافية...")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <FormActions>
          <button type="button" onClick={onClose} className="btn-secondary">{translate("إلغاء")}</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? translate("جاري التسجيل...") : translate("تسجيل الدفعة")}
          </button>
        </FormActions>
      </form>
    </Modal>
  );
}
