# Staging Schema Snapshot — Handling Notes

`staging_schema_reproduced.sql` is an archival schema/reference-seed snapshot generated from the captured Production catalog and used in the recorded Staging reproduction workflow.

- It contains object definitions and application reference/configuration seeds; it is not a database dump and is not a blind replay script.
- It is not guaranteed to be idempotent or compatible with an already-initialized Supabase project.
- Do not execute it against Production.
- Do not execute it against Staging without a dedicated restore plan, inspection of every statement, and explicit approval.
- The captured workflow created synthetic Auth users and synthetic academic/financial test fixtures separately; raw test passwords have been redacted from the execution log.
- Do not copy actual student, auth, payment, expense, or other personal/financial production data into this file.
- For Codex analysis, prefer reading the DDL and comparing definitions; do not run it automatically.
