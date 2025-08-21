-- =====================================================================
-- Fix Driver Message RLS Issue (Safe Version)
-- This script addresses common causes of RLS violations when drivers try to send messages
-- WITHOUT creating new user accounts (which requires Supabase auth)
-- =====================================================================

BEGIN;

-- Print fix header
DO $$
BEGIN
  RAISE NOTICE 'Fixing Driver Message RLS Issue (Safe Version)...';
END $$;

-- Step 1: Recreate helper functions with better error handling
DO $$
BEGIN
  RAISE NOTICE 'Step 1: Recreating RLS helper functions with improved error handling...';
END $$;

-- Recreate get_user_role function with logging
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.users 
  WHERE id = auth.uid();
  
  -- Return NULL if no user found (will fail RLS checks appropriately)
  RETURN COALESCE(user_role, NULL);
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL on any error (will fail RLS checks appropriately)
    RETURN NULL;
END;
$$;

-- Recreate get_user_driver_id function with logging
CREATE OR REPLACE FUNCTION public.get_user_driver_id()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  driver_id bigint;
BEGIN
  SELECT id INTO driver_id
  FROM public.drivers 
  WHERE user_id = auth.uid();
  
  RETURN driver_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Step 2: Link existing drivers to existing user accounts (safe approach)
DO $$
BEGIN
  RAISE NOTICE 'Step 2: Linking existing drivers to existing user accounts...';
END $$;

-- For drivers that don't have user_id set, try to link them to existing users by name
UPDATE public.drivers 
SET user_id = u.id
FROM public.users u
WHERE public.drivers.user_id IS NULL
  AND public.drivers.name = u.name
  AND u.role = 'Driver';

-- Step 3: Recreate load_messages RLS policies with better conditions
DO $$
BEGIN
  RAISE NOTICE 'Step 3: Recreating load_messages RLS policies...';
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "load_messages_driver_insert" ON public.load_messages;
DROP POLICY IF EXISTS "load_messages_driver_assigned" ON public.load_messages;
DROP POLICY IF EXISTS "load_messages_driver_temp_debug" ON public.load_messages;

-- Recreate driver message insert policy with more permissive conditions
CREATE POLICY "load_messages_driver_insert" ON public.load_messages
FOR INSERT WITH CHECK (
  -- Allow if user is a driver AND load is assigned to them
  get_user_role() = 'Driver' 
  AND get_user_driver_id() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.loads 
    WHERE id = load_id 
    AND driver_id = get_user_driver_id()
  )
);

-- Recreate driver message select policy
CREATE POLICY "load_messages_driver_assigned" ON public.load_messages
FOR SELECT USING (
  get_user_role() = 'Driver' 
  AND EXISTS (
    SELECT 1 FROM public.loads 
    WHERE id = load_id 
    AND driver_id = get_user_driver_id()
  )
);

-- Step 4: Grant necessary permissions
DO $$
BEGIN
  RAISE NOTICE 'Step 4: Granting necessary permissions...';
END $$;

-- Ensure authenticated users can execute helper functions
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_driver_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_customer_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_carrier_id() TO authenticated;

-- Ensure authenticated users can insert/select load_messages
GRANT SELECT, INSERT ON public.load_messages TO authenticated;
GRANT SELECT ON public.loads TO authenticated;
GRANT SELECT ON public.drivers TO authenticated;
GRANT SELECT ON public.users TO authenticated;

-- Step 5: Create a function to test driver message permissions
CREATE OR REPLACE FUNCTION public.test_driver_message_permissions(test_user_id UUID, test_load_id BIGINT)
RETURNS TABLE(
  can_insert BOOLEAN,
  user_role TEXT,
  driver_id BIGINT,
  load_assigned BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
  current_driver_id BIGINT;
  is_load_assigned BOOLEAN := FALSE;
  can_insert_msg BOOLEAN := FALSE;
  err_msg TEXT := '';
BEGIN
  -- Get user role
  SELECT role INTO current_user_role FROM public.users WHERE id = test_user_id;
  
  -- Get driver id
  SELECT id INTO current_driver_id FROM public.drivers WHERE user_id = test_user_id;
  
  -- Check if load is assigned to driver
  SELECT EXISTS(
    SELECT 1 FROM public.loads 
    WHERE id = test_load_id AND driver_id = current_driver_id
  ) INTO is_load_assigned;
  
  -- Determine if user can insert messages
  IF current_user_role = 'Driver' AND current_driver_id IS NOT NULL THEN
    IF is_load_assigned THEN
      can_insert_msg := TRUE;
      err_msg := 'OK - Driver can insert messages for assigned load';
    ELSE
      can_insert_msg := FALSE;
      err_msg := 'ERROR - Load not assigned to driver';
    END IF;
  ELSE
    can_insert_msg := FALSE;
    err_msg := format('ERROR - User role: %s, Driver ID: %s', 
                     COALESCE(current_user_role, 'NULL'), 
                     COALESCE(current_driver_id::TEXT, 'NULL'));
  END IF;
  
  RETURN QUERY SELECT 
    can_insert_msg,
    current_user_role,
    current_driver_id,
    is_load_assigned,
    err_msg;
END;
$$;

-- Grant execute permission on test function
GRANT EXECUTE ON FUNCTION public.test_driver_message_permissions(UUID, BIGINT) TO authenticated;

-- Step 6: Diagnostic queries to understand the current state
DO $$
BEGIN
  RAISE NOTICE 'Step 6: Running diagnostics...';
END $$;

-- Show drivers that need user accounts
SELECT 
  'Drivers without user accounts:' as info,
  COUNT(*) as count
FROM public.drivers d
WHERE d.user_id IS NULL;

-- Show current driver-user mappings for verification
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email,
  u.role,
  d.id as driver_id,
  d.name as driver_name,
  CASE 
    WHEN d.user_id IS NULL THEN 'ERROR: Driver not linked to user'
    WHEN d.user_id != u.id THEN 'ERROR: Driver linked to wrong user'
    WHEN u.role != 'Driver' THEN 'ERROR: User role is not Driver'
    ELSE 'OK'
  END as status
FROM users u
FULL OUTER JOIN drivers d ON u.id = d.user_id
WHERE u.role = 'Driver' OR d.id IS NOT NULL
ORDER BY u.name, d.name;

-- Show recent loads and their driver assignments
SELECT 
  'Recent load assignments:' as info,
  l.id as load_id,
  l.status,
  l.driver_id,
  d.name as driver_name,
  u.name as user_name,
  u.id as user_id
FROM loads l
LEFT JOIN drivers d ON l.driver_id = d.id
LEFT JOIN users u ON d.user_id = u.id
WHERE l.driver_id IS NOT NULL
ORDER BY l.id DESC
LIMIT 10;

COMMIT;

-- Final message
DO $$
BEGIN
  RAISE NOTICE '=== Driver Message RLS Fix Complete (Safe Version) ===';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review the diagnostic output above';
  RAISE NOTICE '2. For drivers without user accounts, create them through the app or Supabase auth';
  RAISE NOTICE '3. Test with: SELECT * FROM test_driver_message_permissions(USER_ID, LOAD_ID);';
  RAISE NOTICE '4. If you have orphaned drivers, manually link them or create auth accounts';
END $$;
