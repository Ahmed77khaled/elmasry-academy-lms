import { translate } from '@/lib/translations';
import { translateTemplate } from '@/lib/translations';
import { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { ImagePlus, RotateCcw, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getAdminDisplayName } from '@/lib/adminLabels';
import { Alert } from '@/components/ui/Alert';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

function getAvatarPath(user: User | null): string | null {
  if (!user) return null;
  const path = user.user_metadata?.avatar_path;
  return typeof path === 'string' && path.startsWith(`avatars/${user.id}/`) ? path : null;
}

export function AdminAvatar({ user, className }: { user: User | null; className: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const path = getAvatarPath(user);
  const initial = getAdminDisplayName(user).trim().charAt(0).toUpperCase() || translate("م");

  useEffect(() => {
    let active = true;
    setUrl(null);
    if (!path) return () => { active = false; };
    void supabase.storage.from('admin-avatars').createSignedUrl(path, 60 * 60)
      .then(({ data, error }) => {
        if (active) setUrl(!error ? data?.signedUrl ?? null : null);
      })
      .catch(() => {
        if (active) setUrl(null);
      });
    return () => { active = false; };
  }, [path]);

  if (!url || failedUrl === url) {
    return <span className={className}>{initial}</span>;
  }
  return <img src={url} alt={translateTemplate('الصورة الشخصية لـ {name}', { name: getAdminDisplayName(user) })} className={className} onError={() => setFailedUrl(url)} />;
}

export function AdminAvatarSettings({ user }: { user: User | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const path = getAvatarPath(user);

  const saveAvatar = async (file?: File) => {
    if (!file || !user) return;
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
    const newPath = `avatars/${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('admin-avatars').upload(newPath, file, {
      contentType: file.type,
      upsert: false,
      cacheControl: '3600',
    });
    if (uploadError) {
      setError(translate("تعذر رفع الصورة. تأكد من تطبيق إعدادات التخزين ثم حاول مرة أخرى."));
      setBusy(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_path: newPath } });
    if (updateError) {
      await supabase.storage.from('admin-avatars').remove([newPath]);
      setError(translate("تعذر حفظ الصورة في الحساب. حاول مرة أخرى."));
      setBusy(false);
      return;
    }

    if (path) await supabase.storage.from('admin-avatars').remove([path]);
    setNotice(translate("تم تحديث صورتك الشخصية."));
    setBusy(false);
  };

  const removeAvatar = async () => {
    if (!user || !path) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_path: null } });
    if (updateError) {
      setError(translate("تعذر إزالة الصورة الشخصية. حاول مرة أخرى."));
      setBusy(false);
      return;
    }
    await supabase.storage.from('admin-avatars').remove([path]);
    setNotice(translate("تمت إزالة الصورة الشخصية."));
    setBusy(false);
  };

  return (
    <div className="mt-5 border-t border-obsidian-500/30 pt-4 space-y-3">
      <div>
        <h4 className="text-white font-semibold text-sm">{translate("الصورة الشخصية")}</h4>
        <p className="text-obsidian-300 text-xs mt-1">{translate("تُحفظ الصورة في مخزن خاص، وروابط عرضها مؤقتة. الحد الأقصى للحجم 2 ميجابايت.")}</p>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = '';
            void saveAvatar(file);
          }}
        />
        <button type="button" className="btn-secondary flex items-center gap-2" disabled={busy} onClick={() => inputRef.current?.click()}>
          {path ? <Upload size={16} /> : <ImagePlus size={16} />}
          {busy ? translate("جارٍ حفظ الصورة…") : path ? translate("تغيير الصورة") : translate("إضافة صورة شخصية")}
        </button>
        {path && (
          <button type="button" className="btn-secondary flex items-center gap-2" disabled={busy} onClick={() => void removeAvatar()}>
            <RotateCcw size={16} /> {translate("إزالة الصورة")}</button>
        )}
      </div>
    </div>
  );
}
