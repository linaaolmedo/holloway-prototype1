-- Setup Supabase Storage for Invoice PDFs
-- Run this script in your Supabase SQL Editor to set up the storage bucket and policies

-- Create the invoices storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'invoices', 'invoices', false, 52428800, ARRAY['application/pdf']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'invoices');

-- Create RLS policies for the invoices bucket
-- Policy to allow authenticated users to upload invoices
CREATE POLICY "Allow authenticated users to upload invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Policy to allow users to view invoices (you may want to restrict this further based on user roles)
CREATE POLICY "Allow authenticated users to read invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoices');

-- Policy to allow users to update invoices (if needed)
CREATE POLICY "Allow authenticated users to update invoices"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'invoices');

-- Policy to allow users to delete invoices (if needed)
CREATE POLICY "Allow authenticated users to delete invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'invoices');

-- Check if invoices table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
        RAISE EXCEPTION 'The invoices table does not exist. Please create it first.';
    END IF;
END $$;

-- Add pdf_path column to invoices table if it doesn't exist
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- Check that all required columns exist
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check for required columns
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_number') THEN
        missing_columns := array_append(missing_columns, 'invoice_number');
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'customer_id') THEN
        missing_columns := array_append(missing_columns, 'customer_id');
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'date_created') THEN
        missing_columns := array_append(missing_columns, 'date_created');
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'due_date') THEN
        missing_columns := array_append(missing_columns, 'due_date');
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'total_amount') THEN
        missing_columns := array_append(missing_columns, 'total_amount');
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'is_paid') THEN
        missing_columns := array_append(missing_columns, 'is_paid');
    END IF;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required columns in invoices table: %', array_to_string(missing_columns, ', ');
    END IF;
    
    RAISE NOTICE 'All required invoice table columns are present.';
END $$;

-- Add comment to document the pdf_path column
COMMENT ON COLUMN invoices.pdf_path IS 'Path to the PDF file stored in Supabase storage';

-- Create index on pdf_path for better performance when querying PDFs
CREATE INDEX IF NOT EXISTS idx_invoices_pdf_path ON invoices(pdf_path);

-- Create a function to clean up orphaned PDF files (optional)
CREATE OR REPLACE FUNCTION cleanup_orphaned_invoice_pdfs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be used to clean up PDF files that no longer have corresponding invoice records
  -- Implementation would involve checking storage objects against invoice records
  -- For now, this is just a placeholder
  RAISE NOTICE 'Orphaned PDF cleanup function created. Implement cleanup logic as needed.';
END;
$$;

-- Setup Row Level Security (RLS) for invoices table
-- This is CRITICAL for invoice creation to work

-- Enable RLS on invoices table (if not already enabled)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices" ON invoices;

-- Create RLS policies for invoices table
CREATE POLICY "Users can view invoices" ON invoices
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Users can insert invoices" ON invoices
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

CREATE POLICY "Users can update invoices" ON invoices
    FOR UPDATE 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Users can delete invoices" ON invoices
    FOR DELETE 
    TO authenticated 
    USING (true);

-- Ensure loads table allows updates for invoice_id (if RLS is enabled)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'loads' 
        AND rowsecurity = true
    ) THEN
        -- Drop existing policy to avoid conflicts
        DROP POLICY IF EXISTS "Users can update loads for invoicing" ON loads;
        
        -- Create policy for loads table
        CREATE POLICY "Users can update loads for invoicing" ON loads
            FOR UPDATE 
            TO authenticated 
            USING (true) 
            WITH CHECK (true);
            
        RAISE NOTICE 'Created RLS policy for loads table updates.';
    ELSE
        RAISE NOTICE 'Loads table does not have RLS enabled, skipping policy creation.';
    END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON loads TO authenticated;
