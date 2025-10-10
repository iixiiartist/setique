# Fix for Dataset Upload Error - RLS Policy Missing

## Error Message
```
Failed to load resource: the server responded with a status of 400
StorageApiError: new row violates row-level security policy
```

## Root Cause
The `datasets` table in Supabase is missing the Row-Level Security (RLS) policy that allows authenticated users to INSERT new datasets.

## Solution

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Fix
Copy and paste the contents of `sql/fixes/fix_datasets_insert_policy.sql` into the SQL Editor and click "Run"

Or run this directly:

```sql
-- Enable RLS on datasets table
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can insert their own datasets" ON datasets;
DROP POLICY IF EXISTS "Public can view active datasets" ON datasets;
DROP POLICY IF EXISTS "Users can view their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can update their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can delete their own datasets" ON datasets;

-- Create INSERT policy
CREATE POLICY "Users can insert their own datasets"
ON datasets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Create SELECT policies
CREATE POLICY "Public can view active datasets"
ON datasets
FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Users can view their own datasets"
ON datasets
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- Create UPDATE policy
CREATE POLICY "Users can update their own datasets"
ON datasets
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Create DELETE policy
CREATE POLICY "Users can delete their own datasets"
ON datasets
FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);
```

### Step 3: Verify
Run this query to check that policies were created:

```sql
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'datasets'
ORDER BY cmd, policyname;
```

You should see 5 policies:
- DELETE: Users can delete their own datasets
- INSERT: Users can insert their own datasets  
- SELECT: Public can view active datasets
- SELECT: Users can view their own datasets
- UPDATE: Users can update their own datasets

### Step 4: Test
Try submitting a dataset again - the error should be gone!

## What These Policies Do

1. **INSERT**: Users can only create datasets where they are the creator (`creator_id = auth.uid()`)
2. **SELECT (Public)**: Anyone can view datasets marked as active (for the marketplace)
3. **SELECT (Private)**: Users can always view their own datasets, even if inactive
4. **UPDATE**: Users can only update their own datasets
5. **DELETE**: Users can only delete their own datasets

This ensures data security while allowing the marketplace to function properly.
