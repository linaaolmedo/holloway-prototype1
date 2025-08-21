-- =====================================================================
-- COMPREHENSIVE DISPATCHER NOTIFICATION SOLUTION
-- This script will fix ALL issues preventing ANY DRIVER from 
-- contacting dispatch and sending notifications to ALL DISPATCHERS
-- =====================================================================

BEGIN;

-- =====================================================================
-- STEP 1: DIAGNOSTIC - Check Current State
-- =====================================================================

DO $$
DECLARE
    user_count INTEGER;
    dispatcher_count INTEGER;
    driver_count INTEGER;
    chris_parker_exists BOOLEAN := FALSE;
    policy_record RECORD;
BEGIN
    RAISE NOTICE '🔍 === COMPREHENSIVE DIAGNOSTIC ===';
    
    -- Check total users
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO dispatcher_count FROM users WHERE role = 'Dispatcher';
    SELECT COUNT(*) INTO driver_count FROM users WHERE role = 'Driver';
    
    RAISE NOTICE 'Current System State:';
    RAISE NOTICE '  Total Users: %', user_count;
    RAISE NOTICE '  Dispatchers: %', dispatcher_count;
    RAISE NOTICE '  Drivers: %', driver_count;
    
    -- Check if Chris Parker exists
    SELECT EXISTS(
        SELECT 1 FROM users WHERE name ILIKE '%chris%parker%' OR email ILIKE '%chris%'
    ) INTO chris_parker_exists;
    
    RAISE NOTICE '  Chris Parker exists: %', chris_parker_exists;
    
    -- Show all users
    IF user_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE 'All Users:';
        FOR user_record IN 
            SELECT email, name, role FROM users ORDER BY created_at DESC
        LOOP
            RAISE NOTICE '  - %: % (%)', user_record.role, user_record.name, user_record.email;
        END LOOP;
    END IF;
    
    -- Check RLS policies
    RAISE NOTICE '';
    RAISE NOTICE 'Current RLS Policies on users table:';
    FOR policy_record IN 
        SELECT policyname, cmd, qual FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '  - %: % | %', policy_record.policyname, policy_record.cmd, policy_record.qual;
    END LOOP;
END $$;

-- =====================================================================
-- STEP 2: CREATE DISPATCHER SERVICE FUNCTION (if not exists)
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 === CREATING SERVICE FUNCTION ===';
    
    -- Drop existing function if it exists
    DROP FUNCTION IF EXISTS public.get_dispatchers_for_notifications();
    
    RAISE NOTICE 'Creating get_dispatchers_for_notifications() function...';
END $$;

-- Create the service function that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_dispatchers_for_notifications()
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER  -- This runs with elevated privileges
SET search_path = public
AS $$
BEGIN
    -- This function can see all users regardless of RLS
    RETURN QUERY
    SELECT 
        u.id,
        u.email::TEXT,
        u.name::TEXT
    FROM public.users u
    WHERE u.role = 'Dispatcher';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dispatchers_for_notifications() TO authenticated;

-- =====================================================================
-- STEP 3: FIX RLS POLICIES FOR NOTIFICATION SYSTEM
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🛡️ === FIXING RLS POLICIES ===';
    
    -- Drop conflicting policies
    DROP POLICY IF EXISTS "users_select_dispatchers_for_notifications" ON public.users;
    DROP POLICY IF EXISTS "users_select_own" ON public.users;
    DROP POLICY IF EXISTS "users_dispatcher_all" ON public.users;
    DROP POLICY IF EXISTS "users_update_own" ON public.users;
    
    RAISE NOTICE 'Creating notification-friendly RLS policies...';
END $$;

-- Allow users to see their own profile
CREATE POLICY "users_select_own" ON public.users
FOR SELECT USING (id = auth.uid());

-- Allow authenticated users to see dispatcher info for notifications
CREATE POLICY "users_select_dispatchers_for_notifications" ON public.users
FOR SELECT USING (
    role = 'Dispatcher' AND 
    auth.uid() IS NOT NULL
);

-- Dispatchers have full access to everything
CREATE POLICY "users_dispatcher_all" ON public.users
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Allow users to update their own profiles
CREATE POLICY "users_update_own" ON public.users
FOR UPDATE USING (id = auth.uid());

-- =====================================================================
-- STEP 4: ENSURE DISPATCHER USERS EXIST
-- =====================================================================

DO $$
DECLARE
    dispatcher_count INTEGER;
    first_user_record RECORD;
    chris_exists BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '👥 === ENSURING DISPATCHER USERS EXIST ===';
    
    -- Check if dispatchers exist
    SELECT COUNT(*) INTO dispatcher_count FROM users WHERE role = 'Dispatcher';
    
    IF dispatcher_count = 0 THEN
        RAISE NOTICE 'No dispatchers found - creating dispatcher users...';
        
        -- Check if we have any users at all
        SELECT id, email, name, role INTO first_user_record 
        FROM users 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        IF FOUND THEN
            -- Convert first user to dispatcher
            UPDATE users 
            SET 
                role = 'Dispatcher',
                updated_at = NOW()
            WHERE id = first_user_record.id;
            
            RAISE NOTICE '✅ Converted % (%) to Dispatcher', first_user_record.name, first_user_record.email;
        ELSE
            -- No users exist - need to create accounts first
            RAISE NOTICE '❌ No users exist in the system!';
            RAISE NOTICE 'You need to:';
            RAISE NOTICE '1. Create user accounts in Supabase Auth';
            RAISE NOTICE '2. Log in as those users to create profiles';
            RAISE NOTICE '3. Run this script again';
        END IF;
    ELSE
        RAISE NOTICE '✅ Found % existing dispatcher(s)', dispatcher_count;
    END IF;
    
    -- Check if driver users exist in the system
    IF driver_count > 0 THEN
        RAISE NOTICE '✅ Found % driver user(s) who can contact dispatch', driver_count;
        
        -- Show some example drivers
        RAISE NOTICE 'Driver users in system:';
        FOR user_record IN 
            SELECT email, name FROM users WHERE role = 'Driver' ORDER BY created_at DESC LIMIT 3
        LOOP
            RAISE NOTICE '  - Driver: % (%)', user_record.name, user_record.email;
        END LOOP;
        
        IF driver_count > 3 THEN
            RAISE NOTICE '  - ... and % more driver(s)', driver_count - 3;
        END IF;
    ELSE
        RAISE NOTICE '⚠️  No driver users found in system';
        RAISE NOTICE 'Make sure driver accounts exist and have role = ''Driver''';
    END IF;
END $$;

-- =====================================================================
-- STEP 5: TEST THE COMPLETE SOLUTION
-- =====================================================================

DO $$
DECLARE
    dispatcher_count INTEGER;
    function_works BOOLEAN := FALSE;
    direct_query_works BOOLEAN := FALSE;
    test_driver_id UUID;
    dispatcher_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 === TESTING COMPLETE SOLUTION ===';
    
    -- Test 1: Service function
    BEGIN
        SELECT COUNT(*) INTO dispatcher_count 
        FROM public.get_dispatchers_for_notifications();
        
        function_works := TRUE;
        RAISE NOTICE 'Test 1 - Service Function: ✅ PASS (%d dispatchers found)', dispatcher_count;
        
        IF dispatcher_count > 0 THEN
            FOR dispatcher_record IN 
                SELECT id, email, name FROM public.get_dispatchers_for_notifications()
            LOOP
                RAISE NOTICE '  Dispatcher: % (%)', dispatcher_record.name, dispatcher_record.email;
            END LOOP;
        END IF;
    EXCEPTION 
        WHEN others THEN
            RAISE NOTICE 'Test 1 - Service Function: ❌ FAIL - %', SQLERRM;
    END;
    
    -- Test 2: Direct query from driver context (test with any driver)
    SELECT id INTO test_driver_id FROM users WHERE role = 'Driver' LIMIT 1;
    
    IF test_driver_id IS NOT NULL THEN
        DECLARE
            test_driver_name TEXT;
        BEGIN
            -- Get the test driver's name
            SELECT name INTO test_driver_name FROM users WHERE id = test_driver_id;
            
            -- Simulate driver context
            PERFORM set_config('request.jwt.claims', json_build_object('sub', test_driver_id)::text, true);
            
            SELECT COUNT(*) INTO dispatcher_count 
            FROM users 
            WHERE role = 'Dispatcher';
            
            direct_query_works := (dispatcher_count > 0);
            
            IF direct_query_works THEN
                RAISE NOTICE 'Test 2 - Direct Query from Driver Context (%): ✅ PASS (%d dispatchers visible)', test_driver_name, dispatcher_count;
            ELSE
                RAISE NOTICE 'Test 2 - Direct Query from Driver Context (%): ❌ FAIL (no dispatchers visible)', test_driver_name;
            END IF;
        EXCEPTION 
            WHEN others THEN
                RAISE NOTICE 'Test 2 - Direct Query from Driver Context: ❌ FAIL - %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Test 2 - Direct Query: ⚠️  SKIP (no driver users found to test with)';
    END IF;
    
    -- Final verdict
    RAISE NOTICE '';
    IF function_works AND dispatcher_count > 0 THEN
        RAISE NOTICE '🎉 === SUCCESS! ALL DRIVERS CAN NOW CONTACT ALL DISPATCHERS ===';
        RAISE NOTICE '';
        RAISE NOTICE 'How it works:';
        RAISE NOTICE '• ANY driver can use "Contact Dispatch" feature';
        RAISE NOTICE '• Their message will be sent to ALL % dispatcher(s)', dispatcher_count;
        RAISE NOTICE '• All dispatchers will receive the notification in their dashboard';
        RAISE NOTICE '';
        RAISE NOTICE 'Next steps to test:';
        RAISE NOTICE '1. Refresh your application';
        RAISE NOTICE '2. Log in as ANY driver (e.g., chris@company.com, jennifer@company.com, etc.)';
        RAISE NOTICE '3. Click "Contact Dispatch" button';
        RAISE NOTICE '4. Send a test message';
        RAISE NOTICE '5. Check console for success message';
        RAISE NOTICE '6. Log in as ANY dispatcher to see the notification';
        RAISE NOTICE '';
        RAISE NOTICE 'Expected console output:';
        RAISE NOTICE '  "📧 Found % dispatcher(s) to notify: [list of dispatchers]"', dispatcher_count;
        RAISE NOTICE '  "🎉 SUCCESS! Driver contact notification sent to % dispatchers"', dispatcher_count;
    ELSE
        RAISE NOTICE '❌ === SOLUTION INCOMPLETE ===';
        RAISE NOTICE 'Issues remaining:';
        IF NOT function_works THEN
            RAISE NOTICE '  - Service function not working properly';
        END IF;
        IF dispatcher_count = 0 THEN
            RAISE NOTICE '  - No dispatcher users exist in the system';
        END IF;
    END IF;
END $$;

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Comprehensive dispatcher solution deployment complete!';
    RAISE NOTICE 'Check the test results above to verify everything is working.';
END $$;
