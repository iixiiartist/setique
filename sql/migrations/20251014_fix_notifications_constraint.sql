-- ============================================================================
-- FIX: Add comment_reply to notification activity types
-- Created: October 14, 2025
-- Purpose: Allow 'comment_reply' activity type in notifications table
-- ============================================================================

-- This fixes the constraint to include comment_reply activity type
-- which is used when someone replies to a comment

BEGIN;

-- Drop the old constraint
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS valid_activity_type;

-- Add new constraint with comment_reply included
ALTER TABLE notifications
ADD CONSTRAINT valid_activity_type CHECK (
  activity_type IN (
    'dataset_purchased',
    'dataset_favorited',
    'user_followed',
    'bounty_submission',
    'proposal_submitted',
    'comment_added',
    'comment_reply',  -- ✅ ADDED for replies
    'review_added'
  )
);

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Notification constraints updated!';
  RAISE NOTICE 'Activity types now include: comment_reply';
END $$;
