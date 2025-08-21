-- =====================================================================
-- Link Existing Drivers to Their Auth User Accounts
-- This connects the drivers in your drivers table to auth.users
-- =====================================================================

-- First, let's see what we have
SELECT 'CURRENT DRIVERS:' as info;
SELECT id, name, user_id FROM drivers ORDER BY name;

SELECT 'AUTH USERS:' as info;  
SELECT id, email FROM auth.users WHERE email LIKE '%@company.com' ORDER BY email;

-- Step 1: First create user profiles for all company.com auth users
-- This must be done before updating drivers table due to foreign key constraint

INSERT INTO users (id, role, name, email, customer_id, carrier_id, created_at, updated_at) 
SELECT 
    au.id,
    'Driver' as role,
    CASE 
        WHEN au.email = 'jennifer@company.com' THEN 'Jennifer Martinez'
        WHEN au.email = 'dave@company.com' THEN 'Dave Anderson'
        WHEN au.email = 'maria@company.com' THEN 'Maria Rodriguez'
        WHEN au.email = 'tom@company.com' THEN 'Tom Wilson'
        WHEN au.email = 'chris@company.com' THEN 'Chris Parker'
        ELSE INITCAP(SPLIT_PART(au.email, '@', 1)) -- Capitalize first name from email
    END as name,
    au.email,
    null as customer_id,
    null as carrier_id,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users au
WHERE au.email LIKE '%@company.com'
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Step 2: Now link drivers to their auth users based on email pattern
-- firstname@company.com matches to "Firstname Lastname" in drivers table

-- Jennifer Martinez -> jennifer@company.com
UPDATE drivers 
SET user_id = (SELECT id FROM auth.users WHERE email = 'jennifer@company.com')
WHERE name = 'Jennifer Martinez' AND user_id IS NULL;

-- Dave Anderson -> dave@company.com  
UPDATE drivers 
SET user_id = (SELECT id FROM auth.users WHERE email = 'dave@company.com')
WHERE name = 'Dave Anderson' AND user_id IS NULL;

-- Maria Rodriguez -> maria@company.com
UPDATE drivers 
SET user_id = (SELECT id FROM auth.users WHERE email = 'maria@company.com')
WHERE name = 'Maria Rodriguez' AND user_id IS NULL;

-- Tom Wilson -> tom@company.com
UPDATE drivers 
SET user_id = (SELECT id FROM auth.users WHERE email = 'tom@company.com')
WHERE name = 'Tom Wilson' AND user_id IS NULL;

-- Chris Parker -> chris@company.com
UPDATE drivers 
SET user_id = (SELECT id FROM auth.users WHERE email = 'chris@company.com')
WHERE name = 'Chris Parker' AND user_id IS NULL;

-- For any other drivers, you can add them here following the same pattern:
-- UPDATE drivers 
-- SET user_id = (SELECT id FROM auth.users WHERE email = 'firstname@company.com')
-- WHERE name = 'Firstname Lastname' AND user_id IS NULL;

-- Verify the linking worked
SELECT 'LINKED DRIVERS:' as result;
SELECT 
    d.id as driver_id,
    d.name as driver_name,
    d.user_id,
    au.email as auth_email,
    u.role as user_role
FROM drivers d
LEFT JOIN auth.users au ON d.user_id = au.id  
LEFT JOIN users u ON d.user_id = u.id
ORDER BY d.name;

-- Show any drivers that still need linking
SELECT 'DRIVERS STILL NEEDING USER_ID:' as warning;
SELECT id, name FROM drivers WHERE user_id IS NULL;
