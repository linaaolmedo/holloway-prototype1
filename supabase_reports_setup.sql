-- =====================================================================
-- Reports Table Setup for TMS Reporting System
-- Execute this SQL in your Supabase SQL Editor
-- =====================================================================

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('loads', 'carriers', 'fleet', 'customers')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  file_url TEXT,
  file_size BIGINT,
  filters JSONB DEFAULT '{}'::JSONB,
  scheduled BOOLEAN DEFAULT FALSE,
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_scheduled ON reports(scheduled) WHERE scheduled = true;

-- Create a storage bucket for reports (if not already exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS (Row Level Security) policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all reports
CREATE POLICY "Allow authenticated users to view reports" ON reports
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to create reports
CREATE POLICY "Allow authenticated users to create reports" ON reports
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow users to update reports they created or if they're dispatchers
CREATE POLICY "Allow users to update their reports" ON reports
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Dispatcher'
    )
  );

-- Allow users to delete reports they created or if they're dispatchers
CREATE POLICY "Allow users to delete their reports" ON reports
  FOR DELETE TO authenticated USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Dispatcher'
    )
  );

-- Storage policies for reports bucket
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Allow authenticated downloads" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'reports');

CREATE POLICY "Allow authenticated deletions" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'reports');

-- Insert some sample data for testing (optional)
-- INSERT INTO reports (name, type, description, status, filters, created_by) VALUES
-- ('Monthly Loads Report', 'loads', 'Comprehensive monthly loads summary', 'pending', '{"date_from": "2025-01-01", "date_to": "2025-01-31"}', auth.uid()),
-- ('Carrier Performance Report', 'carriers', 'Quarterly carrier performance metrics', 'completed', '{"date_from": "2024-10-01", "date_to": "2024-12-31"}', auth.uid()),
-- ('Fleet Utilization Report', 'fleet', 'Fleet utilization and maintenance summary', 'pending', '{}', auth.uid());
