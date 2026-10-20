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
        supabase.from('enrollment_balances').select('*').eq('enrollment_status', 'Active').order('student_name'),
        supabase.from('cash_box_balances').select('*').eq('is_active', true).order('name'),
      ]).then(([enrRes, boxRes]) => {
        setEnrollments(enrRes.data ?? []);
        setCashBoxes(boxRes.data ?? []);
        if (boxRes.data && boxRes.data.length > 0) {
          setCashBoxId(boxRes.data[0].cash_box_id);
        }
      });
    }
  }, [open, preselectedEnrollmentId]);

  const selectedEnr = enrollments.find((e) => e.enrollment_id === selectedEnrollment);
  const remaining = selectedEnr?.remaining_balance ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) { setError('يرجى اختيار الاشتراك'); return; }
    if (!cashBoxId) { setError('يرجى اختيار الخزنة'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('المبلغ يجب أن يكون أكبر من صفر'); return; }

    setSaving(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc('record_payment', {
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
    <Modal open={open} onClose={onClose} title="تسجيل دفعة جديدة" subtitle="أدخل تفاصيل الدفعة">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Select
          label="الاشتراك"
          value={selectedEnrollment}
          onChange={(e) => setSelectedEnrollment(e.target.value)}
          options={[
            { value: '', label: '-- اختر الاشتراك --' },
            ...enrollments.map((e) => ({
              value: e.enrollment_id,
              label: `${e.student_name} — ${e.course_name} (المتبقي: ${formatEGP(e.remaining_balance)})`,
            })),
          ]}
          required
        />

        {selectedEnr && (
          <div className="bg-obsidian-700/60 rounded-lg p-3 border border-obsidian-500/30 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-obsidian-300">المبلغ المتفق عليه:</span>
              <span className="text-white font-num font-semibold">{formatEGP(selectedEnr.agreed_cost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-obsidian-300">إجمالي المدفوع سابقاً:</span>
              <span className="text-emerald-light font-num font-semibold">{formatEGP(selectedEnr.total_paid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-obsidian-300">المتبقي المطلوب:</span>
              <span className="text-amber-400 font-num font-semibold">{formatEGP(selectedEnr.remaining_balance)}</span>
            </div>
          </div>
        )}

        <Select
          label="الخزنة المستلمة"
          value={cashBoxId}
          onChange={(e) => setCashBoxId(e.target.value)}
          options={cashBoxes.map((b) => ({
            value: b.cash_box_id,
            label: `${b.name} (الرصيد: ${formatEGP(b.current_balance)})`,
          }))}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="المبلغ (ج.م)"
            type="number"
            step="0.01"
            min="0.01"
            max={remaining > 0 ? remaining : undefined}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            hint={selectedEnr ? `الحد الأقصى: ${formatEGP(remaining)}` : undefined}
          />
          <Input
            label="تاريخ الدفع"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="طريقة الدفع"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            options={[
              { value: 'Cash', label: 'كاش' },
              { value: 'Bank Transfer', label: 'تحويل بنكي' },
              { value: 'Vodafone Cash', label: 'فودافون كاش' },
              { value: 'InstaPay', label: 'إنستاباي' },
            ]}
          />
          <Input
            label="مرجع التحويل الخارجي (اختياري)"
            placeholder="رقم عملية البنك أو المحفظة"
            value={receiptRef}
            onChange={(e) => setReceiptRef(e.target.value)}
          />
        </div>

        <Textarea
          label="ملاحظات"
          rows={2}
          placeholder="أي تفاصيل إضافية..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <FormActions>
          <button type="button" onClick={onClose} className="btn-secondary">إلغاء</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
          </button>
        </FormActions>
      </form>
    </Modal>
  );
}
