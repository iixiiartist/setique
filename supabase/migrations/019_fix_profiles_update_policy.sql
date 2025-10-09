-- Fix profiles UPDATE policy to prevent 406 errors
-- Add WITH CHECK clause to allow all column updates for authenticated users

BEGIN;

-- Drop the old UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate with both USING and WITH CHECK clauses
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMIT;
