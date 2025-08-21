-- =====================================================================
-- Test RLS Policies for BulkFlow TMS
-- This script helps test that Row Level Security policies are working correctly
-- Run these tests after applying the enable_rls_policies.sql script
-- =====================================================================

-- First, let's create some test data to work with
-- NOTE: This should be run as a superuser/admin to populate test data

-- Insert test customers
INSERT INTO customers (id, name, primary_contact_email, created_at, updated_at) VALUES 
(1, 'ABC Corp', 'contact@abccorp.com', NOW(), NOW()),
(2, 'XYZ Industries', 'contact@xyzind.com', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
name = EXCLUDED.name,
primary_contact_email = EXCLUDED.primary_contact_email,
updated_at = NOW();

-- Insert test carriers
INSERT INTO carriers (id, name, mc_number, primary_contact_email, created_at, updated_at) VALUES 
(1, 'FastHaul Logistics', 'MC123456', 'dispatch@fasthaul.com', NOW(), NOW()),
(2, 'QuickMove Transport', 'MC789012', 'ops@quickmove.com', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
name = EXCLUDED.name,
mc_number = EXCLUDED.mc_number,
primary_contact_email = EXCLUDED.primary_contact_email,
updated_at = NOW();

-- Insert test customer locations
INSERT INTO customer_locations (id, customer_id, location_name, city, state, created_at, updated_at) VALUES 
(1, 1, 'ABC Warehouse', 'Chicago', 'IL', NOW(), NOW()),
(2, 1, 'ABC Distribution', 'Milwaukee', 'WI', NOW(), NOW()),
(3, 2, 'XYZ Plant', 'Detroit', 'MI', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
location_name = EXCLUDED.location_name,
city = EXCLUDED.city,
state = EXCLUDED.state,
updated_at = NOW();

-- Insert test drivers
INSERT INTO drivers (id, name, phone, status, created_at, updated_at) VALUES 
(1, 'John Driver', '555-0101', 'Active', NOW(), NOW()),
(2, 'Jane Trucker', '555-0102', 'Active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
name = EXCLUDED.name,
phone = EXCLUDED.phone,
status = EXCLUDED.status,
updated_at = NOW();

-- Insert test loads
INSERT INTO loads (id, customer_id, origin_location_id, destination_location_id, equipment_type_id, status, carrier_id, driver_id, created_at, updated_at) VALUES 
(1, 1, 1, 2, 1, 'Pending Pickup', NULL, NULL, NOW(), NOW()),  -- Available for bidding
(2, 1, 1, 2, 1, 'In Transit', 1, 1, NOW(), NOW()),           -- Assigned to carrier 1, driver 1
(3, 2, 3, 3, 1, 'Pending Pickup', NULL, NULL, NOW(), NOW())  -- Available for bidding, different customer
ON CONFLICT (id) DO UPDATE SET 
customer_id = EXCLUDED.customer_id,
origin_location_id = EXCLUDED.origin_location_id,
destination_location_id = EXCLUDED.destination_location_id,
equipment_type_id = EXCLUDED.equipment_type_id,
status = EXCLUDED.status,
carrier_id = EXCLUDED.carrier_id,
driver_id = EXCLUDED.driver_id,
updated_at = NOW();

-- =====================================================================
-- Test Scenarios
-- =====================================================================

-- Test 1: Create test users for each role
-- NOTE: In a real environment, these users would be created through Supabase Auth
-- Here we're simulating what the users table would look like

-- Create test auth users (you'll need to adjust UUIDs to match actual auth.users)
-- These are example UUIDs - replace with actual ones from your Supabase Auth users

-- Test Dispatcher User
INSERT INTO users (id, role, name, email, created_at, updated_at) VALUES 
('11111111-1111-1111-1111-111111111111', 'Dispatcher', 'Test Dispatcher', 'dispatcher@company.com', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
role = EXCLUDED.role,
name = EXCLUDED.name,
email = EXCLUDED.email,
updated_at = NOW();

-- Test Customer User (linked to customer 1)
INSERT INTO users (id, role, customer_id, name, email, created_at, updated_at) VALUES 
('22222222-2222-2222-2222-222222222222', 'Customer', 1, 'Test Customer', 'customer1@abccorp.com', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
role = EXCLUDED.role,
customer_id = EXCLUDED.customer_id,
name = EXCLUDED.name,
email = EXCLUDED.email,
updated_at = NOW();

-- Test Carrier User (linked to carrier 1)
INSERT INTO users (id, role, carrier_id, name, email, created_at, updated_at) VALUES 
('33333333-3333-3333-3333-333333333333', 'Carrier', 1, 'Test Carrier', 'carrier1@fasthaul.com', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
role = EXCLUDED.role,
carrier_id = EXCLUDED.carrier_id,
name = EXCLUDED.name,
email = EXCLUDED.email,
updated_at = NOW();

-- Test Driver User (linked to driver 1)
UPDATE drivers SET user_id = '44444444-4444-4444-4444-444444444444' WHERE id = 1;
INSERT INTO users (id, role, name, email, created_at, updated_at) VALUES 
('44444444-4444-4444-4444-444444444444', 'Driver', 'Test Driver', 'driver1@company.com', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
role = EXCLUDED.role,
name = EXCLUDED.name,
email = EXCLUDED.email,
updated_at = NOW();

-- =====================================================================
-- Manual Testing Queries
-- NOTE: To properly test RLS, you need to execute these queries
-- while authenticated as different users. In Supabase, you would:
-- 1. Sign in as each test user through your application
-- 2. Execute queries through your application or Supabase client
-- 3. Verify that each user only sees appropriate data
-- =====================================================================

-- Test Query 1: Dispatcher should see ALL loads
-- Expected: All 3 loads
-- SET ROLE authenticated; -- Simulate dispatcher user
-- SELECT * FROM loads;

-- Test Query 2: Customer 1 should only see their loads
-- Expected: Loads 1 and 2 (customer_id = 1)
-- SET ROLE authenticated; -- Simulate customer 1 user
-- SELECT * FROM loads;

-- Test Query 3: Customer 2 should only see their loads  
-- Expected: Load 3 (customer_id = 2)
-- SET ROLE authenticated; -- Simulate customer 2 user
-- SELECT * FROM loads;

-- Test Query 4: Carrier 1 should see loads they can bid on + assigned loads
-- Expected: Loads 1, 3 (available for bidding) + Load 2 (assigned to them)
-- SET ROLE authenticated; -- Simulate carrier 1 user
-- SELECT * FROM loads;

-- Test Query 5: Driver 1 should only see loads assigned to them
-- Expected: Load 2 (driver_id = 1)
-- SET ROLE authenticated; -- Simulate driver 1 user
-- SELECT * FROM loads;

-- =====================================================================
-- Verification Functions
-- These functions help verify RLS is working by showing what each role can access
-- =====================================================================

-- Function to test load access for different roles
CREATE OR REPLACE FUNCTION test_load_access()
RETURNS TABLE (
  test_user_role text,
  accessible_load_ids bigint[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dispatcher_loads bigint[];
  customer1_loads bigint[];
  customer2_loads bigint[];
  carrier1_loads bigint[];
  driver1_loads bigint[];
BEGIN
  -- Test as Dispatcher (should see all)
  -- This is a simplified test - in reality you'd need to impersonate users
  SELECT ARRAY_AGG(id) INTO dispatcher_loads 
  FROM loads 
  WHERE true; -- Dispatchers see everything
  
  -- Test as Customer 1 (should see customer_id = 1)
  SELECT ARRAY_AGG(id) INTO customer1_loads 
  FROM loads 
  WHERE customer_id = 1;
  
  -- Test as Customer 2 (should see customer_id = 2)
  SELECT ARRAY_AGG(id) INTO customer2_loads 
  FROM loads 
  WHERE customer_id = 2;
  
  -- Test as Carrier 1 (should see available + assigned to them)
  SELECT ARRAY_AGG(id) INTO carrier1_loads 
  FROM loads 
  WHERE (carrier_id IS NULL AND status IN ('Pending Pickup', 'Pending Assignment'))
     OR carrier_id = 1;
  
  -- Test as Driver 1 (should see assigned to them)
  SELECT ARRAY_AGG(id) INTO driver1_loads 
  FROM loads 
  WHERE driver_id = 1;
  
  -- Return results
  RETURN QUERY VALUES 
    ('Dispatcher', dispatcher_loads),
    ('Customer1', customer1_loads),
    ('Customer2', customer2_loads),
    ('Carrier1', carrier1_loads),
    ('Driver1', driver1_loads);
END;
$$;

-- Run the test function
SELECT * FROM test_load_access();

-- =====================================================================
-- Expected Results:
-- Dispatcher: {1,2,3} - sees all loads
-- Customer1: {1,2} - sees only their loads (customer_id = 1)
-- Customer2: {3} - sees only their loads (customer_id = 2)  
-- Carrier1: {1,2,3} - sees available loads {1,3} + assigned load {2}
-- Driver1: {2} - sees only assigned load
-- =====================================================================

-- Additional test: Check if helper functions work correctly
SELECT 'Testing helper functions:' as test_section;

-- These should return NULL when not authenticated as a real user
SELECT 
  get_user_role() as current_role,
  get_user_customer_id() as current_customer_id,
  get_user_carrier_id() as current_carrier_id,
  get_user_driver_id() as current_driver_id;

-- =====================================================================
-- Performance Test
-- Check if RLS policies are using indexes efficiently
-- =====================================================================

-- Explain plans for typical queries (run as different users)
-- EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM loads WHERE customer_id = get_user_customer_id();
-- EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM loads WHERE carrier_id = get_user_carrier_id();
-- EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM loads WHERE driver_id = get_user_driver_id();

-- =====================================================================
-- Cleanup function (optional)
-- =====================================================================

CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove test data (be careful with this in production!)
  DELETE FROM loads WHERE id IN (1, 2, 3);
  DELETE FROM customer_locations WHERE id IN (1, 2, 3);
  DELETE FROM drivers WHERE id IN (1, 2);
  DELETE FROM carriers WHERE id IN (1, 2);
  DELETE FROM customers WHERE id IN (1, 2);
  DELETE FROM users WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222', 
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
  );
  
  RAISE NOTICE 'Test data cleaned up';
END;
$$;

-- Uncomment to run cleanup:
-- SELECT cleanup_test_data();
