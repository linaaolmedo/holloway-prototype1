-- =====================================================================
-- Debug RLS Notification Issue
-- The notification service can't find dispatchers due to RLS policies
-- =====================================================================

-- Step 1: Check if dispatcher users actually exist
DO $$
DECLARE
    dispatcher_count INTEGER;
    total_count INTEGER;
    user_record RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING DISPATCHER USERS (BYPASSING RLS) ===';
    
    -- Disable RLS temporarily to check actual data
    SET row_security = off;
    
    SELECT COUNT(*) INTO total_count FROM users;
    SELECT COUNT(*) INTO dispatcher_count FROM users WHERE role = 'Dispatcher';
    
    RAISE NOTICE 'Total users: %, Dispatchers: %', total_count, dispatcher_count;
    
    IF dispatcher_count > 0 THEN
        RAISE NOTICE 'Dispatcher users found:';
        FOR user_record IN 
            SELECT id, email, name, role FROM users WHERE role = 'Dispatcher'
        LOOP
            RAISE NOTICE '✅ %: % (%)', user_record.role, user_record.name, user_record.email;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ No dispatcher users found - creating one now...';
        
        -- Create a test dispatcher user
        INSERT INTO auth.users (
            instance_id, 
            id, 
            aud, 
            role, 
            email, 
            encrypted_password, 
            email_confirmed_at, 
            created_at, 
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'dispatcher@company.com',
            crypt('password123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            false,
            '',
            '',
            '',
            ''
        );
        
        -- Get the created user ID
        DECLARE
            new_user_id UUID;
        BEGIN
            SELECT id INTO new_user_id FROM auth.users WHERE email = 'dispatcher@company.com';
            
            -- Create the user profile
            INSERT INTO public.users (id, role, name, email, created_at, updated_at)
            VALUES (
                new_user_id,
                'Dispatcher',
                'Test Dispatcher',
                'dispatcher@company.com',
                NOW(),
                NOW()
            );
            
            RAISE NOTICE '✅ Created dispatcher user: dispatcher@company.com (password: password123)';
        END;
    END IF;
    
    -- Re-enable RLS
    SET row_security = on;
END $$;

-- Step 2: Check RLS policies on users table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

-- Step 3: Test what a driver can see
DO $$
DECLARE
    driver_user_id UUID;
    dispatcher_count INTEGER;
BEGIN
    RAISE NOTICE '=== TESTING DRIVER ACCESS TO DISPATCHERS ===';
    
    -- Find a driver user ID
    SELECT id INTO driver_user_id FROM users WHERE role = 'Driver' LIMIT 1;
    
    IF driver_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with driver user ID: %', driver_user_id;
        
        -- Simulate what the notification service query does
        -- This should run in the context of the driver
        PERFORM set_config('request.jwt.claims', json_build_object('sub', driver_user_id)::text, true);
        
        -- Count dispatchers visible to this driver
        SELECT COUNT(*) INTO dispatcher_count 
        FROM users 
        WHERE role = 'Dispatcher';
        
        RAISE NOTICE 'Dispatchers visible to driver: %', dispatcher_count;
        
        IF dispatcher_count = 0 THEN
            RAISE NOTICE '❌ PROBLEM: Driver cannot see dispatcher users due to RLS policies!';
            RAISE NOTICE 'The notification service runs in the driver context and cannot find dispatchers.';
        ELSE
            RAISE NOTICE '✅ Driver can see dispatchers - RLS is working correctly';
        END IF;
    ELSE
        RAISE NOTICE '❌ No driver users found to test with';
    END IF;
END $$;
