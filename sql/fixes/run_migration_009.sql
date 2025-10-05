-- Complete Migration 009: Fix Curation Requests Schema
-- Run this with: psql "your-connection-string" -f this-file.sql

BEGIN;

-- Step 1: Drop dependent policies
DROP POLICY IF EXISTS "Curation requests are viewable by everyone" ON curation_requests;
DROP POLICY IF EXISTS "Users can create their own curation requests" ON curation_requests;
DROP POLICY IF EXISTS "Requesters can update their own requests" ON curation_requests;
DROP POLICY IF EXISTS "Requesters can delete their own requests" ON curation_requests;
DROP POLICY IF EXISTS "Proposals viewable by request owner and proposal curator" ON curator_proposals;

-- Step 2: Rename column and update fields
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'curation_requests' 
    AND column_name = 'requester_id'
  ) THEN
    ALTER TABLE curation_requests RENAME COLUMN requester_id TO creator_id;
  END IF;
END $$;

ALTER TABLE curation_requests DROP COLUMN IF EXISTS budget_range;
ALTER TABLE curation_requests ADD COLUMN IF NOT EXISTS budget_min DECIMAL(10,2);
ALTER TABLE curation_requests ADD COLUMN IF NOT EXISTS budget_max DECIMAL(10,2);

-- Step 3: Update index
DROP INDEX IF EXISTS idx_curation_requests_requester;
DROP INDEX IF EXISTS idx_curation_requests_creator;
CREATE INDEX idx_curation_requests_creator ON curation_requests(creator_id);

-- Step 4: Recreate policies
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

CREATE POLICY "Proposals viewable by request owner and proposal curator"
  ON curator_proposals FOR SELECT
  USING (
    auth.uid() IN (
      SELECT creator_id FROM curation_requests WHERE id = request_id
    ) OR
    auth.uid() IN (
      SELECT user_id FROM pro_curators WHERE id = curator_id
    )
  );

COMMIT;
