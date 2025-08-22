-- =====================================================================
-- COMPREHENSIVE VERCEL DEPLOYMENT FIXES
-- Fix all current production issues on Vercel deployment
-- =====================================================================

BEGIN;

RAISE NOTICE 'Starting comprehensive fixes for Vercel deployment issues...';

-- =====================================================================
-- ISSUE 1: FIX DRIVER NOTIFICATIONS - Missing Service Function
-- =====================================================================

RAISE NOTICE '1. Creating missing dispatcher service function...';

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_dispatchers_for_notifications();

-- Create the service function that bypasses RLS for notifications
CREATE OR REPLACE FUNCTION public.get_dispatchers_for_notifications()
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER  -- This runs with elevated privileges
SET search_path = public
AS $$
BEGIN
    -- This function can see all users regardless of RLS
    RETURN QUERY
    SELECT 
        u.id,
        u.email::TEXT,
        u.name::TEXT
    FROM public.users u
    WHERE u.role = 'Dispatcher'
      AND u.email IS NOT NULL
      AND u.name IS NOT NULL;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dispatchers_for_notifications() TO authenticated;

RAISE NOTICE 'Created get_dispatchers_for_notifications() function';

-- =====================================================================
-- ISSUE 2: FIX NOTIFICATION RLS POLICIES
-- =====================================================================

RAISE NOTICE '2. Fixing notification RLS policies...';

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop all existing notification policies
DROP POLICY IF EXISTS "notifications_user_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_dispatcher_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_read_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;

-- Create proper notification policies
CREATE POLICY "notifications_user_own" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_dispatcher_all" ON public.notifications
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Allow system to insert notifications
CREATE POLICY "notifications_insert_system" ON public.notifications
FOR INSERT WITH CHECK (true);

-- Allow users to update their own notifications
CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

RAISE NOTICE 'Fixed notification RLS policies';

-- =====================================================================
-- ISSUE 3: FIX CUSTOMER DATA ACCESS
-- =====================================================================

RAISE NOTICE '3. Fixing customer data access...';

-- Ensure customers table has proper RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing customer policies
DROP POLICY IF EXISTS "customers_read_all" ON public.customers;
DROP POLICY IF EXISTS "customers_dispatcher_all" ON public.customers;

-- Allow all authenticated users to read customers
CREATE POLICY "customers_read_all" ON public.customers
FOR SELECT USING (true);

-- Allow dispatchers full access to customers
CREATE POLICY "customers_dispatcher_all" ON public.customers
FOR ALL USING (get_user_role() = 'Dispatcher');

RAISE NOTICE 'Fixed customer RLS policies';

-- =====================================================================
-- ISSUE 4: FIX BILLING/LOADS ACCESS
-- =====================================================================

RAISE NOTICE '4. Fixing billing and loads access...';

-- Ensure loads table has proper RLS
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;

-- Drop existing load policies that might be too restrictive
DROP POLICY IF EXISTS "loads_read_all" ON public.loads;
DROP POLICY IF EXISTS "loads_dispatcher_all" ON public.loads;

-- Allow all authenticated users to read loads
CREATE POLICY "loads_read_all" ON public.loads
FOR SELECT USING (true);

-- Allow dispatchers full access to loads
CREATE POLICY "loads_dispatcher_all" ON public.loads
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Fix invoices access
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing invoice policies
DROP POLICY IF EXISTS "invoices_read_all" ON public.invoices;
DROP POLICY IF EXISTS "invoices_dispatcher_all" ON public.invoices;

-- Allow all authenticated users to read invoices
CREATE POLICY "invoices_read_all" ON public.invoices
FOR SELECT USING (true);

-- Allow dispatchers full access to invoices
CREATE POLICY "invoices_dispatcher_all" ON public.invoices
FOR ALL USING (get_user_role() = 'Dispatcher');

RAISE NOTICE 'Fixed billing and loads RLS policies';

-- =====================================================================
-- ISSUE 5: ENSURE USER ROLE FUNCTION EXISTS
-- =====================================================================

RAISE NOTICE '5. Ensuring user role function exists...';

-- Create or update the get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.users 
        WHERE id = auth.uid()
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

RAISE NOTICE 'Ensured get_user_role() function exists';

-- =====================================================================
-- ISSUE 6: FIX CUSTOMER LOCATIONS ACCESS
-- =====================================================================

RAISE NOTICE '6. Fixing customer locations access...';

-- Ensure customer_locations table has proper RLS
ALTER TABLE public.customer_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "customer_locations_read_all" ON public.customer_locations;
DROP POLICY IF EXISTS "customer_locations_dispatcher_all" ON public.customer_locations;

-- Allow all authenticated users to read customer locations
CREATE POLICY "customer_locations_read_all" ON public.customer_locations
FOR SELECT USING (true);

-- Allow dispatchers full access
CREATE POLICY "customer_locations_dispatcher_all" ON public.customer_locations
FOR ALL USING (get_user_role() = 'Dispatcher');

RAISE NOTICE 'Fixed customer locations RLS policies';

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================

RAISE NOTICE '';
RAISE NOTICE '=== VERIFICATION ===';

-- Count dispatchers
DO $$
DECLARE
    dispatcher_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO dispatcher_count FROM users WHERE role = 'Dispatcher';
    RAISE NOTICE 'Dispatchers in system: %', dispatcher_count;
END $$;

-- Count customers
DO $$
DECLARE
    customer_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO customer_count FROM customers;
    RAISE NOTICE 'Customers in system: %', customer_count;
END $$;

-- Count loads
DO $$
DECLARE
    load_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO load_count FROM loads;
    RAISE NOTICE 'Loads in system: %', load_count;
END $$;

-- Test the dispatcher function
DO $$
DECLARE
    func_result INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_result FROM get_dispatchers_for_notifications();
    RAISE NOTICE 'Dispatcher function returns: % dispatchers', func_result;
END $$;

COMMIT;

RAISE NOTICE '';
RAISE NOTICE '✅ Comprehensive fixes completed successfully!';
RAISE NOTICE '🔧 Fixed: Driver notifications, Customer access, Billing access, RLS policies';
RAISE NOTICE '📱 Your Vercel app should now work properly. Try refreshing the browser.';
