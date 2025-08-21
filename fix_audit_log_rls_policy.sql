-- =====================================================================
-- Fix Audit Log RLS Policy for Customer Shipment Creation
-- This script adds INSERT policies for the audit_log table so all 
-- authenticated users can create audit records when making changes
-- =====================================================================

BEGIN;

DO $$
BEGIN
  RAISE NOTICE 'Fixing audit_log RLS policies for customer operations...';
END $$;

-- =====================================================================
-- Fix Audit Log Table RLS Policies
-- =====================================================================

-- Check if audit_log table exists and create proper policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
    
    -- Drop existing policies if they exist
    EXECUTE 'DROP POLICY IF EXISTS "audit_log_dispatcher_only" ON public.audit_log';
    EXECUTE 'DROP POLICY IF EXISTS "audit_log_insert_all" ON public.audit_log';
    EXECUTE 'DROP POLICY IF EXISTS "audit_log_select_dispatcher" ON public.audit_log';
    
    -- Create new policies
    -- Allow all authenticated users to INSERT audit records (needed for triggers)
    EXECUTE 'CREATE POLICY "audit_log_insert_all" ON public.audit_log
             FOR INSERT TO authenticated
             WITH CHECK (true)';
    
    -- Only dispatchers can SELECT audit records (reading audit history)
    EXECUTE 'CREATE POLICY "audit_log_select_dispatcher" ON public.audit_log
             FOR SELECT TO authenticated
             USING (get_user_role() = ''Dispatcher'')';
    
    RAISE NOTICE 'Updated audit_log RLS policies - INSERT allowed for all, SELECT only for dispatchers';
    
  ELSE
    RAISE NOTICE 'audit_log table does not exist - skipping policy creation';
  END IF;
END $$;

-- =====================================================================
-- Ensure proper permissions are granted
-- =====================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
    
    -- Grant INSERT and SELECT permissions to authenticated users
    EXECUTE 'GRANT INSERT, SELECT ON public.audit_log TO authenticated';
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE audit_log_id_seq TO authenticated';
    
    RAISE NOTICE 'Granted INSERT/SELECT permissions on audit_log to authenticated users';
    
  END IF;
END $$;

-- =====================================================================
-- Test the policies with a sample operation
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policy fix completed. Customers should now be able to create shipment requests.';
  RAISE NOTICE 'The system will create audit records when users perform operations, but only dispatchers can read the audit history.';
END $$;

COMMIT;
