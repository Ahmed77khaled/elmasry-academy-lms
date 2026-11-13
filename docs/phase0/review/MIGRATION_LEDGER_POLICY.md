# Migration ledger policy for the current TrainerPro project

The evidence bundle reports 20 local migrations and only 4 rows in the remote `schema_migrations` ledger. It also contains contradictory provenance for several migrations:

- `20261022230000_rbac_authorization_cutover.sql` says NOT APPLIED but its version is in the remote ledger.
- `20261023100000_platform_audit_and_telegram_outbox.sql` labels itself DRAFT, while some of its tables/functions appear live.
- `20261023090000_branding_and_admin_avatars.sql` is a draft and its principal table is absent.
- `20261021171218...` claims to support ON DELETE SET NULL, but the live FK evidence says NO ACTION.
- The 15-file applied-but-unregistered count is based partly on object presence and is not statement-level proof.

## Decision

**NO-GO for blanket `supabase migration repair` and NO-GO for `supabase db push`.**

For each historical migration, first compare every statement's intended state with live `pg_catalog` evidence. Classify as applied, partial, not applied, draft, or unknown. If a migration is partly applied, prepare a specific reconciliation plan and do not mark it applied until all statements are accounted for.

The four new Phase 0 migrations in this package are forward-only source files. Adding them locally does not repair historical drift and does not make `db push` safe. Apply and record them only through a project-approved deployment workflow after staging validation and ledger reconciliation.