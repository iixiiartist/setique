-- Ensure DELETE policy exists for bounty_submissions
-- This allows users to delete their own submissions and admins to delete any submission

-- First, check if the policy exists
DO $$ 
BEGIN
    -- Drop existing delete policy if it exists
    DROP POLICY IF EXISTS "Users can delete their own submissions" ON bounty_submissions;
    DROP POLICY IF EXISTS "Admins can delete any submission" ON bounty_submissions;
    
    RAISE NOTICE 'Dropped existing delete policies';
END $$;

-- Create user delete policy (users can delete their own submissions)
CREATE POLICY "Users can delete their own submissions"
ON bounty_submissions
FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- Create admin delete policy (admins can delete any submission)
CREATE POLICY "Admins can delete any submission"
ON bounty_submissions
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM admins
  )
);

-- Also ensure admins can SELECT all submissions
DROP POLICY IF EXISTS "Admins can view all submissions" ON bounty_submissions;

CREATE POLICY "Admins can view all submissions"
ON bounty_submissions
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM admins
  )
);

-- Also ensure admins can UPDATE any submission (for approve/reject)
DROP POLICY IF EXISTS "Admins can update any submission" ON bounty_submissions;

CREATE POLICY "Admins can update any submission"
ON bounty_submissions
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM admins
  )
);

-- Verify all DELETE policies
SELECT 
    policyname,
    cmd,
    qual as "USING clause",
    with_check as "WITH CHECK clause"
FROM pg_policies
WHERE tablename = 'bounty_submissions'
    AND cmd = 'DELETE'
ORDER BY policyname;

RAISE NOTICE 'Bounty submissions DELETE policies created successfully';
