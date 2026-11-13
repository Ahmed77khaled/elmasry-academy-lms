# Shared GitHub and Codex Workflow

- Canonical private repository: `Ahmed77khaled/elmasry-academy-lms`.
- Phase 0 evidence baseline: `phase0/shared-workspace`.
- Codex continuation branch: `codex/phase0-next` (created from the reviewed Phase 0 baseline).
- Read root `AGENTS.md` and `docs/phase0/CODEX_HANDOFF.md` before coding.
- Keep remediation SQL drafts under `docs/phase0/drafts/migrations/` until separately reviewed and approved.
- Do not copy candidate drafts into active `supabase/migrations/` without explicit approval.
- Do not push directly to `main`; Codex work should be submitted as a PR back to `phase0/shared-workspace`.
- Do not commit secrets, access tokens, service-role keys, passwords, database connection strings, .env files, or live student/payment records.
- Any database operation must be classified read-only or mutating before execution. Production is read-only; Staging writes require explicit approval and fresh target verification.
- Do not execute `db push`, `db reset`, `migration repair`, or direct DML against `schema_migrations`.
- A proposed fix is not considered fully validated until exact execution, behavioral tests, post-apply checks, and evidence are recorded.
- Distinguish test evidence from claims in historical reports; raw execution evidence and the current independent audit take precedence.
