-- Migration: Trust Level Auto-Progression System
-- Purpose: Automatically upgrade user trust levels based on approved dataset count
-- Date: 2025

BEGIN;

-- Drop existing objects if they exist (for idempotent migrations)
DROP TRIGGER IF EXISTS on_dataset_approved_check_trust ON datasets;
DROP FUNCTION IF EXISTS trigger_trust_level_check();
DROP FUNCTION IF EXISTS check_and_upgrade_trust_level(UUID);
DROP FUNCTION IF EXISTS admin_set_trust_level(UUID, INTEGER, UUID, TEXT);

-- Function to check and upgrade user trust level
CREATE OR REPLACE FUNCTION check_and_upgrade_trust_level(user_id UUID)
RETURNS void AS $$
DECLARE
  current_trust_level INTEGER;
  approved_count INTEGER;
BEGIN
  -- Get current trust level
  SELECT trust_level INTO current_trust_level
  FROM profiles
  WHERE id = user_id;

  -- Count approved datasets
  SELECT COUNT(*) INTO approved_count
  FROM datasets
  WHERE creator_id = user_id
  AND moderation_status = 'approved'
  AND is_published = true;

  -- Upgrade logic
  IF approved_count >= 10 AND current_trust_level < 2 THEN
    -- Upgrade to level 2 (trusted) after 10 approved datasets
    UPDATE profiles SET trust_level = 2 WHERE id = user_id;
    
    -- Log the upgrade
    INSERT INTO moderation_logs (dataset_id, moderator_id, action, reason, previous_status, new_status)
    VALUES (NULL, NULL, 'trust_level_upgrade', 'Auto-upgraded to trusted (10+ approved datasets)', 
            current_trust_level::text, '2');
            
  ELSIF approved_count >= 3 AND current_trust_level < 1 THEN
    -- Upgrade to level 1 (verified) after 3 approved datasets
    UPDATE profiles SET trust_level = 1 WHERE id = user_id;
    
    -- Log the upgrade
    INSERT INTO moderation_logs (dataset_id, moderator_id, action, reason, previous_status, new_status)
    VALUES (NULL, NULL, 'trust_level_upgrade', 'Auto-upgraded to verified (3+ approved datasets)', 
            current_trust_level::text, '1');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to check trust level after dataset moderation
CREATE OR REPLACE FUNCTION trigger_trust_level_check()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if dataset was just approved
  IF NEW.moderation_status = 'approved' AND 
     (OLD.moderation_status IS NULL OR OLD.moderation_status != 'approved') THEN
    PERFORM check_and_upgrade_trust_level(NEW.creator_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on datasets table
CREATE TRIGGER on_dataset_approved_check_trust
  AFTER INSERT OR UPDATE ON datasets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_trust_level_check();

-- Create trust_level_history table for tracking
CREATE TABLE IF NOT EXISTS trust_level_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  previous_level INTEGER NOT NULL,
  new_level INTEGER NOT NULL,
  reason TEXT,
  changed_by UUID REFERENCES profiles(id), -- NULL if automatic
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_level_history_user ON trust_level_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_level_history_created ON trust_level_history(created_at DESC);

-- Enable RLS
ALTER TABLE trust_level_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own trust level history" ON trust_level_history;
DROP POLICY IF EXISTS "Admins can view all trust level history" ON trust_level_history;

-- Users can view their own history
CREATE POLICY "Users can view own trust level history"
  ON trust_level_history FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all history
CREATE POLICY "Admins can view all trust level history"
  ON trust_level_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.trust_level >= 3
    )
  );

-- Function to manually update trust level (for admin use)
CREATE OR REPLACE FUNCTION admin_set_trust_level(
  target_user_id UUID,
  new_level INTEGER,
  admin_id UUID,
  change_reason TEXT
)
RETURNS void AS $$
DECLARE
  old_level INTEGER;
BEGIN
  -- Get current level
  SELECT trust_level INTO old_level
  FROM profiles
  WHERE id = target_user_id;

  -- Update trust level
  UPDATE profiles 
  SET trust_level = new_level 
  WHERE id = target_user_id;

  -- Log to history
  INSERT INTO trust_level_history (user_id, previous_level, new_level, reason, changed_by)
  VALUES (target_user_id, old_level, new_level, change_reason, admin_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run initial trust level check for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM profiles WHERE trust_level < 2 LOOP
    PERFORM check_and_upgrade_trust_level(user_record.id);
  END LOOP;
END $$;

COMMIT;
