import { translate } from '@/lib/translations';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea, FormActions } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Alert';
import type { Course } from '@/types/database';

interface CourseFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  course?: Course | null;
}

export function CourseForm({ open, onClose, onSaved, course }: CourseFormProps) {
  const [form, setForm] = useState({
    course_name: '',
    default_cost: '',
    availability_status: 'Upcoming',
    level: 'Beginner',
    duration_weeks: '4',
    max_students: '',
    prerequisite_courses: '',
    description: '',
    link_whatsapp: '',
    link_tasks: '',
    link_drive: '',
    link_sources: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canEditPrice, setCanEditPrice] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      void supabase.rpc('get_my_authorization').then(({ data, error: authError }) => {
        const authorization = Array.isArray(data) ? data[0] : data;
        const permissions = Array.isArray(authorization?.permissions) ? authorization.permissions : [];
        setCanEditPrice(!authError && permissions.includes('courses.pricing.update'));
      }, () => setCanEditPrice(false));
      if (course) {
        setForm({
          course_name: course.course_name,
          default_cost: course.default_cost == null ? '' : String(course.default_cost),
          availability_status: course.availability_status,
          level: course.level ?? 'Beginner',
          duration_weeks: course.duration_weeks ? String(course.duration_weeks) : '4',
          max_students: course.max_students ? String(course.max_students) : '',
          prerequisite_courses: course.prerequisite_courses ?? '',
          description: course.description ?? '',
          link_whatsapp: course.link_whatsapp ?? '',
          link_tasks: course.link_tasks ?? '',
          link_drive: course.link_drive ?? '',
          link_sources: course.link_sources ?? '',
        });
      } else {
        setForm({
          course_name: '', default_cost: '', availability_status: 'Upcoming', level: 'Beginner',
          duration_weeks: '4', max_students: '', prerequisite_courses: '', description: '',
          link_whatsapp: '', link_tasks: '', link_drive: '', link_sources: '',
        });
      }
    }
  }, [open, course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.course_name.trim()) {
      setError(translate("اسم الكورس مطلوب"));
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      p_course_name: form.course_name.trim(),
      p_description: form.description.trim() || null,
      p_level: form.level,
      p_duration_weeks: parseInt(form.duration_weeks) || 4,
      p_prerequisite_courses: form.prerequisite_courses.trim() || null,
      p_start_date: course?.start_date ?? null,
      p_end_date: course?.end_date ?? null,
      p_max_students: form.max_students ? parseInt(form.max_students) : null,
      p_default_cost: canEditPrice && form.default_cost ? parseFloat(form.default_cost) : null,
      p_availability_status: form.availability_status,
      p_link_whatsapp: form.link_whatsapp.trim() || null,
      p_link_tasks: form.link_tasks.trim() || null,
      p_link_drive: form.link_drive.trim() || null,
      p_link_sources: form.link_sources.trim() || null,
    };

    try {
      if (course) {
        const { error: err } = await supabase.rpc('rbac_update_course', {
          p_course_id: course.course_id,
          ...payload,
        });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.rpc('rbac_create_course', payload);
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
    <Modal open={open} onClose={onClose} title={course ? translate("تعديل الكورس") : translate("إنشاء كورس جديد")} subtitle={translate("أدخل تفاصيل الكورس والموارد")} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Input label={translate("اسم الكورس")} placeholder={translate("اسم الكورس التدريبي")} required value={form.course_name} onChange={(e) => setForm({ ...form, course_name: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          {canEditPrice && <Input label={translate("التكلفة الافتراضية (ج.م)")} type="number" step="0.01" placeholder="1500" value={form.default_cost} onChange={(e) => setForm({ ...form, default_cost: e.target.value })} />}
          <Input label={translate("المدة (أسابيع)")} type="number" placeholder="4" value={form.duration_weeks} onChange={(e) => setForm({ ...form, duration_weeks: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Select
            label={translate("الحالة")}
            value={form.availability_status}
            onChange={(e) => setForm({ ...form, availability_status: e.target.value })}
            options={[
              { value: 'Upcoming', label: translate("قادم") },
              { value: 'Active', label: translate("نشط") },
              { value: 'Closed', label: translate("مغلق") },
            ]}
          />
          <Select
            label={translate("المستوى")}
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            options={[
              { value: 'Beginner', label: translate("مبتدئ") },
              { value: 'Intermediate', label: translate("متوسط") },
              { value: 'Advanced', label: translate("متقدم") },
            ]}
          />
          <Input label={translate("السعة (اتركه فارغاً = غير محدود)")} type="number" placeholder="30" value={form.max_students} onChange={(e) => setForm({ ...form, max_students: e.target.value })} />
        </div>
        <Textarea label={translate("المتطلبات السابقة")} rows={2} placeholder={translate("الكورسات المطلوبة قبل هذا الكورس")} value={form.prerequisite_courses} onChange={(e) => setForm({ ...form, prerequisite_courses: e.target.value })} />
        <Textarea label={translate("الوصف")} rows={2} placeholder={translate("وصف مختصر للكورس")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label={translate("رابط جروب واتساب")} placeholder="https://..." value={form.link_whatsapp} onChange={(e) => setForm({ ...form, link_whatsapp: e.target.value })} />
          <Input label={translate("رابط منصة المهام")} placeholder="https://..." value={form.link_tasks} onChange={(e) => setForm({ ...form, link_tasks: e.target.value })} />
          <Input label={translate("رابط جوجل درايف")} placeholder="https://..." value={form.link_drive} onChange={(e) => setForm({ ...form, link_drive: e.target.value })} />
          <Input label={translate("رابط المصادر")} placeholder="https://..." value={form.link_sources} onChange={(e) => setForm({ ...form, link_sources: e.target.value })} />
        </div>
        <FormActions>
          <button type="button" onClick={onClose} className="btn-secondary">{translate("إلغاء")}</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? translate("جاري الحفظ...") : course ? translate("حفظ التعديلات") : translate("إنشاء الكورس")}
          </button>
        </FormActions>
      </form>
    </Modal>
  );
}
