---
name: supabase-rls-review
description: Review Supabase SQL migrations, RLS policies, RPCs and edge functions for security. Use when editing supabase/migrations or supabase/functions.
---
Check every change for:
- RLS enabled on each new table; no policy using `true` for anon/authenticated on sensitive tables (students, payments, cash boxes, admins).
- SECURITY DEFINER functions: fixed `search_path`, explicit role checks inside, EXECUTE revoked from anon/public.
- New financial views or tables: no direct grants to anon/authenticated unless intended.
- Authorization lives on the server (RLS/RPC), never only in the React UI.
- Edge functions: validate input, no secrets or raw IPs/emails in logs or messages.
- Write migrations as new files in supabase/migrations only. Never run them remotely. Include a rollback note.
Output: a list of findings by severity with file and line.
