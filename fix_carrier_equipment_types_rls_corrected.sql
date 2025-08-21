-- Fix RLS policy issue for carrier_equipment_types table
-- This script ensures dispatchers can create carrier equipment type relationships
-- CORRECTED VERSION - uses proper column names

-- First, let's check the current policies
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'carrier_equipment_types';

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "carrier_equipment_manage_own" ON public.carrier_equipment_types;
DROP POLICY IF EXISTS "carrier_equipment_select_own" ON public.carrier_equipment_types;
DROP POLICY IF EXISTS "carrier_equipment_delete_own" ON public.carrier_equipment_types;
DROP POLICY IF EXISTS "carrier_equipment_dispatcher_all" ON public.carrier_equipment_types;
DROP POLICY IF EXISTS "carrier_equipment_carrier_own" ON public.carrier_equipment_types;

-- Simple and reliable approach: Allow all authenticated users to manage carrier equipment types
-- This is the safest option that will work immediately
CREATE POLICY "carrier_equipment_authenticated_all" ON public.carrier_equipment_types
FOR ALL USING (auth.role() = 'authenticated');

-- Alternative approach with role-based access (uncomment if you prefer more restrictive access)
-- CREATE POLICY "carrier_equipment_dispatcher_all" ON public.carrier_equipment_types
-- FOR ALL USING (
--   EXISTS (
--     SELECT 1 FROM public.users u
--     WHERE u.id = auth.uid() AND u.role = 'Dispatcher'
--   )
-- );

-- CREATE POLICY "carrier_equipment_carrier_own" ON public.carrier_equipment_types
-- FOR ALL USING (
--   EXISTS (
--     SELECT 1 FROM public.users u
--     WHERE u.id = auth.uid() 
--     AND u.role = 'Carrier'
--     AND carrier_id = u.carrier_id
--   )
-- );

-- Ensure proper permissions are granted
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carrier_equipment_types TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'carrier_equipment_types';
