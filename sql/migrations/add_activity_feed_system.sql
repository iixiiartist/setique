-- Add Activity Feed System
-- Tracks user activities to display in social feed

BEGIN;

-- =====================================================
-- STEP 1: Create user_activities table
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  target_id UUID,
  target_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validate activity types
  CONSTRAINT valid_activity_type CHECK (
    activity_type IN (
      'dataset_published',
      'dataset_purchased',
      'user_followed',
      'bounty_created',
      'bounty_submission',
      'proposal_submitted',
      'dataset_favorited',
      'curator_certified'
    )
  ),
  
  -- Validate target types
  CONSTRAINT valid_target_type CHECK (
    target_type IS NULL OR target_type IN (
      'dataset',
      'user',
      'bounty',
      'proposal',
      'submission'
    )
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_target ON user_activities(target_type, target_id);

-- Composite index for feed queries (activities from followed users)
CREATE INDEX IF NOT EXISTS idx_user_activities_user_created ON user_activities(user_id, created_at DESC);

-- =====================================================
-- STEP 2: Create helper function to log activities
-- =====================================================

CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_target_id UUID DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO user_activities (
    user_id,
    activity_type,
    target_id,
    target_type,
    metadata
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_target_id,
    p_target_type,
    p_metadata
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 3: Create function to get activity feed
-- =====================================================

CREATE OR REPLACE FUNCTION get_activity_feed(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  activity_type TEXT,
  target_id UUID,
  target_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    a.activity_type,
    a.target_id,
    a.target_type,
    a.metadata,
    a.created_at
  FROM user_activities a
  JOIN profiles p ON p.id = a.user_id
  WHERE a.user_id IN (
    -- Get activities from users that the current user follows
    SELECT following_id 
    FROM user_follows 
    WHERE follower_id = p_user_id
  )
  OR a.user_id = p_user_id  -- Include own activities
  ORDER BY a.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 4: RLS Policies for user_activities
-- =====================================================

ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Users can view their own activities
DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
CREATE POLICY "Users can view their own activities"
ON user_activities
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can view activities from people they follow
DROP POLICY IF EXISTS "Users can view activities from followed users" ON user_activities;
CREATE POLICY "Users can view activities from followed users"
ON user_activities
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT following_id 
    FROM user_follows 
    WHERE follower_id = auth.uid()
  )
);

-- Users can create their own activities
DROP POLICY IF EXISTS "Users can create activities" ON user_activities;
CREATE POLICY "Users can create activities"
ON user_activities
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own activities
DROP POLICY IF EXISTS "Users can delete their own activities" ON user_activities;
CREATE POLICY "Users can delete their own activities"
ON user_activities
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all activities
DROP POLICY IF EXISTS "Admins can view all activities" ON user_activities;
CREATE POLICY "Admins can view all activities"
ON user_activities
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM admins
  )
);

-- =====================================================
-- STEP 5: Verification queries
-- =====================================================

-- Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_activities'
ORDER BY ordinal_position;

-- Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'user_activities';

-- Verify policies
SELECT 
  policyname,
  cmd,
  qual as "USING clause"
FROM pg_policies
WHERE tablename = 'user_activities'
ORDER BY cmd, policyname;

-- Verify constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'user_activities';

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Activity feed system created successfully!';
  RAISE NOTICE 'Tables: user_activities';
  RAISE NOTICE 'Functions: log_user_activity(), get_activity_feed()';
  RAISE NOTICE 'Activity types: dataset_published, dataset_purchased, user_followed, bounty_created, etc.';
  RAISE NOTICE 'RLS: Enabled with user and follower policies';
END $$;
