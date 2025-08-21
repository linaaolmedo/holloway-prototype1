-- Quick Fix for Fleet Status Issues
-- Run this in your Supabase SQL editor

-- Fix trucks: Set to 'Available' if not assigned to active loads
UPDATE trucks 
SET status = 'Available',
    updated_at = NOW()
WHERE status != 'Maintenance' 
  AND id NOT IN (
    SELECT DISTINCT truck_id 
    FROM loads 
    WHERE truck_id IS NOT NULL 
      AND status IN ('Pending Pickup', 'In Transit')
  );

-- Fix trailers: Set to 'Available' if not assigned to active loads  
UPDATE trailers
SET status = 'Available',
    updated_at = NOW()
WHERE status != 'Maintenance'
  AND id NOT IN (
    SELECT DISTINCT trailer_id
    FROM loads 
    WHERE trailer_id IS NOT NULL 
      AND status IN ('Pending Pickup', 'In Transit')
  );

-- Verify the fix
SELECT 'Available Trucks' as resource, COUNT(*) as count FROM trucks WHERE status = 'Available'
UNION ALL
SELECT 'Available Trailers' as resource, COUNT(*) as count FROM trailers WHERE status = 'Available';
