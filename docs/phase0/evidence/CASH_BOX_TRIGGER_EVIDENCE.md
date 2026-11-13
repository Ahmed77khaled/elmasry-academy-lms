# Cash Box Trigger & Immutability Evidence — Elmasry Academy LMS

> **Target Supabase Project:** `urmkcixqpoqkiosihhal` (TrainerPro)  
> **Table:** `public.cash_boxes`  

## 1. Executive Summary
1. **Loophole Discovered:** `prevent_cash_box_mutation()` checks `opening_balance` (EGP) for immutability, but **completely omits checking `opening_balance_usd`**.
2. **Archival Support:** The trigger allows `UPDATE` of `is_active` (`false`), permitting `rbac_archive_cash_box` to function properly.
3. **Identity Binding:** The trigger forces `added_by := auth.uid()` on INSERT, preventing identity spoofing.
4. **Foreign Key ON DELETE Behavior:** `cash_boxes_added_by_fkey` is currently `NO ACTION` (`confdeltype: 'a'`).
5. **Trigger Status:** Both triggers (`trg_cash_boxes_immutability` and `trg_cash_boxes_archive_telegram_notification`) are `ENABLED (origin/local)`.

## 2. Column Definitions for Critical Cash Box Fields

| Column Name | Data Type | Nullable? | Default |
| --- | --- | --- | --- |
| opening_balance | numeric | NO | 0.00 |
| is_active | boolean | NO | true |
| added_by | uuid | YES | auth.uid() |
| opening_balance_usd | numeric | NO | 0 |

## 3. Triggers Attached to public.cash_boxes

| Trigger Name | Status | Timing | Level | Trigger Definition |
| --- | --- | --- | --- | --- |
| trg_cash_boxes_archive_telegram_notification | ENABLED (origin/local) | AFTER | STATEMENT | CREATE TRIGGER trg_cash_boxes_archive_telegram_notification AFTER UPDATE OF is_active ON public.cash_boxes FOR EACH ROW WHEN (((old.is_active IS TRUE) AND (new.is_active IS FALSE))) EXECUTE FUNCTION private.route_financial_telegram_notification() |
| trg_cash_boxes_immutability | ENABLED (origin/local) | BEFORE | ROW | CREATE TRIGGER trg_cash_boxes_immutability BEFORE INSERT OR DELETE OR UPDATE ON public.cash_boxes FOR EACH ROW EXECUTE FUNCTION prevent_cash_box_mutation() |

## 4. Foreign Key & Constraint Behavior

| Constraint Name | Definition | ON DELETE Type Code |
| --- | --- | --- |
| cash_boxes_added_by_fkey | FOREIGN KEY (added_by) REFERENCES auth.users(id) | a |

## 5. Full Source of public.prevent_cash_box_mutation()
```sql
CREATE OR REPLACE FUNCTION public.prevent_cash_box_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$

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

$function$
```