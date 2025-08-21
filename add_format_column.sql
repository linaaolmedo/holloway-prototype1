-- Add the missing 'format' column to the reports table
-- Run this in your Supabase SQL Editor

ALTER TABLE reports ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'csv';

-- Add constraint for format column
ALTER TABLE reports ADD CONSTRAINT reports_format_check 
  CHECK (format IN ('csv', 'pdf'));
