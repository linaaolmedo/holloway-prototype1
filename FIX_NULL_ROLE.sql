-- =====================================================================
-- FIX NULL ROLE ISSUE - This addresses the exact problem shown in your diagnostic
-- The get_user_role() function is returning NULL, which blocks customer access
-- =====================================================================

BEGIN;

-- Step 1: Check what's in the users table for current user
SELECT 'Current User Check' as step, * FROM public.users WHERE id = auth.uid();

-- Step 2: Create or update user record with proper role
INSERT INTO public.users (
  id,
  role,
  name,
  email,
  created_at,
  updated_at
)
VALUES (
  auth.uid(),
  'Dispatcher',
  COALESCE(auth.jwt()->>'email', 'Admin User'),
  auth.jwt()->>'email',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'Dispatcher',
  name = COALESCE(EXCLUDED.name, public.users.name),
  email = COALESCE(EXCLUDED.email, public.users.email),
  updated_at = NOW();

-- Step 3: Verify the user record now exists
SELECT 'User After Fix' as step, id, role, name, email FROM public.users WHERE id = auth.uid();

-- Step 4: Test the get_user_role() function again
SELECT 'Role Function Test' as step, public.get_user_role() as role_result;

-- Step 5: Test customer access
SELECT 'Customer Access Test' as step, COUNT(*) as visible_customers FROM public.customers;

-- Step 6: Show sample customers if accessible
SELECT 'Sample Customers' as step, id, name, primary_contact_email 
FROM public.customers 
LIMIT 3;

COMMIT;

SELECT '✅ NULL role fix complete! Check the results above.' as final_message;
