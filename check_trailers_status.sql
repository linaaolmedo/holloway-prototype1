-- Check current trailer status and equipment types
-- Run this in your Supabase SQL editor

-- Check all trailers and their statuses
SELECT 
  t.id,
  t.trailer_number,
  t.status,
  t.equipment_type_id,
  et.name as equipment_type_name
FROM trailers t
LEFT JOIN equipment_types et ON t.equipment_type_id = et.id
ORDER BY t.trailer_number;

-- Count trailers by status
SELECT status, COUNT(*) as count
FROM trailers
GROUP BY status;

-- Check if any trailers have 'Available' status
SELECT COUNT(*) as available_trailers_count
FROM trailers
WHERE status = 'Available';

-- If no trailers are available, update them to be available
-- UPDATE trailers SET status = 'Available' WHERE status != 'Available';
