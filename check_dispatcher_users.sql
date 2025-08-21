-- =====================================================================
-- Check Dispatcher Users Issue
-- Find out why no dispatchers are found in the system
-- =====================================================================

-- 1. Check all users and their roles
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users 
ORDER BY created_at DESC;

-- 2. Count users by role
SELECT 
    role,
    COUNT(*) as user_count
FROM users 
GROUP BY role;

-- 3. Check if any users have 'Dispatcher' role (case sensitive)
SELECT 
    id,
    email,
    name,
    role
FROM users 
WHERE role = 'Dispatcher';

-- 4. Check if there are similar roles (maybe case issue)
SELECT 
    id,
    email,
    name,
    role
FROM users 
WHERE role ILIKE '%dispatch%';

-- 5. Check the users table structure
\d+ users;

-- 6. Check if RLS is preventing us from seeing dispatcher users
SELECT 
    schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- 7. Test what the current user can see
SELECT 
    current_user,
    session_user,
    current_setting('role') as current_role;
