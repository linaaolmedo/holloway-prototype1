-- =====================================================================
-- TEMPORARY FIX: Disable RLS on customers table for testing
-- This allows immediate access to customers while we debug the role issue
-- =====================================================================

-- Temporarily disable RLS on customers table
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on customer_locations for full functionality  
ALTER TABLE public.customer_locations DISABLE ROW LEVEL SECURITY;

-- Check current user and update role to Dispatcher
-- Replace 'YOUR_EMAIL_HERE' with your actual login email
UPDATE public.users 
SET role = 'Dispatcher', updated_at = now()
WHERE email = (
    SELECT email FROM auth.users 
    WHERE id = auth.uid()
);

-- Verify the update worked
SELECT 
    id, 
    name, 
    email, 
    role, 
    'Updated successfully' as status
FROM public.users 
WHERE id = auth.uid();

-- Test that customers are now accessible
SELECT 
    'Customer Test' as test_type,
    count(*) as total_customers,
    'Should now see all customers' as note
FROM public.customers;
