-- STAGING ONLY: verifies default privileges by creating disposable probe objects.
-- The whole transaction is rolled back; do not run on Production.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '20s';

DO $guard$
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'STOP: run this probe as postgres on an isolated Staging database only';
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

SELECT
  has_table_privilege('anon', 'public.__phase0_acl_probe_table_20261113', 'SELECT') AS anon_table_select,
  has_table_privilege('authenticated', 'public.__phase0_acl_probe_table_20261113', 'INSERT') AS authenticated_table_insert,
  has_table_privilege('service_role', 'public.__phase0_acl_probe_table_20261113', 'SELECT') AS service_role_table_select,
  has_sequence_privilege('anon', 'public.__phase0_acl_probe_sequence_20261113', 'USAGE') AS anon_sequence_usage,
  has_sequence_privilege('authenticated', 'public.__phase0_acl_probe_sequence_20261113', 'UPDATE') AS authenticated_sequence_update,
  has_sequence_privilege('service_role', 'public.__phase0_acl_probe_sequence_20261113', 'USAGE') AS service_role_sequence_usage,
  has_function_privilege('anon', 'public.__phase0_acl_probe_function_20261113()', 'EXECUTE') AS anon_function_execute,
  has_function_privilege('authenticated', 'public.__phase0_acl_probe_function_20261113()', 'EXECUTE') AS authenticated_function_execute,
  has_function_privilege('service_role', 'public.__phase0_acl_probe_function_20261113()', 'EXECUTE') AS service_role_function_execute;

SELECT
  CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS grantee,
  a.privilege_type
FROM pg_proc p
CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
WHERE p.oid = 'public.__phase0_acl_probe_function_20261113()'::regprocedure
ORDER BY 1, 2;

DO $assert$
BEGIN
  IF has_table_privilege('anon', 'public.__phase0_acl_probe_table_20261113', 'SELECT')
     OR has_table_privilege('authenticated', 'public.__phase0_acl_probe_table_20261113', 'INSERT')
     OR has_sequence_privilege('anon', 'public.__phase0_acl_probe_sequence_20261113', 'USAGE')
     OR has_sequence_privilege('authenticated', 'public.__phase0_acl_probe_sequence_20261113', 'UPDATE')
     OR has_function_privilege('anon', 'public.__phase0_acl_probe_function_20261113()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.__phase0_acl_probe_function_20261113()', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: anon/authenticated inherited a privilege on a probe object';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.__phase0_acl_probe_table_20261113', 'SELECT')
     OR NOT has_sequence_privilege('service_role', 'public.__phase0_acl_probe_sequence_20261113', 'USAGE')
     OR NOT has_function_privilege('service_role', 'public.__phase0_acl_probe_function_20261113()', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: expected service_role defaults were not preserved';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
    WHERE p.oid = 'public.__phase0_acl_probe_function_20261113()'::regprocedure
      AND a.grantee = 0
      AND a.privilege_type = 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'FAIL: PUBLIC still has EXECUTE on a postgres-created probe function';
  END IF;
END;
$assert$;

-- Expected:
-- anon/authenticated table, sequence, and function checks = false.
-- service_role table SELECT, sequence USAGE, function EXECUTE = true.
-- No PUBLIC EXECUTE ACL row for the probe function.
ROLLBACK;
