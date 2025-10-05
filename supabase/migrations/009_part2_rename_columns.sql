-- Part 2: Rename Column and Update Fields (Run this SECOND)
-- Copy and paste this into Supabase SQL Editor

-- Rename requester_id to creator_id
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

-- Update budget fields
ALTER TABLE curation_requests DROP COLUMN IF EXISTS budget_range;
ALTER TABLE curation_requests ADD COLUMN IF NOT EXISTS budget_min DECIMAL(10,2);
ALTER TABLE curation_requests ADD COLUMN IF NOT EXISTS budget_max DECIMAL(10,2);

-- Update index
DROP INDEX IF EXISTS idx_curation_requests_requester;
DROP INDEX IF EXISTS idx_curation_requests_creator;
CREATE INDEX idx_curation_requests_creator ON curation_requests(creator_id);
