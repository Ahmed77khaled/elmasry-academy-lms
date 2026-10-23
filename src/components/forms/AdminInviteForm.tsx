import { translate } from '@/lib/translations';
import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getRoleDisplayName } from '@/lib/adminLabels';

export function AdminInviteForm() {
  const [canInvite, setCanInvite] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [roles, setRoles] = useState<{ role_key: string; display_name: string }[]>([]);
  const [email, setEmail] = useState('');
  const [roleKey, setRoleKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkRole() {
      const { data: authorizationData, error: authorizationError } =
        await supabase.rpc('get_my_authorization');
      const authorization = Array.isArray(authorizationData)
        ? authorizationData[0]
        : authorizationData;
      if (authorizationError || authorization?.is_owner !== true) {
        if (active) setCheckingRole(false);
        return;
      }

      const { data, error: roleError } = await supabase.rpc('rbac_list_assignable_roles');

      if (active) {
        const availableRoles = roleError ? [] : (data ?? []);
        setRoles(availableRoles);
        setRoleKey(availableRoles[0]?.role_key ?? '');
        setCanInvite(!roleError && availableRoles.length > 0);
        setCheckingRole(false);
      }
    }

    void checkRole();
    return () => { active = false; };
  }, []);

  if (checkingRole || !canInvite) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const { data, error: inviteError } = await supabase.functions.invoke<{ message?: string }>('admin-invite', {
        body: { email: email.trim(), roleKey },
      });

      if (inviteError) {
        let responseMessage = inviteError.message;
        if ('context' in inviteError && inviteError.context instanceof Response) {
          try {
            const responseBody = await inviteError.context.clone().json() as { error?: unknown };
            if (typeof responseBody.error === 'string') responseMessage = responseBody.error;
          } catch {
            // Keep the SDK's message when the response body is not JSON.
          }
        }
        throw new Error(responseMessage || translate("تعذر إرسال الدعوة. حاول مرة أخرى."));
      }

      setSuccess(data?.message ?? translate("تم إرسال الدعوة إلى البريد الإلكتروني. سيُعيّن المدير كلمة مروره من الرابط المرسل إليه."));
      setEmail('');
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : translate("تعذر إرسال الدعوة. حاول مرة أخرى."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card-surface p-5">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus size={18} className="text-emerald-light" />
        <h3 className="text-white font-bold text-base">{translate("دعوة مدير جديد")}</h3>
      </div>
      <p className="text-obsidian-300 text-sm mb-4 leading-6">
        {translate("أدخل بريد العمل واختر الدور والصلاحيات المناسبة. سيصل إلى المدير رابط يتيح له تعيين كلمة مروره. إرسال الدعوات متاح لمالك المنصة فقط.")}</p>

      {error && (
        <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 mb-4">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200 mb-4">
          {success}
        </div>
      )}

      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col sm:flex-row gap-3">
        <label className="sr-only" htmlFor="new-admin-email">{translate("البريد الإلكتروني للمدير الجديد")}</label>
        <input
          id="new-admin-email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@academy.com"
          className="input-base flex-1"
          dir="ltr"
        />
        <label className="sr-only" htmlFor="new-admin-role">{translate("دور المدير")}</label>
        <select
          id="new-admin-role"
          required
          value={roleKey}
          onChange={(event) => setRoleKey(event.target.value)}
          className="input-base sm:max-w-56"
        >
          {roles.map((role) => (
            <option key={role.role_key} value={role.role_key}>{getRoleDisplayName(role.role_key, role.display_name)}</option>
          ))}
        </select>
        <button type="submit" disabled={submitting || !email.trim() || !roleKey} className="btn-primary shrink-0">
          {submitting ? translate("جارٍ إرسال الدعوة...") : translate("إرسال دعوة")}
        </button>
      </form>
    </section>
  );
}
