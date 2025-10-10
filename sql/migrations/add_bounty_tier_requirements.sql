-- Add minimum curator tier requirement to curation_requests table (bounties)
-- This allows bounty posters to restrict applications to specific curator trust levels

-- Add column to curation_requests table
ALTER TABLE curation_requests 
ADD COLUMN IF NOT EXISTS minimum_curator_tier VARCHAR(20) DEFAULT 'newcomer';

-- Add comment explaining the column
COMMENT ON COLUMN curation_requests.minimum_curator_tier IS 'Minimum curator trust level required to apply: newcomer, verified, expert, master';

-- Add check constraint to ensure valid tier values
ALTER TABLE curation_requests 
ADD CONSTRAINT curation_requests_minimum_curator_tier_check 
CHECK (minimum_curator_tier IN ('newcomer', 'verified', 'expert', 'master'));

-- Create index for filtering bounties by tier
CREATE INDEX IF NOT EXISTS idx_curation_requests_minimum_curator_tier ON curation_requests(minimum_curator_tier);

-- Verification query
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'curation_requests' AND column_name = 'minimum_curator_tier';
