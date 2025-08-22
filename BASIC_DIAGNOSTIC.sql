-- =====================================================================
-- BASIC DIAGNOSTIC - Let's see what's actually happening
-- Run this in Supabase SQL Editor to understand the real issue
-- =====================================================================

-- Step 1: Check if there are ANY customers in the database at all
SELECT 
  'Customer Count Check' as test,
  COUNT(*) as total_customers_in_database
FROM public.customers;

-- Step 2: Check current user authentication
SELECT 
  'Auth Check' as test,
  auth.uid() as current_user_id,
  auth.jwt() ->> 'email' as current_email;

-- Step 3: Check if user exists in public.users table
SELECT 
  'User Profile Check' as test,
  u.id,
  u.role,
  u.email,
  u.name
FROM public.users u 
WHERE u.id = auth.uid();

-- Step 4: Check RLS status on customers table
SELECT 
  'RLS Status Check' as test,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'customers';

-- Step 5: Try to select customers bypassing potential RLS issues
-- (This will fail if RLS is blocking, which tells us something)
BEGIN;
SET LOCAL role TO 'authenticated';
SELECT 
  'Direct Customer Query' as test,
  id,
  name,
  'Can see this customer' as status
FROM public.customers 
LIMIT 3;
ROLLBACK;

-- Step 6: Show all RLS policies on customers table
SELECT 
  'RLS Policies' as test,
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'customers';

-- Step 7: Test the get_user_role function
SELECT 
  'Role Function Test' as test,
  public.get_user_role() as returned_role,
  CASE 
    WHEN public.get_user_role() IS NULL THEN '❌ Function returns NULL'
    WHEN public.get_user_role() = 'Dispatcher' THEN '✅ Function returns Dispatcher'
    ELSE '⚠️ Function returns: ' || public.get_user_role()
  END as function_status;
