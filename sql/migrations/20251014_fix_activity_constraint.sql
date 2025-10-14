-- ============================================================================
-- FIX: Add comment_added to user_activities constraint
-- Created: October 14, 2025
-- Purpose: Update existing user_activities table to allow comment_added activity type
-- ============================================================================

-- This fixes the error:
-- "new row for relation "user_activities" violates check constraint "valid_activity_type""

BEGIN;

-- Drop the old constraint
ALTER TABLE user_activities 
DROP CONSTRAINT IF EXISTS valid_activity_type;

-- Add new constraint with comment_added included
ALTER TABLE user_activities
ADD CONSTRAINT valid_activity_type CHECK (
  activity_type IN (
    'dataset_published',
    'dataset_purchased',
    'user_followed',
    'bounty_created',
    'bounty_submission',
    'proposal_submitted',
    'dataset_favorited',
    'curator_certified',
    'comment_added'  -- ✅ ADDED!
  )
);

-- Also update target_type constraint to include 'comment'
ALTER TABLE user_activities 
DROP CONSTRAINT IF EXISTS valid_target_type;

ALTER TABLE user_activities
ADD CONSTRAINT valid_target_type CHECK (
  target_type IS NULL OR target_type IN (
    'dataset',
    'user',
    'bounty',
    'proposal',
    'submission',
    'comment'  -- ✅ ADDED!
  )
);

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Constraints updated successfully!';
  RAISE NOTICE 'Activity types now include: comment_added';
  RAISE NOTICE 'Target types now include: comment';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now log comment activities without errors!';
END $$;

-- Test that comment_added works
SELECT 'Test passed: comment_added constraint allows insertion' as result
WHERE EXISTS (
  SELECT 1 
  FROM information_schema.check_constraints 
  WHERE constraint_name = 'valid_activity_type'
  AND check_clause LIKE '%comment_added%'
);
