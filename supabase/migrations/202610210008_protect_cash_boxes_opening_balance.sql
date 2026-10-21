-- ============================================================================
-- 🏛️ Migration 008: Protect Cash Boxes Opening Balance & Audited Creation RPC
-- Elmasry Academy LMS — Financial Ledger Integrity Hardening
-- Lead Architect: Eng. Ahmed El-Falah (م/ أحمد الفلاح)
-- Date: 21 October 2026
-- Reviewer: OpenCode (DeepSeek 4.1) Peer Reviewed
-- ============================================================================
-- PURPOSE:
-- 1. Preflight check: verify live schema with cash_box_id, type, is_active, opening_balance.
-- 2. Add `added_by` column to `cash_boxes` (ON DELETE SET NULL, WITHOUT DEFAULT)
--    so legacy historical records retain NULL (unattributed) rather than falsely
--    attributing legacy records to the administrator executing this migration.
-- 3. Trigger `trg_cash_boxes_immutability` (SECURITY INVOKER):
--    - Enforces opening_balance >= 0 and finite on INSERT.
--    - Rejects spoofed added_by and forces NEW.added_by := auth.uid().
--    - Blocks hard DELETE (mandating soft-delete via is_active = false).
--    - Freezes opening_balance, added_by, cash_box_id, and created_at on UPDATE.
-- 4. Audited RPC `create_cash_box()` with SECURITY DEFINER, safe search_path,
--    and explicit is_admin() authorization gating.
-- 5. Multi-layered Table & Column Privileges Lockdown (Defense-in-Depth):
--    - In PostgreSQL, table-level and column-level privileges are cumulative (union).
--    - Migration 007 previously granted table-level UPDATE on cash_boxes to authenticated.
--    - To enforce column-level protection on opening_balance, table-level UPDATE
--      MUST be explicitly revoked before granting column-specific UPDATE.
--    - Revoke table-level INSERT, UPDATE, DELETE, TRUNCATE from authenticated, anon, PUBLIC.
--    - Explicitly revoke column-level UPDATE on sensitive/protected columns.
--    - Grant table-level SELECT and column-level UPDATE strictly on operational fields:
--      (name, type, owner, is_active, notes).
-- ============================================================================

BEGIN;

-- Preflight: Fail fast if pointed at a legacy 001 schema missing canonical cash_box_id
DO $preflight$
BEGIN
  IF to_regclass('public.cash_boxes') IS NULL THEN
    RAISE EXCEPTION 'Migration 008 preflight failed: table public.cash_boxes does not exist.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cash_boxes' AND column_name = 'cash_box_id'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cash_boxes' AND column_name = 'opening_balance'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cash_boxes' AND column_name = 'is_active'
  ) THEN
    RAISE EXCEPTION 'Migration 008 preflight failed: expected cash_box_id, opening_balance, and is_active columns matching canonical schema.';
  END IF;

  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'Migration 008 preflight failed: required authorization function public.is_admin() is missing.';
  END IF;
END;
$preflight$;

-- Step 1: Add added_by tracking column to cash_boxes if not present (WITHOUT DEFAULT)
ALTER TABLE public.cash_boxes 
  ADD COLUMN IF NOT EXISTS added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.cash_boxes.added_by IS
  'UUID of administrator who created this cash box. NULL for legacy records created prior to Migration 008.';

-- Step 2: Trigger Function (SECURITY INVOKER - executes with caller privileges)
CREATE OR REPLACE FUNCTION public.prevent_cash_box_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- 1. On INSERT: Validate opening balance, reject spoofed added_by, bind creator identity
  IF TG_OP = 'INSERT' THEN
    IF NEW.opening_balance IS NULL OR NEW.opening_balance < 0.00 THEN
      RAISE EXCEPTION 'Opening balance cannot be null or negative.';
    END IF;

    IF NEW.opening_balance > 99999999.99 THEN
      RAISE EXCEPTION 'Opening balance exceeds maximum permitted numerical threshold (99,999,999.99).';
    END IF;

    -- Security Enforcement: Reject any explicit added_by that differs from caller identity
    IF NEW.added_by IS NOT NULL AND NEW.added_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized: cannot assign added_by to another user identity; must match authenticated user.'
        USING ERRCODE = '42501';
    END IF;

    -- Enforce caller identity
    NEW.added_by := auth.uid();
    RETURN NEW;
  END IF;

  -- 2. On DELETE: Block hard deletion (soft-delete via is_active = false is required)
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Direct deletion of cash boxes is prohibited; set is_active = false to archive.'
      USING ERRCODE = '42501';
  END IF;

  -- 3. On UPDATE: Prohibit modifying opening_balance, added_by, cash_box_id, or created_at
  IF TG_OP = 'UPDATE' THEN
    IF NEW.cash_box_id IS DISTINCT FROM OLD.cash_box_id THEN
      RAISE EXCEPTION 'The primary key (cash_box_id) of a cash box cannot be altered.';
    END IF;
    IF NEW.opening_balance IS DISTINCT FROM OLD.opening_balance THEN
      RAISE EXCEPTION 'The opening_balance of a cash box is immutable and cannot be modified after creation.';
    END IF;
    IF NEW.added_by IS DISTINCT FROM OLD.added_by THEN
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
  'SECURITY INVOKER trigger function guarding cash_boxes against DELETE, invalid initial balances, spoofed added_by, and post-creation UPDATE to opening_balance.';

-- Step 3: Bind the Trigger to cash_boxes (INSERT, UPDATE, DELETE)
DROP TRIGGER IF EXISTS trg_cash_boxes_immutability ON public.cash_boxes;

CREATE TRIGGER trg_cash_boxes_immutability
  BEFORE INSERT OR UPDATE OR DELETE ON public.cash_boxes
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_cash_box_mutation();

-- Step 4: Create Audited RPC for Cash Box Creation (SECURITY DEFINER with safe search_path)
CREATE OR REPLACE FUNCTION public.create_cash_box(
  p_name varchar,
  p_type varchar DEFAULT 'Main',
  p_owner varchar DEFAULT NULL,
  p_opening_balance numeric DEFAULT 0.00,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_box_id uuid;
BEGIN
  -- Strict administrative authorization gate
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only system administrators can create cash boxes.'
      USING ERRCODE = '42501';
  END IF;

  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Cash box name is required.';
  END IF;

  IF p_opening_balance IS NULL OR p_opening_balance < 0.00 THEN
    RAISE EXCEPTION 'Opening balance cannot be null or negative.';
  END IF;

  IF p_opening_balance > 99999999.99 THEN
    RAISE EXCEPTION 'Opening balance exceeds maximum permitted numerical threshold (99,999,999.99).';
  END IF;

  INSERT INTO public.cash_boxes (name, type, owner, opening_balance, notes, added_by)
  VALUES (
    trim(p_name),
    COALESCE(trim(p_type), 'Main'),
    trim(p_owner),
    COALESCE(p_opening_balance, 0.00),
    trim(p_notes),
    auth.uid()
  )
  RETURNING cash_box_id INTO v_box_id;

  RETURN v_box_id;
END;
$$;

COMMENT ON FUNCTION public.create_cash_box(varchar, varchar, varchar, numeric, text) IS
  'Audited administrative RPC for creating cash boxes with atomic validation and creator tracking via auth.uid().';

-- Secure the RPC execution grants: authenticated only
REVOKE ALL ON FUNCTION public.create_cash_box FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_cash_box TO authenticated;

-- Step 5: Table & Column Level Privileges Lockdown (Defense-in-Depth)
-- 1. Explicitly revoke table-level write privileges from authenticated, anon, PUBLIC.
--    NOTE: In PostgreSQL, table-level and column-level privileges are cumulative (union).
--    Migration 007 previously granted table-level `UPDATE` on public.cash_boxes to authenticated.
--    Granting column-level UPDATE on selected columns does NOT restrict an existing table-level UPDATE.
--    Therefore, table-level UPDATE MUST be explicitly revoked so that only column-level UPDATE grants apply.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.cash_boxes FROM authenticated, anon, PUBLIC;

-- 2. Explicitly remove any prior column-level UPDATE grants on protected columns (table-level was removed in Step 1)
REVOKE UPDATE (cash_box_id, opening_balance, added_by, created_at) ON TABLE public.cash_boxes FROM authenticated, anon, PUBLIC;

-- 3. Grant table-level SELECT for reading cash boxes
GRANT SELECT ON TABLE public.cash_boxes TO authenticated;

-- 4. Grant column-level UPDATE strictly on operational fields (defense-in-depth against trigger failure)
GRANT UPDATE (name, type, owner, is_active, notes) ON TABLE public.cash_boxes TO authenticated;

COMMIT;
