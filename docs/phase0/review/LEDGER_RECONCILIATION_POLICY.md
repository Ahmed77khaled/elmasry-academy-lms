# Migration Ledger Reconciliation Policy

## Core rule

A Supabase migration ledger row is historical bookkeeping, not a schema verifier. A migration file missing from the ledger must not be marked applied solely because a table, function, trigger, or column with a matching name exists.

## Per-migration evidence required

For every SQL statement in a migration, record one of:
- **Equivalent:** exact live object definition or data effect is proven equivalent.
- **Different:** live object exists but definition, ACL, constraint, data, trigger, policy, or behavior differs.
- **Absent:** expected object/effect is not present.
- **Unverifiable:** evidence is insufficient or the effect is not observable.

Only migrations for which every effect is Equivalent may be classified FULLY APPLIED. A migration with any Different/Absent effect is not fully applied. A migration with any Unverifiable effect remains UNKNOWN.

## Ledger changes

Do not run migration repair or edit `supabase_migrations.schema_migrations` until:
1. The per-statement evidence matrix is complete.
2. Every local migration file and ledger row is matched by exact version/name.
3. Conflicting Draft Only markers have documented provenance.
4. A separate Staging clone has validated the proposed reconciliation sequence.
5. A backup and rollback plan exist.

## Commands that are prohibited until approval

- `supabase db push`
- `supabase migration repair`
- direct DML on `supabase_migrations.schema_migrations`

The migration repair command updates ledger status only; it does not execute the migration SQL or compare it with live catalog definitions. Use it only after equivalence is already proven, never as a repair mechanism for schema drift.
