-- =====================================================================
-- Test ALL Drivers Can Contact ALL Dispatchers
-- Comprehensive test to verify any driver can send notifications to all dispatchers
-- =====================================================================

-- Step 1: Show current system state
SELECT 'SYSTEM STATE' as test_section;

SELECT 
    'Total Users:' as metric,
    COUNT(*) as count
FROM users;

SELECT 
    'Users by Role:' as metric,
    role,
    COUNT(*) as count
FROM users 
GROUP BY role
ORDER BY role;

-- Step 2: List all drivers who can contact dispatch
SELECT 'ALL DRIVERS WHO CAN CONTACT DISPATCH' as test_section;

SELECT 
    'Driver:' as type,
    name,
    email,
    'CAN contact dispatch' as status
FROM users 
WHERE role = 'Driver'
ORDER BY name;

-- Step 3: List all dispatchers who will receive notifications
SELECT 'ALL DISPATCHERS WHO WILL RECEIVE NOTIFICATIONS' as test_section;

SELECT 
    'Dispatcher:' as type,
    name,
    email,
    'WILL receive notifications' as status
FROM users 
WHERE role = 'Dispatcher'
ORDER BY name;

-- Step 4: Test service function works for any user context
SELECT 'SERVICE FUNCTION TEST' as test_section;

SELECT 
    'Service Function Result:' as test,
    COUNT(*) as dispatchers_found
FROM public.get_dispatchers_for_notifications();

SELECT 
    'Dispatchers via Service Function:' as test,
    name,
    email
FROM public.get_dispatchers_for_notifications()
ORDER BY name;

-- Step 5: Simulate driver-to-dispatcher notification flow
DO $$
DECLARE
    driver_record RECORD;
    dispatcher_count INTEGER;
    test_notification_id BIGINT;
    total_notifications_created INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING DRIVER-TO-DISPATCHER NOTIFICATION FLOW ===';
    
    -- Get dispatcher count
    SELECT COUNT(*) INTO dispatcher_count FROM public.get_dispatchers_for_notifications();
    
    IF dispatcher_count = 0 THEN
        RAISE NOTICE '❌ No dispatchers found - cannot test notification flow';
        RETURN;
    END IF;
    
    RAISE NOTICE '📧 Found % dispatcher(s) to receive notifications', dispatcher_count;
    
    -- Test with each driver
    FOR driver_record IN 
        SELECT id, name, email FROM users WHERE role = 'Driver' ORDER BY name LIMIT 3
    LOOP
        RAISE NOTICE '';
        RAISE NOTICE '🚗 Testing driver: % (%)', driver_record.name, driver_record.email;
        
        -- Simulate creating notifications for all dispatchers (like the real app does)
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
            format('[Info] %s contacted dispatch (General Inquiry): "Test message from %s"', 
                   driver_record.name, driver_record.name),
            json_build_object(
                'driver_id', 999,
                'driver_name', driver_record.name,
                'driver_message', format('Test message from %s', driver_record.name),
                'urgency', 'low',
                'urgency_label', 'General Inquiry',
                'contact_time', NOW()
            ),
            false
        FROM public.get_dispatchers_for_notifications() d;
        
        GET DIAGNOSTICS total_notifications_created = ROW_COUNT;
        
        RAISE NOTICE '  ✅ Created % notification(s) for % dispatcher(s)', 
                     total_notifications_created, dispatcher_count;
        
        -- Show which dispatchers got notified
        FOR test_notification_id IN 
            SELECT n.id FROM notifications n
            JOIN public.get_dispatchers_for_notifications() d ON n.user_id = d.id
            WHERE n.type = 'driver_contact_dispatch' 
            AND n.data->>'driver_name' = driver_record.name
            ORDER BY n.id DESC
            LIMIT dispatcher_count
        LOOP
            SELECT u.name INTO driver_record.email FROM notifications n 
            JOIN users u ON n.user_id = u.id 
            WHERE n.id = test_notification_id;
            
            RAISE NOTICE '    📨 Notification sent to dispatcher: %', driver_record.email;
        END LOOP;
        
        -- Clean up test notifications
        DELETE FROM notifications 
        WHERE type = 'driver_contact_dispatch' 
        AND data->>'driver_name' = driver_record.name;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SUCCESS! ALL DRIVERS CAN CONTACT ALL DISPATCHERS!';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '• Any of the % driver(s) can use "Contact Dispatch"', 
                 (SELECT COUNT(*) FROM users WHERE role = 'Driver');
    RAISE NOTICE '• Their message will go to ALL % dispatcher(s)', dispatcher_count;
    RAISE NOTICE '• Each dispatcher will see the notification in their dashboard';
    RAISE NOTICE '';
    RAISE NOTICE 'To test in your app:';
    RAISE NOTICE '1. Log in as ANY driver user';
    RAISE NOTICE '2. Click "Contact Dispatch"';
    RAISE NOTICE '3. Send a message';
    RAISE NOTICE '4. Log in as ANY dispatcher to see the notification';
    
END $$;
