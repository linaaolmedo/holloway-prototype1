-- =====================================================================
-- QUICK FIX: Customer Access Issue - Run this in Supabase SQL Editor
-- =====================================================================

BEGIN;

-- Fix current user's role to Dispatcher
UPDATE public.users 
SET 
    role = 'Dispatcher', 
    updated_at = now()
WHERE id = auth.uid()
  AND role != 'Dispatcher';

-- Ensure the first user is always a Dispatcher (fallback)
UPDATE public.users 
SET 
    role = 'Dispatcher',
    updated_at = now()
WHERE id = (
    SELECT id FROM public.users 
    ORDER BY created_at ASC 
    LIMIT 1
)
AND role != 'Dispatcher';

-- Test the fix immediately
SELECT 
    'Current User Role:' as check,
    role,
    CASE 
        WHEN role = 'Dispatcher' THEN '✅ FIXED - Should have customer access now'
        ELSE '❌ Still needs fixing'
    END as status
FROM public.users 
WHERE id = auth.uid();

COMMIT;

-- Refresh your app after running this!
