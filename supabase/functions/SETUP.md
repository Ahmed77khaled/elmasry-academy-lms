# Admin invitations and login alerts

## Current TrainerPro status (23 October 2026)

- The `login_alert_dedupe` migration was applied through Supabase MCP and recorded as version `20261021214608`; RLS, forced RLS, and table grants were verified with a read-only query.
- Earlier task notes report that `login-alert` was deployed as version 2 and a local login reached Telegram but delivery failed; this task did not recheck the live deployment. The current local source queues login events and does not call Telegram directly; that change is not deployed.
- The secret names `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are present in TrainerPro. Their values were not read. Sign out and sign in again once to generate a version 2 diagnostic, then review the function logs for the failure category.
- The `admin-invite` Edge Function was deployed to TrainerPro on 23 October 2026 as version 1 (`ACTIVE`, `verify_jwt = false`). Its handler validates the signed-in user's bearer token and owner permission. The Settings page caller is still local; it has not been deployed to the hosted website.
- The function deployment was verified through the read-only Supabase Functions list. No invitation was sent, and the Auth Site URL, allowed redirect URLs, and production SMTP configuration have not been verified.

## Admin invitations

- The current local `admin-invite` draft requires a valid signed-in Supabase user and checks `get_my_authorization()` for the protected platform owner plus `admins.invite`.
- The request body is `{ email, roleKey }`. The function validates the requested role against `admin_roles.is_assignable`, prevents assigning the reserved owner role, writes the invited account with `is_owner = false`, and appends an `admin_invited` audit event. The browser cannot supply an Auth user ID, owner marker, or permission list.
- The live project has previously been observed with the RBAC catalog, owner fields, and authorization RPCs needed by this handler. The remote migration ledger does not match the local migration history, so do not use `supabase db push` or replay local migrations to deploy this function. Recheck the specific dependencies read-only before any future schema change.
- Invitations are sent through Supabase Auth. Configure the Auth Site URL, allowed redirect URLs, and production SMTP before inviting staff.
- The invited account receives the selected assignable role (for example `academy_manager` or `finance_manager`); role-specific security is not active while legacy grants and `is_admin()` guards remain.
- The invite link lets the person complete account setup. They choose and manage their own password; do not create or share passwords for them.

## Telegram login alerts

1. Create the bot through Telegram's `@BotFather` using `/newbot`. If a token has ever been shared in chat, revoke it through BotFather and use only its replacement. Keep the token private.
2. Open the bot's private chat and press **Start** so Telegram creates a conversation update.
3. Obtain the numeric `chat_id` locally without displaying the token or putting it in shell history. In PowerShell, paste this block; the token is entered in a hidden prompt and only chat IDs are printed:

   ```powershell
   $secureToken = Read-Host "Paste the bot token (input is hidden)" -AsSecureString
   $token = [System.Net.NetworkCredential]::new("", $secureToken).Password
   $updates = Invoke-RestMethod -Uri ("https://api.telegram.org/bot{0}/getUpdates" -f $token)
   $updates.result | ForEach-Object {
     if ($_.message.chat.id) {
       [pscustomobject]@{ ChatId = $_.message.chat.id; ChatType = $_.message.chat.type }
     }
   } | Format-Table -AutoSize
   Remove-Variable token, secureToken, updates -ErrorAction SilentlyContinue
   ```

   If no ID appears, send `/start` to the bot and run the block again. For a group chat, add the bot and send a message in that group first.
4. In the Supabase Dashboard, carefully select the intended project, open **Edge Functions → Secrets**, and add these exact keys:
   - `TELEGRAM_BOT_TOKEN` — the replacement token from BotFather.
   - `TELEGRAM_CHAT_ID` — the numeric private-chat or group ID.
   Save the secrets in the Dashboard form. Never put their values in Vite variables, source code, Git, or chat. Supabase makes saved secrets available to Edge Functions without exposing their values to the browser.
5. For a new project, apply the repository's `login_alert_dedupe` migration and deploy `login-alert` as a Supabase Edge Function. On TrainerPro, this migration is already recorded as version `20261021214608`, and `login-alert` is already deployed. Saving secrets alone does not deploy or activate a function.
6. The current local source validates the Supabase session and administrator role, hashes the session ID, and calls the service-role-only `enqueue_admin_login_notification` RPC. That RPC atomically claims the hash and writes the successful-login event plus outbox row. The separate local group dispatcher processes the outbox. Neither change has been deployed.
7. This app-triggered notification does not report failed sign-in attempts or sign-ins made through other clients. Supabase Auth Audit Logs remain the independent source for those events and IP addresses.
8. The deduplication table stores only session hashes. Records older than 90 days are deleted when the login-alert function runs. The shared-group template omits email and IP, and the new event/outbox design does not persist them.

The login notification is an alerting aid, not multi-factor authentication. Supabase Auth Audit Logs remain the independent source for authentication events and IP addresses.

## Shared administrator-group dispatcher (local draft)

- The operator reported applying `20261023100000_platform_audit_and_telegram_outbox.sql` to TrainerPro. A user-provided read-only postflight result showed all nine catalog checks passing. The exact hosted project identity was not independently verified in this workspace.
- The latest user-provided aggregate queue check showed zero notifications in `pending`, `processing`, `retry`, `sent`, and `dead_letter` at the time of that check.
- `telegram-group-dispatch` is local code only and is not deployed. Do not invoke it until the deployment, destination, secrets, and schedule have been reviewed.
- It requires server-side secrets `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_GROUP_CHAT_ID`, and a separately generated high-entropy `TELEGRAM_DISPATCH_SECRET`. The dispatcher secret is sent in the `x-telegram-dispatch-secret` header by a trusted scheduler; it is not a browser credential.
- Do not replace the current `TELEGRAM_CHAT_ID` private-chat setting until the group destination has been verified and a deliberate cutover is approved. The group dispatcher uses the distinct `TELEGRAM_ADMIN_GROUP_CHAT_ID` setting.
- The local function claims up to 10 due outbox rows through `claim_telegram_notifications`, sends only event label/result/Cairo time/short reference, and stores a bounded failure category. It does not log the Telegram response body, event payload, group ID, or bot token.
- Group-message language is selected in the owner-only platform settings. Migration `20261023110000_telegram_notification_language.sql` creates the restricted preference and owner-checked RPCs; it defaults to Arabic. Apply that migration before deploying the updated `telegram-group-dispatch` function. The language setting is database-backed and is not an Edge Function secret.
- No cron/scheduler is configured in this repository. A reviewed server-side schedule and a safe non-production delivery check are still required before release.
