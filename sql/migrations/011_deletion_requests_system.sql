-- Dataset Deletion Requests System
-- Allows non-admin users to request dataset deletion with admin approval

-- =====================================================
-- Deletion Requests Table
-- =====================================================

CREATE TABLE IF NOT EXISTS deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_response TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_reason CHECK (char_length(reason) >= 10 AND char_length(reason) <= 1000),
  CONSTRAINT valid_admin_response CHECK (admin_response IS NULL OR char_length(admin_response) >= 5)
);

-- Indexes for performance
CREATE INDEX idx_deletion_requests_dataset ON deletion_requests(dataset_id);
CREATE INDEX idx_deletion_requests_requester ON deletion_requests(requester_id);
CREATE INDEX idx_deletion_requests_status ON deletion_requests(status);
CREATE INDEX idx_deletion_requests_requested_at ON deletion_requests(requested_at DESC);

-- =====================================================
-- Row Level Security Policies
-- =====================================================

ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own deletion requests
CREATE POLICY "Users can view their own deletion requests"
ON deletion_requests FOR SELECT
TO authenticated
USING (
  requester_id = auth.uid()
  OR auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
);

-- Policy 2: Users can create deletion requests for their own datasets
CREATE POLICY "Users can request deletion of their own datasets"
ON deletion_requests FOR INSERT
TO authenticated
WITH CHECK (
  requester_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM datasets 
    WHERE id = dataset_id 
    AND creator_id = auth.uid()
  )
);

-- Policy 3: Only admins can update deletion requests (approve/reject)
CREATE POLICY "Admins can update deletion requests"
ON deletion_requests FOR UPDATE
TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get pending deletion requests count for admin dashboard
CREATE OR REPLACE FUNCTION get_pending_deletion_requests_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN (SELECT COUNT(*) FROM deletion_requests WHERE status = 'pending');
END;
$$;

-- =====================================================
-- Verification Query
-- =====================================================

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'deletion_requests'
ORDER BY ordinal_position;
