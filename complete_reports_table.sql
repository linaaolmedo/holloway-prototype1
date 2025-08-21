-- Complete reports table with all required columns
-- Run this in Supabase SQL Editor if you want to recreate the table

-- Drop existing table if you want to start fresh (CAUTION: This deletes data!)
-- DROP TABLE IF EXISTS reports;

-- Create complete reports table
CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  format TEXT DEFAULT 'csv',
  file_url TEXT,
  file_size BIGINT,
  filters JSONB DEFAULT '{}'::JSONB,
  scheduled BOOLEAN DEFAULT FALSE,
  schedule_frequency TEXT,
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Add constraints
ALTER TABLE reports ADD CONSTRAINT reports_type_check 
  CHECK (type IN ('loads', 'carriers', 'fleet', 'customers'));

ALTER TABLE reports ADD CONSTRAINT reports_status_check 
  CHECK (status IN ('pending', 'generating', 'completed', 'failed'));

ALTER TABLE reports ADD CONSTRAINT reports_format_check 
  CHECK (format IN ('csv', 'pdf'));

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Enable read access for authenticated users" ON reports
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON reports
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON reports
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON reports
  FOR DELETE TO authenticated USING (true);
