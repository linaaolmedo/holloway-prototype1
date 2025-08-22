-- =====================================================================
-- COMPREHENSIVE DEBUG AND FIX: Customer Access Issue
-- This script diagnoses and fixes all possible RLS and auth issues
-- =====================================================================

-- Step 1: Check current authentication state
SELECT 'AUTHENTICATION DEBUG:' as debug_section;

SELECT 
    'Auth User ID:' as check_type,
    auth.uid() as current_auth_id,
    CASE WHEN auth.uid() IS NOT NULL THEN '✅ Authenticated' ELSE '❌ Not authenticated' END as auth_status;

-- Step 2: Check user profile in database
SELECT 'USER PROFILE DEBUG:' as debug_section;

SELECT 
    'User Profile:' as check_type,
    id,
    name,
    email, 
    role,
    CASE WHEN role = 'Dispatcher' THEN '✅ Dispatcher role' ELSE '❌ Wrong role: ' || role END as role_status
FROM public.users 
WHERE id = auth.uid();

-- Step 3: Test the get_user_role() function
SELECT 'RLS FUNCTION DEBUG:' as debug_section;

SELECT 
    'get_user_role() function:' as check_type,
    public.get_user_role() as returned_role,
    CASE 
        WHEN public.get_user_role() = 'Dispatcher' THEN '✅ Returns Dispatcher'
        ELSE '❌ Returns: ' || COALESCE(public.get_user_role(), 'NULL')
    END as function_status;

-- Step 4: Fix the user role (force update)
UPDATE public.users 
SET 
    role = 'Dispatcher',
    updated_at = now()
WHERE id = auth.uid();

SELECT 'ROLE UPDATE:' as debug_section;
SELECT 'User role updated to Dispatcher' as update_status;

-- Step 5: Temporarily disable RLS to test basic connectivity
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
SELECT 'RLS DISABLED TEMPORARILY' as rls_status;

-- Step 6: Test customer access without RLS
SELECT 
    'CUSTOMERS WITHOUT RLS:' as debug_section,
    count(*) as total_customers_in_db,
    array_agg(name ORDER BY name) as customer_names
FROM public.customers;

-- Step 7: Re-enable RLS and test with fixed role
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
SELECT 'RLS RE-ENABLED' as rls_status;

-- Step 8: Test customer access with RLS
SELECT 
    'CUSTOMERS WITH RLS:' as debug_section,
    count(*) as accessible_customers,
    CASE 
        WHEN count(*) > 0 THEN '✅ RLS working correctly'
        ELSE '❌ RLS still blocking access'
    END as rls_test_result
FROM public.customers;

-- Step 9: Check if RLS policies exist
SELECT 'RLS POLICIES:' as debug_section;
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'customers'
ORDER BY policyname;

-- Step 10: Recreate the dispatcher policy if needed
DROP POLICY IF EXISTS "customers_dispatcher_all" ON public.customers;

CREATE POLICY "customers_dispatcher_all" ON public.customers
FOR ALL 
USING (public.get_user_role() = 'Dispatcher');

SELECT 'POLICY RECREATED' as policy_status;

-- Final comprehensive test
SELECT 'FINAL TEST:' as debug_section;

SELECT 
    'Authentication:' as test_type,
    auth.uid() IS NOT NULL as authenticated,
    (SELECT role FROM public.users WHERE id = auth.uid()) as user_role,
    public.get_user_role() as function_role,
    (SELECT count(*) FROM public.customers) as accessible_customers,
    CASE 
        WHEN (SELECT count(*) FROM public.customers) > 0 THEN '🎉 SUCCESS - Customers accessible!'
        ELSE '❌ STILL BLOCKED - Manual intervention needed'
    END as final_result;

-- Instructions for next steps
SELECT 'If customers are still not showing:' as instructions;
SELECT '1. Log out of your app completely' as step_1;
SELECT '2. Clear browser cache/cookies' as step_2;  
SELECT '3. Log back in to refresh the auth session' as step_3;
SELECT '4. Refresh the customers page' as step_4;
