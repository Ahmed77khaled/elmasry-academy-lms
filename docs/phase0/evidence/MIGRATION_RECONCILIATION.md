# Migration Reconciliation — Evidence Reassessment

**Target:** Supabase project `urmkcixqpoqkiosihhal` (TrainerPro)  
**Local source snapshot:** 20 files under `migrations-snapshot/`  
**Captured remote ledger:** 4 rows (see Phase 0 precheck report)  
**Review status:** DRIFT CONFIRMED — NO LEDGER REPAIR AUTHORIZED

## 1. What the current evidence actually proves

The database audit captured four rows in `supabase_migrations.schema_migrations`:

| Version | Local file | Ledger row present |
|---|---|---:|
| 20261021214608 | `20261021214608_add_login_alert_dedupe.sql` | Yes |
| 20261022230000 | `20261022230000_rbac_authorization_cutover.sql` | Yes |
| 20261023110000 | `20261023110000_telegram_notification_language.sql` | Yes |
| 20261030120000 | `20261030120000_student_profile_directory_v2.sql` | Yes |

A ledger row proves only that the version is recorded in the captured ledger. It is not independent proof that every statement in the local file ran unchanged or that the file content now matches the historical SQL applied.

The audit reports 20 local files and only these 4 registered versions. The other 16 files do not have a corresponding captured ledger row.

## 2. Reassessment of the former classifications

The original reconciliation table labelled 15 unregistered files as FULLY APPLIED largely from object-existence checks. Those checks are insufficient to prove that all statements and side effects in each file were applied correctly.

Use these conservative classifications instead:

| Version | Ledger | Evidence reported | Revised classification |
|---|---:|---|---|
| 20261015024100 | No | Core tables exist, but local source describes an older `id`-based schema and does not prove exact live definitions; statement matrix confirms the same-named `idx_payments_voided` targets `voided_at` in captured Production rather than the migration's `voided` | UNKNOWN — PARTIAL INDEX DRIFT CONFIRMED; REQUIRES STATEMENT-LEVEL DIFF |
| 20261015024134 | No | Four view names exist; no complete statement-by-statement equivalence proof | UNKNOWN — REQUIRES DEFINITION DIFF |
| 20261015024155 | No | Eight initial RPCs reported present; no proof every function/ACL/side effect matches file | UNKNOWN — REQUIRES FUNCTION/ACL DIFF |
| 20261015024209 | No | Unique constraint and seed role names reported present; exact seed effects are not reconciled | UNKNOWN — REQUIRES DATA/CONSTRAINT DIFF |
| 202610210005 | No | Four Production function definitions (`enroll_student`, `void_payment`, `void_expense`, `transfer_between_boxes`) and the unique `payments_receipt_number_uidx` definition match retained Production evidence; receipt data/sequence state, remaining constraints, triggers, grants, and comments remain unverified | PARTIAL FUNCTION/INDEX EQUIVALENCE; LEDGER ABSENT; FULL FILE PROOF INCOMPLETE |
| 202610210006 | No | `is_admin()` exists, but its live body differs from the desired active-admin invariant and the file replaces several other objects | UNKNOWN / PARTIAL CANDIDATE — FULL DIFF REQUIRED |
| 202610210007 | No | Effective table grants reported revoked; all policies, column grants and statements not fully reconciled | UNKNOWN — REQUIRES FULL PRIVILEGE DIFF |
| 202610210008 | No | Trigger function exists, but the live `added_by` FK action is NO ACTION rather than the file's intended SET NULL | PARTIAL / DRIFT CONFIRMED |
| 20261021171218 | No | Captured Production `prevent_cash_box_mutation()` definition matches statement 3; read-only preflight has no persistent effect; comment statement is not independently captured | FUNCTION EFFECT EQUIVALENT IN CAPTURED PRODUCTION; LEDGER ABSENT; FULL FILE APPLICATION NOT PROVEN |
| 20261021214608 | Yes | Ledger row, `login_alert_dedupe` table, and `idx_login_alert_dedupe_created_at` definition are present in retained Production evidence | PARTIAL TABLE/INDEX EQUIVALENCE; LEDGER-RECORDED; CONTENT AND FULL FILE EQUIVALENCE NOT PROVEN |
| 20261021223822 | No | Two Production function definitions (`get_my_authorization`, `claim_platform_owner`) and both `admin_audit_log` index definitions match captured Production evidence; schema, role/catalog seeds, constraints, grants, and remaining statements need proof | PARTIAL FUNCTION/INDEX EQUIVALENCE; LEDGER ABSENT; FULL FILE PROOF INCOMPLETE |
| 20261021224440 | No | Nine read/dashboard RPC definitions match captured Production bodies and routine signatures; ACLs for those migration statements and the rest of the file remain unverified | PARTIAL FUNCTION EQUIVALENCE; LEDGER ABSENT; FULL FILE PROOF INCOMPLETE |
| 20261021224905 | No | Twenty-one write/admin RPC definitions match captured Production bodies and routine signatures; ACLs and remaining statements are not fully reconciled | PARTIAL FUNCTION EQUIVALENCE; LEDGER ABSENT; FULL FILE PROOF INCOMPLETE |
| 20261022225500 | No | Three owner-management RPC definitions match captured Production bodies and routine signatures; owner-column/index/data effects and remaining statements are unverified | PARTIAL FUNCTION EQUIVALENCE; LEDGER ABSENT; FULL FILE PROOF INCOMPLETE |
| 20261022230000 | Yes | Ledger row present; local inventory flags file as Draft Only | LEDGER-RECORDED — VERIFY HISTORICAL CONTENT AND DRAFT MARKER |
| 20261023090000 | No | File explicitly says Draft Only; `public.academy_branding` is reported absent. The statement matrix marks the five table-specific create/seed/RLS/ACL effects absent; other bucket, policy, and function statements remain individually unverified. | DRAFT; TABLE EFFECTS ABSENT, FULL FILE NOT PROVEN APPLIED |
| 20261023100000 | No | Audit reports audit/outbox tables and rows exist; five indexes for `platform_audit_events` and `telegram_notification_outbox` match exact archived definitions. Local inventory flags file as Draft Only | PARTIAL TABLE/INDEX EQUIVALENCE; DRAFT MARKER CONFLICTS WITH LIVE OBJECT; FULL FILE NOT PROVEN APPLIED |
| 20261023110000 | Yes | Ledger row present; both Telegram language RPC definitions and their effective anon/authenticated execution outcomes match the archived statements; table/data/RLS/grants, audit constraint, and comment are not fully evidenced | PARTIAL EFFECT EQUIVALENCE; LEDGER PRESENT; FULL FILE PROOF INCOMPLETE |
| 20261030120000 | Yes | Ledger row present; all three student v2 function definitions and six effective grant/revoke outcomes match the archived statements; profile column properties and schema notification are not fully evidenced | PARTIAL EFFECT EQUIVALENCE; LEDGER PRESENT; FULL FILE PROOF INCOMPLETE |
| 20261030130000 | No | Captured Production schema matches six currency column/constraint effects; 15 RPC definitions match captured Production bodies/signatures and 22 effective revoke/grant outcomes match. Numeric typmods, constraint validation state, comments, notify behavior, and remaining statements are not fully reconciled. | PARTIAL EFFECT EQUIVALENCE; LEDGER ABSENT; FULL FILE APPLICATION NOT PROVEN |

The inventory and live audit must be treated as separate sources. In particular, “Draft Only” comments in local files that also have ledger rows or related live objects need provenance investigation; do not silently resolve the conflict.

## 3. Why blanket migration repair is unsafe

Do **not** run:

- `supabase db push`
- `supabase migration repair --status applied` for all missing versions
- manual INSERT/UPDATE/DELETE against `schema_migrations`

A migration repair command changes the migration history record; it does not execute or verify the original SQL. A wrong ledger entry can make future deploys skip required changes, while a missing/incorrect entry can make a later push attempt non-idempotent SQL against existing production objects.

## 4. Required reconciliation procedure

For each unregistered version, obtain the full local SQL (already archived in `migrations-snapshot/`) and build a statement inventory:
1. Every CREATE/ALTER/DROP/GRANT/REVOKE/COMMENT/INSERT/UPDATE/DELETE/NOTIFY statement.
2. Exact live catalog/data evidence corresponding to each statement.
3. A classification per statement: equivalent, different, absent, or unverifiable.
4. A migration-level classification. Only mark FULLY APPLIED when every relevant statement and expected side effect is proved.
5. Record the evidence query and result for each classification.

For versions already in the ledger, compare the migration name and all expected live effects to prove there is no drift. The ledger row alone is not enough.

A separate restored Staging database should be used to test the planned reconciliation sequence. Do not use Production as a test harness.

## 5. Current decision

**NO-GO for any migration repair or db push.** The supplied reports do not contain enough statement-level evidence to perform a safe repair. The migration reconciliation task remains open.
