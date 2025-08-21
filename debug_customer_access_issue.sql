-- =====================================================================
-- Debug Customer Access Issue
-- This script helps diagnose why customers are not showing up in the UI
-- =====================================================================

-- Step 1: Check current authenticated user
SELECT 
  'Current Auth User' AS check_type,
  auth.uid() AS user_id,
  auth.jwt() -> 'email' AS email;

-- Step 2: Check user profile in public.users table
SELECT 
  'User Profile' AS check_type,
  id,
  name,
  email,
  role,
  customer_id,
  carrier_id,
  created_at
FROM public.users 
WHERE id = auth.uid();

-- Step 3: Test the get_user_role() function
SELECT 
  'Role Function Test' AS check_type,
  public.get_user_role() AS current_role;

-- Step 4: Check RLS policies on customers table
SELECT 
  'RLS Policy Check' AS check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'customers';

-- Step 5: Test customer access directly
SELECT 
  'Customer Count Test' AS check_type,
  COUNT(*) AS visible_customers
FROM public.customers;

-- Step 6: Check all customers (bypassing RLS temporarily if needed)
-- NOTE: This might fail if RLS is strictly enforced
SELECT 
  'All Customers' AS check_type,
  id,
  name,
  primary_contact_name,
  primary_contact_email
FROM public.customers
LIMIT 5;

-- Step 7: Show what the RLS policy is actually evaluating
SELECT 
  'RLS Evaluation' AS check_type,
  public.get_user_role() = 'Dispatcher' AS dispatcher_check,
  public.get_user_role() AS actual_role,
  'Dispatcher' AS expected_role;
