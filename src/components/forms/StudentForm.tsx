import { translate } from '@/lib/translations';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea, FormActions } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Alert';
import type { Student } from '@/types/database';

interface StudentFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  student?: Student | null;
}

export function StudentForm({ open, onClose, onSaved, student }: StudentFormProps) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    employment_status: 'Unemployed',
    grad_status: 'Undergrad',
    grad_college: '',
    previous_courses: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canManageEmail, setCanManageEmail] = useState(false);
  const [canManagePhone, setCanManagePhone] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      void supabase.rpc('get_my_authorization').then(({ data, error: authError }) => {
        const authorization = Array.isArray(data) ? data[0] : data;
        const permissions = Array.isArray(authorization?.permissions) ? authorization.permissions : [];
        setCanManageEmail(!authError && permissions.includes('students.email.update'));
        setCanManagePhone(!authError && permissions.includes('students.read_contact_phone'));
      }, () => {
        setCanManageEmail(false);
        setCanManagePhone(false);
      });
      if (student) {
        setForm({
          name: student.name,
          phone: student.phone ?? '',
          email: student.email ?? '',
          employment_status: student.employment_status ?? 'Unemployed',
          grad_status: student.grad_status ?? 'Undergrad',
          grad_college: student.grad_college ?? '',
          previous_courses: student.previous_courses ?? '',
          notes: student.notes ?? '',
        });
      } else {
        setForm({
          name: '', phone: '', email: '', employment_status: 'Unemployed',
          grad_status: 'Undergrad', grad_college: '', previous_courses: '', notes: '',
        });
      }
    }
  }, [open, student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(translate("اسم الطالب مطلوب"));
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      p_name: form.name.trim(),
      p_phone: canManagePhone ? form.phone.trim() || null : null,
      p_email: canManageEmail ? form.email.trim() || null : null,
      p_employment_status: form.employment_status,
      p_grad_status: form.grad_status,
      p_grad_college: form.grad_status === 'Graduate' ? form.grad_college.trim() || null : null,
      p_previous_courses: form.previous_courses.trim() || null,
      p_notes: form.notes.trim() || null,
    };

    try {
      if (student) {
        const { error: err } = await supabase.rpc('rbac_update_student', {
          p_student_id: student.student_id,
          ...payload,
        });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.rpc('rbac_create_student', payload);
        if (err) throw err;
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : translate("حدث خطأ أثناء الحفظ"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={student ? translate("تعديل بيانات الطالب") : translate("إضافة طالب جديد")} subtitle={translate("أدخل البيانات الأساسية للطالب")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Input label={translate("اسم الطالب")} placeholder={translate("الاسم الكامل")} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          {canManagePhone && <Input label={translate("رقم الهاتف")} placeholder="01xxxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />}
          {canManageEmail && <Input label={translate("البريد الإلكتروني")} type="email" placeholder="example@mail.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label={translate("الحالة الوظيفية")}
            value={form.employment_status}
            onChange={(e) => setForm({ ...form, employment_status: e.target.value })}
            options={[
              { value: 'Employed', label: translate("يعمل") },
              { value: 'Unemployed', label: translate("لا يعمل") },
              { value: 'Student', label: translate("طالب") },
              { value: 'Freelancer', label: translate("مستقل") },
            ]}
          />
          <Select
            label={translate("حالة التخرج")}
            value={form.grad_status}
            onChange={(e) => setForm({ ...form, grad_status: e.target.value })}
            options={[
              { value: 'Graduate', label: translate("خريج") },
              { value: 'Undergrad', label: translate("جامعي") },
            ]}
          />
        </div>
        {form.grad_status === 'Graduate' && (
          <Input label={translate("الكلية")} placeholder={translate("اسم الكلية / الجامعة")} value={form.grad_college} onChange={(e) => setForm({ ...form, grad_college: e.target.value })} />
        )}
        <Textarea label={translate("كورسات سابقة")} rows={2} placeholder={translate("الكورسات التي درسها الطالب سابقاً")} value={form.previous_courses} onChange={(e) => setForm({ ...form, previous_courses: e.target.value })} />
        <Textarea label={translate("ملاحظات")} rows={2} placeholder={translate("أي ملاحظات إضافية")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <FormActions>
          <button type="button" onClick={onClose} className="btn-secondary">{translate("إلغاء")}</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? translate("جاري الحفظ...") : student ? translate("حفظ التعديلات") : translate("إضافة الطالب")}
          </button>
        </FormActions>
      </form>
    </Modal>
  );
}
