# Shared GitHub Workflow

- Canonical repository: `Ahmed77khaled/elmasry-academy-lms`.
- Current Phase 0 branch: `phase0/shared-workspace`.
- Phase 0 audit evidence and drafts live under `docs/phase0/`.
- Keep proposed SQL under `docs/phase0/drafts/migrations/` until reviewed and tested.
- Do not copy draft SQL into the active `supabase/migrations/` folder.
- Do not push directly to `main`.
- Use focused branches and pull requests for application or approved migration changes.
- Do not commit secrets, access tokens, service-role keys, database connection strings, or live student/payment records.
- Any Supabase command must be classified as read-only or mutating before execution. Never run `db push`, `migration repair`, or production SQL as a side effect of an audit.
- A proposed fix is not considered applied until the target environment, migration execution, post-apply checks, and evidence are recorded.

This document establishes repository workflow only; it does not authorize database changes.
