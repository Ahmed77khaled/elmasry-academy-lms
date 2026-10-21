import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, FormActions } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Alert';
import { formatEGP } from '@/lib/format';
import type { CashBoxBalance } from '@/types/database';

interface CashBoxFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function CashBoxForm({ open, onClose, onSaved }: CashBoxFormProps) {
  const [name, setName] = useState('');
  const [boxType, setBoxType] = useState('Main');
  const [owner, setOwner] = useState('م/ أحمد الفلاح');
  const [openingBalance, setOpeningBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setBoxType('Main');
      setOwner('م/ أحمد الفلاح');
      setOpeningBalance('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('اسم الخزنة مطلوب'); return; }
    setSaving(true);
    setError(null);

    const trimmedBalance = openingBalance.trim();
    let parsedBalance = 0;

    if (trimmedBalance !== '') {
      // Strict numeric check: non-negative digits only, optional decimal point with at most 2 digits
      if (!/^\d+(\.\d{1,2})?$/.test(trimmedBalance)) {
        setError('الرصيد الافتتاحي يجب أن يكون رقماً موجباً أو صفراً (بحد أقصى خانتين عشريتين)');
        setSaving(false);
        return;
      }
      parsedBalance = Number(trimmedBalance);
      if (isNaN(parsedBalance) || !Number.isFinite(parsedBalance) || parsedBalance < 0) {
        setError('الرصيد الافتتاحي يجب أن يكون رقماً موجباً أو صفراً');
        setSaving(false);
        return;
      }
    }

    if (parsedBalance > 99999999.99) {
      setError('الرصيد الافتتاحي يتجاوز الحد الأقصى المسموح به (99,999,999.99)');
      setSaving(false);
      return;
    }

    try {
      // Audited RPC create_cash_box only (strictly no fallback to direct INSERT)
      const { error: rpcErr } = await supabase.rpc('create_cash_box', {
        p_name: name.trim(),
        p_type: boxType,
        p_owner: owner.trim() || null,
        p_opening_balance: parsedBalance,
        p_notes: null,
      });

      if (rpcErr) {
        const isDenied = rpcErr.code === '42501' || rpcErr.message?.includes('42501') || /access denied/i.test(rpcErr.message ?? '');
        const msg = isDenied
          ? 'غير مصرح: يتطلب صلاحيات مدير نظام لإنشاء خزنة جديدة'
          : (rpcErr.message || 'فشل في إنشاء الخزنة');
        setError(msg);
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError('تعذر الاتصال بالخادم لإتمام العملية. تحقق من اتصالك وحاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="إنشاء خزنة جديدة" subtitle="أدخل بيانات الخزنة">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Input label="اسم الخزنة" placeholder="اسم الخزنة" required value={name} onChange={(e) => setName(e.target.value)} />
        <Select
          label="النوع"
          value={boxType}
          onChange={(e) => setBoxType(e.target.value)}
          options={[
            { value: 'Main', label: 'خزنة رئيسية' },
            { value: 'Branch', label: 'فرع' },
            { value: 'Online', label: 'أونلاين' },
            { value: 'Bank', label: 'بنك' },
            { value: 'Petty Cash', label: 'خزنة فرعية (Petty Cash)' },
          ]}
        />
        <Input label="المسؤول" placeholder="اسم المسؤول" value={owner} onChange={(e) => setOwner(e.target.value)} />
        <Input label="رصيد الافتتاح (ج.م)" type="number" step="0.01" min="0" max="99999999.99" placeholder="0.00" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
        <FormActions>
          <button type="button" onClick={onClose} className="btn-secondary">إلغاء</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'جاري الحفظ...' : 'إنشاء الخزنة'}
          </button>
        </FormActions>
      </form>
    </Modal>
  );
}

interface TransferFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  cashBoxes: CashBoxBalance[];
}

export function TransferForm({ open, onClose, onSaved, cashBoxes }: TransferFormProps) {
  const [fromBoxId, setFromBoxId] = useState('');
  const [toBoxId, setToBoxId] = useState('');
  const [amount, setAmount] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFromBoxId('');
      setToBoxId('');
      setAmount('');
      setNotes('');
      setTransferDate(new Date().toISOString().split('T')[0]);
      setError(null);
    }
  }, [open]);

  const fromBox = cashBoxes.find((b) => b.cash_box_id === fromBoxId);
  const enteredAmount = parseFloat(amount) || 0;
  const projectedBalance = fromBox ? fromBox.current_balance - enteredAmount : 0;
  const showWarning = fromBox && enteredAmount > 0 && projectedBalance < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromBoxId) { setError('يرجى اختيار الخزنة المصدر'); return; }
    if (!toBoxId) { setError('يرجى اختيار الخزنة الوجهة'); return; }
    if (fromBoxId === toBoxId) { setError('لا يمكن التحويل بين نفس الخزنة'); return; }
    if (enteredAmount <= 0) { setError('المبلغ يجب أن يكون أكبر من صفر'); return; }

    setSaving(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc('transfer_between_boxes', {
      p_from_box_id: fromBoxId,
      p_to_box_id: toBoxId,
      p_amount: enteredAmount,
      p_transfer_date: transferDate,
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
    <Modal open={open} onClose={onClose} title="تحويل أموال بين الخزن" subtitle="حوّل أموالاً من خزنة إلى أخرى">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Select
          label="الخزنة المصدر"
          value={fromBoxId}
          onChange={(e) => setFromBoxId(e.target.value)}
          options={[
            { value: '', label: '-- اختر الخزنة --' },
            ...cashBoxes.map((b) => ({
              value: b.cash_box_id,
              label: `${b.name} (الرصيد: ${formatEGP(b.current_balance)})`,
            })),
          ]}
        />

        <Select
          label="الخزنة الوجهة"
          value={toBoxId}
          onChange={(e) => setToBoxId(e.target.value)}
          options={[
            { value: '', label: '-- اختر الخزنة --' },
            ...cashBoxes.filter((b) => b.cash_box_id !== fromBoxId).map((b) => ({
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
            تحذير: هذا التحويل سيجعل رصيد الخزنة سالباً بقيمة {formatEGP(Math.abs(projectedBalance))}
          </Alert>
        )}

        <Input label="تاريخ التحويل" type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />

        <Input label="ملاحظات" placeholder="ملاحظات إضافية" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <FormActions>
          <button type="button" onClick={onClose} className="btn-secondary">إلغاء</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'جاري التحويل...' : 'تحويل'}
          </button>
        </FormActions>
      </form>
    </Modal>
  );
}
