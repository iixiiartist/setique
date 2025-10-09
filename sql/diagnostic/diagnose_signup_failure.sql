-- Comprehensive diagnostic for beta access signup issues
-- Run this to see exactly what's configured and what might be failing

-- 1. Check if beta_access table exists and its structure
SELECT 'BETA ACCESS TABLE STRUCTURE' as check_type;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'beta_access'
ORDER BY ordinal_position;

-- 2. Check if the trigger exists on profiles table
SELECT 'TRIGGERS ON PROFILES TABLE' as check_type;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 3. Check the trigger function definition
SELECT 'TRIGGER FUNCTION DEFINITION' as check_type;
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'create_beta_access_on_signup';

-- 4. Test if we can manually call generate_access_code
SELECT 'TEST GENERATE ACCESS CODE' as check_type;
SELECT generate_access_code() as sample_code;

-- 5. Check RLS policies on beta_access
SELECT 'RLS POLICIES ON BETA_ACCESS' as check_type;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'beta_access';

-- 6. Check if profiles table has the email column
SELECT 'PROFILES TABLE STRUCTURE' as check_type;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('id', 'email', 'created_at')
ORDER BY ordinal_position;

-- 7. Check for any existing beta_access records
SELECT 'EXISTING BETA ACCESS RECORDS' as check_type;
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = 'pending_approval' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM beta_access;

-- 8. Check recent profiles (to see if signup is creating profiles at all)
SELECT 'RECENT PROFILES' as check_type;
SELECT 
  id,
  email,
  created_at,
  updated_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- 9. Check if auth.users table has recent signups
SELECT 'RECENT AUTH USERS' as check_type;
SELECT 
  id,
  email,
  created_at,
  confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 10. Verify the trigger is actually enabled
SELECT 'TRIGGER STATUS' as check_type;
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  CASE tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'REPLICA'
    WHEN 'A' THEN 'ALWAYS'
  END as status
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE pg_class.relname = 'profiles'
  AND tgname = 'trigger_create_beta_access';
