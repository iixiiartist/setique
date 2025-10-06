-- User Follow System Migration
-- Creates tables and policies for users to follow each other

BEGIN;

-- =====================================================
-- STEP 1: Create user_follows table
-- =====================================================

CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure users can't follow themselves
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  
  -- Ensure unique follow relationships (can't follow same person twice)
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Indexes for performance
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_user_follows_created ON user_follows(created_at DESC);

-- =====================================================
-- STEP 2: Add social fields to profiles table
-- =====================================================

-- Add fields for social features if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
ADD COLUMN IF NOT EXISTS github_handle TEXT,
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- =====================================================
-- STEP 3: Create functions to maintain follow counts
-- =====================================================

-- Function to update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Increment following count for follower
    UPDATE profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    -- Increment follower count for user being followed
    UPDATE profiles 
    SET follower_count = follower_count + 1 
    WHERE id = NEW.following_id;
    
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrement following count for follower
    UPDATE profiles 
    SET following_count = GREATEST(following_count - 1, 0) 
    WHERE id = OLD.follower_id;
    
    -- Decrement follower count for user being unfollowed
    UPDATE profiles 
    SET follower_count = GREATEST(follower_count - 1, 0) 
    WHERE id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update counts
DROP TRIGGER IF EXISTS trigger_update_follow_counts ON user_follows;
CREATE TRIGGER trigger_update_follow_counts
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

-- =====================================================
-- STEP 4: Enable RLS on user_follows
-- =====================================================

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Anyone can view follows (public info)
CREATE POLICY "Anyone can view follows"
  ON user_follows
  FOR SELECT
  USING (true);

-- Users can only create follows where they are the follower
CREATE POLICY "Users can follow others"
  ON user_follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can only delete their own follows
CREATE POLICY "Users can unfollow"
  ON user_follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- =====================================================
-- STEP 5: Create helper views
-- =====================================================

-- View to easily get a user's followers
CREATE OR REPLACE VIEW user_followers AS
SELECT 
  uf.following_id as user_id,
  uf.follower_id,
  p.username as follower_username,
  p.display_name as follower_display_name,
  p.avatar_url as follower_avatar,
  uf.created_at
FROM user_follows uf
JOIN profiles p ON p.id = uf.follower_id;

-- View to easily get who a user is following
CREATE OR REPLACE VIEW user_following AS
SELECT 
  uf.follower_id as user_id,
  uf.following_id,
  p.username as following_username,
  p.display_name as following_display_name,
  p.avatar_url as following_avatar,
  uf.created_at
FROM user_follows uf
JOIN profiles p ON p.id = uf.following_id;

COMMIT;

-- =====================================================
-- Verification Queries (run these to test)
-- =====================================================

-- Check if table was created
-- SELECT * FROM user_follows LIMIT 5;

-- Check if columns were added to profiles
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name IN ('display_name', 'follower_count', 'following_count');

-- Test follow counts
-- SELECT id, username, follower_count, following_count FROM profiles LIMIT 10;
