-- =====================================================================
-- Test Chris Parker Dispatcher Notification System
-- Run this AFTER comprehensive_dispatcher_solution.sql to verify everything works
-- =====================================================================

-- Step 1: Verify our service function exists and works
SELECT 'Testing service function...' as status;

SELECT 
    'Service function dispatchers:' as test,
    COUNT(*) as dispatcher_count
FROM public.get_dispatchers_for_notifications();

SELECT 
    'Dispatcher details:' as test,
    id, 
    email, 
    name 
FROM public.get_dispatchers_for_notifications();

-- Step 2: Check RLS policies allow dispatcher visibility
SELECT 'Testing RLS policies...' as status;

SELECT 
    'Direct query dispatchers:' as test,
    COUNT(*) as dispatcher_count
FROM users 
WHERE role = 'Dispatcher';

-- Step 3: Verify Chris Parker exists
SELECT 'Checking Chris Parker...' as status;

SELECT 
    'Chris Parker user:' as test,
    id,
    email,
    name,
    role
FROM users 
WHERE name ILIKE '%chris%parker%' OR email ILIKE '%chris%'
LIMIT 1;

-- Step 4: Check notification table structure
SELECT 'Verifying notification system...' as status;

SELECT 
    'Notification table exists:' as test,
    COUNT(*) as record_count
FROM notifications 
LIMIT 1;

-- Step 5: Simulate what happens during Chris Parker contact
DO $$
DECLARE
    chris_id UUID;
    dispatcher_count INTEGER;
    test_notification_id BIGINT;
BEGIN
    RAISE NOTICE '=== SIMULATING CHRIS PARKER CONTACT DISPATCH ===';
    
    -- Find Chris Parker
    SELECT id INTO chris_id 
    FROM users 
    WHERE name ILIKE '%chris%parker%' OR email ILIKE '%chris%'
    LIMIT 1;
    
    IF chris_id IS NULL THEN
        RAISE NOTICE '❌ Chris Parker not found - create chris@company.com account and log in';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Chris Parker found: %', chris_id;
    
    -- Test service function (what the app will use)
    SELECT COUNT(*) INTO dispatcher_count 
    FROM public.get_dispatchers_for_notifications();
    
    RAISE NOTICE '📧 Service function found % dispatchers', dispatcher_count;
    
    IF dispatcher_count > 0 THEN
        -- Simulate creating a notification
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            read,
            created_at
        )
        SELECT 
            d.id,
            'driver_contact_dispatch',
            'Test: Driver Contact - General Inquiry',
            '[Info] Chris Parker contacted dispatch (General Inquiry): "This is a test message from the diagnostic script"',
            json_build_object(
                'driver_id', 999,
                'driver_name', 'Chris Parker',
                'driver_message', 'This is a test message from the diagnostic script',
                'urgency', 'low',
                'urgency_label', 'General Inquiry',
                'contact_time', NOW()
            ),
            false
        FROM public.get_dispatchers_for_notifications() d
        RETURNING id INTO test_notification_id;
        
        RAISE NOTICE '✅ Test notification created with ID: %', test_notification_id;
        RAISE NOTICE '';
        RAISE NOTICE '🎉 SUCCESS! The system is ready for Chris Parker to contact dispatch!';
        RAISE NOTICE '';
        RAISE NOTICE 'What to do next:';
        RAISE NOTICE '1. Go to your app and log in as Chris Parker (chris@company.com)';
        RAISE NOTICE '2. Click "Contact Dispatch" button';
        RAISE NOTICE '3. Send a test message';
        RAISE NOTICE '4. You should see success messages in the console';
        RAISE NOTICE '5. Log in as dispatcher to see the notification';
        
        -- Clean up test notification
        DELETE FROM notifications WHERE id = test_notification_id;
        RAISE NOTICE '';
        RAISE NOTICE '(Test notification cleaned up)';
    ELSE
        RAISE NOTICE '❌ No dispatchers found - run comprehensive_dispatcher_solution.sql first';
    END IF;
END $$;
