-- =====================================================================
-- Fix RLS Policies - Corrected Version
-- This script fixes the column reference errors and creates working policies
-- =====================================================================

BEGIN;

DO $$
BEGIN
  RAISE NOTICE 'Fixing RLS policies with correct column references...';
END $$;

-- =====================================================================
-- Drop problematic policies and recreate with correct structure
-- =====================================================================

-- Fix notifications table policy (remove assumption about recipient_role/recipient_id)
DROP POLICY IF EXISTS "notifications_user_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_dispatcher_all" ON public.notifications;

-- Create simple policies for notifications
CREATE POLICY "notifications_dispatcher_all" ON public.notifications
FOR ALL USING (get_user_role() = 'Dispatcher');

-- For now, let all authenticated users see notifications
-- You can refine this later based on your actual table structure
CREATE POLICY "notifications_read_all" ON public.notifications
FOR SELECT USING (true);

-- Fix reports table policy (remove assumption about created_by/is_public)
DROP POLICY IF EXISTS "reports_user_own" ON public.reports;
DROP POLICY IF EXISTS "reports_dispatcher_all" ON public.reports;

-- Create simple policies for reports
CREATE POLICY "reports_dispatcher_all" ON public.reports
FOR ALL USING (get_user_role() = 'Dispatcher');

-- For now, let all authenticated users see reports
-- You can refine this later based on your actual table structure
CREATE POLICY "reports_read_all" ON public.reports
FOR SELECT USING (true);

-- =====================================================================
-- Enable RLS on any remaining tables without assumptions about columns
-- =====================================================================

DO $$
DECLARE
    tbl RECORD;
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    policy_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Checking for tables without RLS (corrected version)...';
    
    -- Find all tables that exist but don't have RLS enabled
    FOR tbl IN 
        SELECT schemaname, tablename
        FROM pg_tables t
        LEFT JOIN pg_class c ON c.relname = t.tablename
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
        WHERE t.schemaname = 'public'
        AND (c.relrowsecurity IS FALSE OR c.relrowsecurity IS NULL)
        AND t.tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
    LOOP
        missing_tables := array_append(missing_tables, tbl.tablename);
        
        -- Enable RLS on the table
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
        
        -- Check if dispatcher policy already exists
        SELECT EXISTS(
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = tbl.tablename 
            AND policyname = tbl.tablename || '_dispatcher_all'
        ) INTO policy_exists;
        
        -- Create a basic policy for dispatchers to access everything (only if it doesn't exist)
        IF NOT policy_exists THEN
            EXECUTE format('CREATE POLICY "%s_dispatcher_all" ON public.%I FOR ALL USING (get_user_role() = ''Dispatcher'')', tbl.tablename, tbl.tablename);
        END IF;
        
        -- Grant basic permissions
        BEGIN
            EXECUTE format('GRANT SELECT ON public.%I TO authenticated', tbl.tablename);
        EXCEPTION
            WHEN duplicate_object THEN
                -- Permission already granted, continue
                NULL;
        END;
        
        RAISE NOTICE 'Enabled RLS and ensured policies for table: %', tbl.tablename;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'Processed % tables: %', array_length(missing_tables, 1), array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'No tables found without RLS';
    END IF;
END $$;

-- =====================================================================
-- Ensure all reference tables have proper read access
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE 'Ensuring reference tables have proper access...';
END $$;

-- Make sure roles and equipment_types are readable by all
DO $$
BEGIN
    -- Check if policies exist before creating them
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roles' AND policyname = 'roles_read_all') THEN
        CREATE POLICY "roles_read_all" ON public.roles FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'equipment_types' AND policyname = 'equipment_types_read_all') THEN
        CREATE POLICY "equipment_types_read_all" ON public.equipment_types FOR SELECT USING (true);
    END IF;
    
    -- Ensure dispatcher management policies exist
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roles' AND policyname = 'roles_dispatcher_manage') THEN
        CREATE POLICY "roles_dispatcher_manage" ON public.roles FOR ALL USING (get_user_role() = 'Dispatcher');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'equipment_types' AND policyname = 'equipment_types_dispatcher_manage') THEN
        CREATE POLICY "equipment_types_dispatcher_manage" ON public.equipment_types FOR ALL USING (get_user_role() = 'Dispatcher');
    END IF;
END $$;

-- =====================================================================
-- Grant necessary permissions safely
-- =====================================================================

DO $$
DECLARE
    tbl_name TEXT;
BEGIN
    RAISE NOTICE 'Granting permissions safely...';
    
    -- List of tables to grant SELECT permissions on
    FOR tbl_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
    LOOP
        BEGIN
            EXECUTE format('GRANT SELECT ON public.%I TO authenticated', tbl_name);
        EXCEPTION
            WHEN duplicate_object THEN
                -- Permission already exists, that's fine
                NULL;
            WHEN undefined_table THEN
                -- Table doesn't exist, skip it
                RAISE NOTICE 'Skipped non-existent table: %', tbl_name;
        END;
    END LOOP;
END $$;

-- =====================================================================
-- Final verification with better error handling
-- =====================================================================

DO $$
DECLARE
  total_tables INTEGER;
  rls_enabled_tables INTEGER;
  total_policies INTEGER;
  tables_without_rls TEXT[];
BEGIN
  RAISE NOTICE 'Final verification...';
  
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
    
  -- Count total policies
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies 
  WHERE schemaname = 'public';
    
  RAISE NOTICE 'Total tables: %, RLS enabled: %, Total policies: %', total_tables, rls_enabled_tables, total_policies;
  
  -- List any remaining tables without RLS
  SELECT array_agg(tablename) INTO tables_without_rls
  FROM pg_tables t
  LEFT JOIN pg_class c ON c.relname = t.tablename
  LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
  WHERE t.schemaname = 'public'
  AND (c.relrowsecurity IS FALSE OR c.relrowsecurity IS NULL)
  AND t.tablename NOT IN ('schema_migrations', 'spatial_ref_sys');
  
  IF tables_without_rls IS NOT NULL AND array_length(tables_without_rls, 1) > 0 THEN
    RAISE WARNING 'Tables still without RLS: %', array_to_string(tables_without_rls, ', ');
  ELSE
    RAISE NOTICE '✅ All tables now have RLS enabled!';
  END IF;
  
  IF total_policies < 10 THEN
    RAISE WARNING 'Only % policies created. You may want to add more specific policies.', total_policies;
  ELSE
    RAISE NOTICE '✅ % RLS policies are active', total_policies;
  END IF;
END $$;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'RLS POLICIES FIX COMPLETE';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'All tables should now have RLS enabled without column errors.';
  RAISE NOTICE 'Basic policies created - you can refine them later as needed.';
  RAISE NOTICE 'Check the Supabase dashboard security tab for verification.';
  RAISE NOTICE '=============================================================';
END $$;
