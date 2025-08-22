-- =====================================================================
-- MANUAL USER FIX - Works around auth.uid() being NULL in SQL Editor
-- We need to find your user ID manually and fix the role
-- =====================================================================

-- Step 1: Find your user ID from the auth.users table
-- Look for your email in the results and note the ID
SELECT 
  'Find Your User ID' as step,
  id as user_id, 
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Check if you exist in public.users (replace 'YOUR_USER_ID' with actual ID from step 1)
-- UNCOMMENT AND REPLACE WITH YOUR ACTUAL USER ID:
-- SELECT 'Your Public User Record' as step, * FROM public.users WHERE id = 'YOUR_USER_ID_HERE';

-- Step 3: Create/update your user record (replace 'YOUR_USER_ID' and 'YOUR_EMAIL')
-- UNCOMMENT AND REPLACE WITH YOUR ACTUAL VALUES:
-- INSERT INTO public.users (
--   id,
--   role,
--   name,
--   email,
--   created_at,
--   updated_at
-- )
-- VALUES (
--   'YOUR_USER_ID_HERE',
--   'Dispatcher',
--   'Admin User',
--   'YOUR_EMAIL_HERE',
--   NOW(),
--   NOW()
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   role = 'Dispatcher',
--   updated_at = NOW();

-- Step 4: Test the fix (uncomment after completing step 3)
-- SELECT 'Role Function Test' as step, public.get_user_role() as role_result;
-- SELECT 'Customer Access Test' as step, COUNT(*) as visible_customers FROM public.customers;

SELECT 'Instructions: Complete steps 1-3 above, then refresh your TMS app!' as message;
