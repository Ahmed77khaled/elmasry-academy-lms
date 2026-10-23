import { translate } from '@/lib/translations';
import { translateTemplate } from '@/lib/translations';
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
  const [owner, setOwner] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setBoxType('Main');
      setOwner('');
      setOpeningBalance('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError(translate("اسم الخزنة مطلوب")); return; }
    setSaving(true);
    setError(null);

    const trimmedBalance = openingBalance.trim();
    let parsedBalance = 0;

    if (trimmedBalance !== '') {
      // Strict numeric check: non-negative digits only, optional decimal point with at most 2 digits
      if (!/^\d+(\.\d{1,2})?$/.test(trimmedBalance)) {
        setError(translate("الرصيد الافتتاحي يجب أن يكون رقماً موجباً أو صفراً (بحد أقصى خانتين عشريتين)"));
        setSaving(false);
        return;
      }
      parsedBalance = Number(trimmedBalance);
      if (isNaN(parsedBalance) || !Number.isFinite(parsedBalance) || parsedBalance < 0) {
        setError(translate("الرصيد الافتتاحي يجب أن يكون رقماً موجباً أو صفراً"));
        setSaving(false);
        return;
      }
    }

    if (parsedBalance > 99999999.99) {
      setError(translate("الرصيد الافتتاحي يتجاوز الحد الأقصى المسموح به (99,999,999.99)"));
      setSaving(false);
      return;
    }

    try {
      // Audited RPC create_cash_box only (strictly no fallback to direct INSERT)
      const { error: rpcErr } = await supabase.rpc('rbac_create_cash_box', {
        p_name: name.trim(),
        p_type: boxType,
        p_owner: owner.trim() || null,
        p_opening_balance: parsedBalance,
        p_notes: null,
      });

      if (rpcErr) {
        const isDenied = rpcErr.code === '42501' || rpcErr.message?.includes('42501') || /access denied/i.test(rpcErr.message ?? '');
        const msg = isDenied
          ? translate("غير مصرح: يتطلب صلاحيات مدير نظام لإنشاء خزنة جديدة")
          : (rpcErr.message || translate("فشل في إنشاء الخزنة"));
        setError(msg);
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError(translate("تعذر الاتصال بالخادم لإتمام العملية. تحقق من اتصالك وحاول مرة أخرى."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={translate("إنشاء خزنة جديدة")} subtitle={translate("أدخل بيانات الخزنة")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Input label={translate("اسم الخزنة")} placeholder={translate("اسم الخزنة")} required value={name} onChange={(e) => setName(e.target.value)} />
        <Select
          label={translate("النوع")}
          value={boxType}
          onChange={(e) => setBoxType(e.target.value)}
          options={[
            { value: 'Main', label: translate("خزنة رئيسية") },
            { value: 'Branch', label: translate("فرع") },
            { value: 'Online', label: translate("أونلاين") },
            { value: 'Bank', label: translate("بنك") },
            { value: 'Petty Cash', label: translate("خزنة فرعية (Petty Cash)") },
          ]}
        />
        <Input label={translate("مسؤول الخزنة")} placeholder={translate("اسم المسؤول عن الخزنة")} value={owner} onChange={(e) => setOwner(e.target.value)} />
        <Input label={translate("رصيد الافتتاح (ج.م)")} type="number" step="0.01" min="0" max="99999999.99" placeholder="0.00" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
        <FormActions>
          <button type="button" onClick={onClose} className="btn-secondary">{translate("إلغاء")}</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? translate("جاري الحفظ...") : translate("إنشاء الخزنة")}
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
    if (!fromBoxId) { setError(translate("يرجى اختيار الخزنة التي سيتم التحويل منها.")); return; }
    if (!toBoxId) { setError(translate("يرجى اختيار الخزنة التي سيتم التحويل إليها.")); return; }
    if (fromBoxId === toBoxId) { setError(translate("لا يمكن التحويل من الخزنة نفسها وإليها.")); return; }
    if (enteredAmount <= 0) { setError(translate("المبلغ يجب أن يكون أكبر من صفر")); return; }

    setSaving(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc('rbac_transfer_between_boxes', {
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
    <Modal open={open} onClose={onClose} title={translate("تحويل أموال بين الخزن")} subtitle={translate("انقل مبلغاً من خزنة إلى أخرى.")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Select
          label={translate("من خزنة")}
          value={fromBoxId}
          onChange={(e) => setFromBoxId(e.target.value)}
          options={[
            { value: '', label: translate("-- اختر خزنة --") },
            ...cashBoxes.map((b) => ({
              value: b.cash_box_id,
              label: translateTemplate('{name} (الرصيد: {amount})', { name: b.name, amount: formatEGP(b.current_balance) }),
            })),
          ]}
        />

        <Select
          label={translate("إلى خزنة")}
          value={toBoxId}
          onChange={(e) => setToBoxId(e.target.value)}
          options={[
            { value: '', label: translate("-- اختر خزنة --") },
            ...cashBoxes.filter((b) => b.cash_box_id !== fromBoxId).map((b) => ({
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
            {translate("تحذير: هذا التحويل سيجعل رصيد الخزنة سالباً بقيمة")}{' '}{formatEGP(Math.abs(projectedBalance))}
          </Alert>
        )}

        <Input label={translate("تاريخ التحويل")} type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />

        <Input label={translate("ملاحظات")} placeholder={translate("ملاحظات إضافية")} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <FormActions>
          <button type="button" onClick={onClose} className="btn-secondary">{translate("إلغاء")}</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? translate("جاري التحويل...") : translate("تحويل")}
          </button>
        </FormActions>
      </form>
    </Modal>
  );
}
