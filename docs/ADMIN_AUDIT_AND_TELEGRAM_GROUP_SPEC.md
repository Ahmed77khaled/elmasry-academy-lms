# Admin Audit and Shared Telegram Group ? Delivery Specification

> Status (updated 2026-10-23): `login-alert` v12, `telegram-group-dispatch` v6, and `admin-invite` v1 are ACTIVE on TrainerPro. The latest `login-alert` deployment only hardens network-error logging against accidental bot-token disclosure; it did not change the notification contract. The audit/outbox migration, Vault secrets, and one-minute Cron were previously reported by the operator. A read-only outbox query recorded two `auth.login_succeeded` events as `sent`; this is evidence of Telegram API success, not visual inspection of the group. Migration `20261023110000_telegram_notification_language.sql` is applied and recorded; the default group language is Arabic. The Vite UI now deploys automatically to Cloudflare Pages Preview at https://preview.elmasry-academy-lms.pages.dev/. No authenticated UI smoke test or production-domain release has been performed.
> Product decisions approved on 2026-10-22: one shared administrator group; actual administrator onboarding is the final rollout step; manual membership first; no phone number required solely for Telegram.

## 1. Goal

Create a reliable audit trail for important LMS security, administrator, and financial actions. Send a separate, minimal Telegram message to one shared administrator group for selected events. The database audit record is authoritative; Telegram is a notification channel only.

## 2. Current implementation findings

- Earlier task notes report that `login-alert` was deployed and sent to the single configured `TELEGRAM_CHAT_ID`; the live deployment was not re-inspected in this task. Current local source validates the signed-in LMS administrator and queues a fixed login-success event by hashed session ID; it no longer calls Telegram directly.
- The prior private-chat template included account email and request IP when available. Those fields are excluded from the shared-group template.
- The login alert is initiated by the app after successful login. It does not record failed password attempts or sign-ins outside this app.
- `public.admin_audit_log` is currently defined by local migration drafts as an append-only administrator/role audit table with a constrained action list. It does not yet represent a complete audit of all finance and authentication events.
- `rbac_set_admin_active` changes LMS access and records an admin audit action, but the current local flow has no Telegram member mapping, group-removal job, or delivery outbox.
- Live database/function state is not independently established by this specification. Local migration files and prior operator reports must not be treated as proof of the currently deployed state.

## 3. Event and delivery matrix

| Event | Durable audit source | Shared Telegram group | Group payload policy |
|---|---|---|---|
| Successful administrator login through the LMS | Auth event/audit event, deduplicated by session | Yes, subject to configured event policy | Event type, success, Cairo time, opaque event reference; no IP or full email |
| Failed sign-in attempts | Supabase Auth audit/log source where available; server-side hook only if supported | Only on a configured threshold/lockout/security escalation, not on every typo | Count/window, outcome, Cairo time; do not publish attempted passwords or raw IP |
| Admin invited / enabled / disabled | Append-only application audit event | Yes | Action, success, safe administrator reference; no invitation URL or email by default |
| Owner or role/permission change | Append-only application audit event | Yes, high priority | Change category and safe target reference; never include session or invitation tokens |
| Academy logo change recorded in `admin_audit_log` | Append-only application audit event | Yes | Event label and opaque event reference only |
| Payment or expense recorded | Transactional application audit event where required by policy | No per-row message by default; retain in audit view | Avoid creating a noisy group feed or disclosing amounts/student names |
| Payment/expense void, cash transfer, cash-box archive, or denied privileged financial action | Transactional application audit event | Yes, selected high-impact events | Action, result, Cairo time, safe reference; omit amount, student identity, and box balance by default |
| Telegram send/remove failure | Notification-delivery status record, separate from the original event | No recursive Telegram alert | Show in app/operational logs for owner follow-up; never cause core LMS operation to fail |

The exact enabled event categories should be configurable by a platform owner from an allowlist. The first release should use a conservative fixed allowlist, not arbitrary client-supplied event names.

## 4. Message formats

### Shared group template

```text
Elmasry Academy security notice
Event: {human-readable event label}
Result: {success | denied | action required}
Time: {Cairo timestamp}
Reference: {short opaque event reference}
```

The group-wide language is selected by an active platform owner in Settings. Arabic is the default; English is also available. The message contains only the event category, result, Cairo time, and short reference. The current event record does not provide additional safe context to include without adding personal or financial data.

Arabic example:

```text
تنبيه أمني — أكاديمية المصري
الحدث: تسجيل دخول مسؤول بنجاح
النتيجة: نجاح
الوقت: {توقيت القاهرة}
المرجع: {مرجع قصير}
```

Group members can read all messages, so do not include IP addresses, full email addresses, phone numbers, student names, payment amounts, balances, passwords, bot tokens, session IDs, or invite links by default. A removed member may already have read or copied earlier messages.

## 5. Planned architecture

```text
LMS/Auth/business operation
        |
        +--> durable audit row (same transaction for DB business writes)
        |
        +--> notification outbox row (only if event is group-notifiable)
                    |
                    v
          server-side dispatcher / Edge Function
                    |
                    v
          Telegram Bot API -> one configured group chat
```

- Keep the existing bot token server-side as a Supabase secret. Keep one group chat ID as a separate server-side setting.
- The browser must never call Telegram directly or receive the bot token.
- Use a durable outbox or equivalent retryable handoff so an API timeout does not lose the audit record and does not roll back a login or financial operation.
- Keep one logical notification per event/destination using a unique outbox key, and retain the event reference in each message. Delivery attempts may produce duplicates if Telegram accepts a message but the response is lost. Retries are bounded to eight attempts and exhausted or expired final attempts become dead-lettered; successful delivery is not guaranteed. The event reference makes duplicates recognizable. Store attempt count, next retry time, completion/failure category, and timestamps; do not store Telegram response bodies or secrets.
- Restrict audit and delivery records to server-side roles and an explicitly authorized audit-reading endpoint. Preserve append-only behavior for the audit source.
- Use [Supabase Auth audit logs](https://supabase.com/docs/guides/auth/audit-logs) for Auth events and verify available event types and plan features before promising failed-password alerting or an exact three-attempt lockout. The documented [Password Verification Attempt Hook](https://supabase.com/docs/guides/auth/auth-hooks) is plan-dependent and must be checked in the target project.

## 6. Administrator group membership

### First rollout: manual membership

1. Finish the role enforcement, audit coverage, and group notification implementation.
2. Pass the release gate in a safe test environment.
3. Invite one real administrator with a least-privilege role.
4. The platform owner manually adds that person to the shared Telegram group and confirms membership.
5. On LMS access revocation, disable the account in the LMS first, then have the owner remove the person from the group. Record the completion or an operator follow-up.

### Later option: automated membership

Telegram Bot API does not provide a general `addChatMember` operation for bots. The bot can create an invite link ([`createChatInviteLink`](https://core.telegram.org/bots/api#createchatinvitelink)), and it can ban/remove a member with the required administrator rights ([`banChatMember`](https://core.telegram.org/bots/api#banchatmember)). Therefore automatic membership needs a one-time verified mapping from the LMS administrator to their Telegram user ID, followed by a bot-generated limited invite and a verified join request/approval flow. Automatic removal then uses the stored Telegram user ID after LMS deactivation. If a Telegram action fails, LMS access remains disabled and the platform reports the group action as pending; never display it as completed.

Telegram supports a one-time start parameter for bot deep links ([Deep Linking](https://core.telegram.org/bots/features#deep-linking)). A bot keyboard can request contact sharing only in a private chat and only after the user presses it ([`KeyboardButton`](https://core.telegram.org/bots/api#keyboardbutton)). This identity link is not an individual API credential and does not inherently require collecting a phone number. Do not add a phone field to the invite form solely for Telegram. If a work-phone field is needed for a separate operational purpose, define consent, verification, access, retention, and deletion first. An SMS OTP verifies control of a phone number; it does not by itself verify which Telegram account joined.

If automation is implemented, grant the bot only the rights necessary to send messages, issue invites, and restrict/remove members. Platform administrators remain ordinary group members, not Telegram group administrators.

## 7. Implementation stages and exit criteria

1. **Baseline inventory ? complete for current source review.** Record existing audit table, login alert, admin deactivation flow, local Git changes, and uncertain live state.
2. **Event contract ? this document.** Confirm event catalog, group-safe payload, and delivery rules before changing code.
3. **Audit persistence — migration reported applied; postflight passed.** Existing `admin_audit_log` remains the focused administrator/role audit. The separate migration adds the allowlisted platform event ledger and Telegram outbox. The operator reported applying it to TrainerPro; the supplied read-only postflight output passed all nine checks. A later aggregate check showed zero outbox rows in every status at that time. The project identity was not independently verified in this review.
4. **Server-side group sender — deployed; delivery independently confirmed in the outbox.** `telegram-group-dispatch` claims outbox rows atomically, sends only the safe event template, and applies bounded retries. A read-only query against TrainerPro showed the two recent login notifications in `sent`, each with one attempt and a `sent_at` timestamp. This proves the sender recorded successful Telegram API delivery; the group UI itself was not independently inspected.
5. **Selected event routing - deployed for login events; private alerts preserved.** The dual-channel `login-alert` Edge Function is active on TrainerPro at version 12. It transactionally records the platform audit event and enqueues the safe login event into `telegram_notification_outbox` via `enqueue_admin_login_notification`, while preserving the legacy Arabic private notification sent to the administrator's private chat. Network-error logging now omits the raw exception, which could contain a Telegram bot-token URL.
6. **Operational visibility.** Provide an owner-only view of recent audit events and notification delivery failures without exposing secrets or widening access.
7. **Verification gate - backend and Preview UI deployed.** The selected migration `20261023110000_telegram_notification_language.sql` was applied earlier to TrainerPro and recorded. A read-only postflight confirmed the singleton setting row, Arabic default, RLS enabled and forced, and the migration history entry. `telegram-group-dispatch` is active at v6 and reads the shared language setting, falling back to Arabic if loading fails. The settings UI and frontend are deployed to Cloudflare Pages Preview, with automatic deployment from `main`; the latest deployment passed typecheck, lint, notification tests, and build. The preview returned HTTP 200. No live Telegram test message was sent during this verification, and no authenticated UI workflow was exercised. Production remains unreleased.
8. **Final onboarding.** Only after the gate passes, invite administrators one at a time and manually manage group membership.
9. **Optional membership automation.** Consider the one-time Telegram identity link and automatic invite/removal only after manual operation is stable and its bot permissions and failure recovery are verified.

## 8. Non-goals for the first implementation

- No Telegram private message/API key per administrator.
- No phone-number collection solely for Telegram.
- No automatic administrator invitations or group membership in the first rollout.
- No promise that a password is blocked after exactly three failures until the Auth platform supports and verifies that policy.
- No public exposure of audit history, IP addresses, personal data, financial amounts, or message-delivery internals.
- No database migration execution, function deployment, bot/group configuration, or production change as part of this design document.
