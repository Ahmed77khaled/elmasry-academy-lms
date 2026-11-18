# Admin invitation deployment checklist

This checklist covers the local `admin-invite` Edge Function and its Settings page caller. It does not authorize deployment, hosted SQL, secret changes, or sending a real invitation.

## Verified status (23 October 2026)

- Password recovery: the login screen and password setup page now support Supabase recovery links in addition to invitation links. Typecheck and build passed; the Preview deployment returned HTTP 200 and its served bundles contain the recovery flow. A recovery email request for the existing active account returned Supabase Auth `unexpected_failure`, so delivery is unconfirmed. Investigate Auth/SMTP logs before retrying; no password was changed. Use recovery rather than another invitation for this account.
- The Settings page calls `supabase.functions.invoke('admin-invite', ...)`.
- Supabase Auth security notification emails are enabled on TrainerPro for password, email, and phone changes; sign-in method linking/removal; and MFA method addition/removal. The Dashboard confirmed the save succeeded. These are account-change alerts and do not modify the invitation template or SMTP settings. See [Supabase Auth email templates](https://supabase.com/docs/guides/auth/auth-email-templates).
- A bilingual first-password page handles a verified invitation link and lets the invited administrator set their own password. Invite links are detected before Supabase consumes the URL fragment. Deployed to Cloudflare Pages Preview on 23 October 2026 (`https://preview.elmasry-academy-lms.pages.dev`, deployment `https://5d4ba6b8.elmasry-academy-lms.pages.dev`). The preview returned HTTP 200 and its JavaScript bundle contains the password update flow. End-to-end acceptance with a fresh, valid invitation link is still pending; use a fresh invite if the existing link has expired.
- The local function exists at `supabase/functions/admin-invite/index.ts`.
- `admin-invite` is now deployed to TrainerPro as version 1 (`ACTIVE`, `verify_jwt = false`). A read-only Functions list confirmed it alongside `login-alert` and `telegram-group-dispatch`.
- The proposed recipient was already listed as an active academy manager in the authenticated Preview Settings page, so no duplicate invitation was sent.
- A branded bilingual invite email template is prepared in `supabase/templates/admin-invite.html`. The function supplies the selected role name and the role's current permission catalog to the template; `secretary` and `accountant` have friendly bilingual names, and other custom roles use their configured display name. The owner reports completing Resend custom SMTP setup, but the screenshot shared showed Authentication → Emails → Templates rather than SMTP Settings, so SMTP values and sender-domain verification have not been independently confirmed. The hosted Invite User template has not been confirmed updated, and the current local function/template changes are not confirmed deployed.
- The Auth Emails page's “Magic link or OTP” item is an authentication flow (temporary login code/link), not an SMTP provider. Supabase Auth templates control message content; Resend (or another custom SMTP provider) delivers messages. Supabase's default SMTP is restricted to project-team recipients and low-volume testing. The recommended sender name is the static `Elmasry Academy`. The local invite template now includes the authenticated inviter's escaped `full_name` in the email body, with Arabic/English platform-owner fallbacks; it does not change the SMTP username or impersonate the inviter as the sender.
- Local Preview/RBAC preflight: application business-data access in `src` uses permission-checked `rbac_*` RPCs; direct `.from()` calls are for Storage. The cutover migration `20261022230000` is now applied and recorded in TrainerPro. Its exact 41-function preflight passed, and the read-only postflight passed all five checks, confirming direct authenticated table/view grants and eight legacy write RPC grants are removed while RBAC RPCs and service_role access remain. The postflight query is saved at `supabase/verification/rbac_authorization_cutover_postflight.sql`. The broader migration history remains mismatched; do not run `db push` or replay the local migration chain.
- Local checks passed on 23 October 2026: `npm run typecheck`, `npm run lint`, `npm run build`, and `deno check supabase/functions/admin-invite/index.ts` (using temporary npm-exec Deno). The cutover migration execution test passed on a synthetic PGlite fixture before live application. After the cutover, the platform-owner session loaded Dashboard, Students, Courses, Enrollments, Payments, Expenses, Cash Boxes, and Settings read-only, with permission verification shown; no data was changed. A restricted-role session and write flows remain unverified. No live invitation was sent during this review.
- The Preview Auth Site URL and its redirect allow-list entry were verified. An invitation email was previously received by the owner, but the SMTP configuration itself was not independently inspected. Production-domain Auth URLs remain unverified.

## Preconditions

1. Confirm the intended Supabase project is **TrainerPro**, project ref `urmkcixqpoqkiosihhal`.
2. Verify the live schema read-only before deployment. The function depends on:
   - `public.admins(auth_user_id, role, is_active, is_owner)`
   - `public.admin_roles(role_key, is_assignable)`
   - `public.admin_audit_log(actor_auth_user_id, target_auth_user_id, action, after_state)`
   - `public.get_my_authorization()` returning `is_owner` and `permissions`
3. Confirm the current signed-in owner has `admins.invite` in `get_my_authorization()`.
4. Check Edge Function secret *names* are configured, without reading or displaying values: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (or supported publishable-key configuration), and `SUPABASE_SERVICE_ROLE_KEY` (or supported secret-key configuration). Never put the service-role key in the browser or repository.
5. In Supabase Auth settings, confirm the Site URL and allowed redirect URLs point to the intended deployed app. Verify custom SMTP is enabled and the sender domain is verified (owner reports setup, not independently checked). Then update the hosted Invite User subject and body from the reviewed local template before sending another invite. Do not record or share the SMTP password/API key.
6. Confirm the proposed recipient does not already have a Supabase Auth account. The function deliberately rejects existing Auth accounts; it does not add administrator access to an existing account.
7. Resolve the migration-history mismatch before using `supabase db push`. Prior checks found a short remote migration ledger while the live schema already contains RBAC objects. Do not replay the local migration chain or apply old migrations just to make the ledger match.

## Deployment and verification sequence

1. **Completed:** Deploy only `admin-invite` to TrainerPro and confirm it appears as active in the read-only Functions list.
2. **Completed for Preview only:** Auth Site URL and its allowed redirect URL point to the Cloudflare Preview. Set production URLs only when a production domain is selected; do not use a local address as the permanent URL.
3. **Preview frontend deployed:** Test the invitation password setup flow with a fresh, valid invite. Independently verify custom SMTP and sender-domain status, then update the hosted Invite User template to match the reviewed bilingual template. The local email-template draft is not applied to the hosted project by this checklist change. Deploy the updated Edge Function before testing dynamic role/permission content. Do not treat the Preview deployment as a Production release.
4. **For future invitations:** The owner selects a recipient address with no existing Supabase Auth account and the intended assignable role. Sending the invite sends a real email. Do not repeat invitations to an already active administrator.
5. After the owner submits the invitation, confirm the function returns success and the recipient receives the Auth invitation. Verify the resulting administrator is active, is not an owner, has the selected assignable role, and has an `admin_invited` audit record.
6. If any check fails, stop; do not repeat the invitation blindly. Inspect the response category and Auth state first.

## Security limitation to resolve before treating role permissions as enforced

The live RLS/policy inventory previously supplied for this project showed several tables and views still guarded by broad `is_admin()` policies. Assigning a restricted role in the invitation does not by itself enforce least privilege across those legacy policies. Keep the invitation rollout separate from an RBAC authorization cutover, and do not describe restricted roles as fully enforced until database policies, views, RPCs, and exports have been verified against the role matrix.
