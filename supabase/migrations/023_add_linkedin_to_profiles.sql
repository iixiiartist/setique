-- Migration: Add LinkedIn Profile Support
-- Purpose: Add linkedin_handle column to profiles for professional networking
-- Date: October 2025

BEGIN;

-- Add linkedin_handle column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS linkedin_handle TEXT;

-- Add index for linkedin_handle lookups (optional but helpful for queries)
CREATE INDEX IF NOT EXISTS idx_profiles_linkedin ON profiles(linkedin_handle) WHERE linkedin_handle IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.linkedin_handle IS 'LinkedIn username or custom URL slug (e.g., "johnsmith" from linkedin.com/in/johnsmith)';

COMMIT;
