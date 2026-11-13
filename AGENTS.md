# Repository Instructions for Codex and Other Coding Agents

Read `docs/phase0/CODEX_HANDOFF.md` before any Phase 0 work.

## Non-negotiable environment safety
- Production Supabase ref is `urmkcixqpoqkiosihhal`. It is READ ONLY. Never issue writes, DDL, DML, GRANT/REVOKE, migrations, project lifecycle actions, or deployment against it.
- Staging ref is `kxdfconqflveqeozanaw`. It is the only database environment intended for verification, but this file alone does not authorize new database writes. Obtain explicit user approval for each mutating Staging operation and verify the ref immediately before execution.
- Portfolio project ref `eidlyvsiroyxvccmzlfm` is intentionally paused with the owner's explicit approval. Do not resume, pause, create, or delete projects.
- Never run `supabase db push`, `supabase db reset`, `supabase migration repair`, or direct DML against `supabase_migrations.schema_migrations`.
- The current four Phase 0 candidates are drafts under `docs/phase0/drafts/migrations/`. Do not move them into `supabase/migrations/` or apply them without explicit approval and a separate review.

## Evidence hierarchy
When documents conflict, prefer:
1. `docs/phase0/review/SUPABASE_MCP_RAW_EXECUTION_LOG.md` for recorded operation arguments/results (credentials redacted).
2. `docs/phase0/review/SUPABASE_LIFECYCLE_AND_SQL_AUDIT.md` for independent interpretation.
3. `docs/phase0/review/PHASE0_STATUS_AR.md` and `docs/phase0/CODEX_HANDOFF.md` for current status.
4. Earlier narrative summaries only as historical context; do not trust unsupported "Production-Ready" or "100% parity" claims.

## Code quality
- Preserve the existing React 18, TypeScript, Vite, Supabase JS, Tailwind stack and lockfile.
- Prefer minimal, focused changes with tests.
- Do not add dependencies unless necessary and justified.
- Run `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:telegram` when changes warrant them; report exact results.
- Never commit .env files, passwords, secret/service-role keys, database connection strings, production dumps, or actual student/financial data.
- Historical Staging test passwords were redacted from the log. Do not reuse them.
- Do not trigger real emails, Telegram notifications, webhooks, deployments, or external side effects in tests.

## Git workflow
- Work on `codex/phase0-next` or child feature branches.
- Do not commit directly to `main`.
- Prefer small commits and a PR back to `phase0/shared-workspace` for review.
- Update the relevant Phase 0 report when evidence or test status changes; distinguish executed, verified, inferred, and not-run items.
