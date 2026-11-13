-- Migration 008 uses ON DELETE SET NULL for cash_boxes.added_by.
-- Permit that FK-driven nullification while keeping creator reassignment prohibited.
BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.prevent_cash_box_mutation()') IS NULL THEN
    RAISE EXCEPTION 'Migration 008 is required: public.prevent_cash_box_mutation() does not exist.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cash_boxes'
      AND column_name = 'added_by' AND data_type = 'uuid' AND is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION 'Migration 008 prerequisite failed: public.cash_boxes.added_by (nullable uuid) does not exist.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.cash_boxes'::regclass
      AND tgname = 'trg_cash_boxes_immutability'
      AND tgenabled <> 'D'
  ) THEN
    RAISE EXCEPTION 'Migration 008 prerequisite failed: trg_cash_boxes_immutability is not bound or enabled on public.cash_boxes.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_cash_box_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- On INSERT: validate opening balance, reject spoofed added_by, bind creator identity.
  IF TG_OP = 'INSERT' THEN
    IF NEW.opening_balance IS NULL OR NEW.opening_balance < 0.00 THEN
      RAISE EXCEPTION 'Opening balance cannot be null or negative.';
    END IF;

    IF NEW.opening_balance > 99999999.99 THEN
      RAISE EXCEPTION 'Opening balance exceeds maximum permitted numerical threshold (99,999,999.99).';
    END IF;

    IF NEW.added_by IS NOT NULL AND NEW.added_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized: cannot assign added_by to another user identity; must match authenticated user.'
        USING ERRCODE = '42501';
    END IF;

    NEW.added_by := auth.uid();
    RETURN NEW;
  END IF;

  -- On DELETE: block hard deletion; cash boxes are archived with is_active = false.
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Direct deletion of cash boxes is prohibited; set is_active = false to archive.'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.cash_box_id IS DISTINCT FROM OLD.cash_box_id THEN
      RAISE EXCEPTION 'The primary key (cash_box_id) of a cash box cannot be altered.';
    END IF;
    IF NEW.opening_balance IS DISTINCT FROM OLD.opening_balance THEN
      RAISE EXCEPTION 'The opening_balance of a cash box is immutable and cannot be modified after creation.';
    END IF;
    -- The FK's ON DELETE SET NULL action must be allowed, but never reassign a creator.
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
$$;

COMMENT ON FUNCTION public.prevent_cash_box_mutation() IS
  'Guards cash_boxes against deletion, invalid opening balances, creator reassignment, and changes to immutable fields; permits ON DELETE SET NULL for the creator foreign key.';

COMMIT;
