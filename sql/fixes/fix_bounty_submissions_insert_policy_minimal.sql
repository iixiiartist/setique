-- Quick Fix: Add ONLY the missing INSERT policy for bounty_submissions table

-- Drop and recreate the INSERT policy
DROP POLICY IF EXISTS "Users can insert their own submissions" ON bounty_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON bounty_submissions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON bounty_submissions;

-- Create the INSERT policy that's causing the 400 error
CREATE POLICY "Users can insert their own submissions"
ON bounty_submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Verify it was created
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'bounty_submissions' AND cmd = 'INSERT';
