-- Migration: Add comprehensive moderation system
-- Purpose: Enable multi-tier content moderation without bottlenecking user experience
-- Date: 2025

BEGIN;

-- Add moderation columns to datasets table
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- Add comment explaining moderation_status values
COMMENT ON COLUMN datasets.moderation_status IS 'Values: pending, approved, rejected, flagged';

-- Add trust level to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trust_level INTEGER DEFAULT 0;

-- Add comment explaining trust_level values
COMMENT ON COLUMN profiles.trust_level IS '0=new (needs review), 1=verified (auto-approve), 2=trusted (skip review), 3=pro curator';

-- Set existing users as verified (grandfather them in)
-- Only upgrade users who don't already have a trust_level set
UPDATE profiles 
SET trust_level = 1 
WHERE trust_level = 0 
  AND (
    created_at < NOW() - INTERVAL '7 days' 
    OR id IN (SELECT DISTINCT creator_id FROM datasets WHERE purchase_count > 0)
  );

-- Set existing datasets as approved
UPDATE datasets 
SET moderation_status = 'approved', 
    moderated_at = NOW()
WHERE is_published = true;

-- Create moderation_logs table for audit trail
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  moderator_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'approved', 'rejected', 'flagged', 'reported'
  reason TEXT,
  previous_status TEXT,
  new_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE moderation_logs IS 'Audit trail for all moderation actions';

-- Create dataset_reports table for community moderation
CREATE TABLE IF NOT EXISTS dataset_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed'
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dataset_id, reporter_id) -- One report per user per dataset
);

COMMENT ON TABLE dataset_reports IS 'User reports for inappropriate content';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_datasets_moderation_status ON datasets(moderation_status);
CREATE INDEX IF NOT EXISTS idx_datasets_report_count ON datasets(report_count);
CREATE INDEX IF NOT EXISTS idx_datasets_moderated_at ON datasets(moderated_at);
CREATE INDEX IF NOT EXISTS idx_profiles_trust_level ON profiles(trust_level);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_dataset ON moderation_logs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dataset_reports_status ON dataset_reports(status);
CREATE INDEX IF NOT EXISTS idx_dataset_reports_dataset ON dataset_reports(dataset_id);

-- Enable RLS on new tables
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for moderation_logs

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all moderation logs" ON moderation_logs;
DROP POLICY IF EXISTS "Admins can insert moderation logs" ON moderation_logs;

-- Admins and pro curators can view all moderation logs
CREATE POLICY "Admins can view all moderation logs"
  ON moderation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.trust_level >= 3
    )
  );

-- Admins and pro curators can insert moderation logs
CREATE POLICY "Admins can insert moderation logs"
  ON moderation_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.trust_level >= 3
    )
  );

-- RLS Policies for dataset_reports

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create reports" ON dataset_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON dataset_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON dataset_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON dataset_reports;

-- Anyone authenticated can create reports
CREATE POLICY "Users can create reports"
  ON dataset_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id AND auth.uid() IS NOT NULL);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON dataset_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON dataset_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.trust_level >= 3
    )
  );

-- Admins can update reports
CREATE POLICY "Admins can update reports"
  ON dataset_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.trust_level >= 3
    )
  );

-- Function to increment report count and auto-flag
CREATE OR REPLACE FUNCTION handle_dataset_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment report count
  UPDATE datasets 
  SET report_count = report_count + 1
  WHERE id = NEW.dataset_id;
  
  -- Auto-flag if 3+ reports
  UPDATE datasets
  SET moderation_status = 'flagged',
      is_published = false
  WHERE id = NEW.dataset_id 
  AND report_count >= 3
  AND moderation_status != 'flagged';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle new reports
DROP TRIGGER IF EXISTS on_dataset_report ON dataset_reports;
CREATE TRIGGER on_dataset_report
  AFTER INSERT ON dataset_reports
  FOR EACH ROW
  EXECUTE FUNCTION handle_dataset_report();

-- Function to log moderation actions
CREATE OR REPLACE FUNCTION log_moderation_action()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.moderation_status != NEW.moderation_status) THEN
    INSERT INTO moderation_logs (dataset_id, moderator_id, action, previous_status, new_status)
    VALUES (NEW.id, auth.uid(), 'status_change', OLD.moderation_status, NEW.moderation_status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log moderation status changes
DROP TRIGGER IF EXISTS on_moderation_status_change ON datasets;
CREATE TRIGGER on_moderation_status_change
  AFTER UPDATE ON datasets
  FOR EACH ROW
  WHEN (OLD.moderation_status IS DISTINCT FROM NEW.moderation_status)
  EXECUTE FUNCTION log_moderation_action();

COMMIT;
