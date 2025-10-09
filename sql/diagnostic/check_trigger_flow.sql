-- Simple check: What's the actual error when we try to create a beta_access record?

-- 1. Check all triggers on both auth.users and profiles
SELECT 'TRIGGERS ON AUTH.USERS' as check_type;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth'
ORDER BY trigger_name;

SELECT 'TRIGGERS ON PROFILES' as check_type;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
  AND event_object_schema = 'public'
ORDER BY trigger_name;

-- 2. Check what the handle_new_user function does
SELECT 'HANDLE_NEW_USER FUNCTION' as check_type;
SELECT routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- 3. Let's see if we can manually create a beta_access record
-- (This bypasses the trigger to test if the table/RLS is working)
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  test_code TEXT;
BEGIN
  -- Generate a code
  test_code := generate_access_code();
  
  RAISE NOTICE 'Generated access code: %', test_code;
  
  -- Try to insert directly (as superuser, bypassing RLS)
  BEGIN
    INSERT INTO beta_access (user_id, email, access_code, status)
    VALUES (test_id, 'manual-test@example.com', test_code, 'pending_approval');
    
    RAISE NOTICE 'SUCCESS: Manual beta_access insert worked!';
    
    -- Clean up
    DELETE FROM beta_access WHERE user_id = test_id;
    RAISE NOTICE 'Cleaned up test record';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'ERROR: Could not insert beta_access: %', SQLERRM;
  END;
END $$;

-- 4. Check RLS status
SELECT 'RLS STATUS' as check_type;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('profiles', 'beta_access')
  AND schemaname = 'public';
