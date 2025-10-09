-- Check if profiles RLS is blocking the handle_new_user insert

SELECT 'PROFILES RLS POLICIES' as check_type;
SELECT 
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- The handle_new_user trigger inserts into profiles
-- If there's no INSERT policy that allows it, the signup will fail!

-- Check if we need to add a policy for system inserts into profiles
SELECT 'PROFILES INSERT POLICIES' as check_type;
SELECT 
  policyname,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
  AND cmd = 'INSERT';

-- If there are no INSERT policies or they're too restrictive, we need to add one
SELECT 'FIX NEEDED?' as check_type;
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'YES - No INSERT policies exist'
    WHEN COUNT(*) > 0 AND NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'profiles' 
        AND cmd = 'INSERT' 
        AND with_check = 'true'
    ) THEN 'MAYBE - Check if existing policies allow trigger inserts'
    ELSE 'NO - Permissive policy exists'
  END as fix_status
FROM pg_policies
WHERE tablename = 'profiles'
  AND cmd = 'INSERT';
