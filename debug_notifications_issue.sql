-- =====================================================================
-- Debug Chris Parker's Dispatcher Contact Issue
-- Run these queries to diagnose and verify the notification system
-- =====================================================================

-- 1. Check current notifications table structure
\d+ notifications;

-- 2. Check current RLS policies on notifications table
SELECT 
    schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'notifications';

-- 3. Check if there are any notifications from Chris Parker
SELECT 
    id,
    user_id,
    type,
    title,
    message,
    data,
    read,
    created_at
FROM notifications 
WHERE type = 'driver_contact_dispatch'
AND (message ILIKE '%chris parker%' OR data->>'driver_name' ILIKE '%chris parker%')
ORDER BY created_at DESC;

-- 4. Check all recent notifications in the system
SELECT 
    id,
    user_id,
    type,
    title,
    message,
    read,
    created_at
FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 5. Check dispatcher users who should be receiving notifications
SELECT 
    id as user_id,
    email,
    name,
    role
FROM users 
WHERE role = 'Dispatcher';

-- 6. Check if Chris Parker exists as a driver
SELECT 
    d.id as driver_id,
    d.name as driver_name,
    d.user_id,
    u.email,
    u.role
FROM drivers d
JOIN users u ON d.user_id = u.id
WHERE d.name ILIKE '%chris parker%' OR u.email ILIKE '%chris%';

-- After applying the RLS fix, run this to test notifications access:
-- 7. Test query to see what notifications a dispatcher can see
-- (Replace 'DISPATCHER_USER_ID' with actual dispatcher's UUID)
-- SELECT * FROM notifications WHERE user_id = 'DISPATCHER_USER_ID';
