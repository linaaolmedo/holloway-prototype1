-- Debug Fleet Data Loading Issues
-- Run this in your Supabase SQL editor to diagnose why trucks aren't showing

-- 1. CHECK IF TRUCKS EXIST IN DATABASE
SELECT '=== BASIC TRUCK DATA CHECK ===' as info;

SELECT 
    'Total trucks in database:' as check_type,
    COUNT(*) as count
FROM trucks;

SELECT 
    'Trucks with data:' as check_type,
    id,
    truck_number,
    license_plate,
    status,
    created_at
FROM trucks
ORDER BY truck_number
LIMIT 10;

-- 2. CHECK RLS (ROW LEVEL SECURITY) POLICIES
SELECT '=== RLS POLICY CHECK ===' as info;

-- Show RLS policies for trucks table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'trucks';

-- Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'trucks' 
AND schemaname = 'public';

-- 3. TEST ACTUAL QUERY THAT FLEETSERVICE USES
SELECT '=== TESTING FLEETSERVICE QUERY ===' as info;

-- This is the exact query that searchTrucks uses
SELECT 
    trucks.*,
    drivers.id as driver_id,
    drivers.name as driver_name,
    drivers.status as driver_status
FROM trucks
LEFT JOIN drivers ON trucks.id = drivers.truck_id
ORDER BY truck_number;

-- 4. CHECK AUTHENTICATION CONTEXT
SELECT '=== AUTH CONTEXT CHECK ===' as info;

-- Check current user context
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 5. TEST WITH DIFFERENT QUERIES
SELECT '=== ALTERNATIVE QUERIES ===' as info;

-- Simple trucks query
SELECT 'Simple trucks query:' as test_type, COUNT(*) as count FROM trucks;

-- Query without JOIN
SELECT 
    'Trucks without JOIN:' as test_type,
    COUNT(*) as count
FROM trucks;

-- Query with specific status
SELECT 
    'Available trucks:' as test_type,
    COUNT(*) as count
FROM trucks
WHERE status = 'Available';

SELECT 
    'In Use trucks:' as test_type,
    COUNT(*) as count
FROM trucks
WHERE status = 'In Use';

-- 6. SHOW RECENT TRUCKS DATA
SELECT '=== RECENT TRUCKS SAMPLE ===' as info;

SELECT 
    truck_number,
    status,
    created_at,
    updated_at
FROM trucks
ORDER BY updated_at DESC
LIMIT 5;

-- 7. CHECK FOR NULL OR EMPTY VALUES
SELECT '=== DATA QUALITY CHECK ===' as info;

SELECT 
    'Trucks with null truck_number:' as issue,
    COUNT(*) as count
FROM trucks
WHERE truck_number IS NULL;

SELECT 
    'Trucks with empty truck_number:' as issue,
    COUNT(*) as count
FROM trucks
WHERE truck_number = '';

SELECT 
    'Trucks with null status:' as issue,
    COUNT(*) as count
FROM trucks
WHERE status IS NULL;

-- 8. FINAL SUMMARY
SELECT '=== SUMMARY ===' as info;

SELECT 
    status,
    COUNT(*) as count,
    STRING_AGG(truck_number, ', ' ORDER BY truck_number) as trucks
FROM trucks
GROUP BY status
ORDER BY count DESC;
