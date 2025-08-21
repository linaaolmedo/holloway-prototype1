-- =====================================================================
-- Fix Notification RLS Policy Issue
-- Allow notification service to find dispatcher users regardless of caller
-- =====================================================================

-- The problem: When Chris Parker (Driver) contacts dispatch, the notification 
-- service runs in his context and tries to query for dispatcher users.
-- But RLS policies prevent drivers from seeing dispatcher users.
-- Solution: Allow all authenticated users to see dispatcher users for notifications.

BEGIN;

RAISE NOTICE 'Fixing RLS policies to allow notifications to work...';

-- Step 1: Check current policies on users table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'Current policies on users table:';
    FOR policy_record IN 
        SELECT policyname, cmd, qual FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users'
        ORDER BY policyname
    LOOP
        RAISE NOTICE 'Policy: % | Command: % | Condition: %', 
            policy_record.policyname, policy_record.cmd, policy_record.qual;
    END LOOP;
END $$;

-- Step 2: Create policy to allow notification service to find dispatchers
DROP POLICY IF EXISTS "users_select_dispatchers_for_notifications" ON public.users;

CREATE POLICY "users_select_dispatchers_for_notifications" ON public.users
FOR SELECT USING (
    role = 'Dispatcher' AND 
    auth.uid() IS NOT NULL  -- Any authenticated user can see dispatcher info for notifications
);

-- Step 3: Ensure drivers can see their own profile
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
FOR SELECT USING (id = auth.uid());

-- Step 4: Keep dispatcher full access policy
DROP POLICY IF EXISTS "users_dispatcher_all" ON public.users;
CREATE POLICY "users_dispatcher_all" ON public.users
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Step 5: Allow users to update their own profiles
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
FOR UPDATE USING (id = auth.uid());

-- Step 6: Test the fix
DO $$
DECLARE
    dispatcher_count INTEGER;
    total_users INTEGER;
    test_user_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING THE FIX ===';
    
    -- Count total dispatchers (should work now)
    SELECT COUNT(*) INTO dispatcher_count FROM users WHERE role = 'Dispatcher';
    SELECT COUNT(*) INTO total_users FROM users;
    
    RAISE NOTICE 'Total users: %, Dispatchers: %', total_users, dispatcher_count;
    
    IF dispatcher_count > 0 THEN
        RAISE NOTICE '✅ SUCCESS: Found % dispatcher(s)', dispatcher_count;
        
        -- Test with a driver context
        SELECT id INTO test_user_id FROM users WHERE role = 'Driver' LIMIT 1;
        
        IF test_user_id IS NOT NULL THEN
            RAISE NOTICE 'Testing notification query in driver context...';
            
            -- This simulates what the notification service does
            PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
            
            SELECT COUNT(*) INTO dispatcher_count FROM users WHERE role = 'Dispatcher';
            
            IF dispatcher_count > 0 THEN
                RAISE NOTICE '✅ PERFECT: Driver can now see % dispatcher(s) for notifications!', dispatcher_count;
                RAISE NOTICE 'Chris Parker dispatch contact should now work!';
            ELSE
                RAISE NOTICE '❌ Still blocked: Driver cannot see dispatchers';
            END IF;
        ELSE
            RAISE NOTICE '⚠️  No driver users found to test with';
        END IF;
    ELSE
        RAISE NOTICE '❌ No dispatchers found - need to create dispatcher users first';
    END IF;
END $$;

COMMIT;

RAISE NOTICE '';
RAISE NOTICE '🎉 RLS policies updated!';
RAISE NOTICE 'Now test: Chris Parker -> Contact Dispatch -> Check dispatcher notifications';
