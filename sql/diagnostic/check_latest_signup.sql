-- Check if the latest signup created a beta_access record

-- Show the most recent user
SELECT 'MOST RECENT AUTH USER' as check_type;
SELECT 
  email,
  created_at,
  email_confirmed_at,
  id
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;

-- Show the most recent profile
SELECT 'MOST RECENT PROFILE' as check_type;
SELECT 
  email,
  username,
  created_at,
  id
FROM profiles
ORDER BY created_at DESC
LIMIT 1;

-- Show the most recent beta_access
SELECT 'MOST RECENT BETA ACCESS' as check_type;
SELECT 
  email,
  status,
  access_code,
  created_at,
  user_id
FROM beta_access
ORDER BY created_at DESC
LIMIT 1;

-- Check if they match
SELECT 'SIGNUP FLOW CHECK' as check_type;
SELECT 
  CASE 
    WHEN (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1) = 
         (SELECT id FROM profiles ORDER BY created_at DESC LIMIT 1)
    THEN '✅ Profile was created for latest user'
    ELSE '❌ Profile NOT created for latest user'
  END as profile_check,
  CASE 
    WHEN (SELECT id FROM profiles ORDER BY created_at DESC LIMIT 1) = 
         (SELECT user_id FROM beta_access ORDER BY created_at DESC LIMIT 1)
    THEN '✅ Beta access was created for latest profile'
    ELSE '❌ Beta access NOT created for latest profile - TRIGGER FAILED!'
  END as beta_access_check;
