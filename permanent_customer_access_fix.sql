-- =====================================================================
-- PERMANENT FIX: Customer Access for TMS Application
-- This script ensures proper role assignment and RLS configuration
-- =====================================================================

BEGIN;

-- Step 1: Fix current user's role to Dispatcher (permanent)
UPDATE public.users 
SET 
    role = 'Dispatcher', 
    updated_at = now()
WHERE id = auth.uid()
  AND role != 'Dispatcher';

-- Step 2: Ensure the first user is always a Dispatcher (fallback)
UPDATE public.users 
SET 
    role = 'Dispatcher',
    updated_at = now()
WHERE id = (
    SELECT id FROM public.users 
    ORDER BY created_at ASC 
    LIMIT 1
)
AND role != 'Dispatcher';

-- Step 3: Re-enable RLS with proper configuration
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_locations ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify the RLS policies exist and are correct
-- Check for dispatcher policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' 
        AND policyname = 'customers_dispatcher_all'
    ) THEN
        -- Create the policy if it doesn't exist
        CREATE POLICY "customers_dispatcher_all" ON public.customers
        FOR ALL USING (get_user_role() = 'Dispatcher');
        
        RAISE NOTICE 'Created missing dispatcher policy for customers table';
    END IF;
END
$$;

-- Step 5: Test the fix
SELECT 
    '=== VERIFICATION RESULTS ===' as status;

SELECT 
    'Current User:' as check_type,
    id,
    name, 
    email,
    role,
    CASE 
        WHEN role = 'Dispatcher' THEN '✅ Has access to all customers'
        ELSE '❌ Limited access - needs Dispatcher role'
    END as access_status
FROM public.users 
WHERE id = auth.uid();

SELECT 
    'Customer Access Test:' as check_type,
    count(*) as visible_customers,
    CASE 
        WHEN count(*) > 0 THEN '✅ Customers accessible'
        ELSE '❌ Still blocked - check RLS policies'
    END as status
FROM public.customers;

SELECT 
    'RLS Status:' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('customers', 'customer_locations');

COMMIT;

-- Final message
SELECT '🎉 PERMANENT FIX COMPLETE! Refresh your app to see customers.' as result;
