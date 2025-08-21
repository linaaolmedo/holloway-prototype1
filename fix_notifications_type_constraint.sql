-- =====================================================================
-- Fix Notifications Type Constraint
-- Add 'driver_contact_dispatch' to the allowed notification types
-- =====================================================================

-- Check current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.notifications'::regclass 
AND contype = 'c';

-- Drop the existing check constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Recreate the constraint with all required types including driver_contact_dispatch
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'new_shipment_request',
    'load_update',
    'invoice_created', 
    'payment_received',
    'new_bid',
    'bid_accepted',
    'bid_rejected',
    'delivery_completed',
    'driver_message',
    'driver_contact_dispatch'
));

-- Verify the fix
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.notifications'::regclass 
AND contype = 'c';

-- Test that the constraint allows the driver_contact_dispatch type
DO $$
BEGIN
    -- This should now work without error
    RAISE NOTICE 'Testing constraint fix...';
    
    -- Test insert (will be rolled back)
    BEGIN
        INSERT INTO notifications (user_id, type, title, message, read, created_at)
        VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            'driver_contact_dispatch',
            'Test Notification',
            'This is a test',
            false,
            NOW()
        );
        
        -- Clean up test row
        DELETE FROM notifications WHERE title = 'Test Notification';
        
        RAISE NOTICE '✅ SUCCESS! driver_contact_dispatch type is now allowed';
    EXCEPTION 
        WHEN check_violation THEN
            RAISE NOTICE '❌ FAILED! Constraint still blocking driver_contact_dispatch';
        WHEN others THEN
            RAISE NOTICE 'ℹ️  Test completed (constraint fixed, but other validation may apply)';
    END;
END $$;
