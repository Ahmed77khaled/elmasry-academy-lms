# Admin invitation deployment checklist

This checklist covers the local `admin-invite` Edge Function and its Settings page caller. It does not authorize deployment, hosted SQL, secret changes, or sending a real invitation.

## Verified status (23 October 2026)

- The Settings page calls `supabase.functions.invoke('admin-invite', ...)`.
- The local function exists at `supabase/functions/admin-invite/index.ts`.
- `admin-invite` is now deployed to TrainerPro as version 1 (`ACTIVE`, `verify_jwt = false`). A read-only Functions list confirmed it alongside `login-alert` and `telegram-group-dispatch`.
- No SQL, hosted secret change, invitation, or email was performed during this review.
- The Auth URL Configuration screenshot showed Site URL `http://localhost:3000` and no allowed Redirect URLs. The owner chose to defer URL changes and invitation testing until the application has a public deployment URL. Do not replace the Site URL with a local address as a permanent setting.

## Preconditions

1. Confirm the intended Supabase project is **TrainerPro**, project ref `urmkcixqpoqkiosihhal`.
2. Verify the live schema read-only before deployment. The function depends on:
   - `public.admins(auth_user_id, role, is_active, is_owner)`
   - `public.admin_roles(role_key, is_assignable)`
   - `public.admin_audit_log(actor_auth_user_id, target_auth_user_id, action, after_state)`
   - `public.get_my_authorization()` returning `is_owner` and `permissions`
3. Confirm the current signed-in owner has `admins.invite` in `get_my_authorization()`.
4. Check Edge Function secret *names* are configured, without reading or displaying values: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (or supported publishable-key configuration), and `SUPABASE_SERVICE_ROLE_KEY` (or supported secret-key configuration). Never put the service-role key in the browser or repository.
5. In Supabase Auth settings, confirm the Site URL and allowed redirect URLs point to the intended deployed app. Configure a production SMTP provider before inviting a real administrator; the default email service may be restricted or unsuitable for production.
6. Confirm the proposed recipient does not already have a Supabase Auth account. The function deliberately rejects existing Auth accounts; it does not add administrator access to an existing account.
7. Resolve the migration-history mismatch before using `supabase db push`. Prior checks found a short remote migration ledger while the live schema already contains RBAC objects. Do not replay the local migration chain or apply old migrations just to make the ledger match.

## Deployment and verification sequence

1. **Completed:** Deploy only `admin-invite` to TrainerPro and confirm it appears as active in the read-only Functions list.
2. **Deferred until the application is deployed:** Set Auth Site URL to the public application URL and add the required public redirect URL patterns. The current screenshot showed a local Site URL (`http://localhost:3000`) and no allowed Redirect URLs; do not use a local address as the permanent URL.
3. **Still required before real invitations:** Verify production SMTP settings.
4. **After deployment and SMTP verification:** The owner selects a new recipient address that has no existing Supabase Auth account, plus the intended assignable role. Sending the invite sends a real email.
5. After the owner submits the invitation, confirm the function returns success and the recipient receives the Auth invitation. Verify the resulting administrator is active, is not an owner, has the selected assignable role, and has an `admin_invited` audit record.
6. If any check fails, stop; do not repeat the invitation blindly. Inspect the response category and Auth state first.

## Security limitation to resolve before treating role permissions as enforced

The live RLS/policy inventory previously supplied for this project showed several tables and views still guarded by broad `is_admin()` policies. Assigning a restricted role in the invitation does not by itself enforce least privilege across those legacy policies. Keep the invitation rollout separate from an RBAC authorization cutover, and do not describe restricted roles as fully enforced until database policies, views, RPCs, and exports have been verified against the role matrix.
