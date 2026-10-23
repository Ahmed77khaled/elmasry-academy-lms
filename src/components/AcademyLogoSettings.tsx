import { translate } from '@/lib/translations';
import { useRef, useState } from 'react';
import { ImagePlus, RotateCcw, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useBranding } from '@/context/BrandingContext';
import { Alert } from '@/components/ui/Alert';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export function AcademyLogoSettings() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { logoUrl, refreshLogo } = useBranding();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const saveLogo = async (file?: File) => {
    if (!file) return;
    setError(null);
    setNotice(null);
    const extension = MIME_EXTENSIONS[file.type];
    if (!extension) {
      setError(translate("اختر صورة بصيغة PNG أو JPG أو WebP."));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(translate("يجب ألا يتجاوز حجم الصورة 2 ميجابايت."));
      return;
    }

    setBusy(true);
    const path = `branding/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('academy-branding')
      .upload(path, file, { contentType: file.type, upsert: false, cacheControl: '3600' });
    if (uploadError) {
      setError(translate("تعذر رفع الشعار. تأكد من تطبيق إعدادات التخزين ثم حاول مرة أخرى."));
      setBusy(false);
      return;
    }

    const { error: saveError } = await supabase.rpc('set_academy_logo', { p_logo_path: path });
    if (saveError) {
      await supabase.storage.from('academy-branding').remove([path]);
      setError(translate("تعذر حفظ الشعار. تأكد من أنك مالك المنصة وأن إعدادات الشعار مفعّلة."));
      setBusy(false);
      return;
    }

    await refreshLogo();
    setNotice(translate("تم تحديث شعار الأكاديمية."));
    setBusy(false);
  };

  const removeLogo = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const { data: oldPath } = await supabase.rpc('get_academy_logo');
    const { error: saveError } = await supabase.rpc('set_academy_logo', { p_logo_path: null });
    if (saveError) {
      setError(translate("تعذر إزالة الشعار. حاول مرة أخرى."));
      setBusy(false);
      return;
    }
    await refreshLogo();
    if (typeof oldPath === 'string' && oldPath.startsWith('branding/')) {
      await supabase.storage.from('academy-branding').remove([oldPath]);
    }
    setNotice(translate("تمت إزالة الشعار والعودة إلى الرمز الافتراضي."));
    setBusy(false);
  };

  return (
    <section className="card-surface p-5 space-y-4">
      <div>
        <h3 className="text-white font-bold text-base">{translate("شعار الأكاديمية")}</h3>
        <p className="text-obsidian-300 text-sm mt-1">{translate("يظهر الشعار في صفحة الدخول والقائمة الرئيسية. تغيير الشعار متاح لمالك المنصة فقط.")}</p>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-brand to-emerald-dark flex items-center justify-center overflow-hidden">
          {logoUrl
            ? <img src={logoUrl} alt={translate("الشعار الحالي")} className="w-full h-full object-contain" />
            : <span className="text-white text-3xl font-bold">{translate("م")}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = '';
              void saveLogo(file);
            }}
          />
          <button type="button" className="btn-primary flex items-center gap-2" disabled={busy} onClick={() => inputRef.current?.click()}>
            {logoUrl ? <Upload size={16} /> : <ImagePlus size={16} />}
            {busy ? translate("جارٍ حفظ الشعار…") : logoUrl ? translate("تغيير الشعار") : translate("رفع شعار")}
          </button>
          {logoUrl && (
            <button type="button" className="btn-secondary flex items-center gap-2" disabled={busy} onClick={() => void removeLogo()}>
              <RotateCcw size={16} /> {translate("استعادة الرمز الافتراضي")}</button>
          )}
        </div>
      </div>
      <p className="text-obsidian-400 text-xs">{translate("الصيغ المدعومة: PNG وJPG وWebP، بحد أقصى 2 ميجابايت.")}</p>
    </section>
  );
}
