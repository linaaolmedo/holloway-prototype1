-- Create reports storage bucket and policies
-- Run this clean SQL in Supabase SQL Editor

-- Create the reports bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the reports bucket
CREATE POLICY "Allow authenticated users to upload reports" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Allow authenticated users to view reports" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'reports');

CREATE POLICY "Allow authenticated users to delete reports" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'reports');

CREATE POLICY "Allow authenticated users to update reports" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'reports');
