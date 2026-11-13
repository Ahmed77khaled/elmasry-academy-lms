-- Phase 0 forward-only migration: harden DEFAULT PRIVILEGES for objects created
-- by postgres. Target: TrainerPro / urmkcixqpoqkiosihhal.
--
-- Scope:
--   * Future TABLE/SEQUENCE/FUNCTION objects created by postgres in public.
--   * Also removes PostgreSQL's global default PUBLIC EXECUTE on future
--     postgres-created functions. PostgreSQL does not allow a schema-level
--     REVOKE to cancel a global default grant, so this one statement is global.
--
-- This does NOT change grants on existing objects. It does NOT touch
-- supabase_admin defaults. Existing RPC grants remain unchanged.
--
-- Draft for staging validation only. Do not apply directly to production.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $preflight$
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'STOP: expected current_user=postgres, got %', current_user;
  END IF;

  IF to_regnamespace('public') IS NULL THEN
    RAISE EXCEPTION 'STOP: public schema is missing';
  END IF;

  IF to_regrole('anon') IS NULL
     OR to_regrole('authenticated') IS NULL
     OR to_regrole('service_role') IS NULL THEN
    RAISE EXCEPTION 'STOP: one or more expected Supabase roles are missing';
  END IF;

  -- Schema-specific REVOKEs cannot cancel global default grants. None were
  -- present in the supplied audit. Stop if that fact has changed.
  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) a
    WHERE d.defaclrole = 'postgres'::regrole
      AND d.defaclnamespace = 0
      AND (d.defaclobjtype IN ('r', 'S')
           OR (d.defaclobjtype = 'f' AND a.grantee IN ('anon'::regrole, 'authenticated'::regrole)))
      AND a.grantee IN ('anon'::regrole, 'authenticated'::regrole, 0)
  ) THEN
    RAISE EXCEPTION 'STOP: unexpected global defaults to anon/authenticated/PUBLIC exist for TABLES/SEQUENCES or to anon/authenticated for FUNCTIONS; review cross-schema defaults first';
  END IF;

  -- Confirm the expected public-schema defaults are still present before
  -- removing them. A changed baseline needs fresh review, not blind migration.
  IF NOT EXISTS (
    SELECT 1 FROM pg_default_acl
    WHERE defaclrole = 'postgres'::regrole
      AND defaclnamespace = 'public'::regnamespace
      AND defaclobjtype = 'r'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_default_acl
    WHERE defaclrole = 'postgres'::regrole
      AND defaclnamespace = 'public'::regnamespace
      AND defaclobjtype = 'S'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_default_acl
    WHERE defaclrole = 'postgres'::regrole
      AND defaclnamespace = 'public'::regnamespace
      AND defaclobjtype = 'f'
  ) THEN
    RAISE EXCEPTION 'STOP: postgres public default ACL baseline differs from the supplied audit';
  END IF;
END;
$preflight$;

-- Remove broad future access from API roles on new objects in public.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated, PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated, PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- Remove schema-specific PUBLIC function grants if any have been added.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- PostgreSQL grants EXECUTE on newly-created functions to PUBLIC by default.
-- This is necessarily global for postgres-created functions: a per-schema
-- REVOKE cannot negate the global default. Existing functions are unaffected.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

DO $postflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) a
    WHERE d.defaclrole = 'postgres'::regrole
      AND d.defaclnamespace = 'public'::regnamespace
      AND d.defaclobjtype IN ('r', 'S', 'f')
      AND a.grantee IN ('anon'::regrole, 'authenticated'::regrole, 0)
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FAILED: anon/authenticated/PUBLIC still have postgres public-schema defaults';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) a
    WHERE d.defaclrole = 'postgres'::regrole
      AND d.defaclnamespace = 0
      AND d.defaclobjtype IN ('r', 'S', 'f')
      AND a.grantee IN ('anon'::regrole, 'authenticated'::regrole)
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FAILED: global defaults still grant to anon/authenticated';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) a
    WHERE d.defaclrole = 'postgres'::regrole
      AND d.defaclnamespace = 0
      AND d.defaclobjtype = 'f'
      AND a.grantee = 0
      AND a.privilege_type = 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FAILED: global PUBLIC EXECUTE default remains';
  END IF;

  -- Ensure service_role's complete explicit public defaults survived intact.
  IF (SELECT count(DISTINCT a.privilege_type)
      FROM pg_default_acl d
      CROSS JOIN LATERAL aclexplode(d.defaclacl) a
      WHERE d.defaclrole = 'postgres'::regrole
        AND d.defaclnamespace = 'public'::regnamespace
        AND d.defaclobjtype = 'r'
        AND a.grantee = 'service_role'::regrole) < 8
     OR (SELECT count(DISTINCT a.privilege_type)
         FROM pg_default_acl d
         CROSS JOIN LATERAL aclexplode(d.defaclacl) a
         WHERE d.defaclrole = 'postgres'::regrole
           AND d.defaclnamespace = 'public'::regnamespace
           AND d.defaclobjtype = 'S'
           AND a.grantee = 'service_role'::regrole) < 3
     OR (SELECT count(DISTINCT a.privilege_type)
         FROM pg_default_acl d
         CROSS JOIN LATERAL aclexplode(d.defaclacl) a
         WHERE d.defaclrole = 'postgres'::regrole
           AND d.defaclnamespace = 'public'::regnamespace
           AND d.defaclobjtype = 'f'
           AND a.grantee = 'service_role'::regrole
           AND a.privilege_type = 'EXECUTE') <> 1 THEN
    RAISE EXCEPTION 'POSTFLIGHT FAILED: service_role public default privileges were not preserved';
  END IF;
END;
$postflight$;

COMMIT;