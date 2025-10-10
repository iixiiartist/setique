-- Fix: Manually create beta_access records for existing users

-- 1. Show profiles without beta_access
SELECT 'PROFILES WITHOUT BETA ACCESS' as check_type;
SELECT 
  p.id,
  p.email,
  p.username,
  p.created_at,
  CASE 
    WHEN ba.id IS NULL THEN '❌ NO BETA ACCESS'
    ELSE '✅ HAS BETA ACCESS'
  END as beta_status
FROM profiles p
LEFT JOIN beta_access ba ON p.id = ba.user_id
ORDER BY p.created_at;

-- 2. Create beta_access records for profiles that don't have them
INSERT INTO beta_access (user_id, email, access_code, status)
SELECT 
  p.id,
  p.email,
  generate_access_code(),
  'approved'  -- Auto-approve existing users (they're already using the platform)
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM beta_access WHERE user_id = p.id
);

-- 3. Show what was created
SELECT 'NEWLY CREATED BETA ACCESS' as check_type;
SELECT 
  ba.email,
  ba.status,
  ba.access_code,
  ba.created_at
FROM beta_access ba
ORDER BY ba.created_at;

-- 4. Verify all profiles now have beta_access
SELECT 'VERIFICATION' as check_type;
SELECT 
  COUNT(CASE WHEN ba.id IS NULL THEN 1 END) as profiles_without_beta,
  COUNT(CASE WHEN ba.id IS NOT NULL THEN 1 END) as profiles_with_beta
FROM profiles p
LEFT JOIN beta_access ba ON p.id = ba.user_id;

SELECT '✅ All existing profiles now have beta_access records' as result;
