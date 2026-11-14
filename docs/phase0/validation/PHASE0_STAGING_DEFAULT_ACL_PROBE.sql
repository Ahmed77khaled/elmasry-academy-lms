-- STAGING ONLY: verifies default privileges by creating disposable probe objects
-- in public and private. The private function specifically tests the global
-- PUBLIC EXECUTE default; no explicit defaults currently exist in private.
-- The whole transaction is rolled back; do not run on Production.
-- Requires a dedicated restored Staging database and current_user=postgres.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '20s';

DO $guard$
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'STOP: run this probe as postgres on an isolated Staging database only';
  END IF;
  IF to_regnamespace('private') IS NULL
     OR NOT has_schema_privilege(current_user, 'private', 'CREATE') THEN
    RAISE EXCEPTION 'STOP: private schema missing or postgres cannot create the private probe';
  END IF;
  IF to_regclass('public.__phase0_acl_probe_table_20261113') IS NOT NULL
     OR to_regclass('public.__phase0_acl_probe_sequence_20261113') IS NOT NULL
     OR to_regprocedure('public.__phase0_acl_probe_function_20261113()') IS NOT NULL
     OR to_regprocedure('private.__phase0_acl_probe_function_20261114()') IS NOT NULL THEN
    RAISE EXCEPTION 'STOP: a probe object already exists; inspect it instead of replacing it';
  END IF;
END;
$guard$;

CREATE TABLE public.__phase0_acl_probe_table_20261113 (id bigint);
CREATE SEQUENCE public.__phase0_acl_probe_sequence_20261113;
CREATE FUNCTION public.__phase0_acl_probe_function_20261113()
RETURNS integer
LANGUAGE sql
VOLATILE
AS $probe$
  SELECT 1;
$probe$;

-- The global postgres default applies across schemas. Keep this probe
-- unexposed: it is solely an ACL test, not a callable application API.
CREATE FUNCTION private.__phase0_acl_probe_function_20261114()
RETURNS integer
LANGUAGE sql
VOLATILE
AS $probe$
  SELECT 1;
$probe$;

-- Show the effective privilege matrix for all API roles.
SELECT
  has_table_privilege('anon', 'public.__phase0_acl_probe_table_20261113', 'SELECT') AS anon_table_select,
  has_table_privilege('anon', 'public.__phase0_acl_probe_table_20261113', 'INSERT') AS anon_table_insert,
  has_table_privilege('anon', 'public.__phase0_acl_probe_table_20261113', 'UPDATE') AS anon_table_update,
  has_table_privilege('anon', 'public.__phase0_acl_probe_table_20261113', 'DELETE') AS anon_table_delete,
  has_table_privilege('anon', 'public.__phase0_acl_probe_table_20261113', 'TRUNCATE') AS anon_table_truncate,
  has_table_privilege('anon', 'public.__phase0_acl_probe_table_20261113', 'REFERENCES') AS anon_table_references,
  has_table_privilege('anon', 'public.__phase0_acl_probe_table_20261113', 'TRIGGER') AS anon_table_trigger,
  has_table_privilege('anon', 'public.__phase0_acl_probe_table_20261113', 'MAINTAIN') AS anon_table_maintain,
  has_table_privilege('authenticated', 'public.__phase0_acl_probe_table_20261113', 'SELECT') AS authenticated_table_select,
  has_table_privilege('authenticated', 'public.__phase0_acl_probe_table_20261113', 'INSERT') AS authenticated_table_insert,
  has_table_privilege('authenticated', 'public.__phase0_acl_probe_table_20261113', 'UPDATE') AS authenticated_table_update,
  has_table_privilege('authenticated', 'public.__phase0_acl_probe_table_20261113', 'DELETE') AS authenticated_table_delete,
  has_table_privilege('authenticated', 'public.__phase0_acl_probe_table_20261113', 'TRUNCATE') AS authenticated_table_truncate,
  has_table_privilege('authenticated', 'public.__phase0_acl_probe_table_20261113', 'REFERENCES') AS authenticated_table_references,
  has_table_privilege('authenticated', 'public.__phase0_acl_probe_table_20261113', 'TRIGGER') AS authenticated_table_trigger,
  has_table_privilege('authenticated', 'public.__phase0_acl_probe_table_20261113', 'MAINTAIN') AS authenticated_table_maintain,
  has_table_privilege('service_role', 'public.__phase0_acl_probe_table_20261113', 'SELECT') AS service_table_select,
  has_table_privilege('service_role', 'public.__phase0_acl_probe_table_20261113', 'INSERT') AS service_table_insert,
  has_table_privilege('service_role', 'public.__phase0_acl_probe_table_20261113', 'UPDATE') AS service_table_update,
  has_table_privilege('service_role', 'public.__phase0_acl_probe_table_20261113', 'DELETE') AS service_table_delete,
  has_table_privilege('service_role', 'public.__phase0_acl_probe_table_20261113', 'TRUNCATE') AS service_table_truncate,
  has_table_privilege('service_role', 'public.__phase0_acl_probe_table_20261113', 'REFERENCES') AS service_table_references,
  has_table_privilege('service_role', 'public.__phase0_acl_probe_table_20261113', 'TRIGGER') AS service_table_trigger,
  has_table_privilege('service_role', 'public.__phase0_acl_probe_table_20261113', 'MAINTAIN') AS service_table_maintain;

SELECT
  has_sequence_privilege('anon', 'public.__phase0_acl_probe_sequence_20261113', 'USAGE') AS anon_sequence_usage,
  has_sequence_privilege('anon', 'public.__phase0_acl_probe_sequence_20261113', 'SELECT') AS anon_sequence_select,
  has_sequence_privilege('anon', 'public.__phase0_acl_probe_sequence_20261113', 'UPDATE') AS anon_sequence_update,
  has_sequence_privilege('authenticated', 'public.__phase0_acl_probe_sequence_20261113', 'USAGE') AS authenticated_sequence_usage,
  has_sequence_privilege('authenticated', 'public.__phase0_acl_probe_sequence_20261113', 'SELECT') AS authenticated_sequence_select,
  has_sequence_privilege('authenticated', 'public.__phase0_acl_probe_sequence_20261113', 'UPDATE') AS authenticated_sequence_update,
  has_sequence_privilege('service_role', 'public.__phase0_acl_probe_sequence_20261113', 'USAGE') AS service_sequence_usage,
  has_sequence_privilege('service_role', 'public.__phase0_acl_probe_sequence_20261113', 'SELECT') AS service_sequence_select,
  has_sequence_privilege('service_role', 'public.__phase0_acl_probe_sequence_20261113', 'UPDATE') AS service_sequence_update;

SELECT
  has_function_privilege('anon', 'public.__phase0_acl_probe_function_20261113()', 'EXECUTE') AS anon_function_execute,
  has_function_privilege('authenticated', 'public.__phase0_acl_probe_function_20261113()', 'EXECUTE') AS authenticated_function_execute,
  has_function_privilege('service_role', 'public.__phase0_acl_probe_function_20261113()', 'EXECUTE') AS service_function_execute;

SELECT
  has_function_privilege('anon', 'private.__phase0_acl_probe_function_20261114()', 'EXECUTE') AS anon_private_function_execute,
  has_function_privilege('authenticated', 'private.__phase0_acl_probe_function_20261114()', 'EXECUTE') AS authenticated_private_function_execute,
  has_function_privilege('service_role', 'private.__phase0_acl_probe_function_20261114()', 'EXECUTE') AS service_private_function_execute;

-- Inspect explicit ACL entries; PUBLIC appears as grantee OID 0.
SELECT
  'TABLE' AS object_kind,
  CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS grantee,
  a.privilege_type
FROM pg_class c
CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
WHERE c.oid = 'public.__phase0_acl_probe_table_20261113'::regclass
UNION ALL
SELECT
  'SEQUENCE',
  CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,
  a.privilege_type
FROM pg_class c
CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('S', c.relowner))) a
WHERE c.oid = 'public.__phase0_acl_probe_sequence_20261113'::regclass
UNION ALL
SELECT
  'FUNCTION',
  CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,
  a.privilege_type
FROM pg_proc p
CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
WHERE p.oid = 'public.__phase0_acl_probe_function_20261113()'::regprocedure
UNION ALL
SELECT
  'PRIVATE FUNCTION',
  CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,
  a.privilege_type
FROM pg_proc p
CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
WHERE p.oid = 'private.__phase0_acl_probe_function_20261114()'::regprocedure
ORDER BY 1, 2, 3;

DO $assert$
DECLARE
  v_table regclass := 'public.__phase0_acl_probe_table_20261113'::regclass;
  v_sequence regclass := 'public.__phase0_acl_probe_sequence_20261113'::regclass;
  v_function regprocedure := 'public.__phase0_acl_probe_function_20261113()'::regprocedure;
  v_private_function regprocedure := 'private.__phase0_acl_probe_function_20261114()'::regprocedure;
BEGIN
  -- No API-role or PUBLIC access on the newly created public table.
  IF has_table_privilege('anon', v_table, 'SELECT')
     OR has_table_privilege('anon', v_table, 'INSERT')
     OR has_table_privilege('anon', v_table, 'UPDATE')
     OR has_table_privilege('anon', v_table, 'DELETE')
     OR has_table_privilege('anon', v_table, 'TRUNCATE')
     OR has_table_privilege('anon', v_table, 'REFERENCES')
     OR has_table_privilege('anon', v_table, 'TRIGGER')
     OR has_table_privilege('anon', v_table, 'MAINTAIN')
     OR has_table_privilege('authenticated', v_table, 'SELECT')
     OR has_table_privilege('authenticated', v_table, 'INSERT')
     OR has_table_privilege('authenticated', v_table, 'UPDATE')
     OR has_table_privilege('authenticated', v_table, 'DELETE')
     OR has_table_privilege('authenticated', v_table, 'TRUNCATE')
     OR has_table_privilege('authenticated', v_table, 'REFERENCES')
     OR has_table_privilege('authenticated', v_table, 'TRIGGER')
     OR has_table_privilege('authenticated', v_table, 'MAINTAIN')
     OR EXISTS (
       SELECT 1
       FROM pg_class c
       CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
       WHERE c.oid = v_table AND a.grantee = 0
     ) THEN
    RAISE EXCEPTION 'FAIL: anon/authenticated/PUBLIC has a privilege on the probe table';
  END IF;

  -- No API-role or PUBLIC access on the newly created public sequence.
  IF has_sequence_privilege('anon', v_sequence, 'USAGE')
     OR has_sequence_privilege('anon', v_sequence, 'SELECT')
     OR has_sequence_privilege('anon', v_sequence, 'UPDATE')
     OR has_sequence_privilege('authenticated', v_sequence, 'USAGE')
     OR has_sequence_privilege('authenticated', v_sequence, 'SELECT')
     OR has_sequence_privilege('authenticated', v_sequence, 'UPDATE')
     OR EXISTS (
       SELECT 1
       FROM pg_class c
       CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('S', c.relowner))) a
       WHERE c.oid = v_sequence AND a.grantee = 0
     ) THEN
    RAISE EXCEPTION 'FAIL: anon/authenticated/PUBLIC has a privilege on the probe sequence';
  END IF;

  -- No API-role or PUBLIC execution on the newly created public function.
  IF has_function_privilege('anon', v_function, 'EXECUTE')
     OR has_function_privilege('authenticated', v_function, 'EXECUTE')
     OR EXISTS (
       SELECT 1
       FROM pg_proc p
       CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
       WHERE p.oid = v_function AND a.grantee = 0 AND a.privilege_type = 'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'FAIL: anon/authenticated/PUBLIC can execute the probe function';
  END IF;

  -- Explicitly test that the global PUBLIC EXECUTE default is gone outside
  -- public too. No service_role expectation is asserted for private.
  IF has_function_privilege('anon', v_private_function, 'EXECUTE')
     OR has_function_privilege('authenticated', v_private_function, 'EXECUTE')
     OR EXISTS (
       SELECT 1
       FROM pg_proc p
       CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
       WHERE p.oid = v_private_function AND a.grantee = 0 AND a.privilege_type = 'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'FAIL: anon/authenticated/PUBLIC can execute the private-schema probe function';
  END IF;

  -- Preserve every expected service_role privilege from the captured defaults.
  IF NOT has_table_privilege('service_role', v_table, 'SELECT')
     OR NOT has_table_privilege('service_role', v_table, 'INSERT')
     OR NOT has_table_privilege('service_role', v_table, 'UPDATE')
     OR NOT has_table_privilege('service_role', v_table, 'DELETE')
     OR NOT has_table_privilege('service_role', v_table, 'TRUNCATE')
     OR NOT has_table_privilege('service_role', v_table, 'REFERENCES')
     OR NOT has_table_privilege('service_role', v_table, 'TRIGGER')
     OR NOT has_table_privilege('service_role', v_table, 'MAINTAIN')
     OR NOT has_sequence_privilege('service_role', v_sequence, 'USAGE')
     OR NOT has_sequence_privilege('service_role', v_sequence, 'SELECT')
     OR NOT has_sequence_privilege('service_role', v_sequence, 'UPDATE')
     OR NOT has_function_privilege('service_role', v_function, 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: service_role lost one or more expected default privileges';
  END IF;
END;
$assert$;

-- Expected before ROLLBACK:
-- anon/authenticated/PUBLIC effective privileges on probe objects = none.
-- service_role retains all 8 table, 3 sequence, and public function EXECUTE privileges.
-- private function checks the global PUBLIC EXECUTE default; service_role is informational there.
ROLLBACK;

-- Run after rollback and retain the three true results as the cleanup check.
SELECT
  to_regclass('public.__phase0_acl_probe_table_20261113') IS NULL AS table_removed,
  to_regclass('public.__phase0_acl_probe_sequence_20261113') IS NULL AS sequence_removed,
  to_regprocedure('public.__phase0_acl_probe_function_20261113()') IS NULL AS public_function_removed,
  to_regprocedure('private.__phase0_acl_probe_function_20261114()') IS NULL AS private_function_removed;
