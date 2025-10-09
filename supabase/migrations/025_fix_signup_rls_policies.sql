-- Migration: Fix RLS policies to allow signup triggers
-- This adds permissive INSERT policies for both profiles and beta_access
-- to allow the signup triggers to work properly

BEGIN;

-- Add system policy for profiles (allows handle_new_user trigger)
DROP POLICY IF EXISTS "System can create profiles" ON profiles;
CREATE POLICY "System can create profiles"
  ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Verify profiles policies
SELECT 'Profiles INSERT policies:' as info;
SELECT policyname, with_check 
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'INSERT';

-- Add system policy for beta_access (allows create_beta_access_on_signup trigger)
DROP POLICY IF EXISTS "System can create beta access" ON beta_access;
CREATE POLICY "System can create beta access"
  ON beta_access
  FOR INSERT
  WITH CHECK (true);

-- Verify beta_access policies
SELECT 'Beta Access INSERT policies:' as info;
SELECT policyname, with_check 
FROM pg_policies 
WHERE tablename = 'beta_access' AND cmd = 'INSERT';

COMMIT;

SELECT '✅ RLS policies fixed for signup triggers' as status;
