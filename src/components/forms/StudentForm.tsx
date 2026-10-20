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

  useEffect(() => {
    if (open) {
      setError(null);
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
      setError('اسم الطالب مطلوب');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      employment_status: form.employment_status,
      grad_status: form.grad_status,
      grad_college: form.grad_status === 'Graduate' ? form.grad_college.trim() || null : null,
      previous_courses: form.previous_courses.trim() || null,
      notes: form.notes.trim() || null,
    };

    try {
      if (student) {
        const { error: err } = await supabase.from('students').update(payload).eq('student_id', student.student_id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('students').insert(payload);
        if (err) throw err;
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={student ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'} subtitle="أدخل البيانات الأساسية للطالب">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Input label="اسم الطالب" placeholder="الاسم الكامل" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="رقم الهاتف" placeholder="01xxxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="البريد الإلكتروني" type="email" placeholder="example@mail.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="الحالة الوظيفية"
            value={form.employment_status}
            onChange={(e) => setForm({ ...form, employment_status: e.target.value })}
            options={[
              { value: 'Employed', label: 'يعمل' },
              { value: 'Unemployed', label: 'لا يعمل' },
              { value: 'Student', label: 'طالب' },
              { value: 'Freelancer', label: 'مستقل' },
            ]}
          />
          <Select
            label="حالة التخرج"
            value={form.grad_status}
            onChange={(e) => setForm({ ...form, grad_status: e.target.value })}
            options={[
              { value: 'Graduate', label: 'خريج' },
              { value: 'Undergrad', label: 'جامعي' },
            ]}
          />
        </div>
        {form.grad_status === 'Graduate' && (
          <Input label="الكلية" placeholder="اسم الكلية / الجامعة" value={form.grad_college} onChange={(e) => setForm({ ...form, grad_college: e.target.value })} />
        )}
        <Textarea label="كورسات سابقة" rows={2} placeholder="الكورسات التي درسها الطالب سابقاً" value={form.previous_courses} onChange={(e) => setForm({ ...form, previous_courses: e.target.value })} />
        <Textarea label="ملاحظات" rows={2} placeholder="أي ملاحظات إضافية" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <FormActions>
          <button type="button" onClick={onClose} className="btn-secondary">إلغاء</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'جاري الحفظ...' : student ? 'حفظ التعديلات' : 'إضافة الطالب'}
          </button>
        </FormActions>
      </form>
    </Modal>
  );
}
