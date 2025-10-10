-- Check all tables that reference users and their cascade behavior

-- 1. Check foreign key constraints related to users
SELECT 
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE confrelid = 'auth.users'::regclass
   OR confrelid = 'profiles'::regclass
ORDER BY conrelid::regclass::text;

-- 2. Check what data exists for test users
SELECT 'PROFILES' as table_name, COUNT(*) as count FROM profiles 
WHERE email NOT IN ('joseph@anconsulting.us', 'setique.e2etest@gmail.com');

SELECT 'BETA_ACCESS' as table_name, COUNT(*) as count FROM beta_access 
WHERE email NOT IN ('joseph@anconsulting.us', 'setique.e2etest@gmail.com');

SELECT 'USER_FOLLOWS' as table_name, COUNT(*) as count FROM user_follows 
WHERE follower_id IN (
  SELECT id FROM auth.users WHERE email NOT IN ('joseph@anconsulting.us', 'setique.e2etest@gmail.com')
) OR following_id IN (
  SELECT id FROM auth.users WHERE email NOT IN ('joseph@anconsulting.us', 'setique.e2etest@gmail.com')
);

SELECT 'DATASETS' as table_name, COUNT(*) as count FROM datasets 
WHERE curator_id IN (
  SELECT id FROM profiles WHERE email NOT IN ('joseph@anconsulting.us', 'setique.e2etest@gmail.com')
);

SELECT 'PURCHASES' as table_name, COUNT(*) as count FROM purchases 
WHERE buyer_id IN (
  SELECT id FROM profiles WHERE email NOT IN ('joseph@anconsulting.us', 'setique.e2etest@gmail.com')
);

SELECT 'FEEDBACK' as table_name, COUNT(*) as count FROM feedback 
WHERE user_id IN (
  SELECT id FROM profiles WHERE email NOT IN ('joseph@anconsulting.us', 'setique.e2etest@gmail.com')
);
