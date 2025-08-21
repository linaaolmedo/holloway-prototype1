-- =====================================================================
-- Complete Dispatcher Diagnostic & Fix
-- This script will diagnose AND fix the dispatcher notification issue
-- =====================================================================

-- Step 1: Check if our function exists
DO $$
BEGIN
    RAISE NOTICE '=== CHECKING FUNCTION EXISTENCE ===';
    
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'get_dispatchers_for_notifications'
    ) THEN
        RAISE NOTICE '✅ Function get_dispatchers_for_notifications EXISTS';
    ELSE
        RAISE NOTICE '❌ Function get_dispatchers_for_notifications DOES NOT EXIST';
        RAISE NOTICE 'Creating the function now...';
        
        -- Create the function
        CREATE OR REPLACE FUNCTION public.get_dispatchers_for_notifications()
        RETURNS TABLE (
            id UUID,
            email TEXT,
            name TEXT
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $func$
        BEGIN
            RETURN QUERY
            SELECT 
                u.id,
                u.email::TEXT,
                u.name::TEXT
            FROM public.users u
            WHERE u.role = 'Dispatcher';
        END;
        $func$;
        
        -- Grant permissions
        GRANT EXECUTE ON FUNCTION public.get_dispatchers_for_notifications() TO authenticated;
        
        RAISE NOTICE '✅ Function created successfully!';
    END IF;
END $$;

-- Step 2: Test the function
DO $$
DECLARE
    dispatcher_count INTEGER;
    dispatcher_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING FUNCTION ===';
    
    SELECT COUNT(*) INTO dispatcher_count 
    FROM public.get_dispatchers_for_notifications();
    
    RAISE NOTICE 'Dispatchers found via function: %', dispatcher_count;
    
    IF dispatcher_count = 0 THEN
        RAISE NOTICE '❌ No dispatchers found - checking if users exist at all...';
        
        -- Temporarily disable RLS to check users
        SET row_security = off;
        
        DECLARE
            total_users INTEGER;
            user_record RECORD;
        BEGIN
            SELECT COUNT(*) INTO total_users FROM users;
            RAISE NOTICE 'Total users in database: %', total_users;
            
            IF total_users = 0 THEN
                RAISE NOTICE '❌ NO USERS EXIST - You need to create users first!';
                RAISE NOTICE 'Steps to fix:';
                RAISE NOTICE '1. Sign up for accounts in your app';
                RAISE NOTICE '2. Log in to create user profiles';  
                RAISE NOTICE '3. Run this script again';
            ELSE
                RAISE NOTICE 'Existing users:';
                FOR user_record IN 
                    SELECT email, name, role FROM users ORDER BY created_at DESC LIMIT 5
                LOOP
                    RAISE NOTICE '- %: % (%)', user_record.role, user_record.name, user_record.email;
                END LOOP;
                
                -- Create a dispatcher from existing users
                RAISE NOTICE '';
                RAISE NOTICE 'Converting first user to dispatcher...';
                
                UPDATE users 
                SET role = 'Dispatcher', updated_at = NOW()
                WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);
                
                RAISE NOTICE '✅ Converted first user to dispatcher!';
            END IF;
        END;
        
        -- Re-enable RLS
        SET row_security = on;
        
    ELSE
        RAISE NOTICE '✅ Found % dispatcher(s):', dispatcher_count;
        FOR dispatcher_record IN 
            SELECT id, email, name FROM public.get_dispatchers_for_notifications()
        LOOP
            RAISE NOTICE '  - %: %', dispatcher_record.name, dispatcher_record.email;
        END LOOP;
    END IF;
END $$;

-- Step 3: Final verification
DO $$
DECLARE
    dispatcher_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    
    SELECT COUNT(*) INTO dispatcher_count 
    FROM public.get_dispatchers_for_notifications();
    
    IF dispatcher_count > 0 THEN
        RAISE NOTICE '🎉 SUCCESS! % dispatcher(s) found via function', dispatcher_count;
        RAISE NOTICE '';
        RAISE NOTICE 'Chris Parker dispatch contact should now work!';
        RAISE NOTICE 'Test steps:';
        RAISE NOTICE '1. Refresh your app';
        RAISE NOTICE '2. Log in as Chris Parker';
        RAISE NOTICE '3. Contact dispatch';
        RAISE NOTICE '4. Check console for success message';
        RAISE NOTICE '5. Log in as dispatcher to see notification';
    ELSE
        RAISE NOTICE '❌ Still no dispatchers found';
        RAISE NOTICE 'Manual action required - create dispatcher users';
    END IF;
END $$;
