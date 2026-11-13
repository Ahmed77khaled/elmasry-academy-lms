# Local migration snapshot (Phase 0)

This directory contains the 20 original SQL migration files from the developer's local working tree, synchronized to the shared branch by Antigravity.

The 20 files were compared against the original local files and their SHA-256 checksums in `SHA256SUMS.original.txt`. Antigravity reported that all 20 files match the original checksums exactly after synchronization.

Their original filenames, Git tracking status, draft labels, and full SHA-256 values are recorded in `../evidence/MIGRATION_INVENTORY.md` and `SHA256SUMS.original.txt`.

All files in this directory are archival evidence only. Do not move them into `supabase/migrations/` and do not run `supabase db push` or `migration repair` based on this snapshot. Review the migration reconciliation evidence before any ledger action.
