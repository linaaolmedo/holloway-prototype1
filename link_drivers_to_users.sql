-- =====================================================================
-- Link Drivers to User Accounts
-- This allows drivers to log in and see their assignments
-- =====================================================================

-- First, create user accounts for your drivers in Supabase Auth
-- You can do this through the Supabase Dashboard > Authentication > Users
-- or use the Auth API/SDK

-- Example driver accounts to create:
-- Email: jennifer@company.com, Password: testpass123
-- Email: dave@company.com, Password: testpass123  
-- Email: maria@company.com, Password: testpass123
-- Email: tom@company.com, Password: testpass123
-- Email: chris@company.com, Password: testpass123

-- After creating auth users, link them to driver records
-- Replace the UUIDs with actual user IDs from auth.users

-- You can get user IDs with:
-- SELECT id, email FROM auth.users WHERE email LIKE '%@company.com';

-- Then update drivers (replace UUIDs with real ones):
/*
UPDATE drivers SET user_id = 'your-uuid-for-jennifer' WHERE name = 'Jennifer Martinez';
UPDATE drivers SET user_id = 'your-uuid-for-dave' WHERE name = 'Dave Anderson';  
UPDATE drivers SET user_id = 'your-uuid-for-maria' WHERE name = 'Maria Rodriguez';
UPDATE drivers SET user_id = 'your-uuid-for-tom' WHERE name = 'Tom Wilson';
UPDATE drivers SET user_id = 'your-uuid-for-chris' WHERE name = 'Chris Parker';
*/

-- Also make sure these users have the 'Driver' role in your app_user table
-- You may need to create app_user records too:
/*
INSERT INTO app_user (user_id, role, full_name, email) VALUES
('your-uuid-for-jennifer', 'Driver', 'Jennifer Martinez', 'jennifer@company.com'),
('your-uuid-for-dave', 'Driver', 'Dave Anderson', 'dave@company.com'),
('your-uuid-for-maria', 'Driver', 'Maria Rodriguez', 'maria@company.com'),
('your-uuid-for-tom', 'Driver', 'Tom Wilson', 'tom@company.com'),
('your-uuid-for-chris', 'Driver', 'Chris Parker', 'chris@company.com')
ON CONFLICT (user_id) DO NOTHING;
*/
