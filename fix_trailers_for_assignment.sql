-- Fix trailers for load assignment
-- Run this in your Supabase SQL editor

-- First, check current state
SELECT 
  'Current trailer status distribution:' as info,
  status, 
  COUNT(*) as count
FROM trailers
GROUP BY status
UNION ALL
SELECT 
  'Trailers by equipment type:' as info,
  et.name,
  COUNT(t.id)
FROM trailers t
LEFT JOIN equipment_types et ON t.equipment_type_id = et.id
GROUP BY et.name
ORDER BY info, status;

-- Fix 1: Ensure all trailers have 'Available' status (unless they should be in use)
UPDATE trailers 
SET status = 'Available' 
WHERE status IS NULL OR status = '';

-- Fix 2: If you have trailers without equipment_type_id, assign them to common types
-- Update trailers without equipment type to 'Hopper Bottom' (ID 1)
UPDATE trailers 
SET equipment_type_id = 1 
WHERE equipment_type_id IS NULL;

-- Fix 3: Verify trailers now have valid data
SELECT 
  t.id,
  t.trailer_number,
  t.status,
  t.equipment_type_id,
  et.name as equipment_type_name
FROM trailers t
LEFT JOIN equipment_types et ON t.equipment_type_id = et.id
WHERE t.status = 'Available'
ORDER BY t.trailer_number;
