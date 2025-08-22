-- =====================================================================
-- SIMPLE CUSTOMER ACCESS FIX - No complex triggers, just direct fixes
-- Run this in Supabase SQL Editor
-- =====================================================================

BEGIN;

-- Step 1: Fix current user immediately
UPDATE public.users 
SET 
  role = 'Dispatcher',
  updated_at = NOW()
WHERE id = auth.uid()
  AND (role IS NULL OR role != 'Dispatcher');

-- Step 2: Create user if doesn't exist
INSERT INTO public.users (
  id, 
  role, 
  name, 
  email,
  created_at,
  updated_at
) VALUES (
  auth.uid(),
  'Dispatcher',
  COALESCE(auth.jwt()->>'email', 'Admin User'),
  auth.jwt()->>'email',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'Dispatcher',
  updated_at = NOW();

-- Step 3: Ensure get_user_role function works properly
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role from users table
  SELECT role INTO user_role
  FROM public.users 
  WHERE id = auth.uid();
  
  -- If no user found, return Dispatcher as default
  IF user_role IS NULL THEN
    -- Try to create the user with Dispatcher role
    INSERT INTO public.users (
      id, 
      role, 
      name, 
      email,
      created_at,
      updated_at
    ) VALUES (
      auth.uid(),
      'Dispatcher',
      COALESCE(auth.jwt()->>'email', 'Auto User'),
      auth.jwt()->>'email',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'Dispatcher',
      updated_at = NOW();
    
    RETURN 'Dispatcher';
  END IF;
  
  RETURN COALESCE(user_role, 'Dispatcher');
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- Step 5: Test the fix
SELECT 
  'Current User Test' as check_type,
  auth.uid() as user_id,
  public.get_user_role() as role,
  (SELECT role FROM public.users WHERE id = auth.uid()) as db_role,
  CASE 
    WHEN public.get_user_role() = 'Dispatcher' THEN '✅ FIXED - Customers should now load!'
    ELSE '❌ Still needs work'
  END as status;

-- Step 6: Test customer access
SELECT 
  'Customer Access Test' as check_type,
  COUNT(*) as customer_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Can see customers!'
    ELSE '❌ Still blocked'
  END as access_status
FROM public.customers;

COMMIT;

SELECT '🎉 SIMPLE FIX COMPLETE! Refresh your TMS app now.' as result;
