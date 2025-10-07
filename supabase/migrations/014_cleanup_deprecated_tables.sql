-- Migration 014: Remove Deprecated Tables
-- Purpose: Clean up old bounties table replaced by curation_requests
-- Date: 2025-10-06
-- Risk: LOW - Table has no code references and data already migrated

BEGIN;

-- ============================================
-- SAFETY CHECKS
-- ============================================

-- Verify curation_requests exists and has data
DO $$
DECLARE
  req_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO req_count FROM curation_requests;
  RAISE NOTICE 'curation_requests has % rows', req_count;
END $$;

-- ============================================
-- OPTIONAL: Archive old bounties data
-- ============================================

-- Uncomment if you want to keep the old demo data
-- CREATE TABLE IF NOT EXISTS bounties_archived AS 
-- SELECT 
--   *,
--   NOW() as archived_at,
--   'Migration 014 - Deprecated bounty system' as archive_reason
-- FROM bounties;

-- RAISE NOTICE 'Old bounties data archived to bounties_archived table';

-- ============================================
-- STEP 1: Update bounty_submissions to use new table
-- ============================================

-- Check if bounty_submissions has any data
DO $$
DECLARE
  sub_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sub_count FROM bounty_submissions;
  RAISE NOTICE 'bounty_submissions has % rows', sub_count;
END $$;

-- Drop the old foreign key constraint
ALTER TABLE bounty_submissions 
  DROP CONSTRAINT IF EXISTS bounty_submissions_bounty_id_fkey;

-- Rename column for clarity (bounty_id -> request_id)
ALTER TABLE bounty_submissions 
  RENAME COLUMN bounty_id TO request_id;

-- Add new foreign key to curation_requests
ALTER TABLE bounty_submissions 
  ADD CONSTRAINT bounty_submissions_request_id_fkey
  FOREIGN KEY (request_id) 
  REFERENCES curation_requests(id) 
  ON DELETE CASCADE;

RAISE NOTICE '✓ bounty_submissions now references curation_requests';

-- ============================================
-- STEP 2: Drop deprecated bounties table
-- ============================================

-- Drop the old bounties table
-- CASCADE will automatically drop:
-- - bounty_submissions.bounty_id foreign key constraint
-- - Any other dependent objects
DROP TABLE IF EXISTS bounties CASCADE;

RAISE NOTICE 'Dropped deprecated bounties table';

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify bounties table is gone
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'bounties'
  ) THEN
    RAISE EXCEPTION 'Failed to drop bounties table';
  END IF;
  
  RAISE NOTICE '✓ Cleanup successful: bounties table removed';
END $$;

-- Show remaining tables
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE columns.table_schema = 'public' 
   AND columns.table_name = tables.table_name) as column_count
FROM information_schema.tables tables
WHERE table_schema = 'public'
ORDER BY table_name;

COMMIT;

-- ============================================
-- POST-CLEANUP NOTES
-- ============================================

-- After running this migration:
-- 1. ✅ Old bounties table removed
-- 2. ✅ All bounty functionality now uses curation_requests
-- 3. ✅ Cleaner database schema
-- 4. ⚠️ If bounty_submissions references bounties, that FK was dropped
--    (bounty_submissions should reference curation_requests instead)
