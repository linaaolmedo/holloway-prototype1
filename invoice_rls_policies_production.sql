-- Production-Ready Invoice RLS Policies (Optional Advanced Setup)
-- This file contains more restrictive policies based on user roles
-- Use this if you want to implement role-based access control

-- First, ensure you have user roles set up in your profiles table
-- CREATE TABLE IF NOT EXISTS profiles (
--   id UUID REFERENCES auth.users ON DELETE CASCADE,
--   role TEXT CHECK (role IN ('admin', 'dispatcher', 'billing', 'customer')),
--   company_id INTEGER,
--   PRIMARY KEY (id)
-- );

-- Enable RLS on invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admin and billing users can manage invoices" ON invoices;
DROP POLICY IF EXISTS "Customers can view their invoices" ON invoices;
DROP POLICY IF EXISTS "All authenticated users can view invoices" ON invoices;

-- Production Policy Option 1: Role-based access
-- Uncomment and modify these if you have user roles implemented

/*
-- Admin and billing users can do everything
CREATE POLICY "Admin and billing users can manage invoices" ON invoices
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'billing', 'dispatcher')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'billing', 'dispatcher')
        )
    );

-- Customers can only view invoices for their company
CREATE POLICY "Customers can view their invoices" ON invoices
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN customers c ON c.id = invoices.customer_id
            WHERE p.id = auth.uid() 
            AND p.role = 'customer'
            AND p.company_id = c.id
        )
    );
*/

-- Production Policy Option 2: Simple authenticated user access (RECOMMENDED FOR NOW)
-- This is safer than the wide-open policies but still allows your app to function

-- Allow authenticated users to view invoices
CREATE POLICY "Authenticated users can view invoices" ON invoices
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow authenticated users to insert invoices
CREATE POLICY "Authenticated users can insert invoices" ON invoices
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Allow authenticated users to update invoices
CREATE POLICY "Authenticated users can update invoices" ON invoices
    FOR UPDATE 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Allow authenticated users to delete invoices (optional - comment out if not needed)
CREATE POLICY "Authenticated users can delete invoices" ON invoices
    FOR DELETE 
    TO authenticated 
    USING (true);

-- Ensure loads table allows updates for invoice_id
CREATE POLICY "Authenticated users can update loads for invoicing" ON loads
    FOR UPDATE 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON loads TO authenticated;

-- Verify policies
SELECT 
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename IN ('invoices', 'loads')
ORDER BY tablename, policyname;
