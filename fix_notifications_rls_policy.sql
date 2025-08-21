-- =====================================================================
-- Fix Notifications RLS Policy
-- The existing policy references columns (recipient_role, recipient_id) 
-- that don't exist in the notifications table
-- =====================================================================

BEGIN;

DO $$
BEGIN
  RAISE NOTICE 'Fixing notifications RLS policy...';
END $$;

-- Drop the broken policies that reference non-existent columns
DROP POLICY IF EXISTS "notifications_user_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_dispatcher_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_read_all" ON public.notifications;

-- Create proper policy for users to see their own notifications
-- The notifications table uses 'user_id' column, not 'recipient_id'
CREATE POLICY "notifications_user_own" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

-- Dispatchers can see all notifications 
CREATE POLICY "notifications_dispatcher_all" ON public.notifications
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Allow authenticated users to insert notifications (for system operations)
CREATE POLICY "notifications_insert_authenticated" ON public.notifications
FOR INSERT WITH CHECK (true);

-- Allow users to update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

COMMIT;

DO $$
BEGIN
  RAISE NOTICE 'Successfully fixed notifications RLS policies!';
  RAISE NOTICE 'Users can now see notifications where user_id matches their auth.uid()';
  RAISE NOTICE 'Dispatchers can see all notifications';
END $$;
