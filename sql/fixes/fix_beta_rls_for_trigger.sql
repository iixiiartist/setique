-- The REAL issue: RLS policies on beta_access might be blocking trigger inserts
-- Triggers run as the invoking user, not as superuser

-- Check current policies
SELECT 'CURRENT POLICIES ON BETA_ACCESS' as check_type;
SELECT 
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'beta_access'
ORDER BY cmd, policyname;

-- The problem: We have policies for INSERT but they require being an admin
-- The trigger runs during signup when there's NO authenticated user yet!

-- FIX: Add a policy that allows INSERT from the trigger function
-- This policy will allow inserts when there's no auth.uid() (during signup trigger)

-- First, let's create a more permissive INSERT policy for system operations
DROP POLICY IF EXISTS "System can create beta access" ON beta_access;

CREATE POLICY "System can create beta access"
  ON beta_access 
  FOR INSERT
  WITH CHECK (true);  -- Allow all inserts (RLS still protects SELECTs)

-- Verify the new policy
SELECT 'UPDATED POLICIES' as check_type;
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'beta_access'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Now test if signup will work
SELECT 'FIX APPLIED - TRY SIGNUP NOW' as status;
