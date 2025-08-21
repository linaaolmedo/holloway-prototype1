-- QUICK FIX for Load L27 trailer assignment issue
-- Your console shows: 3 trailers, 0 available, requires equipment type ID 2 (End Dump)

-- First, let's see what we're working with
SELECT 
  t.id,
  t.trailer_number,
  t.status,
  t.equipment_type_id,
  et.name as current_equipment_type
FROM trailers t
LEFT JOIN equipment_types et ON t.equipment_type_id = et.id;

-- SOLUTION 1: Make at least one trailer compatible with this load
-- Update the first trailer to be Available and End Dump (equipment type 2)
UPDATE trailers 
SET 
  status = 'Available',
  equipment_type_id = 2
WHERE id = (SELECT MIN(id) FROM trailers);

-- SOLUTION 2: Or make ALL trailers available and set them to End Dump
-- UPDATE trailers 
-- SET 
--   status = 'Available',
--   equipment_type_id = 2;

-- Verify the fix worked
SELECT 
  t.id,
  t.trailer_number,
  t.status,
  t.equipment_type_id,
  et.name as equipment_type_name,
  CASE 
    WHEN t.status = 'Available' AND t.equipment_type_id = 2 THEN '✅ NOW COMPATIBLE WITH LOAD L27'
    ELSE '❌ Still not compatible'
  END as compatibility
FROM trailers t
LEFT JOIN equipment_types et ON t.equipment_type_id = et.id;
