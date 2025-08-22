-- Fix the notifications table constraint issue
-- First, let's see what constraint exists and fix it

-- Drop the existing constraint if it exists
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the correct constraint with all the notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
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

-- Let's also check what data currently exists in the table
SELECT type, COUNT(*) as count FROM notifications GROUP BY type;





