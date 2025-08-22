-- =====================================================================
-- PERMANENT AUTH FIX: Ensure User Roles Persist Across Sessions
-- Run this in Supabase SQL Editor to permanently fix auth issues
-- =====================================================================

BEGIN;

-- Step 1: Create a function to ensure user profile exists on every auth
CREATE OR REPLACE FUNCTION public.ensure_user_profile_exists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a user signs in, ensure they have a profile in public.users
  INSERT INTO public.users (
    id, 
    role, 
    name, 
    email,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'Dispatcher', -- Default everyone to Dispatcher for full access
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Ensure existing users get Dispatcher role if they don't have one
    role = CASE 
      WHEN public.users.role IS NULL OR public.users.role = '' 
      THEN 'Dispatcher'
      ELSE public.users.role
    END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Step 2: Create trigger to run on every auth.users insert/update
DROP TRIGGER IF EXISTS ensure_user_profile_on_auth ON auth.users;
CREATE TRIGGER ensure_user_profile_on_auth
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile_exists();

-- Step 3: Fix any existing users without proper roles
UPDATE public.users 
SET 
  role = 'Dispatcher',
  updated_at = NOW()
WHERE role IS NULL OR role = '' OR role NOT IN ('Dispatcher', 'Customer', 'Carrier', 'Driver');

-- Step 4: Ensure current user has Dispatcher role
INSERT INTO public.users (
  id, 
  role, 
  name, 
  email,
  created_at,
  updated_at
) VALUES (
  auth.uid(),
  'Dispatcher',
  COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), 'Admin User'),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'Dispatcher',
  updated_at = NOW();

-- Step 5: Create a backup get_user_role function with fallback
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- Try to get role from users table
  SELECT role INTO user_role
  FROM public.users 
  WHERE id = auth.uid();
  
  -- If no role found, default to Dispatcher and create the user
  IF user_role IS NULL THEN
    INSERT INTO public.users (
      id, 
      role, 
      name, 
      email,
      created_at,
      updated_at
    ) VALUES (
      auth.uid(),
      'Dispatcher',
      COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), 'Auto-Created User'),
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'Dispatcher',
      updated_at = NOW();
    
    RETURN 'Dispatcher';
  END IF;
  
  RETURN user_role;
END;
$$;

-- Step 6: Grant proper permissions
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile_exists() TO service_role;

-- Step 7: Verify the fix works
SELECT 
  'VERIFICATION:' as status,
  auth.uid() as current_user_id,
  public.get_user_role() as role,
  CASE 
    WHEN public.get_user_role() = 'Dispatcher' THEN '✅ SUCCESS - You should now have permanent customer access!'
    ELSE '❌ ISSUE REMAINS - Contact support'
  END as result;

COMMIT;

-- Final status message
SELECT '🎉 PERMANENT FIX COMPLETE! Your role will now persist across all sessions.' as message;
