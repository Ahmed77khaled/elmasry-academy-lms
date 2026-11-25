---
name: auth-login-hardening
description: Checklist for login, password recovery, admin routes and hash routes (#/dashboard) in this Vite SPA with Supabase Auth.
---
- Every protected route redirects to login when there is no session; data is protected by RLS, not by hiding UI.
- Login page must not reveal security details (alerts, IP logging, admin email examples).
- Generic messages for failed login and recovery (no account enumeration).
- Add rate limiting or CAPTCHA for failed attempts and consider MFA for admins (Supabase supports TOTP).
- Preview/staging deployments (pages.dev): add `noindex` (meta tag or X-Robots-Tag header).
- Never put service keys in the frontend. Only the anon key belongs in client code.
