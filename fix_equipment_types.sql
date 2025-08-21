-- Fix script to ensure equipment types are populated
-- Run this in your Supabase SQL editor

-- Insert the equipment types (will skip if they already exist)
INSERT INTO equipment_types (name) VALUES
  ('Hopper Bottom'),
  ('End Dump'),
  ('Walking Floor'),
  ('Liquid Tanker'),
  ('Pneumatic Tank'),
  ('Flatbed'),
  ('Belt Trailer'),
  ('Side Dump'),
  ('Bottom Dump'),
  ('Grain Trailer'),
  ('Dry Van'),
  ('Refrigerated')
ON CONFLICT (name) DO NOTHING;

-- Verify the data was inserted
SELECT id, name FROM equipment_types ORDER BY id;
