-- =====================================================================
-- COMPREHENSIVE VERCEL DEPLOYMENT FIXES (Corrected for Supabase)
-- Fix all current production issues on Vercel deployment
-- =====================================================================

-- =====================================================================
-- ISSUE 1: FIX DRIVER NOTIFICATIONS - Missing Service Function
-- =====================================================================

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

-- =====================================================================
-- ISSUE 2: FIX NOTIFICATION RLS POLICIES
-- =====================================================================

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

-- =====================================================================
-- ISSUE 3: FIX CUSTOMER DATA ACCESS
-- =====================================================================

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

-- =====================================================================
-- ISSUE 4: FIX BILLING/LOADS ACCESS
-- =====================================================================

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

-- =====================================================================
-- ISSUE 5: ENSURE USER ROLE FUNCTION EXISTS
-- =====================================================================

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

-- =====================================================================
-- ISSUE 6: FIX CUSTOMER LOCATIONS ACCESS
-- =====================================================================

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

-- =====================================================================
-- VERIFICATION QUERIES (Optional - run separately if needed)
-- =====================================================================

-- Test the functions and count records
SELECT 'Dispatcher function test:' as test, COUNT(*) as dispatcher_count 
FROM get_dispatchers_for_notifications();

SELECT 'Customer count:' as test, COUNT(*) as customer_count FROM customers;

SELECT 'Load count:' as test, COUNT(*) as load_count FROM loads;

-- Test user role function (will show your current role)
SELECT 'Your role:' as test, get_user_role() as current_user_role;
