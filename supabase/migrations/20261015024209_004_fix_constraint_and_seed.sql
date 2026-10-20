/*
# Fix cash_boxes box_type constraint and seed default boxes

1. Changes
- Alter the check constraint on cash_boxes.box_type to include 'Bank' type
- Seed 3 default cash boxes

2. Notes
- The original constraint only allowed Main/Branch/Online/Petty Cash
- Adding 'Bank' to support InstaPay/Bank box as specified in the design
*/

ALTER TABLE cash_boxes DROP CONSTRAINT IF EXISTS cash_boxes_box_type_check;
ALTER TABLE cash_boxes ADD CONSTRAINT cash_boxes_box_type_check
  CHECK (box_type IN ('Main', 'Branch', 'Online', 'Petty Cash', 'Bank'));

INSERT INTO cash_boxes (name, box_type, owner, opening_balance) VALUES
  ('الخزنة الرئيسية (الكاش)', 'Main', 'م/ أحمد الفلاح', 0),
  ('فودافون كاش', 'Online', 'م/ أحمد الفلاح', 0),
  ('إنستاباي / البنك', 'Bank', 'م/ أحمد الفلاح', 0)
ON CONFLICT DO NOTHING;
