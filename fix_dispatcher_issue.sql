-- =====================================================================
-- Fix Dispatcher Issue - Comprehensive Solution
-- This script will check existing users and create a dispatcher
-- =====================================================================

-- Step 1: Check current users in the system
DO $$
DECLARE
    user_record RECORD;
    dispatcher_count INTEGER;
    total_users INTEGER;
BEGIN
    RAISE NOTICE '=== CHECKING EXISTING USERS ===';
    
    -- Count total users
    SELECT COUNT(*) INTO total_users FROM users;
    RAISE NOTICE 'Total users in system: %', total_users;
    
    -- Count dispatchers
    SELECT COUNT(*) INTO dispatcher_count FROM users WHERE role = 'Dispatcher';
    RAISE NOTICE 'Current dispatchers: %', dispatcher_count;
    
    -- Show all users
    RAISE NOTICE 'All users in system:';
    FOR user_record IN 
        SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC
    LOOP
        RAISE NOTICE 'User: % | Email: % | Role: % | Created: %', 
            user_record.name, user_record.email, user_record.role, user_record.created_at;
    END LOOP;
    
    -- Show the problem
    IF dispatcher_count = 0 THEN
        RAISE NOTICE '❌ PROBLEM FOUND: No dispatcher users exist!';
        RAISE NOTICE 'This is why Chris Parker cannot send notifications to dispatch.';
    ELSE
        RAISE NOTICE '✅ Found % dispatcher(s)', dispatcher_count;
    END IF;
END $$;

-- Step 2: Create a dispatcher user if none exist
DO $$
DECLARE
    dispatcher_count INTEGER;
    first_user_record RECORD;
    new_dispatcher_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CREATING DISPATCHER SOLUTION ===';
    
    -- Check if we need to create a dispatcher
    SELECT COUNT(*) INTO dispatcher_count FROM users WHERE role = 'Dispatcher';
    
    IF dispatcher_count = 0 THEN
        -- Option 1: Convert the first user to a dispatcher
        SELECT id, email, name, role INTO first_user_record 
        FROM users 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        IF FOUND THEN
            RAISE NOTICE 'Converting first user to dispatcher...';
            RAISE NOTICE 'User to convert: % (%) - Current role: %', 
                first_user_record.name, first_user_record.email, first_user_record.role;
            
            -- Update the user's role to Dispatcher
            UPDATE users 
            SET 
                role = 'Dispatcher',
                updated_at = NOW()
            WHERE id = first_user_record.id;
            
            RAISE NOTICE '✅ SUCCESS: % is now a dispatcher!', first_user_record.name;
            RAISE NOTICE 'They can now receive notifications from drivers like Chris Parker.';
            
        ELSE
            -- No users exist at all - need to create one via Supabase Auth first
            RAISE NOTICE '❌ No users found in system!';
            RAISE NOTICE 'You need to:';
            RAISE NOTICE '1. Create a user account in Supabase Auth';
            RAISE NOTICE '2. Log in as that user to create their profile';
            RAISE NOTICE '3. Then run this script to make them a dispatcher';
        END IF;
    ELSE
        RAISE NOTICE '✅ Dispatcher(s) already exist - no action needed';
    END IF;
END $$;

-- Step 3: Verify the fix
DO $$
DECLARE
    dispatcher_count INTEGER;
    dispatcher_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION ===';
    
    SELECT COUNT(*) INTO dispatcher_count FROM users WHERE role = 'Dispatcher';
    RAISE NOTICE 'Dispatchers after fix: %', dispatcher_count;
    
    IF dispatcher_count > 0 THEN
        RAISE NOTICE 'Dispatcher users:';
        FOR dispatcher_record IN 
            SELECT id, email, name FROM users WHERE role = 'Dispatcher'
        LOOP
            RAISE NOTICE '✅ Dispatcher: % (%)', dispatcher_record.name, dispatcher_record.email;
        END LOOP;
        
        RAISE NOTICE '';
        RAISE NOTICE '🎉 SUCCESS! Chris Parker can now send notifications to dispatch!';
        RAISE NOTICE 'Test steps:';
        RAISE NOTICE '1. Log in as Chris Parker (Driver)';
        RAISE NOTICE '2. Use "Contact Dispatch" feature';
        RAISE NOTICE '3. Log in as dispatcher to see the notification';
    ELSE
        RAISE NOTICE '❌ Still no dispatchers - manual intervention needed';
    END IF;
END $$;
