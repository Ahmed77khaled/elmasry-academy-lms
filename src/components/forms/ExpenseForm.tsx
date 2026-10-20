import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea, FormActions } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Alert';
import { formatEGP, todayISO } from '@/lib/format';
import type { CashBoxBalance, Course } from '@/types/database';

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ExpenseForm({ open, onClose, onSaved }: ExpenseFormProps) {
  const [cashBoxes, setCashBoxes] = useState<CashBoxBalance[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [cashBoxId, setCashBoxId] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayISO());
  const [category, setCategory] = useState('Other');
  const [courseId, setCourseId] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBox = cashBoxes.find((b) => b.cash_box_id === cashBoxId);
  const enteredAmount = parseFloat(amount) || 0;
  const projectedBalance = selectedBox ? selectedBox.current_balance - enteredAmount : 0;
  const showWarning = selectedBox && enteredAmount > 0 && projectedBalance < 0;

  useEffect(() => {
    if (open) {
      setError(null);
      setAmount('');
      setDescription('');
      setNotes('');
      setCourseId('');
      setExpenseDate(todayISO());
      setCategory('Other');
      Promise.all([
        supabase.from('cash_box_balances').select('*').eq('is_active', true).order('name'),
        supabase.from('courses').select('*').order('course_name'),
      ]).then(([boxRes, courseRes]) => {
        setCashBoxes(boxRes.data ?? []);
        setCourses(courseRes.data ?? []);
        if (boxRes.data && boxRes.data.length > 0) setCashBoxId(boxRes.data[0].cash_box_id);
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashBoxId) { setError('يرجى اختيار الخزنة'); return; }
    if (enteredAmount <= 0) { setError('المبلغ يجب أن يكون أكبر من صفر'); return; }

    setSaving(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('record_expense', {
      p_cash_box_id: cashBoxId,
      p_amount: enteredAmount,
      p_expense_date: expenseDate,
      p_category: category,
      p_course_id: courseId || null,
      p_description: description.trim() || null,
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
    <Modal open={open} onClose={onClose} title="تسجيل مصروف جديد" subtitle="أدخل تفاصيل المصروف">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Select
          label="الخزنة (مصدر الأموال)"
          value={cashBoxId}
          onChange={(e) => setCashBoxId(e.target.value)}
          options={[
            { value: '', label: '-- اختر الخزنة --' },
            ...cashBoxes.map((b) => ({
              value: b.cash_box_id,
              label: `${b.name} (الرصيد: ${formatEGP(b.current_balance)})`,
            })),
          ]}
        />

        <Input
          label="المبلغ (ج.م)"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {showWarning && (
          <Alert variant="warning">
            تنبيه: هذا المصروف يتجاوز رصيد الخزنة الحالي وسيؤدي إلى رصيد سالب بقيمة {formatEGP(Math.abs(projectedBalance))}
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label="تاريخ المصروف" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
          <Select
            label="التصنيف"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: 'Rent', label: 'إيجار' },
              { value: 'Salary', label: 'مرتبات ومكافآت' },
              { value: 'Supplies', label: 'أدوات وبوفيه' },
              { value: 'Hardware', label: 'أجهزة وشبكات' },
              { value: 'Marketing', label: 'إعلانات ودعاية' },
              { value: 'Utilities', label: 'كهرباء ومياه وإنترنت' },
              { value: 'Other', label: 'أخرى' },
            ]}
          />
        </div>

        <Select
          label="كورس مرتبط (اختياري)"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          options={[
            { value: '', label: 'عام للسنتر' },
            ...courses.map((c) => ({ value: c.course_id, label: c.course_name })),
          ]}
        />

        <Input label="الوصف" placeholder="وصف المصروف" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Textarea label="ملاحظات" rows={2} placeholder="ملاحظات إضافية" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <FormActions>
          <button type="button" onClick={onClose} className="btn-secondary">إلغاء</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'جاري التسجيل...' : 'تسجيل المصروف'}
          </button>
        </FormActions>
      </form>
    </Modal>
  );
}
