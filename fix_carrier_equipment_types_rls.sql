-- Fix RLS policy issue for carrier_equipment_types table
-- This script ensures dispatchers can create carrier equipment type relationships

-- First, let's check the current policies
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'carrier_equipment_types';

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "carrier_equipment_manage_own" ON public.carrier_equipment_types;
DROP POLICY IF EXISTS "carrier_equipment_select_own" ON public.carrier_equipment_types;
DROP POLICY IF EXISTS "carrier_equipment_delete_own" ON public.carrier_equipment_types;

-- Recreate the policies with proper permissions
-- Dispatchers can manage all carrier equipment types
CREATE POLICY "carrier_equipment_dispatcher_all" ON public.carrier_equipment_types
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'Dispatcher'
  )
);

-- Carriers can view and manage their own equipment types  
CREATE POLICY "carrier_equipment_carrier_own" ON public.carrier_equipment_types
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.role = 'Carrier'
    AND carrier_id = u.carrier_id
  )
);

-- Alternative simpler approach: Allow all authenticated users to manage carrier equipment types
-- (You can use this if the above doesn't work due to role function issues)
-- DROP POLICY IF EXISTS "carrier_equipment_dispatcher_all" ON public.carrier_equipment_types;
-- DROP POLICY IF EXISTS "carrier_equipment_carrier_own" ON public.carrier_equipment_types;
-- CREATE POLICY "carrier_equipment_authenticated_all" ON public.carrier_equipment_types
-- FOR ALL USING (auth.role() = 'authenticated');

-- Ensure proper permissions are granted
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carrier_equipment_types TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'carrier_equipment_types';
