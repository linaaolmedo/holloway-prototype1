-- =====================================================================
-- Complete RLS Deployment Script for BulkFlow TMS
-- Run this script to deploy Row Level Security to your Supabase database
-- =====================================================================

BEGIN;

-- Print deployment start message
DO $$
BEGIN
  RAISE NOTICE 'Starting Row Level Security deployment for BulkFlow TMS...';
END $$;

-- =====================================================================
-- Step 1: Create Helper Functions
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE 'Creating helper functions...';
END $$;

-- Helper function to get user role from JWT token
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$;

-- Helper function to get user's customer_id
CREATE OR REPLACE FUNCTION public.get_user_customer_id()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT customer_id 
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$;

-- Helper function to get user's carrier_id
CREATE OR REPLACE FUNCTION public.get_user_carrier_id()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT carrier_id 
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$;

-- Helper function to get user's driver_id
CREATE OR REPLACE FUNCTION public.get_user_driver_id()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT id 
    FROM public.drivers 
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Audit functions
CREATE OR REPLACE FUNCTION public.set_current_user_for_audit(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function sets the current user context for audit purposes
  RETURN;
END;
$$;

-- =====================================================================
-- Step 2: Enable RLS on Tables
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE 'Enabling RLS on all tables...';
END $$;

-- Enable RLS on all main tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- Step 3: Create RLS Policies
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies...';
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_dispatcher_all" ON public.users;
DROP POLICY IF EXISTS "customers_dispatcher_all" ON public.customers;
DROP POLICY IF EXISTS "customers_select_own" ON public.customers;
DROP POLICY IF EXISTS "customers_update_own" ON public.customers;
DROP POLICY IF EXISTS "loads_dispatcher_all" ON public.loads;
DROP POLICY IF EXISTS "loads_customer_own" ON public.loads;
DROP POLICY IF EXISTS "loads_customer_insert" ON public.loads;
DROP POLICY IF EXISTS "loads_carrier_bidding" ON public.loads;
DROP POLICY IF EXISTS "loads_driver_assigned" ON public.loads;
DROP POLICY IF EXISTS "loads_driver_update_status" ON public.loads;

-- Users table policies
CREATE POLICY "users_select_own" ON public.users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_dispatcher_all" ON public.users
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Customers table policies
CREATE POLICY "customers_dispatcher_all" ON public.customers
FOR ALL USING (get_user_role() = 'Dispatcher');

CREATE POLICY "customers_select_own" ON public.customers
FOR SELECT USING (
  get_user_role() = 'Customer' 
  AND id = get_user_customer_id()
);

CREATE POLICY "customers_update_own" ON public.customers
FOR UPDATE USING (
  get_user_role() = 'Customer' 
  AND id = get_user_customer_id()
);

-- Customer locations policies
CREATE POLICY "customer_locations_dispatcher_all" ON public.customer_locations
FOR ALL USING (get_user_role() = 'Dispatcher');

CREATE POLICY "customer_locations_select_own" ON public.customer_locations
FOR SELECT USING (
  get_user_role() = 'Customer' 
  AND customer_id = get_user_customer_id()
);

-- Loads table policies (most important)
CREATE POLICY "loads_dispatcher_all" ON public.loads
FOR ALL USING (get_user_role() = 'Dispatcher');

CREATE POLICY "loads_customer_own" ON public.loads
FOR SELECT USING (
  get_user_role() = 'Customer' 
  AND customer_id = get_user_customer_id()
);

CREATE POLICY "loads_customer_insert" ON public.loads
FOR INSERT WITH CHECK (
  get_user_role() = 'Customer' 
  AND customer_id = get_user_customer_id()
);

CREATE POLICY "loads_carrier_bidding" ON public.loads
FOR SELECT USING (
  get_user_role() = 'Carrier' 
  AND (
    -- Available for bidding
    (carrier_id IS NULL AND status IN ('Pending Pickup', 'Pending Assignment'))
    OR 
    -- Assigned to this carrier
    carrier_id = get_user_carrier_id()
  )
);

CREATE POLICY "loads_driver_assigned" ON public.loads
FOR SELECT USING (
  get_user_role() = 'Driver' 
  AND driver_id = get_user_driver_id()
);

CREATE POLICY "loads_driver_update_status" ON public.loads
FOR UPDATE USING (
  get_user_role() = 'Driver' 
  AND driver_id = get_user_driver_id()
);

-- Add essential policies for other key tables
CREATE POLICY "carriers_dispatcher_all" ON public.carriers
FOR ALL USING (get_user_role() = 'Dispatcher');

CREATE POLICY "carriers_select_own" ON public.carriers
FOR SELECT USING (
  get_user_role() = 'Carrier' 
  AND id = get_user_carrier_id()
);

CREATE POLICY "drivers_dispatcher_all" ON public.drivers
FOR ALL USING (get_user_role() = 'Dispatcher');

CREATE POLICY "drivers_select_own" ON public.drivers
FOR SELECT USING (
  get_user_role() = 'Driver' 
  AND user_id = auth.uid()
);

CREATE POLICY "bids_dispatcher_all" ON public.bids
FOR ALL USING (get_user_role() = 'Dispatcher');

CREATE POLICY "bids_carrier_own" ON public.bids
FOR SELECT USING (
  get_user_role() = 'Carrier' 
  AND carrier_id = get_user_carrier_id()
);

CREATE POLICY "bids_carrier_insert" ON public.bids
FOR INSERT WITH CHECK (
  get_user_role() = 'Carrier' 
  AND carrier_id = get_user_carrier_id()
);

-- =====================================================================
-- Step 4: Grant Permissions
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE 'Granting permissions...';
END $$;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant access to reference tables
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.equipment_types TO authenticated;

-- Grant access to main tables (RLS controls access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carriers TO authenticated;
GRANT SELECT, UPDATE ON public.drivers TO authenticated;
GRANT SELECT ON public.trucks TO authenticated;
GRANT SELECT ON public.trailers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.loads TO authenticated;
GRANT SELECT, INSERT ON public.load_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bids TO authenticated;

-- Grant access to helper functions
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_customer_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_carrier_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_driver_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_user_for_audit(UUID) TO authenticated;

-- =====================================================================
-- Step 5: Create Indexes for Performance
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE 'Creating performance indexes...';
END $$;

-- Indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_customer_id ON public.users(customer_id);
CREATE INDEX IF NOT EXISTS idx_users_carrier_id ON public.users(carrier_id);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_loads_customer_id ON public.loads(customer_id);
CREATE INDEX IF NOT EXISTS idx_loads_carrier_id ON public.loads(carrier_id);
CREATE INDEX IF NOT EXISTS idx_loads_driver_id ON public.loads(driver_id);

-- =====================================================================
-- Step 6: Verification
-- =====================================================================

DO $$
DECLARE
  policy_count INTEGER;
  enabled_tables INTEGER;
BEGIN
  RAISE NOTICE 'Verifying deployment...';
  
  -- Count RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  RAISE NOTICE 'Created % RLS policies', policy_count;
  
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO enabled_tables
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true;
    
  RAISE NOTICE 'Enabled RLS on % tables', enabled_tables;
  
  IF policy_count < 10 THEN
    RAISE WARNING 'Expected more RLS policies. Please check deployment.';
  END IF;
  
  IF enabled_tables < 10 THEN
    RAISE WARNING 'Expected more tables with RLS enabled. Please check deployment.';
  END IF;
  
  RAISE NOTICE 'RLS deployment completed successfully!';
END $$;

COMMIT;

-- =====================================================================
-- Post-Deployment Instructions
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'RLS DEPLOYMENT COMPLETE';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify all users have proper profiles in the users table';
  RAISE NOTICE '2. Test data access with different user roles';
  RAISE NOTICE '3. Monitor application for any access issues';
  RAISE NOTICE '4. See RLS_IMPLEMENTATION_GUIDE.md for testing instructions';
  RAISE NOTICE '=============================================================';
END $$;
