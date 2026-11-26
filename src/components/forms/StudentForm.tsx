import { translate, translateTemplate } from '@/lib/translations';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea, FormActions } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Alert';
import type { Student } from '@/types/database';
import { COUNTRIES, getGovernoratesForCountry } from '@/lib/geoData';

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
    country: '',
    governorate: '',
    workplace: '',
    study_year: '',
    previous_courses: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canManageEmail, setCanManageEmail] = useState(false);
  const [canManagePhone, setCanManagePhone] = useState(false);
  const [duplicatePhoneMatch, setDuplicatePhoneMatch] = useState<{ student_id: string; name: string } | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setDuplicatePhoneMatch(null);
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
          country: student.country ?? 'مصر',
          governorate: student.governorate ?? '',
          workplace: student.workplace ?? '',
          study_year: student.study_year ?? '',
          previous_courses: student.previous_courses ?? '',
          notes: student.notes ?? '',
        });
      } else {
        setForm({
          name: '', phone: '', email: '', employment_status: 'Unemployed',
          grad_status: 'Undergrad', grad_college: '', country: 'مصر', governorate: '', workplace: '', study_year: '', previous_courses: '', notes: '',
        });
      }
    }
  }, [open, student]);

  const availableGovernorates = useMemo(() => {
    return getGovernoratesForCountry(form.country || 'مصر');
  }, [form.country]);

  useEffect(() => {
    if (!open || !canManagePhone) {
      setDuplicatePhoneMatch(null);
      return;
    }

    const trimmedPhone = form.phone.trim();
    const normalizedInput = trimmedPhone.replace(/\D/g, '');
    if (normalizedInput.length < 8) {
      setDuplicatePhoneMatch(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void supabase
        .rpc('rbac_list_students_v2', { p_search: trimmedPhone, p_limit: 5, p_offset: 0 })
        .then(({ data, error: lookupError }) => {
          if (cancelled || lookupError || !Array.isArray(data)) return;
          const match = (data as Student[]).find((row) => {
            if (student && row.student_id === student.student_id) return false;
            return (row.phone ?? '').replace(/\D/g, '') === normalizedInput;
          });
          setDuplicatePhoneMatch(match ? { student_id: match.student_id, name: match.name } : null);
        }, () => {
          if (!cancelled) setDuplicatePhoneMatch(null);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, canManagePhone, form.phone, student]);

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
      p_grad_college: (form.grad_status === 'Graduate' || form.employment_status === 'Student') ? form.grad_college.trim() || null : null,
      p_previous_courses: form.previous_courses.trim() || null,
      p_notes: form.notes.trim() || null,
      p_country: form.country.trim() || null,
      p_governorate: form.governorate.trim() || null,
      p_workplace: form.employment_status === 'Employed' || form.employment_status === 'Freelancer' ? form.workplace.trim() || null : null,
      p_study_year: form.employment_status === 'Student' ? form.study_year.trim() || null : null,
    };

    try {
      if (student) {
        const { error: err } = await supabase.rpc('rbac_update_student_v2', {
          p_student_id: student.student_id,
          ...payload,
        });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.rpc('rbac_create_student_v2', payload);
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
        {duplicatePhoneMatch && (
          <Alert variant="warning">
            {translateTemplate('رقم الهاتف مستخدم بالفعل لطالب آخر ({name}). تأكد قبل الإضافة لتجنب التكرار.', {
              name: duplicatePhoneMatch.name,
            })}
          </Alert>
        )}
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
        <div className="grid grid-cols-2 gap-4">
          <Select
            label={translate("الدولة")}
            value={form.country || 'مصر'}
            onChange={(e) => {
              const newCountry = e.target.value;
              setForm({
                ...form,
                country: newCountry,
                governorate: newCountry === 'مصر' ? form.governorate : '',
              });
            }}
            options={COUNTRIES.map((c) => ({ value: c.name, label: c.name }))}
          />
          {availableGovernorates.length > 0 ? (
            <Select
              label={translate("المحافظة")}
              value={form.governorate}
              onChange={(e) => setForm({ ...form, governorate: e.target.value })}
              options={[
                { value: '', label: translate("-- اختر المحافظة --") },
                ...availableGovernorates.map((gov) => ({ value: gov, label: gov })),
              ]}
            />
          ) : (
            <Input
              label={translate("المحافظة / المدينة (اختياري)")}
              placeholder={translate("مثال: المدينة أو المنطقة")}
              value={form.governorate}
              onChange={(e) => setForm({ ...form, governorate: e.target.value })}
            />
          )}
        </div>
        {(form.employment_status === 'Employed' || form.employment_status === 'Freelancer') && (
          <Input label={translate("جهة العمل أو المسمى الوظيفي")} placeholder={translate("اسم جهة العمل أو المسمى الوظيفي")} value={form.workplace} onChange={(e) => setForm({ ...form, workplace: e.target.value })} />
        )}
        {form.employment_status === 'Student' && (
          <Input label={translate("السنة الدراسية")} placeholder={translate("مثال: السنة الثالثة")} value={form.study_year} onChange={(e) => setForm({ ...form, study_year: e.target.value })} />
        )}
        {(form.grad_status === 'Graduate' || form.employment_status === 'Student') && (
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
