-- Complete Curation Workflow System - Database Migration
-- This adds the submission/review workflow to curation requests

BEGIN;

-- =====================================================
-- STEP 1: Add new statuses to curation_requests
-- =====================================================

-- Drop old constraint
ALTER TABLE curation_requests DROP CONSTRAINT IF EXISTS valid_status;

-- Add new constraint with review statuses
ALTER TABLE curation_requests 
ADD CONSTRAINT valid_status 
CHECK (status IN (
  'open',              -- Accepting proposals
  'in_progress',       -- Curator is working
  'pending_review',    -- Submitted for review
  'revision_requested',-- Owner requested changes
  'completed',         -- Approved and published
  'cancelled'          -- Closed/cancelled
));

-- =====================================================
-- STEP 2: Create curator_submissions table
-- =====================================================

CREATE TABLE IF NOT EXISTS curator_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES curation_requests(id) ON DELETE CASCADE NOT NULL,
  curator_id UUID REFERENCES pro_curators(id) NOT NULL,
  submission_number INTEGER DEFAULT 1, -- Track revisions (1, 2, 3...)
  
  -- Submission details
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL, -- Storage path
  
  -- Curator notes
  completion_notes TEXT,
  changes_made TEXT,
  
  -- Review details
  status TEXT DEFAULT 'pending_review', -- pending_review, approved, revision_requested, rejected
  reviewer_feedback TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_submission_status CHECK (status IN ('pending_review', 'approved', 'revision_requested', 'rejected')),
  CONSTRAINT positive_submission_number CHECK (submission_number > 0)
);

-- Indexes
CREATE INDEX idx_curator_submissions_request ON curator_submissions(request_id);
CREATE INDEX idx_curator_submissions_curator ON curator_submissions(curator_id);
CREATE INDEX idx_curator_submissions_status ON curator_submissions(status);

-- =====================================================
-- STEP 3: Create request_messages table (feedback/communication)
-- =====================================================

CREATE TABLE IF NOT EXISTS request_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES curation_requests(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  sender_role TEXT NOT NULL, -- 'owner' or 'curator'
  
  message_text TEXT NOT NULL,
  attachment_url TEXT, -- Optional file attachment
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_sender_role CHECK (sender_role IN ('owner', 'curator'))
);

-- Indexes
CREATE INDEX idx_request_messages_request ON request_messages(request_id);
CREATE INDEX idx_request_messages_sender ON request_messages(sender_id);
CREATE INDEX idx_request_messages_created ON request_messages(created_at DESC);

-- =====================================================
-- STEP 4: Add columns to track review process
-- =====================================================

-- Add review-related columns to curation_requests if not exists
ALTER TABLE curation_requests 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_dataset_id UUID REFERENCES datasets(id),
ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;

-- =====================================================
-- STEP 5: Enable RLS on new tables
-- =====================================================

ALTER TABLE curator_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: Create RLS Policies
-- =====================================================

-- Curator Submissions Policies
CREATE POLICY "Users can view submissions for their requests"
  ON curator_submissions FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM curation_requests WHERE creator_id = auth.uid()
    )
    OR curator_id IN (
      SELECT id FROM pro_curators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Curators can create submissions for their assigned requests"
  ON curator_submissions FOR INSERT
  WITH CHECK (
    curator_id IN (
      SELECT id FROM pro_curators WHERE user_id = auth.uid()
    )
    AND request_id IN (
      SELECT id FROM curation_requests WHERE assigned_curator_id = curator_id
    )
  );

CREATE POLICY "Request owners can update submission status"
  ON curator_submissions FOR UPDATE
  USING (
    request_id IN (
      SELECT id FROM curation_requests WHERE creator_id = auth.uid()
    )
  );

-- Request Messages Policies
CREATE POLICY "Users can view messages for their requests"
  ON request_messages FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM curation_requests 
      WHERE creator_id = auth.uid() 
        OR assigned_curator_id IN (
          SELECT id FROM pro_curators WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can send messages for their requests"
  ON request_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND request_id IN (
      SELECT id FROM curation_requests 
      WHERE creator_id = auth.uid() 
        OR assigned_curator_id IN (
          SELECT id FROM pro_curators WHERE user_id = auth.uid()
        )
    )
  );

-- =====================================================
-- STEP 7: Add comments for documentation
-- =====================================================

COMMENT ON TABLE curator_submissions IS 'Tracks curator work submissions and review process';
COMMENT ON TABLE request_messages IS 'Messages between request owner and assigned curator';
COMMENT ON COLUMN curator_submissions.submission_number IS 'Increments with each revision (1=first submission, 2=first revision, etc)';
COMMENT ON COLUMN curation_requests.revision_count IS 'Number of times revisions were requested';

COMMIT;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check new tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('curator_submissions', 'request_messages');

-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'curation_requests' 
  AND column_name IN ('submitted_at', 'reviewed_at', 'published_dataset_id', 'revision_count');

-- Check new constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'curation_requests'::regclass 
  AND conname = 'valid_status';
