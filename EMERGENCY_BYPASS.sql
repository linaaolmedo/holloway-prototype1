-- =====================================================================
-- EMERGENCY BYPASS - Temporarily disable RLS to test if that's the issue
-- WARNING: This temporarily removes security - only use for testing!
-- =====================================================================

-- Step 1: Temporarily disable RLS on customers table
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_locations DISABLE ROW LEVEL SECURITY;

-- Step 2: Test if customers are now visible
SELECT 
  'Emergency Test' as test,
  COUNT(*) as customers_now_visible,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ CUSTOMERS FOUND! RLS was the problem.'
    ELSE '❌ Still no customers - RLS is NOT the issue.'
  END as diagnosis
FROM public.customers;

-- Step 3: Show first few customers if they exist
SELECT 
  'Sample Customers' as test,
  id,
  name,
  primary_contact_email
FROM public.customers 
LIMIT 5;

-- Step 4: Re-enable RLS (IMPORTANT - don't leave it disabled!)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_locations ENABLE ROW LEVEL SECURITY;

SELECT '⚠️ RLS has been re-enabled for security.' as security_notice;
