-- Add is_published column to datasets table
-- This column is referenced in UserProfilePage and ActivityFeedPage but was missing from schema

BEGIN;

-- Add is_published column (default to is_active value for existing rows)
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- For existing rows, set is_published to match is_active
UPDATE datasets
SET is_published = is_active
WHERE is_published IS NULL;

COMMIT;
