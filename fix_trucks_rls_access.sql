-- =====================================================================
-- Fix Trucks RLS Access Issues
-- This will allow the application to access trucks data
-- =====================================================================

-- 1. Check current RLS status
SELECT '=== CURRENT RLS STATUS ===' as info;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'trucks' 
AND schemaname = 'public';

-- Show current RLS policies for trucks
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'trucks';

-- 2. Create or update RLS policies for trucks table
-- Enable RLS if not already enabled
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "trucks_select_policy" ON trucks;
DROP POLICY IF EXISTS "trucks_insert_policy" ON trucks;  
DROP POLICY IF EXISTS "trucks_update_policy" ON trucks;
DROP POLICY IF EXISTS "trucks_delete_policy" ON trucks;

-- Create new policies that allow access to authenticated users
CREATE POLICY "trucks_select_policy" 
ON trucks FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "trucks_insert_policy" 
ON trucks FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "trucks_update_policy" 
ON trucks FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "trucks_delete_policy" 
ON trucks FOR DELETE 
TO authenticated 
USING (true);

-- 3. Do the same for trailers table (since you'll likely hit the same issue)
ALTER TABLE trailers ENABLE ROW LEVEL SECURITY;

-- Drop existing trailer policies
DROP POLICY IF EXISTS "trailers_select_policy" ON trailers;
DROP POLICY IF EXISTS "trailers_insert_policy" ON trailers;  
DROP POLICY IF EXISTS "trailers_update_policy" ON trailers;
DROP POLICY IF EXISTS "trailers_delete_policy" ON trailers;

-- Create trailer policies
CREATE POLICY "trailers_select_policy" 
ON trailers FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "trailers_insert_policy" 
ON trailers FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "trailers_update_policy" 
ON trailers FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "trailers_delete_policy" 
ON trailers FOR DELETE 
TO authenticated 
USING (true);

-- 4. Do the same for drivers table
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Drop existing driver policies
DROP POLICY IF EXISTS "drivers_select_policy" ON drivers;
DROP POLICY IF EXISTS "drivers_insert_policy" ON drivers;  
DROP POLICY IF EXISTS "drivers_update_policy" ON drivers;
DROP POLICY IF EXISTS "drivers_delete_policy" ON drivers;

-- Create driver policies
CREATE POLICY "drivers_select_policy" 
ON drivers FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "drivers_insert_policy" 
ON drivers FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "drivers_update_policy" 
ON drivers FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "drivers_delete_policy" 
ON drivers FOR DELETE 
TO authenticated 
USING (true);

-- 5. Verify the policies were created
SELECT '=== VERIFICATION ===' as info;

SELECT 
    'trucks' as table_name,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'trucks'
UNION ALL
SELECT 
    'trailers' as table_name,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'trailers'
UNION ALL
SELECT 
    'drivers' as table_name,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'drivers'
ORDER BY table_name, cmd;

-- 6. Test the queries that should now work
SELECT '=== TESTING ACCESS ===' as info;

-- Test trucks query (this should return data now)
SELECT 'Trucks query test:' as test, COUNT(*) as count FROM trucks;

-- Test the exact query the frontend uses
SELECT 'Frontend query test:' as test, COUNT(*) as count
FROM trucks
LEFT JOIN drivers ON trucks.id = drivers.truck_id;

-- Test trailers query
SELECT 'Trailers query test:' as test, COUNT(*) as count FROM trailers;

-- Test drivers query  
SELECT 'Drivers query test:' as test, COUNT(*) as count FROM drivers;

SELECT '=== SUCCESS! ===' as result;
SELECT 'Fleet data should now be accessible to authenticated users' as message;
