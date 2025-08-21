-- Debug the specific trailer assignment issue
-- Based on console showing: 3 trailers total, 0 available, required equipment type ID 2

-- Step 1: Check what equipment type ID 2 is
SELECT id, name FROM equipment_types WHERE id = 2;

-- Step 2: Check your 3 trailers - their status and equipment type
SELECT 
  t.id,
  t.trailer_number,
  t.status,
  t.equipment_type_id,
  et.name as equipment_type_name,
  CASE 
    WHEN t.status = 'Available' AND t.equipment_type_id = 2 THEN '✅ MATCHES CRITERIA'
    WHEN t.status != 'Available' THEN '❌ WRONG STATUS: ' || t.status
    WHEN t.equipment_type_id != 2 THEN '❌ WRONG EQUIPMENT TYPE: ' || COALESCE(et.name, 'NULL')
    ELSE '❌ OTHER ISSUE'
  END as filter_result
FROM trailers t
LEFT JOIN equipment_types et ON t.equipment_type_id = et.id
ORDER BY t.id;

-- Step 3: Quick fix - if you want to make trailers work for this load:
-- Option A: Change trailer equipment types to match (ID 2)
-- UPDATE trailers SET equipment_type_id = 2 WHERE equipment_type_id != 2;

-- Option B: Make sure all trailers are Available status
-- UPDATE trailers SET status = 'Available' WHERE status != 'Available';

-- Step 4: Check what this specific load (L27) requires
-- SELECT equipment_type_id, et.name as required_equipment
-- FROM loads l
-- LEFT JOIN equipment_types et ON l.equipment_type_id = et.id  
-- WHERE l.id = 27;
