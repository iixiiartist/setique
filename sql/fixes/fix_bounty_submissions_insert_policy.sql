-- Fix RLS Policies for bounty_submissions Table
-- Allow users to submit datasets to bounties

-- Enable RLS on bounty_submissions table (if not already enabled)
ALTER TABLE bounty_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can insert their own submissions" ON bounty_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON bounty_submissions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON bounty_submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON bounty_submissions;
DROP POLICY IF EXISTS "Users can view all submissions" ON bounty_submissions;
DROP POLICY IF EXISTS "Bounty creators can view submissions" ON bounty_submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON bounty_submissions;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON bounty_submissions;

-- Policy 1: Allow authenticated users to INSERT their own submissions
CREATE POLICY "Users can insert their own submissions"
ON bounty_submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Policy 2: Allow users to view their own submissions
CREATE POLICY "Users can view their own submissions"
ON bounty_submissions
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- Policy 3: Allow bounty creators to view submissions to their bounties
CREATE POLICY "Bounty creators can view submissions"
ON bounty_submissions
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT creator_id 
    FROM curation_requests 
    WHERE id = bounty_submissions.request_id
  )
);

-- Policy 4: Allow users to update their own submissions (before they're accepted)
CREATE POLICY "Users can update their own submissions"
ON bounty_submissions
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Policy 5: Allow users to delete their own submissions (withdraw submission)
CREATE POLICY "Users can delete their own submissions"
ON bounty_submissions
FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- Verify all policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'bounty_submissions'
ORDER BY cmd, policyname;
