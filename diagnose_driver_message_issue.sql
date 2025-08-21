-- =====================================================================
-- Diagnostic Script: Driver Message RLS Issue
-- This script will help diagnose why drivers can't send messages
-- =====================================================================

BEGIN;

-- Print diagnostic header
DO $$
BEGIN
  RAISE NOTICE '=== Driver Message RLS Diagnostic ===';
END $$;

-- Step 1: Check RLS helper functions exist and work
DO $$
BEGIN
  RAISE NOTICE 'Step 1: Testing RLS helper functions...';
END $$;

-- Check if helper functions exist
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname IN ('get_user_role', 'get_user_driver_id', 'get_user_customer_id', 'get_user_carrier_id')
ORDER BY proname;

-- Step 2: Check current user context (if any user is logged in)
DO $$
BEGIN
  RAISE NOTICE 'Step 2: Checking current user context...';
END $$;

-- This will show null if no user is authenticated, which is expected in SQL console
SELECT 
  auth.uid() as current_auth_uid,
  'No user authenticated in SQL console' as note;

-- Step 3: Check all driver users and their profiles
DO $$
BEGIN
  RAISE NOTICE 'Step 3: Checking driver users and profiles...';
END $$;

SELECT 
  u.id as user_id,
  u.role,
  u.name as user_name,
  u.email,
  d.id as driver_id,
  d.name as driver_name,
  d.user_id as driver_user_id_ref
FROM users u
LEFT JOIN drivers d ON u.id = d.user_id
WHERE u.role = 'Driver'
ORDER BY u.name;

-- Step 4: Check load assignments for drivers
DO $$
BEGIN
  RAISE NOTICE 'Step 4: Checking load assignments for drivers...';
END $$;

SELECT 
  l.id as load_id,
  l.status,
  l.driver_id,
  d.name as driver_name,
  d.user_id as driver_user_id,
  u.name as user_name,
  u.email as user_email
FROM loads l
JOIN drivers d ON l.driver_id = d.id
JOIN users u ON d.user_id = u.id
WHERE l.driver_id IS NOT NULL
ORDER BY l.id DESC
LIMIT 10;

-- Step 5: Check load_messages table structure and recent messages
DO $$
BEGIN
  RAISE NOTICE 'Step 5: Checking load_messages table...';
END $$;

-- Check table structure
\d load_messages

-- Check recent messages
SELECT 
  lm.id,
  lm.load_id,
  lm.user_id,
  lm.message,
  lm.timestamp,
  u.name as user_name,
  u.role as user_role
FROM load_messages lm
JOIN users u ON lm.user_id = u.id
ORDER BY lm.timestamp DESC
LIMIT 10;

-- Step 6: Check RLS policies on load_messages
DO $$
BEGIN
  RAISE NOTICE 'Step 6: Checking RLS policies on load_messages...';
END $$;

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
WHERE tablename = 'load_messages'
ORDER BY policyname;

-- Step 7: Test if a specific driver user can access their assigned loads
DO $$
DECLARE
  test_user_id UUID;
  test_driver_id BIGINT;
  test_load_id BIGINT;
BEGIN
  RAISE NOTICE 'Step 7: Testing specific driver load access...';
  
  -- Get a driver user for testing
  SELECT u.id, d.id 
  INTO test_user_id, test_driver_id
  FROM users u 
  JOIN drivers d ON u.id = d.user_id 
  WHERE u.role = 'Driver' 
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing with user_id: % and driver_id: %', test_user_id, test_driver_id;
    
    -- Get a load assigned to this driver
    SELECT id INTO test_load_id 
    FROM loads 
    WHERE driver_id = test_driver_id 
    LIMIT 1;
    
    IF test_load_id IS NOT NULL THEN
      RAISE NOTICE 'Found assigned load: %', test_load_id;
      
      -- Test the RLS policy conditions manually
      -- This mimics what the RLS policy checks
      RAISE NOTICE 'Testing RLS policy conditions...';
      
      -- Simulate setting the user context (this won't work in SQL console)
      RAISE NOTICE 'Note: Cannot test auth.uid() in SQL console - this needs to be tested from the application';
      
    ELSE
      RAISE NOTICE 'No loads assigned to test driver';
    END IF;
  ELSE
    RAISE NOTICE 'No driver users found for testing';
  END IF;
END $$;

-- Step 8: Check for any orphaned drivers (drivers without user accounts)
DO $$
BEGIN
  RAISE NOTICE 'Step 8: Checking for orphaned drivers...';
END $$;

SELECT 
  d.id as driver_id,
  d.name as driver_name,
  d.user_id,
  CASE 
    WHEN u.id IS NULL THEN 'ORPHANED - No user account'
    WHEN u.role != 'Driver' THEN 'MISMATCH - User role is not Driver'
    ELSE 'OK'
  END as status
FROM drivers d
LEFT JOIN users u ON d.user_id = u.id
WHERE u.id IS NULL OR u.role != 'Driver';

-- Step 9: Suggested fixes based on common issues
DO $$
BEGIN
  RAISE NOTICE 'Step 9: Common fixes for driver message RLS issues...';
  RAISE NOTICE '1. Ensure driver has a user account with role = Driver';
  RAISE NOTICE '2. Ensure driver.user_id matches users.id';
  RAISE NOTICE '3. Ensure load.driver_id matches drivers.id';
  RAISE NOTICE '4. Check that RLS helper functions are accessible';
  RAISE NOTICE '5. Verify the user is properly authenticated when making the request';
END $$;

COMMIT;
