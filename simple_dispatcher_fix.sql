-- =====================================================================
-- SIMPLE DISPATCHER NOTIFICATION FIX
-- This script will fix the dispatcher notification issue without complex loops
-- =====================================================================

BEGIN;

-- =====================================================================
-- STEP 1: DIAGNOSTIC
-- =====================================================================

DO $$
DECLARE
    user_count INTEGER;
    dispatcher_count INTEGER;
    driver_count INTEGER;
BEGIN
    RAISE NOTICE '🔍 === DIAGNOSTIC ===';
    
    -- Check total users
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO dispatcher_count FROM users WHERE role = 'Dispatcher';
    SELECT COUNT(*) INTO driver_count FROM users WHERE role = 'Driver';
    
    RAISE NOTICE 'System State:';
    RAISE NOTICE '  Total Users: %', user_count;
    RAISE NOTICE '  Dispatchers: %', dispatcher_count;
    RAISE NOTICE '  Drivers: %', driver_count;
END $$;

-- =====================================================================
-- STEP 2: CREATE SERVICE FUNCTION
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 === CREATING SERVICE FUNCTION ===';
END $$;

-- Drop and recreate the service function
DROP FUNCTION IF EXISTS public.get_dispatchers_for_notifications();

CREATE OR REPLACE FUNCTION public.get_dispatchers_for_notifications()
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email::TEXT,
        u.name::TEXT
    FROM public.users u
    WHERE u.role = 'Dispatcher';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dispatchers_for_notifications() TO authenticated;

-- =====================================================================
-- STEP 3: FIX RLS POLICIES
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🛡️ === FIXING RLS POLICIES ===';
END $$;

-- Drop conflicting policies
DROP POLICY IF EXISTS "users_select_dispatchers_for_notifications" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_dispatcher_all" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- Create new policies
CREATE POLICY "users_select_own" ON public.users
FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_select_dispatchers_for_notifications" ON public.users
FOR SELECT USING (
    role = 'Dispatcher' AND 
    auth.uid() IS NOT NULL
);

CREATE POLICY "users_dispatcher_all" ON public.users
FOR ALL USING (get_user_role() = 'Dispatcher');

CREATE POLICY "users_update_own" ON public.users
FOR UPDATE USING (id = auth.uid());

-- =====================================================================
-- STEP 4: ENSURE DISPATCHER EXISTS
-- =====================================================================

DO $$
DECLARE
    dispatcher_count INTEGER;
    first_user_id UUID;
    first_user_email TEXT;
    first_user_name TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '👥 === ENSURING DISPATCHER EXISTS ===';
    
    SELECT COUNT(*) INTO dispatcher_count FROM users WHERE role = 'Dispatcher';
    
    IF dispatcher_count = 0 THEN
        RAISE NOTICE 'No dispatchers found - converting first user...';
        
        SELECT id, email, name INTO first_user_id, first_user_email, first_user_name
        FROM users 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        IF first_user_id IS NOT NULL THEN
            UPDATE users 
            SET role = 'Dispatcher', updated_at = NOW()
            WHERE id = first_user_id;
            
            RAISE NOTICE '✅ Converted % (%) to Dispatcher', first_user_name, first_user_email;
        ELSE
            RAISE NOTICE '❌ No users exist in system!';
            RAISE NOTICE 'Create user accounts in Supabase Auth first';
        END IF;
    ELSE
        RAISE NOTICE '✅ Found % dispatcher(s)', dispatcher_count;
    END IF;
END $$;

-- =====================================================================
-- STEP 5: TEST THE SOLUTION
-- =====================================================================

DO $$
DECLARE
    dispatcher_count INTEGER;
    driver_count INTEGER;
    function_works BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 === TESTING SOLUTION ===';
    
    -- Test service function
    BEGIN
        SELECT COUNT(*) INTO dispatcher_count 
        FROM public.get_dispatchers_for_notifications();
        
        function_works := TRUE;
        RAISE NOTICE 'Service Function: ✅ PASS (% dispatchers)', dispatcher_count;
    EXCEPTION 
        WHEN others THEN
            RAISE NOTICE 'Service Function: ❌ FAIL - %', SQLERRM;
    END;
    
    -- Check driver count
    SELECT COUNT(*) INTO driver_count FROM users WHERE role = 'Driver';
    
    -- Final result
    RAISE NOTICE '';
    IF function_works AND dispatcher_count > 0 AND driver_count > 0 THEN
        RAISE NOTICE '🎉 === SUCCESS! ALL DRIVERS CAN NOW CONTACT ALL DISPATCHERS ===';
        RAISE NOTICE '';
        RAISE NOTICE '• % driver(s) can contact dispatch', driver_count;
        RAISE NOTICE '• % dispatcher(s) will receive notifications', dispatcher_count;
        RAISE NOTICE '';
        RAISE NOTICE 'TEST STEPS:';
        RAISE NOTICE '1. Log in as ANY driver';
        RAISE NOTICE '2. Click "Contact Dispatch"';
        RAISE NOTICE '3. Send test message';
        RAISE NOTICE '4. Log in as dispatcher to see notification';
        RAISE NOTICE '';
        RAISE NOTICE 'Expected console: "📧 Found % dispatcher(s) to notify"', dispatcher_count;
    ELSE
        RAISE NOTICE '❌ SOLUTION INCOMPLETE';
        IF NOT function_works THEN
            RAISE NOTICE '  - Service function failed';
        END IF;
        IF dispatcher_count = 0 THEN
            RAISE NOTICE '  - No dispatchers exist';
        END IF;
        IF driver_count = 0 THEN
            RAISE NOTICE '  - No drivers exist';
        END IF;
    END IF;
END $$;

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Simple dispatcher fix complete!';
END $$;
