-- Fix: Add a permissive INSERT policy for profiles to allow signup trigger

-- First, check what policies currently exist
SELECT 'CURRENT PROFILES INSERT POLICIES' as check_type;
SELECT 
  policyname,
  permissive,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
  AND cmd = 'INSERT';

-- Add a permissive policy for system/trigger inserts
-- This allows the handle_new_user() trigger to create profiles during signup
DROP POLICY IF EXISTS "System can create profiles" ON profiles;

CREATE POLICY "System can create profiles"
  ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Verify the fix
SELECT 'UPDATED PROFILES POLICIES' as check_type;
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
  AND cmd = 'INSERT'
ORDER BY policyname;

SELECT 'FIX APPLIED - TRY SIGNUP NOW' as status;
