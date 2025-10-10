-- Fix RLS Policies for Datasets Table
-- Ensure authenticated users can manage their own datasets

-- Enable RLS on datasets table (if not already enabled)
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can insert their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can create datasets" ON datasets;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON datasets;
DROP POLICY IF EXISTS "Users can view all datasets" ON datasets;
DROP POLICY IF EXISTS "Public can view active datasets" ON datasets;
DROP POLICY IF EXISTS "Users can update their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can delete their own datasets" ON datasets;

-- Policy 1: Allow authenticated users to INSERT datasets they own
CREATE POLICY "Users can insert their own datasets"
ON datasets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Policy 2: Allow everyone to SELECT/view datasets (marketplace needs this)
CREATE POLICY "Public can view active datasets"
ON datasets
FOR SELECT
TO public
USING (is_active = true);

-- Policy 3: Allow users to SELECT their own datasets (even if inactive)
CREATE POLICY "Users can view their own datasets"
ON datasets
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- Policy 4: Allow users to UPDATE their own datasets
CREATE POLICY "Users can update their own datasets"
ON datasets
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Policy 5: Allow users to DELETE their own datasets (soft delete via is_active)
CREATE POLICY "Users can delete their own datasets"
ON datasets
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
WHERE tablename = 'datasets'
ORDER BY cmd, policyname;
