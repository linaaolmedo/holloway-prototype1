-- =====================================================================
-- Add Multiple Available Trucks and Trailers to BulkFlow TMS
-- Run this in your Supabase SQL editor to expand your fleet
-- =====================================================================

-- First, ensure equipment types exist
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

-- Show current fleet count before adding
SELECT 'Current fleet status:' as info;
SELECT 'Trucks' as type, COUNT(*) as count FROM trucks
UNION ALL
SELECT 'Trailers' as type, COUNT(*) as count FROM trailers;

-- Add additional trucks (T006 through T020)
INSERT INTO trucks (truck_number, license_plate, status, maintenance_due) 
SELECT * FROM (VALUES
    ('T006', 'TRK-006-ID', 'Available', null),
    ('T007', 'TRK-007-ID', 'Available', null),
    ('T008', 'TRK-008-ID', 'Available', '2024-12-15'),
    ('T009', 'TRK-009-ID', 'Available', null),
    ('T010', 'TRK-010-ID', 'Available', null),
    ('T011', 'TRK-011-ID', 'Available', '2024-11-30'),
    ('T012', 'TRK-012-ID', 'Available', null),
    ('T013', 'TRK-013-ID', 'Maintenance', '2024-10-20'),
    ('T014', 'TRK-014-ID', 'Available', null),
    ('T015', 'TRK-015-ID', 'Available', null),
    ('T016', 'TRK-016-ID', 'Available', '2025-01-10'),
    ('T017', 'TRK-017-ID', 'Available', null),
    ('T018', 'TRK-018-ID', 'Available', null),
    ('T019', 'TRK-019-ID', 'Available', '2024-12-05'),
    ('T020', 'TRK-020-ID', 'Available', null)
) AS v(truck_number, license_plate, status, maintenance_due)
WHERE NOT EXISTS (
    SELECT 1 FROM trucks t WHERE t.truck_number = v.truck_number
);

-- Add additional trailers (TR008 through TR025) with varied equipment types
INSERT INTO trailers (trailer_number, license_plate, equipment_type_id, status, maintenance_due) 
SELECT * FROM (VALUES
    ('TR008', 'TRL-008-ID', 1, 'Available', null),     -- Hopper Bottom
    ('TR009', 'TRL-009-ID', 2, 'Available', null),     -- End Dump  
    ('TR010', 'TRL-010-ID', 3, 'Available', null),     -- Walking Floor
    ('TR011', 'TRL-011-ID', 4, 'Available', '2024-11-15'), -- Liquid Tanker
    ('TR012', 'TRL-012-ID', 5, 'Available', null),     -- Side Dump
    ('TR013', 'TRL-013-ID', 6, 'Available', null),     -- Flatbed
    ('TR014', 'TRL-014-ID', 7, 'Available', null),     -- Belt Trailer
    ('TR015', 'TRL-015-ID', 1, 'Available', null),     -- Hopper Bottom
    ('TR016', 'TRL-016-ID', 2, 'Available', '2024-12-10'), -- End Dump
    ('TR017', 'TRL-017-ID', 1, 'Available', null),     -- Hopper Bottom
    ('TR018', 'TRL-018-ID', 3, 'Available', null),     -- Walking Floor
    ('TR019', 'TRL-019-ID', 4, 'Available', null),     -- Liquid Tanker
    ('TR020', 'TRL-020-ID', 6, 'Available', null),     -- Flatbed
    ('TR021', 'TRL-021-ID', 5, 'Available', null),     -- Side Dump
    ('TR022', 'TRL-022-ID', 2, 'Available', null),     -- End Dump
    ('TR023', 'TRL-023-ID', 1, 'Maintenance', '2024-10-25'), -- Hopper Bottom
    ('TR024', 'TRL-024-ID', 6, 'Available', null),     -- Flatbed
    ('TR025', 'TRL-025-ID', 7, 'Available', null)      -- Belt Trailer
) AS v(trailer_number, license_plate, equipment_type_id, status, maintenance_due)
WHERE NOT EXISTS (
    SELECT 1 FROM trailers t WHERE t.trailer_number = v.trailer_number
);

-- Show updated fleet counts
SELECT 'Updated fleet status:' as info;
SELECT 'Trucks' as type, COUNT(*) as count FROM trucks
UNION ALL
SELECT 'Trailers' as type, COUNT(*) as count FROM trailers;

-- Show truck status distribution
SELECT 'Truck Status Distribution:' as info;
SELECT status, COUNT(*) as count
FROM trucks
GROUP BY status
ORDER BY status;

-- Show trailer status and equipment type distribution
SELECT 'Trailer Status Distribution:' as info;
SELECT status, COUNT(*) as count
FROM trailers  
GROUP BY status
ORDER BY status;

SELECT 'Trailer Equipment Type Distribution:' as info;
SELECT 
    et.name as equipment_type,
    COUNT(t.id) as count
FROM trailers t
JOIN equipment_types et ON t.equipment_type_id = et.id
GROUP BY et.name
ORDER BY COUNT(t.id) DESC;

-- Show all available trucks (ready for assignment)
SELECT 'Available Trucks (ready for assignment):' as info;
SELECT 
    id,
    truck_number,
    license_plate,
    status,
    maintenance_due
FROM trucks
WHERE status = 'Available'
ORDER BY truck_number;

-- Show all available trailers by equipment type
SELECT 'Available Trailers (ready for assignment):' as info;
SELECT 
    t.id,
    t.trailer_number,
    t.license_plate,
    t.status,
    et.name as equipment_type,
    t.maintenance_due
FROM trailers t
JOIN equipment_types et ON t.equipment_type_id = et.id
WHERE t.status = 'Available'
ORDER BY et.name, t.trailer_number;

-- Quick summary for dispatcher dashboard
SELECT 'FLEET SUMMARY:' as summary;
SELECT 
    'Available Trucks' as resource_type,
    COUNT(*) as count
FROM trucks
WHERE status = 'Available'
UNION ALL
SELECT 
    'Available Trailers' as resource_type,
    COUNT(*) as count
FROM trailers
WHERE status = 'Available'
UNION ALL
SELECT 
    'Trucks in Maintenance' as resource_type,
    COUNT(*) as count
FROM trucks
WHERE status = 'Maintenance'
UNION ALL
SELECT 
    'Trailers in Maintenance' as resource_type,
    COUNT(*) as count
FROM trailers
WHERE status = 'Maintenance';
