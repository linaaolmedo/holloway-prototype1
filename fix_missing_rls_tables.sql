-- =====================================================================
-- Fix Missing RLS Tables for BulkFlow TMS
-- This script enables RLS on tables that were missed in the initial deployment
-- =====================================================================

BEGIN;

DO $$
BEGIN
  RAISE NOTICE 'Enabling RLS on missing tables...';
END $$;

-- =====================================================================
-- Enable RLS on Missing Tables
-- =====================================================================

-- Reference tables (should be readable by all authenticated users)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;

-- System/audit tables  
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Check if audit_log table exists and enable RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
    ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on audit_log table';
  END IF;
END $$;

-- Check if audit_log_formatted view exists  
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views 
             WHERE table_schema = 'public' AND table_name = 'audit_log_formatted') THEN
    RAISE NOTICE 'audit_log_formatted is a view - RLS not applicable';
  END IF;
END $$;

-- =====================================================================
-- Create Policies for Reference Tables
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE 'Creating policies for reference tables...';
END $$;

-- Roles table - all authenticated users can read
DROP POLICY IF EXISTS "roles_read_all" ON public.roles;
CREATE POLICY "roles_read_all" ON public.roles
FOR SELECT USING (true); -- All authenticated users can read roles

-- Only dispatchers can modify roles
DROP POLICY IF EXISTS "roles_dispatcher_manage" ON public.roles;
CREATE POLICY "roles_dispatcher_manage" ON public.roles
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Equipment types - all authenticated users can read  
DROP POLICY IF EXISTS "equipment_types_read_all" ON public.equipment_types;
CREATE POLICY "equipment_types_read_all" ON public.equipment_types
FOR SELECT USING (true); -- All authenticated users can read equipment types

-- Only dispatchers can modify equipment types
DROP POLICY IF EXISTS "equipment_types_dispatcher_manage" ON public.equipment_types;
CREATE POLICY "equipment_types_dispatcher_manage" ON public.equipment_types
FOR ALL USING (get_user_role() = 'Dispatcher');

-- =====================================================================
-- Create Policies for System Tables
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE 'Creating policies for system tables...';
END $$;

-- Notifications table
DROP POLICY IF EXISTS "notifications_dispatcher_all" ON public.notifications;
CREATE POLICY "notifications_dispatcher_all" ON public.notifications
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Users can see notifications intended for them
DROP POLICY IF EXISTS "notifications_user_own" ON public.notifications;
CREATE POLICY "notifications_user_own" ON public.notifications
FOR SELECT USING (
  -- For now, allow users to see notifications based on their role
  -- This may need refinement based on your notifications table structure
  recipient_role = get_user_role() OR 
  recipient_id = auth.uid()
);

-- Reports table  
DROP POLICY IF EXISTS "reports_dispatcher_all" ON public.reports;
CREATE POLICY "reports_dispatcher_all" ON public.reports
FOR ALL USING (get_user_role() = 'Dispatcher');

-- Users can see reports they created or that are public
DROP POLICY IF EXISTS "reports_user_own" ON public.reports;
CREATE POLICY "reports_user_own" ON public.reports
FOR SELECT USING (
  created_by = auth.uid() OR 
  is_public = true
);

-- Audit log - only dispatchers can read audit logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
    
    EXECUTE 'DROP POLICY IF EXISTS "audit_log_dispatcher_only" ON public.audit_log';
    EXECUTE 'CREATE POLICY "audit_log_dispatcher_only" ON public.audit_log
             FOR SELECT USING (get_user_role() = ''Dispatcher'')';
    
    RAISE NOTICE 'Created audit_log policies';
  END IF;
END $$;

-- =====================================================================
-- Grant Permissions for New Tables
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE 'Granting permissions for new tables...';
END $$;

-- Reference tables - all users can read
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.equipment_types TO authenticated;

-- System tables - limited access
GRANT SELECT ON public.notifications TO authenticated;
GRANT SELECT ON public.reports TO authenticated;

-- Audit log - if exists, only select for dispatchers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
    EXECUTE 'GRANT SELECT ON public.audit_log TO authenticated';
    RAISE NOTICE 'Granted permissions on audit_log';
  END IF;
END $$;

-- =====================================================================
-- Handle any other missing tables dynamically
-- =====================================================================

DO $$
DECLARE
    tbl RECORD;
    missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
    RAISE NOTICE 'Checking for other tables without RLS...';
    
    -- Find all tables that exist but don't have RLS enabled
    FOR tbl IN 
        SELECT schemaname, tablename
        FROM pg_tables t
        LEFT JOIN pg_class c ON c.relname = t.tablename
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
        WHERE t.schemaname = 'public'
        AND (c.relrowsecurity IS FALSE OR c.relrowsecurity IS NULL)
        AND t.tablename NOT IN ('schema_migrations', 'spatial_ref_sys') -- Exclude system tables
    LOOP
        missing_tables := array_append(missing_tables, tbl.tablename);
        
        -- Enable RLS on the table
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
        
        -- Create a basic policy for dispatchers to access everything
        EXECUTE format('DROP POLICY IF EXISTS "%s_dispatcher_all" ON public.%I', tbl.tablename, tbl.tablename);
        EXECUTE format('CREATE POLICY "%s_dispatcher_all" ON public.%I FOR ALL USING (get_user_role() = ''Dispatcher'')', tbl.tablename, tbl.tablename);
        
        -- Grant basic permissions
        EXECUTE format('GRANT SELECT ON public.%I TO authenticated', tbl.tablename);
        
        RAISE NOTICE 'Enabled RLS and created basic policies for table: %', tbl.tablename;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'Enabled RLS on % additional tables: %', array_length(missing_tables, 1), array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'No additional tables found without RLS';
    END IF;
END $$;

-- =====================================================================
-- Final Verification
-- =====================================================================

DO $$
DECLARE
  total_tables INTEGER;
  rls_enabled_tables INTEGER;
  tables_without_rls TEXT[];
BEGIN
  RAISE NOTICE 'Final RLS verification...';
  
  -- Count total tables
  SELECT COUNT(*) INTO total_tables
  FROM pg_tables 
  WHERE schemaname = 'public'
  AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys');
  
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO rls_enabled_tables
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true;
    
  RAISE NOTICE 'Total tables: %, RLS enabled: %', total_tables, rls_enabled_tables;
  
  -- List any remaining tables without RLS
  SELECT array_agg(tablename) INTO tables_without_rls
  FROM pg_tables t
  LEFT JOIN pg_class c ON c.relname = t.tablename
  LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
  WHERE t.schemaname = 'public'
  AND (c.relrowsecurity IS FALSE OR c.relrowsecurity IS NULL)
  AND t.tablename NOT IN ('schema_migrations', 'spatial_ref_sys');
  
  IF array_length(tables_without_rls, 1) > 0 THEN
    RAISE WARNING 'Tables still without RLS: %', array_to_string(tables_without_rls, ', ');
  ELSE
    RAISE NOTICE '✅ All tables now have RLS enabled!';
  END IF;
END $$;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'MISSING RLS TABLES FIX COMPLETE';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'All tables should now have RLS enabled with basic policies.';
  RAISE NOTICE 'Check the Supabase dashboard to verify security issues are resolved.';
  RAISE NOTICE '=============================================================';
END $$;
