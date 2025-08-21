-- =====================================================================
-- Create Dispatcher User for Testing
-- This script creates a dispatcher user if none exist
-- =====================================================================

-- First, let's check what users exist
DO $$
DECLARE
    dispatcher_count INTEGER;
    user_record RECORD;
BEGIN
    -- Check how many dispatchers exist
    SELECT COUNT(*) INTO dispatcher_count
    FROM users 
    WHERE role = 'Dispatcher';
    
    RAISE NOTICE 'Found % dispatcher(s) in the system', dispatcher_count;
    
    -- Show all users and their roles
    RAISE NOTICE 'All users in system:';
    FOR user_record IN 
        SELECT email, name, role FROM users ORDER BY created_at DESC LIMIT 10
    LOOP
        RAISE NOTICE 'User: % (%) - Role: %', user_record.name, user_record.email, user_record.role;
    END LOOP;
    
    -- If no dispatchers exist, we need to either:
    -- 1. Create a new dispatcher user, OR
    -- 2. Change an existing user's role to Dispatcher
    
    IF dispatcher_count = 0 THEN
        RAISE NOTICE 'No dispatchers found! You need to either:';
        RAISE NOTICE '1. Create a new dispatcher user in Supabase Auth, OR';
        RAISE NOTICE '2. Update an existing user''s role to "Dispatcher"';
        
        -- Example of how to update an existing user to be a dispatcher:
        -- UPDATE users SET role = 'Dispatcher' WHERE email = 'your-email@example.com';
        
        -- Show first user as example
        SELECT email, name, role INTO user_record 
        FROM users 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        IF FOUND THEN
            RAISE NOTICE 'Example: To make % a dispatcher, run:', user_record.email;
            RAISE NOTICE 'UPDATE users SET role = ''Dispatcher'' WHERE email = ''%'';', user_record.email;
        END IF;
    ELSE
        RAISE NOTICE 'Dispatchers found! The issue might be with RLS policies.';
    END IF;
END $$;

-- Uncomment and modify this line to make an existing user a dispatcher:
-- UPDATE users SET role = 'Dispatcher' WHERE email = 'REPLACE_WITH_ACTUAL_EMAIL';
