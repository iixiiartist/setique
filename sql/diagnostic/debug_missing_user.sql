-- Debug: Check what's happening with signups

-- 1. Check ALL users in auth.users
SELECT 'ALL AUTH USERS' as check_type;
SELECT 
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ UNCONFIRMED'
    ELSE '✅ CONFIRMED'
  END as status
FROM auth.users
ORDER BY created_at DESC;

-- 2. Check ALL profiles
SELECT 'ALL PROFILES' as check_type;
SELECT 
  email,
  username,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- 3. Check ALL beta_access records
SELECT 'ALL BETA ACCESS RECORDS' as check_type;
SELECT 
  email,
  status,
  access_code,
  code_used_at,
  created_at
FROM beta_access
ORDER BY created_at DESC;

-- 4. Check if triggers are still enabled
SELECT 'TRIGGER STATUS' as check_type;
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  CASE tgenabled
    WHEN 'O' THEN '✅ ENABLED'
    WHEN 'D' THEN '❌ DISABLED'
    ELSE tgenabled::text
  END as status
FROM information_schema.triggers t
JOIN pg_trigger pt ON pt.tgname = t.trigger_name
WHERE event_object_schema IN ('auth', 'public')
  AND trigger_name IN ('on_auth_user_created', 'trigger_create_beta_access')
ORDER BY trigger_name;

-- 5. Try to manually create a test to see what happens
DO $$
BEGIN
  RAISE NOTICE '=== CHECKING SIGNUP SYSTEM ===';
  
  -- Check if triggers would fire
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgenabled = 'O'
  ) THEN
    RAISE NOTICE '✅ on_auth_user_created trigger is ENABLED';
  ELSE
    RAISE NOTICE '❌ on_auth_user_created trigger is DISABLED or MISSING';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_create_beta_access' 
    AND tgenabled = 'O'
  ) THEN
    RAISE NOTICE '✅ trigger_create_beta_access trigger is ENABLED';
  ELSE
    RAISE NOTICE '❌ trigger_create_beta_access trigger is DISABLED or MISSING';
  END IF;
  
END $$;
