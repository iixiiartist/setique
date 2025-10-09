-- Migration verification and application script
-- Run this in Supabase SQL Editor to ensure all required columns exist

BEGIN;

-- Ensure profiles has all social fields (from migration 012)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
ADD COLUMN IF NOT EXISTS github_handle TEXT,
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Ensure profiles has bio field (from migration 016)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Ensure datasets has is_published field (from migration 018)
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- For existing datasets, set is_published to match is_active
UPDATE datasets
SET is_published = is_active
WHERE is_published IS NULL;

COMMIT;

-- Verify all columns exist
SELECT 'Profiles columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY column_name;

SELECT 'Datasets columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'datasets'
ORDER BY column_name;
