-- =====================================================================
-- Alternative Fix: Service Function Approach
-- Create a service function that runs with elevated privileges to find dispatchers
-- =====================================================================

-- This approach creates a function that runs with SECURITY DEFINER
-- so it can bypass RLS and find dispatcher users for notifications

CREATE OR REPLACE FUNCTION public.get_dispatchers_for_notifications()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER  -- This makes the function run with the privileges of its creator, not caller
SET search_path = public
AS $$
BEGIN
    -- This function can see all users regardless of RLS because it runs as SECURITY DEFINER
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email::TEXT,
        u.name::TEXT
    FROM public.users u
    WHERE u.role = 'Dispatcher';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dispatchers_for_notifications() TO authenticated;

-- Test the function
DO $$
DECLARE
    dispatcher_count INTEGER;
    dispatcher_record RECORD;
BEGIN
    RAISE NOTICE '=== TESTING SERVICE FUNCTION ===';
    
    -- Count dispatchers using the service function
    SELECT COUNT(*) INTO dispatcher_count 
    FROM public.get_dispatchers_for_notifications();
    
    RAISE NOTICE 'Dispatchers found via service function: %', dispatcher_count;
    
    IF dispatcher_count > 0 THEN
        RAISE NOTICE 'Dispatcher details:';
        FOR dispatcher_record IN 
            SELECT user_id, email, name FROM public.get_dispatchers_for_notifications()
        LOOP
            RAISE NOTICE '✅ %: % (%)', dispatcher_record.name, dispatcher_record.email, dispatcher_record.user_id;
        END LOOP;
        
        RAISE NOTICE '✅ SUCCESS: Service function can find dispatchers!';
        RAISE NOTICE 'Now update the notification service to use this function.';
    ELSE
        RAISE NOTICE '❌ No dispatchers found - create dispatcher users first';
    END IF;
END $$;
