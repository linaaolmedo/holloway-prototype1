-- =====================================================================
-- Fix Customer Access Issue
-- This script fixes the user role to ensure proper access to customers
-- =====================================================================

-- Step 1: Update the current user's role to Dispatcher
-- Replace the email condition with the actual user email if known
UPDATE public.users 
SET 
  role = 'Dispatcher',
  updated_at = NOW()
WHERE id = auth.uid();

-- Step 2: Verify the update worked
SELECT 
  'Updated User Profile' AS check_type,
  id,
  name,
  email,
  role,
  updated_at
FROM public.users 
WHERE id = auth.uid();

-- Step 3: Test the get_user_role() function again
SELECT 
  'Role Function After Update' AS check_type,
  public.get_user_role() AS current_role;

-- Step 4: Test customer access
SELECT 
  'Customer Access Test' AS check_type,
  COUNT(*) AS visible_customers
FROM public.customers;

-- Step 5: Show first few customers to verify access
SELECT 
  'Sample Customers' AS check_type,
  id,
  name,
  primary_contact_name,
  primary_contact_email
FROM public.customers
ORDER BY name
LIMIT 5;

-- Alternative fix: If the above doesn't work, update by email
-- Uncomment and run this if you know the user's email:
-- UPDATE public.users 
-- SET role = 'Dispatcher', updated_at = NOW()
-- WHERE email = 'john.smith@company.com'; -- Replace with actual email

-- Alternative fix: Create user profile if it doesn't exist
-- Uncomment and run this if no user profile exists:
-- INSERT INTO public.users (id, role, name, email, created_at, updated_at)
-- VALUES (
--   auth.uid(),
--   'Dispatcher',
--   'John Smith',
--   (SELECT email FROM auth.users WHERE id = auth.uid()),
--   NOW(),
--   NOW()
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   role = EXCLUDED.role,
--   updated_at = NOW();
