-- Phase 0 forward-only migration: protect both cash-box opening balances and
-- align added_by FK deletion behavior with the trigger/migration intent.
-- Target: TrainerPro / urmkcixqpoqkiosihhal.
--
-- Confirmed supplied live state:
--   * opening_balance is immutable in the trigger.
--   * opening_balance_usd is not immutable in the trigger.
--   * added_by is nullable, but the live FK is NO ACTION despite migrations
--     008 and 21171218 explicitly intending ON DELETE SET NULL.
--   * the trigger already permits only the old->NULL creator transition.
--
-- This migration changes no cash-box rows. It changes the FK action and
-- trigger code only. The existing added_by column default is deliberately
-- preserved; it is not needed to close the confirmed security gap.
-- Draft for staging validation only. Do not apply directly to production.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $preflight$
DECLARE
  v_deltype "char";
  v_confrelid oid;
  v_confupdtype "char";
  v_confmatchtype "char";
  v_condeferrable boolean;
  v_condeferred boolean;
  v_conkey smallint[];
  v_confkey smallint[];
  v_tgtype integer;
  v_tgenabled "char";
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'STOP: expected current_user=postgres, got %', current_user;
  END IF;

  IF to_regclass('public.cash_boxes') IS NULL
     OR to_regclass('auth.users') IS NULL
     OR to_regprocedure('public.prevent_cash_box_mutation()') IS NULL THEN
    RAISE EXCEPTION 'STOP: required cash-box table, Auth table, or trigger function is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cash_boxes'
      AND column_name = 'opening_balance' AND data_type = 'numeric'
      AND is_nullable = 'NO'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cash_boxes'
      AND column_name = 'opening_balance_usd' AND data_type = 'numeric'
      AND is_nullable = 'NO'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cash_boxes'
      AND column_name = 'added_by' AND data_type = 'uuid'
      AND is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION 'STOP: audited cash_boxes column types/nullability have changed';
  END IF;


  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cash_boxes'
      AND column_name = 'added_by'
      AND column_default IS NOT NULL
      AND column_default NOT ILIKE '%auth.uid%'
  ) THEN
    RAISE EXCEPTION 'STOP: cash_boxes.added_by has an unexpected default; review before changing the FK';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'prevent_cash_box_mutation'
      AND p.pronargs = 0
      AND (p.prosecdef IS DISTINCT FROM false
           OR pg_get_userbyid(p.proowner) <> 'postgres')
  ) THEN
    RAISE EXCEPTION 'STOP: prevent_cash_box_mutation owner/security mode differs from the audited SECURITY INVOKER baseline';
  END IF;

  SELECT c.confdeltype, c.confrelid, c.confupdtype, c.confmatchtype,
         c.condeferrable, c.condeferred, c.conkey, c.confkey
    INTO v_deltype, v_confrelid, v_confupdtype, v_confmatchtype,
         v_condeferrable, v_condeferred, v_conkey, v_confkey
  FROM pg_constraint c
  WHERE c.conrelid = 'public.cash_boxes'::regclass
    AND c.conname = 'cash_boxes_added_by_fkey'
    AND c.contype = 'f';

  IF NOT FOUND OR v_confrelid <> 'auth.users'::regclass THEN
    RAISE EXCEPTION 'STOP: expected cash_boxes_added_by_fkey -> auth.users was not found';
  END IF;

  IF v_conkey IS DISTINCT FROM ARRAY(
       SELECT a.attnum::smallint FROM pg_attribute a
       WHERE a.attrelid = 'public.cash_boxes'::regclass AND a.attname = 'added_by'
         AND NOT a.attisdropped
     )
     OR v_confkey IS DISTINCT FROM ARRAY(
       SELECT a.attnum::smallint FROM pg_attribute a
       WHERE a.attrelid = 'auth.users'::regclass AND a.attname = 'id'
         AND NOT a.attisdropped
     )
     OR v_confupdtype <> 'a'
     OR v_confmatchtype <> 's'
     OR v_condeferrable IS DISTINCT FROM false
     OR v_condeferred IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'STOP: cash_boxes_added_by_fkey columns/update action/deferrability differ from the audited baseline';
  END IF;

  IF v_deltype NOT IN ('a', 'n') THEN
    RAISE EXCEPTION 'STOP: cash_boxes_added_by_fkey has unexpected ON DELETE action code %', v_deltype;
  END IF;

  SELECT t.tgtype, t.tgenabled
    INTO v_tgtype, v_tgenabled
  FROM pg_trigger t
  WHERE t.tgrelid = 'public.cash_boxes'::regclass
    AND t.tgname = 'trg_cash_boxes_immutability'
    AND NOT t.tgisinternal;

  IF NOT FOUND OR v_tgenabled NOT IN ('O', 'A')
     OR (v_tgtype & 1) <> 1       -- ROW
     OR (v_tgtype & 2) <> 2       -- BEFORE
     OR (v_tgtype & 4) <> 4       -- INSERT
     OR (v_tgtype & 8) <> 8       -- DELETE
     OR (v_tgtype & 16) <> 16    -- UPDATE
     OR (v_tgtype & 32) <> 0     -- not TRUNCATE
     OR (v_tgtype & 64) <> 0 THEN -- not INSTEAD OF
    RAISE EXCEPTION 'STOP: trg_cash_boxes_immutability is missing, disabled, or not the audited BEFORE ROW INSERT/UPDATE/DELETE trigger';
  END IF;
END;
$preflight$;

CREATE OR REPLACE FUNCTION public.prevent_cash_box_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
BEGIN
  -- On INSERT: validate both immutable opening balances and bind creator.
  IF TG_OP = 'INSERT' THEN
    IF NEW.opening_balance IS NULL OR NEW.opening_balance < 0.00 THEN
      RAISE EXCEPTION 'Opening balance cannot be null or negative.';
    END IF;

    IF NEW.opening_balance > 99999999.99 THEN
      RAISE EXCEPTION 'Opening balance exceeds maximum permitted numerical threshold (99,999,999.99).';
    END IF;

    IF NEW.opening_balance_usd IS NULL OR NEW.opening_balance_usd < 0.00 THEN
      RAISE EXCEPTION 'USD opening balance cannot be null or negative.';
    END IF;

    IF NEW.opening_balance_usd > 99999999.99 THEN
      RAISE EXCEPTION 'USD opening balance exceeds maximum permitted numerical threshold (99,999,999.99).';
    END IF;

    IF NEW.added_by IS NOT NULL AND NEW.added_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized: cannot assign added_by to another user identity; must match authenticated user.'
        USING ERRCODE = '42501';
    END IF;

    NEW.added_by := auth.uid();
    RETURN NEW;
  END IF;

  -- On DELETE: preserve soft-archive-only behavior.
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Direct deletion of cash boxes is prohibited; set is_active = false to archive.'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.cash_box_id IS DISTINCT FROM OLD.cash_box_id THEN
      RAISE EXCEPTION 'The primary key (cash_box_id) of a cash box cannot be altered.';
    END IF;

    IF NEW.opening_balance IS DISTINCT FROM OLD.opening_balance THEN
      RAISE EXCEPTION 'The EGP opening_balance of a cash box is immutable and cannot be modified after creation.';
    END IF;

    IF NEW.opening_balance_usd IS DISTINCT FROM OLD.opening_balance_usd THEN
      RAISE EXCEPTION 'The USD opening_balance_usd of a cash box is immutable and cannot be modified after creation.';
    END IF;

    -- Allow the FK's ON DELETE SET NULL action, but never creator reassignment.
    IF NEW.added_by IS DISTINCT FROM OLD.added_by
       AND NOT (OLD.added_by IS NOT NULL AND NEW.added_by IS NULL) THEN
      RAISE EXCEPTION 'The creator (added_by) of a cash box cannot be altered.';
    END IF;

    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'The creation timestamp (created_at) of a cash box cannot be altered.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.prevent_cash_box_mutation() IS
  'Guards cash_boxes against deletion, invalid opening balances, creator reassignment, and post-creation changes to either EGP or USD opening balance; permits the FK-driven creator nullification required by ON DELETE SET NULL.';

-- Repair the FK action. If it is already SET NULL, leave it untouched.
DO $fk_fix$
DECLARE
  v_deltype "char";
BEGIN
  SELECT c.confdeltype INTO v_deltype
  FROM pg_constraint c
  WHERE c.conrelid = 'public.cash_boxes'::regclass
    AND c.conname = 'cash_boxes_added_by_fkey'
    AND c.contype = 'f';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STOP: cash_boxes_added_by_fkey disappeared after preflight';
  ELSIF v_deltype = 'a' THEN
    ALTER TABLE public.cash_boxes
      DROP CONSTRAINT cash_boxes_added_by_fkey;

    ALTER TABLE public.cash_boxes
      ADD CONSTRAINT cash_boxes_added_by_fkey
      FOREIGN KEY (added_by)
      REFERENCES auth.users(id)
      ON DELETE SET NULL
      NOT VALID;
  ELSIF v_deltype <> 'n' THEN
    RAISE EXCEPTION 'STOP: unexpected FK action during repair: %', v_deltype;
  END IF;
END;
$fk_fix$;

ALTER TABLE public.cash_boxes
  VALIDATE CONSTRAINT cash_boxes_added_by_fkey;

-- Preserve the live added_by default exactly as found. The INSERT trigger
-- overwrites/binds this value to auth.uid(), so no schema-default change is
-- needed for the security fix.

DO $postflight$
DECLARE
  v_deltype "char";
  v_convalidated boolean;
  v_tgtype integer;
  v_tgenabled "char";
BEGIN
  SELECT c.confdeltype, c.convalidated
    INTO v_deltype, v_convalidated
  FROM pg_constraint c
  WHERE c.conrelid = 'public.cash_boxes'::regclass
    AND c.conname = 'cash_boxes_added_by_fkey'
    AND c.contype = 'f';

  IF NOT FOUND OR v_deltype <> 'n' OR v_convalidated IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'POSTFLIGHT FAILED: added_by FK is not validated ON DELETE SET NULL';
  END IF;

  SELECT t.tgtype, t.tgenabled
    INTO v_tgtype, v_tgenabled
  FROM pg_trigger t
  WHERE t.tgrelid = 'public.cash_boxes'::regclass
    AND t.tgname = 'trg_cash_boxes_immutability'
    AND NOT t.tgisinternal;

  IF NOT FOUND OR v_tgenabled NOT IN ('O', 'A')
     OR (v_tgtype & 1) <> 1
     OR (v_tgtype & 2) <> 2
     OR (v_tgtype & 4) <> 4
     OR (v_tgtype & 8) <> 8
     OR (v_tgtype & 16) <> 16 THEN
    RAISE EXCEPTION 'POSTFLIGHT FAILED: immutability trigger wiring changed unexpectedly';
  END IF;

  IF pg_get_functiondef('public.prevent_cash_box_mutation()'::regprocedure)
       NOT ILIKE '%opening_balance_usd%'
     OR pg_get_functiondef('public.prevent_cash_box_mutation()'::regprocedure)
       NOT ILIKE '%99,999,999.99%' THEN
    RAISE EXCEPTION 'POSTFLIGHT FAILED: USD opening-balance guards are incomplete';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.oid = 'public.prevent_cash_box_mutation()'::regprocedure
      AND (p.prosecdef IS DISTINCT FROM false
           OR pg_get_userbyid(p.proowner) <> 'postgres'
           OR NOT EXISTS (
             SELECT 1 FROM unnest(p.proconfig) AS cfg(setting)
             WHERE cfg.setting = 'search_path=pg_catalog, public'
           ))
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FAILED: trigger function owner/security/search_path changed unexpectedly';
  END IF;
END;
$postflight$;

COMMIT;