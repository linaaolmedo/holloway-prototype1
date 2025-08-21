-- =====================================================================
-- Fix Trailer Data - Simple Version Without ON CONFLICT
-- Run this in your Supabase SQL editor to create trailer data
-- =====================================================================

-- First, check if we have equipment types
DO $$
BEGIN
    -- If no equipment types exist, create them
    IF NOT EXISTS (SELECT 1 FROM equipment_types LIMIT 1) THEN
        INSERT INTO equipment_types (id, name) VALUES
        (1, 'Hopper Bottom'),
        (2, 'End Dump'),
        (3, 'Walking Floor'),
        (4, 'Liquid Tanker'),
        (5, 'Side Dump'),
        (6, 'Flatbed'),
        (7, 'Belt Trailer')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Check current trailer count
SELECT 'Current trailer count:' as info, COUNT(*) as count FROM trailers;

-- Add trailers (simple insert without ON CONFLICT)
INSERT INTO trailers (trailer_number, license_plate, equipment_type_id, status) 
SELECT * FROM (VALUES
    ('TR001', 'TRL-001-ID', 1, 'Available'), -- Hopper Bottom
    ('TR002', 'TRL-002-ID', 2, 'Available'), -- End Dump  
    ('TR003', 'TRL-003-ID', 1, 'Available'), -- Hopper Bottom
    ('TR004', 'TRL-004-ID', 3, 'Available'), -- Walking Floor
    ('TR005', 'TRL-005-ID', 2, 'Available'), -- End Dump
    ('TR006', 'TRL-006-ID', 4, 'Available'), -- Liquid Tanker
    ('TR007', 'TRL-007-ID', 6, 'Available')  -- Flatbed
) AS v(trailer_number, license_plate, equipment_type_id, status)
WHERE NOT EXISTS (
    SELECT 1 FROM trailers t WHERE t.trailer_number = v.trailer_number
);

-- Verify trailers were created
SELECT 'After insert trailer count:' as info, COUNT(*) as count FROM trailers;

-- Show all trailers
SELECT 
    t.id,
    t.trailer_number,
    t.license_plate,
    t.status,
    t.equipment_type_id,
    et.name as equipment_type_name
FROM trailers t
LEFT JOIN equipment_types et ON t.equipment_type_id = et.id
ORDER BY t.trailer_number;
