import { translate } from '@/lib/translations';
import { translateTemplate } from '@/lib/translations';
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
        supabase.rpc('rbac_list_cash_boxes'),
        supabase.rpc('rbac_list_courses', { p_limit: 500, p_offset: 0 }),
      ]).then(([boxRes, courseRes]) => {
        const activeBoxes = ((boxRes.data ?? []) as CashBoxBalance[]).filter((box) => box.is_active);
        setCashBoxes(activeBoxes);
        setCourses((courseRes.data ?? []) as Course[]);
        if (activeBoxes.length > 0) setCashBoxId(activeBoxes[0].cash_box_id);
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashBoxId) { setError(translate("يرجى اختيار الخزنة")); return; }
    if (enteredAmount <= 0) { setError(translate("المبلغ يجب أن يكون أكبر من صفر")); return; }

    setSaving(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc('rbac_record_expense', {
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
    <Modal open={open} onClose={onClose} title={translate("تسجيل مصروف جديد")} subtitle={translate("أدخل تفاصيل المصروف")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Select
          label={translate("الخزنة (مصدر الأموال)")}
          value={cashBoxId}
          onChange={(e) => setCashBoxId(e.target.value)}
          options={[
            { value: '', label: translate("-- اختر الخزنة --") },
            ...cashBoxes.map((b) => ({
              value: b.cash_box_id,
              label: translateTemplate('{name} (الرصيد: {amount})', { name: b.name, amount: formatEGP(b.current_balance) }),
            })),
          ]}
        />

        <Input
          label={translate("المبلغ (ج.م)")}
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {showWarning && (
          <Alert variant="warning">
            {translateTemplate('تحذير: هذا المصروف يتجاوز رصيد الخزنة الحالي وسيؤدي إلى رصيد سالب بقيمة {amount}', { amount: formatEGP(Math.abs(projectedBalance)) })}
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label={translate("تاريخ المصروف")} type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
          <Select
            label={translate("التصنيف")}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: 'Rent', label: translate("إيجار") },
              { value: 'Salary', label: translate("مرتبات ومكافآت") },
              { value: 'Supplies', label: translate("أدوات وبوفيه") },
              { value: 'Hardware', label: translate("أجهزة وشبكات") },
              { value: 'Marketing', label: translate("إعلانات ودعاية") },
              { value: 'Utilities', label: translate("كهرباء ومياه وإنترنت") },
              { value: 'Other', label: translate("أخرى") },
            ]}
          />
        </div>

        <Select
          label={translate("كورس مرتبط (اختياري)")}
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          options={[
            { value: '', label: translate("عام للسنتر") },
            ...courses.map((c) => ({ value: c.course_id, label: c.course_name })),
          ]}
        />

        <Input label={translate("الوصف")} placeholder={translate("وصف المصروف")} value={description} onChange={(e) => setDescription(e.target.value)} />
        <Textarea label={translate("ملاحظات")} rows={2} placeholder={translate("ملاحظات إضافية")} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <FormActions>
          <button type="button" onClick={onClose} className="btn-secondary">{translate("إلغاء")}</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? translate("جاري التسجيل...") : translate("تسجيل المصروف")}
          </button>
        </FormActions>
      </form>
    </Modal>
  );
}
