-- =====================================================================
-- Diagnose and Fix Fleet Status Issues for Load Assignment
-- Run this in your Supabase SQL editor to identify and fix status problems
-- =====================================================================

-- 1. DIAGNOSE CURRENT STATUS VALUES
SELECT '=== TRUCK STATUS ANALYSIS ===' as analysis;

-- Check all truck statuses
SELECT 'Current truck statuses:' as info;
SELECT 
    status,
    COUNT(*) as count,
    STRING_AGG(truck_number, ', ' ORDER BY truck_number) as truck_numbers
FROM trucks
GROUP BY status
ORDER BY count DESC;

-- Show trucks that should be available
SELECT 'Trucks that could be set to Available:' as info;
SELECT 
    id,
    truck_number,
    license_plate,
    status,
    maintenance_due
FROM trucks
WHERE status NOT IN ('In Use') 
   OR status IS NULL
ORDER BY truck_number;

-- 2. TRAILER STATUS ANALYSIS
SELECT '=== TRAILER STATUS ANALYSIS ===' as analysis;

-- Check all trailer statuses  
SELECT 'Current trailer statuses:' as info;
SELECT 
    status,
    COUNT(*) as count,
    STRING_AGG(trailer_number, ', ' ORDER BY trailer_number) as trailer_numbers
FROM trailers
GROUP BY status
ORDER BY count DESC;

-- Show trailers that should be available
SELECT 'Trailers that could be set to Available:' as info;
SELECT 
    t.id,
    t.trailer_number,
    t.license_plate,
    t.status,
    et.name as equipment_type,
    t.maintenance_due
FROM trailers t
LEFT JOIN equipment_types et ON t.equipment_type_id = et.id
WHERE t.status NOT IN ('In Use')
   OR t.status IS NULL
ORDER BY t.trailer_number;

-- 3. CHECK FOR LOADS USING THESE RESOURCES
SELECT '=== ACTIVE LOAD ASSIGNMENTS ===' as analysis;

SELECT 'Trucks currently assigned to active loads:' as info;
SELECT DISTINCT
    t.truck_number,
    t.status as truck_status,
    l.id as load_id,
    l.status as load_status
FROM trucks t
JOIN loads l ON l.truck_id = t.id
WHERE l.status IN ('Pending Pickup', 'In Transit')
ORDER BY t.truck_number;

SELECT 'Trailers currently assigned to active loads:' as info;
SELECT DISTINCT
    tr.trailer_number,
    tr.status as trailer_status,
    l.id as load_id,
    l.status as load_status
FROM trailers tr
JOIN loads l ON l.trailer_id = tr.id
WHERE l.status IN ('Pending Pickup', 'In Transit')
ORDER BY tr.trailer_number;

-- 4. FIX STATUS VALUES
SELECT '=== FIXING STATUS VALUES ===' as analysis;

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

-- 5. VERIFY FIXES
SELECT '=== VERIFICATION AFTER FIX ===' as analysis;

SELECT 'Updated truck status distribution:' as info;
SELECT 
    status,
    COUNT(*) as count
FROM trucks
GROUP BY status
ORDER BY count DESC;

SELECT 'Updated trailer status distribution:' as info;
SELECT 
    status,
    COUNT(*) as count
FROM trailers
GROUP BY status
ORDER BY count DESC;

-- 6. SHOW AVAILABLE RESOURCES FOR LOAD ASSIGNMENT
SELECT '=== AVAILABLE RESOURCES FOR ASSIGNMENT ===' as analysis;

SELECT 'Available trucks ready for assignment:' as info;
SELECT 
    id,
    truck_number,
    license_plate,
    status,
    maintenance_due
FROM trucks
WHERE status = 'Available'
ORDER BY truck_number
LIMIT 10;

SELECT 'Available trailers ready for assignment:' as info;
SELECT 
    t.id,
    t.trailer_number,
    t.license_plate,
    t.status,
    et.name as equipment_type,
    t.maintenance_due
FROM trailers t
LEFT JOIN equipment_types et ON t.equipment_type_id = et.id
WHERE t.status = 'Available'
ORDER BY t.trailer_number
LIMIT 10;

-- 7. COUNT SUMMARY
SELECT 'FINAL SUMMARY:' as summary;
SELECT 
    'Available Trucks' as resource_type,
    COUNT(*) as available_count
FROM trucks
WHERE status = 'Available'
UNION ALL
SELECT 
    'Available Trailers' as resource_type,
    COUNT(*) as available_count
FROM trailers
WHERE status = 'Available'
UNION ALL
SELECT 
    'Trucks In Use' as resource_type,
    COUNT(*) as available_count
FROM trucks
WHERE status = 'In Use'
UNION ALL
SELECT 
    'Trailers In Use' as resource_type,
    COUNT(*) as available_count
FROM trailers
WHERE status = 'In Use'
UNION ALL
SELECT 
    'Trucks in Maintenance' as resource_type,
    COUNT(*) as available_count
FROM trucks
WHERE status = 'Maintenance'
UNION ALL
SELECT 
    'Trailers in Maintenance' as resource_type,
    COUNT(*) as available_count
FROM trailers
WHERE status = 'Maintenance';
