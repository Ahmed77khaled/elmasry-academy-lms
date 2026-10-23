import { translate } from '@/lib/translations';
import { translateTemplate } from '@/lib/translations';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea, FormActions } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Alert';
import { formatEGP, todayISO } from '@/lib/format';
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
      setSelectedEnrollment(preselectedEnrollmentId ?? '');
      setPaymentDate(todayISO());
      setMethod('Cash');
      Promise.all([
        supabase.rpc('rbac_list_enrollments', { p_search: null, p_limit: 500, p_offset: 0 }),
        supabase.rpc('rbac_list_cash_boxes'),
      ]).then(([enrRes, boxRes]) => {
        const enrollmentRows = (enrRes.data ?? []) as EnrollmentBalance[];
        setEnrollments(enrollmentRows.filter((enrollment) => enrollment.enrollment_status === 'Active'));
        const activeBoxes = ((boxRes.data ?? []) as CashBoxBalance[]).filter((box) => box.is_active);
        setCashBoxes(activeBoxes);
        if (activeBoxes.length > 0) {
          setCashBoxId(activeBoxes[0].cash_box_id);
        }
      });
    }
  }, [open, preselectedEnrollmentId]);

  const selectedEnr = enrollments.find((e) => e.enrollment_id === selectedEnrollment);
  const remaining = selectedEnr?.remaining_balance ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) { setError(translate("يرجى اختيار الاشتراك")); return; }
    if (!cashBoxId) { setError(translate("يرجى اختيار الخزنة")); return; }
    if (!amount || parseFloat(amount) <= 0) { setError(translate("المبلغ يجب أن يكون أكبر من صفر")); return; }

    setSaving(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc('rbac_record_payment', {
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

        <Select
          label={translate("الاشتراك")}
          value={selectedEnrollment}
          onChange={(e) => setSelectedEnrollment(e.target.value)}
          options={[
            { value: '', label: translate("-- اختر الاشتراك --") },
            ...enrollments.map((e) => ({
              value: e.enrollment_id,
              label: translateTemplate('{student} — {course} (المتبقي: {amount})', { student: e.student_name, course: e.course_name, amount: formatEGP(e.remaining_balance ?? 0) }),
            })),
          ]}
          required
        />

        {selectedEnr && (
          <div className="bg-obsidian-700/60 rounded-lg p-3 border border-obsidian-500/30 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-obsidian-300">{translate("المبلغ المتفق عليه:")}</span>
              <span className="text-white font-num font-semibold">{formatEGP(selectedEnr.agreed_cost ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-obsidian-300">{translate("إجمالي المدفوع سابقاً:")}</span>
              <span className="text-emerald-light font-num font-semibold">{formatEGP(selectedEnr.total_paid ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-obsidian-300">{translate("المتبقي المطلوب:")}</span>
              <span className="text-amber-400 font-num font-semibold">{formatEGP(selectedEnr.remaining_balance ?? 0)}</span>
            </div>
          </div>
        )}

        <Select
          label={translate("الخزنة المستلمة")}
          value={cashBoxId}
          onChange={(e) => setCashBoxId(e.target.value)}
          options={cashBoxes.map((b) => ({
            value: b.cash_box_id,
            label: translateTemplate('{name} (الرصيد: {amount})', { name: b.name, amount: formatEGP(b.current_balance) }),
          }))}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={translate("المبلغ (ج.م)")}
            type="number"
            step="0.01"
            min="0.01"
            max={remaining > 0 ? remaining : undefined}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            hint={selectedEnr ? translateTemplate('الحد الأقصى: {amount}', { amount: formatEGP(remaining) }) : undefined}
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
