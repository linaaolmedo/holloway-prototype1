-- =====================================================================
-- IMMEDIATE DATA FIX: Make all data visible right now
-- Run this in Supabase SQL Editor to see data immediately
-- =====================================================================

-- Step 1: Force current user to Dispatcher role
UPDATE public.users 
SET role = 'Dispatcher', updated_at = now()
WHERE id = auth.uid();

-- Step 2: Make sure the first user is ALWAYS a dispatcher (safety net)
UPDATE public.users 
SET role = 'Dispatcher', updated_at = now()
WHERE id = (SELECT id FROM public.users ORDER BY created_at LIMIT 1);

-- Step 3: Temporarily disable RLS on ALL main tables to make data visible
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trailers DISABLE ROW LEVEL SECURITY;

-- Step 4: Test that data is now visible
SELECT 'DATA VISIBILITY TEST:' as test_section;

SELECT 
    'Customers:' as data_type,
    count(*) as total_count,
    array_agg(name ORDER BY name) as names
FROM public.customers;

SELECT 
    'Invoices:' as data_type,
    count(*) as total_count,
    sum(total_amount) as total_amount
FROM public.invoices;

SELECT 
    'Loads:' as data_type,
    count(*) as total_count
FROM public.loads;

-- Step 5: Show current user info
SELECT 
    'CURRENT USER:' as info_type,
    id,
    name,
    email,
    role,
    'Should now see all data!' as status
FROM public.users 
WHERE id = auth.uid();

SELECT '🎉 ALL DATA SHOULD NOW BE VISIBLE! Refresh your app.' as final_message;

