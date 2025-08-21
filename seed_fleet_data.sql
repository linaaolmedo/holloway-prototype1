-- =====================================================================
-- Fleet and Carrier Test Data for BulkFlow TMS
-- Run this in your Supabase SQL editor to create test fleet data
-- =====================================================================

-- First, let's add some carriers (external companies)
INSERT INTO carriers (name, mc_number, primary_contact_name, primary_contact_email, primary_contact_phone, dnu_flag) VALUES
('Holloway Logistics', 'MC123456', 'Bob Wilson', 'bob@holloway.com', '555-0101', false),
('TBD Transport', 'MC789012', 'Lisa Davis', 'lisa@tbd.com', '555-0102', false),
('Summit Carriers', 'MC345678', 'Mike Johnson', 'mike@summit.com', '555-0103', false),
('Prairie Haulers', 'MC901234', 'Sarah Thompson', 'sarah@prairie.com', '555-0104', false)
ON CONFLICT (name) DO NOTHING;

-- Add some trucks to our internal fleet
INSERT INTO trucks (truck_number, license_plate, status) VALUES
('T001', 'TRK-001-ID', 'Available'),
('T002', 'TRK-002-ID', 'Available'), 
('T003', 'TRK-003-ID', 'Available'),
('T004', 'TRK-004-ID', 'Available'),
('T005', 'TRK-005-ID', 'Available')
ON CONFLICT (truck_number) DO NOTHING;

-- Add trailers (need to reference equipment_types)
INSERT INTO trailers (trailer_number, license_plate, equipment_type_id, status) VALUES
('TR001', 'TRL-001-ID', 1, 'Available'), -- Hopper Bottom
('TR002', 'TRL-002-ID', 2, 'Available'), -- End Dump  
('TR003', 'TRL-003-ID', 1, 'Available'), -- Hopper Bottom
('TR004', 'TRL-004-ID', 3, 'Available'), -- Walking Floor
('TR005', 'TRL-005-ID', 2, 'Available'), -- End Dump
('TR006', 'TRL-006-ID', 4, 'Available'), -- Liquid Tanker
('TR007', 'TRL-007-ID', 6, 'Available')  -- Flatbed
ON CONFLICT (trailer_number) DO NOTHING;

-- Add internal drivers (these need user accounts to log in)
-- First, let's create some test users in auth.users (you'll need to do this through Supabase Auth UI or API)
-- For now, we'll add drivers without user_id (they can be linked later)

INSERT INTO drivers (name, phone, license_number, license_expiry_date, medical_card_expiry, status, truck_id) VALUES
('Jennifer Martinez', '555-0201', 'CDL123456', '2025-06-15', '2024-12-31', 'Active', 1),
('Dave Anderson', '555-0202', 'CDL789012', '2025-08-20', '2025-03-15', 'Active', 2),
('Maria Rodriguez', '555-0203', 'CDL345678', '2025-04-10', '2024-11-30', 'Active', 3),
('Tom Wilson', '555-0204', 'CDL901234', '2025-09-05', '2025-01-20', 'Active', null), -- Available driver
('Chris Parker', '555-0205', 'CDL567890', '2025-07-25', '2025-02-28', 'Active', null)  -- Available driver
ON CONFLICT (name) DO NOTHING;

-- Update truck status to 'In Use' for assigned trucks
UPDATE trucks SET status = 'In Use' WHERE id IN (1, 2, 3);

-- Let's also add a sample customer and location if they don't exist
INSERT INTO customers (name, primary_contact_name, primary_contact_email, primary_contact_phone) VALUES
('Farm Fresh Co.', 'Sally Greene', 'sally@farmfresh.com', '555-0301')
ON CONFLICT (name) DO NOTHING;

-- Add customer locations
INSERT INTO customer_locations (customer_id, location_name, address_line1, city, state, postal_code) VALUES
((SELECT id FROM customers WHERE name = 'Farm Fresh Co.' LIMIT 1), 'Secondary Warehouse', '852 Storage Lane', 'Baton Rouge', 'LA', '70801'),
((SELECT id FROM customers WHERE name = 'Farm Fresh Co.' LIMIT 1), 'Main Warehouse', '123 Billing St.', 'Townsville', 'LA', '90810')
ON CONFLICT (customer_id, location_name) DO NOTHING;

-- Show what we created
SELECT 'DRIVERS CREATED:' as summary;
SELECT id, name, phone, status, truck_id FROM drivers ORDER BY id;

SELECT 'TRUCKS CREATED:' as summary;  
SELECT id, truck_number, license_plate, status FROM trucks ORDER BY id;

SELECT 'TRAILERS CREATED:' as summary;
SELECT id, trailer_number, equipment_type_id, status FROM trailers ORDER BY id;

SELECT 'CARRIERS CREATED:' as summary;
SELECT id, name, mc_number, primary_contact_name FROM carriers ORDER BY id;
