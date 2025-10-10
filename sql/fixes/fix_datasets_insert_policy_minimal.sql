-- Quick Fix: Add ONLY the missing INSERT policy for datasets table
-- Run this if you already have some policies and just need the INSERT one

-- Drop and recreate the INSERT policy
DROP POLICY IF EXISTS "Users can insert their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can create datasets" ON datasets;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON datasets;

-- Create the INSERT policy that's causing the 400 error
CREATE POLICY "Users can insert their own datasets"
ON datasets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Verify it was created
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'datasets' AND cmd = 'INSERT';
