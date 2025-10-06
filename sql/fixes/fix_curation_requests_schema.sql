-- Fix curation_requests schema
-- This renames requester_id to creator_id and adds budget columns
-- Run this in Supabase SQL Editor

-- Step 1: Drop dependent policies first
DROP POLICY IF EXISTS "Curation requests are viewable by everyone" ON curation_requests;
DROP POLICY IF EXISTS "Users can create their own curation requests" ON curation_requests;
DROP POLICY IF EXISTS "Requesters can update their own requests" ON curation_requests;
DROP POLICY IF EXISTS "Requesters can delete their own requests" ON curation_requests;
DROP POLICY IF EXISTS "Proposals viewable by request owner and proposal curator" ON curator_proposals;

-- Step 2: Rename requester_id to creator_id (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'curation_requests' 
    AND column_name = 'requester_id'
  ) THEN
    ALTER TABLE curation_requests RENAME COLUMN requester_id TO creator_id;
    RAISE NOTICE 'Renamed requester_id to creator_id';
  ELSE
    RAISE NOTICE 'Column creator_id already exists or requester_id does not exist';
  END IF;
END $$;

-- Step 3: Add budget columns
ALTER TABLE curation_requests DROP COLUMN IF EXISTS budget_range;
ALTER TABLE curation_requests ADD COLUMN IF NOT EXISTS budget_min DECIMAL(10,2);
ALTER TABLE curation_requests ADD COLUMN IF NOT EXISTS budget_max DECIMAL(10,2);

-- Step 4: Update indexes
DROP INDEX IF EXISTS idx_curation_requests_requester;
DROP INDEX IF EXISTS idx_curation_requests_creator;
CREATE INDEX IF NOT EXISTS idx_curation_requests_creator ON curation_requests(creator_id);

-- Step 5: Recreate policies with correct column names
CREATE POLICY "Curation requests are viewable by everyone"
  ON curation_requests FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own curation requests"
  ON curation_requests FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Requesters can update their own requests"
  ON curation_requests FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Requesters can delete their own requests"
  ON curation_requests FOR DELETE
  USING (auth.uid() = creator_id);

-- Step 6: Recreate proposals policy (if curator_proposals table exists)
CREATE POLICY "Proposals viewable by request owner and proposal curator"
  ON curator_proposals FOR SELECT
  USING (
    auth.uid() = curator_id 
    OR auth.uid() = (SELECT creator_id FROM curation_requests WHERE id = request_id)
  );

-- Verify the fix
SELECT 
  'Fix complete!' as status,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'curation_requests' 
  AND column_name IN ('creator_id', 'budget_min', 'budget_max')
ORDER BY column_name;
