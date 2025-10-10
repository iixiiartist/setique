-- Check user status and fix confirmation issues

-- 1. Show recent users and their confirmation status
SELECT 'RECENT USERS' as check_type;
SELECT 
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
    ELSE '✅ CONFIRMED'
  END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Auto-confirm all unconfirmed users
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 3. Show how many users were confirmed
SELECT 
  'Users auto-confirmed' as action,
  COUNT(*) as count
FROM auth.users
WHERE email_confirmed_at IS NOT NULL;

-- 4. Check if profiles exist for these users
SELECT 'PROFILES CHECK' as check_type;
SELECT 
  u.email,
  p.username,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    ELSE '✅ HAS PROFILE'
  END as profile_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- 5. Check beta access status
SELECT 'BETA ACCESS STATUS' as check_type;
SELECT 
  u.email,
  ba.status,
  ba.access_code,
  ba.code_used_at,
  CASE 
    WHEN ba.id IS NULL THEN '❌ NO BETA ACCESS'
    WHEN ba.status = 'approved' AND ba.code_used_at IS NOT NULL THEN '✅ FULL ACCESS'
    WHEN ba.status = 'approved' THEN '⏳ APPROVED (need to redeem code)'
    ELSE '⏳ ' || UPPER(ba.status)
  END as access_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN beta_access ba ON p.id = ba.user_id
ORDER BY u.created_at DESC
LIMIT 10;

SELECT '✅ All unconfirmed users have been auto-confirmed' as result;
SELECT 'Try logging in now!' as instruction;
