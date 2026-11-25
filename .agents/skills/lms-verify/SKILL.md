---
name: lms-verify
description: Run the project checks after code changes in the LMS repo (typecheck, lint, build, telegram tests). Use before saying a task is done.
---
1. Run `git status` first and do not touch unrelated files.
2. Run in order: `npm run typecheck`, `npm run lint`, `npm run build`.
3. If you changed anything in supabase/functions, also run `npm run test:telegram` (offline, mocked).
4. Report each command with pass/fail. Fix failures you caused. Do not commit, push or deploy.
