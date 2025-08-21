-- =====================================================================
-- Enable Row Level Security (RLS) for BulkFlow TMS
-- This script enables RLS and creates appropriate policies for each user role:
-- - Dispatcher: Full access to all data
-- - Customer: Access to their own customer data and related records
-- - Carrier: Access to available loads for bidding and their own carrier data
-- - Driver: Access to assigned loads and own driver record
-- =====================================================================

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

-- =====================================================================
-- Enable RLS on all tables
-- =====================================================================

-- Core tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;

-- Carrier tables
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_documents ENABLE ROW LEVEL SECURITY;

-- Fleet tables
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trailers ENABLE ROW LEVEL SECURITY;

-- Load and billing tables
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Reference tables (no RLS needed as they're read-only for all users)
-- ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- RLS Policies for USERS table
-- =====================================================================

-- Users can read their own profile and update it
CREATE POLICY "users_select_own" ON public.users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- Dispatchers can read/manage all user profiles
CREATE POLICY "users_dispatcher_all" ON public.users
FOR ALL USING (get_user_role() = 'Dispatcher');

-- =====================================================================
-- RLS Policies for CUSTOMERS table
-- =====================================================================

-- Dispatchers can access all customers
CREATE POLICY "customers_dispatcher_all" ON public.customers
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Customers can only see their own customer record
CREATE POLICY "customers_select_own" ON public.customers
FOR SELECT USING (
  get_user_role() = 'Customer' 
  AND id = get_user_customer_id()
);

-- Customers can update their own record
CREATE POLICY "customers_update_own" ON public.customers
FOR UPDATE USING (
  get_user_role() = 'Customer' 
  AND id = get_user_customer_id()
);

-- =====================================================================
-- RLS Policies for CUSTOMER_LOCATIONS table
-- =====================================================================

-- Dispatchers can access all customer locations
CREATE POLICY "customer_locations_dispatcher_all" ON public.customer_locations
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Customers can only see their own locations
CREATE POLICY "customer_locations_select_own" ON public.customer_locations
FOR SELECT USING (
  get_user_role() = 'Customer' 
  AND customer_id = get_user_customer_id()
);

-- Customers can manage their own locations
CREATE POLICY "customer_locations_manage_own" ON public.customer_locations
FOR INSERT WITH CHECK (
  get_user_role() = 'Customer' 
  AND customer_id = get_user_customer_id()
);

CREATE POLICY "customer_locations_update_own" ON public.customer_locations
FOR UPDATE USING (
  get_user_role() = 'Customer' 
  AND customer_id = get_user_customer_id()
);

CREATE POLICY "customer_locations_delete_own" ON public.customer_locations
FOR DELETE USING (
  get_user_role() = 'Customer' 
  AND customer_id = get_user_customer_id()
);

-- =====================================================================
-- RLS Policies for CUSTOMER_DOCUMENTS table
-- =====================================================================

-- Dispatchers can access all customer documents
CREATE POLICY "customer_documents_dispatcher_all" ON public.customer_documents
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Customers can access their own documents
CREATE POLICY "customer_documents_select_own" ON public.customer_documents
FOR SELECT USING (
  get_user_role() = 'Customer' 
  AND customer_id = get_user_customer_id()
);

-- =====================================================================
-- RLS Policies for CARRIERS table
-- =====================================================================

-- Dispatchers can access all carriers
CREATE POLICY "carriers_dispatcher_all" ON public.carriers
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Carriers can see their own record
CREATE POLICY "carriers_select_own" ON public.carriers
FOR SELECT USING (
  get_user_role() = 'Carrier' 
  AND id = get_user_carrier_id()
);

-- Carriers can update their own record
CREATE POLICY "carriers_update_own" ON public.carriers
FOR UPDATE USING (
  get_user_role() = 'Carrier' 
  AND id = get_user_carrier_id()
);

-- =====================================================================
-- RLS Policies for CARRIER_EQUIPMENT_TYPES table
-- =====================================================================

-- Dispatchers can access all carrier equipment types
CREATE POLICY "carrier_equipment_dispatcher_all" ON public.carrier_equipment_types
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Carriers can manage their own equipment types
CREATE POLICY "carrier_equipment_select_own" ON public.carrier_equipment_types
FOR SELECT USING (
  get_user_role() = 'Carrier' 
  AND carrier_id = get_user_carrier_id()
);

CREATE POLICY "carrier_equipment_manage_own" ON public.carrier_equipment_types
FOR INSERT WITH CHECK (
  get_user_role() = 'Carrier' 
  AND carrier_id = get_user_carrier_id()
);

CREATE POLICY "carrier_equipment_delete_own" ON public.carrier_equipment_types
FOR DELETE USING (
  get_user_role() = 'Carrier' 
  AND carrier_id = get_user_carrier_id()
);

-- =====================================================================
-- RLS Policies for CARRIER_DOCUMENTS table
-- =====================================================================

-- Dispatchers can access all carrier documents
CREATE POLICY "carrier_documents_dispatcher_all" ON public.carrier_documents
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Carriers can access their own documents
CREATE POLICY "carrier_documents_select_own" ON public.carrier_documents
FOR SELECT USING (
  get_user_role() = 'Carrier' 
  AND carrier_id = get_user_carrier_id()
);

-- =====================================================================
-- RLS Policies for DRIVERS table
-- =====================================================================

-- Dispatchers can access all drivers
CREATE POLICY "drivers_dispatcher_all" ON public.drivers
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Drivers can see their own record
CREATE POLICY "drivers_select_own" ON public.drivers
FOR SELECT USING (
  get_user_role() = 'Driver' 
  AND user_id = auth.uid()
);

-- Drivers can update certain fields of their own record (status, phone)
CREATE POLICY "drivers_update_own" ON public.drivers
FOR UPDATE USING (
  get_user_role() = 'Driver' 
  AND user_id = auth.uid()
);

-- =====================================================================
-- RLS Policies for TRUCKS table
-- =====================================================================

-- Dispatchers can access all trucks
CREATE POLICY "trucks_dispatcher_all" ON public.trucks
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Drivers can see all trucks (for assignment visibility)
CREATE POLICY "trucks_driver_select" ON public.trucks
FOR SELECT USING (get_user_role() = 'Driver');

-- =====================================================================
-- RLS Policies for TRAILERS table
-- =====================================================================

-- Dispatchers can access all trailers
CREATE POLICY "trailers_dispatcher_all" ON public.trailers
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Drivers can see all trailers (for assignment visibility)
CREATE POLICY "trailers_driver_select" ON public.trailers
FOR SELECT USING (get_user_role() = 'Driver');

-- =====================================================================
-- RLS Policies for LOADS table (Most Complex)
-- =====================================================================

-- Dispatchers can access all loads
CREATE POLICY "loads_dispatcher_all" ON public.loads
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Customers can see loads for their customer_id
CREATE POLICY "loads_customer_own" ON public.loads
FOR SELECT USING (
  get_user_role() = 'Customer' 
  AND customer_id = get_user_customer_id()
);

-- Customers can create loads for themselves
CREATE POLICY "loads_customer_insert" ON public.loads
FOR INSERT WITH CHECK (
  get_user_role() = 'Customer' 
  AND customer_id = get_user_customer_id()
);

-- Carriers can see loads that are:
-- 1. Available for bidding (no carrier assigned yet, status allows bidding)
-- 2. Already assigned to them
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

-- Drivers can see loads assigned to them
CREATE POLICY "loads_driver_assigned" ON public.loads
FOR SELECT USING (
  get_user_role() = 'Driver' 
  AND driver_id = get_user_driver_id()
);

-- Drivers can update load status for their assigned loads
CREATE POLICY "loads_driver_update_status" ON public.loads
FOR UPDATE USING (
  get_user_role() = 'Driver' 
  AND driver_id = get_user_driver_id()
);

-- =====================================================================
-- RLS Policies for LOAD_DOCUMENTS table
-- =====================================================================

-- Dispatchers can access all load documents
CREATE POLICY "load_documents_dispatcher_all" ON public.load_documents
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Users can see documents for loads they have access to
CREATE POLICY "load_documents_customer_own" ON public.load_documents
FOR SELECT USING (
  get_user_role() = 'Customer' 
  AND EXISTS (
    SELECT 1 FROM public.loads 
    WHERE id = load_id 
    AND customer_id = get_user_customer_id()
  )
);

CREATE POLICY "load_documents_carrier_assigned" ON public.load_documents
FOR SELECT USING (
  get_user_role() = 'Carrier' 
  AND EXISTS (
    SELECT 1 FROM public.loads 
    WHERE id = load_id 
    AND carrier_id = get_user_carrier_id()
  )
);

CREATE POLICY "load_documents_driver_assigned" ON public.load_documents
FOR SELECT USING (
  get_user_role() = 'Driver' 
  AND EXISTS (
    SELECT 1 FROM public.loads 
    WHERE id = load_id 
    AND driver_id = get_user_driver_id()
  )
);

-- Drivers can upload POD documents for their loads
CREATE POLICY "load_documents_driver_upload" ON public.load_documents
FOR INSERT WITH CHECK (
  get_user_role() = 'Driver' 
  AND EXISTS (
    SELECT 1 FROM public.loads 
    WHERE id = load_id 
    AND driver_id = get_user_driver_id()
  )
);

-- =====================================================================
-- RLS Policies for LOAD_MESSAGES table
-- =====================================================================

-- Dispatchers can access all load messages
CREATE POLICY "load_messages_dispatcher_all" ON public.load_messages
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Users can see messages for loads they have access to
CREATE POLICY "load_messages_customer_own" ON public.load_messages
FOR SELECT USING (
  get_user_role() = 'Customer' 
  AND EXISTS (
    SELECT 1 FROM public.loads 
    WHERE id = load_id 
    AND customer_id = get_user_customer_id()
  )
);

CREATE POLICY "load_messages_carrier_assigned" ON public.load_messages
FOR SELECT USING (
  get_user_role() = 'Carrier' 
  AND EXISTS (
    SELECT 1 FROM public.loads 
    WHERE id = load_id 
    AND carrier_id = get_user_carrier_id()
  )
);

CREATE POLICY "load_messages_driver_assigned" ON public.load_messages
FOR SELECT USING (
  get_user_role() = 'Driver' 
  AND EXISTS (
    SELECT 1 FROM public.loads 
    WHERE id = load_id 
    AND driver_id = get_user_driver_id()
  )
);

-- Users can create messages for loads they have access to
CREATE POLICY "load_messages_customer_insert" ON public.load_messages
FOR INSERT WITH CHECK (
  get_user_role() = 'Customer' 
  AND EXISTS (
    SELECT 1 FROM public.loads 
    WHERE id = load_id 
    AND customer_id = get_user_customer_id()
  )
);

CREATE POLICY "load_messages_carrier_insert" ON public.load_messages
FOR INSERT WITH CHECK (
  get_user_role() = 'Carrier' 
  AND EXISTS (
    SELECT 1 FROM public.loads 
    WHERE id = load_id 
    AND carrier_id = get_user_carrier_id()
  )
);

CREATE POLICY "load_messages_driver_insert" ON public.load_messages
FOR INSERT WITH CHECK (
  get_user_role() = 'Driver' 
  AND EXISTS (
    SELECT 1 FROM public.loads 
    WHERE id = load_id 
    AND driver_id = get_user_driver_id()
  )
);

-- =====================================================================
-- RLS Policies for INVOICES table
-- =====================================================================

-- Dispatchers can access all invoices
CREATE POLICY "invoices_dispatcher_all" ON public.invoices
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Customers can see their own invoices
CREATE POLICY "invoices_customer_own" ON public.invoices
FOR SELECT USING (
  get_user_role() = 'Customer' 
  AND customer_id = get_user_customer_id()
);

-- =====================================================================
-- RLS Policies for BIDS table
-- =====================================================================

-- Dispatchers can access all bids
CREATE POLICY "bids_dispatcher_all" ON public.bids
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Carriers can see and manage their own bids
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

CREATE POLICY "bids_carrier_update" ON public.bids
FOR UPDATE USING (
  get_user_role() = 'Carrier' 
  AND carrier_id = get_user_carrier_id()
);

-- Customers can see bids on their loads (read-only)
CREATE POLICY "bids_customer_load_bids" ON public.bids
FOR SELECT USING (
  get_user_role() = 'Customer' 
  AND EXISTS (
    SELECT 1 FROM public.loads 
    WHERE id = load_id 
    AND customer_id = get_user_customer_id()
  )
);

-- =====================================================================
-- Grant necessary permissions to authenticated users
-- =====================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant access to reference tables for all authenticated users
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.equipment_types TO authenticated;

-- Grant access to main tables (RLS will control access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_locations TO authenticated;
GRANT SELECT ON public.customer_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carriers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carrier_equipment_types TO authenticated;
GRANT SELECT ON public.carrier_documents TO authenticated;
GRANT SELECT, UPDATE ON public.drivers TO authenticated;
GRANT SELECT ON public.trucks TO authenticated;
GRANT SELECT ON public.trailers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.loads TO authenticated;
GRANT SELECT, INSERT ON public.load_documents TO authenticated;
GRANT SELECT, INSERT ON public.load_messages TO authenticated;
GRANT SELECT ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bids TO authenticated;

-- Grant access to helper functions
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_customer_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_carrier_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_driver_id() TO authenticated;

-- =====================================================================
-- Create indexes for RLS performance
-- =====================================================================

-- Index on user id for role lookups (if not already exists)
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_customer_id ON public.users(customer_id);
CREATE INDEX IF NOT EXISTS idx_users_carrier_id ON public.users(carrier_id);

-- Index on driver user_id
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);

-- Indexes for load access patterns
CREATE INDEX IF NOT EXISTS idx_loads_customer_id ON public.loads(customer_id);
CREATE INDEX IF NOT EXISTS idx_loads_carrier_id ON public.loads(carrier_id);
CREATE INDEX IF NOT EXISTS idx_loads_driver_id ON public.loads(driver_id);

COMMIT;
